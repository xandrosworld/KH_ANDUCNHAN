export interface Property {
  id: string;
  image: string;
  tag: string;
  tagColor: string;
  price: string;
  numericPrice: number;
  bds: number;
  ba: number;
  sqft: string;
  status: string;
  listingType: 'sale' | 'rent';
  address: string;
  city: string;
  state: string;
  propertyType: string;
  latitude?: number | null;
  longitude?: number | null;
  mls: string;
  description: string;

  // NEW fields (all optional so existing code doesn't break)
  images?: string[];
  videoUrl?: string;
  yearBuilt?: number;
  lotSize?: string;
  pricePerSqft?: number;
  hoaFee?: number | null;
  highlights?: string[];
  daysOnMarket?: number;
  listingViews?: number;
  listingSaves?: number;
  listedBy?: { name: string; phone: string; brokerage: string };

  // Facts & Features accordion data
  facts?: {
    interior?: { label: string; items: string[] }[];
    property?: { label: string; items: string[] }[];
    construction?: { label: string; items: string[] }[];
    utilities?: { label: string; items: string[] }[];
    community?: { label: string; items: string[] }[];
    financial?: { label: string; items: string[] }[];
  };

  // Price history table
  priceHistory?: { date: string; event: string; price: string; pricePerSqft: string }[];

  // Tax and scores
  annualTax?: number;
  walkScore?: number;
  bikeScore?: number;
  transitScore?: number;

  // Phase 2 fields
  photoCount?: number;
  floorPlanAvailable?: boolean;
  threeDHomeAvailable?: boolean;
  openHouse?: { date: string; time: string; }[];
  travelTimes?: { destination: string; drive: string; transit: string }[];
  offerInsights?: {
    strength: 'Strong' | 'Competitive' | 'Moderate' | 'Weak';
    estimatedRange: string;
    winChance: string;
  };
  marketValue?: {
    estimatedRange?: string;
    zestimate?: string;
    rentZestimate?: string;
  } | null;
  publicTaxHistory?: { year: string; tax: string; assessment: string }[];
  climateRisks?: {
    flood: { level: string; description: string };
    fire: { level: string; description: string };
    heat: { level: string; description: string };
    wind: { level: string; description: string };
  };
  nearbySchools?: {
    name: string;
    grades: string;
    distance: string;
    rating: number;
    type: 'Elementary' | 'Middle' | 'High';
  }[];
  localExperts?: {
    name: string;
    title: string;
    sales: number;
  }[];
  legalProtections?: string[];
  resourceLinks?: { label: string; count?: number }[];

  // Phase 3 — B1-B11 features
  numericSqft?: number;
  youtubeUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  xUrl?: string;
  whatsappUrl?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isVip?: boolean;
  createdAt?: string;
  expiresAt?: string;
  listingStatus?: 'active' | 'pending' | 'hidden' | 'expired';
}

