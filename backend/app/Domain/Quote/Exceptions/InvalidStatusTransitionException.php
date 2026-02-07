<?php

declare(strict_types=1);

namespace App\Domain\Quote\Exceptions;

use DomainException;

/**
 * InvalidStatusTransitionException
 * 
 * Thrown when attempting an invalid quote status transition.
 * HTTP Status: 422 Unprocessable Entity
 */
class InvalidStatusTransitionException extends DomainException
{
    public function __construct(string $message = 'Invalid status transition')
    {
        parent::__construct($message, 422);
    }
}
