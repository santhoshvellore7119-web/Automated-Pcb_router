"""
Routing Service that coordinates different routing algorithms and interacts with the database.
"""
from typing import List, Dict, Any, Optional, Tuple, Set
from app.models.board import Board
from app.models.net import Net
from app.models.obstacle import Obstacle
from app.models.component import Component
from app.services.lee_algorithm import LeeAlgorithm
from .astar_algorithm import AStarAlgorithm
from .ripup_reroute import RipupRerouteRouter
import json


class RoutingService:
    def __init__(self):
        self.lee_router = None
        self.astar_router = None
        self.ripup_router = None

    def _get_board_dimensions(self, board: Board) -> tuple:
        """Get grid dimensions based on board size and grid resolution."""
        # For simplicity, we'll use a fixed grid resolution
        # In a real PCB router, this would be based on the grid settings
        GRID_RESOLUTION = 0.1  # mm per grid cell
        width = int(board.width / GRID_RESOLUTION)
        height = int(board.height / GRID_RESOLUTION)
        return width, height

    def _get_obstacles(self, board_id: int) -> Set[Tuple[int, int]]:
        """
        Get all obstacles on the board as a set of grid coordinates.
        """
        obstacles = set()
        # Get explicit obstacles from database
        db_obstacles = Obstacle.query.filter_by(board_id=board_id).all()

        # Get component pads as obstacles
        components = Component.query.filter_by(board_id=board_id).all()

        # For simplicity, we'll treat component locations as obstacles
        # In a real implementation, we'd have padstacks and clearance rules
        GRID_RESOLUTION = 0.1  # mm per grid cell

        for obstacle in db_obstacles:
            if obstacle.geometry:
                try:
                    geom = json.loads(obstacle.geometry)
                    # Convert geometry to grid points based on obstacle type
                    if obstacle.obstacle_type == 'point' or obstacle.obstacle_type == 'via':
                        if isinstance(geom, list) and len(geom) == 2:
                            x, y = geom
                            gx, gy = int(x / GRID_RESOLUTION), int(y / GRID_RESOLUTION)
                            if 0 <= gx < self.width and 0 <= gy < self.height:
                                obstacles.add((gx, gy))
                    elif obstacle.obstacle_type == 'rectangle':
                        if isinstance(geom, dict) and 'x1' in geom and 'y1' in geom and 'x2' in geom and 'y2' in geom:
                            x1, y1 = geom['x1'], geom['y1']
                            x2, y2 = geom['x2'], geom['y2']
                            # Fill rectangle
                            for x in range(int(min(x1, x2) / GRID_RESOLUTION), int(max(x1, x2) / GRID_RESOLUTION) + 1):
                                for y in range(int(min(y1, y2) / GRID_RESOLUTION), int(max(y1, y2) / GRID_RESOLUTION) + 1):
                                    if 0 <= x < self.width and 0 <= y < self.height:
                                        obstacles.add((x, y))
                except (json.JSONDecodeError, KeyError, TypeError):
                    # If we can't parse geometry, skip this obstacle
                    pass

        # Add component locations as obstacles
        for component in components:
            gx, gy = int(component.pos_x / GRID_RESOLUTION), int(component.pos_y / GRID_RESOLUTION)
            # Add a small area around component as obstacle
            for dx in range(-2, 3):  # 5x5 area around component
                for dy in range(-2, 3):
                    x, y = gx + dx, gy + dy
                    if 0 <= x < self.width and 0 <= y < self.height:
                        obstacles.add((x, y))

        return obstacles

    def _get_nets_info(self, board_id: int) -> List[Dict]:
        """
        Get net information for routing.
        In a full implementation, this would include actual pin connections.
        For now, we'll create simple two-pin nets for demonstration.
        """
        nets = Net.query.filter_by(board_id=board_id).all()
        nets_info = []

        # For demonstration, we'll create artificial source-target pairs
        # In a real PCB router, nets would have multiple pins that need to be connected
        # We'll simplify by connecting consecutive pins or creating artificial pairs

        # Get components to create some realistic net connections
        components = Component.query.filter_by(board_id=board_id).all()

        # If we don't have enough nets defined, create some based on components
        if len(nets) < 2 and len(components) >= 2:
            # Create some sample nets between components
            for i in range(0, min(len(components) - 1, 5)):  # Create up to 5 sample nets
                comp1 = components[i]
                comp2 = components[i + 1]
                net_id = f"NET_{i+1}"

                # Check if we already have a net with this name or ID
                existing_net = next((n for n in nets if n.name == net_id or n.id == i+1), None)
                if existing_net:
                    net_id = existing_net.id
                    # Use actual net if it exists - but we'd need to get its pins
                    # For simplicity, we'll skip and use component-based approach

                nets_info.append({
                    'id': net_id if isinstance(net_id, int) else hash(net_id) % 10000,  # Ensure integer ID
                    'name': net_id if isinstance(net_id, str) else f"NET_{net_id}",
                    'start': (int(comp1.pos_x / 0.1), int(comp1.pos_y / 0.1)),
                    'end': (int(comp2.pos_x / 0.1), int(comp2.pos_y / 0.1))
                })
        else:
            # Use existing nets - but we need to convert them to source-target pairs
            # This is a simplification; real nets have multiple pins
            for i, net in enumerate(nets[:10]):  # Limit to 10 nets for demo
                # For demo, we'll create artificial connections
                # In reality, we'd need to get the actual pin positions for each net
                nets_info.append({
                    'id': net.id,
                    'name': net.name,
                    # Placeholder positions - in reality these would come from pin locations
                    'start': (50 + i * 10, 50),
                    'end': (150 + i * 10, 150)
                })

        return nets_info

    def route_board(self, board_id: int, algorithm: str = "ripup_reroute",
                   max_iterations: int = 10) -> Dict[str, Any]:
        """
        Route all nets on a board using the specified algorithm.

        Args:
            board_id: ID of the board to route
            algorithm: Routing algorithm to use ("lee", "astar", or "ripup_reroute")
            max_iterations: Maximum iterations for rip-up and reroute

        Returns:
            Dictionary containing routing results and statistics
        """
        # Get board information
        board = Board.query.get(board_id)
        if not board:
            return {
                'error': 'Board not found',
                'success': False
            }

        # Get board dimensions and convert to grid
        width, height = self._get_board_dimensions(board)

        # Get obstacles
        obstacles = self._get_obstacles(board_id)

        # Get nets information
        nets_info = self._get_nets_info(board_id)

        if not nets_info:
            return {
                'error': 'No nets found to route',
                'success': False
            }

        # Initialize routers
        self.lee_router = LeeAlgorithm(width, height, obstacles)
        self.astar_router = AStarAlgorithm(width, height, obstacles)
        self.ripup_router = RipupRerouteRouter(width, height)

        # Route based on selected algorithm
        if algorithm == "lee":
            # Lee's algorithm routes nets one by one (doesn't handle conflicts well)
            results = self._route_with_lee(nets_info, obstacles)
        elif algorithm == "astar":
            # A* routes nets one by one
            results = self._route_with_astar(nets_info, obstacles)
        elif algorithm == "ripup_reroute":
            # Rip-up and reroute handles multiple nets and conflict resolution
            results = self.ripup_router.route_with_ripup_reroute(
                nets_info, obstacles, max_iterations=max_iterations
            )
        else:
            return {
                'error': f'Unknown algorithm: {algorithm}',
                'success': False
            }

        # Add board information to results
        results['board_id'] = board_id
        results['board_name'] = board.name
        results['algorithm_used'] = algorithm
        results['grid_dimensions'] = {'width': width, 'height': height}

        return results

    def _route_with_lee(self, nets_info: List[Dict], obstacles: Set[Tuple[int, int]]) -> Dict:
        """Route nets using Lee's algorithm (one at a time)."""
        self.lee_router.obstacles = obstacles

        net_results = {}
        routed_count = 0

        for net_info in nets_info:
            path = self.lee_router.find_path(
                tuple(net_info['start']),
                tuple(net_info['end'])
            )

            net_id = net_info['id']
            net_results[net_id] = {
                'path': [list(point) for point in path] if path else [],
                'routed': path is not None,
                'wire_length': len(path) - 1 if path else 0,
                'via_count': 0
            }

            if path is not None:
                routed_count += 1

        # Calculate overall statistics
        total_nets = len(nets_info)
        # For Lee's algorithm, we don't easily detect conflicts between nets
        # since we route them sequentially without considering future nets
        # In a real implementation, we'd need to track used positions

        return {
            'nets': net_results,
            'statistics': {
                'total_nets': total_nets,
                'routed_nets': routed_count,
                'unrouted_nets': total_nets - routed_count,
                'overflow': 0,  # Not calculated in simple sequential routing
                'success_rate': routed_count / total_nets if total_nets > 0 else 0
            }
        }

    def _route_with_astar(self, nets_info: List[Dict], obstacles: Set[Tuple[int, int]]) -> Dict:
        """Route nets using A* algorithm (one at a time)."""
        self.astar_router.obstacles = obstacles

        net_results = {}
        routed_count = 0

        for net_info in nets_info:
            path = self.astar_router.find_path(
                tuple(net_info['start']),
                tuple(net_info['end'])
            )

            net_id = net_info['id']
            net_results[net_id] = {
                'path': [list(point) for point in path] if path else [],
                'routed': path is not None,
                'wire_length': len(path) - 1 if path else 0,
                'via_count': 0
            }

            if path is not None:
                routed_count += 1

        # Calculate overall statistics
        total_nets = len(nets_info)

        return {
            'nets': net_results,
            'statistics': {
                'total_nets': total_nets,
                'routed_nets': routed_count,
                'unrouted_nets': total_nets - routed_count,
                'overflow': 0,  # Not calculated in simple sequential routing
                'success_rate': routed_count / total_nets if total_nets > 0 else 0
            }
        }

    def get_routing_algorithms(self) -> List[str]:
        """Get list of available routing algorithms."""
        return ["lee", "astar", "ripup_reroute"]