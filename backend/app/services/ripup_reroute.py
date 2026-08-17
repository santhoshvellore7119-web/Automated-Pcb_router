"""
Rip-Up and Reroute Algorithm for multi-net PCB routing.
Iteratively routes nets and resolves conflicts by ripping up conflicting paths and rerouting.
"""
from typing import List, Tuple, Dict, Set, Optional
import heapq
import math
from .lee_algorithm import LeeAlgorithm
from .astar_algorithm import AStarAlgorithm


class RipupRerouteRouter:
    def __init__(self, width: int, height: int):
        """
        Initialize Rip-Up and Reroute router.

        Args:
            width: Width of the grid
            height: Height of the grid
        """
        self.width = width
        self.height = height
        self.lee_router = LeeAlgorithm(width, height, set())  # Will update obstacles per net
        self.astar_router = AStarAlgorithm(width, height, set())  # Will update obstacles per net

    def _manhattan_distance(self, p1: Tuple[int, int], p2: Tuple[int, int]) -> int:
        """Calculate Manhattan distance between two points."""
        return abs(p1[0] - p2[0]) + abs(p1[1] - p2[1])

    def _detect_conflicts(self, paths: Dict[int, List[Tuple[int, int]]]) -> Dict[Tuple[int, int], List[int]]:
        """
        Detect conflicts between net paths.
        Returns a dictionary mapping conflicting positions to list of net IDs that use that position.
        """
        position_to_nets = {}
        conflicts = {}

        for net_id, path in paths.items():
            for pos in path:
                if pos not in position_to_nets:
                    position_to_nets[pos] = []
                position_to_nets[pos].append(net_id)

        # Find positions used by more than one net
        for pos, nets in position_to_nets.items():
            if len(nets) > 1:
                conflicts[pos] = nets

        return conflicts

    def _calculate_overflow(self, paths: Dict[int, List[Tuple[int, int]]]) -> int:
        """
        Calculate total overlap (number of times cells are used by more than one net).
        """
        conflicts = self._detect_conflicts(paths)
        overflow = 0
        for pos, nets in conflicts.items():
            overflow += len(nets) - 1  # Each additional net beyond the first contributes to overflow
        return overflow

    def route_net(self, net_id: int, start: Tuple[int, int], end: Tuple[int, int],
                  obstacles: Set[Tuple[int, int]],
                  used_positions: Set[Tuple[int, int]],
                  algorithm: str = "astar") -> Optional[List[Tuple[int, int]]]:
        """
        Route a single net avoiding obstacles and already used positions.

        Args:
            net_id: Identifier for the net
            start: Start coordinate
            end: End coordinate
            obstacles: Set of obstacle positions to avoid
            used_positions: Set of positions already used by other routed nets
            algorithm: Algorithm to use ("lee" or "astar")

        Returns:
            Path as list of coordinates, or None if no path found
        """
        # Combine obstacles and used positions
        all_blocked = obstacles.union(used_positions)

        # Temporarily update the router's obstacles
        if algorithm == "lee":
            self.lee_router.obstacles = all_blocked
            path = self.lee_router.find_path(start, end)
        else:  # astar
            self.astar_router.obstacles = all_blocked
            path = self.astar_router.find_path(start, end)

        return path

    def route_all_nets(self, nets: List[Dict], obstacles: Set[Tuple[int, int]],
                       max_iterations: int = 10, convergence_threshold: float = 0.01,
                       algorithm: str = "astar") -> Dict[int, List[Tuple[int, int]]]:
        """
        Route all nets using rip-up and reroute iterative approach.

        Args:
            nets: List of net dictionaries with 'id', 'start', 'end' keys
            obstacles: Set of obstacle positions to avoid
            max_iterations: Maximum number of iterations
            convergence_threshold: Threshold for improvement to continue iterating
            algorithm: Base algorithm to use for routing ("lee" or "astar")

        Returns:
            Dictionary mapping net IDs to their paths
        """
        # Initialize
        paths = {}  # net_id -> path
        routed_nets = set()
        unrouted_nets = {net['id']: net for net in nets}

        # Track best solution found
        best_paths = {}
        best_overflow = float('inf')
        best_iteration = 0

        # Main iteration loop
        for iteration in range(max_iterations):
            print(f"Iteration {iteration + 1}/{max_iterations}")

            # Try to route all unrouted nets
            newly_routed = {}
            used_positions = set()

            # First, collect positions from already routed nets
            for net_id, path in paths.items():
                if path:  # Only add if successfully routed
                    for pos in path:
                        used_positions.add(pos)

            # Try to route each unrouted net
            for net_id, net_info in list(unrouted_nets.items()):
                start = net_info['start']
                end = net_info['end']

                # Route the net
                path = self.route_net(net_id, start, end, obstacles, used_positions, algorithm)

                if path is not None:
                    newly_routed[net_id] = path
                    # Add this path's positions to used_positions for subsequent nets in this iteration
                    for pos in path:
                        used_positions.add(pos)

            # Update paths with newly routed nets
            paths.update(newly_routed)
            routed_nets.update(newly_routed.keys())
            # Remove routed nets from unrouted
            for net_id in newly_routed.keys():
                if net_id in unrouted_nets:
                    del unrouted_nets[net_id]

            # Calculate current overflow
            current_overflow = self._calculate_overflow(paths)
            print(f"  Routed {len(paths)} nets, Overflow: {current_overflow}")

            # Check if this is the best solution so far
            if current_overflow < best_overflow:
                best_overflow = current_overflow
                best_paths = paths.copy()
                best_iteration = iteration
                print(f"  New best solution: overflow = {best_overflow}")

            # Check for convergence (no improvement)
            if iteration > 0 and best_overflow == 0:
                print(f"  Perfect routing achieved (zero overflow)!")
                break

            # If we've routed all nets, check if solution is conflict-free
            if len(unrouted_nets) == 0 and current_overflow == 0:
                print(f"  All nets routed successfully with no conflicts!")
                break

            # Prepare for next iteration: rip up all nets and reroute
            # In a more sophisticated implementation, we might only rip up conflicting nets
            # For simplicity, we'll rip up all and reroute in next iteration
            if iteration < max_iterations - 1:  # Don't reset on last iteration
                paths = {}  # Clear paths for next iteration

        # Return best solution found
        if best_overflow == 0:
            print(f"Successfully routed all nets with no conflicts after {best_iteration + 1} iterations.")
        else:
            print(f"Best solution had {best_overflow} conflicts after {best_iteration + 1} iterations.")
            # If we have some nets routed, return those; otherwise return what we have
            if not best_paths:
                best_paths = paths

        return best_paths

    def route_with_ripup_reroute(self, nets: List[Dict], obstacles: Set[Tuple[int, int]],
                                 max_iterations: int = 10, convergence_threshold: float = 0.01,
                                 algorithm: str = "astar") -> Dict:
        """
        Public method to route nets using rip-up and reroute strategy.

        Returns:
            Dictionary with routing results including paths, statistics, etc.
        """
        # Route all nets
        paths = self.route_all_nets(nets, obstacles, max_iterations, convergence_threshold, algorithm)

        # Calculate statistics
        routed_count = sum(1 for path in paths.values() if path is not None)
        total_nets = len(nets)
        overflow = self._calculate_overflow(paths) if paths else 0

        # Prepare detailed results
        net_results = {}
        for net in nets:
            net_id = net['id']
            path = paths.get(net_id)
            net_results[net_id] = {
                'path': path if path else [],
                'routed': path is not None,
                'wire_length': len(path) - 1 if path else 0,  # Number of segments
                'via_count': 0  # Simplified - would need layer changes to calculate properly
            }

        return {
            'nets': net_results,
            'statistics': {
                'total_nets': total_nets,
                'routed_nets': routed_count,
                'unrouted_nets': total_nets - routed_count,
                'overflow': overflow,
                'success_rate': routed_count / total_nets if total_nets > 0 else 0
            }
        }