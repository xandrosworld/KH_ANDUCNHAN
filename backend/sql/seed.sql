-- ═══════════════════════════════════════════════════════════════════════════
--  So Do Van Phuc Seed Data
--  5 sample properties with images for testing
-- ═══════════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ─── Property 1: Luxury Beachfront Villa (Sale, VIP) ─────────────────────

INSERT INTO `properties`
  (`id`, `title`, `listing_type`, `property_type`, `price`, `bedrooms`, `bathrooms`, `sqft`,
   `address`, `city`, `state`, `zip`, `description`, `status`, `is_vip`,
   `youtube_url`, `contact_name`, `contact_phone`, `contact_email`, `main_image`)
VALUES
  ('prop-seed-001',
   'Luxury Beachfront Villa with Ocean Views',
   'sale', 'Villa', 2850000.00, 5, 4, 4200,
   '123 Ocean Drive', 'Duong Dong', 'Kien Giang', '92000',
   'Stunning 5-bedroom beachfront villa with panoramic ocean views. Features include a private infinity pool, open-concept living, chef''s kitchen with premium appliances, home theater, and direct beach access. Premium finishes throughout with imported marble and hardwood floors. Perfect for luxury living or vacation rental investment.',
   'active', 1,
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
   'Nguyen Van Minh', '+84 297 3980 123', 'minh@sodovanphuc.vn',
   'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800')
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `listing_type` = VALUES(`listing_type`),
  `property_type` = VALUES(`property_type`),
  `price` = VALUES(`price`),
  `bedrooms` = VALUES(`bedrooms`),
  `bathrooms` = VALUES(`bathrooms`),
  `sqft` = VALUES(`sqft`),
  `address` = VALUES(`address`),
  `city` = VALUES(`city`),
  `state` = VALUES(`state`),
  `zip` = VALUES(`zip`),
  `description` = VALUES(`description`),
  `status` = VALUES(`status`),
  `is_vip` = VALUES(`is_vip`),
  `youtube_url` = VALUES(`youtube_url`),
  `contact_name` = VALUES(`contact_name`),
  `contact_phone` = VALUES(`contact_phone`),
  `contact_email` = VALUES(`contact_email`),
  `main_image` = VALUES(`main_image`),
  `updated_at` = CURRENT_TIMESTAMP;