const baseProperties: Property[] = [
  {
    id: 'prop-ca-001',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    tag: 'New Listing',
    tagColor: 'bg-emerald-600',
    price: '$2,450,000',
    numericPrice: 2450000,
    bds: 5,
    ba: 4,
    sqft: '4,200',
    status: 'For Sale',
    listingType: 'sale',
    address: '1234 Pacific Coast Hwy, Malibu, CA 90265',
    city: 'Malibu',
    state: 'California',
    propertyType: 'Single Family',
    mls: 'MLS# CA-20260501 · Compass Real Estate',
    description:
      `Stunning oceanfront estate with panoramic Pacific views, chef's kitchen with quartzite counters, infinity pool, and private beach access. Recently renovated with smart home automation throughout.`,
    // --- NEW FIELDS ---
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
    ],
    yearBuilt: 2019,
    lotSize: '0.35 acres',
    pricePerSqft: 583,
    hoaFee: null,
    highlights: ['OCEAN VIEWS', 'CHEF\'S KITCHEN', 'INFINITY POOL', 'SMART HOME', 'PRIVATE BEACH ACCESS', 'RECENTLY RENOVATED'],
    daysOnMarket: 3,
    listingViews: 842,
    listingSaves: 34,
    listedBy: { name: 'Sarah Mitchell', phone: '(310) 555-0147', brokerage: 'Compass Real Estate' },
    facts: {
      interior: [
        { label: 'Bedrooms & bathrooms', items: ['Bedrooms: 5', 'Bathrooms: 4', 'Full bathrooms: 3', 'Half bathrooms: 1'] },
        { label: 'Flooring', items: ['Hardwood', 'Italian Marble', 'Heated Tile'] },
        { label: 'Heating & cooling', items: ['Central AC', 'Forced Air', 'Smart Thermostat'] },
        { label: 'Kitchen & appliances', items: ['Quartzite counters', 'Wolf range', 'Sub-Zero refrigerator', 'Wine cooler', 'Double oven'] },
      ],
      property: [
        { label: 'Parking', items: ['Attached garage', '3-car garage', 'Driveway'] },
        { label: 'Lot', items: ['Lot size: 0.35 acres', 'Landscaped', 'Sprinkler system'] },
        { label: 'Other', items: ['Infinity pool', 'Outdoor kitchen', 'Fire pit', 'Beach access'] },
      ],
      construction: [
        { label: 'Type & style', items: ['Single family', 'Contemporary', 'Two stories'] },
        { label: 'Materials', items: ['Stucco exterior', 'Metal roof', 'Impact windows'] },
        { label: 'Condition', items: ['Renovated 2024', 'Move-in ready'] },
      ],
      utilities: [
        { label: 'Utilities', items: ['Solar panels', 'City water', 'City sewer', 'Natural gas'] },
      ],
      community: [
        { label: 'Community', items: ['No HOA', 'Gated community', 'Beach access', 'Private roads'] },
        { label: 'Neighborhood', items: ['Low crime area', 'Near parks', 'Quiet residential street'] },
      ],
      financial: [
        { label: 'Financial', items: ['Annual tax: $18,750', 'Tax year: 2025', 'Assessment: $1,875,000'] },
        { label: 'Listing', items: ['Days on market: 3', 'Original list price: $2,450,000', 'Source: MLS'] },
      ],
    },
    priceHistory: [
      { date: '05/18/2026', event: 'Listed for sale', price: '$2,450,000', pricePerSqft: '$583' },
      { date: '03/10/2022', event: 'Sold', price: '$1,850,000', pricePerSqft: '$440' },
      { date: '06/15/2019', event: 'Sold', price: '$1,200,000', pricePerSqft: '$286' },
    ],
    annualTax: 18750,
    walkScore: 62,
    bikeScore: 45,
    transitScore: 38,
    // Phase 2 fields
    photoCount: 49,
    floorPlanAvailable: true,
    threeDHomeAvailable: true,
    openHouse: [
      { date: 'Sat, May 24', time: '1:00 PM – 3:00 PM' },
      { date: 'Sun, May 25', time: '12:00 PM – 2:00 PM' },
    ],
    travelTimes: [
      { destination: 'Santa Monica', drive: '25 min', transit: '55 min' },
      { destination: 'LAX Airport', drive: '35 min', transit: '1 hr 20 min' },
      { destination: 'Downtown LA', drive: '45 min', transit: '1 hr 40 min' },
    ],
    offerInsights: {
      strength: 'Competitive',
      estimatedRange: '$2,350,000 – $2,550,000',
      winChance: 'Over 90%',
    },
    marketValue: {
      estimatedRange: '$2,300,000 – $2,600,000',
      zestimate: '$2,420,000',
      rentZestimate: '$8,500/mo',
    },
    publicTaxHistory: [
      { year: '2025', tax: '$18,750', assessment: '$1,875,000' },
      { year: '2024', tax: '$17,200', assessment: '$1,720,000' },
      { year: '2023', tax: '$15,800', assessment: '$1,580,000' },
    ],
    climateRisks: {
      flood: { level: 'Minimal', description: 'This property has minimal flood risk' },
      fire: { level: 'Major', description: 'This area has major wildfire risk' },
      heat: { level: 'Moderate', description: '7 hot days expected this year' },
      wind: { level: 'Minor', description: 'Minor wind risk from Santa Ana winds' },
    },
    nearbySchools: [
      { name: 'Malibu Elementary School', grades: 'K-5', distance: '0.8 mi', rating: 8, type: 'Elementary' },
      { name: 'Malibu Middle School', grades: '6-8', distance: '1.2 mi', rating: 7, type: 'Middle' },
      { name: 'Malibu High School', grades: '9-12', distance: '1.5 mi', rating: 8, type: 'High' },
    ],
    localExperts: [
      { name: 'Sarah Mitchell', title: 'Luxury Home Specialist', sales: 47 },
      { name: 'James Rivera', title: 'Beach Properties Expert', sales: 32 },
    ],
    legalProtections: ['Fair housing laws protect buyers and renters', 'California Civil Code §51 (Unruh Act)'],
    resourceLinks: [
      { label: '90265 homes for sale', count: 142 },
      { label: 'Malibu real estate', count: 89 },
      { label: 'California homes for sale', count: 15420 },
      { label: 'Beachfront homes', count: 234 },
    ],
  },
  {
    id: 'prop-tx-002',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    tag: 'Price Cut',
    tagColor: 'bg-red-600',
    price: '$875,000',
    numericPrice: 875000,
    bds: 4,
    ba: 3,
    sqft: '3,100',
    status: 'For Sale',
    listingType: 'sale',
    address: '9821 Westheimer Rd, Houston, TX 77042',
    city: 'Houston',
    state: 'Texas',
    propertyType: 'Single Family',
    mls: 'MLS# TX-20260492 · Keller Williams Realty',
    description:
      'Elegant two-story home in the Energy Corridor featuring an open floor plan, gourmet kitchen, private study, and a resort-style backyard with covered patio and outdoor kitchen.',
    // --- NEW FIELDS ---
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    ],
    yearBuilt: 2017,
    lotSize: '0.28 acres',
    pricePerSqft: 282,
    hoaFee: 175,
    highlights: ['PRICE REDUCED', 'GOURMET KITCHEN', 'OUTDOOR KITCHEN', 'COVERED PATIO', 'ENERGY CORRIDOR', 'OPEN FLOOR PLAN'],
    daysOnMarket: 14,
    listingViews: 1203,
    listingSaves: 56,
    listedBy: { name: 'James Rodriguez', phone: '(713) 555-0283', brokerage: 'Keller Williams Realty' },
    facts: {
      interior: [
        { label: 'Bedrooms & bathrooms', items: ['Bedrooms: 4', 'Bathrooms: 3', 'Full bathrooms: 2', 'Half bathrooms: 1'] },
        { label: 'Flooring', items: ['Engineered Hardwood', 'Ceramic Tile', 'Carpet'] },
        { label: 'Heating & cooling', items: ['Central AC (2 zones)', 'Gas Furnace', 'Ceiling Fans'] },
        { label: 'Kitchen & appliances', items: ['Granite counters', 'Gas range', 'Double oven', 'Stainless steel appliances', 'Kitchen island'] },
      ],
      property: [
        { label: 'Parking', items: ['Attached garage', '2-car garage', 'Extended driveway'] },
        { label: 'Lot', items: ['Lot size: 0.28 acres', 'Fenced backyard', 'Mature trees', 'Sprinkler system'] },
        { label: 'Other', items: ['Covered patio', 'Outdoor kitchen', 'Gas fire pit', 'Play area'] },
      ],
      construction: [
        { label: 'Type & style', items: ['Single family', 'Traditional', 'Two stories'] },
        { label: 'Materials', items: ['Brick & stone exterior', 'Composition roof', 'Double-pane windows'] },
        { label: 'Condition', items: ['Well-maintained', 'Updated 2023'] },
      ],
      utilities: [
        { label: 'Utilities', items: ['City water', 'City sewer', 'Natural gas', 'Electric'] },
      ],
    },
    priceHistory: [
      { date: '05/07/2026', event: 'Price change', price: '$875,000', pricePerSqft: '$282' },
      { date: '04/15/2026', event: 'Listed for sale', price: '$925,000', pricePerSqft: '$298' },
      { date: '08/20/2020', event: 'Sold', price: '$710,000', pricePerSqft: '$229' },
      { date: '11/05/2017', event: 'Sold', price: '$585,000', pricePerSqft: '$189' },
    ],
    annualTax: 14200,
    walkScore: 48,
    bikeScore: 55,
    transitScore: 35,
    // Phase 2 fields
    photoCount: 35,
    floorPlanAvailable: true,
    threeDHomeAvailable: false,
    openHouse: [
      { date: 'Sat, May 24', time: '10:00 AM – 12:00 PM' },
    ],
    travelTimes: [
      { destination: 'Downtown Houston', drive: '20 min', transit: '45 min' },
      { destination: 'Houston Galleria', drive: '10 min', transit: '30 min' },
      { destination: 'IAH Airport', drive: '35 min', transit: '1 hr 15 min' },
    ],
    offerInsights: {
      strength: 'Strong',
      estimatedRange: '$850,000 – $900,000',
      winChance: 'Over 85%',
    },
    marketValue: {
      estimatedRange: '$840,000 – $910,000',
      zestimate: '$878,000',
      rentZestimate: '$3,800/mo',
    },
    publicTaxHistory: [
      { year: '2025', tax: '$14,200', assessment: '$820,000' },
      { year: '2024', tax: '$13,500', assessment: '$785,000' },
      { year: '2023', tax: '$12,800', assessment: '$745,000' },
    ],
    climateRisks: {
      flood: { level: 'Major', description: 'This area is in a flood-prone zone' },
      fire: { level: 'Minimal', description: 'Minimal wildfire risk in this area' },
      heat: { level: 'Major', description: '28 hot days expected this year' },
      wind: { level: 'Moderate', description: 'Moderate hurricane/storm risk' },
    },
    nearbySchools: [
      { name: 'Briargrove Elementary', grades: 'K-5', distance: '0.5 mi', rating: 7, type: 'Elementary' },
      { name: 'Grady Middle School', grades: '6-8', distance: '1.0 mi', rating: 6, type: 'Middle' },
      { name: 'Westside High School', grades: '9-12', distance: '1.8 mi', rating: 7, type: 'High' },
    ],
    localExperts: [
      { name: 'James Rodriguez', title: 'Energy Corridor Specialist', sales: 38 },
      { name: 'Patricia Nguyen', title: 'Houston Luxury Agent', sales: 29 },
    ],
    legalProtections: ['Fair housing laws protect buyers and renters', 'Texas Property Code Chapter 5'],
    resourceLinks: [
      { label: '77042 homes for sale', count: 98 },
      { label: 'Houston real estate', count: 2450 },
      { label: 'Texas homes for sale', count: 32100 },
      { label: 'Energy Corridor homes', count: 67 },
    ],
  },
  {
    id: 'prop-fl-003',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    tag: 'Open House',
    tagColor: 'bg-blue-600',
    price: '$1,695,000',
    numericPrice: 1695000,
    bds: 4,
    ba: 5,
    sqft: '3,800',
    status: 'For Sale',
    listingType: 'sale',
    address: '450 Royal Palm Way, Boca Raton, FL 33432',
    city: 'Boca Raton',
    state: 'Florida',
    propertyType: 'Single Family',
    mls: 'MLS# FL-20260388 · Douglas Elliman',
    description:
      'Luxurious waterfront property in Royal Palm Yacht & Country Club. Features a grand foyer, imported marble floors, summer kitchen, heated saltwater pool, and 80-foot dock.',
    // --- NEW FIELDS ---
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
    ],
    yearBuilt: 2015,
    lotSize: '0.42 acres',
    pricePerSqft: 446,
    hoaFee: 850,
    highlights: ['WATERFRONT', 'PRIVATE DOCK', 'SALTWATER POOL', 'MARBLE FLOORS', 'SUMMER KITCHEN', 'COUNTRY CLUB'],
    daysOnMarket: 7,
    listingViews: 1567,
    listingSaves: 78,
    listedBy: { name: 'Victoria Chen', phone: '(561) 555-0392', brokerage: 'Douglas Elliman' },
    facts: {
      interior: [
        { label: 'Bedrooms & bathrooms', items: ['Bedrooms: 4', 'Bathrooms: 5', 'Full bathrooms: 4', 'Half bathrooms: 1'] },
        { label: 'Flooring', items: ['Imported Marble', 'Travertine', 'Custom Carpet'] },
        { label: 'Heating & cooling', items: ['Central AC (3 zones)', 'Heat Pump', 'Dehumidifier'] },
        { label: 'Kitchen & appliances', items: ['Custom cabinetry', 'Thermador appliances', 'Granite island', 'Built-in espresso machine', 'Walk-in pantry'] },
      ],
      property: [
        { label: 'Parking', items: ['Attached garage', '3-car garage', 'Circular driveway'] },
        { label: 'Lot', items: ['Lot size: 0.42 acres', 'Waterfront', '80-foot dock', 'Seawall'] },
        { label: 'Other', items: ['Heated saltwater pool', 'Summer kitchen', 'Cabana', 'Boat lift'] },
      ],
      construction: [
        { label: 'Type & style', items: ['Single family', 'Mediterranean', 'Two stories'] },
        { label: 'Materials', items: ['CBS construction', 'Barrel tile roof', 'Impact windows & doors'] },
        { label: 'Condition', items: ['Excellent', 'Updated 2023'] },
      ],
      utilities: [
        { label: 'Utilities', items: ['FPL electric', 'City water', 'City sewer', 'Cable ready', 'Generator'] },
      ],
    },
    priceHistory: [
      { date: '05/14/2026', event: 'Listed for sale', price: '$1,695,000', pricePerSqft: '$446' },
      { date: '01/22/2021', event: 'Sold', price: '$1,350,000', pricePerSqft: '$355' },
      { date: '09/18/2015', event: 'Sold', price: '$980,000', pricePerSqft: '$258' },
    ],
    annualTax: 22100,
    walkScore: 55,
    bikeScore: 68,
    transitScore: 28,
  },
  {
    id: 'prop-ny-004',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    tag: 'Featured',
    tagColor: 'bg-amber-600',
    price: '$3,200,000',
    numericPrice: 3200000,
    bds: 3,
    ba: 3,
    sqft: '2,400',
    status: 'For Sale',
    listingType: 'sale',
    address: '88 Greenwich St, Apt 38F, New York, NY 10006',
    city: 'New York',
    state: 'New York',
    propertyType: 'Condo',
    mls: `MLS# NY-20260715 · Sotheby's International Realty`,
    description:
      'Full-floor penthouse condo in the Financial District offering floor-to-ceiling windows, Hudson River views, Bulthaup kitchen, private terrace, and full-service building amenities.',
    // --- NEW FIELDS ---
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80',
    ],
    yearBuilt: 2020,
    lotSize: 'N/A',
    pricePerSqft: 1333,
    hoaFee: 2850,
    highlights: ['PENTHOUSE', 'HUDSON RIVER VIEWS', 'PRIVATE TERRACE', 'FULL-SERVICE BUILDING', 'BULTHAUP KITCHEN', 'FLOOR-TO-CEILING WINDOWS'],
    daysOnMarket: 21,
    listingViews: 2341,
    listingSaves: 112,
    listedBy: { name: 'Michael Hartman', phone: '(212) 555-0618', brokerage: "Sotheby's International Realty" },
    facts: {
      interior: [
        { label: 'Bedrooms & bathrooms', items: ['Bedrooms: 3', 'Bathrooms: 3', 'Full bathrooms: 2', 'Half bathrooms: 1'] },
        { label: 'Flooring', items: ['Wide-plank White Oak', 'Heated Marble (bathrooms)'] },
        { label: 'Heating & cooling', items: ['Central AC', 'Radiant floor heating', 'Individual climate control'] },
        { label: 'Kitchen & appliances', items: ['Bulthaup cabinetry', 'Miele appliances', 'Wine refrigerator', 'Vented range hood', 'Waterfall island'] },
      ],
      property: [
        { label: 'Parking', items: ['Valet parking available', 'Monthly garage rental ($650/mo)'] },
        { label: 'Building amenities', items: ['24-hour doorman', 'Concierge', 'Fitness center', 'Residents\' lounge', 'Children\'s playroom', 'Rooftop terrace'] },
        { label: 'Other', items: ['Private storage unit', 'Bike room', 'Package room', 'Pet-friendly'] },
      ],
      construction: [
        { label: 'Type & style', items: ['Condo', 'Modern high-rise', '38th floor'] },
        { label: 'Materials', items: ['Steel & glass curtain wall', 'Reinforced concrete'] },
        { label: 'Condition', items: ['Like-new', 'Built 2020'] },
      ],
      utilities: [
        { label: 'Utilities', items: ['Con Edison electric', 'City water', 'City sewer', 'Central gas'] },
      ],
    },
    priceHistory: [
      { date: '04/28/2026', event: 'Listed for sale', price: '$3,200,000', pricePerSqft: '$1,333' },
      { date: '07/15/2020', event: 'Sold (new construction)', price: '$2,900,000', pricePerSqft: '$1,208' },
    ],
    annualTax: 32400,
    walkScore: 97,
    bikeScore: 82,
    transitScore: 100,
  },
  {
    id: 'prop-il-005',
    image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
    tag: 'New Listing',
    tagColor: 'bg-emerald-600',
    price: '$549,000',
    numericPrice: 549000,
    bds: 3,
    ba: 2,
    sqft: '2,100',
    status: 'For Sale',
    listingType: 'sale',
    address: '2145 N Lincoln Park West, Chicago, IL 60614',
    city: 'Chicago',
    state: 'Illinois',
    propertyType: 'Townhouse',
    mls: `MLS# IL-20260623 · @properties Christie's`,
    description:
      'Charming Lincoln Park townhouse with exposed brick, hardwood floors, private rooftop deck with skyline views, and a two-car heated garage. Steps from the lakefront trail.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80'],
    yearBuilt: 2005,
    lotSize: '0.05 acres',
    pricePerSqft: 261,
    hoaFee: 350,
    highlights: ['UPDATED KITCHEN', 'ROOFTOP DECK', 'SKYLINE VIEWS'],
    daysOnMarket: 5,
    listingViews: 423,
    listingSaves: 19,
    listedBy: { name: 'Karen Walsh', phone: '(312) 555-0184', brokerage: "@properties Christie's" },
  },
  {
    id: 'prop-pa-006',
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
    tag: 'Open House',
    tagColor: 'bg-blue-600',
    price: '$425,000',
    numericPrice: 425000,
    bds: 4,
    ba: 2,
    sqft: '2,600',
    status: 'For Sale',
    listingType: 'sale',
    address: '312 Spruce St, Philadelphia, PA 19106',
    city: 'Philadelphia',
    state: 'Pennsylvania',
    propertyType: 'Townhouse',
    mls: 'MLS# PA-20260814 · Coldwell Banker Realty',
    description:
      'Historic Society Hill townhouse fully renovated with modern amenities. Original heart pine floors, exposed stone walls, gourmet kitchen, and a serene private courtyard garden.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80'],
    yearBuilt: 1810,
    lotSize: '0.03 acres',
    pricePerSqft: 163,
    hoaFee: null,
    highlights: ['HISTORIC HOME', 'FULLY RENOVATED', 'COURTYARD GARDEN'],
    daysOnMarket: 10,
    listingViews: 612,
    listingSaves: 28,
    listedBy: { name: 'David Kim', phone: '(215) 555-0297', brokerage: 'Coldwell Banker Realty' },
  },
  {
    id: 'prop-oh-007',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    tag: 'New Construction',
    tagColor: 'bg-purple-600',
    price: '$389,000',
    numericPrice: 389000,
    bds: 4,
    ba: 3,
    sqft: '2,800',
    status: 'For Sale',
    listingType: 'sale',
    address: '6720 Riverside Dr, Dublin, OH 43017',
    city: 'Dublin',
    state: 'Ohio',
    propertyType: 'Single Family',
    mls: 'MLS# OH-20260209 · HER Realtors',
    description:
      'Brand-new construction in the award-winning Dublin City Schools district. Open-concept living, quartz countertops, LVP flooring, energy-efficient build, and a landscaped quarter-acre lot.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'],
    yearBuilt: 2026,
    lotSize: '0.25 acres',
    pricePerSqft: 139,
    hoaFee: 120,
    highlights: ['NEW CONSTRUCTION', 'ENERGY EFFICIENT', 'MOVE-IN READY'],
    daysOnMarket: 2,
    listingViews: 315,
    listingSaves: 12,
    listedBy: { name: 'Tom Bradley', phone: '(614) 555-0341', brokerage: 'HER Realtors' },
  },
  {
    id: 'prop-ga-008',
    image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
    tag: 'Price Cut',
    tagColor: 'bg-red-600',
    price: '$615,000',
    numericPrice: 615000,
    bds: 5,
    ba: 4,
    sqft: '3,500',
    status: 'For Sale',
    listingType: 'sale',
    address: '1488 Peachtree Battle Ave NW, Atlanta, GA 30327',
    city: 'Atlanta',
    state: 'Georgia',
    propertyType: 'Single Family',
    mls: 'MLS# GA-20260551 · Harry Norman Realtors',
    description:
      `Stately Buckhead residence on a tree-lined street with a chef's kitchen, fireside great room, screened porch, finished terrace level, and a fenced backyard with mature landscaping.`,
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80'],
    yearBuilt: 1998,
    lotSize: '0.38 acres',
    pricePerSqft: 176,
    hoaFee: null,
    highlights: ['PRICE REDUCED', 'UPDATED KITCHEN', 'SCREENED PORCH'],
    daysOnMarket: 22,
    listingViews: 987,
    listingSaves: 41,
    listedBy: { name: 'Angela Foster', phone: '(404) 555-0459', brokerage: 'Harry Norman Realtors' },
  },
  {
    id: 'prop-nc-009',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    tag: 'Featured',
    tagColor: 'bg-amber-600',
    price: '$725,000',
    numericPrice: 725000,
    bds: 4,
    ba: 3,
    sqft: '3,200',
    status: 'For Sale',
    listingType: 'sale',
    address: '204 Meadowmont Village Cir, Chapel Hill, NC 27517',
    city: 'Chapel Hill',
    state: 'North Carolina',
    propertyType: 'Single Family',
    mls: 'MLS# NC-20260430 · RE/MAX United',
    description:
      'Elegant residence in Meadowmont with a wraparound porch, vaulted ceilings, custom built-ins, first-floor primary suite, and a private backyard bordering community nature trails.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'],
    yearBuilt: 2010,
    lotSize: '0.31 acres',
    pricePerSqft: 227,
    hoaFee: 200,
    highlights: ['UPDATED KITCHEN', 'NATURE TRAILS', 'MOVE-IN READY'],
    daysOnMarket: 11,
    listingViews: 534,
    listingSaves: 23,
    listedBy: { name: 'Lisa Tran', phone: '(919) 555-0528', brokerage: 'RE/MAX United' },
  },
  {
    id: 'prop-mi-010',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    tag: 'New Listing',
    tagColor: 'bg-emerald-600',
    price: '$340,000',
    numericPrice: 340000,
    bds: 3,
    ba: 2,
    sqft: '1,950',
    status: 'For Sale',
    listingType: 'sale',
    address: '1827 Wellesley Dr, Royal Oak, MI 48073',
    city: 'Royal Oak',
    state: 'Michigan',
    propertyType: 'Single Family',
    mls: 'MLS# MI-20260177 · Max Broock Realtors',
    description:
      'Updated Royal Oak bungalow with a modern open layout, renovated kitchen with stainless appliances, finished basement, new windows, and a spacious lot with detached two-car garage.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80'],
    yearBuilt: 1952,
    lotSize: '0.18 acres',
    pricePerSqft: 174,
    hoaFee: null,
    highlights: ['UPDATED KITCHEN', 'FINISHED BASEMENT', 'MOVE-IN READY'],
    daysOnMarket: 4,
    listingViews: 278,
    listingSaves: 15,
    listedBy: { name: 'Robert Chen', phone: '(248) 555-0633', brokerage: 'Max Broock Realtors' },
  },
  // --- New sale properties ---
  {
    id: 'prop-az-001',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    tag: 'Hot Home',
    tagColor: 'bg-orange-600',
    price: '$685,000',
    numericPrice: 685000,
    bds: 4,
    ba: 3,
    sqft: '2,950',
    status: 'For Sale',
    listingType: 'sale',
    address: '7340 E Solano Dr, Scottsdale, AZ 85250',
    city: 'Scottsdale',
    state: 'Arizona',
    propertyType: 'Single Family',
    mls: 'MLS# AZ-20260901 · Realty ONE Group',
    description:
      `Desert contemporary home in South Scottsdale with a sparkling pool, mountain views, split floor plan, designer kitchen with waterfall island, and a three-car garage. Minutes from Old Town's dining and nightlife.`,
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'],
    yearBuilt: 2014,
    lotSize: '0.22 acres',
    pricePerSqft: 232,
    hoaFee: 95,
    highlights: ['POOL', 'MOUNTAIN VIEWS', 'MOVE-IN READY'],
    daysOnMarket: 6,
    listingViews: 701,
    listingSaves: 33,
    listedBy: { name: 'Mark Stevens', phone: '(480) 555-0742', brokerage: 'Realty ONE Group' },
  },
  {
    id: 'prop-co-001',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    tag: 'New Listing',
    tagColor: 'bg-emerald-600',
    price: '$1,125,000',
    numericPrice: 1125000,
    bds: 5,
    ba: 4,
    sqft: '3,600',
    status: 'For Sale',
    listingType: 'sale',
    address: '2480 S Josephine St, Denver, CO 80210',
    city: 'Denver',
    state: 'Colorado',
    propertyType: 'Single Family',
    mls: 'MLS# CO-20260915 · LIV Sotheby\'s International',
    description:
      `Beautifully remodeled University Park home featuring a chef's kitchen, main-floor office, finished basement with wet bar, solar panels, and a landscaped backyard with Adirondack fire pit and mountain sunset views.`,
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'],
    yearBuilt: 2008,
    lotSize: '0.19 acres',
    pricePerSqft: 313,
    hoaFee: null,
    highlights: ['SOLAR PANELS', 'MOUNTAIN VIEWS', 'UPDATED KITCHEN'],
    daysOnMarket: 3,
    listingViews: 489,
    listingSaves: 21,
    listedBy: { name: 'Jennifer Moore', phone: '(303) 555-0851', brokerage: "LIV Sotheby's International" },
  },
  {
    id: 'prop-wa-001',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
    tag: 'Open House',
    tagColor: 'bg-blue-600',
    price: '$899,000',
    numericPrice: 899000,
    bds: 3,
    ba: 3,
    sqft: '2,200',
    status: 'For Sale',
    listingType: 'sale',
    address: '4512 NE 55th St, Seattle, WA 98105',
    city: 'Seattle',
    state: 'Washington',
    propertyType: 'Townhouse',
    mls: 'MLS# WA-20260922 · Windermere Real Estate',
    description:
      'Modern Craftsman townhouse in Laurelhurst with rooftop deck, Puget Sound views, gourmet kitchen with Sub-Zero appliances, radiant heated floors, and a two-car attached garage. Walk to University Village shops.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80'],
    yearBuilt: 2018,
    lotSize: '0.04 acres',
    pricePerSqft: 409,
    hoaFee: 275,
    highlights: ['ROOFTOP DECK', 'PUGET SOUND VIEWS', 'MOVE-IN READY'],
    daysOnMarket: 8,
    listingViews: 612,
    listingSaves: 29,
    listedBy: { name: 'Chris Parker', phone: '(206) 555-0963', brokerage: 'Windermere Real Estate' },
  },
  {
    id: 'prop-nc-001',
    image: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
    tag: 'Price Cut',
    tagColor: 'bg-red-600',
    price: '$475,000',
    numericPrice: 475000,
    bds: 4,
    ba: 3,
    sqft: '2,750',
    status: 'For Sale',
    listingType: 'sale',
    address: '9102 Whitfield Ln, Charlotte, NC 28277',
    city: 'Charlotte',
    state: 'North Carolina',
    propertyType: 'Single Family',
    mls: 'MLS# NC-20260935 · Allen Tate Realtors',
    description:
      'Spacious Ballantyne-area home with an open-concept great room, granite kitchen island, bonus room above the garage, screened porch, and a fenced backyard backing to a wooded greenway.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80'],
    yearBuilt: 2012,
    lotSize: '0.29 acres',
    pricePerSqft: 173,
    hoaFee: 160,
    highlights: ['PRICE REDUCED', 'BONUS ROOM', 'WOODED LOT'],
    daysOnMarket: 18,
    listingViews: 834,
    listingSaves: 37,
    listedBy: { name: 'Stephanie Hall', phone: '(704) 555-0172', brokerage: 'Allen Tate Realtors' },
  },
  {
    id: 'prop-or-001',
    image: 'https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=800&q=80',
    tag: 'Featured',
    tagColor: 'bg-amber-600',
    price: '$565,000',
    numericPrice: 565000,
    bds: 3,
    ba: 2,
    sqft: '1,850',
    status: 'For Sale',
    listingType: 'sale',
    address: '3215 SE Hawthorne Blvd, Portland, OR 97214',
    city: 'Portland',
    state: 'Oregon',
    propertyType: 'Condo',
    mls: 'MLS# OR-20260948 · Cascade Hasson Sotheby\'s',
    description:
      `Mid-century modern condo in the heart of Hawthorne with floor-to-ceiling windows, exposed beam ceilings, updated chef's kitchen, private balcony, and secured underground parking. Steps from Portland's best cafes and boutiques.`,
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=800&q=80'],
    yearBuilt: 1962,
    lotSize: 'N/A',
    pricePerSqft: 305,
    hoaFee: 425,
    highlights: ['MID-CENTURY MODERN', 'UPDATED KITCHEN', 'WALKABLE NEIGHBORHOOD'],
    daysOnMarket: 9,
    listingViews: 567,
    listingSaves: 24,
    listedBy: { name: 'Amy Richardson', phone: '(503) 555-0284', brokerage: "Cascade Hasson Sotheby's" },
  },
  // --- Rental properties ---
  {
    id: 'prop-ca-r01',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    tag: 'Available Now',
    tagColor: 'bg-teal-600',
    price: '$4,800/mo',
    numericPrice: 4800,
    bds: 2,
    ba: 2,
    sqft: '1,200',
    status: 'For Rent',
    listingType: 'rent',
    address: '1100 Wilshire Blvd, Apt 2204, Los Angeles, CA 90017',
    city: 'Los Angeles',
    state: 'California',
    propertyType: 'Condo',
    mls: 'MLS# CA-R20260801 · Compass Rentals',
    description:
      'Modern high-rise condo in Downtown LA with skyline views, in-unit laundry, stainless steel appliances, rooftop pool, and 24-hour concierge. Walk to Metro and restaurants.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'],
    yearBuilt: 2021,
    lotSize: 'N/A',
    pricePerSqft: 4,
    hoaFee: null,
    highlights: ['SKYLINE VIEWS', 'ROOFTOP POOL'],
    daysOnMarket: 3,
    listingViews: 345,
    listingSaves: 18,
    listedBy: { name: 'Rachel Green', phone: '(213) 555-0391', brokerage: 'Compass Rentals' },
    // Phase 2 fields
    photoCount: 28,
    floorPlanAvailable: true,
    threeDHomeAvailable: true,
    openHouse: [
      { date: 'Sun, May 25', time: '11:00 AM – 1:00 PM' },
    ],
    travelTimes: [
      { destination: 'Santa Monica', drive: '30 min', transit: '50 min' },
      { destination: 'Hollywood', drive: '15 min', transit: '25 min' },
      { destination: 'LAX Airport', drive: '25 min', transit: '55 min' },
    ],
    marketValue: {
      estimatedRange: '$4,500/mo – $5,200/mo',
      rentZestimate: '$4,900/mo',
    },
    climateRisks: {
      flood: { level: 'Minimal', description: 'This property has minimal flood risk' },
      fire: { level: 'Minor', description: 'Low wildfire risk in urban area' },
      heat: { level: 'Moderate', description: '12 hot days expected this year' },
      wind: { level: 'Minimal', description: 'Minimal wind risk' },
    },
    nearbySchools: [
      { name: 'Downtown Magnets High School', grades: '9-12', distance: '0.6 mi', rating: 9, type: 'High' },
      { name: '9th Street Elementary', grades: 'K-5', distance: '0.4 mi', rating: 6, type: 'Elementary' },
      { name: 'John Adams Middle School', grades: '6-8', distance: '1.1 mi', rating: 5, type: 'Middle' },
    ],
    localExperts: [
      { name: 'Rachel Green', title: 'DTLA Rental Specialist', sales: 52 },
    ],
    legalProtections: ['Fair housing laws protect buyers and renters', 'Los Angeles Rent Stabilization Ordinance', 'California Tenant Protection Act (AB 1482)'],
    resourceLinks: [
      { label: '90017 apartments for rent', count: 312 },
      { label: 'Los Angeles rentals', count: 4520 },
      { label: 'Downtown LA apartments', count: 876 },
      { label: 'California rentals', count: 18900 },
    ],
  },
  {
    id: 'prop-ny-r02',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    tag: 'Featured Rental',
    tagColor: 'bg-amber-600',
    price: '$6,500/mo',
    numericPrice: 6500,
    bds: 3,
    ba: 2,
    sqft: '1,800',
    status: 'For Rent',
    listingType: 'rent',
    address: '200 E 66th St, Apt 14B, New York, NY 10065',
    city: 'New York',
    state: 'New York',
    propertyType: 'Condo',
    mls: 'MLS# NY-R20260315 · Douglas Elliman Rentals',
    description:
      `Spacious Upper East Side apartment with Central Park proximity, hardwood floors, chef's kitchen, doorman building, gym, and private storage. Pet-friendly and available immediately.`,
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'],
    yearBuilt: 2016,
    lotSize: 'N/A',
    pricePerSqft: 4,
    hoaFee: null,
    highlights: ['CENTRAL PARK PROXIMITY', 'DOORMAN BUILDING'],
    daysOnMarket: 7,
    listingViews: 892,
    listingSaves: 47,
    listedBy: { name: 'Daniel Russo', phone: '(212) 555-0482', brokerage: 'Douglas Elliman Rentals' },
  },
  {
    id: 'prop-fl-r03',
    image: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80',
    tag: 'New Rental',
    tagColor: 'bg-emerald-600',
    price: '$3,200/mo',
    numericPrice: 3200,
    bds: 3,
    ba: 2,
    sqft: '1,600',
    status: 'For Rent',
    listingType: 'rent',
    address: '780 NE 69th St, Miami, FL 33138',
    city: 'Miami',
    state: 'Florida',
    propertyType: 'Single Family',
    mls: `MLS# FL-R20260422 · ONE Sotheby's Rentals`,
    description:
      'Bright and airy Miami Shores rental with tropical landscaping, updated kitchen, screened patio, two-car garage, and minutes to beaches, dining, and top-rated schools.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80'],
    yearBuilt: 2003,
    lotSize: '0.15 acres',
    pricePerSqft: 2,
    hoaFee: null,
    highlights: ['UPDATED KITCHEN', 'NEAR BEACHES'],
    daysOnMarket: 5,
    listingViews: 267,
    listingSaves: 14,
    listedBy: { name: 'Sofia Martinez', phone: '(305) 555-0573', brokerage: "ONE Sotheby's Rentals" },
  },
  {
    id: 'prop-tx-r04',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    tag: 'Available Now',
    tagColor: 'bg-teal-600',
    price: '$2,100/mo',
    numericPrice: 2100,
    bds: 2,
    ba: 2,
    sqft: '1,050',
    status: 'For Rent',
    listingType: 'rent',
    address: '1717 Arts Plaza, Apt 1806, Dallas, TX 75201',
    city: 'Dallas',
    state: 'Texas',
    propertyType: 'Condo',
    mls: 'MLS# TX-R20260610 · Keller Williams Rentals',
    description:
      'Luxury apartment in the Arts District with floor-to-ceiling windows, quartz counters, resort-style pool, fitness center, and walking distance to Klyde Warren Park.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80'],
    yearBuilt: 2019,
    lotSize: 'N/A',
    pricePerSqft: 2,
    hoaFee: null,
    highlights: ['ARTS DISTRICT', 'RESORT-STYLE POOL'],
    daysOnMarket: 2,
    listingViews: 198,
    listingSaves: 11,
    listedBy: { name: 'Brian Taylor', phone: '(214) 555-0664', brokerage: 'Keller Williams Rentals' },
  },
  {
    id: 'prop-il-r05',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    tag: 'Featured Rental',
    tagColor: 'bg-amber-600',
    price: '$2,850/mo',
    numericPrice: 2850,
    bds: 1,
    ba: 1,
    sqft: '900',
    status: 'For Rent',
    listingType: 'rent',
    address: '500 N Lake Shore Dr, Apt 3210, Chicago, IL 60611',
    city: 'Chicago',
    state: 'Illinois',
    propertyType: 'Condo',
    mls: 'MLS# IL-R20260503 · @properties Rentals',
    description:
      'Stunning Streeterville high-rise with unobstructed lake views, modern finishes, floor-to-ceiling windows, in-building amenities including pool, gym, and dog run.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'],
    yearBuilt: 2017,
    lotSize: 'N/A',
    pricePerSqft: 3,
    hoaFee: null,
    highlights: ['LAKE VIEWS', 'FULL AMENITIES'],
    daysOnMarket: 6,
    listingViews: 456,
    listingSaves: 22,
    listedBy: { name: 'Nicole Adams', phone: '(312) 555-0755', brokerage: '@properties Rentals' },
  },
  // --- New rental properties ---
  {
    id: 'prop-nv-001',
    image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80',
    tag: 'Available Now',
    tagColor: 'bg-teal-600',
    price: '$2,400/mo',
    numericPrice: 2400,
    bds: 3,
    ba: 2,
    sqft: '1,500',
    status: 'For Rent',
    listingType: 'rent',
    address: '8520 S Eastern Ave, Apt 312, Las Vegas, NV 89123',
    city: 'Las Vegas',
    state: 'Nevada',
    propertyType: 'Condo',
    mls: 'MLS# NV-R20260701 · Signature Real Estate Rentals',
    description:
      'Gated community condo in Henderson with mountain views, granite countertops, walk-in closets, community pool and spa, and easy access to the Las Vegas Strip and airport.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80'],
    yearBuilt: 2015,
    lotSize: 'N/A',
    pricePerSqft: 2,
    hoaFee: null,
    highlights: ['MOUNTAIN VIEWS', 'GATED COMMUNITY'],
    daysOnMarket: 4,
    listingViews: 223,
    listingSaves: 9,
    listedBy: { name: 'Tony Diaz', phone: '(702) 555-0846', brokerage: 'Signature Real Estate Rentals' },
  },
  {
    id: 'prop-tn-001',
    image: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80',
    tag: 'New Rental',
    tagColor: 'bg-emerald-600',
    price: '$3,100/mo',
    numericPrice: 3100,
    bds: 3,
    ba: 2,
    sqft: '1,700',
    status: 'For Rent',
    listingType: 'rent',
    address: '1205 8th Ave S, Nashville, TN 37203',
    city: 'Nashville',
    state: 'Tennessee',
    propertyType: 'Townhouse',
    mls: 'MLS# TN-R20260718 · Parks Realty Rentals',
    description:
      `Contemporary Gulch townhouse with rooftop terrace, open-concept living, designer finishes, smart home features, and a one-car garage. Walking distance to Nashville's best restaurants and live music venues.`,
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80'],
    yearBuilt: 2020,
    lotSize: '0.03 acres',
    pricePerSqft: 2,
    hoaFee: null,
    highlights: ['ROOFTOP TERRACE', 'SMART HOME'],
    daysOnMarket: 3,
    listingViews: 312,
    listingSaves: 16,
    listedBy: { name: 'Emily Brooks', phone: '(615) 555-0937', brokerage: 'Parks Realty Rentals' },
  },
  {
    id: 'prop-ga-002',
    image: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=80',
    tag: 'Hot Home',
    tagColor: 'bg-orange-600',
    price: '$2,750/mo',
    numericPrice: 2750,
    bds: 4,
    ba: 3,
    sqft: '2,200',
    status: 'For Rent',
    listingType: 'rent',
    address: '3350 Peachtree Rd NE, Apt 1408, Atlanta, GA 30326',
    city: 'Atlanta',
    state: 'Georgia',
    propertyType: 'Condo',
    mls: 'MLS# GA-R20260725 · Berkshire Hathaway Rentals',
    description:
      'Upscale Buckhead high-rise with panoramic city views, marble bathrooms, concierge service, resort-style pool, and direct access to Lenox Square and Phipps Plaza shopping.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=80'],
    yearBuilt: 2018,
    lotSize: 'N/A',
    pricePerSqft: 1,
    hoaFee: null,
    highlights: ['CITY VIEWS', 'CONCIERGE SERVICE'],
    daysOnMarket: 5,
    listingViews: 412,
    listingSaves: 20,
    listedBy: { name: 'Marcus Johnson', phone: '(404) 555-0128', brokerage: 'Berkshire Hathaway Rentals' },
  },
  {
    id: 'prop-mi-001',
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    tag: 'Price Cut',
    tagColor: 'bg-red-600',
    price: '$1,850/mo',
    numericPrice: 1850,
    bds: 2,
    ba: 1,
    sqft: '1,100',
    status: 'For Rent',
    listingType: 'rent',
    address: '615 W Lafayette Blvd, Apt 906, Detroit, MI 48226',
    city: 'Detroit',
    state: 'Michigan',
    propertyType: 'Condo',
    mls: 'MLS# MI-R20260740 · Real Estate One Rentals',
    description:
      'Loft-style condo in the Rivertown District with exposed brick, industrial finishes, floor-to-ceiling windows overlooking the Detroit River, in-unit laundry, and covered parking. Pet-friendly building.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80'],
    yearBuilt: 2010,
    lotSize: 'N/A',
    pricePerSqft: 2,
    hoaFee: null,
    highlights: ['RIVER VIEWS', 'PET-FRIENDLY'],
    daysOnMarket: 12,
    listingViews: 189,
    listingSaves: 8,
    listedBy: { name: 'Jason Wright', phone: '(313) 555-0239', brokerage: 'Real Estate One Rentals' },
  },
  {
    id: 'prop-oh-001',
    image: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&q=80',
    tag: 'Featured Rental',
    tagColor: 'bg-amber-600',
    price: '$1,650/mo',
    numericPrice: 1650,
    bds: 3,
    ba: 2,
    sqft: '1,450',
    status: 'For Rent',
    listingType: 'rent',
    address: '1422 W 6th St, Cleveland, OH 44113',
    city: 'Cleveland',
    state: 'Ohio',
    propertyType: 'Townhouse',
    mls: 'MLS# OH-R20260755 · Howard Hanna Rentals',
    description:
      'Renovated Ohio City townhouse with original hardwood floors, updated kitchen with quartz counters, private patio, and a detached garage. Steps from West Side Market and the vibrant Gordon Square Arts District.',
    // --- NEW FIELDS ---
    images: ['https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&q=80'],
    yearBuilt: 1925,
    lotSize: '0.04 acres',
    pricePerSqft: 1,
    hoaFee: null,
    highlights: ['RENOVATED', 'WALKABLE NEIGHBORHOOD'],
    daysOnMarket: 8,
    listingViews: 234,
    listingSaves: 13,
    listedBy: { name: 'Laura Bennett', phone: '(216) 555-0348', brokerage: 'Howard Hanna Rentals' },
  },
];

