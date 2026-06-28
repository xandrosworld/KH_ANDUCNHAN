<?php
/**
 * Simple Regex Router
 *
 * Maps HTTP methods + URI patterns to handler callbacks.
 * Supports {id} named parameters extracted from the URI.
 */
class Router
{
    /** @var array Registered routes grouped by HTTP method */
    private array $routes = [];

    /**
     * Register a route.
     *
     * @param string   $method  HTTP method (GET, POST, PUT, PATCH, DELETE)
     * @param string   $pattern URI pattern, e.g. "/api/properties/{id}"
     * @param callable $handler Callback function receiving matched params array
     */
    public function add(string $method, string $pattern, callable $handler): void
    {
        $method = strtoupper($method);
        $this->routes[] = [
            'method'  => $method,
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    /**
     * Dispatch the current request to a matching route handler.
     * Sends 404 if no URI matches, 405 if method not allowed.
     */
    public function dispatch(): void
    {
        $requestMethod = $_SERVER['REQUEST_METHOD'];
        $requestUri    = $_SERVER['REQUEST_URI'];

        // Strip query string from URI
        $uri = parse_url($requestUri, PHP_URL_PATH);
        // Remove trailing slash (but keep root /)
        $uri = rtrim($uri, '/') ?: '/';

        $uriMatched    = false;
        $methodMatched = false;

        foreach ($this->routes as $route) {
            // Convert pattern like /api/properties/{id} to regex
            $regex = $this->patternToRegex($route['pattern']);

            if (preg_match($regex, $uri, $matches)) {
                $uriMatched = true;

                if ($route['method'] === $requestMethod) {
                    $methodMatched = true;

                    // Extract named parameters (remove numeric keys)
                    $params = array_filter($matches, function ($key) {
                        return !is_int($key);
                    }, ARRAY_FILTER_USE_KEY);

                    $route['handler']($params);
                    return;
                }
            }
        }

        if ($uriMatched && !$methodMatched) {
            Response::error('Method not allowed', 405);
        }

        Response::notFound('Endpoint not found');
    }

    /**
     * Convert a route pattern to a regex.
     * {id} becomes a named capture group (?P<id>[^/]+)
     *
     * @param string $pattern
     * @return string
     */
    private function patternToRegex(string $pattern): string
    {
        // Escape slashes
        $regex = str_replace('/', '\/', $pattern);
        // Replace {param} with named capture group
        $regex = preg_replace('/\{([a-zA-Z_]+)\}/', '(?P<$1>[^\/]+)', $regex);
        return '/^' . $regex . '$/';
    }
}
