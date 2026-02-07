<?php

declare(strict_types=1);

namespace App\Domain\Quote\Exceptions;

use DomainException;

/**
 * QuoteExpiredException
 * 
 * Thrown when attempting to modify an expired quote.
 * HTTP Status: 422 Unprocessable Entity
 */
class QuoteExpiredException extends DomainException
{
    public function __construct(string $message = 'Quote has expired and cannot be modified')
    {
        parent::__construct($message, 422);
    }
}
