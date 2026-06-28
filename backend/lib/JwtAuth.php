<?php
/**
 * Minimal JWT implementation (HMAC-SHA256).
 * No external dependencies — pure PHP.
 */
class JwtAuth
{
    /**
     * Create a JWT token.
     *
     * @param array  $payload  Custom claims (e.g. ['sub' => 'admin', 'role' => 'admin'])
     * @param int    $ttl      Time-to-live in seconds (default 8 hours)
     * @return string  The JWT token string
     */
    public static function createToken(array $payload, int $ttl = 28800): string
    {
        if (!defined('JWT_SECRET') || empty(JWT_SECRET)) {
            throw new RuntimeException('JWT_SECRET is not configured');
        }

        $header = self::base64UrlEncode(json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ]));

        $payload['iat'] = time();
        $payload['exp'] = time() + $ttl;
        $payload['jti'] = bin2hex(random_bytes(16));

        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$payloadEncoded}", JWT_SECRET, true)
        );

        return "{$header}.{$payloadEncoded}.{$signature}";
    }

    /**
     * Verify and decode a JWT token.
     *
     * @param string $token  The JWT token string
     * @return array|null    Decoded payload, or null if invalid/expired
     */
    public static function verifyToken(string $token): ?array
    {
        if (!defined('JWT_SECRET') || empty(JWT_SECRET)) {
            return null;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;

        // Verify signature
        $expectedSig = self::base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$payload}", JWT_SECRET, true)
        );

        if (!hash_equals($expectedSig, $signature)) {
            return null;
        }

        // Decode payload
        $decoded = json_decode(self::base64UrlDecode($payload), true);
        if (!is_array($decoded)) {
            return null;
        }

        // Check expiry
        if (isset($decoded['exp']) && $decoded['exp'] < time()) {
            return null;
        }

        return $decoded;
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
    }
}
