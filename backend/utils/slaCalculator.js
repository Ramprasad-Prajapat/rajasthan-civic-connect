/**
 * Calculates SLA durations and deadlines:
 * - Emergency -> 1 to 2 hours
 * - High Priority -> 6 to 12 hours
 * - Normal -> 24 to 72 hours
 */
export const calculateSla = (priority = 'Normal', isEmergency = false) => {
  let slaHours = 24;
  if (isEmergency) {
    slaHours = 2; 
  } else if (priority === 'Critical') {
    slaHours = 6;
  } else if (priority === 'High') {
    slaHours = 12;
  } else {
    slaHours = 48; 
  }
  
  const slaDeadline = new Date();
  slaDeadline.setHours(slaDeadline.getHours() + slaHours);
  return { 
    slaHours, 
    slaDeadline: slaDeadline.toISOString() 
  };
};
