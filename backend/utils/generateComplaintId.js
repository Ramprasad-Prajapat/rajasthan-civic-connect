/**
 * Formulates unique complaint IDs matching: prefix-district-ulb-year-serial
 */
export const generateComplaintId = (district = 'JAI', ulbName = 'NNJ', isEmergency = false) => {
  const prefix = isEmergency ? 'EMG' : 'RJCIVIC';
  const districtCode = (district || 'JAI').substring(0, 3).toUpperCase();
  
  let ulbCode = 'NN';
  if (ulbName) {
    const cleaned = ulbName.replace(/\s+/g, '').toUpperCase();
    if (cleaned.includes('NIGAM')) {
      ulbCode = 'NNG';
    } else if (cleaned.includes('PARISHAD')) {
      ulbCode = 'NP';
    } else if (cleaned.includes('PALIKA')) {
      ulbCode = 'NPL';
    } else {
      ulbCode = cleaned.substring(0, 3);
    }
  }
  
  const year = new Date().getFullYear();
  const serial = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
  return `${prefix}-${districtCode}-${ulbCode}-${year}-${serial}`;
};
