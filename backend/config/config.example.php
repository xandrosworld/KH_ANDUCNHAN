<?php
/**
 * So Do Van Phuc API Configuration
 *
 * Deployment:
 * 1. Copy this file to config.php on the hosting.
 * 2. Fill the real database, domain, email, and admin values.
 * 3. Never upload local secrets into a public repository.
 */

// Application
define('APP_NAME', 'So Do Van Phuc');
define('APP_ENV', 'production');
define('APP_VERSION', '2026.06.27');

// Database from Mat Bao hosting panel
define('DB_HOST', 'localhost');
define('DB_NAME', 'sodovanphuc_db');
define('DB_USER', 'sodovanphuc_user');
define('DB_PASS', 'replace_with_database_password');
define('DB_CONNECT_TIMEOUT', 3);

// Admin authentication
define('ADMIN_USERNAME', 'admin');
// Generate with deploy/new-hosting-config.ps1. It supports bcrypt when PHP CLI exists
// and PBKDF2-SHA256 fallback when PHP CLI is not available.
define('ADMIN_PASSWORD_HASH', '$2y$10$REPLACE_WITH_REAL_BCRYPT_HASH');

// Generate locally: openssl rand -hex 32
define('JWT_SECRET', 'replace_with_64_char_random_hex_string');
define('JWT_TTL', 28800);

// Legacy API key kept for inherited endpoints. Leave empty if unused.
define('ADMIN_API_KEY', '');

// CORS origins allowed to call this API.
// Same-domain deployment can still keep the domain values here.
define('CORS_ORIGINS', [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://sodovanphuc.vn',
    'https://www.sodovanphuc.vn',
    'https://api.sodovanphuc.vn',
]);

// Public backend URL without trailing slash.
// Same-domain with backend folder: https://sodovanphuc.vn/backend
// API subdomain: https://api.sodovanphuc.vn
define('BASE_URL', 'https://sodovanphuc.vn/backend');

// Public frontend URL without trailing slash.
define('FRONTEND_URL', 'https://sodovanphuc.vn');

// Upload limits
define('UPLOAD_MAX_SIZE', 20 * 1024 * 1024);
define('UPLOAD_MAX_IMAGES', 41);
define('UPLOAD_BATCH_MAX_IMAGES', 10);
define('UPLOAD_MAX_VIDEOS', 1);
define('UPLOAD_ALLOWED_TYPES', [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
]);
define('UPLOAD_VIDEO_MAX_SIZE', 120 * 1024 * 1024);
define('UPLOAD_VIDEO_ALLOWED_TYPES', [
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-m4v',
]);
define('UPLOAD_AVATAR_MAX_SIZE', 5 * 1024 * 1024);
define('UPLOAD_AVATAR_ALLOWED_TYPES', [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
]);

// AI description/chat endpoints, optional.
// Leave empty here and set AI_GEMINI_KEY in the environment/.env, or paste the key here on hosting.
define('AI_GEMINI_KEY', getenv('AI_GEMINI_KEY') ?: '');

// Email notifications
define('MAIL_FROM', 'contact@sodovanphuc.vn');
define('MAIL_FROM_NAME', 'Sổ Đỏ Vạn Phúc');
define('ADMIN_EMAIL', 'contact@sodovanphuc.vn');
define('SMTP_HOST', 'localhost');
define('SMTP_PORT', 25);
define('SMTP_USER', 'contact@sodovanphuc.vn');
define('SMTP_PASS', '');
define('SMTP_SECURE', '');

// Disable inherited real-estate auto-expire jobs for this SVP module.
define('ENABLE_LEGACY_AUTO_EXPIRE', false);

// Inherited payment constants. Not used by the current SVP delivery.
define('PAYPAL_CLIENT_ID', '');
define('PAYPAL_SECRET', '');
define('PAYPAL_SANDBOX', false);
