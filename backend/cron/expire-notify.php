<?php
/**
 * Cron Job: Auto-expire listings and notify owners
 * 
 * Run daily via hosting cron:
 *   php /path/to/htdocs/cron/expire-notify.php
 * 
 * Or via URL (with secret key):
 *   https://www.sodovanphuc.vn/cron/expire-notify.php?key=YOUR_CRON_SECRET
 */

// Prevent browser timeout
set_time_limit(120);

// Security: require cron secret key when called via HTTP
if (php_sapi_name() !== 'cli') {
    $cronSecret = 'gf_cron_2026_xK9mPq';  // Change this!
    if (($_GET['key'] ?? '') !== $cronSecret) {
        http_response_code(403);
        echo 'Forbidden';
        exit;
    }
}

// Load app
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../lib/Database.php';
require_once __DIR__ . '/../lib/Mailer.php';

$db = Database::getInstance();
$log = [];

// ─── Step 1: Auto-expire overdue listings ────────────────────────────────
$stmt = $db->prepare("UPDATE properties SET status = 'expired' WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()");
$stmt->execute();
$expiredCount = $stmt->rowCount();
$log[] = "Expired: {$expiredCount} listing(s)";

// ─── Step 2: Notify owners of listings expiring within 3 days ────────────
$soon = $db->prepare("
    SELECT p.id, p.address, p.city, p.state, p.expires_at, p.contact_email
    FROM properties p
    WHERE p.status = 'active'
      AND p.expires_at IS NOT NULL
      AND p.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
      AND (p.expiry_notified IS NULL OR p.expiry_notified = 0)
");
$soon->execute();
$soonExpiring = $soon->fetchAll(PDO::FETCH_ASSOC);

$notifiedCount = 0;
foreach ($soonExpiring as $listing) {
    $email = $listing['contact_email'] ?? '';
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) continue;

    $address = trim(($listing['address'] ?? '') . ', ' . ($listing['city'] ?? '') . ', ' . ($listing['state'] ?? ''));
    
    try {
        Mailer::notifyListingExpiring($email, $address, $listing['expires_at']);
        
        $update = $db->prepare("UPDATE properties SET expiry_notified = 1 WHERE id = :id");
        $update->execute(['id' => $listing['id']]);
        $notifiedCount++;
    } catch (Exception $e) {
        $log[] = "Failed to notify {$email}: " . $e->getMessage();
    }
}
$log[] = "Notified: {$notifiedCount} owner(s) about expiring listings";

// ─── Step 3: Notify admin summary ────────────────────────────────────────
if ($expiredCount > 0 || $notifiedCount > 0) {
    Mailer::notifyAdmin(
        "Daily listing report: {$expiredCount} expired, {$notifiedCount} notified",
        "<p><strong>{$expiredCount}</strong> listing(s) were auto-expired.</p>
         <p><strong>{$notifiedCount}</strong> owner(s) were notified about listings expiring within 3 days.</p>
         <p style='color:#888;font-size:13px'>This is an automated daily report from the cron job.</p>"
    );
    $log[] = "Admin notified";
}

// ─── Output ──────────────────────────────────────────────────────────────
$output = date('Y-m-d H:i:s') . " | " . implode(' | ', $log);
error_log("[CRON] " . $output);

if (php_sapi_name() !== 'cli') {
    header('Content-Type: text/plain');
}
echo $output . "\n";
