import { BitString } from './bit-string'
import { BitsValidator } from './bits-validator'

export class TextBitsConverter {
  static textEncoder = new TextEncoder()
  static textDecoder = new TextDecoder('utf-8')

  static bitsToText(bits: BitString | number[] | string | null): string {
    if (!bits) return ''

    let bitString: string

    if (Array.isArray(bits)) {
      bitString = bits.join('')
    } else if (bits instanceof BitString) {
      bitString = bits.toString()
    } else if (typeof bits === 'string') {
      bitString = bits
    } else {
      return '[Claycode] Invalid bit format'
    }

    try {
      const chunks = bitString.match(/.{1,8}/g) ?? []
      const bytes: number[] = []

      for (const chunk of chunks) {
        if (chunk.length === 8) {
          bytes.push(parseInt(chunk, 2))
        }
      }

      const uint8Array = new Uint8Array(bytes)
      return this.textDecoder.decode(uint8Array)
    } catch {
      return `[Claycode] ${bitString.length} bits`
    }
  }

  static textToBits(text: string): BitString | number[] {
    const encodedData = this.textEncoder.encode(text)
    const bitArray = this.uint8ArrayToBitArray(encodedData)
    return BitsValidator.addCRC(bitArray)
  }

  static uint8ArrayToBitArray(uint8Array: Uint8Array): number[] {
    const bitArray: number[] = []
    for (let i = 0; i < uint8Array.length; i++) {
      const byte = uint8Array[i]
      for (let j = 7; j >= 0; j--) {
        bitArray.push((byte >> j) & 1)
      }
    }
    return bitArray
  }

  static bitArrayToByteArray(bitArray: number[]): number[] {
    const byteArray: number[] = []
    for (let i = 0; i < bitArray.length; i += 8) {
      if (i + 8 <= bitArray.length) {
        let byte = 0
        for (let j = 0; j < 8; j++) {
          byte = (byte << 1) | bitArray[i + j]
        }
        byteArray.push(byte)
      }
    }
    return byteArray
  }
}
