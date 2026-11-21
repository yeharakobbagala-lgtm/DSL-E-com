export interface AboutPageData {
  // 1. Hero Section
  heroImage: string;
  heroTitleLine1: string;
  heroTitleLine2: string;

  // 2. Our Story Section
  storyTitle: string;
  storyParagraph: string;
  storyButtonText: string;
  storyButtonLink: string;
  storyVideoText: string;
  storyVideoLink: string;
  capsuleImage1: string;
  capsuleImage2: string;
  capsuleImage3: string;

  // 3. Identity, Vision & Values Section
  valuesBadge: string;
  valuesTitle: string;
  pillar1Text: string;
  pillar2Text: string;
  pillar3Text: string;
  pillar4Text: string;
  visionTitle: string;
  visionText: string;
  missionTitle: string;
  missionText: string;

  // 4. Community & Impact
  impactBadge: string;
  impactTitle: string;
  impactSubtitle: string;
  card1Image: string;
  card1Title: string;
  card1Text: string;
  card2Image: string;
  card2Title: string;
  card2Text: string;
  card3Image: string;
  card3Title: string;
  card3Text: string;

  // 5. Distribution & Contact
  mapImage: string;
  distributionBadge: string;
  distributionTitle: string;
  distributionSubtitle: string;
  officePhone: string;
  whatsappPhone: string;
  customerCareEmail: string;
  headOfficeAddress: string;
  distributionAddress: string;
}

export const DEFAULT_ABOUT_PAGE_DATA: AboutPageData = {
  heroImage: '/hero-stationery-hd.jpg',
  heroTitleLine1: 'Empowering Education.',
  heroTitleLine2: 'Inspiring Creativity.',

  storyTitle: 'Our Story',
  storyParagraph:
    'Born out of a dedication to quality stationery and empowering young minds, DSL Enterprises (Pvt) Ltd connects Sri Lanka to world-class writing and creative essentials. We believe in inspiring students, empowering schools and offices, and providing reliable, accessible tools that nurture a lifetime of learning and imagination.',
  storyButtonText: 'Discover Our Brands',
  storyButtonLink: '/brands',
  storyVideoText: 'Watch Event Video',
  storyVideoLink: '#experience',
  capsuleImage1: '/images/hero-schoolgirl-perfect.png',
  capsuleImage2: '/hero-stationery-hd.jpg',
  capsuleImage3: '/assets/library/scene2-user-library-fullhd.jpg',

  valuesBadge: 'ABOUT US',
  valuesTitle: 'Our Identity,\nVision and Values',
  pillar1Text: 'Quality & Craft',
  pillar2Text: 'Trust & Transparency',
  pillar3Text: 'Islandwide Reach',
  pillar4Text: 'Innovation & Learning',
  visionTitle: 'Vision',
  visionText:
    "To be Sri Lanka's leading fresh educational and creative supply partner, fostering academic excellence, artistic expression, and lifelong learning across every community.",
  missionTitle: 'Mission',
  missionText:
    'To source, deliver, and inspire access to the finest stationery and educational essentials with integrity, continuous innovation, islandwide accessibility, and heart.',

  impactBadge: 'Philanthropy & Giving Back',
  impactTitle: 'Community & Impact',
  impactSubtitle:
    'Every purchase of designated DSL writing instruments directly supports lifesaving pediatric care in Sri Lanka.',
  card1Image: '/images/about/dsl-little-heart.png',
  card1Title: 'Little Hearts Project',
  card1Text:
    'Dedicated pens & pencils under the Speed and Camlin brands directly donate proceeds to childhood care.',
  card2Image: '/images/about/dsl-community-hand.png',
  card2Title: 'Hands That Care',
  card2Text:
    'Active involvement in student sponsorships, art workshops, and school equipment programs islandwide.',
  card3Image: '/images/about/dsl-cardiac-hospital.png',
  card3Title: 'Lady Ridgeway Hospital',
  card3Text:
    'Contributing to the Cardiac and Critical Care Complex to ensure no child waits for critical surgery.',

  mapImage: '/images/about/dsl-sri-lanka-map-v2.png',
  distributionBadge: 'Islandwide Supply Network',
  distributionTitle: 'Moratuwa Headquarters & Distribution Hubs',
  distributionSubtitle:
    'Serving schools, retail bookshops, and nationwide customers directly from our central facilities.',
  officePhone: '+94 38 223 6094',
  whatsappPhone: '+94 77 355 3555',
  customerCareEmail: 'support@dslstationery.lk',
  headOfficeAddress: '30/3, Main Street, Moratuwa, Sri Lanka',
  distributionAddress: 'No 14, Old Kottawa Road, Mirihana, Nugegoda',
};
