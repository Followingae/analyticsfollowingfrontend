export const getCountryCode = (location: string): string => {
  const locationMap: { [key: string]: string } = {
    // United States
    'New York, USA': 'US',
    'San Francisco, USA': 'US',
    'Miami, USA': 'US',
    'Nashville, USA': 'US',
    'Denver, USA': 'US',
    'Los Angeles, USA': 'US',
    'Chicago, USA': 'US',
    'Portland, USA': 'US',
    'Austin, USA': 'US',
    'Atlanta, USA': 'US',
    'San Diego, USA': 'US',
    'Silicon Valley, USA': 'US',
    'Beverly Hills, USA': 'US',
    
    // Italy
    'Rome, Italy': 'IT',
    'Milan, Italy': 'IT',
    
    // United Kingdom
    'London, UK': 'GB',
    
    // India
    'Mumbai, India': 'IN',
    'Rishikesh, India': 'IN',
    
    // France
    'Paris, France': 'FR',
    'Bordeaux, France': 'FR',
    'Lyon, France': 'FR',
    
    // Japan
    'Tokyo, Japan': 'JP',
    'Kyoto, Japan': 'JP',
    
    // Australia
    'Sydney, Australia': 'AU',
    'Melbourne, Australia': 'AU',
    'Byron Bay, Australia': 'AU',
    
    // Spain
    'Barcelona, Spain': 'ES',
    
    // Canada
    'Vancouver, Canada': 'CA',
    'Toronto, Canada': 'CA',
    'Banff, Canada': 'CA',
    
    // Germany
    'Berlin, Germany': 'DE',
    'Munich, Germany': 'DE',
    
    // Singapore
    'Singapore': 'SG',
    
    // South Korea
    'Seoul, South Korea': 'KR',
    
    // Hong Kong
    'Hong Kong': 'HK',
    
    // Denmark
    'Copenhagen, Denmark': 'DK',
    
    // Czech Republic
    'Prague, Czech Republic': 'CZ',
    
    // China
    'Beijing, China': 'CN',
    'Shanghai, China': 'CN',
    
    // Sweden
    'Stockholm, Sweden': 'SE',
    'Lapland, Sweden': 'SE',
    
    // Argentina
    'Buenos Aires, Argentina': 'AR',
    
    // Indonesia
    'Bali, Indonesia': 'ID',
    
    // Netherlands
    'Amsterdam, Netherlands': 'NL',
    
    // Switzerland
    'Zurich, Switzerland': 'CH',
    'Geneva, Switzerland': 'CH',
    
    // Monaco
    'Monaco': 'MC',
    'Monte Carlo, Monaco': 'MC',
    
    // New Zealand
    'Queenstown, New Zealand': 'NZ',
    
    // Thailand
    'Bangkok, Thailand': 'TH',
    
    // Mexico
    'Mexico City, Mexico': 'MX',
    'Tulum, Mexico': 'MX',
    
    // UAE
    'Dubai, UAE': 'AE',
    
    // Costa Rica
    'Costa Rica': 'CR',
    
    // Austria
    'Vienna, Austria': 'AT'
  }
  
  return locationMap[location] || 'UN' // UN for unknown/default
}