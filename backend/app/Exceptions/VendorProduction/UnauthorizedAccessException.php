<?php

namespace App\Exceptions\VendorProduction;

use Exception;

/**
 * Unauthorized Access Exception
 * 
 * Thrown when user tries to access resources they don't own.
 * Should return 403 Forbidden or 404 Not Found (for security).
 */
class UnauthorizedAccessException extends Exception
{
    /**
     * Create a new unauthorized access exception.
     *
     * @param string $message
     * @param int $code
     * @param \Throwable|null $previous
     */
    public function __construct(string $message = "Unauthorized access", int $code = 0, ?\Throwable $previous = null)
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
        return 404; // Return 404 for security (don't reveal resource exists)
    }
}
