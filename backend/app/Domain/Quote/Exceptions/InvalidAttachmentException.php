<?php

declare(strict_types=1);

namespace App\Domain\Quote\Exceptions;

use DomainException;

/**
 * Exception thrown when attachment validation fails
 * 
 * Used for:
 * - File size exceeds 10MB limit
 * - Missing required attachment fields
 * - Invalid attachment metadata
 */
class InvalidAttachmentException extends DomainException
{
    public function __construct(string $message = 'Invalid attachment', int $code = 422)
    {
        parent::__construct($message, $code);
    }
}
