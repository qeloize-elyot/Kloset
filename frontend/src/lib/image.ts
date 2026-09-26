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

/**
 * Remove fundo no navegador.
 * Usa modelo pequeno + imagem já reduzida para não demorar "décadas".
 */
export async function removeBackground(dataUrlOrFile: string | File): Promise<string> {
  // redimensiona antes (o modelo pesa muito em fotos 4K)
  let input: string | File = dataUrlOrFile
  if (typeof dataUrlOrFile === 'string') {
    input = await shrinkDataUrl(dataUrlOrFile, 512)
  } else {
    input = await fileToDataUrl(dataUrlOrFile, 512, 0.75)
  }

  const { removeBackground: removeBg, Config } = await import('@imgly/background-removal')

  // modelo mais leve = bem mais rápido no celular
  const config: Partial<Config> = {
    model: 'small',
    output: { format: 'image/png', quality: 0.85 },
  }

  const blob = await removeBg(input, config)
  return blobToDataUrl(blob)
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