const zillowDemoSaleIds = new Set([
  'prop-ca-001',
  'prop-tx-002',
  'prop-fl-003',
  'prop-ny-004',
  'prop-il-005',
  'prop-pa-006',
  'prop-oh-007',
  'prop-ga-008',
  'prop-nc-009',
  'prop-mi-010',
]);

const rentalDemoIds = new Set(['prop-ca-r01']);

const extraGalleryImages = [
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&q=85&auto=format&fit=crop',
];

const baseGalleryPool = Array.from(new Set([
  ...baseProperties.flatMap((property) => [property.image, ...(property.images ?? [])]),
  ...extraGalleryImages,
]));

type Facts = NonNullable<Property['facts']>;
type OfferStrength = NonNullable<Property['offerInsights']>['strength'];

const formatUsd = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`;

const getSqftNumber = (property: Property) => {
  const parsed = Number(property.sqft.replace(/[^0-9]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const getZipCode = (property: Property) => property.address.match(/\b\d{5}\b/)?.[0] ?? property.city;

const withImageParams = (url: string, slot: number) => {
  const [base] = url.split('?');
  return `${base}?w=1200&q=85&auto=format&fit=crop&crop=entropy&sig=${slot}`;
};

const buildGalleryImages = (property: Property, propertyIndex: number, desiredCount: number) => {
  const ownImages = [property.image, ...(property.images ?? [])];
  const rotatedPool = baseGalleryPool
    .slice(propertyIndex % baseGalleryPool.length)
    .concat(baseGalleryPool.slice(0, propertyIndex % baseGalleryPool.length));
  const sources = Array.from(new Set([...ownImages, ...rotatedPool]));

  return Array.from({ length: desiredCount }, (_, imageIndex) => (
    withImageParams(sources[imageIndex % sources.length], propertyIndex * 100 + imageIndex)
  ));
};

const buildFacts = (property: Property): Facts => {
  const facts = property.facts ?? {};
  const sqft = getSqftNumber(property);
  const lotSize = property.lotSize ?? '0.18 acres';
  const pricePerSqft = property.pricePerSqft ?? Math.max(1, Math.round(property.numericPrice / sqft));
  const hoaText = property.hoaFee ? `${formatUsd(property.hoaFee)}/mo` : 'No HOA fee listed';

  return {
    interior: facts.interior ?? [
      { label: 'Bedrooms & bathrooms', items: [`Bedrooms: ${property.bds}`, `Bathrooms: ${property.ba}`] },
      { label: 'Appliances', items: ['Dishwasher', 'Refrigerator', 'Range / oven', 'Washer and dryer hookups'] },
      { label: 'Interior features', items: ['Open living area', 'Natural light', 'Updated finishes', 'Storage closets'] },
    ],
    property: facts.property ?? [
      { label: 'Property details', items: [`Property type: ${property.propertyType}`, `Living area: ${property.sqft} sqft`, `Lot: ${lotSize}`] },
      { label: 'Parking', items: ['Attached garage', 'Driveway parking', 'Guest parking available'] },
      { label: 'Outdoor features', items: ['Private outdoor space', 'Landscaped entry', 'Patio or balcony area'] },
    ],
    construction: facts.construction ?? [
      { label: 'Type & style', items: [property.propertyType, 'Contemporary residential design'] },
      { label: 'Condition', items: [`Built in ${property.yearBuilt ?? 2016}`, 'Well maintained', 'Move-in ready'] },
      { label: 'Materials', items: ['Composition roof', 'Stucco / siding exterior', 'Energy-efficient windows'] },
    ],
    utilities: facts.utilities ?? [
      { label: 'Utilities', items: ['Public water', 'Public sewer', 'Electric connected', 'High-speed internet available'] },
      { label: 'Heating & cooling', items: ['Central air', 'Forced air heating', 'Programmable thermostat'] },
    ],
    community: facts.community ?? [
      { label: 'Community', items: [`Located in ${property.city}`, 'Near dining, shopping, and daily services', 'Residential neighborhood setting'] },
      { label: 'HOA', items: [hoaText, 'Buyer to verify community rules and amenities'] },
    ],
    financial: facts.financial ?? [
      { label: 'Financial', items: [`Price per sqft: ${formatUsd(pricePerSqft)}`, `Annual tax estimate: ${formatUsd(property.annualTax ?? property.numericPrice * 0.011)}`, property.mls] },
      { label: 'Listing terms', items: ['Cash', 'Conventional financing', 'Pre-approval recommended'] },
    ],
  };
};

const buildPriceHistory = (property: Property) => {
  if (property.priceHistory?.length) return property.priceHistory;

  const current = property.numericPrice;
  const previous = current * 1.02;
  const pricePerSqft = property.pricePerSqft ?? Math.max(1, Math.round(current / getSqftNumber(property)));

  return [
    { date: '5/18/2026', event: 'Listed for sale', price: formatUsd(current), pricePerSqft: `${formatUsd(pricePerSqft)}/sqft` },
    { date: '4/22/2026', event: 'Coming soon', price: formatUsd(previous), pricePerSqft: `${formatUsd(Math.round(previous / getSqftNumber(property)))}/sqft` },
  ];
};

const buildOpenHouse = (propertyIndex: number) => ([
  { date: propertyIndex % 2 === 0 ? 'Sat, May 23' : 'Sat, May 30', time: propertyIndex % 3 === 0 ? '11:00 AM - 1:00 PM' : '12:00 PM - 2:00 PM' },
  { date: propertyIndex % 2 === 0 ? 'Sun, May 24' : 'Sun, May 31', time: '1:00 PM - 3:00 PM' },
]);

const buildTravelTimes = (property: Property) => ([
  { destination: `${property.city} downtown`, drive: '12 min', transit: '24 min' },
  { destination: 'Nearest airport', drive: '28 min', transit: '52 min' },
  { destination: 'Shopping district', drive: '9 min', transit: '18 min' },
]);

const buildOfferInsights = (property: Property, propertyIndex: number): NonNullable<Property['offerInsights']> => {
  const strengths: OfferStrength[] = ['Strong', 'Competitive', 'Moderate', 'Competitive'];
  const low = property.numericPrice * 0.97;
  const high = property.numericPrice * 1.03;

  return {
    strength: strengths[propertyIndex % strengths.length],
    estimatedRange: `${formatUsd(low)} - ${formatUsd(high)}`,
    winChance: propertyIndex % 3 === 0 ? 'High buyer interest' : 'Typical local competition',
  };
};

const buildMarketValue = (property: Property): NonNullable<Property['marketValue']> => {
  const low = property.numericPrice * 0.94;
  const high = property.numericPrice * 1.06;
  const rentEstimate = Math.max(1800, Math.round((property.numericPrice * 0.006) / 50) * 50);

  return {
    estimatedRange: `${formatUsd(low)} - ${formatUsd(high)}`,
    zestimate: formatUsd(property.numericPrice * 1.01),
    rentZestimate: `${formatUsd(rentEstimate)}/mo`,
  };
};

const buildPublicTaxHistory = (property: Property) => {
  if (property.publicTaxHistory?.length) return property.publicTaxHistory;

  const annualTax = property.annualTax ?? property.numericPrice * 0.011;

  return [
    { year: '2025', tax: formatUsd(annualTax), assessment: formatUsd(property.numericPrice * 0.82) },
    { year: '2024', tax: formatUsd(annualTax * 0.96), assessment: formatUsd(property.numericPrice * 0.79) },
    { year: '2023', tax: formatUsd(annualTax * 0.91), assessment: formatUsd(property.numericPrice * 0.75) },
  ];
};

const buildClimateRisks = (propertyIndex: number): NonNullable<Property['climateRisks']> => {
  const heat = propertyIndex % 3 === 0 ? 'Major' : propertyIndex % 3 === 1 ? 'Moderate' : 'Minor';
  const fire = propertyIndex % 4 === 0 ? 'Moderate' : 'Minor';
  const wind = propertyIndex % 5 === 0 ? 'Moderate' : 'Minor';

  return {
    flood: { level: propertyIndex % 2 === 0 ? 'Minimal' : 'Minor', description: 'Based on regional flood exposure and nearby drainage patterns.' },
    fire: { level: fire, description: 'Wildfire exposure varies by surrounding vegetation and local mitigation.' },
    heat: { level: heat, description: 'Future heat days may increase over the next 30 years.' },
    wind: { level: wind, description: 'Wind risk estimate based on regional storm history.' },
  };
};

const buildNearbySchools = (property: Property, propertyIndex: number): NonNullable<Property['nearbySchools']> => ([
  { name: `${property.city} Elementary School`, grades: 'K-5', distance: '0.7 mi', rating: 7 + (propertyIndex % 3), type: 'Elementary' },
  { name: `${property.city} Middle School`, grades: '6-8', distance: '1.4 mi', rating: 6 + (propertyIndex % 4), type: 'Middle' },
  { name: `${property.city} High School`, grades: '9-12', distance: '2.1 mi', rating: 7 + (propertyIndex % 2), type: 'High' },
]);

const buildLocalExperts = (property: Property): NonNullable<Property['localExperts']> => ([
  { name: property.listedBy?.name ?? 'So Do Van Phuc Advisor', title: property.listedBy?.brokerage ?? 'Local real estate specialist', sales: 24 },
  { name: 'Alex Morgan', title: `${property.city} buyer specialist`, sales: 18 },
  { name: 'Taylor Nguyen', title: 'Luxury market advisor', sales: 31 },
]);

const buildResourceLinks = (property: Property): NonNullable<Property['resourceLinks']> => {
  const zip = getZipCode(property);

  return [
    { label: `${property.city} homes for sale`, count: 124 },
    { label: `${property.state} real estate`, count: 842 },
    { label: `${zip} market trends`, count: 36 },
    { label: `${property.propertyType} listings nearby`, count: 58 },
  ];
};

const enrichListing = (property: Property, propertyIndex: number): Property => {
  const isTenListingDemo = zillowDemoSaleIds.has(property.id);
  const isRentalDemo = rentalDemoIds.has(property.id);

  // Compute numericSqft for all properties
  const numericSqft = property.numericSqft ?? (Number(property.sqft.replace(/,/g, '')) || 0);

  // VIP + expiry demo: first 3 sale listings are VIP, next 2 are expiring soon
  const isVip = property.isVip ?? (propertyIndex < 3 && property.listingType === 'sale');
  const now = new Date();
  let createdAt = property.createdAt;
  let expiresAt = property.expiresAt;
  if (!createdAt) {
    const created = new Date(now);
    created.setDate(created.getDate() - (10 + propertyIndex * 2));
    createdAt = created.toISOString();
  }
  if (!expiresAt) {
    const expiry = new Date(now);
    if (isVip) {
      expiry.setDate(expiry.getDate() + 30 - propertyIndex * 2);
    } else if (propertyIndex >= 3 && propertyIndex <= 4) {
      // Expiring soon demo
      expiry.setDate(expiry.getDate() + 2);
    } else if (propertyIndex >= 22) {
      // Already expired demo
      expiry.setDate(expiry.getDate() - 3);
    } else {
      expiry.setDate(expiry.getDate() + 15 - propertyIndex);
    }
    expiresAt = expiry.toISOString();
  }

  // YouTube demo on first 2 listings
  const youtubeUrl = property.youtubeUrl ?? (propertyIndex === 0
    ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    : propertyIndex === 1
      ? 'https://www.youtube.com/watch?v=9bZkp7q19f0'
      : undefined);

  const base: Property = {
    ...property,
    numericSqft,
    isVip,
    createdAt,
    expiresAt,
    youtubeUrl,
  };

  if (!isTenListingDemo && !isRentalDemo) return base;

  const desiredPhotoCount = isTenListingDemo ? 49 : (property.photoCount ?? 28);
  const annualTax = property.annualTax ?? Math.round(property.numericPrice * 0.011);
  const walkScore = property.walkScore ?? Math.min(95, 52 + ((propertyIndex * 7) % 39));
  const bikeScore = property.bikeScore ?? Math.min(94, 48 + ((propertyIndex * 9) % 42));
  const transitScore = property.transitScore ?? Math.min(90, 35 + ((propertyIndex * 11) % 42));

  return {
    ...base,
    images: buildGalleryImages(property, propertyIndex, desiredPhotoCount),
    photoCount: desiredPhotoCount,
    floorPlanAvailable: property.floorPlanAvailable ?? true,
    threeDHomeAvailable: property.threeDHomeAvailable ?? true,
    facts: buildFacts(property),
    priceHistory: buildPriceHistory(property),
    annualTax,
    walkScore,
    bikeScore,
    transitScore,
    openHouse: property.openHouse ?? buildOpenHouse(propertyIndex),
    travelTimes: property.travelTimes ?? buildTravelTimes(property),
    offerInsights: property.offerInsights ?? buildOfferInsights(property, propertyIndex),
    marketValue: property.marketValue ?? buildMarketValue(property),
    publicTaxHistory: buildPublicTaxHistory({ ...property, annualTax }),
    climateRisks: property.climateRisks ?? buildClimateRisks(propertyIndex),
    nearbySchools: property.nearbySchools ?? buildNearbySchools(property, propertyIndex),
    localExperts: property.localExperts ?? buildLocalExperts(property),
    legalProtections: property.legalProtections ?? [
      'Fair housing protections apply to all residential listings.',
      'Source details should be verified before publication.',
    ],
    resourceLinks: property.resourceLinks ?? buildResourceLinks(property),
  };
};

export const properties: Property[] = baseProperties.map(enrichListing);
