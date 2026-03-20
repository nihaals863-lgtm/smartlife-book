-- ============================================================
--  SHOPIER PAYMENT INTEGRATION - DATABASE MIGRATION
--  Run this SQL on your Railway (live) and local database
-- ============================================================

-- 1. pending_signups table
--    Stores form data BEFORE payment (temp, auto-expires)
CREATE TABLE IF NOT EXISTS `pending_signups` (
    `id`                  INT AUTO_INCREMENT PRIMARY KEY,
    `firstname`           VARCHAR(100) NOT NULL,
    `lastname`            VARCHAR(100) DEFAULT '0',
    `email`               VARCHAR(255) NOT NULL,
    `password_hash`       TEXT NOT NULL,
    `phone_number`        VARCHAR(50),
    `whatsapp_number`     VARCHAR(50),
    `selected_plan`       VARCHAR(100) NOT NULL,
    `promocode_used`      VARCHAR(100) DEFAULT NULL,
    `original_amount`     DECIMAL(10,2) NOT NULL,
    `final_amount`        DECIMAL(10,2) NOT NULL,
    `discount_applied`    DECIMAL(10,2) DEFAULT 0,
    `referred_by_id`      INT DEFAULT NULL,
    `shopier_link_normal` VARCHAR(500) DEFAULT NULL,
    `shopier_link_discount` VARCHAR(500) DEFAULT NULL,
    `created_at`          DATETIME DEFAULT NOW(),
    `expires_at`          DATETIME DEFAULT (DATE_ADD(NOW(), INTERVAL 2 HOUR)),
    UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. shopier_payment_logs table
--    Logs every confirmed Shopier payment for audit trail
CREATE TABLE IF NOT EXISTS `shopier_payment_logs` (
    `id`          INT AUTO_INCREMENT PRIMARY KEY,
    `email`       VARCHAR(255) NOT NULL,
    `order_id`    VARCHAR(255),
    `user_id`     INT DEFAULT NULL,
    `plan_name`   VARCHAR(100),
    `amount`      DECIMAL(10,2),
    `created_at`  DATETIME DEFAULT NOW(),
    `updated_at`  DATETIME DEFAULT NULL,
    UNIQUE KEY `uq_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. commission table (add IF NOT EXISTS for existing installs)
CREATE TABLE IF NOT EXISTS `commission` (
    `id`          INT AUTO_INCREMENT PRIMARY KEY,
    `user_id`     INT NOT NULL,
    `earned_by`   VARCHAR(255),
    `amount`      DECIMAL(10,2),
    `status`      ENUM('pending', 'paid') DEFAULT 'pending',
    `created_at`  DATETIME DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Fix existing subscriptions: enforce membership expiry
--    (for old users where is_active may be wrong)
-- Optional: run this to deactivate expired subscriptions
-- UPDATE subscriptions SET is_active = 0 WHERE end_date < NOW() AND is_active = 1 AND user_id != 0;

-- ============================================================
--  NOTES FOR RAILWAYS DEPLOYMENT:
--  Copy-paste the above CREATE TABLE statements into Railway
--  MySQL console or run via a migration script.
-- ============================================================
