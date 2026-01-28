<?php

namespace App\Domain\Security\ValueObjects;

/**
 * Login Pattern Value Object
 * 
 * Represents analyzed login patterns for a user including timing,
 * frequency, and device patterns.
 */
class LoginPattern
{
    public function __construct(
        private ?float $averageHour,
        private array $commonDays,
        private float $averageFrequency,
        private ?string $timeZonePattern,
        private array $devicePattern
    ) {}

    public function getAverageHour(): ?float
    {
        return $this->averageHour;
    }

    public function getCommonDays(): array
    {
        return $this->commonDays;
    }

    public function getAverageFrequency(): float
    {
        return $this->averageFrequency;
    }

    public function getTimeZonePattern(): ?string
    {
        return $this->timeZonePattern;
    }

    public function getDevicePattern(): array
    {
        return $this->devicePattern;
    }

    public function hasEstablishedPattern(): bool
    {
        return $this->averageHour !== null && 
               !empty($this->commonDays) && 
               $this->averageFrequency > 0;
    }

    public function getMostCommonDay(): ?int
    {
        return !empty($this->commonDays) ? $this->commonDays[0] : null;
    }

    public function getMostUsedDevice(): ?string
    {
        if (empty($this->devicePattern)) {
            return null;
        }

        return array_key_first($this->devicePattern);
    }

    public function toArray(): array
    {
        return [
            'average_hour' => $this->averageHour,
            'common_days' => $this->commonDays,
            'average_frequency' => $this->averageFrequency,
            'timezone_pattern' => $this->timeZonePattern,
            'device_pattern' => $this->devicePattern,
            'has_established_pattern' => $this->hasEstablishedPattern(),
            'most_common_day' => $this->getMostCommonDay(),
            'most_used_device' => $this->getMostUsedDevice()
        ];
    }
}