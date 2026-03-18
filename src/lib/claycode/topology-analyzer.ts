import { TreeNode } from './tree-node'

export class TopologyAnalyzer {
  static buildTreeFromParentsArray(
    parents: number[],
    rootIndex: number,
  ): TreeNode | null {
    if (!parents || parents.length === 0) return null

    const nodes = new Map<number, TreeNode>()

    for (let i = 0; i < parents.length; i++) {
      const node = new TreeNode(null, [])
      node.id = i
      nodes.set(i, node)
    }

    for (let i = 0; i < parents.length; i++) {
      const parentIndex = parents[i]
      if (parentIndex >= 0 && parentIndex !== i && nodes.has(parentIndex)) {
        const parent = nodes.get(parentIndex)!
        const child = nodes.get(i)!
        parent.addChild(child)
        child.father = parent
      }
    }

    return nodes.get(rootIndex) ?? null
  }

  static findPotentialClaycodeRoots(tree: TreeNode | null): TreeNode[] {
    if (!tree) return []

    const potentialRoots: TreeNode[] = []
    this.traverseTree(tree, (node) => {
      if (this.isPotentialClaycode(node)) {
        potentialRoots.push(node)
      }
    })

    return potentialRoots
  }

  static isPotentialClaycode(node: TreeNode | null): boolean {
    if (!node) return false
    const totalNodes = this.countNodes(node)
    return totalNodes >= 3 && totalNodes <= 1000
  }

  static countNodes(node: TreeNode | null): number {
    if (!node) return 0
    let count = 1
    for (const child of node.children) {
      count += this.countNodes(child)
    }
    return count
  }

  static traverseTree(
    node: TreeNode | null,
    callback: (node: TreeNode) => void,
  ): void {
    if (!node) return
    callback(node)
    for (const child of node.children) {
      this.traverseTree(child, callback)
    }
  }
}
