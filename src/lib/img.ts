// Optimización de imágenes en el navegador ANTES de subir a Storage.
// - Convierte a JPEG (arregla HEIC/HEIF de iPhone, que no se renderiza en PDF/web).
// - Redimensiona al lado máximo indicado y comprime → mucho menos espacio en Storage.
// Si algo falla (formato no decodificable en ese navegador), devuelve el archivo original.

async function cargarBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap decodifica nativamente (incl. HEIC en iOS Safari).
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch { /* fallback */ }
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

export async function optimizarImagen(file: File, maxLado = 1600, calidad = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file; // PDFs u otros: no tocar
  try {
    const bmp = await cargarBitmap(file);
    const w0 = (bmp as ImageBitmap).width, h0 = (bmp as ImageBitmap).height;
    if (!w0 || !h0) return file;
    const escala = Math.min(1, maxLado / Math.max(w0, h0));
    const w = Math.round(w0 * escala), h = Math.round(h0 * escala);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bmp as CanvasImageSource, 0, 0, w, h);
    if ('close' in bmp && typeof (bmp as ImageBitmap).close === 'function') (bmp as ImageBitmap).close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', calidad));
    if (!blob) return file;
    // Si por algún motivo pesa más que el original (raro), conserva el original.
    if (blob.size >= file.size && file.type === 'image/jpeg') return file;
    const nombre = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], nombre, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}
