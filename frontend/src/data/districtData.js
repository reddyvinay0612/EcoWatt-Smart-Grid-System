export const districtData = {
  "Maharashtra": [
    { name: "Mumbai City", value: 3850.50, pop: "3.1M", gdp: 390000, isEstimated: true },
    { name: "Pune", value: 3410.20, pop: "9.4M", gdp: 310000, isEstimated: true },
    { name: "Nagpur", value: 2580.40, pop: "4.7M", gdp: 210000, isEstimated: true },
    { name: "Thane", value: 3120.10, pop: "11.0M", gdp: 280000, isEstimated: true },
    { name: "Nashik", value: 2150.30, pop: "6.1M", gdp: 180000, isEstimated: true },
    { name: "Aurangabad", value: 2010.80, pop: "3.7M", gdp: 170000, isEstimated: true },
    { name: "Solapur", value: 1650.40, pop: "4.3M", gdp: 140000, isEstimated: true },
    { name: "Amravati", value: 1540.20, pop: "2.9M", gdp: 135000, isEstimated: true }
  ],
  "Karnataka": [
    { name: "Bengaluru Urban", value: 4520.10, pop: "9.6M", gdp: 380000, isEstimated: true },
    { name: "Mysuru", value: 2980.50, pop: "3.0M", gdp: 240000, isEstimated: true },
    { name: "Belagavi", value: 2450.80, pop: "4.8M", gdp: 190000, isEstimated: true },
    { name: "Dharwad", value: 2210.40, pop: "1.8M", gdp: 180000, isEstimated: true },
    { name: "Dakshina Kannada", value: 3150.60, pop: "2.1M", gdp: 270000, isEstimated: true },
    { name: "Kalaburagi", value: 1450.20, pop: "2.6M", gdp: 120000, isEstimated: true },
    { name: "Ballari", value: 2680.70, pop: "2.5M", gdp: 210000, isEstimated: true },
    { name: "Udupi", value: 3010.90, pop: "1.2M", gdp: 260000, isEstimated: true }
  ],
  "Uttar Pradesh": [
    { name: "Noida (G.B. Nagar)", value: 3950.40, pop: "1.7M", gdp: 340000, isEstimated: true },
    { name: "Lucknow", value: 1980.60, pop: "4.6M", gdp: 150000, isEstimated: true },
    { name: "Kanpur", value: 1840.20, pop: "4.5M", gdp: 130000, isEstimated: true },
    { name: "Varanasi", value: 1520.80, pop: "3.7M", gdp: 110000, isEstimated: true },
    { name: "Agra", value: 1410.50, pop: "4.4M", gdp: 105000, isEstimated: true },
    { name: "Prayagraj", value: 1120.30, pop: "5.9M", gdp: 90000, isEstimated: true },
    { name: "Ghaziabad", value: 2450.90, pop: "4.6M", gdp: 210000, isEstimated: true },
    { name: "Meerut", value: 1750.40, pop: "3.4M", gdp: 140000, isEstimated: true }
  ],
  "Gujarat": [
    { name: "Ahmedabad", value: 4980.50, pop: "7.2M", gdp: 310000, isEstimated: true },
    { name: "Surat", value: 5120.40, pop: "6.0M", gdp: 330000, isEstimated: true },
    { name: "Vadodara", value: 4320.60, pop: "4.2M", gdp: 280000, isEstimated: true },
    { name: "Rajkot", value: 3980.20, pop: "3.8M", gdp: 250000, isEstimated: true },
    { name: "Gandhinagar", value: 4650.90, pop: "1.4M", gdp: 320000, isEstimated: true },
    { name: "Jamnagar", value: 3820.70, pop: "2.2M", gdp: 240000, isEstimated: true },
    { name: "Bhavnagar", value: 3120.40, pop: "2.8M", gdp: 200000, isEstimated: true },
    { name: "Anand", value: 3250.30, pop: "2.1M", gdp: 210000, isEstimated: true }
  ],
  "Tamil Nadu": [
    { name: "Chennai", value: 4850.20, pop: "7.1M", gdp: 350000, isEstimated: true },
    { name: "Coimbatore", value: 3920.80, pop: "3.5M", gdp: 290000, isEstimated: true },
    { name: "Madurai", value: 2650.40, pop: "3.0M", gdp: 200000, isEstimated: true },
    { name: "Tiruchirappalli", value: 2780.60, pop: "2.7M", gdp: 210000, isEstimated: true },
    { name: "Salem", value: 2910.30, pop: "3.5M", gdp: 220000, isEstimated: true },
    { name: "Tirunelveli", value: 2450.50, pop: "3.1M", gdp: 180000, isEstimated: true },
    { name: "Vellore", value: 2120.70, pop: "4.0M", gdp: 170000, isEstimated: true },
    { name: "Erode", value: 3150.40, pop: "2.3M", gdp: 230000, isEstimated: true }
  ]
};

export const getDistrictsForState = (stateName, stateAverage) => {
  if (districtData[stateName]) return districtData[stateName];

  const names = [
    `${stateName} North`, `${stateName} South`, `${stateName} East`, 
    `${stateName} West`, `${stateName} Central`, `${stateName} Rural`,
    `${stateName} Metro`, `${stateName} Coastal`
  ];

  let seed = 0;
  for (let i = 0; i < stateName.length; i++) {
    seed += stateName.charCodeAt(i);
  }
  
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const list = [];
  // Generate 6 simulated districts dynamically
  for (let i = 0; i < 6; i++) {
    const variance = 0.6 + random() * 0.8;
    const value = Math.round(stateAverage * variance * 100) / 100;
    list.push({
      name: names[i],
      value,
      pop: `${Math.round(1 + random() * 6)}M`,
      gdp: Math.round(150000 * (0.5 + random() * 1.0)),
      isEstimated: true
    });
  }
  return list;
};

export default districtData;
