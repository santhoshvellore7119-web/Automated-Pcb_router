from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.routing_run import RoutingRun
from app.models.board import Board
import jwt
from functools import wraps
import json
import datetime

routing_runs_bp = Blueprint('routing_runs', __name__)

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

@routing_runs_bp.route('/board/<int:board_id>', methods=['GET'])
@token_required
def get_routing_runs_for_board(current_user, board_id):
    # Check if the board belongs to the user
    board = Board.query.filter_by(id=board_id, user_id=current_user.id).first()
    if not board:
        return jsonify({'message': 'Board not found'}), 404

    routing_runs = RoutingRun.query.filter_by(board_id=board_id).order_by(RoutingRun.created_at.desc()).all()
    return jsonify([{
        'id': run.id,
        'algorithm': run.algorithm,
        'parameters': json.loads(run.parameters) if run.parameters else {},
        'status': run.status,
        'results_summary': json.loads(run.results_summary) if run.results_summary else {},
        'started_at': run.started_at.isoformat() if run.started_at else None,
        'ended_at': run.ended_at.isoformat() if run.ended_at else None,
        'created_at': run.created_at.isoformat() if run.created_at else None,
        'updated_at': run.updated_at.isoformat() if run.updated_at else None
    } for run in routing_runs]), 200

@routing_runs_bp.route('/board/<int:board_id>', methods=['POST'])
@token_required
def create_routing_run(current_user, board_id):
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

    routing_run = RoutingRun(
        algorithm=data['algorithm'],
        parameters=json.dumps(data.get('parameters', {})),
        status='pending',
        board_id=board_id,
        user_id=current_user.id
    )

    db.session.add(routing_run)
    db.session.commit()

    return jsonify({
        'id': routing_run.id,
        'algorithm': routing_run.algorithm,
        'parameters': json.loads(routing_run.parameters) if routing_run.parameters else {},
        'status': routing_run.status,
        'results_summary': json.loads(routing_run.results_summary) if routing_run.results_summary else {},
        'started_at': routing_run.started_at.isoformat() if routing_run.started_at else None,
        'ended_at': routing_run.ended_at.isoformat() if routing_run.ended_at else None,
        'created_at': routing_run.created_at.isoformat() if routing_run.created_at else None,
        'updated_at': routing_run.updated_at.isoformat() if routing_run.updated_at else None
    }), 201

@routing_runs_bp.route('/<int:run_id>', methods=['GET'])
@token_required
def get_routing_run(current_user, run_id):
    routing_run = RoutingRun.query.join(Board).filter(RoutingRun.id == run_id, Board.user_id == current_user.id).first()
    if not routing_run:
        return jsonify({'message': 'Routing run not found'}), 404

    return jsonify({
        'id': routing_run.id,
        'algorithm': routing_run.algorithm,
        'parameters': json.loads(routing_run.parameters) if routing_run.parameters else {},
        'status': routing_run.status,
        'results_summary': json.loads(routing_run.results_summary) if routing_run.results_summary else {},
        'started_at': routing_run.started_at.isoformat() if routing_run.started_at else None,
        'ended_at': routing_run.ended_at.isoformat() if routing_run.ended_at else None,
        'created_at': routing_run.created_at.isoformat() if routing_run.created_at else None,
        'updated_at': routing_run.updated_at.isoformat() if routing_run.updated_at else None
    }), 200

@routing_runs_bp.route('/<int:run_id>', methods=['PUT'])
@token_required
def update_routing_run(current_user, run_id):
    routing_run = RoutingRun.query.join(Board).filter(RoutingRun.id == run_id, Board.user_id == current_user.id).first()
    if not routing_run:
        return jsonify({'message': 'Routing run not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    routing_run.algorithm = data.get('algorithm', routing_run.algorithm)
    routing_run.parameters = json.dumps(data.get('parameters', json.loads(routing_run.parameters) if routing_run.parameters else {}))
    routing_run.status = data.get('status', routing_run.status)
    routing_run.results_summary = json.dumps(data.get('results_summary', json.loads(routing_run.results_summary) if routing_run.results_summary else {}))
    if data.get('ended_at') is not None:
        routing_run.ended_at = datetime.datetime.fromisoformat(data['ended_at'])

    db.session.commit()

    return jsonify({
        'id': routing_run.id,
        'algorithm': routing_run.algorithm,
        'parameters': json.loads(routing_run.parameters) if routing_run.parameters else {},
        'status': routing_run.status,
        'results_summary': json.loads(routing_run.results_summary) if routing_run.results_summary else {},
        'started_at': routing_run.started_at.isoformat() if routing_run.started_at else None,
        'ended_at': routing_run.ended_at.isoformat() if routing_run.ended_at else None,
        'created_at': routing_run.created_at.isoformat() if routing_run.created_at else None,
        'updated_at': routing_run.updated_at.isoformat() if routing_run.updated_at else None
    }), 200

@routing_runs_bp.route('/<int:run_id>', methods=['DELETE'])
@token_required
def delete_routing_run(current_user, run_id):
    routing_run = RoutingRun.query.join(Board).filter(RoutingRun.id == run_id, Board.user_id == current_user.id).first()
    if not routing_run:
        return jsonify({'message': 'Routing run not found'}), 404

    db.session.delete(routing_run)
    db.session.commit()

    return jsonify({'message': 'Routing run deleted successfully'}), 200

# We need to import the Blueprint and wraps and User
from flask import Blueprint
from functools import wraps
from app.models.user import User
import json
import datetime