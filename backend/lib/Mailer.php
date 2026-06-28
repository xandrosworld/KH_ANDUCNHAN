<?php
/**
 * Mailer Helper — Email notifications via SMTP (PHPMailer)
 *
 * Uses SMTP authentication for reliable delivery to Gmail and external providers.
 * Falls back to PHP mail() if SMTP is not configured.
 */

require_once __DIR__ . '/PHPMailer/Exception.php';
require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class Mailer
{
    /** @var string Sender email */
    private static string $from = '';

    /**
     * Get the "From" email address.
     */
    private static function getFrom(): string
    {
        if (!self::$from) {
            self::$from = defined('MAIL_FROM') ? MAIL_FROM : 'contact@sodovanphuc.vn';
        }
        return self::$from;
    }

    private static function getAppName(): string
    {
        return defined('APP_NAME') ? APP_NAME : 'So Do Van Phuc';
    }

    private static function getFrontendUrl(): string
    {
        if (defined('FRONTEND_URL') && FRONTEND_URL) {
            return rtrim(FRONTEND_URL, '/');
        }

        if (defined('BASE_URL') && BASE_URL) {
            return preg_replace('#/backend$#', '', rtrim(BASE_URL, '/'));
        }

        return 'https://sodovanphuc.vn';
    }

    /**
     * Get the admin notification email.
     */
    private static function getAdminEmail(): string
    {
        return defined('ADMIN_EMAIL') ? ADMIN_EMAIL : '';
    }

    /**
     * Check if SMTP is configured.
     */
    private static function isSmtpConfigured(): bool
    {
        return defined('SMTP_HOST') && SMTP_HOST;
    }

    /**
     * Create a configured PHPMailer instance.
     */
    private static function createMailer(): PHPMailer
    {
        $mail = new PHPMailer(true);

        if (self::isSmtpConfigured()) {
            $mail->isSMTP();
            $mail->Host       = SMTP_HOST;
            $mail->Port       = defined('SMTP_PORT') ? SMTP_PORT : 587;

            // localhost:25 = no auth needed
            if (SMTP_HOST === 'localhost' && $mail->Port == 25) {
                $mail->SMTPAuth   = false;
                $mail->SMTPSecure = '';
                $mail->SMTPAutoTLS = false;
            } else {
                $mail->SMTPAuth   = true;
                $mail->Username   = SMTP_USER;
                $mail->Password   = SMTP_PASS;
                $mail->SMTPSecure = defined('SMTP_SECURE') ? SMTP_SECURE : PHPMailer::ENCRYPTION_STARTTLS;
            }
        }

        $mail->setFrom(self::getFrom(), self::getAppName());
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';

        return $mail;
    }

    /**
     * Send an HTML email.
     *
     * @param string $to      Recipient email
     * @param string $subject Email subject
     * @param string $body    HTML body content
     * @return bool           Whether email was sent successfully
     */
    public static function send(string $to, string $subject, string $body): bool
    {
        if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            error_log("Mailer: invalid recipient: {$to}");
            return false;
        }

        try {
            $mail = self::createMailer();
            $mail->addAddress($to);
            $mail->Subject = $subject;
            $mail->Body    = self::wrapHtml($subject, $body);
            $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $body));

            $result = $mail->send();

            if ($result) {
                error_log("Mailer: sent to {$to}, subject: {$subject}");
            }

            return $result;
        } catch (Exception $e) {
            error_log("Mailer: failed to send to {$to}, subject: {$subject}, error: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Notify admin about a new event.
     */
    public static function notifyAdmin(string $subject, string $body): bool
    {
        $adminEmail = self::getAdminEmail();
        if (!$adminEmail) {
            error_log("Mailer: ADMIN_EMAIL not configured, skipping admin notification");
            return false;
        }
        return self::send($adminEmail, $subject, $body);
    }

    /**
     * Send notification when a new inquiry is submitted.
     */
    public static function notifyNewInquiry(string $propertyAddress, string $senderName, string $senderEmail, string $senderPhone, string $message, ?string $ownerEmail = null): void
    {
        $pa = htmlspecialchars($propertyAddress);
        $sn = htmlspecialchars($senderName);
        $se = htmlspecialchars($senderEmail);
        $sp = htmlspecialchars($senderPhone);
        $msg = htmlspecialchars($message);
        $body = "
            <h2>New Inquiry Received</h2>
            <table style='border-collapse:collapse;width:100%'>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Property</td><td style='padding:8px;border-bottom:1px solid #eee'><strong>{$pa}</strong></td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>From</td><td style='padding:8px;border-bottom:1px solid #eee'>{$sn}</td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Email</td><td style='padding:8px;border-bottom:1px solid #eee'><a href='mailto:{$se}'>{$se}</a></td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Phone</td><td style='padding:8px;border-bottom:1px solid #eee'>{$sp}</td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Message</td><td style='padding:8px;border-bottom:1px solid #eee'>{$msg}</td></tr>
            </table>
            <p style='margin-top:16px;color:#888;font-size:13px'>Log in to the admin panel to respond.</p>
        ";

        self::notifyAdmin("New Inquiry: {$pa}", $body);

        // Also notify listing owner if email available
        if ($ownerEmail && $ownerEmail !== self::getAdminEmail()) {
            self::send($ownerEmail, "Someone is interested in your listing: {$pa}", $body);
        }
    }

    /**
     * Send notification when a new property listing is posted.
     */
    public static function notifyNewListing(string $title, string $listingType, float $price, string $address, string $contactName, string $contactEmail, string $contactPhone, bool $isPro = false, float $proFee = 0): void
    {
        $t  = htmlspecialchars($title);
        $lt = htmlspecialchars(ucfirst($listingType));
        $p  = number_format($price, 0, '.', ',');
        $a  = htmlspecialchars($address);
        $cn = htmlspecialchars($contactName);
        $ce = htmlspecialchars($contactEmail);
        $cp = htmlspecialchars($contactPhone);
        $tierLabel = $isPro ? '<strong style="color:#B88717">PRO</strong>' : 'Free';
        $paymentRow = '';
        if ($isPro && $proFee > 0) {
            $fmtFee = number_format($proFee, 2);
            $paymentRow = "
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Payment</td><td style='padding:8px;border-bottom:1px solid #eee'><strong style='color:#B88717'>\${$fmtFee} USD</strong></td></tr>";
        }

        $body = "
            <h2>New Listing Posted</h2>
            <table style='border-collapse:collapse;width:100%'>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Title</td><td style='padding:8px;border-bottom:1px solid #eee'><strong>{$t}</strong></td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Tier</td><td style='padding:8px;border-bottom:1px solid #eee'>{$tierLabel}</td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Type</td><td style='padding:8px;border-bottom:1px solid #eee'>{$lt}</td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Price</td><td style='padding:8px;border-bottom:1px solid #eee'>\${$p}</td></tr>{$paymentRow}
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Address</td><td style='padding:8px;border-bottom:1px solid #eee'>{$a}</td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Posted by</td><td style='padding:8px;border-bottom:1px solid #eee'>{$cn}</td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Email</td><td style='padding:8px;border-bottom:1px solid #eee'><a href='mailto:{$ce}'>{$ce}</a></td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Phone</td><td style='padding:8px;border-bottom:1px solid #eee'>{$cp}</td></tr>
            </table>
            <p style='margin-top:16px;color:#888;font-size:13px'>Log in to the admin panel to review this listing.</p>
        ";

        self::notifyAdmin("New Listing: {$t}", $body);
    }

    /**
     * Send notification when a viewing is scheduled.
     */
    public static function notifyNewSchedule(string $propertyAddress, string $name, string $email, string $phone, string $date, string $time, ?string $ownerEmail = null, float $depositAmount = 0): void
    {
        $pa = htmlspecialchars($propertyAddress);
        $n = htmlspecialchars($name);
        $e = htmlspecialchars($email);
        $p = htmlspecialchars($phone);
        $d = htmlspecialchars($date);
        $tm = htmlspecialchars($time);
        $depositRow = '';
        if ($depositAmount > 0) {
            $fmtAmt = number_format($depositAmount, 2);
            $depositRow = "
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Deposit</td><td style='padding:8px;border-bottom:1px solid #eee'><strong style='color:#B88717'>\${$fmtAmt} USD</strong></td></tr>";
        }
        $body = "
            <h2>New Viewing Request</h2>
            <table style='border-collapse:collapse;width:100%'>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Property</td><td style='padding:8px;border-bottom:1px solid #eee'><strong>{$pa}</strong></td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Visitor</td><td style='padding:8px;border-bottom:1px solid #eee'>{$n}</td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Email</td><td style='padding:8px;border-bottom:1px solid #eee'><a href='mailto:{$e}'>{$e}</a></td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Phone</td><td style='padding:8px;border-bottom:1px solid #eee'>{$p}</td></tr>{$depositRow}
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Date</td><td style='padding:8px;border-bottom:1px solid #eee'><strong>{$d}</strong></td></tr>
                <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Time</td><td style='padding:8px;border-bottom:1px solid #eee'><strong>{$tm}</strong></td></tr>
            </table>
            <p style='margin-top:16px;color:#888;font-size:13px'>Log in to the admin panel to confirm or cancel.</p>
        ";

        self::notifyAdmin("Viewing Request: {$pa} on {$d}", $body);

        if ($ownerEmail && $ownerEmail !== self::getAdminEmail()) {
            self::send($ownerEmail, "Viewing requested for your listing: {$pa}", $body);
        }
    }

    /**
     * Send notification when a listing is about to expire.
     */
    public static function notifyListingExpiring(string $email, string $propertyAddress, string $expiresAt): void
    {
        $body = "
            <h2>Your Listing is Expiring Soon</h2>
            <p>Your listing at <strong>{$propertyAddress}</strong> will expire on <strong>{$expiresAt}</strong>.</p>
            <p>Log in to your dashboard to renew or extend your listing before it expires.</p>
            <p style='margin-top:20px'>
                <a href='" . self::getFrontendUrl() . "/dashboard' style='background:#B88717;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold'>Go to Dashboard</a>
            </p>
        ";

        self::send($email, "Listing expiring soon: {$propertyAddress}", $body);
    }

    /**
     * Wrap body content in a styled HTML email template.
     */
    private static function wrapHtml(string $subject, string $body): string
    {
        return "
        <!DOCTYPE html>
        <html>
        <head><meta charset='UTF-8'><title>{$subject}</title></head>
        <body style='margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif'>
            <div style='max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)'>
                <div style='background:#0c0c12;padding:20px 24px;text-align:center'>
                    <h1 style='margin:0;color:#F6D37A;font-size:20px;letter-spacing:1px'>" . htmlspecialchars(self::getAppName(), ENT_QUOTES, 'UTF-8') . "</h1>
                </div>
                <div style='padding:24px'>
                    {$body}
                </div>
                <div style='background:#f9f9f9;padding:16px 24px;text-align:center;border-top:1px solid #eee'>
                    <p style='margin:0;color:#999;font-size:12px'>© " . date('Y') . " " . htmlspecialchars(self::getAppName(), ENT_QUOTES, 'UTF-8') . ". All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>";
    }
}
