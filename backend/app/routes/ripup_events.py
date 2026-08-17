from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.ripup_event import RipupEvent
from app.models.routing_run import RoutingRun
from app.models.net import Net
import jwt
from functools import wraps
import json

ripup_events_bp = Blueprint('ripup_events', __name__)

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

@ripup_events_bp.route('/routing_run/<int:run_id>', methods=['GET'])
@token_required
def get_ripup_events_for_run(current_user, run_id):
    # Check if the routing run belongs to the user via the board
    ripup_events = RipupEvent.query.join(RoutingRun).join(Board).filter(
        RipupEvent.routing_run_id == run_id,
        Board.user_id == current_user.id
    ).all()
    if not ripup_events:
        # Check if the run exists and belongs to the user
        run = RoutingRun.query.join(Board).filter(
            RoutingRun.id == run_id,
            Board.user_id == current_user.id
        ).first()
        if not run:
            return jsonify({'message': 'Routing run not found'}), 404
        # If run exists but no events, return empty list
        return jsonify([]), 200

    return jsonify([{
        'id': event.id,
        'net_id': event.net_id,
        'iteration': event.iteration,
        'reason': event.reason,
        'previous_path': json.loads(event.previous_path) if event.previous_path else [],
        'new_path': json.loads(event.new_path) if event.new_path else [],
        'created_at': event.created_at.isoformat() if event.created_at else None,
        'updated_at': event.updated_at.isoformat() if event.updated_at else None
    } for event in ripup_events]), 200

@ripup_events_bp.route('/', methods=['POST'])
@token_required
def create_ripup_event(current_user):
    data = request.get_json()
    if not data or not data.get('routing_run_id') or not data.get('net_id') or data.get('iteration') is None:
        return jsonify({'message': 'Missing required fields: routing_run_id, net_id, iteration'}), 400

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

    ripup_event = RipupEvent(
        net_id=data['net_id'],
        iteration=data['iteration'],
        reason=data.get('reason', ''),
        previous_path=json.dumps(data.get('previous_path', [])),
        new_path=json.dumps(data.get('new_path', [])),
        routing_run_id=data['routing_run_id']
    )

    db.session.add(ripup_event)
    db.session.commit()

    return jsonify({
        'id': ripup_event.id,
        'net_id': ripup_event.net_id,
        'iteration': ripup_event.iteration,
        'reason': ripup_event.reason,
        'previous_path': json.loads(ripup_event.previous_path) if ripup_event.previous_path else [],
        'new_path': json.loads(ripup_event.new_path) if ripup_event.new_path else [],
        'created_at': ripup_event.created_at.isoformat() if ripup_event.created_at else None,
        'updated_at': ripup_event.updated_at.isoformat() if ripup_event.updated_at else None
    }), 201

@ripup_events_bp.route('/<int:event_id>', methods=['GET'])
@token_required
def get_ripup_event(current_user, event_id):
    ripup_event = RipupEvent.query.join(RoutingRun).join(Board).filter(
        RipupEvent.id == event_id,
        Board.user_id == current_user.id
    ).first()
    if not ripup_event:
        return jsonify({'message': 'Ripup event not found'}), 404

    return jsonify({
        'id': ripup_event.id,
        'net_id': ripup_event.net_id,
        'iteration': ripup_event.iteration,
        'reason': ripup_event.reason,
        'previous_path': json.loads(ripup_event.previous_path) if ripup_event.previous_path else [],
        'new_path': json.loads(ripup_event.new_path) if ripup_event.new_path else [],
        'created_at': ripup_event.created_at.isoformat() if ripup_event.created_at else None,
        'updated_at': ripup_event.updated_at.isoformat() if ripup_event.updated_at else None
    }), 200

@ripup_events_bp.route('/<int:event_id>', methods=['PUT'])
@token_required
def update_ripup_event(current_user, event_id):
    ripup_event = RipupEvent.query.join(RoutingRun).join(Board).filter(
        RipupEvent.id == event_id,
        Board.user_id == current_user.id
    ).first()
    if not ripup_event:
        return jsonify({'message': 'Ripup event not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    ripup_event.net_id = data.get('net_id', ripup_event.net_id)
    ripup_event.iteration = data.get('iteration', ripup_event.iteration)
    ripup_event.reason = data.get('reason', ripup_event.reason)
    ripup_event.previous_path = json.dumps(data.get('previous_path', json.loads(ripup_event.previous_path) if ripup_event.previous_path else []))
    ripup_event.new_path = json.dumps(data.get('new_path', json.loads(ripup_event.new_path) if ripup_event.new_path else []))

    db.session.commit()

    return jsonify({
        'id': ripup_event.id,
        'net_id': ripup_event.net_id,
        'iteration': ripup_event.iteration,
        'reason': ripup_event.reason,
        'previous_path': json.loads(ripup_event.previous_path) if ripup_event.previous_path else [],
        'new_path': json.loads(ripup_event.new_path) if ripup_event.new_path else [],
        'created_at': ripup_event.created_at.isoformat() if ripup_event.created_at else None,
        'updated_at': ripup_event.updated_at.isoformat() if ripup_event.updated_at else None
    }), 200

@ripup_events_bp.route('/<int:event_id>', methods=['DELETE'])
@token_required
def delete_ripup_event(current_user, event_id):
    ripup_event = RipupEvent.query.join(RoutingRun).join(Board).filter(
        RipupEvent.id == event_id,
        Board.user_id == current_user.id
    ).first()
    if not ripup_event:
        return jsonify({'message': 'Ripup event not found'}), 404

    db.session.delete(ripup_event)
    db.session.commit()

    return jsonify({'message': 'Ripup event deleted successfully'}), 200

# We need to import the Blueprint and wraps and User
from flask import Blueprint
from functools import wraps
from app.models.user import User
import json