INSERT INTO `property_images` (`property_id`, `image_url`, `sort_order`) VALUES
  ('prop-seed-001', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', 0),
  ('prop-seed-001', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', 1),
  ('prop-seed-001', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 2)
ON DUPLICATE KEY UPDATE
  `sort_order` = VALUES(`sort_order`);

-- ─── Property 2: Modern Downtown Apartment (Rent) ───────────────────────

INSERT INTO `properties`
  (`id`, `title`, `listing_type`, `property_type`, `price`, `bedrooms`, `bathrooms`, `sqft`,
   `address`, `city`, `state`, `zip`, `description`, `status`, `is_vip`,
   `youtube_url`, `contact_name`, `contact_phone`, `contact_email`, `main_image`)
VALUES
  ('prop-seed-002',
   'Modern 2BR Apartment in City Center',
   'rent', 'Apartment', 1800.00, 2, 2, 1100,
   '456 Tran Hung Dao Street', 'Duong Dong', 'Kien Giang', '92000',
   'Beautifully furnished 2-bedroom apartment in the heart of Duong Dong. Walking distance to night market, restaurants, and shops. Features modern kitchen, washer/dryer, high-speed wifi, and a balcony with city views. Building amenities include gym, pool, and 24/7 security. Ideal for expats and digital nomads.',
   'active', 0,
   NULL,
   'Tran Thi Lan', '+84 297 3980 456', 'lan@sodovanphuc.vn',
   'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800')
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `listing_type` = VALUES(`listing_type`),
  `property_type` = VALUES(`property_type`),
  `price` = VALUES(`price`),
  `bedrooms` = VALUES(`bedrooms`),
  `bathrooms` = VALUES(`bathrooms`),
  `sqft` = VALUES(`sqft`),
  `address` = VALUES(`address`),
  `city` = VALUES(`city`),
  `state` = VALUES(`state`),
  `zip` = VALUES(`zip`),
  `description` = VALUES(`description`),
  `status` = VALUES(`status`),
  `is_vip` = VALUES(`is_vip`),
  `youtube_url` = VALUES(`youtube_url`),
  `contact_name` = VALUES(`contact_name`),
  `contact_phone` = VALUES(`contact_phone`),
  `contact_email` = VALUES(`contact_email`),
  `main_image` = VALUES(`main_image`),
  `updated_at` = CURRENT_TIMESTAMP;

INSERT INTO `property_images` (`property_id`, `image_url`, `sort_order`) VALUES
  ('prop-seed-002', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 0),
  ('prop-seed-002', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 1),
  ('prop-seed-002', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 2)
ON DUPLICATE KEY UPDATE
  `sort_order` = VALUES(`sort_order`);

-- ─── Property 3: Tropical Garden House (Sale) ───────────────────────────

INSERT INTO `properties`
  (`id`, `title`, `listing_type`, `property_type`, `price`, `bedrooms`, `bathrooms`, `sqft`,
   `address`, `city`, `state`, `zip`, `description`, `status`, `is_vip`,
   `youtube_url`, `contact_name`, `contact_phone`, `contact_email`, `main_image`)
VALUES
  ('prop-seed-003',
   'Tropical Garden House with Private Pool',
   'sale', 'Single Family', 680000.00, 3, 2, 2100,
   '789 Nguyen Trung Truc', 'An Thoi', 'Kien Giang', '92000',
   'Charming 3-bedroom tropical house surrounded by lush gardens. Features include a private swimming pool, outdoor BBQ area, covered terrace, and spacious living areas with natural light. Located in a quiet neighborhood near An Thoi harbor, perfect for families seeking tranquility with easy access to island amenities.',
   'active', 0,
   NULL,
   'Le Hoang Nam', '+84 297 3980 789', 'nam@sodovanphuc.vn',
   'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800')
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `listing_type` = VALUES(`listing_type`),
  `property_type` = VALUES(`property_type`),
  `price` = VALUES(`price`),
  `bedrooms` = VALUES(`bedrooms`),
  `bathrooms` = VALUES(`bathrooms`),
  `sqft` = VALUES(`sqft`),
  `address` = VALUES(`address`),
  `city` = VALUES(`city`),
  `state` = VALUES(`state`),
  `zip` = VALUES(`zip`),
  `description` = VALUES(`description`),
  `status` = VALUES(`status`),
  `is_vip` = VALUES(`is_vip`),
  `youtube_url` = VALUES(`youtube_url`),
  `contact_name` = VALUES(`contact_name`),
  `contact_phone` = VALUES(`contact_phone`),
  `contact_email` = VALUES(`contact_email`),
  `main_image` = VALUES(`main_image`),
  `updated_at` = CURRENT_TIMESTAMP;

INSERT INTO `property_images` (`property_id`, `image_url`, `sort_order`) VALUES
  ('prop-seed-003', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 0),
  ('prop-seed-003', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 1)
ON DUPLICATE KEY UPDATE
  `sort_order` = VALUES(`sort_order`);

-- ─── Property 4: Seaview Condo (Sale, VIP) ──────────────────────────────

INSERT INTO `properties`
  (`id`, `title`, `listing_type`, `property_type`, `price`, `bedrooms`, `bathrooms`, `sqft`,
   `address`, `city`, `state`, `zip`, `description`, `status`, `is_vip`,
   `youtube_url`, `contact_name`, `contact_phone`, `contact_email`, `main_image`)
VALUES
  ('prop-seed-004',
   'Premium Seaview Condo — 15th Floor Corner Unit',
   'sale', 'Condo', 420000.00, 2, 2, 1350,
   '101 Bai Truong Coastal Road', 'Duong Dong', 'Kien Giang', '92000',
   'Premium corner unit on the 15th floor with unobstructed sea views. This 2-bedroom, 2-bathroom condo features floor-to-ceiling windows, imported Italian kitchen, smart home system, and two parking spaces. Resort-style amenities include infinity pool, spa, fitness center, and private beach access. Excellent rental income potential.',
   'active', 1,
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
   'Pham Duc Anh', '+84 297 3980 101', 'anh@sodovanphuc.vn',
   'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800')
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `listing_type` = VALUES(`listing_type`),
  `property_type` = VALUES(`property_type`),
  `price` = VALUES(`price`),
  `bedrooms` = VALUES(`bedrooms`),
  `bathrooms` = VALUES(`bathrooms`),
  `sqft` = VALUES(`sqft`),
  `address` = VALUES(`address`),
  `city` = VALUES(`city`),
  `state` = VALUES(`state`),
  `zip` = VALUES(`zip`),
  `description` = VALUES(`description`),
  `status` = VALUES(`status`),
  `is_vip` = VALUES(`is_vip`),
  `youtube_url` = VALUES(`youtube_url`),
  `contact_name` = VALUES(`contact_name`),
  `contact_phone` = VALUES(`contact_phone`),
  `contact_email` = VALUES(`contact_email`),
  `main_image` = VALUES(`main_image`),
  `updated_at` = CURRENT_TIMESTAMP;

INSERT INTO `property_images` (`property_id`, `image_url`, `sort_order`) VALUES
  ('prop-seed-004', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 0),
  ('prop-seed-004', 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800', 1),
  ('prop-seed-004', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', 2)
ON DUPLICATE KEY UPDATE
  `sort_order` = VALUES(`sort_order`);

-- ─── Property 5: Commercial Shophouse (Rent) ────────────────────────────

INSERT INTO `properties`
  (`id`, `title`, `listing_type`, `property_type`, `price`, `bedrooms`, `bathrooms`, `sqft`,
   `address`, `city`, `state`, `zip`, `description`, `status`, `is_vip`,
   `youtube_url`, `contact_name`, `contact_phone`, `contact_email`, `main_image`)
VALUES
  ('prop-seed-005',
   'Prime Location Shophouse for Rent — High Foot Traffic',
   'rent', 'Commercial', 3500.00, 0, 1, 1800,
   '55 Bach Dang Street', 'Duong Dong', 'Kien Giang', '92000',
   'Prime retail/commercial space on the busiest street in Duong Dong. Ground floor shophouse with 6m frontage, high ceilings, and modern electrical/plumbing systems. Currently configured as open plan — suitable for restaurant, retail shop, café, or office. Includes storage room, staff bathroom, and rear loading access. High visibility location near the night market.',
   'active', 0,
   NULL,
   'Vo Minh Tuan', '+84 297 3980 555', 'tuan@sodovanphuc.vn',
   'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800')
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `listing_type` = VALUES(`listing_type`),
  `property_type` = VALUES(`property_type`),
  `price` = VALUES(`price`),
  `bedrooms` = VALUES(`bedrooms`),
  `bathrooms` = VALUES(`bathrooms`),
  `sqft` = VALUES(`sqft`),
  `address` = VALUES(`address`),
  `city` = VALUES(`city`),
  `state` = VALUES(`state`),
  `zip` = VALUES(`zip`),
  `description` = VALUES(`description`),
  `status` = VALUES(`status`),
  `is_vip` = VALUES(`is_vip`),
  `youtube_url` = VALUES(`youtube_url`),
  `contact_name` = VALUES(`contact_name`),
  `contact_phone` = VALUES(`contact_phone`),
  `contact_email` = VALUES(`contact_email`),
  `main_image` = VALUES(`main_image`),
  `updated_at` = CURRENT_TIMESTAMP;

INSERT INTO `property_images` (`property_id`, `image_url`, `sort_order`) VALUES
  ('prop-seed-005', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', 0),
  ('prop-seed-005', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', 1)
ON DUPLICATE KEY UPDATE
  `sort_order` = VALUES(`sort_order`);
