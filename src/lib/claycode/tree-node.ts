export class TreeNode {
  id: number | null = null
  father: TreeNode | null
  children: TreeNode[]
  label: string | null = null
  polygon: unknown = null
  tree: unknown = null
  numDescendants: number = 0
  footprint: number | null = null
  depth: number | null = null

  constructor(father: TreeNode | null = null, children: TreeNode[] = []) {
    this.father = father
    this.children = children

    for (const c of children) {
      c.father = this
    }
  }

  treeEq(otherNode: TreeNode): boolean {
    const frontier: [TreeNode, TreeNode][] = [[this, otherNode]]

    while (frontier.length > 0) {
      const pair = frontier.shift()!

      if (pair[0].children.length !== pair[1].children.length) return false

      for (let i = 0; i < pair[0].children.length; i++) {
        frontier.push([pair[0].children[i], pair[1].children[i]])
      }
    }

    return true
  }

  isLeaf(): boolean {
    return this.children.length === 0
  }

  isRoot(): boolean {
    return this.father === null
  }

  setPolygon(polygon: unknown): void {
    this.polygon = polygon
  }

  getPolygon(): unknown {
    return this.polygon
  }

  addChild(child: TreeNode): void {
    if (child && !this.children.includes(child)) {
      this.children.push(child)
    }
  }

  toString(): string {
    let result = ''

    function serialize(node: TreeNode | null): void {
      if (!node) return
      result += '('
      for (const child of node.children) {
        serialize(child)
      }
      result += ')'
    }

    serialize(this)
    return result
  }

  static fromString(str: string): TreeNode | null {
    if (!str || str[0] !== '(' || str[str.length - 1] !== ')') return null

    const stack: TreeNode[] = []
    let root: TreeNode | null = null
    let currentNode: TreeNode | null = null

    for (const char of str) {
      if (char === '(') {
        const newNode = new TreeNode()
        if (currentNode) {
          currentNode.children.push(newNode)
          newNode.father = currentNode
        } else {
          root = newNode
        }
        stack.push(newNode)
        currentNode = newNode
      } else if (char === ')') {
        if (!stack.length) {
          return null
        }
        stack.pop()
        currentNode = stack.length ? stack[stack.length - 1] : null
      } else {
        return null
      }
    }

    return root
  }
}
