import { db } from '../config/firebaseAdmin.js';
import { generatePDFReport, generateExcelReport } from '../services/reportService.js';

/**
 * Common filter aggregator. Performs in-memory filtering to bypass composite index constraints.
 */
const getFilteredComplaintsList = async (req) => {
  const { startDate, endDate, district, ulb, ward, department, category, status } = req.query;
  const snap = await db.collection('complaints').get();
  
  let list = [];
  snap.forEach(doc => {
    list.push(doc.data());
  });
  
  if (district) {
    list = list.filter(c => (c.district || '').toLowerCase() === district.toLowerCase());
  }
  if (ulb) {
    list = list.filter(c => (c.ulbName || c.ulb || '').toLowerCase() === ulb.toLowerCase());
  }
  if (ward) {
    list = list.filter(c => String(c.wardNumber || c.ward || '') === String(ward));
  }
  if (department) {
    list = list.filter(c => (c.departmentName || c.department || '').toLowerCase().includes(department.toLowerCase()));
  }
  if (category) {
    list = list.filter(c => (c.category || '').toLowerCase().includes(category.toLowerCase()));
  }
  if (status) {
    list = list.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
  }
  if (startDate) {
    const start = new Date(startDate);
    list = list.filter(c => new Date(c.createdAt || c.timestamp) >= start);
  }
  if (endDate) {
    const end = new Date(endDate);
    list = list.filter(c => new Date(c.createdAt || c.timestamp) <= end);
  }
  
  return list;
};

/**
 * Returns compliance rates and total aggregates. Logs generation details to 'reports'.
 */
export const getReportsSummary = async (req, res) => {
  try {
    const list = await getFilteredComplaintsList(req);
    const total = list.length;
    const resolved = list.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    const pending = total - resolved;
    const delayed = list.filter(c => c.status === 'SLA_Delayed' || c.status === 'SLA Delayed' || c.status === 'SLA_Delayed').length;
    const complianceRate = total > 0 ? ((resolved / total) * 100).toFixed(1) + '%' : '100%';
    
    const reportId = `REP-${Date.now()}`;
    await db.collection('reports').doc(reportId).set({
      reportId,
      reportType: req.query.reportType || 'filtered_summary',
      district: req.query.district || 'All Districts',
      ulb: req.query.ulb || 'All ULBs',
      month: new Date().toLocaleString('default', { month: 'long' }),
      totalComplaintsCount: total,
      complianceRate,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    
    res.status(200).json({
      total,
      resolved,
      pending,
      delayed,
      complianceRate
    });
  } catch (error) {
    console.error("Report summary metrics failed:", error);
    res.status(500).json({ error: "Failed to generate summary metrics" });
  }
};

/**
 * Returns list of complaints filtered by reporting query flags.
 */
export const getReportsComplaints = async (req, res) => {
  try {
    const list = await getFilteredComplaintsList(req);
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch filtered complaints" });
  }
};

/**
 * Outputs a PDF report stream.
 */
export const exportPDFReport = async (req, res) => {
  try {
    const list = await getFilteredComplaintsList(req);
    const pdfBuffer = await generatePDFReport(list);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Grievance_Report_${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF export failed:", error);
    res.status(500).json({ error: "Failed to build PDF report" });
  }
};

/**
 * Outputs an Excel report stream.
 */
export const exportExcelReport = async (req, res) => {
  try {
    const list = await getFilteredComplaintsList(req);
    const excelBuffer = generateExcelReport(list);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Grievance_Report_${Date.now()}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Excel export failed:", error);
    res.status(500).json({ error: "Failed to build Excel report" });
  }
};
