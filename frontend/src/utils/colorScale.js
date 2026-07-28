/**
 * Maps a consumption or emission value to a corresponding color tier.
 * @param {number} value - per capita value (kWh or kg CO2)
 * @param {number} [average] - optional average for relative threshold calculations
 * @param {'electricity' | 'carbon'} [metric] - active metric name
 * @returns {{ color: string, tier: 'Low' | 'Medium' | 'High' }}
 */
export const getColorScale = (value, average, metric = 'electricity') => {
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
  if (metric === 'carbon') {
    if (value < 800) {
      return { color: '#10B981', tier: 'Low' };
    } else if (value > 1600) {
      return { color: '#EF4444', tier: 'High' };
    } else {
      return { color: '#F59E0B', tier: 'Medium' };
    }
  }

  // Default: Electricity
  if (value < 1000) {
    return { color: '#10B981', tier: 'Low' };
  } else if (value > 2000) {
    return { color: '#EF4444', tier: 'High' };
  } else {
    return { color: '#F59E0B', tier: 'Medium' };
  }
};

export default getColorScale;
