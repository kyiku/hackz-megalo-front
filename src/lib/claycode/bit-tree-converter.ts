import { BitString } from './bit-string'
import { Tree } from './tree'
import { TreeNode } from './tree-node'

const MAX_NUMBER = 2n ** 2000n

export class BitTreeConverter {
  static treeToBits(tree: TreeNode): BitString {
    if (!tree) return new BitString('')

    const number = this.treeToNumber(tree)
    return this.numberToBitString(number)
  }

  static treeToNumber(tree: TreeNode): bigint {
    if (!tree.children || tree.children.length === 0) {
      return 1n
    }

    const childNumbers = tree.children.map((child) => this.treeToNumber(child))

    if (childNumbers.some((num) => num === 0n)) {
      return 0n
    }

    return this.squareDecompositionToNumber(childNumbers)
  }

  static squareDecompositionToNumber(decomposition: bigint[]): bigint {
    let sum = 0n
    for (const num of decomposition) {
      sum += num * num

      if (sum + 1n > MAX_NUMBER) {
        return 0n
      }
    }
    return sum + 1n
  }

  static numberToBitString(number: bigint): BitString {
    const binaryStr = number.toString(2)
    return new BitString(binaryStr.substring(1))
  }

  static bitsToTree(bitsArray: BitString | string | number[]): Tree {
    const root = new TreeNode()
    const n = this.bitArrayToInt(bitsArray)
    this.numberToTree(n, root)
    return new Tree(root)
  }

  static bitArrayToInt(bits: BitString | string | number[]): bigint {
    let numericBits: number[]

    if (bits instanceof BitString) {
      numericBits = bits.toString().split('').map((b) => parseInt(b))
    } else if (typeof bits === 'string') {
      numericBits = bits.split('').map((b) => parseInt(b))
    } else {
      numericBits = Array.from(bits)
    }

    const newBits = [1, ...numericBits]
    return Array.from(newBits)
      .reverse()
      .reduce((acc, c, i) => acc + BigInt(c) * 2n ** BigInt(i), 0n)
  }

  static intToBitArray(x: bigint): number[] {
    if (typeof x !== 'bigint') {
      throw new Error('Input must be a BigInt')
    }
    if (x <= 0n) {
      throw new Error('Input must be greater than 0')
    }
    return x
      .toString(2)
      .slice(1)
      .split('')
      .map((d) => parseInt(d))
  }

  static largestSquareBinsearch(x: bigint): bigint {
    if (typeof x !== 'bigint') {
      throw new Error('Input must be a BigInt')
    }
    if (x === 1n) {
      return 1n
    }

    let l = 0n
    let r = x

    for (;;) {
      const mid = l + (r - l) / 2n
      const midSq = mid * mid

      if (midSq <= x && (mid + 1n) ** 2n > x) {
        return mid
      } else if (midSq <= x) {
        l = mid
      } else {
        r = mid
      }
    }
  }

  static numberToSquareDecomposition(x: bigint): bigint[] {
    if (typeof x !== 'bigint') {
      throw new Error('Input must be a BigInt')
    }
    const decomposition: bigint[] = []
    let remainder = x - 1n

    while (remainder > 0n) {
      const lsq = this.largestSquareBinsearch(remainder)
      decomposition.push(lsq)
      remainder -= lsq ** 2n
    }

    return decomposition
  }

  static squareDecompositionToTree(
    decomposition: bigint[],
    root: TreeNode,
  ): void {
    root.children = decomposition.map(() => new TreeNode())
    for (let i = 0; i < decomposition.length; i++) {
      this.numberToTree(decomposition[i], root.children[i])
    }
  }

  static numberToTree(n: bigint, node: TreeNode): void {
    if (n === 1n) return
    const decomposition = this.numberToSquareDecomposition(n)
    this.squareDecompositionToTree(decomposition, node)
  }
}
