import { TreeNode } from './tree-node'

export class Tree {
  root: TreeNode
  maxDepth: number = 0

  constructor(root: TreeNode) {
    this.root = root
    this.initializeNodes(this.root, 'X', 0)
    this.computeFootprints(1)
    this.computeDepth(0)
  }

  toString(): string {
    return this.root.toString()
  }

  static fromString(str: string): Tree | null {
    const root = TreeNode.fromString(str)
    if (root) return new Tree(root)
    return null
  }

  initializeNodes(node: TreeNode, prefix: string, depth: number): void {
    node.label = prefix
    node.numDescendants = 1

    for (const [i, c] of node.children.entries()) {
      c.father = node
      this.initializeNodes(c, prefix + i.toString(), depth + 1)
      node.numDescendants += c.numDescendants
    }

    node.tree = this
    this.maxDepth = Math.max(this.maxDepth, depth)
  }

  computeFootprints(nodePadding: number): void {
    computeFootprintsHelper(this.root, nodePadding)
  }

  computeDepth(nodeDepth: number): void {
    computeDepthHelper(this.root, nodeDepth)
  }

  getTotalFootprint(): number {
    let totalFp = 0
    for (const node of treeIterator(this)) {
      totalFp += node.footprint ?? 0
    }
    return totalFp
  }
}

function computeFootprintsHelper(node: TreeNode, _nodePadding: number): void {
  let childrenFootprint = 0
  for (const c of node.children) {
    computeFootprintsHelper(c, _nodePadding)
    childrenFootprint += c.footprint ?? 0
  }
  node.footprint = childrenFootprint + 1
}

function computeDepthHelper(node: TreeNode, nodeDepth: number): void {
  node.depth = nodeDepth
  for (const c of node.children) {
    computeDepthHelper(c, nodeDepth + 1)
  }
}

export function* treeIterator(tree: Tree): Generator<TreeNode> {
  const frontier: TreeNode[] = [tree.root]

  while (frontier.length > 0) {
    const node = frontier.shift()!
    frontier.push(...node.children)
    yield node
  }
}
