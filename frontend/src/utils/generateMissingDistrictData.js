/**
 * Merges existing hardcoded district data with the master administrative list,
 * auto-generating realistic, stable, and deterministic estimates for missing regions.
 * 
 * @param {string} stateName - name of the parent state
 * @param {Array} [existingData] - hardcoded district stats from districtData.js
 * @param {Array<string>} [allDistrictsList] - official list of districts from allDistricts.js
 * @param {number} [stateAvgKwh] - average electricity consumption of state
 * @param {number} [stateFactor] - average emission factor of state
 * @returns {Array<{
 *   name: string,
 *   electricityConsumption: number,
 *   carbonEmission: number,
 *   pop: string,
 *   gdp: number,
 *   isEstimated: boolean
 * }>} Complete districts list with filled values
 */
export function fillMissingDistricts(
  stateName, 
  existingData = [], 
  allDistrictsList = [], 
  stateAvgKwh = 1000, 
  stateFactor = 0.85
) {
  return allDistrictsList.map(districtName => {
    // 1. Cross check if the district already exists in data (supports "name" or "district" fields)
    const existing = existingData.find(d => {
      const dName = d.name || d.district || "";
      return dName.toLowerCase().replace(/\s+/g, '') === districtName.toLowerCase().replace(/\s+/g, '');
    });

    if (existing) {
      return {
        name: districtName,
        electricityConsumption: existing.electricityConsumption ?? existing.value ?? 1000,
        carbonEmission: existing.carbonEmission ?? Math.round((existing.electricityConsumption ?? existing.value ?? 1000) * stateFactor),
        pop: existing.pop || "2.1M",
        gdp: existing.gdp || 180000,
        isEstimated: false
      };
    }

    // 2. Generate stable, deterministic estimations based on a seed derived from state and district names.
    // This stops values from changing on every react render cycle.
    let seed = 0;
    const str = stateName + districtName;
    for (let i = 0; i < str.length; i++) {
      seed += str.charCodeAt(i);
    }
    const seededRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Generate energy load with ±30% variance
    const variance = (seededRandom() * 0.6 - 0.3); // -30% to +30%
    const electricityConsumption = Math.round(stateAvgKwh * (1 + variance));

    // Generate emission factor with local variance around state baseline factor
    const localFactor = stateFactor * (0.85 + seededRandom() * 0.3);
    const carbonEmission = Math.round(electricityConsumption * localFactor);

    // Demographic parameters seeder
    const pop = `${(0.5 + seededRandom() * 7.5).toFixed(1)}M`;
    const gdp = Math.round(150000 * (0.6 + seededRandom() * 1.2));

    return {
      name: districtName,
      electricityConsumption,
      carbonEmission,
      pop,
      gdp,
      isEstimated: true
    };
  });
}

export default fillMissingDistricts;
