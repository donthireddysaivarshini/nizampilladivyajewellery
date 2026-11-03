INSERT INTO roles(name) VALUES ('customer'), ('admin') ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions(name) VALUES ('view_catalog') ON CONFLICT (name) DO NOTHING;
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='customer' AND p.name='view_catalog'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin: admin@gmail.com / 123123123
INSERT INTO users(role_id, name, email, phone, password_hash)
SELECT id, 'Divya Admin', 'admin@gmail.com', '+91 99483 42710', '$2a$12$0TbT5iMZE.KBTlVFLiCjmevl1mxKZZngd7/S7YAEYdLVLueNMcEqu'
FROM roles WHERE name='admin'
ON CONFLICT (email) DO UPDATE SET role_id=EXCLUDED.role_id, password_hash=EXCLUDED.password_hash, is_active=true, status='active', updated_at=now();

-- Customer: rahul@example.com / password123
INSERT INTO users(role_id, name, email, phone, password_hash)
SELECT id, 'Rahul Sharma', 'rahul@example.com', '+91 98765 43210', '$2a$10$wN1bVp896sV5V5a6JmQpgeV2U/5iE6k3yPGBJ3h9wR8QvG5tB4SVO'
FROM roles WHERE name='customer'
ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, is_active=true, status='active', updated_at=now();

