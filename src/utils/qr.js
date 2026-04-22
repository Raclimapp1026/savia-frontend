import QRCode from 'qrcode';

export async function generarQRDataURL(texto, opciones = {}) {
  const opts = {
    width: opciones.width || 300,
    margin: opciones.margin || 2,
    color: {
      dark: opciones.colorOscuro || '#0a4a2d',
      light: opciones.colorClaro || '#ffffff',
    },
    errorCorrectionLevel: 'M',
  };
  return QRCode.toDataURL(texto, opts);
}

export async function descargarQR(texto, nombreArchivo, opciones = {}) {
  const dataURL = await generarQRDataURL(texto, { width: 600, ...opciones });

  // Create canvas with label
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const qrSize = 600;
  const padding = 40;
  const headerHeight = 80;
  const footerHeight = 60;
  const totalWidth = qrSize + padding * 2;
  const totalHeight = headerHeight + qrSize + footerHeight + padding;

  canvas.width = totalWidth;
  canvas.height = totalHeight;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Header bar
  ctx.fillStyle = '#0a4a2d';
  ctx.fillRect(0, 0, totalWidth, headerHeight);

  // SAVIA text in header
  ctx.fillStyle = '#f9f7d9';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SAVIA', totalWidth / 2, 35);

  ctx.fillStyle = '#08ae62';
  ctx.font = '14px Arial';
  ctx.fillText('Soporte Tecnico', totalWidth / 2, 58);

  // QR Code
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, padding, headerHeight + 10, qrSize, qrSize);

    // Office name below QR
    ctx.fillStyle = '#0a4a2d';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(nombreArchivo, totalWidth / 2, headerHeight + qrSize + 35);

    ctx.fillStyle = '#6b8578';
    ctx.font = '12px Arial';
    ctx.fillText('Escanee para reportar incidencia', totalWidth / 2, headerHeight + qrSize + 55);

    // Download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_${nombreArchivo.replace(/\s+/g, '_')}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.src = dataURL;
}
