<?php
/**
 * Response Helper
 * 
 * Provides static methods for sending JSON responses and handling CORS.
 */
class Response
{
    /**
     * Set CORS headers based on the request Origin.
     * Handles OPTIONS preflight requests automatically.
     */
    public static function cors(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        // Check if the origin is in the allowed list
        if (defined('CORS_ORIGINS') && in_array($origin, CORS_ORIGINS, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
        } elseif (defined('CORS_ORIGINS') && count(CORS_ORIGINS) > 0) {
            // Default to the first allowed origin if no match
            header("Access-Control-Allow-Origin: " . CORS_ORIGINS[0]);
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key, Authorization, Accept');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');

        // Handle preflight
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }

    /**
     * Send a successful JSON response.
     *
     * @param mixed $data    The response data
     * @param int   $code    HTTP status code (default 200)
     */
    public static function json($data, int $code = 200): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok'   => true,
            'data' => $data,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send an error JSON response.
     *
     * @param string $msg   Error message
     * @param int    $code  HTTP status code (default 400)
     */
    public static function error(string $msg, int $code = 400): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok'    => false,
            'error' => $msg,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send a 404 Not Found error.
     */
    public static function notFound(string $msg = 'Resource not found'): void
    {
        self::error($msg, 404);
    }

    /**
     * Send a 403 Forbidden error.
     */
    public static function forbidden(string $msg = 'Forbidden: invalid or missing API key'): void
    {
        self::error($msg, 403);
    }

    /**
     * Send a 401 Unauthorized error.
     */
    public static function unauthorized(string $msg = 'Unauthorized: invalid or missing authentication'): void
    {
        self::error($msg, 401);
    }
}
