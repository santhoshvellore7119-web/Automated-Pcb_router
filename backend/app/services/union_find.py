"""
Union-Find (Disjoint Set Union) data structure with path compression and union by rank.
Used for detecting and managing conflicts in PCB routing.
"""
class UnionFind:
    def __init__(self, size(self, size: int)"""
        self.parent = list(range(size))
        self.rank = [0] * size

    def find(self, x):
        """Find the root of element x with path compression."""
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        """Union the sets containing x and y using union by rank."""
        root_x = self.find(x)
        root_y = self.find(y)

        if root_x == root_y:
            return False  # Already in the same set

        # Union by rank
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
        else:
            self.parent[root_y] = root_x
            self.rank[root_x] += 1
        return True

    def connected(self, x, y):
        """Check if x and y are in the same set."""
        return self.find(x) == self.find(y)