<?php
/**
 * Database Singleton
 *
 * Provides a single PDO connection instance configured for MySQL with
 * UTF8MB4, exception error mode, and associative fetch by default.
 */
class Database
{
    /** @var PDO|null */
    private static ?PDO $instance = null;

    /**
     * Get the singleton PDO instance.
     *
     * @return PDO
     * @throws PDOException on connection failure
     */
    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $timeout = defined('DB_CONNECT_TIMEOUT') ? max(1, (int) DB_CONNECT_TIMEOUT) : 3;
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=utf8mb4',
                DB_HOST,
                DB_NAME
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_TIMEOUT            => $timeout,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            ];

            self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
        }

        return self::$instance;
    }

    /**
     * Prevent direct instantiation.
     */
    private function __construct() {}

    /**
     * Prevent cloning.
     */
    private function __clone() {}
}
