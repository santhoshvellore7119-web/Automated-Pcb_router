from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.design_rule import DesignRule
from app.models.board import Board
import jwt
from functools import wraps

design_rules_bp = Blueprint('design_rules', __name__)

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

@design_rules_bp.route('/board/<int:board_id>', methods=['GET'])
@token_required
def get_design_rules_for_board(current_user, board_id):
    # Check if the board belongs to the user
    board = Board.query.filter_by(id=board_id, user_id=current_user.id).first()
    if not board:
        return jsonify({'message': 'Board not found'}), 404

    design_rules = DesignRule.query.filter_by(board_id=board_id).all()
    return jsonify([{
        'id': rule.id,
        'name': rule.name,
        'rule_type': rule.rule_type,
        'value': rule.value,
        'created_at': rule.created_at.isoformat() if rule.created_at else None,
        'updated_at': rule.updated_at.isoformat() if rule.updated_at else None
    } for rule in design_rules]), 200

@design_rules_bp.route('/board/<int:board_id>', methods=['POST'])
@token_required
def create_design_rule(current_user, board_id):
    # Check if the board belongs to the user
    board = Board.query.filter_by(id=board_id, user_id=current_user.id).first()
    if not board:
        return jsonify({'message': 'Board not found'}), 404

    data = request.get_json()
    if not data or not data.get('name') or not data.get('rule_type') or data.get('value') is None:
        return jsonify({'message': 'Missing required fields: name, rule_type, value'}), 400

    design_rule = DesignRule(
        name=data['name'],
        rule_type=data['rule_type'],
        value=data['value'],
        board_id=board_id
    )

    db.session.add(design_rule)
    db.session.commit()

    return jsonify({
        'id': design_rule.id,
        'name': design_rule.name,
        'rule_type': design_rule.rule_type,
        'value': design_rule.value,
        'created_at': design_rule.created_at.isoformat(),
        'updated_at': design_rule.updated_at.isoformat()
    }), 201

@design_rules_bp.route('/<int:rule_id>', methods=['GET'])
@token_required
def get_design_rule(current_user, rule_id):
    design_rule = DesignRule.query.join(Board).filter(DesignRule.id == rule_id, Board.user_id == current_user.id).first()
    if not design_rule:
        return jsonify({'message': 'Design rule not found'}), 404

    return jsonify({
        'id': design_rule.id,
        'name': design_rule.name,
        'rule_type': design_rule.rule_type,
        'value': design_rule.value,
        'created_at': design_rule.created_at.isoformat() if design_rule.created_at else None,
        'updated_at': design_rule.updated_at.isoformat() if design_rule.updated_at else None
    }), 200

@design_rules_bp.route('/<int:rule_id>', methods=['PUT'])
@token_required
def update_design_rule(current_user, rule_id):
    design_rule = DesignRule.query.join(Board).filter(DesignRule.id == rule_id, Board.user_id == current_user.id).first()
    if not design_rule:
        return jsonify({'message': 'Design rule not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    design_rule.name = data.get('name', design_rule.name)
    design_rule.rule_type = data.get('rule_type', design_rule.rule_type)
    design_rule.value = data.get('value', design_rule.value)

    db.session.commit()

    return jsonify({
        'id': design_rule.id,
        'name': design_rule.name,
        'rule_type': design_rule.rule_type,
        'value': design_rule.value,
        'created_at': design_rule.created_at.isoformat() if design_rule.created_at else None,
        'updated_at': design_rule.updated_at.isoformat() if design_rule.updated_at else None
    }), 200

@design_rules_bp.route('/<int:rule_id>', methods=['DELETE'])
@token_required
def delete_design_rule(current_user, rule_id):
    design_rule = DesignRule.query.join(Board).filter(DesignRule.id == rule_id, Board.user_id == current_user.id).first()
    if not design_rule:
        return jsonify({'message': 'Design rule not found'}), 404

    db.session.delete(design_rule)
    db.session.commit()

    return jsonify({'message': 'Design rule deleted successfully'}), 200

# We need to import the Blueprint and wraps and User
from flask import Blueprint
from functools import wraps
from app.models.user import User