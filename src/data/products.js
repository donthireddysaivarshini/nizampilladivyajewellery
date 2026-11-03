export const categories = [
  { id: 'necklaces',        name: 'Necklaces & Chokers', slug: 'necklaces',        img: 'https://images.unsplash.com/photo-1758995115857-2de1eb6283d0?w=600&q=80' },
  { id: 'earrings',         name: 'Earrings & Jhumkas',  slug: 'earrings',         img: 'https://images.unsplash.com/photo-1743794444092-3ad1ab04f968?w=600&q=80' },
  { id: 'bangles',          name: 'Bangles & Kadas',     slug: 'bangles',          img: 'https://images.unsplash.com/photo-1629224316810-9d8805b95e76?w=600&q=80' },
  { id: 'bridal',           name: 'Bridal Collection',   slug: 'bridal',           img: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80' },
  { id: 'silver-jewellery', name: 'Silver Jewellery',    slug: 'silver-jewellery', img: 'https://images.unsplash.com/photo-1650873442159-65dda3860134?w=600&q=80' },
  { id: 'rings',            name: 'Rings',               slug: 'rings',            img: 'https://images.unsplash.com/photo-1770346279037-89853a3e8c60?w=600&q=80' },
  { id: 'mangalsutras',     name: 'Mangalsutras',        slug: 'mangalsutras',     img: 'https://images.unsplash.com/photo-1673960188795-8487e65466b2?w=600&q=80' },
  { id: 'anklets',          name: 'Anklets & Payal',     slug: 'anklets',          img: 'https://images.unsplash.com/photo-1778148046621-4c1aecb22146?w=600&q=80' },
]

export const products = [
  {
    id: 1,
    name: 'Royal Kundan & Pearl Choker Set',
    brand: 'Nizampilla Divya Jewellery',
    slug: 'kundan-pearl-choker-set',
    category: 'necklaces',
    subcategory: 'kundan-sets',
    sellPrice: 4499,
    mrp: 7999,
    off: 44,
    tag: 'BESTSELLER',
    offerTag: 'BRIDAL EDIT',
    stock: 12,
    material: 'Brass alloy with 24K Micro Gold Plating & Hand-cut Kundan stones with natural freshwater pearls',
    care: 'Keep away from water, perfume, and harsh chemicals. Store in airtight zip pouch after use.',
    description: 'An opulent handcrafted choker necklace adorned with radiant Kundan stones, emerald green accents, and cascading pearl drops. Paired with matching statement earrings and a maang tikka.',
    colors: [
      { name: 'Kundan Green', hex: '#2E8B57', imageIndex: 0 },
      { name: 'Ruby Red', hex: '#9B111E', imageIndex: 0 }
    ],
    sizes: [
      { size: 'Free Size', stock: 12 }
    ],
    images: [
      'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800&q=80'
    ],
    isFeatured: true,
    rating: 4.8,
    reviews: 142
  },
  {
    id: 2,
    name: 'Antique Lakshmi Temple Necklace',
    brand: 'Royal Heritage',
    slug: 'antique-lakshmi-temple-necklace',
    category: 'necklaces',
    subcategory: 'temple-necklaces',
    sellPrice: 5899,
    mrp: 9999,
    off: 41,
    tag: 'NEW',
    offerTag: 'TEMPLE CRAFT',
    stock: 8,
    material: 'Temple Brass alloy with antique matte gold finish and genuine red Kemp stones',
    care: 'Wipe gently with dry soft cloth. Avoid direct contact with moisture.',
    description: 'Sacred Goddess Lakshmi motifs intricately carved in Nakshi style, bordered by Kemp cabochon stones and cluster bell drops. Complete with matching heritage jhumkas.',
    colors: [
      { name: 'Antique Gold', hex: '#B8860B', imageIndex: 0 }
    ],
    sizes: [
      { size: 'Adjustable Dori', stock: 8 }
    ],
    images: [
      'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=800&q=80'
    ],
    isFeatured: true,
    rating: 4.9,
    reviews: 86
  },
  {
    id: 3,
    name: 'Heritage Kundan Arsi Cocktail Ring',
    brand: 'Divya Silver Craft',
    slug: '925-pure-silver-solitaire-ring',
    category: 'rings',
    subcategory: 'kundan-rings',
    sellPrice: 1899,
    mrp: 3299,
    off: 42,
    tag: 'BESTSELLER',
    offerTag: 'ROYAL EDIT',
    stock: 15,
    material: 'Brass alloy with 22K yellow gold plating, uncut mirror polki stones and pearl cluster border',
    care: 'Keep away from water and perfume. Store in velvet box.',
    description: 'A grand traditional royal Indian mirror arsi ring with floral Kundan petal setting and dainty seed pearl halo.',
    colors: [
      { name: '22K Gold Polish', hex: '#D4AF37', imageIndex: 0 },
      { name: 'Rose Gold', hex: '#B76E79', imageIndex: 0 }
    ],
    sizes: [
      { size: 'Size 12', stock: 4 },
      { size: 'Size 14', stock: 5 },
      { size: 'Size 16', stock: 4 },
      { size: 'Adjustable', stock: 2 }
    ],
    images: [
      'https://images.unsplash.com/photo-1770346279037-89853a3e8c60?w=800&q=80'
    ],
    isFeatured: true,
    rating: 4.7,
    reviews: 118
  },
  {
    id: 4,
    name: 'Peacock Kemp Grand Jhumkas',
    brand: 'Nizampilla Divya Jewellery',
    slug: 'peacock-kemp-grand-jhumkas',
    category: 'earrings',
    subcategory: 'jhumkas',
    sellPrice: 2499,
    mrp: 4199,
    off: 40,
    tag: 'NEW',
    offerTag: 'FESTIVE',
    stock: 14,
    material: 'Brass with 22K matte gold plating, Kemp red stones, and dangling seed pearls',
    care: 'Handle with care. Avoid perfumes and moisture.',
    description: 'Majestic twin peacocks sculpted above two-tier ornate bell domes with fine filigree work and delicate pearl hangings.',
    colors: [
      { name: 'Ruby Red & Emerald', hex: '#9B111E', imageIndex: 0 },
      { name: '22K Gold Polish', hex: '#D4AF37', imageIndex: 0 }
    ],
    sizes: [
      { size: 'Free Size', stock: 14 }
    ],
    images: [
      'https://images.unsplash.com/photo-1743794444092-3ad1ab04f968?w=800&q=80'
    ],
    isFeatured: true,
    rating: 4.6,
    reviews: 94
  },
  {
    id: 5,
    name: 'American Diamond CZ Bridal Set',
    brand: 'Nakshatra Signature',
    slug: 'american-diamond-cz-bridal-set',
    category: 'bridal',
    subcategory: 'bridal-sets',
    sellPrice: 8999,
    mrp: 14999,
    off: 40,
    tag: 'LUXURY',
    offerTag: 'BRIDAL FAVOURITE',
    stock: 6,
    material: 'High-grade AAA Swiss Zirconia with two-tone Platinum and Rose Gold rhodium plating',
    care: 'Store individually in velvet box provided.',
    description: 'Stunning collar necklace encrusted with brilliant-cut pear and marquise CZ diamonds that glisten like natural diamonds, complete with chandelier drop earrings.',
    colors: [
      { name: 'Rose Gold', hex: '#B76E79', imageIndex: 0 },
      { name: '925 Silver', hex: '#C0C0C0', imageIndex: 0 }
    ],
    sizes: [
      { size: 'Free Size', stock: 6 }
    ],
    images: [
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=80'
    ],
    isFeatured: true,
    rating: 4.9,
    reviews: 64
  },
  {
    id: 6,
    name: 'Traditional Gold Plated Temple Kadas',
    brand: 'Royal Heritage',
    slug: 'traditional-gold-temple-kadas',
    category: 'bangles',
    subcategory: 'antique-kadas',
    sellPrice: 3299,
    mrp: 5499,
    off: 40,
    tag: 'SALE',
    offerTag: 'PAIR OF 2',
    stock: 18,
    material: 'Copper-brass base with 1 gram micro gold plating and side screw opening',
    care: 'Wipe with a clean dry cotton cloth. Do not soak in water.',
    description: 'Heavy royal kadas featuring relief carvings of floral vines and elephant motifs with secure screw closure.',
    colors: [
      { name: '22K Gold Polish', hex: '#D4AF37', imageIndex: 0 },
      { name: 'Antique Gold', hex: '#B8860B', imageIndex: 0 }
    ],
    sizes: [
      { size: '2.4', stock: 6 },
      { size: '2.6', stock: 8 },
      { size: '2.8', stock: 4 }
    ],
    images: [
      'https://images.unsplash.com/photo-1629224316810-9d8805b95e76?w=800&q=80'
    ],
    isFeatured: true,
    rating: 4.5,
    reviews: 78
  },
  {
    id: 7,
    name: 'Oxidised Silver Tribal Hasli Necklace',
    brand: 'Divya Silver Craft',
    slug: 'oxidised-silver-tribal-hasli',
    category: 'silver-jewellery',
    subcategory: 'oxidised-necklaces',
    sellPrice: 1699,
    mrp: 2899,
    off: 41,
    tag: 'TRENDING',
    offerTag: null,
    stock: 11,
    material: 'German silver alloy with antique black oxidised polish',
    care: 'Keep dry. Polish with cotton to maintain vintage patina.',
    description: 'Bohemian rigid collar hasli necklace adorned with ghungroo bells and geometric mirror medallions.',
    colors: [
      { name: 'Oxidised Silver', hex: '#4A4A4A', imageIndex: 0 }
    ],
    sizes: [
      { size: 'Adjustable Dori', stock: 11 }
    ],
    images: [
      'https://images.unsplash.com/photo-1650873442159-65dda3860134?w=800&q=80'
    ],
    isFeatured: false,
    rating: 4.4,
    reviews: 52
  },
  {
    id: 8,
    name: 'Royal Bridal Gold Hathphool & Bangles',
    brand: 'Nakshatra Signature',
    slug: 'cz-tennis-bracelet',
    category: 'bangles',
    subcategory: 'bridal-bangles',
    sellPrice: 2199,
    mrp: 3799,
    off: 42,
    tag: 'BESTSELLER',
    offerTag: 'BRIDAL WEAR',
    stock: 16,
    material: 'Pure brass with 22K micro gold plating, floral Kundan centerpieces and adjustable ring links',
    care: 'Remove before bathing or contact with water.',
    description: 'Intricate traditional Indian bridal hathphool featuring flower-shaped Kundan medallions, cascading pearl chains and matching gold bangles.',
    colors: [
      { name: '22K Gold Polish', hex: '#D4AF37', imageIndex: 0 },
      { name: 'Antique Gold', hex: '#B8860B', imageIndex: 0 }
    ],
    sizes: [
      { size: 'Free Size', stock: 16 }
    ],
    images: [
      'https://images.unsplash.com/photo-1762162089047-97e09435984d?w=800&q=80'
    ],
    isFeatured: true,
    rating: 4.8,
    reviews: 135
  },
  {
    id: 9,
    name: 'Polki & Emerald Chandbali Earrings',
    brand: 'Nizampilla Divya Jewellery',
    slug: 'polki-emerald-chandbali-earrings',
    category: 'earrings',
    subcategory: 'chandbalis',
    sellPrice: 2799,
    mrp: 4699,
    off: 40,
    tag: 'NEW',
    offerTag: 'ROYAL EDIT',
    stock: 10,
    material: 'Gold polished alloy with uncut open-setting Polki stones, green hydro beads and pearl fringe',
    care: 'Store flat in the provided jewellery box.',
    description: 'Crescent moon chandbali earrings handcrafted with uncut Polki stones, faux Colombian emerald stones, and delicate pearl tassels.',
    colors: [
      { name: 'Kundan Green', hex: '#2E8B57', imageIndex: 0 },
      { name: 'Ruby Red', hex: '#9B111E', imageIndex: 0 }
    ],
    sizes: [
      { size: 'Free Size', stock: 10 }
    ],
    images: [
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80'
    ],
    isFeatured: true,
    rating: 4.7,
    reviews: 67
  },
  {
    id: 10,
    name: 'Traditional Kasu Mala Long Haram',
    brand: 'Divya Silver Craft',
    slug: 'silver-evil-eye-pendant-chain',
    category: 'necklaces',
    subcategory: 'temple-necklaces',
    sellPrice: 2499,
    mrp: 3999,
    off: 38,
    tag: 'POPULAR',
    offerTag: 'HERITAGE',
    stock: 19,
    material: 'Temple copper alloy with 24K antique matte gold polish and embossed Lakshmi coin motifs',
    care: 'Tarnish-resistant finish. Avoid perfumes.',
    description: 'A timeless South Indian Kasu Mala adorned with auspicious Goddess Lakshmi coins strung closely along a braided gold rope border.',
    colors: [
      { name: 'Antique Gold', hex: '#B8860B', imageIndex: 0 },
      { name: '22K Gold Polish', hex: '#D4AF37', imageIndex: 0 }
    ],
    sizes: [
      { size: 'Adjustable', stock: 19 }
    ],
    images: [
      'https://images.unsplash.com/photo-1662561516992-5bf89d3aab8b?w=800&q=80'
    ],
    isFeatured: false,
    rating: 4.6,
    reviews: 91
  },
  {
    id: 11,
    name: 'Traditional Gold & Black Bead Mangalsutra',
    brand: 'Nizampilla Divya Jewellery',
    slug: 'classic-solitaire-mangalsutra',
    category: 'mangalsutras',
    subcategory: 'short-mangalsutra',
    sellPrice: 2299,
    mrp: 3899,
    off: 41,
    tag: 'DAILY WEAR',
    offerTag: 'AUSPICIOUS',
    stock: 14,
    material: '18K yellow gold plated brass with authentic auspicious black beads and temple pendant',
    care: 'Safe for daily use. Keep away from harsh detergents.',
    description: 'Authentic double-line black bead chain featuring a handcrafted traditional gold pendant with floral filigree detailing.',
    colors: [
      { name: '22K Gold Polish', hex: '#D4AF37', imageIndex: 0 }
    ],
    sizes: [
      { size: '18 Inch', stock: 14 }
    ],
    images: [
      'https://images.unsplash.com/photo-1673960188795-8487e65466b2?w=800&q=80'
    ],
    isFeatured: false,
    rating: 4.5,
    reviews: 48
  },
  {
    id: 12,
    name: 'Bridal Kundan Matha Patti & Tikka',
    brand: 'Nizampilla Divya Jewellery',
    slug: 'bridal-kundan-matha-patti',
    category: 'bridal',
    subcategory: 'matha-patti',
    sellPrice: 3499,
    mrp: 5999,
    off: 42,
    tag: 'BRIDAL',
    offerTag: 'HANDMADE',
    stock: 7,
    material: '24K Gold Polish with Meenakari back-detailing and Kundan stone multi-strand hair chains',
    care: 'Handle gently. Secure with bobby pins provided.',
    description: 'Majestic multi-layered bridal headpiece that frames the forehead with luminous pearl strands and floral Kundan medallions.',
    colors: [
      { name: 'Pearl White', hex: '#F8F6F0', imageIndex: 0 },
      { name: 'Ruby Red & Emerald', hex: '#9B111E', imageIndex: 0 }
    ],
    sizes: [
      { size: 'Free Size', stock: 7 }
    ],
    images: [
      'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=800&q=80'
    ],
    isFeatured: true,
    rating: 4.9,
    reviews: 39
  },
  {
    id: 13,
    name: 'Royal Meenakari Floral Cocktail Ring',
    brand: 'Nakshatra Signature',
    slug: 'floral-cz-cocktail-ring',
    category: 'rings',
    subcategory: 'cocktail-rings',
    sellPrice: 1599,
    mrp: 2799,
    off: 43,
    tag: 'SALE',
    offerTag: 'HANDCRAFTED',
    stock: 12,
    material: 'Brass alloy with 22K yellow gold plating, vibrant enamel Meenakari and hand-set Kundan stones',
    care: 'Wipe with a soft jewellery cloth after each wear.',
    description: 'Opulent blooming flower statement ring adorned with royal peacock blue enamel, red highlights, and sparkling Kundan center.',
    colors: [
      { name: '22K Gold Polish', hex: '#D4AF37', imageIndex: 0 },
      { name: 'Rose Gold', hex: '#B76E79', imageIndex: 0 }
    ],
    sizes: [
      { size: 'Adjustable', stock: 6 },
      { size: 'Size 14', stock: 3 },
      { size: 'Size 16', stock: 3 }
    ],
    images: [
      'https://images.unsplash.com/photo-1770346279037-89853a3e8c60?w=800&q=80'
    ],
    isFeatured: false,
    rating: 4.6,
    reviews: 62
  },
  {
    id: 14,
    name: 'Sterling Silver Ghungroo Payal Anklets',
    brand: 'Divya Silver Craft',
    slug: 'silver-ghungroo-payal-anklets',
    category: 'anklets',
    subcategory: 'payal-anklets',
    sellPrice: 2999,
    mrp: 4999,
    off: 40,
    tag: 'NEW',
    offerTag: 'PAIR OF 2',
    stock: 9,
    material: '92.5% Purity Sterling Silver with musical silver bells and strong S-hook clasp',
    care: 'Clean with mild soapy water or silver dip. Dry completely.',
    description: 'Pure silver pair of payal anklets with sweet chime bells that ring softly with every step.',
    colors: [
      { name: '925 Silver', hex: '#C0C0C0', imageIndex: 0 }
    ],
    sizes: [
      { size: '10 Inch', stock: 5 },
      { size: '10.5 Inch', stock: 4 }
    ],
    images: [
      'https://images.unsplash.com/photo-1778148046621-4c1aecb22146?w=800&q=80'
    ],
    isFeatured: false,
    rating: 4.8,
    reviews: 44
  },
  {
    id: 15,
    name: 'Emerald Green Hydro Bead Layered Mala',
    brand: 'Nizampilla Divya Jewellery',
    slug: 'emerald-hydro-bead-layered-mala',
    category: 'necklaces',
    subcategory: 'temple-necklaces',
    sellPrice: 3199,
    mrp: 5499,
    off: 42,
    tag: 'ROYAL EDIT',
    offerTag: null,
    stock: 10,
    material: 'Faceted green hydro beads with antique gold carved spacer beads and temple brooch pendant',
    care: 'Do not pull abruptly. Store hanging or flat.',
    description: 'Grand 5-layer cascading necklace crafted with royal emerald green crystal beads, accented with antique gold polish temple spacers.',
    colors: [
      { name: 'Kundan Green', hex: '#2E8B57', imageIndex: 0 }
    ],
    sizes: [
      { size: 'Adjustable Dori', stock: 10 }
    ],
    images: [
      'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=800&q=80'
    ],
    isFeatured: true,
    rating: 4.8,
    reviews: 58
  }
]

export const heroBanners = [
  {
    id: 1,
    kicker: 'Bridal & Festive 2026',
    title: 'ROYAL HERITAGE',
    sub: 'Handcrafted 22K gold polish & authentic Kundan bridal sets made to captivate.',
    cta: 'Explore Bridal Sets',
    ctaLink: '/plp?category=bridal',
    img: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1400&q=80'
  },
  {
    id: 2,
    kicker: 'Festive Saree & Temple Edit',
    title: 'TEMPLE & JHUMKAS',
    sub: 'Traditional South Indian Kemp stone jhumkas, chokers and nakshi craftsmanship.',
    cta: 'View Traditional Designs',
    ctaLink: '/plp?category=earrings',
    img: 'https://images.unsplash.com/photo-1771654805882-95967672e6c1?w=1400&q=80'
  },
  {
    id: 3,
    kicker: 'Heritage Kundan & Matha Patti',
    title: 'BRIDAL ADORNMENTS',
    sub: 'Authentic handcrafted temple kadas and bridal hair jewellery.',
    cta: 'Shop Bridal Collection',
    ctaLink: '/plp?category=bridal',
    img: 'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=1400&q=80'
  }
]

export const dummyOrders = [
  {
    id: 'ORD-2026-00042',
    date: '07 May 2026',
    items: 2,
    total: 6398,
    status: 'paid',
    trackingLink: null,
    products: [
      { productId: 1, qty: 1, size: 'Free Size', color: '#2E8B57', unitPrice: 4499 },
      { productId: 3, qty: 1, size: 'Size 14', color: '#C0C0C0', unitPrice: 1899 }
    ]
  }
]

export const dummyAddresses = [
  {
    id: 1,
    label: 'Home',
    fullName: 'Rahul Sharma',
    phone: '+91 98765 43210',
    addressLine1: '42, Poes Garden, Alwarpet',
    addressLine2: 'Near Greenways Road',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600086',
    isDefault: true
  }
]

export const promoCodes = {
  FIRST10:  { type: 'percentage', value: 10, minCart: 0,    desc: '10% off your first order' },
  FREESHIP: { type: 'shipping',   value: 0,  minCart: 0,    desc: 'Free shipping applied!' },
  SAVE500:  { type: 'fixed',      value: 500, minCart: 2000, desc: '₹500 off on orders above ₹2000' }
}
