<?php
/**
 * Admin Authentication
 *
 * Supports two authentication methods:
 * 1. JWT Bearer token (preferred) — via Authorization: Bearer <token>
 * 2. Legacy API key (deprecated) — via X-Admin-Key header
 */
class Auth
{
    private static function authorizationHeader(): string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? $_SERVER['Authorization']
            ?? '';

        if (!$header && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            foreach ($headers as $key => $value) {
                if (strcasecmp($key, 'Authorization') === 0) {
                    return $value;
                }
            }
        }

        return $header;
    }

    /**
     * Extract JWT token string from the Authorization header.
     * Returns null if no Bearer token is present.
     */
    public static function extractToken(): ?string
    {
        $authHeader = self::authorizationHeader();
        if (preg_match('/^Bearer\s+(\S+)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Check if the current request has valid admin credentials.
     * Tries JWT Bearer token first, then falls back to legacy API key.
     *
     * @return bool
     */
    public static function isAdmin(): bool
    {
        // Method 1: JWT Bearer token
        $token = self::extractToken();
        if ($token) {
            $payload = JwtAuth::verifyToken($token);
            if ($payload && in_array((string) ($payload['role'] ?? ''), ['admin_tong', 'admin'], true)) {
                return true;
            }
            if ($payload && !empty($payload['roles']) && is_array($payload['roles'])) {
                foreach ($payload['roles'] as $role) {
                    if (in_array((string) ($role['slug'] ?? ''), ['admin_tong', 'admin'], true)
                        && ($role['status'] ?? '') === 'approved') {
                        return true;
                    }
                }
            }
        }

        // Method 2: Legacy X-Admin-Key (deprecated, for migration period)
        $key = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
        if (!empty($key) && defined('ADMIN_API_KEY') && !empty(ADMIN_API_KEY)) {
            return hash_equals(ADMIN_API_KEY, $key);
        }

        return false;
    }

    /**
     * Check if the current request has any valid JWT token (admin or user).
     * Returns the decoded payload or null.
     */
    public static function getPayload(): ?array
    {
        $token = self::extractToken();
        if (!$token) {
            return null;
        }
        return JwtAuth::verifyToken($token);
    }

    /**
     * Require admin access. Sends 401 and exits if not authenticated.
     */
    public static function requireAdmin(): void
    {
        if (!self::isAdmin()) {
            Response::unauthorized();
        }
    }

    /**
     * Require any authenticated user (admin or regular).
     * Sends 401 and exits if not authenticated.
     * Returns the JWT payload.
     */
    public static function requireAuth(): array
    {
        $payload = self::getPayload();
        if (!$payload) {
            Response::unauthorized();
        }
        return $payload;
    }
}
