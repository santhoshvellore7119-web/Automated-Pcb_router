from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.routing_run import RoutingRun
from app.models.net_result import NetResult
from app.models.ripup_event import RipupEvent
from app.models.board import Board
from app.models.net import Net
from app.services.routing_service import RoutingService
import jwt
from functools import wraps
import json
import datetime

routing_execution_bp = Blueprint('routing_execution', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
        except Exception as e:
            return jsonify({'message': 'Token is invalid or expired'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# We need to import User
from app.models.user import User

@routing_execution_bp.route('/board/<int:board_id>/route', methods=['POST'])
@token_required
def execute_routing(current_user, board_id):
    """
    Execute routing for a board using specified algorithm.
    """
    # Check if the board belongs to the user
    board = Board.query.filter_by(id=board_id, user_id=current_user.id).first()
    if not board:
        return jsonify({'message': 'Board not found'}), 404

    data = request.get_json()
    if not data or not data.get('algorithm'):
        return jsonify({'message': 'Missing required field: algorithm'}), 400

    # Validate algorithm
    allowed_algorithms = ['lee', 'astar', 'ripup_reroute']
    if data['algorithm'] not in allowed_algorithms:
        return jsonify({'message': f'Algorithm must be one of {allowed_algorithms}'}), 400

    # Create a routing run record
    routing_run = RoutingRun(
        algorithm=data['algorithm'],
        parameters=json.dumps(data.get('parameters', {})),
        status='pending',
        board_id=board_id,
        user_id=current_user.id
    )

    db.session.add(routing_run)
    db.session.commit()

    try:
        # Update status to running
        routing_run.status = 'running'
        routing_run.started_at = datetime.datetime.utcnow()
        db.session.commit()

        # Initialize routing service
        routing_service = RoutingService()

        # Get board data for routing
        nets = Net.query.filter_by(board_id=board_id).all()
        components = Component.query.filter_by(board_id=board_id).all()
        obstacles_db = Obstacle.query.filter_by(board_id=board_id).all()

        # Convert to format needed by routing algorithms
        nets_info = []
        for net in nets:
            # For simplicity, we'll use dummy start/end points
            # In a real implementation, these would come from component pins
            nets_info.append({
                'id': net.id,
                'name': net.name,
                'start': (10, 10),  # Placeholder
                'end': (90, 90)     # Placeholder
            })

        # Get obstacles as set of coordinates
        obstacles = set()
        # In a real implementation, we would convert obstacle geometries to blocked grid cells
        # For now, we'll use some dummy obstacles
        obstacles.add((50, 50))  # Center obstacle

        # Get board dimensions
        width = int(board.width * 10)  # Convert mm to grid units (assuming 10 units/mm)
        height = int(board.height * 10)  # Convert mm to grid units

        # Execute routing based on algorithm
        if data['algorithm'] == 'lee':
            result = routing_service._route_with_lee(nets_info, obstacles)
        elif data['algorithm'] == 'astar':
            result = routing_service._route_with_astar(nets_info, obstacles)
        else:  # ripup_reroute
            result = routing_service.route_with_ripup_reroute(
                nets_info,
                obstacles,
                max_iterations=data.get('parameters', {}).get('max_iterations', 10),
                convergence_threshold=data.get('parameters', {}).get('convergence_threshold', 0.01),
                algorithm=data.get('parameters', {}).get('base_algorithm', 'astar')
            )

        # Update routing run with results
        routing_run.status = 'completed'
        routing_run.ended_at = datetime.datetime.utcnow()
        routing_run.results_summary = json.dumps(result['statistics'])

        # Save individual net results
        for net_id, net_result in result['nets'].items():
            net_result_obj = NetResult(
                status='routed' if net_result['routed'] else 'unrouted',
                wire_length=net_result['wire_length'],
                via_count=net_result['via_count'],
                path_data=json.dumps(net_result['path']),
                routing_run_id=routing_run.id,
                net_id=net_id
            )
            db.session.add(net_result_obj)

        db.session.commit()

        return jsonify({
            'message': 'Routing completed successfully',
            'routing_run': {
                'id': routing_run.id,
                'status': routing_run.status,
                'results_summary': json.loads(routing_run.results_summary) if routing_run.results_summary else {}
            }
        }), 200

    except Exception as e:
        # Handle errors
        routing_run.status = 'failed'
        routing_run.ended_at = datetime.datetime.utcnow()
        routing_run.results_summary = json.dumps({'error': str(e)})
        db.session.commit()

        return jsonify({
            'message': f'Routing failed: {str(e)}',
            'routing_run': {
                'id': routing_run.id,
                'status': routing_run.status,
                'error': str(e)
            }
        }), 500

# We need to import the Blueprint and wraps and User
from flask import Blueprint
from functools import wraps
from app.models.user import User