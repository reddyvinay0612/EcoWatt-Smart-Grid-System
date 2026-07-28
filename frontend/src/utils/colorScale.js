/**
 * Maps a kWh consumption value to a corresponding color tier.
 * @param {number} value - per capita energy consumption in kWh
 * @param {number} [average] - optional average for relative threshold calculations
 * @returns {{ color: string, tier: 'Low' | 'Medium' | 'High' }}
 */
export const getColorScale = (value, average) => {
  // If average is passed, calculate relative to state average (Drill-down mode)
  if (average) {
    if (value < average * 0.8) {
      return { color: '#10B981', tier: 'Low' }; // Green
    } else if (value > average * 1.2) {
      return { color: '#EF4444', tier: 'High' }; // Red
    } else {
      return { color: '#F59E0B', tier: 'Medium' }; // Yellow
    }
  }

  // Otherwise calculate relative to national thresholds
  if (value < 1000) {
    return { color: '#10B981', tier: 'Low' };
  } else if (value > 2000) {
    return { color: '#EF4444', tier: 'High' };
  } else {
    return { color: '#F59E0B', tier: 'Medium' };
  }
};

export default getColorScale;
