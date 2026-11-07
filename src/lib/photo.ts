/**
 * Réduit et recompresse une photo avant stockage (même méthode que meal-app). Une photo de
 * téléphone pèse 3 à 8 Mo ; on la ramène à ~60 Ko, en data URL pour voyager dans la sauvegarde.
 */
export async function photoToDataUrl(file: File, maxSide = 640, quality = 0.75): Promise<string> {
  // 'from-image' applique la rotation EXIF : sinon les photos en portrait ressortent couchées.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponible')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    bitmap.close()
  }
}
