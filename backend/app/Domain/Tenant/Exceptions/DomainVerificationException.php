<?php

namespace App\Domain\Tenant\Exceptions;

use Exception;

class DomainVerificationException extends Exception
{
    public function __construct(
        string $message = 'Domain verification failed',
        int $code = 0,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }
}
