from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.board import Board
from app.models.user import User
import jwt
from functools import wraps

boards_bp = Blueprint('boards', __name__)

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

@boards_bp.route('/', methods=['GET'])
@token_required
def get_boards(current_user):
    # Get all boards for the current user (or public if admin?)
    # For simplicity, we'll get all boards owned by the user
    boards = Board.query.filter_by(user_id=current_user.id).all()
    return jsonify([{
        'id': board.id,
        'name': board.name,
        'description': board.description,
        'width': board.width,
        'height': board.height,
        'copper_layers': board.copper_layers,
        'is_public': board.is_public,
        'created_at': board.created_at.isoformat() if board.created_at else None,
        'updated_at': board.updated_at.isoformat() if board.updated_at else None
    } for board in boards]), 200

@boards_bp.route('/', methods=['POST'])
@token_required
def create_board(current_user):
    data = request.get_json()
    if not data or not data.get('name') or not data.get('width') or not data.get('height'):
        return jsonify({'message': 'Missing required fields: name, width, height'}), 400

    board = Board(
        name=data['name'],
        description=data.get('description', ''),
        width=data['width'],
        height=data['height'],
        copper_layers=data.get('copper_layers', 2),
        is_public=data.get('is_public', False),
        user_id=current_user.id
    )

    db.session.add(board)
    db.session.commit()

    return jsonify({
        'id': board.id,
        'name': board.name,
        'description': board.description,
        'width': board.width,
        'height': board.height,
        'copper_layers': board.copper_layers,
        'is_public': board.is_public,
        'created_at': board.created_at.isoformat(),
        'updated_at': board.updated_at.isoformat()
    }), 201

@boards_bp.route('/<int:board_id>', methods=['GET'])
@token_required
def get_board(current_user, board_id):
    board = Board.query.filter_by(id=board_id, user_id=current_user.id).first()
    if not board:
        return jsonify({'message': 'Board not found'}), 404

    return jsonify({
        'id': board.id,
        'name': board.name,
        'description': board.description,
        'width': board.width,
        'height': board.height,
        'copper_layers': board.copper_layers,
        'is_public': board.is_public,
        'created_at': board.created_at.isoformat() if board.created_at else None,
        'updated_at': board.updated_at.isoformat() if board.updated_at else None
    }), 200

@boards_bp.route('/<int:board_id>', methods=['PUT'])
@token_required
def update_board(current_user, board_id):
    board = Board.query.filter_by(id=board_id, user_id=current_user.id).first()
    if not board:
        return jsonify({'message': 'Board not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    board.name = data.get('name', board.name)
    board.description = data.get('description', board.description)
    board.width = data.get('width', board.width)
    board.height = data.get('height', board.height)
    board.copper_layers = data.get('copper_layers', board.copper_layers)
    board.is_public = data.get('is_public', board.is_public)

    db.session.commit()

    return jsonify({
        'id': board.id,
        'name': board.name,
        'description': board.description,
        'width': board.width,
        'height': board.height,
        'copper_layers': board.copper_layers,
        'is_public': board.is_public,
        'created_at': board.created_at.isoformat() if board.created_at else None,
        'updated_at': board.updated_at.isoformat() if board.updated_at else None
    }), 200

@boards_bp.route('/<int:board_id>', methods=['DELETE'])
@token_required
def delete_board(current_user, board_id):
    board = Board.query.filter_by(id=board_id, user_id=current_user.id).first()
    if not board:
        return jsonify({'message': 'Board not found'}), 404

    db.session.delete(board)
    db.session.commit()

    return jsonify({'message': 'Board deleted successfully'}), 200

# We need to import the Blueprint and wraps
from flask import Blueprint
from functools import wraps