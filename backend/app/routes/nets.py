from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.net import Net
from app.models.board import Board
from app.models.obstacle import Obstacle
import jwt
from functools import wraps

nets_bp = Blueprint('nets', __name__)

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

@nets_bp.route('/board/<int:board_id>', methods=['GET'])
@token_required
def get_nets_for_board(current_user, board_id):
    # Check if the board belongs to the user
    board = Board.query.filter_by(id=board_id, user_id=current_user.id).first()
    if not board:
        return jsonify({'message': 'Board not found'}), 404

    nets = Net.query.filter_by(board_id=board_id).all()
    return jsonify([{
        'id': net.id,
        'name': net.name,
        'color': net.color,
        'width': net.width,
        'layer': net.layer,
        'pad_ids': net.pad_ids,  # This would be a list of pad IDs, but we don't have Pad model yet
        'created_at': net.created_at.isoformat() if net.created_at else None,
        'updated_at': net.updated_at.isoformat() if net.updated_at else None
    } for net in nets]), 200

@nets_bp.route('/board/<int:board_id>', methods=['POST'])
@token_required
def create_net(current_user, board_id):
    # Check if the board belongs to the user
    board = Board.query.filter_by(id=board_id, user_id=current_user.id).first()
    if not board:
        return jsonify({'message': 'Board not found'}), 404

    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'message': 'Missing required field: name'}), 400

    net = Net(
        name=data['name'],
        color=data.get('color', '#0000FF'),
        width=data.get('width', 0.25),
        layer=data.get('layer', 1),
        pad_ids=data.get('pad_ids', []),
        board_id=board_id
    )

    db.session.add(net)
    db.session.commit()

    return jsonify({
        'id': net.id,
        'name': net.name,
        'color': net.color,
        'width': net.width,
        'layer': net.layer,
        'pad_ids': net.pad_ids,
        'created_at': net.created_at.isoformat() if net.created_at else None,
        'updated_at': net.updated_at.isoformat() if net.updated_at else None
    }), 201

@nets_bp.route('/<int:net_id>', methods=['GET'])
@token_required
def get_net(current_user, net_id):
    net = Net.query.join(Board).filter(Net.id == net_id, Board.user_id == current_user.id).first()
    if not net:
        return jsonify({'message': 'Net not found'}), 404

    return jsonify({
        'id': net.id,
        'name': net.name,
        'color': net.color,
        'width': net.width,
        'layer': net.layer,
        'pad_ids': net.pad_ids,
        'created_at': net.created_at.isoformat() if net.created_at else None,
        'updated_at': net.updated_at.isoformat() if net.updated_at else None
    }), 200

@nets_bp.route('/<int:net_id>', methods=['PUT'])
@token_required
def update_net(current_user, net_id):
    net = Net.query.join(Board).filter(Net.id == net_id, Board.user_id == current_user.id).first()
    if not net:
        return jsonify({'message': 'Net not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    net.name = data.get('name', net.name)
    net.color = data.get('color', net.color)
    net.width = data.get('width', net.width)
    net.layer = data.get('layer', net.layer)
    net.pad_ids = data.get('pad_ids', net.pad_ids)

    db.session.commit()

    return jsonify({
        'id': net.id,
        'name': net.name,
        'color': net.color,
        'width': net.width,
        'layer': net.layer,
        'pad_ids': net.pad_ids,
        'created_at': net.created_at.isoformat() if net.created_at else None,
        'updated_at': net.updated_at.isoformat() if net.updated_at else None
    }), 200

@nets_bp.route('/<int:net_id>', methods=['DELETE'])
@token_required
def delete_net(current_user, net_id):
    net = Net.query.join(Board).filter(Net.id == net_id, Board.user_id == current_user.id).first()
    if not net:
        return jsonify({'message': 'Net not found'}), 404

    db.session.delete(net)
    db.session.commit()

    return jsonify({'message': 'Net deleted successfully'}), 200

# We need to import the Blueprint and wraps
from flask import Blueprint
from functools import wraps