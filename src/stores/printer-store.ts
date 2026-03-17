import { create } from 'zustand'

const MUNBYN_VENDOR_ID = 0x1fc9
const PRINTER_WIDTH = 576

type PrinterState = {
  readonly device: USBDevice | null
  readonly isConnected: boolean
  readonly isPrinting: boolean
  readonly lastError: string | null
  readonly endpointNumber: number
}

type PrinterActions = {
  readonly connect: () => Promise<boolean>
  readonly disconnect: () => Promise<void>
  readonly printImage: (imageUrl: string) => Promise<void>
}

function escposInit(): Uint8Array {
  return new Uint8Array([0x1b, 0x40])
}

function escposCut(): Uint8Array {
  return new Uint8Array([0x1d, 0x56, 0x41, 0x03])
}

function escposFeedLines(n: number): Uint8Array {
  return new Uint8Array([0x1b, 0x64, n])
}

// ESC/POS raster bit image (GS v 0) - more widely supported than ESC *
function escposRasterImage(data: Uint8Array, width: number, height: number): Uint8Array {
  const bytesPerLine = Math.ceil(width / 8)
  const header = new Uint8Array([
    0x1d, 0x76, 0x30, 0x00, // GS v 0 (normal mode)
    bytesPerLine & 0xff,
    (bytesPerLine >> 8) & 0xff,
    height & 0xff,
    (height >> 8) & 0xff,
  ])
  const result = new Uint8Array(header.length + data.length)
  result.set(header, 0)
  result.set(data, header.length)
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
  canvas.width = PRINTER_WIDTH

  // 元画像が正方形(1:1)の場合、3:4比率に変換（上下に余白追加）
  const imgRatio = img.naturalHeight / img.naturalWidth
  const isSquare = Math.abs(imgRatio - 1) < 0.05
  const targetRatio = isSquare ? 4 / 3 : imgRatio
  canvas.height = Math.round(PRINTER_WIDTH * targetRatio)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  // 白背景で塗りつぶし
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 画像を中央に配置（比率維持）
  const drawWidth = canvas.width
  const drawHeight = Math.round(canvas.width * imgRatio)
  const offsetY = Math.round((canvas.height - drawHeight) / 2)
  ctx.drawImage(img, 0, offsetY, drawWidth, drawHeight)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // サーマルプリンター用の明るさ・コントラスト補正
  const BRIGHTNESS = 40   // 明るさ加算 (0-255)
  const CONTRAST = 1.3    // コントラスト倍率 (1.0 = 変化なし)

  const pixels = new Float32Array(imageData.data.length / 4)
  for (let i = 0; i < pixels.length; i++) {
    const r = imageData.data[i * 4] ?? 0
    const g = imageData.data[i * 4 + 1] ?? 0
    const b = imageData.data[i * 4 + 2] ?? 0
    let gray = 0.299 * r + 0.587 * g + 0.114 * b

    // 明るさ補正
    gray = gray + BRIGHTNESS

    // コントラスト補正（128を中心に拡張）
    gray = (gray - 128) * CONTRAST + 128

    pixels[i] = Math.max(0, Math.min(255, gray))
  }

  const w = canvas.width
  const h = canvas.height

  // Floyd-Steinberg dithering
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
  lastError: null,
  endpointNumber: 1,

  connect: async () => {
    try {
      const device = await navigator.usb.requestDevice({
        filters: [{ vendorId: MUNBYN_VENDOR_ID }],
      })

      await device.open()
      if (device.configuration === null) {
        await device.selectConfiguration(1)
      }
      await device.claimInterface(0)

      // Find OUT endpoint dynamically
      let epNum = 1
      const iface = device.configuration?.interfaces[0]
      const alt = iface?.alternate
      if (alt) {
        const outEp = alt.endpoints.find((ep) => ep.direction === 'out')
        if (outEp) epNum = outEp.endpointNumber
      }

      set({ device, isConnected: true, lastError: null, endpointNumber: epNum })
      return true
    } catch (err) {
      set({ lastError: err instanceof Error ? err.message : 'Connection failed' })
      return false
    }
  },

  disconnect: async () => {
    const { device } = get()
    if (device) {
      try { await device.close() } catch { /* ignore */ }
    }
    set({ device: null, isConnected: false })
  },

  printImage: async (imageUrl: string) => {
    const { device, endpointNumber } = get()
    if (!device || !get().isConnected) {
      set({ lastError: 'Printer not connected' })
      return
    }

    set({ isPrinting: true, lastError: null })

    try {
      const { data, width, height } = await imageUrlToMonoBitmap(imageUrl)

      // Initialize printer
      await device.transferOut(endpointNumber, escposInit() as BufferSource)

      // Print as raster image (single command, more reliable)
      const rasterCmd = escposRasterImage(data, width, height)

      // Send in chunks to avoid buffer overflow
      const CHUNK_SIZE = 4096
      for (let i = 0; i < rasterCmd.length; i += CHUNK_SIZE) {
        const chunk = rasterCmd.slice(i, i + CHUNK_SIZE)
        await device.transferOut(endpointNumber, chunk as BufferSource)
      }

      // Feed and cut
      await device.transferOut(endpointNumber, escposFeedLines(4) as BufferSource)
      await device.transferOut(endpointNumber, escposCut() as BufferSource)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Print failed'
      set({ lastError: message })
    } finally {
      set({ isPrinting: false })
    }
  },
}))
