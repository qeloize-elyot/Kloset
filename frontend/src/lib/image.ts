/** Redimensiona e comprime para data URL (JPEG). */
export async function fileToDataUrl(
  file: File,
  maxSide = 900,
  quality = 0.85
): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', quality)
}

/** Converte Blob em data URL PNG (preserva transparencia apos remocao de fundo). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** Remove o fundo da imagem no proprio navegador (sem servidor). */
export async function removeBackground(dataUrlOrFile: string | File): Promise<string> {
  const { removeBackground: removeBg } = await import('@imgly/background-removal')
  const blob = await removeBg(dataUrlOrFile, {
    output: { format: 'image/png', quality: 0.9 },
  })
  return blobToDataUrl(blob)
}
