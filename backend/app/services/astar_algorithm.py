"""
A* Search Algorithm for PCB trace routing.
Uses heuristic (Manhattan distance) to find path more efficiently than BFS in many cases.
"""
from typing import List, Tuple, Optional, Set
import heapq
import math


class AStarAlgorithm:
    def __init__(self, width: int, height: int, obstacles: set):
        """
        Initialize A* Algorithm solver.

        Args:
            width: Width of the grid
            height: Height of the grid
            obstacles: Set of (x, y) tuples representing blocked cells
        """
        self.width = width
        self.height = height
        self.obstacles = obstacles

    def _heuristic(self, a: Tuple[int, int], b: Tuple[int, int]) -> int:
        """
        Calculate Manhattan distance heuristic.
        """
        return abs(a[0] - b[0]) + abs(a[1] - b[1])

    def find_path(self, start: Tuple[int, int], end: Tuple[int, int]) -> Optional[List[Tuple[int, int]]]:
        """
        Find the shortest path from start to end using A* algorithm.

        Args:
            start: Starting coordinate (x, y)
            end: Ending coordinate (x, y)

        Returns:
            List of coordinates representing the path, or None if no path exists
        """
        # Check if start or end is blocked
        if start in self.obstacles or end in self.obstacles:
            return None

        # Directions: up, right, down, left (4-way connectivity)
        directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]

        # Priority queue: (f_score, g_score, x, y)
        # f_score = g_score + h_score (estimated total cost)
        # g_score = cost from start to current node
        open_set = []
        heapq.heappush(open_set, (0, 0, start[0], start[0], start[1]))  # (f, g, x, y)

        # For reconstructing path
        came_from = {}

        # Cost from start to node
        g_score = {}
        g_score[start] = 0

        # Estimated total cost from start to goal through node
        f_score = {}
        f_score[start] = self._heuristic(start, end)

        # Set of visited nodes
        closed_set = set()

        while open_set:
            # Get node with lowest f_score
            _, _, current_x, current_y = heapq.heappop(open_set)
            current = (current_x, current_y)

            # Skip if already evaluated
            if current in closed_set:
                continue

            # Check if we reached the goal
            if current == end:
                # Reconstruct path
                path = []
                while current in came_from:
                    path.append(current)
                    current = came_from[current]
                path.append(start)
                path.reverse()
                return path

            # Add to closed set
            closed_set.add(current)

            # Explore neighbors
            for dx, dy in directions:
                neighbor_x, neighbor_y = current_x + dx, current_y + dy
                neighbor = (neighbor_x, neighbor_y)

                # Check bounds
                if not (0 <= neighbor_x < self.width and 0 <= neighbor_y < self.height):
                    continue

                # Check if obstacle
                if neighbor in self.obstacles:
                    continue

                # Skip if already evaluated
                if neighbor in closed_set:
                    continue

                # Calculate tentative g_score
                tentative_g_score = g_score[current] + 1  # Assuming uniform cost of 1 per move

                # If this path to neighbor is better or we haven't seen it before
                if neighbor not in g_score or tentative_g_score < g_score[neighbor]:
                    # This path is the best so far
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g_score
                    f_score[neighbor] = tentative_g_score + self._heuristic(neighbor, end)
                    heapq.heappush(open_set, (f_score[neighbor], tentative_g_score, neighbor_x, neighbor_y))

        # No path found
        return None