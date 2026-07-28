/**
 * Calculates the optimization severity score of a region.
 * A higher score indicates a higher combined energy load and carbon profile needing urgent intervention.
 * @param {number} electricityConsumption - kWh per capita
 * @param {number} carbonEmission - kg CO2 per capita
 * @param {number} [avgElec] - baseline average electricity (1390 kWh)
 * @param {number} [avgCarbon] - baseline average carbon (1140 kg)
 * @returns {number} combined severity score
 */
export function getOptimizationScore(electricityConsumption, carbonEmission, avgElec = 1390, avgCarbon = 1140) {
  const consumptionScore = electricityConsumption / avgElec;
  const emissionScore = carbonEmission / avgCarbon;
  return (consumptionScore + emissionScore) / 2;
}

/**
 * Evaluates regional metrics and outputs prioritized optimization recommendations.
 * @param {number} electricityConsumption - kWh per capita
 * @param {number} carbonEmission - kg CO2 per capita
 * @param {number} [avgElec] - baseline average electricity
 * @param {number} [avgCarbon] - baseline average carbon
 * @returns {{
 *   profileName: string,
 *   profileType: 'high-high' | 'high-low' | 'low-high' | 'low-low',
 *   recommendations: Array<{
 *     type: 'renewable' | 'efficiency' | 'demand' | 'benchmark',
 *     priority: 'High' | 'Medium' | 'Low',
 *     suggestion: string,
 *     potentialSavingPercent?: number,
 *     potentialReductionPercent?: number
 *   }>
 * }}
 */
export function getRecommendations(electricityConsumption, carbonEmission, avgElec = 1390, avgCarbon = 1140) {
  const recommendations = [];
  
  const isHighConsumption = electricityConsumption > avgElec * 1.15;
  const isLowConsumption = electricityConsumption < avgElec * 0.85;
  
  const isHighEmission = carbonEmission > avgCarbon * 1.15;
  const isLowEmission = carbonEmission < avgCarbon * 0.85;

  let profileName = "Moderate Load & Emission Profile";
  let profileType = "moderate";

  // 1. Profile Classification Logic
  if (!isLowConsumption && isHighEmission) {
    // High consumption + high emission OR Moderate consumption + high emission
    profileName = "High Load, High Carbon Grid Profile";
    profileType = "high-high";
    
    recommendations.push({
      type: "renewable",
      priority: "High",
      suggestion: "Accelerate utility-scale wind/solar solar integration to retire old captive coal generation units.",
      potentialReductionPercent: 25
    });
    recommendations.push({
      type: "efficiency",
      priority: "High",
      suggestion: "Mandate industrial energy audits and transition public infrastructure to BEE 5-star efficient machinery.",
      potentialSavingPercent: 15
    });
  } 
  else if (isHighConsumption && !isHighEmission) {
    // High consumption + low/moderate emission
    profileName = "Efficient High-Load Clean Grid Profile";
    profileType = "high-low";
    
    recommendations.push({
      type: "demand",
      priority: "High",
      suggestion: "Deploy smart meters and peak-load shifting tariff incentives to flatten the daily demand curves.",
      potentialSavingPercent: 12
    });
    recommendations.push({
      type: "efficiency",
      priority: "Medium",
      suggestion: "Introduce incentives for commercial rooftop solar networks and building insulation audits.",
      potentialSavingPercent: 10
    });
  } 
  else if (isLowConsumption && isHighEmission) {
    // Low consumption + high emission
    profileName = "Low Load, Inefficient Coal-Heavy Grid Profile";
    profileType = "low-high";
    
    recommendations.push({
      type: "renewable",
      priority: "High",
      suggestion: "Transition grid draw away from coal sources; subsidize local community solar micro-grids.",
      potentialReductionPercent: 30
    });
    recommendations.push({
      type: "efficiency",
      priority: "Medium",
      suggestion: "Audit regional transmission lines to minimize high distribution line losses (T&D leakage).",
      potentialSavingPercent: 8
    });
  } 
  else if (isLowConsumption && isLowEmission) {
    // Low consumption + low emission
    profileName = "Benchmark Clean-Energy Region Showcase";
    profileType = "low-low";
    
    recommendations.push({
      type: "benchmark",
      priority: "Low",
      suggestion: "Highlight as a best-practice green region. Document operational model to scale to neighboring zones.",
      potentialSavingPercent: 0
    });
    recommendations.push({
      type: "renewable",
      priority: "Medium",
      suggestion: "Install local battery energy storage (BESS) systems to support grid load stability.",
      potentialReductionPercent: 10
    });
  } 
  else {
    // Moderate default case
    profileName = "Standard Mixed Generation Profile";
    profileType = "moderate";
    
    recommendations.push({
      type: "renewable",
      priority: "Medium",
      suggestion: "Introduce household rooftop solar subsidy schemes to increase local renewable mix share.",
      potentialReductionPercent: 15
    });
    recommendations.push({
      type: "efficiency",
      priority: "Medium",
      suggestion: "Implement LED streetlight upgrades and energy auditing programs for municipal buildings.",
      potentialSavingPercent: 8
    });
  }

  // 2. Add General context recommendations if list is short
  if (recommendations.length < 3) {
    recommendations.push({
      type: "demand",
      priority: "Medium",
      suggestion: "Provide EV charging point incentives matching local clean energy generation mixes.",
      potentialSavingPercent: 6
    });
  }

  return {
    profileName,
    profileType,
    recommendations
  };
}

export default getRecommendations;
