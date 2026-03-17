export function dataUrlToBlob(dataUrl: string): Blob {
  const commaIndex = dataUrl.indexOf(',')
  if (commaIndex === -1) {
    throw new Error('Invalid data URL: missing comma separator')
  }

  const header = dataUrl.slice(0, commaIndex)
  const mimeMatch = header.match(/:(.*?);/)
  const mime = mimeMatch?.[1] ?? 'image/jpeg'
  const base64 = dataUrl.slice(commaIndex + 1)

  if (base64.length === 0) {
    throw new Error('Invalid data URL: empty data')
  }

  const bstr = atob(base64)
  const u8arr = new Uint8Array(bstr.length)
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }
  return new Blob([u8arr], { type: mime })
}
