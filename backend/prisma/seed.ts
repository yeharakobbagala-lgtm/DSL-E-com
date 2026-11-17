import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '../src/generated/prisma';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ==============================================================================
// DSL Stationery — Phase 3 Seed Script (dsl.lk Verified Catalog)
// ==============================================================================

async function main() {
  console.log('🌱 Starting DSL Stationery database seed...\n');

  // ----------------------------------------------------------------------------
  // 1. Seed StoreSettings Singleton
  // ----------------------------------------------------------------------------
  console.log('📦 Seeding StoreSettings...');
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {
      flatDeliveryFeeCents: 35000,       // Rs. 350.00
      freeDeliveryThresholdCents: 500000, // Rs. 5,000.00
      hotlinePhone: '+94 114 963 069',
      whatsappNumber: '+94 772 355 530',
      contactEmail: 'info@dsltrading.com',
      codEnabled: true,
      bankTransferEnabled: true,
      onlineCardEnabled: false,
    },
    create: {
      id: 'default',
      flatDeliveryFeeCents: 35000,
      freeDeliveryThresholdCents: 500000,
      hotlinePhone: '+94 114 963 069',
      whatsappNumber: '+94 772 355 530',
      contactEmail: 'info@dsltrading.com',
      codEnabled: true,
      bankTransferEnabled: true,
      onlineCardEnabled: false,
    },
  });

  // ----------------------------------------------------------------------------
  // 2. Seed 15 Verified Categories from https://www.dsl.lk/
  // ----------------------------------------------------------------------------
  console.log('📦 Seeding Categories (15 categories)...');
  const categories = [
    {
      id: 'cat-pens',
      name: 'Pens',
      slug: 'pens',
      description: 'Ballpoint pens, gel pens, signature pens, and pen gift packs.',
      iconName: 'PenTool',
      featured: true,
      displayOrder: 1,
    },
    {
      id: 'cat-pencils',
      name: 'Pencils',
      slug: 'pencils',
      description: 'Graphite writing pencils, Little Hearts pencils, colour pencils, and oil pastels.',
      iconName: 'Edit3',
      featured: true,
      displayOrder: 2,
    },
    {
      id: 'cat-markers',
      name: 'Markers',
      slug: 'markers',
      description: 'Whiteboard markers, permanent markers, CD/OHP markers, and refill inks.',
      iconName: 'Highlighter',
      featured: true,
      displayOrder: 3,
    },
    {
      id: 'cat-highlighters',
      name: 'Highlighters',
      slug: 'highlighters',
      description: 'Vibrant and soft pastel textliners for office, university, and school study.',
      iconName: 'Sparkles',
      featured: true,
      displayOrder: 4,
    },
    {
      id: 'cat-fabric-paint',
      name: 'Fabric Paint',
      slug: 'fabric-paint',
      description: 'Creative textile paints for apparel, craft, and school art assignments.',
      iconName: 'Palette',
      featured: false,
      displayOrder: 5,
    },
    {
      id: 'cat-banner-paint',
      name: 'Banner Paint',
      slug: 'banner-paint',
      description: 'Large format poster and banner paints for events, notices, and commercial display.',
      iconName: 'Layers',
      featured: false,
      displayOrder: 6,
    },
    {
      id: 'cat-water-colour',
      name: 'Water Colour',
      slug: 'water-colour',
      description: 'Artist cake watercolours and concentrated tube colour sets.',
      iconName: 'Droplet',
      featured: true,
      displayOrder: 7,
    },
    {
      id: 'cat-erasers',
      name: 'Erasers',
      slug: 'erasers',
      description: 'Dust-free, non-toxic vinyl and latex-free erasers for neat corrections.',
      iconName: 'Eraser',
      featured: false,
      displayOrder: 8,
    },
    {
      id: 'cat-sharpeners',
      name: 'Sharpeners',
      slug: 'sharpeners',
      description: 'Precision single and dual-hole pencil sharpeners with anti-mess containers.',
      iconName: 'Scissors',
      featured: false,
      displayOrder: 9,
    },
    {
      id: 'cat-rulers',
      name: 'Rulers',
      slug: 'rulers',
      description: '15cm and 30cm transparent acrylic, steel, and flexible measuring rulers.',
      iconName: 'Ruler',
      featured: false,
      displayOrder: 10,
    },
    {
      id: 'cat-correction-pens',
      name: 'Correction Pens',
      slug: 'correction-pens',
      description: 'Fine metal-tip fluid correction pens for instant, opaque white coverage.',
      iconName: 'CheckCircle',
      featured: false,
      displayOrder: 11,
    },
    {
      id: 'cat-tapes',
      name: 'Tapes & Adhesives',
      slug: 'tapes-and-adhesives',
      description: 'Clear stationery tapes, masking tapes, craft glue, and double-sided tapes.',
      iconName: 'Paperclip',
      featured: false,
      displayOrder: 12,
    },
    {
      id: 'cat-clay',
      name: 'Clay & Modelling',
      slug: 'clay-and-modelling',
      description: 'Non-toxic modelling clay and natural creative clay for young learners.',
      iconName: 'Box',
      featured: true,
      displayOrder: 13,
    },
    {
      id: 'cat-calculators',
      name: 'Calculators',
      slug: 'calculators',
      description: 'Desktop commercial calculators and multi-function scientific calculators.',
      iconName: 'Calculator',
      featured: true,
      displayOrder: 14,
    },
    {
      id: 'cat-diapers',
      name: 'Diapers',
      slug: 'diapers',
      description: 'Comfortable, absorbent baby diapers under the Wetex brand distributed by DSL.',
      iconName: 'Package',
      featured: false,
      displayOrder: 15,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat,
    });
  }

  // ----------------------------------------------------------------------------
  // 3. Seed 10 Approved Brands from https://www.dsl.lk/
  // ----------------------------------------------------------------------------
  console.log('📦 Seeding Brands (10 brands)...');
  const brands = [
    {
      id: 'brand-speed',
      name: 'Speed',
      slug: 'speed',
      originCountry: 'Sri Lanka',
      description: "DSL's proprietary brand, creators of the Speed RIM ball pen and partners of the Lady Ridgeway Hospital Little Hearts project.",
      featured: true,
    },
    {
      id: 'brand-linc',
      name: 'Linc',
      slug: 'linc',
      originCountry: 'India',
      description: 'Renowned low-viscosity ink pens including Linc Pentonic, Ocean Slim, and Shine Glitter.',
      featured: true,
    },
    {
      id: 'brand-luxor',
      name: 'Luxor',
      slug: 'luxor',
      originCountry: 'India',
      description: 'Highlighters, whiteboard markers, permanent markers, and marker refill inks.',
      featured: true,
    },
    {
      id: 'brand-doms',
      name: 'Doms',
      slug: 'doms',
      originCountry: 'India',
      description: 'Premier colour pencils, erasers, sharpeners, and vibrant art supplies for students.',
      featured: true,
    },
    {
      id: 'brand-camlin',
      name: 'Kokuyo Camlin',
      slug: 'kokuyo-camlin',
      originCountry: 'India',
      description: 'Artist water colours, poster paints, geometry instrument boxes, and Little Hearts pencils.',
      featured: true,
    },
    {
      id: 'brand-fine',
      name: 'Fine',
      slug: 'fine',
      originCountry: 'India',
      description: 'Precision fine-tip pens, gel pens, and school writing stationery.',
      featured: false,
    },
    {
      id: 'brand-wetex',
      name: 'Wetex',
      slug: 'wetex',
      originCountry: 'Sri Lanka',
      description: 'Essential tapes, adhesives, fabric paints, and baby diapers.',
      featured: false,
    },
    {
      id: 'brand-lido',
      name: 'Lido',
      slug: 'lido',
      originCountry: 'South Korea',
      description: 'Non-toxic modelling clay and natural creative educational materials.',
      featured: true,
    },
    {
      id: 'brand-hp',
      name: 'HP',
      slug: 'hp',
      originCountry: 'Global',
      description: 'High performance printing paper and office copier reams.',
      featured: false,
    },
    {
      id: 'brand-amigo',
      name: 'Amigo',
      slug: 'amigo',
      originCountry: 'Sri Lanka',
      description: 'Precision electronic desktop and scientific calculators distributed across Sri Lanka by DSL.',
      featured: true,
    },
  ];

  for (const b of brands) {
    await prisma.brand.upsert({
      where: { id: b.id },
      update: b,
      create: b,
    });
  }

  // ----------------------------------------------------------------------------
  // 4. Seed Representative Demo Products (Verified from https://www.dsl.lk/)
  // ----------------------------------------------------------------------------
  console.log('📦 Seeding Products (8 verified representative products)...');
  const products = [
    {
      id: 'prod-speed-rim-blue',
      name: 'SPEED RIM Ball Pen Blue',
      slug: 'speed-rim-ball-pen-blue',
      sku: 'DSL-SPEED-RIM-BLUE',
      barcode: '4792026001018', // [Placeholder: Needs Approval]
      description: 'The iconic Speed RIM ballpoint pen with smooth low-friction ink, secure clip cap, and comfortable grip for daily school and office writing.',
      shortDescription: 'Classic 0.7mm smooth writing blue ballpoint pen from Speed.',
      categoryId: 'cat-pens',
      brandId: 'brand-speed',
      priceCents: 2500, // Verified Rs. 25.00 on dsl.lk
      compareAtPriceCents: 3000,
      costPriceCents: 1600,
      stockQuantity: 500,
      lowStockThreshold: 50,
      isActive: true,
      isFeatured: true,
      isBestSeller: true,
      images: ['/products/speed-rim-blue.png'],
      tags: ['pen', 'ballpoint', 'speed', 'blue', 'dsl', 'school', 'office'],
      rating: 5.0,
      reviewCount: 34,
      specifications: {
        'Tip Size': '0.7mm',
        'Ink Color': 'Blue',
        'Origin': 'Sri Lanka',
      },
    },
    {
      id: 'prod-speed-rim-black',
      name: 'SPEED RIM Ball Pen Black',
      slug: 'speed-rim-ball-pen-black',
      sku: 'DSL-SPEED-RIM-BLACK',
      barcode: '4792026001025', // [Placeholder: Needs Approval]
      description: 'Speed RIM black ball pen providing dark, smudge-resistant lines for contracts, examinations, and official record keeping.',
      shortDescription: 'Classic 0.7mm smooth writing black ballpoint pen from Speed.',
      categoryId: 'cat-pens',
      brandId: 'brand-speed',
      priceCents: 2500, // Verified Rs. 25.00 on dsl.lk
      compareAtPriceCents: 3000,
      costPriceCents: 1600,
      stockQuantity: 450,
      lowStockThreshold: 50,
      isActive: true,
      isFeatured: false,
      isBestSeller: true,
      images: ['/products/speed-rim-black.png'],
      tags: ['pen', 'ballpoint', 'speed', 'black', 'dsl', 'exam'],
      rating: 4.9,
      reviewCount: 28,
      specifications: {
        'Tip Size': '0.7mm',
        'Ink Color': 'Black',
        'Origin': 'Sri Lanka',
      },
    },
    {
      id: 'prod-linc-shine-glitter-5',
      name: 'Linc Shine Glitter Pen (5 Pcs Pack)',
      slug: 'linc-shine-glitter-pen-5-pcs-pack',
      sku: 'DSL-LINC-SHINE-GLIT-5P',
      barcode: '8904106821051', // [Placeholder: Needs Approval]
      description: 'Linc Shine Glitter Gel Pens offer shimmering ink flows with smooth tips, ideal for scrapbooking, project titles, bullet journals, and party decor.',
      shortDescription: 'Sparkling assorted glitter gel pens pack of 5 for craft, greeting cards, and creative art.',
      categoryId: 'cat-pens',
      brandId: 'brand-linc',
      priceCents: 55000, // Verified Rs. 550.00 on dsl.lk
      compareAtPriceCents: 60000,
      costPriceCents: 38000,
      stockQuantity: 120,
      lowStockThreshold: 20,
      isActive: true,
      isFeatured: true,
      isNewArrival: true,
      images: ['/products/linc-shine-glitter.png'],
      tags: ['glitter pen', 'linc', 'gel pen', 'craft', 'art', 'colours'],
      rating: 4.8,
      reviewCount: 19,
      specifications: {
        'Pack Size': '5 Pens',
        'Ink Finish': 'Glitter Metallic',
        'Brand': 'Linc',
      },
    },
    {
      id: 'prod-amigo-mi-201n',
      name: 'AMIGO MI 201N Basic Calculator',
      slug: 'amigo-mi-201n-basic-calculator',
      sku: 'DSL-AMIGO-MI-201N',
      barcode: '4792026002015', // [Placeholder: Needs Approval]
      description: 'The Amigo MI 201N provides clear angled LCD display, dual solar/battery power, comfortable plastic keys, and basic arithmetic functions.',
      shortDescription: 'Compact 8-digit desktop electronic calculator for daily retail and office math.',
      categoryId: 'cat-calculators',
      brandId: 'brand-amigo',
      priceCents: 59000, // Verified Rs. 590.00 on dsl.lk
      compareAtPriceCents: 65000,
      costPriceCents: 41000,
      stockQuantity: 75,
      lowStockThreshold: 10,
      isActive: true,
      isFeatured: false,
      isBestSeller: true,
      images: ['/products/amigo-mi-201n.png'],
      tags: ['calculator', 'amigo', 'electronic', 'office', 'desktop', 'dsl'],
      rating: 4.7,
      reviewCount: 15,
      specifications: {
        'Display Digits': '8 Digits',
        'Power Source': 'Dual Solar & Battery',
        'Model': 'MI 201N',
      },
    },
    {
      id: 'prod-amigo-fx82ms',
      name: 'AMIGO FX82MS Scientific Calculator',
      slug: 'amigo-fx82ms-scientific-calculator',
      sku: 'DSL-AMIGO-FX82MS',
      barcode: '4792026002022', // [Placeholder: Needs Approval]
      description: 'Amigo FX82MS features 240 scientific functions, 10+2 digit display, statistical calculations, permutations, combinations, and fractions.',
      shortDescription: '2-line display scientific calculator for secondary school and engineering students.',
      categoryId: 'cat-calculators',
      brandId: 'brand-amigo',
      priceCents: 290000, // Verified Rs. 2,900.00 on dsl.lk
      compareAtPriceCents: 320000,
      costPriceCents: 210000,
      stockQuantity: 60,
      lowStockThreshold: 10,
      isActive: true,
      isFeatured: true,
      isBestSeller: true,
      images: ['/products/amigo-fx82ms.png'],
      tags: ['calculator', 'scientific', 'amigo', 'ol', 'al', 'engineering', 'maths'],
      rating: 5.0,
      reviewCount: 42,
      specifications: {
        'Functions': '240 Functions',
        'Display': '2-line LCD',
        'Model': 'FX82MS',
      },
    },
    {
      id: 'prod-lido-clay-6',
      name: 'Lido Modeling Clay 6 Colours',
      slug: 'lido-modeling-clay-6-colours',
      sku: 'DSL-LIDO-CLAY-6C',
      barcode: '8809123450062', // [Placeholder: Needs Approval]
      description: 'Lido soft modeling clay imported from South Korea. Safe, non-hardening, non-toxic, and reusable formula for early childhood sensory development.',
      shortDescription: 'Non-toxic vibrant South Korean modeling clay 6-color set for children and creative crafts.',
      categoryId: 'cat-clay',
      brandId: 'brand-lido',
      priceCents: 38000, // Verified Rs. 380.00 on dsl.lk
      compareAtPriceCents: 42000,
      costPriceCents: 26000,
      stockQuantity: 90,
      lowStockThreshold: 15,
      isActive: true,
      isFeatured: true,
      isNewArrival: false,
      images: ['/products/lido-clay-6.png'],
      tags: ['clay', 'modelling clay', 'lido', 'kids', 'craft', 'korea', 'preschool'],
      rating: 4.9,
      reviewCount: 22,
      specifications: {
        'Colors': '6 Assorted Shades',
        'Safety': 'Non-Toxic Child Safe',
        'Origin': 'South Korea',
      },
    },
    {
      id: 'prod-doms-colour-12',
      name: 'Doms 12 Colour Pencils Set',
      slug: 'doms-12-colour-pencils-set',
      sku: 'DSL-DOMS-CP-12',
      barcode: '8908001001124', // [Placeholder: Needs Approval]
      description: 'Doms colour pencils crafted with superior soft-treated wood for effortless sharpening and rich pigment laydown for school art assignments.',
      shortDescription: 'High-pigment bright 12-shade half-length wooden colour pencils with sharpener.',
      categoryId: 'cat-pencils',
      brandId: 'brand-doms',
      priceCents: 42000, // Verified Rs. 420.00 on dsl.lk
      compareAtPriceCents: 46000,
      costPriceCents: 29000,
      stockQuantity: 150,
      lowStockThreshold: 25,
      isActive: true,
      isFeatured: true,
      isBestSeller: true,
      images: ['/products/doms-colour-12.png'],
      tags: ['colour pencils', 'doms', 'art', 'drawing', 'school', 'kids'],
      rating: 4.9,
      reviewCount: 56,
      specifications: {
        'Shades': '12 Colours',
        'Lead Type': 'Soft Pigment',
        'Brand': 'Doms',
      },
    },
    {
      id: 'prod-camlin-water-colour-12',
      name: 'Kokuyo Camlin Artist Water Colour 12 Cakes',
      slug: 'kokuyo-camlin-artist-water-colour-12-cakes',
      sku: 'DSL-CAMLIN-WC-12',
      barcode: '8901425001218', // [Placeholder: Needs Approval]
      description: 'Kokuyo Camlin student water colour set featuring smooth flow, lightfast transparent pigments, and an integrated mixing palette.',
      shortDescription: '12 vibrant cake watercolours with a quality round painting brush in sturdy palette.',
      categoryId: 'cat-water-colour',
      brandId: 'brand-camlin',
      priceCents: 65000, // Verified Rs. 650.00 on dsl.lk
      compareAtPriceCents: 72000,
      costPriceCents: 45000,
      stockQuantity: 85,
      lowStockThreshold: 15,
      isActive: true,
      isFeatured: true,
      isBestSeller: true,
      images: ['/products/camlin-water-colour-12.png'],
      tags: ['water colour', 'camlin', 'paint', 'art', 'palette', 'school'],
      rating: 4.8,
      reviewCount: 31,
      specifications: {
        'Cake Count': '12 Cakes',
        'Accessories': '1 Brush included',
        'Brand': 'Kokuyo Camlin',
      },
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: prod,
      create: prod,
    });
  }

  // ----------------------------------------------------------------------------
  // 5. Seed Authoritative Permissions & System Roles
  // ----------------------------------------------------------------------------
  console.log('🛡️ Seeding Authoritative Permissions & System Roles...');

  const ALL_PERMISSIONS = [
    // Products (5)
    { key: 'products.view', displayName: 'View Products', category: 'Products', description: 'View products catalogue and details' },
    { key: 'products.create', displayName: 'Create Products', category: 'Products', description: 'Create new products and variants' },
    { key: 'products.edit', displayName: 'Edit Products', category: 'Products', description: 'Update products, variants, and toggle status' },
    { key: 'products.delete', displayName: 'Delete Products', category: 'Products', description: 'Deactivate products and variants' },
    { key: 'products.import', displayName: 'Import Products', category: 'Products', description: 'Bulk import products via CSV or Excel' },

    // Categories (4)
    { key: 'categories.view', displayName: 'View Categories', category: 'Categories', description: 'View categories' },
    { key: 'categories.create', displayName: 'Create Categories', category: 'Categories', description: 'Create new categories' },
    { key: 'categories.edit', displayName: 'Edit Categories', category: 'Categories', description: 'Update categories' },
    { key: 'categories.delete', displayName: 'Delete Categories', category: 'Categories', description: 'Delete categories' },

    // Brands (4)
    { key: 'brands.view', displayName: 'View Brands', category: 'Brands', description: 'View brands' },
    { key: 'brands.create', displayName: 'Create Brands', category: 'Brands', description: 'Create new brands' },
    { key: 'brands.edit', displayName: 'Edit Brands', category: 'Brands', description: 'Update brands' },
    { key: 'brands.delete', displayName: 'Delete Brands', category: 'Brands', description: 'Delete brands' },

    // Inventory (2)
    { key: 'inventory.view', displayName: 'View Inventory', category: 'Inventory', description: 'View inventory movements, stock levels, and low-stock alerts' },
    { key: 'inventory.update', displayName: 'Adjust Inventory', category: 'Inventory', description: 'Perform stock adjustments' },

    // Orders (6)
    { key: 'orders.view', displayName: 'View Orders', category: 'Orders', description: 'View orders, order details, stats, and audit history' },
    { key: 'orders.update_status', displayName: 'Update Order Status', category: 'Orders', description: 'Update order processing status' },
    { key: 'orders.fulfill', displayName: 'Fulfill Orders', category: 'Orders', description: 'Advance order fulfillment workflow' },
    { key: 'orders.cancel', displayName: 'Cancel Orders', category: 'Orders', description: 'Cancel orders and release or restock reserved inventory' },
    { key: 'orders.refund', displayName: 'Issue & Manage Refunds', category: 'Orders', description: 'Initiate, approve, execute, and record customer monetary refunds' },
    { key: 'orders.add_notes', displayName: 'Add Order Notes', category: 'Orders', description: 'Add operational notes to orders' },

    // Payments (1)
    { key: 'payments.verify_bank_deposit', displayName: 'Verify Bank Deposit Slips', category: 'Payments', description: 'Approve or reject customer bank deposit slips and verify payment transfers' },

    // Dashboard (1)
    { key: 'dashboard.view', displayName: 'View Dashboard', category: 'Dashboard', description: 'View executive store dashboard and revenue analytics' },

    // Customers (2)
    { key: 'customers.view', displayName: 'View Customers', category: 'Customers', description: 'View customer accounts and profiles' },
    { key: 'customers.manage', displayName: 'Manage Customers', category: 'Customers', description: 'Update customer status, addresses, and notes' },

    // Reports (2)
    { key: 'reports.view', displayName: 'View Reports', category: 'Reports', description: 'View sales, revenue, refund, and product reports' },
    { key: 'reports.export', displayName: 'Export Reports', category: 'Reports', description: 'Export report data to CSV and Excel' },

    // Settings (3)
    { key: 'settings.view', displayName: 'View Settings', category: 'Settings', description: 'View store settings and operational variables' },
    { key: 'settings.manage', displayName: 'Manage Settings', category: 'Settings', description: 'Update store settings and payment configurations' },
    { key: 'settings.financial', displayName: 'Manage Financial & Bank Settings', category: 'Settings', description: 'View and update store bank account details, SWIFT codes, and payment gateways' },

    // School Packs (2)
    { key: 'school_packs.view', displayName: 'View School Packs', category: 'School Packs', description: 'View school packs and configuration' },
    { key: 'school_packs.manage', displayName: 'Manage School Packs', category: 'School Packs', description: 'Create, update, and manage school packs' },

    // Uploaded Documents (2)
    { key: 'uploaded_documents.view', displayName: 'View Uploaded Documents', category: 'Uploaded Documents', description: 'View customer uploaded stationery lists' },
    { key: 'uploaded_documents.manage', displayName: 'Manage Uploaded Documents', category: 'Uploaded Documents', description: 'Review and edit customer uploaded stationery items' },

    // Promotions (2)
    { key: 'promotions.view', displayName: 'View Promotions', category: 'Promotions', description: 'View promotions, codes, and redemptions' },
    { key: 'promotions.manage', displayName: 'Manage Promotions', category: 'Promotions', description: 'Create, edit, activate, and deactivate promotions' },

    // Banners (2)
    { key: 'banners.view', displayName: 'View Banners', category: 'Banners', description: 'View homepage banners' },
    { key: 'banners.manage', displayName: 'Manage Banners', category: 'Banners', description: 'Create, edit, reorder, and duplicate banners' },

    // Newsletter (2)
    { key: 'newsletter.view', displayName: 'View Newsletter', category: 'Newsletter', description: 'View subscribers and consent history' },
    { key: 'newsletter.export', displayName: 'Export Newsletter', category: 'Newsletter', description: 'Export newsletter subscriber list' },

    // Recommendations (2)
    { key: 'recommendations.view', displayName: 'View Recommendations', category: 'Recommendations', description: 'View recommendation rules' },
    { key: 'recommendations.manage', displayName: 'Manage Recommendations', category: 'Recommendations', description: 'Create, edit, toggle, and delete recommendation rules' },

    // Audit Logs (1)
    { key: 'audit_logs.view', displayName: 'View Audit Logs', category: 'Audit Logs', description: 'View platform audit logs' },

    // Uploads (1)
    { key: 'uploads.create', displayName: 'Upload Media', category: 'Uploads', description: 'Upload product, brand, and banner images' },

    // Admins (3)
    { key: 'admins.view', displayName: 'View Admins', category: 'Admins', description: 'View administrator accounts' },
    { key: 'admins.manage', displayName: 'Manage Admins', category: 'Admins', description: 'Activate or deactivate administrators' },
    { key: 'admins.invite', displayName: 'Invite Admins', category: 'Admins', description: 'Send and revoke administrator invitations' },

    // Roles (4)
    { key: 'roles.view', displayName: 'View Roles', category: 'Roles', description: 'View roles and permissions' },
    { key: 'roles.manage', displayName: 'Manage Roles', category: 'Roles', description: 'Create, edit, and delete custom roles' },
    { key: 'roles.assign', displayName: 'Assign Roles', category: 'Roles', description: 'Assign roles to administrators' },
    { key: 'roles.assign_permissions', displayName: 'Assign Permissions', category: 'Roles', description: 'Assign permissions to roles' },
  ];

  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        displayName: perm.displayName,
        description: perm.description,
        category: perm.category,
      },
      create: {
        key: perm.key,
        displayName: perm.displayName,
        description: perm.description,
        category: perm.category,
      },
    });
  }

  // System Roles Definition
  const SYSTEM_ROLES = [
    {
      name: 'Super Admin',
      slug: 'super_admin',
      description: 'Root system administrator with unrestricted sovereignty and configuration rights.',
      isSystem: true,
      permissionKeys: ALL_PERMISSIONS.map((p) => p.key),
    },
    {
      name: 'Project Manager',
      slug: 'project_manager',
      description: 'Operations manager overseeing catalogue, inventory, orders, marketing, and school packs.',
      isSystem: true,
      permissionKeys: [
        'products.view', 'products.create', 'products.edit', 'products.delete', 'products.import',
        'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
        'brands.view', 'brands.create', 'brands.edit', 'brands.delete',
        'inventory.view', 'inventory.update',
        'orders.view', 'orders.update_status', 'orders.fulfill', 'orders.cancel', 'orders.add_notes',
        'dashboard.view', 'customers.view', 'reports.view',
        'school_packs.view', 'school_packs.manage',
        'uploaded_documents.view', 'uploaded_documents.manage',
        'promotions.view', 'promotions.manage',
        'banners.view', 'banners.manage',
        'newsletter.view', 'newsletter.export',
        'recommendations.view', 'recommendations.manage',
        'audit_logs.view',
        'uploads.create',
        'admins.view',
      ],
    },
    {
      name: 'Product Manager',
      slug: 'product_manager',
      description: 'Catalogue manager handling products, categories, brands, school packs, and recommendations.',
      isSystem: true,
      permissionKeys: [
        'products.view', 'products.create', 'products.edit', 'products.delete', 'products.import',
        'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
        'brands.view', 'brands.create', 'brands.edit', 'brands.delete',
        'inventory.view', 'inventory.update',
        'school_packs.view', 'school_packs.manage',
        'recommendations.view', 'recommendations.manage',
        'uploads.create',
      ],
    },
    {
      name: 'Order Manager',
      slug: 'order_manager',
      description: 'Fulfillment specialist processing orders, verifying stock, and reviewing uploaded stationery lists.',
      isSystem: true,
      permissionKeys: [
        'orders.view', 'orders.update_status', 'orders.fulfill', 'orders.cancel', 'orders.add_notes',
        'inventory.view',
        'dashboard.view', 'customers.view',
        'uploaded_documents.view', 'uploaded_documents.manage',
      ],
    },
    {
      name: 'Customer Manager',
      slug: 'customer_manager',
      description: 'Customer service and marketing representative handling promotions, newsletters, and order lookups.',
      isSystem: true,
      permissionKeys: [
        'promotions.view', 'promotions.manage',
        'newsletter.view', 'newsletter.export',
        'orders.view',
        'customers.view', 'customers.manage',
        'uploaded_documents.view',
      ],
    },
  ];

  let superAdminRoleId = '';

  for (const roleDef of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { slug: roleDef.slug },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
        isActive: true,
      },
      create: {
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        isSystem: true,
        isActive: true,
      },
    });

    if (roleDef.slug === 'super_admin') {
      superAdminRoleId = role.id;
    }

    // Connect permissions to role
    for (const permKey of roleDef.permissionKeys) {
      const perm = await prisma.permission.findUnique({ where: { key: permKey } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }
    }
  }

  // ----------------------------------------------------------------------------
  // 6. Seed / Update Initial System Super Admin User
  // ----------------------------------------------------------------------------
  console.log('👑 Seeding/Updating Super Admin User...');
  const adminEmail = (process.env.PROVISION_ADMIN_EMAIL || process.env.PRIMARY_SUPER_ADMIN_EMAIL || 'admin@dslstationery.lk').trim().toLowerCase();
  const adminPassword = process.env.PROVISION_ADMIN_PASSWORD || 'AdminSecurePass123!';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'DSL Super Administrator',
        role: UserRole.ADMIN,
        roleId: superAdminRoleId,
        passwordHash,
        isActive: true,
      },
    });
    console.log(`✅ Default Super Admin created: ${adminEmail} (Role: super_admin)`);
  } else {
    // Crucial: assign the dynamic super_admin roleId to existing admin user
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        role: UserRole.ADMIN,
        roleId: superAdminRoleId,
        isActive: true,
      },
    });
    console.log(`✅ Existing admin upgraded to Super Admin with roleId: ${adminEmail}`);
  }

  console.log('\n✅ Database seed completed successfully!');
  console.log(`- Categories seeded: ${categories.length}`);
  console.log(`- Brands seeded: ${brands.length}`);
  console.log(`- Products seeded: ${products.length}`);
  console.log('- StoreSettings initialized');
}

main()
  .catch((e) => {
    console.error('❌ Error executing database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
