from flask import Blueprint
from app.routes import auth, boards, components, nets, obstacles, design_rules, component_libraries, routing_runs, net_results, ripup_events

api_bp = Blueprint('api', __name__)

# Register route blueprints with correct exported variable names
api_bp.register_blueprint(auth.auth_bp, url_prefix='/auth')
if hasattr(boards, 'boards_bp'): api_bp.register_blueprint(boards.boards_bp, url_prefix='/boards')
if hasattr(components, 'components_bp'): api_bp.register_blueprint(components.components_bp, url_prefix='/components')
if hasattr(nets, 'nets_bp'): api_bp.register_blueprint(nets.nets_bp, url_prefix='/nets')
if hasattr(obstacles, 'obstacles_bp'): api_bp.register_blueprint(obstacles.obstacles_bp, url_prefix='/obstacles')
if hasattr(design_rules, 'design_rules_bp'): api_bp.register_blueprint(design_rules.design_rules_bp, url_prefix='/design-rules')
if hasattr(component_libraries, 'component_libraries_bp'): api_bp.register_blueprint(component_libraries.component_libraries_bp, url_prefix='/component-libraries')
if hasattr(routing_runs, 'routing_runs_bp'): api_bp.register_blueprint(routing_runs.routing_runs_bp, url_prefix='/routing-runs')
if hasattr(net_results, 'net_results_bp'): api_bp.register_blueprint(net_results.net_results_bp, url_prefix='/net-results')
if hasattr(ripup_events, 'ripup_events_bp'): api_bp.register_blueprint(ripup_events.ripup_events_bp, url_prefix='/ripup-events')
