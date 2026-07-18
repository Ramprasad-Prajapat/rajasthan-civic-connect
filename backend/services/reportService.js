import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';

/**
 * Builds a PDF document buffer summarizing complaints.
 */
export const generatePDFReport = (complaints = []) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers = [];
      doc.on('data', chunks => buffers.push(chunks));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Header Banner
      doc.fontSize(22).fillColor('#1e3a8a').text('RajCivic Connect - Municipal Grievance Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#4b5563').text(`Generated On: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown();
      
      // Divider
      doc.moveTo(30, 80).lineTo(565, 80).stroke('#e5e7eb');
      doc.moveDown(1.5);
      
      // Totals Summary
      doc.fontSize(12).fillColor('#111827').text(`Total Grievances Exported: ${complaints.length}`, { style: 'bold' });
      doc.moveDown();
      
      // Table Column Titles
      doc.fontSize(10).fillColor('#374151');
      doc.text('Complaint ID       Category             Status        Priority     Date Lodged', { underline: true });
      doc.moveDown(0.5);
      
      // Table Row Loop
      doc.fontSize(9).fillColor('#4b5563');
      complaints.forEach((c) => {
        const cId = (c.id || c.complaintId || '').padEnd(18, ' ');
        const cat = (c.category || '').substring(0, 16).padEnd(20, ' ');
        const stat = (c.status || '').padEnd(14, ' ');
        const pri = (c.priority || '').padEnd(12, ' ');
        const date = new Date(c.createdAt || c.timestamp || Date.now()).toLocaleDateString();
        
        doc.text(`${cId} ${cat} ${stat} ${pri} ${date}`);
        doc.moveDown(0.3);
      });
      
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Builds a spreadsheet file buffer using SheetJS/XLSX.
 */
export const generateExcelReport = (complaints = []) => {
  const data = complaints.map(c => ({
    'Complaint ID': c.id || c.complaintId || '',
    'Citizen Name': c.citizenName || '',
    'Category': c.category || '',
    'Subcategory': c.subCategory || c.subcategory || '',
    'District': c.district || '',
    'ULB Name': c.ulbName || c.ulb || '',
    'Ward Number': c.wardNumber || c.ward || '',
    'Status': c.status || '',
    'Priority': c.priority || '',
    'SLA Hours': c.slaHours || '',
    'Created At': c.createdAt || c.timestamp || ''
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Grievances');
  
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
};
