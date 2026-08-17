from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.component_library import ComponentLibrary
import jwt
from functools import wraps

component_libraries_bp = Blueprint('component_libraries', __name__)

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

@component_libraries_bp.route('/', methods=['GET'])
@token_required
def get_component_libraries(current_user):
    # For simplicity, we'll get all component libraries (could be filtered by user if we had a user_id field)
    # In this model, ComponentLibrary does not have a user_id, so we assume they are global or we can add later.
    libraries = ComponentLibrary.query.all()
    return jsonify([{
        'id': library.id,
        'name': library.name,
        'description': library.description,
        'version': library.version,
        'manufacturer': library.manufacturer,
        'created_at': library.created_at.isoformat() if library.created_at else None,
        'updated_at': library.updated_at.isoformat() if library.updated_at else None
    } for library in libraries]), 200

@component_libraries_bp.route('/', methods=['POST'])
@token_required
def create_component_library(current_user):
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'message': 'Missing required field: name'}), 400

    library = ComponentLibrary(
        name=data['name'],
        description=data.get('description', ''),
        version=data.get('version', '1.0'),
        manufacturer=data.get('manufacturer', '')
    )

    db.session.add(library)
    db.session.commit()

    return jsonify({
        'id': library.id,
        'name': library.name,
        'description': library.description,
        'version': library.version,
        'manufacturer': library.manufacturer,
        'created_at': library.created_at.isoformat(),
        'updated_at': library.updated_at.isoformat()
    }), 201

@component_libraries_bp.route('/<int:library_id>', methods=['GET'])
@token_required
def get_component_library(current_user, library_id):
    library = ComponentLibrary.query.get(library_id)
    if not library:
        return jsonify({'message': 'Component library not found'}), 404

    return jsonify({
        'id': library.id,
        'name': library.name,
        'description': library.description,
        'version': library.version,
        'manufacturer': library.manufacturer,
        'created_at': library.created_at.isoformat() if library.created_at else None,
        'updated_at': library.updated_at.isoformat() if library.updated_at else None
    }), 200

@component_libraries_bp.route('/<int:library_id>', methods=['PUT'])
@token_required
def update_component_library(current_user, library_id):
    library = ComponentLibrary.query.get(library_id)
    if not library:
        return jsonify({'message': 'Component library not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    library.name = data.get('name', library.name)
    library.description = data.get('description', library.description)
    library.version = data.get('version', library.version)
    library.manufacturer = data.get('manufacturer', library.manufacturer)

    db.session.commit()

    return jsonify({
        'id': library.id,
        'name': library.name,
        'description': library.description,
        'version': library.version,
        'manufacturer': library.manufacturer,
        'created_at': library.created_at.isoformat() if library.created_at else None,
        'updated_at': library.updated_at.isoformat() if library.updated_at else None
    }), 200

@component_libraries_bp.route('/<int:library_id>', methods=['DELETE'])
@token_required
def delete_component_library(current_user, library_id):
    library = ComponentLibrary.query.get(library_id)
    if not library:
        return jsonify({'message': 'Component library not found'}), 404

    db.session.delete(library)
    db.session.commit()

    return jsonify({'message': 'Component library deleted successfully'}), 200

# We need to import the Blueprint and wraps and User
from flask import Blueprint
from functools import wraps
from app.models.user import User
