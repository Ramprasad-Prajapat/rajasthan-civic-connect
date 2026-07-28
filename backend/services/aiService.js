/**
 * AI & Smart Civic Intelligence Engine for RajCivic Connect
 */

export function classifyComplaint(description = '') {
  const text = description.toLowerCase();

  if (text.includes('garbage') || text.includes('kacha') || text.includes('trash') || text.includes('waste') || text.includes('dustbin') || text.includes('cleanliness')) {
    return { category: 'Garbage Collection', department: 'Sanitation Department', confidence: 0.94 };
  }
  if (text.includes('light') || text.includes('lamp') || text.includes('dark') || text.includes('pole') || text.includes('electricity') || text.includes('wire')) {
    return { category: 'Streetlight & Electrical', department: 'Electrical Department', confidence: 0.91 };
  }
  if (text.includes('water') || text.includes('pipe') || text.includes('leak') || text.includes('supply') || text.includes('pini') || text.includes('tanker')) {
    return { category: 'Water Supply', department: 'Water Works Department', confidence: 0.95 };
  }
  if (text.includes('road') || text.includes('pothole') || text.includes('gaddha') || text.includes('tar') || text.includes('asphalt') || text.includes('crack')) {
    return { category: 'Roads & Potholes', department: 'Public Works Department (PWD)', confidence: 0.89 };
  }
  if (text.includes('drain') || text.includes('sewer') || text.includes('nali') || text.includes('overflow') || text.includes('blockage')) {
    return { category: 'Drainage & Sewage', department: 'Sewerage & Drainage Department', confidence: 0.92 };
  }

  return { category: 'General Civic Issue', department: 'Municipal Administration', confidence: 0.75 };
}

export function predictPriority(description = '', category = '') {
  const text = description.toLowerCase();

  if (text.includes('urgent') || text.includes('danger') || text.includes('hazard') || text.includes('fire') || text.includes('accident') || text.includes('spark') || text.includes('emergency')) {
    return { priority: 'Critical', slaHours: 6, escalationHours: 12 };
  }
  if (text.includes('block') || text.includes('major') || text.includes('main road') || text.includes('hospital') || text.includes('school')) {
    return { priority: 'High', slaHours: 24, escalationHours: 36 };
  }
  if (category === 'Garbage Collection' || category === 'Streetlight & Electrical') {
    return { priority: 'Medium', slaHours: 48, escalationHours: 72 };
  }

  return { priority: 'Low', slaHours: 72, escalationHours: 96 };
}

export function analyzeImageProof(base64Image = '') {
  if (!base64Image) {
    return { verified: false, score: 0, labels: [], message: 'No image provided' };
  }

  // Simulated AI Vision Model Inspection
  const isGarbage = base64Image.length % 2 === 0;
  return {
    verified: true,
    score: 0.92,
    labels: isGarbage ? ['Garbage Heap', 'Public Waste', 'Outdoor Spot'] : ['Road Surface Defect', 'Pothole', 'Asphalt Crack'],
    qualityCheck: 'PASSED',
    tamperDetected: false,
    timestamp: new Date().toISOString()
  };
}

export function generateAIAnalytics() {
  return {
    predictedComplaintsNextWeek: 142,
    highRiskWards: ['Ward 12 (Shastri Nagar)', 'Ward 08 (Sardarpura)', 'Ward 24 (Vaishali Nagar)'],
    topRecurringCategories: [
      { category: 'Garbage Collection', percentage: 38 },
      { category: 'Streetlight & Electrical', percentage: 26 },
      { category: 'Water Supply', percentage: 20 },
      { category: 'Drainage & Sewage', percentage: 16 }
    ],
    slaComplianceForecast: '94.2%',
    recommendedWorkerDispatches: [
      { ward: 'Ward 12', department: 'Sanitation', recommendedWorkers: 4 },
      { ward: 'Ward 08', department: 'Electrical', recommendedWorkers: 2 }
    ]
  };
}
