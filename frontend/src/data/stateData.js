// State electricity consumption (kWh) and carbon emission (kg CO2) data
// Carbon emission figures are estimated based on local electricity generation mix factors.
export const stateData = [
  { id: 'AN', name: 'Andaman and Nicobar Islands', electricityConsumption: 900, carbonEmission: 810, pop: '400k', gdp: 220000, isEmissionEstimated: true, emissionFactor: 0.90 },
  { id: 'AP', name: 'Andhra Pradesh', electricityConsumption: 2299.25, carbonEmission: 1954.36, pop: '53M', gdp: 220000, isEmissionEstimated: true, emissionFactor: 0.85 },
  { id: 'AR', name: 'Arunachal Pradesh', electricityConsumption: 2562.09, carbonEmission: 1024.84, pop: '1.6M', gdp: 210000, isEmissionEstimated: true, emissionFactor: 0.40 },
  { id: 'AS', name: 'Assam', electricityConsumption: 1069.96, carbonEmission: 962.96, pop: '36M', gdp: 100000, isEmissionEstimated: true, emissionFactor: 0.90 },
  { id: 'BR', name: 'Bihar', electricityConsumption: 835.03, carbonEmission: 793.28, pop: '127M', gdp: 54000, isEmissionEstimated: true, emissionFactor: 0.95 },
  { id: 'CH', name: 'Chandigarh', electricityConsumption: 2000, carbonEmission: 1600.00, pop: '1.2M', gdp: 350000, isEmissionEstimated: true, emissionFactor: 0.80 },
  { id: 'CT', name: 'Chhattisgarh', electricityConsumption: 3105.21, carbonEmission: 3260.47, pop: '30M', gdp: 140000, isEmissionEstimated: true, emissionFactor: 1.05 },
  { id: 'DN', name: 'Dadra and Nagar Haveli', electricityConsumption: 15642.35, carbonEmission: 14860.23, pop: '400k', gdp: 350000, isEmissionEstimated: true, emissionFactor: 0.95 },
  { id: 'DD', name: 'Daman and Diu', electricityConsumption: 15642.35, carbonEmission: 14860.23, pop: '250k', gdp: 350000, isEmissionEstimated: true, emissionFactor: 0.95 },
  { id: 'DL', name: 'Delhi', electricityConsumption: 3636.70, carbonEmission: 3454.87, pop: '20M', gdp: 440000, isEmissionEstimated: true, emissionFactor: 0.95 },
  { id: 'GA', name: 'Goa', electricityConsumption: 5485.87, carbonEmission: 4937.28, pop: '1.6M', gdp: 580000, isEmissionEstimated: true, emissionFactor: 0.90 },
  { id: 'GJ', name: 'Gujarat', electricityConsumption: 4646.19, carbonEmission: 4413.88, pop: '64M', gdp: 280000, isEmissionEstimated: true, emissionFactor: 0.95 },
  { id: 'HR', name: 'Haryana', electricityConsumption: 4875.30, carbonEmission: 4631.54, pop: '28M', gdp: 290000, isEmissionEstimated: true, emissionFactor: 0.95 },
  { id: 'HP', name: 'Himachal Pradesh', electricityConsumption: 3214.53, carbonEmission: 1125.09, pop: '7.4M', gdp: 220000, isEmissionEstimated: true, emissionFactor: 0.35 },
  { id: 'JK', name: 'Jammu and Kashmir', electricityConsumption: 2452.77, carbonEmission: 1226.39, pop: '14M', gdp: 120000, isEmissionEstimated: true, emissionFactor: 0.50 },
  { id: 'JH', name: 'Jharkhand', electricityConsumption: 1760.78, carbonEmission: 1848.82, pop: '39M', gdp: 90000, isEmissionEstimated: true, emissionFactor: 1.05 },
  { id: 'KA', name: 'Karnataka', electricityConsumption: 3357.58, carbonEmission: 1678.79, pop: '67M', gdp: 300000, isEmissionEstimated: true, emissionFactor: 0.50 },
  { id: 'KL', name: 'Kerala', electricityConsumption: 2486.49, carbonEmission: 1367.57, pop: '35M', gdp: 250000, isEmissionEstimated: true, emissionFactor: 0.55 },
  { id: 'LA', name: 'Ladakh', electricityConsumption: 2000, carbonEmission: 1000.00, pop: '300k', gdp: 180000, isEmissionEstimated: true, emissionFactor: 0.50 },
  { id: 'LD', name: 'Lakshadweep', electricityConsumption: 800, carbonEmission: 720.00, pop: '65k', gdp: 200000, isEmissionEstimated: true, emissionFactor: 0.90 },
  { id: 'MP', name: 'Madhya Pradesh', electricityConsumption: 1958.49, carbonEmission: 1762.64, pop: '85M', gdp: 140000, isEmissionEstimated: true, emissionFactor: 0.90 },
  { id: 'MH', name: 'Maharashtra', electricityConsumption: 2990.07, carbonEmission: 2541.56, pop: '125M', gdp: 240000, isEmissionEstimated: true, emissionFactor: 0.85 },
  { id: 'MN', name: 'Manipur', electricityConsumption: 1370.01, carbonEmission: 822.01, pop: '3.0M', gdp: 95000, isEmissionEstimated: true, emissionFactor: 0.60 },
  { id: 'ML', name: 'Meghalaya', electricityConsumption: 2688.86, carbonEmission: 1344.43, pop: '3.3M', gdp: 100000, isEmissionEstimated: true, emissionFactor: 0.50 },
  { id: 'MZ', name: 'Mizoram', electricityConsumption: 2024.78, carbonEmission: 1113.63, pop: '1.2M', gdp: 200000, isEmissionEstimated: true, emissionFactor: 0.55 },
  { id: 'NL', name: 'Nagaland', electricityConsumption: 1079.26, carbonEmission: 647.56, pop: '2.2M', gdp: 140000, isEmissionEstimated: true, emissionFactor: 0.60 },
  { id: 'OR', name: 'Odisha', electricityConsumption: 2598.14, carbonEmission: 2728.05, pop: '44M', gdp: 150000, isEmissionEstimated: true, emissionFactor: 1.05 },
  { id: 'PY', name: 'Puducherry', electricityConsumption: 4479.88, carbonEmission: 4031.89, pop: '1.6M', gdp: 240000, isEmissionEstimated: true, emissionFactor: 0.90 },
  { id: 'PB', name: 'Punjab', electricityConsumption: 4120.51, carbonEmission: 3708.46, pop: '30M', gdp: 180000, isEmissionEstimated: true, emissionFactor: 0.90 },
  { id: 'RJ', name: 'Rajasthan', electricityConsumption: 2544.64, carbonEmission: 2417.41, pop: '81M', gdp: 160000, isEmissionEstimated: true, emissionFactor: 0.95 },
  { id: 'SK', name: 'Sikkim', electricityConsumption: 2863.31, carbonEmission: 858.99, pop: '700k', gdp: 520000, isEmissionEstimated: true, emissionFactor: 0.30 },
  { id: 'TN', name: 'Tamil Nadu', electricityConsumption: 3659.96, carbonEmission: 2561.97, pop: '77M', gdp: 270000, isEmissionEstimated: true, emissionFactor: 0.70 },
  { id: 'TG', name: 'Telangana', electricityConsumption: 4162.38, carbonEmission: 3954.26, pop: '38M', gdp: 310000, isEmissionEstimated: true, emissionFactor: 0.95 },
  { id: 'TR', name: 'Tripura', electricityConsumption: 1102.52, carbonEmission: 882.02, pop: '4.1M', gdp: 140000, isEmissionEstimated: true, emissionFactor: 0.80 },
  { id: 'UP', name: 'Uttar Pradesh', electricityConsumption: 1502.60, carbonEmission: 1352.34, pop: '235M', gdp: 85000, isEmissionEstimated: true, emissionFactor: 0.90 },
  { id: 'UT', name: 'Uttarakhand', electricityConsumption: 2974.95, carbonEmission: 1338.73, pop: '11M', gdp: 230000, isEmissionEstimated: true, emissionFactor: 0.45 },
  { id: 'WB', name: 'West Bengal', electricityConsumption: 1508.41, carbonEmission: 1433.00, pop: '99M', gdp: 150000, isEmissionEstimated: true, emissionFactor: 0.95 }
];

export const NATIONAL_AVG = 1390;
export const NATIONAL_CARBON_AVG = 1140;

// Export dictionary format for state name mapping
export const stateDataDict = stateData.reduce((acc, current) => {
  acc[current.name] = {
    electricityConsumption: current.electricityConsumption,
    carbonEmission: current.carbonEmission,
    pop: current.pop,
    gdp: current.gdp,
    isEmissionEstimated: current.isEmissionEstimated,
    emissionFactor: current.emissionFactor
  };
  return acc;
}, {});

export default stateData;
