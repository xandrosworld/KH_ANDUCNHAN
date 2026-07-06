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
        if (defined('MAIL_FROM_NAME') && MAIL_FROM_NAME) {
            return MAIL_FROM_NAME;
        }
        return defined('APP_NAME') ? APP_NAME : 'Sổ Đỏ Vạn Phúc';
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
        $adminEmail = self::getAdminEmail();
        if ($adminEmail && filter_var($adminEmail, FILTER_VALIDATE_EMAIL) && $adminEmail !== self::getFrom()) {
            $mail->addReplyTo($adminEmail, self::getAppName());
        }
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
        $safeSubject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
        $safeAppName = htmlspecialchars(self::getAppName(), ENT_QUOTES, 'UTF-8');
        $frontendUrl = htmlspecialchars(self::getFrontendUrl(), ENT_QUOTES, 'UTF-8');
        $logoUrl = $frontendUrl . '/logo11.png';
        $year = date('Y');

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width,initial-scale=1'>
            <title>{$safeSubject}</title>
        </head>
        <body style='margin:0;padding:0;background:#f7f2ef;font-family:Arial,Helvetica,sans-serif;color:#201c1f'>
            <div style='display:none;max-height:0;overflow:hidden;opacity:0;color:transparent'>{$safeSubject}</div>
            <div style='width:100%;background:#f7f2ef;padding:24px 10px'>
                <div style='max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #eadad6;box-shadow:0 18px 42px rgba(104,0,10,0.10)'>
                    <div style='background:#b90012;padding:22px 24px;text-align:center'>
                        <img src='{$logoUrl}' alt='{$safeAppName}' width='72' height='72' style='display:block;margin:0 auto 12px;border-radius:50%;background:#ffffff;object-fit:contain;border:3px solid rgba(255,255,255,0.75)'>
                        <div style='font-size:22px;line-height:1.25;font-weight:800;color:#ffffff;letter-spacing:.3px'>{$safeAppName}</div>
                        <div style='margin-top:6px;font-size:13px;line-height:1.5;color:#ffe5df'>Hệ thống quản lý nguồn nhà và khách hàng</div>
                    </div>
                    <div style='height:5px;background:linear-gradient(90deg,#8d000d,#d40016,#f0b85a)'></div>
                    <div style='padding:26px 28px 24px'>
                        <div style='margin:0 0 18px;color:#b90012;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.12em'>Thông báo từ hệ thống</div>
                        <div style='font-size:15px;line-height:1.7;color:#2b2528'>
                            {$body}
                        </div>
                    </div>
                    <div style='background:#fff8f6;border-top:1px solid #f0ded9;padding:18px 28px;text-align:center'>
                        <p style='margin:0 0 6px;color:#7c6c6c;font-size:13px;line-height:1.5'>Email được gửi tự động từ hệ thống {$safeAppName}.</p>
                        <p style='margin:0;color:#9b8b8b;font-size:12px;line-height:1.5'>© {$year} {$safeAppName}. Vui lòng không chuyển tiếp email chứa thông tin đăng nhập.</p>
                </div>
                </div>
            </div>
        </body>
        </html>";
    }
}
