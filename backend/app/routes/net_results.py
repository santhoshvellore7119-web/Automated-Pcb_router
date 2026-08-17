from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.net_result import NetResult
from app.models.routing_run import RoutingRun
from app.models.net import Net
import jwt
from functools import wraps
import json

net_results_bp = Blueprint('net_results', __name__)

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

@net_results_bp.route('/routing_run/<int:run_id>', methods=['GET'])
@token_required
def get_net_results_for_run(current_user, run_id):
    # Check if the routing run belongs to the user via the board
    net_results = NetResult.query.join(RoutingRun).join(Board).filter(
        NetResult.routing_run_id == run_id,
        Board.user_id == current_user.id
    ).all()
    if not net_results:
        # Check if the run exists and belongs to the user
        run = RoutingRun.query.join(Board).filter(
            RoutingRun.id == run_id,
            Board.user_id == current_user.id
        ).first()
        if not run:
            return jsonify({'message': 'Routing run not found'}), 404
        # If run exists but no results, return empty list
        return jsonify([]), 200

    return jsonify([{
        'id': result.id,
        'status': result.status,
        'wire_length': result.wire_length,
        'via_count': result.via_count,
        'path_data': json.loads(result.path_data) if result.path_data else [],
        'created_at': result.created_at.isoformat() if result.created_at else None,
        'updated_at': result.updated_at.isoformat() if result.updated_at else None
    } for result in net_results]), 200

@net_results_bp.route('/', methods=['POST'])
@token_required
def create_net_result(current_user):
    data = request.get_json()
    if not data or not data.get('routing_run_id') or not data.get('net_id'):
        return jsonify({'message': 'Missing required fields: routing_run_id, net_id'}), 400

    # Verify that the routing run belongs to the user
    run = RoutingRun.query.join(Board).filter(
        RoutingRun.id == data['routing_run_id'],
        Board.user_id == current_user.id
    ).first()
    if not run:
        return jsonify({'message': 'Routing run not found or access denied'}), 404

    # Verify that the net belongs to the same board as the routing run
    net = Net.query.join(Board).filter(
        Net.id == data['net_id'],
        Board.id == run.board_id
    ).first()
    if not net:
        return jsonify({'message': 'Net not found or does not belong to the same board'}), 404

    net_result = NetResult(
        status=data.get('status', 'unrouted'),
        wire_length=data.get('wire_length', 0.0),
        via_count=data.get('via_count', 0),
        path_data=json.dumps(data.get('path_data', [])),
        routing_run_id=data['routing_run_id'],
        net_id=data['net_id']
    )

    db.session.add(net_result)
    db.session.commit()

    return jsonify({
        'id': net_result.id,
        'status': net_result.status,
        'wire_length': net_result.wire_length,
        'via_count': net_result.via_count,
        'path_data': json.loads(net_result.path_data) if net_result.path_data else [],
        'created_at': net_result.created_at.isoformat() if net_result.created_at else None,
        'updated_at': net_result.updated_at.isoformat() if net_result.updated_at else None
    }), 201

@net_results_bp.route('/<int:result_id>', methods=['GET'])
@token_required
def get_net_result(current_user, result_id):
    net_result = NetResult.query.join(RoutingRun).join(Board).filter(
        NetResult.id == result_id,
        Board.user_id == current_user.id
    ).first()
    if not net_result:
        return jsonify({'message': 'Net result not found'}), 404

    return jsonify({
        'id': net_result.id,
        'status': net_result.status,
        'wire_length': net_result.wire_length,
        'via_count': net_result.via_count,
        'path_data': json.loads(net_result.path_data) if net_result.path_data else [],
        'created_at': net_result.created_at.isoformat() if net_result.created_at else None,
        'updated_at': net_result.updated_at.isoformat() if net_result.updated_at else None
    }), 200

@net_results_bp.route('/<int:result_id>', methods=['PUT'])
@token_required
def update_net_result(current_user, result_id):
    net_result = NetResult.query.join(RoutingRun).join(Board).filter(
        NetResult.id == result_id,
        Board.user_id == current_user.id
    ).first()
    if not net_result:
        return jsonify({'message': 'Net result not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    net_result.status = data.get('status', net_result.status)
    net_result.wire_length = data.get('wire_length', net_result.wire_length)
    net_result.via_count = data.get('via_count', net_result.via_count)
    net_result.path_data = json.dumps(data.get('path_data', json.loads(net_result.path_data) if net_result.path_data else []))

    db.session.commit()

    return jsonify({
        'id': net_result.id,
        'status': net_result.status,
        'wire_length': net_result.wire_length,
        'via_count': net_result.via_count,
        'path_data': json.loads(net_result.path_data) if net_result.path_data else [],
        'created_at': net_result.created_at.isoformat() if net_result.created_at else None,
        'updated_at': net_result.updated_at.isoformat() if net_result.updated_at else None
    }), 200

@net_results_bp.route('/<int:result_id>', methods=['DELETE'])
@token_required
def delete_net_result(current_user, result_id):
    net_result = NetResult.query.join(RoutingRun).join(Board).filter(
        NetResult.id == result_id,
        Board.user_id == current_user.id
    ).first()
    if not net_result:
        return jsonify({'message': 'Net result not found'}), 404

    db.session.delete(net_result)
    db.session.commit()

    return jsonify({'message': 'Net result deleted successfully'}), 200

# We need to import the Blueprint and wraps and User
from flask import Blueprint
from functools import wraps
from app.models.user import User
import json