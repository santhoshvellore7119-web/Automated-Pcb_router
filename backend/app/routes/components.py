from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.component import Component
from app.models.board import Board
from app.models.component_library import ComponentLibrary
import jwt
from functools import wraps

components_bp = Blueprint('components', __name__)

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

@components_bp.route('/board/<int:board_id>', methods=['GET'])
@token_required
def get_components_for_board(current_user, board_id):
    # Check if the board belongs to the user
    board = Board.query.filter_by(id=board_id, user_id=current_user.id).first()
    if not board:
        return jsonify({'message': 'Board not found'}), 404

    components = Component.query.filter_by(board_id=board_id).all()
    return jsonify([{
        'id': component.id,
        'name': component.name,
        'description': component.description,
        'footprint': component.footprint,
        'ref_des': component.ref_des,
        'value': component.value,
        'width': component.width,
        'height': component.height,
        'pos_x': component.pos_x,
        'pos_y': component.pos_y,
        'rotation': component.rotation,
        'layer': component.layer,
        'created_at': component.created_at.isoformat() if component.created_at else None,
        'updated_at': component.updated_at.isoformat() if component.updated_at else None
    } for component in components]), 200

@components_bp.route('/board/<int:board_id>', methods=['POST'])
@token_required
def create_component(current_user, board_id):
    # Check if the board belongs to the user
    board = Board.query.filter_by(id=board_id, user_id=current_user.id).first()
    if not board:
        return jsonify({'message': 'Board not found'}), 404

    data = request.get_json()
    if not data or not data.get('ref_des') or not data.get('pos_x') is None or not data.get('pos_y') is None:
        return jsonify({'message': 'Missing required fields: ref_des, pos_x, pos_y'}), 400

    component = Component(
        name=data.get('name', ''),
        description=data.get('description', ''),
        footprint=data.get('footprint', ''),
        ref_des=data['ref_des'],
        value=data.get('value', ''),
        width=data.get('width'),
        height=data.get('height'),
        pos_x=data['pos_x'],
        pos_y=data['pos_y'],
        rotation=data.get('rotation', 0.0),
        layer=data.get('layer', 1),
        board_id=board_id,
        library_id=data.get('library_id')
    )

    db.session.add(component)
    db.session.commit()

    return jsonify({
        'id': component.id,
        'name': component.name,
        'description': component.description,
        'footprint': component.footprint,
        'ref_des': component.ref_des,
        'value': component.value,
        'width': component.width,
        'height': component.height,
        'pos_x': component.pos_x,
        'pos_y': component.pos_y,
        'rotation': component.rotation,
        'layer': component.layer,
        'created_at': component.created_at.isoformat(),
        'updated_at': component.updated_at.isoformat()
    }), 201

@components_bp.route('/<int:component_id>', methods=['GET'])
@token_required
def get_component(current_user, component_id):
    component = Component.query.join(Board).filter(Component.id == component_id, Board.user_id == current_user.id).first()
    if not component:
        return jsonify({'message': 'Component not found'}), 404

    return jsonify({
        'id': component.id,
        'name': component.name,
        'description': component.description,
        'footprint': component.footprint,
        'ref_des': component.ref_des,
        'value': component.value,
        'width': component.width,
        'height': component.height,
        'pos_x': component.pos_x,
        'pos_y': component.pos_y,
        'rotation': component.rotation,
        'layer': component.layer,
        'created_at': component.created_at.isoformat() if component.created_at else None,
        'updated_at': component.updated_at.isoformat() if component.updated_at else None
    }), 200

@components_bp.route('/<int:component_id>', methods=['PUT'])
@token_required
def update_component(current_user, component_id):
    component = Component.query.join(Board).filter(Component.id == component_id, Board.user_id == current_user.id).first()
    if not component:
        return jsonify({'message': 'Component not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    component.name = data.get('name', component.name)
    component.description = data.get('description', component.description)
    component.footprint = data.get('footprint', component.footprint)
    component.ref_des = data.get('ref_des', component.ref_des)
    component.value = data.get('value', component.value)
    component.width = data.get('width', component.width)
    component.height = data.get('height', component.height)
    component.pos_x = data.get('pos_x', component.pos_x)
    component.pos_y = data.get('pos_y', component.pos_y)
    component.rotation = data.get('rotation', component.rotation)
    component.layer = data.get('layer', component.layer)
    component.library_id = data.get('library_id', component.library_id)

    db.session.commit()

    return jsonify({
        'id': component.id,
        'name': component.name,
        'description': component.description,
        'footprint': component.footprint,
        'ref_des': component.ref_des,
        'value': component.value,
        'width': component.width,
        'height': component.height,
        'pos_x': component.pos_x,
        'pos_y': component.pos_y,
        'rotation': component.rotation,
        'layer': component.layer,
        'created_at': component.created_at.isoformat() if component.created_at else None,
        'updated_at': component.updated_at.isoformat() if component.updated_at else None
    }), 200

@components_bp.route('/<int:component_id>', methods=['DELETE'])
@token_required
def delete_component(current_user, component_id):
    component = Component.query.join(Board).filter(Component.id == component_id, Board.user_id == current_user.id).first()
    if not component:
        return jsonify({'message': 'Component not found'}), 404

    db.session.delete(component)
    db.session.commit()

    return jsonify({'message': 'Component deleted successfully'}), 200

# We need to import the Blueprint and wraps
from flask import Blueprint
from functools import wraps