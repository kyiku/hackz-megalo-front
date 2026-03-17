import { create } from 'zustand'

const MUNBYN_VENDOR_ID = 0x1fc9
const MUNBYN_PRODUCT_ID = 0x2016
const PRINTER_WIDTH = 576 // 80mm printer, 576 dots

type PrinterState = {
  readonly device: USBDevice | null
  readonly isConnected: boolean
  readonly isPrinting: boolean
}

type PrinterActions = {
  readonly connect: () => Promise<boolean>
  readonly disconnect: () => Promise<void>
  readonly printImage: (imageUrl: string) => Promise<void>
}

function escposInit(): Uint8Array {
  return new Uint8Array([0x1b, 0x40]) // ESC @
}

function escposCut(): Uint8Array {
  return new Uint8Array([0x1d, 0x56, 0x41, 0x03]) // GS V A 3
}

function escposFeedLines(n: number): Uint8Array {
  return new Uint8Array([0x1b, 0x64, n]) // ESC d n
}

function escposBitmapLine(lineData: Uint8Array, width: number): Uint8Array {
  const bytesPerLine = Math.ceil(width / 8)
  const header = new Uint8Array([
    0x1b, 0x2a, 33, // ESC * 33 (24-dot double-density)
    bytesPerLine & 0xff,
    (bytesPerLine >> 8) & 0xff,
  ])
  const lineFeed = new Uint8Array([0x0a])
  const result = new Uint8Array(header.length + lineData.length + lineFeed.length)
  result.set(header, 0)
  result.set(lineData, header.length)
  result.set(lineFeed, header.length + lineData.length)
  return result
}

async function imageUrlToMonoBitmap(imageUrl: string): Promise<{ data: Uint8Array; width: number; height: number }> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })

  const canvas = document.createElement('canvas')
  const scale = PRINTER_WIDTH / img.naturalWidth
  canvas.width = PRINTER_WIDTH
  canvas.height = Math.round(img.naturalHeight * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // Floyd-Steinberg dithering to 1-bit
  const pixels = new Float32Array(imageData.data.length / 4)
  for (let i = 0; i < pixels.length; i++) {
    const r = imageData.data[i * 4] ?? 0
    const g = imageData.data[i * 4 + 1] ?? 0
    const b = imageData.data[i * 4 + 2] ?? 0
    pixels[i] = 0.299 * r + 0.587 * g + 0.114 * b
  }

  const w = canvas.width
  const h = canvas.height
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      const old = pixels[idx] ?? 0
      const newVal = old < 128 ? 0 : 255
      pixels[idx] = newVal
      const err = old - newVal
      if (x + 1 < w) pixels[idx + 1] = (pixels[idx + 1] ?? 0) + err * 7 / 16
      if (y + 1 < h && x > 0) pixels[(y + 1) * w + x - 1] = (pixels[(y + 1) * w + x - 1] ?? 0) + err * 3 / 16
      if (y + 1 < h) pixels[(y + 1) * w + x] = (pixels[(y + 1) * w + x] ?? 0) + err * 5 / 16
      if (y + 1 < h && x + 1 < w) pixels[(y + 1) * w + x + 1] = (pixels[(y + 1) * w + x + 1] ?? 0) + err * 1 / 16
    }
  }

  const bytesPerLine = Math.ceil(w / 8)
  const data = new Uint8Array(bytesPerLine * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if ((pixels[y * w + x] ?? 0) < 128) {
        const byteIdx = y * bytesPerLine + Math.floor(x / 8)
        data[byteIdx] = (data[byteIdx] ?? 0) | (0x80 >> (x % 8))
      }
    }
  }

  return { data, width: w, height: h }
}

export const usePrinterStore = create<PrinterState & PrinterActions>()((set, get) => ({
  device: null,
  isConnected: false,
  isPrinting: false,

  connect: async () => {
    try {
      const device = await navigator.usb.requestDevice({
        filters: [{ vendorId: MUNBYN_VENDOR_ID, productId: MUNBYN_PRODUCT_ID }],
      })

      await device.open()
      if (device.configuration === null) {
        await device.selectConfiguration(1)
      }
      await device.claimInterface(0)

      set({ device, isConnected: true })
      return true
    } catch {
      return false
    }
  },

  disconnect: async () => {
    const { device } = get()
    if (device) {
      try {
        await device.close()
      } catch { /* ignore */ }
    }
    set({ device: null, isConnected: false })
  },

  printImage: async (imageUrl: string) => {
    const { device } = get()
    if (!device || !get().isConnected) return

    set({ isPrinting: true })

    try {
      const { data, width, height } = await imageUrlToMonoBitmap(imageUrl)
      const bytesPerLine = Math.ceil(width / 8)

      // Initialize
      await device.transferOut(1, escposInit() as BufferSource)

      // Print bitmap line by line
      for (let y = 0; y < height; y++) {
        const lineData = data.slice(y * bytesPerLine, (y + 1) * bytesPerLine)
        await device.transferOut(1, escposBitmapLine(lineData, width) as BufferSource)
      }

      // Feed and cut
      await device.transferOut(1, escposFeedLines(4) as BufferSource)
      await device.transferOut(1, escposCut() as BufferSource)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Print failed:', err)
      }
    } finally {
      set({ isPrinting: false })
    }
  },
}))
