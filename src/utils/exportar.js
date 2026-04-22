import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==========================================
// EXPORTAR A EXCEL
// ==========================================
export function exportarExcel(datos, nombreArchivo, nombreHoja = 'Datos') {
  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

  // Auto-width columns
  const colWidths = Object.keys(datos[0] || {}).map(key => ({
    wch: Math.max(
      key.length,
      ...datos.map(row => String(row[key] || '').length)
    ) + 2
  }));
  ws['!cols'] = colWidths;

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${nombreArchivo}.xlsx`);
}

// ==========================================
// EXPORTAR A PDF
// ==========================================
export function exportarPDF(columnas, filas, titulo, nombreArchivo, opciones = {}) {
  const doc = new jsPDF({
    orientation: opciones.orientacion || 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(10, 74, 45); // #0a4a2d
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(249, 247, 217); // #f9f7d9
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SAVIA', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(8, 174, 98); // #08ae62
  doc.text('Sistema de atencion vital e integral de asistencia', 14, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, pageWidth - 14, 12, { align: 'right' });

  // Title
  doc.setTextColor(10, 74, 45);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, 14, 38);

  // Subtitle with filters if provided
  if (opciones.subtitulo) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(opciones.subtitulo, 14, 44);
  }

  // Table
  autoTable(doc, {
    head: [columnas],
    body: filas,
    startY: opciones.subtitulo ? 48 : 42,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [209, 221, 214], // #d1ddd6
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [10, 74, 45], // #0a4a2d
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [240, 245, 242], // #f0f5f2
    },
    didDrawPage: (data) => {
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Pagina ${data.pageNumber} de ${pageCount}`,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'right' }
      );
      doc.text(
        'SAVIA - Puerto Colombia',
        14,
        doc.internal.pageSize.getHeight() - 8
      );
    },
  });

  doc.save(`${nombreArchivo}.pdf`);
}

// ==========================================
// FORMATEAR TICKETS PARA EXPORTACIÓN
// ==========================================
export function formatearTicketsParaExport(tickets) {
  return tickets.map(t => ({
    'Codigo': t.codigoTicket,
    'Solicitante': t.nombreSolicitante,
    'Correo': t.correoSolicitante,
    'Celular': t.celularSolicitante,
    'Oficina': t.oficina?.nombre || '',
    'Tipo de Falla': t.tipoFalla?.nombre || '',
    'Prioridad': t.prioridad,
    'Estado': t.estado?.replace('_', ' '),
    'Tecnico': t.tecnico?.nombre || 'Sin asignar',
    'Fecha Creacion': t.fechaCreacion ? new Date(t.fechaCreacion).toLocaleString('es-CO') : '',
    'Fecha Asignacion': t.fechaAsignacion ? new Date(t.fechaAsignacion).toLocaleString('es-CO') : '',
    'Fecha Resolucion': t.fechaResolucion ? new Date(t.fechaResolucion).toLocaleString('es-CO') : '',
    'Fecha Cierre': t.fechaCierre ? new Date(t.fechaCierre).toLocaleString('es-CO') : '',
  }));
}

export function ticketsAFilasPDF(tickets) {
  return tickets.map(t => [
    t.codigoTicket,
    t.nombreSolicitante,
    t.oficina?.nombre || '',
    t.tipoFalla?.nombre || '',
    t.prioridad,
    t.estado?.replace('_', ' '),
    t.tecnico?.nombre || 'Sin asignar',
    t.fechaCreacion ? new Date(t.fechaCreacion).toLocaleDateString('es-CO') : '',
  ]);
}

export const COLUMNAS_TICKETS_PDF = [
  'Codigo', 'Solicitante', 'Oficina', 'Tipo Falla', 'Prioridad', 'Estado', 'Tecnico', 'Fecha'
];
