<?php

namespace App\Exceptions\VendorProduction;

use Exception;

/**
 * Resource Not Found Exception
 * 
 * Thrown when a requested resource doesn't exist.
 * Should return 404 Not Found.
 */
class ResourceNotFoundException extends Exception
{
    /**
     * Create a new resource not found exception.
     *
     * @param string $message
     * @param int $code
     * @param \Throwable|null $previous
     */
    public function __construct(string $message = "Resource not found", int $code = 0, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Get the HTTP status code for this exception.
     *
     * @return int
     */
    public function getStatusCode(): int
    {
        return 404;
    }
}
