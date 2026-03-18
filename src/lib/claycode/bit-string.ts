export class BitString {
  readonly bits: string

  constructor(bitString: string) {
    this.bits = bitString
  }

  get length(): number {
    return this.bits.length
  }

  toString(): string {
    return this.bits
  }

  slice(start: number, end?: number): BitString {
    return new BitString(this.bits.slice(start, end))
  }

  equals(other: unknown): boolean {
    return other instanceof BitString && this.bits === other.bits
  }
}
