/** Redimensiona e comprime para data URL (JPEG). */
export async function fileToDataUrl(
  file: File,
  maxSide = 720,
  quality = 0.8
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

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function shrinkDataUrl(dataUrl: string, maxSide: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Remove fundo no navegador.
 * Reduz a imagem e usa modelo small para nao demorar no celular.
 */
export async function removeBackground(dataUrlOrFile: string | File): Promise<string> {
  let input: string
  if (typeof dataUrlOrFile === 'string') {
    input = await shrinkDataUrl(dataUrlOrFile, 512)
  } else {
    input = await fileToDataUrl(dataUrlOrFile, 512, 0.75)
  }

  const { removeBackground: removeBg } = await import('@imgly/background-removal')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await removeBg(input, {
    model: 'small',
    output: { format: 'image/png', quality: 0.85 },
  } as any)
  return blobToDataUrl(blob)
}
