<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Services;

use Plugins\PagesEngine\Domain\Entities\ContentComment;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class CommentModerationService
{
    private const SPAM_KEYWORDS = [
        'viagra', 'casino', 'poker', 'lottery', 'pills',
        'click here', 'buy now', 'limited time', 'act now',
        'free money', 'earn cash', 'work from home'
    ];

    private const TRUSTED_COMMENT_THRESHOLD = 5;

    public function shouldAutoApprove(
        ContentComment $comment,
        ?Uuid $userId,
        int $approvedCommentCount = 0
    ): bool {
        if ($userId === null) {
            return false;
        }

        return $approvedCommentCount >= self::TRUSTED_COMMENT_THRESHOLD;
    }

    public function isSpam(ContentComment $comment): bool
    {
        $text = strtolower($comment->getCommentText());
        $spamScore = 0;

        foreach (self::SPAM_KEYWORDS as $keyword) {
            if (str_contains($text, $keyword)) {
                $spamScore += 10;
            }
        }

        if ($this->hasExcessiveLinks($text)) {
            $spamScore += 20;
        }

        if ($this->hasExcessiveCapitals($comment->getCommentText())) {
            $spamScore += 15;
        }

        if ($this->hasRepeatedCharacters($text)) {
            $spamScore += 10;
        }

        return $spamScore >= 30;
    }

    public function calculateSpamScore(ContentComment $comment): int
    {
        $text = strtolower($comment->getCommentText());
        $spamScore = 0;

        foreach (self::SPAM_KEYWORDS as $keyword) {
            if (str_contains($text, $keyword)) {
                $spamScore += 10;
            }
        }

        if ($this->hasExcessiveLinks($text)) {
            $spamScore += 20;
        }

        if ($this->hasExcessiveCapitals($comment->getCommentText())) {
            $spamScore += 15;
        }

        if ($this->hasRepeatedCharacters($text)) {
            $spamScore += 10;
        }

        return $spamScore;
    }

    public function isBlacklisted(string $email, string $ipAddress, array $blacklist = []): bool
    {
        return in_array($email, $blacklist['emails'] ?? [], true) ||
               in_array($ipAddress, $blacklist['ips'] ?? [], true);
    }

    private function hasExcessiveLinks(string $text): bool
    {
        $linkCount = preg_match_all('/https?:\/\//', $text);
        return $linkCount > 3;
    }

    private function hasExcessiveCapitals(string $text): bool
    {
        $length = strlen($text);

        if ($length < 10) {
            return false;
        }

        $capitals = preg_match_all('/[A-Z]/', $text);
        $ratio = $capitals / $length;

        return $ratio > 0.5;
    }

    private function hasRepeatedCharacters(string $text): bool
    {
        return preg_match('/(.)\1{5,}/', $text) === 1;
    }
}
