-- Create Database
CREATE DATABASE IF NOT EXISTS `astra_proposal_ai` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `astra_proposal_ai`;

-- 1. USERS Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `role` VARCHAR(50) NOT NULL, -- 'Admin', 'Manager', 'Sales Executive', 'Designer'
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `password` VARCHAR(255) NULL, -- In place of password_hash to match types
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CLIENTS Table
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `company_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NULL,
  `phone` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_clients_company` (`company_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PROPOSALS Table
CREATE TABLE IF NOT EXISTS `proposals` (
  `id` VARCHAR(50) NOT NULL,
  `type` ENUM('branding', 'website') NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Draft', -- 'Draft', 'Under Review', 'Won', 'Lost', etc.
  `client_id` VARCHAR(50) NULL,
  `client_name` VARCHAR(255) NOT NULL,
  `company_name` VARCHAR(255) NOT NULL,
  `proposal_date` DATE NOT NULL,
  `brief_description` TEXT NULL,
  
  -- Flexible JSON structures for scopes, milestones, and resource costs
  `branding_scope` JSON NULL,
  `website_scope` JSON NULL,
  `milestones` JSON NULL,
  `resource_costs` JSON NULL,
  
  -- Financial variables
  `weeks` INT NOT NULL DEFAULT 5,
  `development_cost` DECIMAL(12,2) DEFAULT 0.00,
  `plugin_cost` DECIMAL(12,2) DEFAULT 0.00,
  `maintenance_cost` DECIMAL(12,2) DEFAULT 0.00,
  `additional_cost` DECIMAL(12,2) DEFAULT 0.00,
  `total_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_terms` TEXT NULL,
  
  -- Preparer details
  `prepared_by_name` VARCHAR(100) NULL,
  `prepared_by_company` VARCHAR(100) NULL,
  `prepared_by_title` VARCHAR(100) NULL,
  `prepared_by_user_id` VARCHAR(50) NULL,
  `assigned_user_id` VARCHAR(50) NULL,
  `assigned_user_name` VARCHAR(100) NULL,
  `shared_user_ids` JSON NULL,
  
  -- PDF / Letterhead visual overrides
  `custom_letterhead` LONGTEXT NULL,
  `letterhead_height` INT DEFAULT 100,
  `letterhead_mode` VARCHAR(50) DEFAULT 'minimal',
  `letterhead_full_page` TINYINT(1) DEFAULT 0,
  `show_watermark` TINYINT(1) DEFAULT 0,
  `custom_watermark_text` VARCHAR(255) NULL,
  
  -- Analytics variables
  `pdf_export_count` INT DEFAULT 0,
  
  -- Timestamp variables
  `created_at` VARCHAR(50) NOT NULL, -- Match ISO-8601 string from frontend types
  `updated_at` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_proposals_client_id` (`client_id`),
  KEY `idx_proposals_status` (`status`),
  KEY `idx_proposals_type` (`type`),
  CONSTRAINT `fk_proposals_client_id` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_proposals_prepared_by` FOREIGN KEY (`prepared_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_proposals_assignee` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PROPOSAL TEMPLATES Table
CREATE TABLE IF NOT EXISTS `proposal_templates` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `type` ENUM('branding', 'website') NOT NULL,
  `description` TEXT NULL,
  `structure_data` JSON NOT NULL, -- Standard configurations for milestones, paymentTerms, etc.
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. PROPOSAL VERSION HISTORY Table
CREATE TABLE IF NOT EXISTS `proposal_version_history` (
  `id` VARCHAR(50) NOT NULL,
  `proposal_id` VARCHAR(50) NOT NULL,
  `version_id` VARCHAR(100) NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `summary` TEXT NOT NULL,
  `proposal_state` JSON NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_version_proposal` (`proposal_id`),
  CONSTRAINT `fk_versions_proposal` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. CRM PIPELINE Table
CREATE TABLE IF NOT EXISTS `crm_pipeline` (
  `id` VARCHAR(50) NOT NULL,
  `proposal_id` VARCHAR(50) NOT NULL,
  `client_id` VARCHAR(50) NULL,
  `stage` VARCHAR(100) NOT NULL, -- 'Lead', 'Negotiation', 'Won', 'Lost', etc.
  `deal_value` DECIMAL(12,2) DEFAULT 0.00,
  `probability` INT DEFAULT 50, -- Percentage
  `expected_close_date` DATE NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_crm_proposal` (`proposal_id`),
  CONSTRAINT `fk_crm_proposal` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_crm_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. ACTIVITY LOG Table
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` VARCHAR(50) NOT NULL,
  `timestamp` VARCHAR(50) NOT NULL, -- Match ISO-8601 string from frontend types
  `user_id` VARCHAR(50) NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `details` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_activity_timestamp` (`timestamp`),
  CONSTRAINT `fk_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. FILE ATTACHMENTS Table
CREATE TABLE IF NOT EXISTS `file_attachments` (
  `id` VARCHAR(50) NOT NULL,
  `proposal_id` VARCHAR(50) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_url` TEXT NOT NULL,
  `file_size` INT NOT NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attachments_proposal` (`proposal_id`),
  CONSTRAINT `fk_attachments_proposal` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. NOTIFICATIONS Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- SEED DATA FOR IMMEDIATE TESTING
-- ==========================================

-- A. Users Seeds
INSERT INTO `users` (`id`, `name`, `email`, `role`, `is_active`, `password`) VALUES
('user_ninan', 'Ninan P Joseph', 'ninanpjoseph@gmail.com', 'Admin', 1, 'astra2026'),
('user_shamlan', 'Shamlan CT', 'shamlan@technoastra.com', 'Manager', 1, 'shamlan123'),
('user_shareef', 'Shareef', 'shareef@technoastra.com', 'Designer', 1, 'shareef123');

-- B. Clients Seeds (Qatar-based companies)
INSERT INTO `clients` (`id`, `name`, `company_name`, `email`, `phone`) VALUES
('client_mannai', 'Mannai Technology', 'Mannai TechHub', 'info@mannaitech.qa', '+974 4455 6677'),
('client_pearl', 'Pearl Property Advisors', 'Pearl Capital Advisors', 'pearl_advisory@pearl.com.qa', '+974 4488 9900');

-- C. Proposal Templates Seeds
INSERT INTO `proposal_templates` (`id`, `name`, `type`, `description`, `structure_data`) VALUES
('tpl_website_default', 'Astra Web Design & Dev Framework', 'website', 'Standard dynamic template with a 4-milestone plan for high-performance React/TypeScript application designs.', 
'{
  "weeks": 8,
  "paymentTerms": "50% Advanced Payment upon Agreement sign-off, 25% upon Design Approval, and 25% upon final assets delivery and Launch.",
  "developmentCost": 12000,
  "pluginCost": 1200,
  "maintenanceCost": 1500,
  "additionalCost": 1500,
  "milestones": [
    {"week": "Week 1 - 2", "title": "Information Architecture", "description": "Design dual-language interactive sitemaps, wireframes, and UX storyboards."},
    {"week": "Week 3 - 5", "title": "Theme Composition & Front-ends", "description": "Implement high-speed Next.js pages styled with Tailwind, and dynamic transitions."},
    {"week": "Week 6 - 7", "title": "Headless CMS Connection & SEO", "description": "Integrate Strapi endpoints for career postings, portfolio items, and configure Yoast Premium metadata."},
    {"week": "Week 8", "title": "Staging Audits & Domain DNS Cutover", "description": "Complete responsive tests, security audits, and shift traffic to Cloud Run server setups."}
  ]
}'),
('tpl_branding_default', 'Astra branding & Identity Framework', 'branding', 'Elite branding layout outline specifying creative direction, shield marks, and corporate brandbooks.', 
'{
  "weeks": 5,
  "paymentTerms": "40% upfront deposit on contract signature, 40% after creative concept selection, and 20% on brand guidelines delivery.",
  "resourceCosts": [
    {"role": "Creative Director", "hours": 30, "rate": 300},
    {"role": "Senior Typographer & Designer", "hours": 50, "rate": 200},
    {"role": "Material & Print Consultant", "hours": 10, "rate": 150}
  ],
  "milestones": [
    {"week": "Week 1", "title": "Visual Space Alignment & Auditing", "description": "Workshop mapping competing funds, luxurious layouts, gold typography traits, and core colors."},
    {"week": "Weeks 2 - 3", "title": "Shield & Logomark Creation", "description": "Develop three prestige crest/shield logomark proposals, typesetting with bespoke serifs."},
    {"week": "Week 4", "title": "Executive Stationery Package", "description": "Formulating physical specs for letterheads, premium cotton business cards, envelopes, and signature stamps."},
    {"week": "Week 5", "title": "Brand Guidelines Delivery", "description": "Compile detailed book of layouts, color tolerances (PMS Gold), safe boundaries, and vector drops."}
  ]
}');

-- D. Sample Saved Proposal Seed (Mannai TechHub)
INSERT INTO `proposals` (
  `id`, `type`, `status`, `client_id`, `client_name`, `company_name`, `proposal_date`, `brief_description`,
  `weeks`, `branding_scope`, `website_scope`, `milestones`, `resource_costs`,
  `development_cost`, `plugin_cost`, `maintenance_cost`, `additional_cost`, `total_cost`, `payment_terms`,
  `prepared_by_name`, `prepared_by_company`, `prepared_by_title`, `prepared_by_user_id`, `assigned_user_id`, `assigned_user_name`,
  `created_at`, `updated_at`
) VALUES (
  'prop_sample_mannai', 'website', 'Under Process', 'client_mannai', 'Mannai TechHub', 'Mannai TechHub Premium Site', '2026-02-08',
  'A modern, double-language corporate platform for Mannai TechHub to exhibit their emerging venture portfolio, cloud-native services, and capture regional enterprise leads across Qatar.',
  8, 
  '{"logoDesign": false, "brandGuidelines": false, "businessCards": false, "letterheads": false, "emailSignature": false, "envelopes": false, "officeStamp": false, "employeeIdCards": false, "receiptsVouchers": false, "additionalDeliverables": ""}',
  '{"totalPages": 12, "languages": "English & Arabic", "cmsType": "headless-strapi", "contactForms": true, "blogModule": true, "gallery": true, "careersSection": true, "downloadsSection": false, "seoPlugin": true, "securityPlugin": true, "cachePlugin": true, "maintenancePeriod": 6}',
  '[
    {"id": "sm_m1", "week": "Week 1 - 2", "title": "Information Architecture", "description": "Design dual-language interactive sitemaps, wireframes, and UX storyboards."},
    {"id": "sm_m2", "week": "Week 3 - 5", "title": "Theme Composition & Front-ends", "description": "Implement high-speed Next.js pages styled with Tailwind, and dynamic transitions."},
    {"id": "sm_m3", "week": "Week 6 - 7", "title": "Headless CMS Connection & SEO", "description": "Integrate Strapi endpoints for career postings, portfolio items, and configure Yoast Premium metadata."},
    {"id": "sm_m4", "week": "Week 8", "title": "Staging Audits & Domain DNS Cutover", "description": "Complete responsive tests, security audits, and shift traffic to Cloud Run server setups."}
  ]',
  '[]',
  12000.00, 1200.00, 1500.00, 1500.00, 16200.00, '50% Advanced, 25% upon Client Design approval, 25% upon Deployment.',
  'Ninan P Joseph', 'Astra Technologies', 'Astra Technologies', 'user_ninan', 'user_shamlan', 'Shamlan CT',
  '2026-02-08T10:00:00.000Z', '2026-02-08T10:30:00.000Z'
);

-- E. CRM Pipeline Seed
INSERT INTO `crm_pipeline` (`id`, `proposal_id`, `client_id`, `stage`, `deal_value`, `probability`, `expected_close_date`) VALUES
('crm_mannai', 'prop_sample_mannai', 'client_mannai', 'In Negotiations', 16200.00, 75, '2026-03-15');

-- F. Activity Log Seed
INSERT INTO `activity_log` (`id`, `timestamp`, `user_id`, `user_name`, `user_role`, `action`, `details`) VALUES
('act_seed_1', '2026-02-08T10:00:00.000Z', 'user_ninan', 'Ninan P Joseph', 'Admin', 'Create Proposal', 'Initialized Mannai TechHub Web proposal successfully.'),
('act_seed_2', '2026-02-08T10:30:00.000Z', 'user_ninan', 'Ninan P Joseph', 'Admin', 'Assign Proposal', 'Assigned Mannai TechHub Web proposal to Shamlan CT.');

-- 7. PROPOSAL PAYMENTS Table
CREATE TABLE IF NOT EXISTS `proposal_payments` (
  `id` VARCHAR(50) NOT NULL,
  `proposal_id` VARCHAR(50) NOT NULL,
  `payment_number` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_date` DATE NOT NULL,
  `payment_reference` VARCHAR(255) NULL,
  `payment_method` VARCHAR(100) NOT NULL DEFAULT 'Bank Transfer',
  `notes` TEXT NULL,
  `recorded_by` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_proposal_id` (`proposal_id`),
  CONSTRAINT `fk_proposal_payments_proposal` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proposal_payments_user` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