INSERT INTO user_addresses(user_id, label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default)
SELECT id, 'Home', 'Rahul Sharma', '+91 98765 43210', '42, Poes Garden, Alwarpet', 'Near Greenways Road', 'Chennai', 'Tamil Nadu', '600086', true
FROM users WHERE email='rahul@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO user_notification_preferences(user_id)
SELECT id FROM users WHERE email='rahul@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- 8 Core Jewellery Categories with verified 200 OK Indian jewellery photos
INSERT INTO categories(name, slug, image_url, sort_order) VALUES
('Necklaces & Chokers', 'necklaces', 'https://images.unsplash.com/photo-1758995115857-2de1eb6283d0?w=600&q=80', 1),
('Earrings & Jhumkas', 'earrings', 'https://images.unsplash.com/photo-1743794444092-3ad1ab04f968?w=600&q=80', 2),
('Bangles & Kadas', 'bangles', 'https://images.unsplash.com/photo-1629224316810-9d8805b95e76?w=600&q=80', 3),
('Bridal Collection', 'bridal', 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80', 4),
('Silver Jewellery', 'silver-jewellery', 'https://images.unsplash.com/photo-1650873442159-65dda3860134?w=600&q=80', 5),
('Rings', 'rings', 'https://images.unsplash.com/photo-1770346279037-89853a3e8c60?w=600&q=80', 6),
('Mangalsutras', 'mangalsutras', 'https://images.unsplash.com/photo-1673960188795-8487e65466b2?w=600&q=80', 7),
('Anklets & Payal', 'anklets', 'https://images.unsplash.com/photo-1778148046621-4c1aecb22146?w=600&q=80', 8)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, image_url=EXCLUDED.image_url, sort_order=EXCLUDED.sort_order, deleted_at=NULL, is_active=true;

-- Brands
INSERT INTO brands(name) VALUES 
('Nizampilla Divya Jewellery'),
('Royal Heritage'),
('Divya Silver Craft'),
('Nakshatra Signature'),
('Vedic Gold Polish')
ON CONFLICT (name) DO NOTHING;

-- Jewellery Products
INSERT INTO products(category_id, brand_id, name, slug, subcategory, sell_price, mrp, discount_percent, tag, offer_tag, stock, material, care, description, is_featured, rating, reviews)
SELECT c.id, b.id, p.name, p.slug, p.subcategory, p.sell_price, p.mrp, p.discount_percent, p.tag, p.offer_tag, p.stock, p.material, p.care, p.description, p.is_featured, p.rating, p.reviews
FROM (VALUES
  ('necklaces','Nizampilla Divya Jewellery','Royal Kundan & Pearl Choker Set','kundan-pearl-choker-set','kundan-sets',4499,7999,44,'BESTSELLER','BRIDAL EDIT',12,'Brass alloy with 24K Micro Gold Plating & Hand-cut Kundan stones with natural freshwater pearls','Keep away from water, perfume, and harsh chemicals. Store in airtight zip pouch after use.','An opulent handcrafted choker necklace adorned with radiant Kundan stones, emerald green accents, and cascading pearl drops. Paired with matching statement earrings and a maang tikka.',true,4.8,142),
  ('necklaces','Royal Heritage','Antique Lakshmi Temple Necklace','antique-lakshmi-temple-necklace','temple-necklaces',5899,9999,41,'NEW','TEMPLE CRAFT',8,'Temple Brass alloy with antique matte gold finish and genuine red Kemp stones','Wipe gently with dry soft cloth. Avoid direct contact with moisture.','Sacred Goddess Lakshmi motifs intricately carved in Nakshi style, bordered by Kemp cabochon stones and cluster bell drops. Complete with matching heritage jhumkas.',true,4.9,86),
  ('rings','Divya Silver Craft','Heritage Kundan Arsi Cocktail Ring','925-pure-silver-solitaire-ring','kundan-rings',1899,3299,42,'BESTSELLER','ROYAL EDIT',15,'Brass alloy with 22K yellow gold plating, uncut mirror polki stones and pearl cluster border','Keep away from water and perfume. Store in velvet box.','A grand traditional royal Indian mirror arsi ring with floral Kundan petal setting and dainty seed pearl halo.',true,4.7,118),
  ('earrings','Nizampilla Divya Jewellery','Peacock Kemp Grand Jhumkas','peacock-kemp-grand-jhumkas','jhumkas',2499,4199,40,'NEW','FESTIVE',14,'Brass with 22K matte gold plating, Kemp red stones, and dangling seed pearls','Handle with care. Avoid perfumes and moisture.','Majestic twin peacocks sculpted above two-tier ornate bell domes with fine filigree work and delicate pearl hangings.',true,4.6,94),
  ('bridal','Nakshatra Signature','American Diamond CZ Bridal Set','american-diamond-cz-bridal-set','bridal-sets',8999,14999,40,'LUXURY','BRIDAL FAVOURITE',6,'High-grade AAA Swiss Zirconia with two-tone Platinum and Rose Gold rhodium plating','Store individually in velvet box provided.','Stunning collar necklace encrusted with brilliant-cut pear and marquise CZ diamonds that glisten like natural diamonds, complete with chandelier drop earrings.',true,4.9,64),
  ('bangles','Royal Heritage','Traditional Gold Plated Temple Kadas','traditional-gold-temple-kadas','antique-kadas',3299,5499,40,'SALE','PAIR OF 2',18,'Copper-brass base with 1 gram micro gold plating and side screw opening','Wipe with a clean dry cotton cloth. Do not soak in water.','Heavy royal kadas featuring relief carvings of floral vines and elephant motifs with secure screw closure.',true,4.5,78),
  ('silver-jewellery','Divya Silver Craft','Oxidised Silver Tribal Hasli Necklace','oxidised-silver-tribal-hasli','oxidised-necklaces',1699,2899,41,'TRENDING',null,11,'German silver alloy with antique black oxidised polish','Keep dry. Polish with cotton to maintain vintage patina.','Bohemian rigid collar hasli necklace adorned with ghungroo bells and geometric mirror medallions.',false,4.4,52),
  ('bangles','Nakshatra Signature','Royal Bridal Gold Hathphool & Bangles','cz-tennis-bracelet','bridal-bangles',2199,3799,42,'BESTSELLER','BRIDAL WEAR',16,'Pure brass with 22K micro gold plating, floral Kundan centerpieces and adjustable ring links','Remove before bathing or contact with water.','Intricate traditional Indian bridal hathphool featuring flower-shaped Kundan medallions, cascading pearl chains and matching gold bangles.',true,4.8,135),
  ('earrings','Nizampilla Divya Jewellery','Polki & Emerald Chandbali Earrings','polki-emerald-chandbali-earrings','chandbalis',2799,4699,40,'NEW','ROYAL EDIT',10,'Gold polished alloy with uncut open-setting Polki stones, green hydro beads and pearl fringe','Store flat in the provided jewellery box.','Crescent moon chandbali earrings handcrafted with uncut Polki stones, faux Colombian emerald stones, and delicate pearl tassels.',true,4.7,67),
  ('necklaces','Divya Silver Craft','Traditional Kasu Mala Long Haram','silver-evil-eye-pendant-chain','temple-necklaces',2499,3999,38,'POPULAR','HERITAGE',19,'Temple copper alloy with 24K antique matte gold polish and embossed Lakshmi coin motifs','Tarnish-resistant finish. Avoid perfumes.','A timeless South Indian Kasu Mala adorned with auspicious Goddess Lakshmi coins strung closely along a braided gold rope border.',false,4.6,91),
  ('mangalsutras','Nizampilla Divya Jewellery','Traditional Gold & Black Bead Mangalsutra','classic-solitaire-mangalsutra','short-mangalsutra',2299,3899,41,'DAILY WEAR','AUSPICIOUS',14,'18K yellow gold plated brass with authentic auspicious black beads and temple pendant','Safe for daily use. Keep away from harsh detergents.','Authentic double-line black bead chain featuring a handcrafted traditional gold pendant with floral filigree detailing.',false,4.5,48),
  ('bridal','Nizampilla Divya Jewellery','Bridal Kundan Matha Patti & Tikka','bridal-kundan-matha-patti','matha-patti',3499,5999,42,'BRIDAL','HANDMADE',7,'24K Gold Polish with Meenakari back-detailing and Kundan stone multi-strand hair chains','Handle gently. Secure with bobby pins provided.','Majestic multi-layered bridal headpiece that frames the forehead with luminous pearl strands and floral Kundan medallions.',true,4.9,39),
  ('rings','Nakshatra Signature','Royal Meenakari Floral Cocktail Ring','floral-cz-cocktail-ring','cocktail-rings',1599,2799,43,'SALE','HANDCRAFTED',12,'Brass alloy with 22K yellow gold plating, vibrant enamel Meenakari and hand-set Kundan stones','Wipe with a soft jewellery cloth after each wear.','Opulent blooming flower statement ring adorned with royal peacock blue enamel, red highlights, and sparkling Kundan center.',false,4.6,62),
  ('anklets','Divya Silver Craft','Sterling Silver Ghungroo Payal Anklets','silver-ghungroo-payal-anklets','payal-anklets',2999,4999,40,'NEW','PAIR OF 2',9,'92.5% Purity Sterling Silver with musical silver bells and strong S-hook clasp','Clean with mild soapy water or silver dip. Dry completely.','Pure silver pair of payal anklets with sweet chime bells that ring softly with every step.',false,4.8,44),
  ('necklaces','Nizampilla Divya Jewellery','Emerald Green Hydro Bead Layered Mala','emerald-hydro-bead-layered-mala','temple-necklaces',3199,5499,42,'ROYAL EDIT',null,10,'Faceted green hydro beads with antique gold carved spacer beads and temple brooch pendant','Do not pull abruptly. Store hanging or flat.','Grand 5-layer cascading necklace crafted with royal emerald green crystal beads, accented with antique gold polish temple spacers.',true,4.8,58)
) AS p(category_slug, brand_name, name, slug, subcategory, sell_price, mrp, discount_percent, tag, offer_tag, stock, material, care, description, is_featured, rating, reviews)
JOIN categories c ON c.slug=p.category_slug
JOIN brands b ON b.name=p.brand_name
ON CONFLICT (slug) DO UPDATE SET 
  category_id=EXCLUDED.category_id,
  brand_id=EXCLUDED.brand_id,
  name=EXCLUDED.name,
  subcategory=EXCLUDED.subcategory,
  sell_price=EXCLUDED.sell_price,
  mrp=EXCLUDED.mrp,
  discount_percent=EXCLUDED.discount_percent,
  tag=EXCLUDED.tag,
  offer_tag=EXCLUDED.offer_tag,
  stock=EXCLUDED.stock,
  material=EXCLUDED.material,
  care=EXCLUDED.care,
  description=EXCLUDED.description,
  is_featured=EXCLUDED.is_featured,
  rating=EXCLUDED.rating,
  reviews=EXCLUDED.reviews,
  deleted_at=NULL,
  is_active=true,
  updated_at=now();

-- Product Images (Every single URL verified 200 OK)
DELETE FROM product_images WHERE product_id IN (
  SELECT id FROM products WHERE slug IN (
    'kundan-pearl-choker-set','antique-lakshmi-temple-necklace','925-pure-silver-solitaire-ring',
    'peacock-kemp-grand-jhumkas','american-diamond-cz-bridal-set','traditional-gold-temple-kadas',
    'oxidised-silver-tribal-hasli','cz-tennis-bracelet','polki-emerald-chandbali-earrings',
    'silver-evil-eye-pendant-chain','classic-solitaire-mangalsutra','bridal-kundan-matha-patti',
    'floral-cz-cocktail-ring','silver-ghungroo-payal-anklets','emerald-hydro-bead-layered-mala'
  )
);
INSERT INTO product_images(product_id, image_url, alt_text, sort_order)
SELECT p.id, i.url, p.name, i.sort_order
FROM products p
JOIN (VALUES
  ('kundan-pearl-choker-set','https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800&q=80',1),
  ('antique-lakshmi-temple-necklace','https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=800&q=80',1),
  ('925-pure-silver-solitaire-ring','https://images.unsplash.com/photo-1770346279037-89853a3e8c60?w=800&q=80',1),
  ('peacock-kemp-grand-jhumkas','https://images.unsplash.com/photo-1743794444092-3ad1ab04f968?w=800&q=80',1),
  ('american-diamond-cz-bridal-set','https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=80',1),
  ('traditional-gold-temple-kadas','https://images.unsplash.com/photo-1629224316810-9d8805b95e76?w=800&q=80',1),
  ('oxidised-silver-tribal-hasli','https://images.unsplash.com/photo-1650873442159-65dda3860134?w=800&q=80',1),
  ('cz-tennis-bracelet','https://images.unsplash.com/photo-1762162089047-97e09435984d?w=800&q=80',1),
  ('polki-emerald-chandbali-earrings','https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',1),
  ('silver-evil-eye-pendant-chain','https://images.unsplash.com/photo-1662561516992-5bf89d3aab8b?w=800&q=80',1),
  ('classic-solitaire-mangalsutra','https://images.unsplash.com/photo-1673960188795-8487e65466b2?w=800&q=80',1),
  ('bridal-kundan-matha-patti','https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=800&q=80',1),
  ('floral-cz-cocktail-ring','https://images.unsplash.com/photo-1770346279037-89853a3e8c60?w=800&q=80',1),
  ('silver-ghungroo-payal-anklets','https://images.unsplash.com/photo-1778148046621-4c1aecb22146?w=800&q=80',1),
  ('emerald-hydro-bead-layered-mala','https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=800&q=80',1)
) AS i(slug, url, sort_order) ON i.slug=p.slug
ON CONFLICT DO NOTHING;

-- Product Colors / Finishes
INSERT INTO product_colors(product_id, name, hex, image_index, sort_order)
SELECT p.id, c.name, c.hex, 0, c.sort_order
FROM products p
JOIN (VALUES
  ('kundan-pearl-choker-set','Kundan Green','#2E8B57',1),
  ('kundan-pearl-choker-set','Ruby Red','#9B111E',2),
  ('antique-lakshmi-temple-necklace','Antique Gold','#B8860B',1),
  ('925-pure-silver-solitaire-ring','925 Silver','#C0C0C0',1),
  ('925-pure-silver-solitaire-ring','Rose Gold','#B76E79',2),
  ('peacock-kemp-grand-jhumkas','Ruby Red & Emerald','#9B111E',1),
  ('peacock-kemp-grand-jhumkas','22K Gold Polish','#D4AF37',2),
  ('american-diamond-cz-bridal-set','Rose Gold','#B76E79',1),
  ('american-diamond-cz-bridal-set','925 Silver','#C0C0C0',2),
  ('traditional-gold-temple-kadas','22K Gold Polish','#D4AF37',1),
  ('traditional-gold-temple-kadas','Antique Gold','#B8860B',2),
  ('oxidised-silver-tribal-hasli','Oxidised Silver','#4A4A4A',1),
  ('cz-tennis-bracelet','925 Silver','#C0C0C0',1),
  ('cz-tennis-bracelet','Rose Gold','#B76E79',2),
  ('cz-tennis-bracelet','22K Gold Polish','#D4AF37',3),
  ('polki-emerald-chandbali-earrings','Kundan Green','#2E8B57',1),
  ('polki-emerald-chandbali-earrings','Ruby Red','#9B111E',2),
  ('silver-evil-eye-pendant-chain','925 Silver','#C0C0C0',1),
  ('silver-evil-eye-pendant-chain','Rose Gold','#B76E79',2),
  ('classic-solitaire-mangalsutra','22K Gold Polish','#D4AF37',1),
  ('bridal-kundan-matha-patti','Pearl White','#F8F6F0',1),
  ('bridal-kundan-matha-patti','Ruby Red & Emerald','#9B111E',2),
  ('floral-cz-cocktail-ring','925 Silver','#C0C0C0',1),
  ('floral-cz-cocktail-ring','Rose Gold','#B76E79',2),
  ('silver-ghungroo-payal-anklets','925 Silver','#C0C0C0',1),
  ('emerald-hydro-bead-layered-mala','Kundan Green','#2E8B57',1)
) AS c(slug, name, hex, sort_order) ON c.slug=p.slug
ON CONFLICT DO NOTHING;

-- Product Sizes / Dimensions
INSERT INTO product_sizes(product_id, size, stock, sort_order)
SELECT p.id, s.size, s.stock, s.sort_order
FROM products p
JOIN (VALUES
  ('kundan-pearl-choker-set','Free Size',12,1),
  ('antique-lakshmi-temple-necklace','Adjustable Dori',8,1),
  ('925-pure-silver-solitaire-ring','Size 12',4,1),
  ('925-pure-silver-solitaire-ring','Size 14',5,2),
  ('925-pure-silver-solitaire-ring','Size 16',4,3),
  ('925-pure-silver-solitaire-ring','Adjustable',2,4),
  ('peacock-kemp-grand-jhumkas','Free Size',14,1),
  ('american-diamond-cz-bridal-set','Free Size',6,1),
  ('traditional-gold-temple-kadas','2.4',6,1),
  ('traditional-gold-temple-kadas','2.6',8,2),
  ('traditional-gold-temple-kadas','2.8',4,3),
  ('oxidised-silver-tribal-hasli','Adjustable Dori',11,1),
  ('cz-tennis-bracelet','Free Size',16,1),
  ('polki-emerald-chandbali-earrings','Free Size',10,1),
  ('silver-evil-eye-pendant-chain','Adjustable',19,1),
  ('classic-solitaire-mangalsutra','18 Inch',14,1),
  ('bridal-kundan-matha-patti','Free Size',7,1),
  ('floral-cz-cocktail-ring','Adjustable',6,1),
  ('floral-cz-cocktail-ring','Size 14',3,2),
  ('floral-cz-cocktail-ring','Size 16',3,3),
  ('silver-ghungroo-payal-anklets','10 Inch',5,1),
  ('silver-ghungroo-payal-anklets','10.5 Inch',4,2),
  ('emerald-hydro-bead-layered-mala','Adjustable Dori',10,1)
) AS s(slug, size, stock, sort_order) ON s.slug=p.slug
ON CONFLICT (product_id, size) DO UPDATE SET stock=EXCLUDED.stock, updated_at=now();

-- Hero Banners (Verified 200 OK Indian Jewellery & Bridal Photos)
DELETE FROM hero_banners;
INSERT INTO hero_banners(kicker, title, subtitle, cta_label, cta_link, image_url, sort_order) VALUES
('Bridal & Festive 2026', 'ROYAL HERITAGE', 'Handcrafted 22K gold polish & authentic Kundan bridal sets made to captivate.', 'Explore Bridal Sets', '/plp?category=bridal', 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1400&q=80', 1),
('Festive Saree & Temple Edit', 'TEMPLE & JHUMKAS', 'Traditional South Indian Kemp stone jhumkas, chokers and nakshi craftsmanship.', 'View Traditional Designs', '/plp?category=earrings', 'https://images.unsplash.com/photo-1771654805882-95967672e6c1?w=1400&q=80', 2),
('Heritage Kundan & Matha Patti', 'BRIDAL ADORNMENTS', 'Authentic handcrafted temple kadas and bridal hair jewellery.', 'Shop Bridal Collection', '/plp?category=bridal', 'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=1400&q=80', 3);

-- Site Settings
INSERT INTO site_settings(key, value) VALUES
('footer_marquee', '{"message":"Free insured delivery on orders above Rs. 999"}'),
('announcement_bar', '{"messages":["Complimentary delivery on jewellery orders above Rs. 999","Use code FIRST10 for 10% off your first order"]}'),
('branding', '{"storeName":"Nizampilla Divya Jewellery"}')
ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now(), is_active=true, deleted_at=NULL;

-- Promo Codes
INSERT INTO promo_codes(code, type, value, min_cart, description) VALUES
('FIRST10', 'percentage', 10, 0, '10% off your first order'),
('FREESHIP', 'shipping', 0, 0, 'Free shipping applied!'),
('SAVE500', 'fixed', 500, 2000, '500 off on orders above 2000')
ON CONFLICT (code) DO NOTHING;

-- Populate Category Subcategories
INSERT INTO category_subcategories(category_id, name, slug, sort_order)
SELECT c.id, initcap(replace(p.subcategory, '-', ' ')), p.subcategory, row_number() OVER (PARTITION BY c.id ORDER BY p.subcategory)
FROM (
  SELECT DISTINCT category_id, subcategory
  FROM products
  WHERE deleted_at IS NULL AND coalesce(subcategory, '') <> ''
) p
JOIN categories c ON c.id=p.category_id
ON CONFLICT (category_id, slug) DO NOTHING;

-- Populate Catalog Colors
INSERT INTO catalog_colors(name, hex, sort_order)
SELECT name, hex, row_number() OVER (ORDER BY lower(name), lower(hex))
FROM (
  SELECT DISTINCT name, hex
  FROM product_colors
  WHERE deleted_at IS NULL AND coalesce(name, '') <> '' AND coalesce(hex, '') <> ''
) colors
ON CONFLICT (name, hex) DO UPDATE SET deleted_at=NULL, is_active=true, status='active', updated_at=now();

-- Populate Catalog Sizes
INSERT INTO catalog_sizes(size, sort_order)
SELECT size, row_number() OVER (ORDER BY size)
FROM (
  SELECT DISTINCT size
  FROM product_sizes
  WHERE deleted_at IS NULL AND coalesce(size, '') <> ''
) sizes
ON CONFLICT (size) DO UPDATE SET deleted_at=NULL, is_active=true, status='active', updated_at=now();
