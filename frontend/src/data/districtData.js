import { stateData } from './stateData';

// Database of actual real district names for all Indian States & UTs
export const realDistrictNames = {
  "Andaman and Nicobar Islands": ["Port Blair", "Car Nicobar", "Mayabunder", "Havelock"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati", "Kurnool", "Anantapur", "Eluru", "Kadapa", "Kakinada"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro", "Pasighat", "Aalo", "Tezu", "Namsai", "Bomdila"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Begusarai", "Arrah", "Nalanda", "Munger"],
  "Chandigarh": ["Chandigarh City", "Manimajra", "Sarangpur"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Bhilai", "Korba", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur"],
  "Dadra and Nagar Haveli": ["Silvassa", "Khanvel"],
  "Daman and Diu": ["Daman", "Diu"],
  "Delhi": ["New Delhi", "South Delhi", "North Delhi", "East Delhi", "West Delhi", "Central Delhi", "Shahdara", "Dwarka", "Rohini"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Jamnagar", "Bhavnagar", "Anand", "Mehsana", "Morbi"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Rohtak", "Hisar", "Panchkula", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Kullu", "Hamirpur", "Chamba", "Una", "Kangra", "Bilaspur"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua", "Udhampur", "Kupwara", "Samba", "Pulwama", "Poonch"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Dumka", "Adityapur"],
  "Karnataka": ["Bengaluru Urban", "Mysuru", "Belagavi", "Dharwad", "Dakshina Kannada", "Kalaburagi", "Ballari", "Udupi", "Hubli", "Mangaluru"],
  "Kerala": ["Thiruvananthapuram", "Ernakulam (Kochi)", "Kozhikode", "Thrissur", "Malappuram", "Palakkad", "Kollam", "Alappuzha", "Kannur", "Kottayam"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti", "Agatti", "Minicoy"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Jhabua", "Ratlam"],
  "Maharashtra": ["Mumbai City", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Jalgaon"],
  "Manipur": ["Imphal East", "Imphal West", "Thoubal", "Churachandpur", "Senapati", "Ukhrul"],
  "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh", "Williamnagar", "Baghmara"],
  "Mizoram": ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip"],
  "Nagaland": ["Dimapur", "Kohima", "Mokokchung", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur", "Balasore", "Berhampur", "Angul", "Jajpur", "Jharsuguda"],
  "Puducherry": ["Puducherry City", "Karaikal", "Mahe", "Yanam"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Moga"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar", "Bhilwara", "Sikar", "Jaisalmer"],
  "Sikkim": ["Gangtok", "Namchi", "Geyzing", "Mangan"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Vellore", "Erode", "Thanjavur", "Tuticorin"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ranga Reddy", "Medchal", "Secunderabad", "Nalgonda"],
  "Tripura": ["Agartala", "Dharmanagar", "Udaipur", "Kailasahar", "Belonia", "Khowai"],
  "Uttar Pradesh": ["Noida (G.B. Nagar)", "Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Ghaziabad", "Meerut", "Aligarh", "Bareilly"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Nainital", "Rishikesh", "Haldwani", "Roorkee", "Almora", "Pithoragarh"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Hooghly", "Paschim Medinipur", "Purba Bardhaman", "Siliguri", "Asansol", "Kharagpur", "Haldia"]
};

// Seeded generator that produces realistic numbers for a list of real district names
export const getDistrictsForState = (stateName, stateAverage) => {
  const names = realDistrictNames[stateName] || [
    `${stateName} Metro`, `${stateName} Rural`, `${stateName} Urban`, 
    `${stateName} Coastal`, `${stateName} North`, `${stateName} South`
  ];

  // Get emission factor for state
  const stateObj = stateData.find(s => s.name === stateName);
  const factor = stateObj ? stateObj.emissionFactor : 0.85;

  let seed = 0;
  for (let i = 0; i < stateName.length; i++) {
    seed += stateName.charCodeAt(i);
  }
  
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const list = [];
  names.forEach((name) => {
    const variance = 0.65 + random() * 0.7; // Realistic range between 65% and 135% of state avg
    const electricityConsumption = Math.round(stateAverage * variance * 100) / 100;
    const carbonEmission = Math.round(electricityConsumption * factor * 100) / 100;
    list.push({
      name,
      value: electricityConsumption, // For backwards compatibility
      electricityConsumption,
      carbonEmission,
      pop: `${Math.round(0.5 + random() * 8)}M`,
      gdp: Math.round(150000 * (0.6 + random() * 1.2)),
      isEmissionEstimated: true
    });
  });

  return list;
};

// Hardcoded district data for initial loading of main demo states
export const districtData = {
  // Let the seeder dynamically compile everything from the realDistrictNames lookup to keep it uniform
};

export default districtData;
