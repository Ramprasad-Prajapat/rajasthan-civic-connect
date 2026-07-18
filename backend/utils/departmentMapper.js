/**
 * Maps complaint categories to responsible municipal departments.
 */
export const mapCategoryToDepartment = (category = '') => {
  const mapping = {
    'garbage': 'Sanitation Department',
    'sanitation': 'Sanitation Department',
    'water': 'Water Department',
    'street light': 'Electrical Department',
    'electricity': 'Electrical Department',
    'road': 'Public Works Department',
    'pavement': 'Public Works Department',
    'drainage': 'Sewerage Department',
    'sewer': 'Sewerage Department',
    'animal': 'Animal Control Department'
  };

  const categoryLower = category.toLowerCase();
  const matchedKey = Object.keys(mapping).find(key => categoryLower.includes(key));
  return matchedKey ? mapping[matchedKey] : 'General Municipal Department';
};
