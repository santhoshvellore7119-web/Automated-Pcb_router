/**
 * Disjoint-Set Union-Find data structure with Path Compression and Union by Rank.
 * Used in Rip-Up-and-Reroute to cluster mutually conflicting nets for diagnostics.
 */
export class UnionFind {
  private parent: Map<string, string>;
  private rank: Map<string, number>;

  constructor(elements: string[]) {
    this.parent = new Map();
    this.rank = new Map();
    for (const elem of elements) {
      this.parent.set(elem, elem);
      this.rank.set(elem, 0);
    }
  }

  public find(item: string): string {
    if (!this.parent.has(item)) {
      this.parent.set(item, item);
      this.rank.set(item, 0);
      return item;
    }
    const root = this.parent.get(item)!;
    if (root !== item) {
      // Path compression
      const compressedRoot = this.find(root);
      this.parent.set(item, compressedRoot);
      return compressedRoot;
    }
    return item;
  }

  public union(x: string, y: string): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false;

    const rankX = this.rank.get(rootX) || 0;
    const rankY = this.rank.get(rootY) || 0;

    // Union by rank
    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
    return true;
  }

  public getClusters(): Array<{ clusterId: number; netIds: string[] }> {
    const clustersMap = new Map<string, string[]>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      if (!clustersMap.has(root)) {
        clustersMap.set(root, []);
      }
      clustersMap.get(root)!.push(key);
    }

    const result: Array<{ clusterId: number; netIds: string[] }> = [];
    let id = 1;
    for (const netIds of clustersMap.values()) {
      if (netIds.length > 1) {
        result.push({ clusterId: id++, netIds });
      }
    }
    return result;
  }
}
