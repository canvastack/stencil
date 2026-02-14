<?php

namespace App\Exceptions\VendorProduction;

use Exception;

/**
 * Business Logic Exception
 * 
 * Thrown when business rules are violated.
 * Should return 422 Unprocessable Entity.
 */
class BusinessLogicException extends Exception
{
    /**
     * Create a new business logic exception.
     *
     * @param string $message
     * @param int $code
     * @param \Throwable|null $previous
     */
    public function __construct(string $message = "Business logic validation failed", int $code = 0, ?\Throwable $previous = null)
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
        return 422;
    }
}
