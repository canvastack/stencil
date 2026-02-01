<?php

namespace App\Domain\ExchangeRate\Exceptions;

use DomainException;
use DateTimeInterface;

class StaleRateException extends DomainException
{
    private DateTimeInterface $rateDate;
    private int $maxAgeDays;

    public function __construct(DateTimeInterface $rateDate, int $maxAgeDays = 7)
    {
        $this->rateDate = $rateDate;
        $this->maxAgeDays = $maxAgeDays;
        
        $daysDiff = now()->diffInDays($rateDate);
        
        parent::__construct(
            "Exchange rate is stale: last updated {$daysDiff} days ago on {$rateDate->format('Y-m-d H:i:s')}. " .
            "Maximum age is {$maxAgeDays} days."
        );
    }

    public function getRateDate(): DateTimeInterface
    {
        return $this->rateDate;
    }

    public function getMaxAgeDays(): int
    {
        return $this->maxAgeDays;
    }

    public function getDaysOld(): int
    {
        return now()->diffInDays($this->rateDate);
    }

    public static function forRate(DateTimeInterface $rateDate, int $maxAgeDays = 7): self
    {
        return new self($rateDate, $maxAgeDays);
    }
}