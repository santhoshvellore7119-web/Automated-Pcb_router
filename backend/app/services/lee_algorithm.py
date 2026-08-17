"""
Lee's Algorithm (Breadth-First Search) for PCB trace routing.
Guarantees to find the shortest path if one exists.
"""
from typing import List, Tuple, Optional, Deque
from collections import deque
import heapq


class LeeAlgorithm:
    def __init__(self, width: int, height: int, obstacles: set):
        """
        Initialize Lee's Algorithm solver.

        Args:
            width: Width of the grid
            height: Height of the grid
            obstacles: Set of (x, y) tuples representing blocked cells
        """
        self.width = width
        self.height = height
        self.obstacles = obstacles

    def find_path(self, start: Tuple[int, int], end: Tuple[int, int]) -> Optional[List[Tuple[int, int]]]:
        """
        Find the shortest path from start to end using BFS (Lee's Algorithm).

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

        # Queue for BFS: stores (x, y, path_so_far)
        # To save memory, we'll store parent pointers instead of full paths
        queue: Deque[Tuple[int, int]] = deque()
        queue.append(start)

        # Keep track of visited cells and their parents
        visited = [[False for _ in range(self.height)] for _ in range(self.width)]
        parent = [[None for _ in range(self.height)] for _ in range(self.width)]

        # Mark start as visited
        visited[start[0]][start[1]] = True

        # BFS loop
        while queue:
            x, y = queue.popleft()

            # Check if we reached the destination
            if (x, y) == end:
                # Reconstruct path
                path = []
                curr_x, curr_y = x, y
                while (curr_x, curr_y) != start:
                    path.append((curr_x, curr_y))
                    parent_cell = parent[curr_x][curr_y]
                    if parent_cell is None:  # Should not happen
                        break
                    curr_x, curr_y = parent_cell
                path.append(start)
                path.reverse()
                return path

            # Explore neighbors
            for dx, dy in directions:
                nx, ny = x + dx, y + dy

                # Check bounds
                if 0 <= nx < self.width and 0 <= ny < self.height:
                    # Check if not visited and not an obstacle
                    if not visited[nx][ny] and (nx, ny) not in self.obstacles:
                        visited[nx][ny] = True
                        parent[nx][ny] = (x, y)
                        queue.append((nx, ny))

        # No path found
        return None