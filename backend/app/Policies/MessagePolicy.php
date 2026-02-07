<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\QuoteMessage;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * MessagePolicy
 * 
 * Authorization policy for quote message operations.
 * Enforces tenant isolation and role-based access control for message threads.
 * 
 * Authorization Rules:
 * - All operations require tenant_id match for data isolation
 * - Admins can view and create messages for any quote in their tenant
 * - Vendors can only view and create messages for quotes assigned to them
 * - Users can only view messages for quotes they have access to
 */
class MessagePolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the user can view the message.
     * 
     * Rules:
     * - User must belong to the same tenant as the message
     * - User must have access to the associated quote
     * - Admins can view all messages in their tenant
     * - Vendors can only view messages for their assigned quotes
     * 
     * @param User $user
     * @param QuoteMessage $message
     * @return bool
     */
    public function view(User $user, QuoteMessage $message): bool
    {
        // Enforce tenant isolation
        if ($user->tenant_id !== $message->tenant_id) {
            return false;
        }

        // Load the quote if not already loaded
        if (!$message->relationLoaded('quote')) {
            $message->load('quote');
        }

        $quote = $message->quote;

        // If no quote found, deny access
        if (!$quote) {
            return false;
        }

        // Admins can view all messages in their tenant
        if ($user->hasRole('admin')) {
            return true;
        }

        // Vendors can only view messages for quotes assigned to them
        if ($user->hasRole('vendor')) {
            return $this->isVendorAssignedToQuote($user, $quote);
        }

        // Default deny
        return false;
    }

    /**
     * Determine if the user can view messages for a quote.
     * 
     * This is used for listing messages in a quote thread.
     * 
     * Rules:
     * - User must belong to the same tenant as the quote
     * - Admins can view all message threads in their tenant
     * - Vendors can only view message threads for their assigned quotes
     * 
     * @param User $user
     * @param OrderVendorNegotiation $quote
     * @return bool
     */
    public function viewAny(User $user, OrderVendorNegotiation $quote): bool
    {
        // Enforce tenant isolation
        if ($user->tenant_id !== $quote->tenant_id) {
            return false;
        }

        // Admins can view all message threads in their tenant
        if ($user->hasRole('admin')) {
            return true;
        }

        // Vendors can only view message threads for their assigned quotes
        if ($user->hasRole('vendor')) {
            return $this->isVendorAssignedToQuote($user, $quote);
        }

        // Default deny
        return false;
    }

    /**
     * Determine if the user can create a message.
     * 
     * Rules:
     * - User must belong to the same tenant as the quote
     * - User must have access to the associated quote
     * - Admins can create messages for any quote in their tenant
     * - Vendors can only create messages for quotes assigned to them
     * 
     * @param User $user
     * @param OrderVendorNegotiation $quote
     * @return bool
     */
    public function create(User $user, OrderVendorNegotiation $quote): bool
    {
        // Enforce tenant isolation
        if ($user->tenant_id !== $quote->tenant_id) {
            return false;
        }

        // Admins can create messages for any quote in their tenant
        if ($user->hasRole('admin')) {
            return true;
        }

        // Vendors can only create messages for quotes assigned to them
        if ($user->hasRole('vendor')) {
            return $this->isVendorAssignedToQuote($user, $quote);
        }

        // Default deny
        return false;
    }

    /**
     * Determine if the user can mark a message as read.
     * 
     * Rules:
     * - User must belong to the same tenant as the message
     * - User must have access to the associated quote
     * - User must be the recipient (not the sender)
     * 
     * @param User $user
     * @param QuoteMessage $message
     * @return bool
     */
    public function markAsRead(User $user, QuoteMessage $message): bool
    {
        // Enforce tenant isolation
        if ($user->tenant_id !== $message->tenant_id) {
            return false;
        }

        // Load the quote if not already loaded
        if (!$message->relationLoaded('quote')) {
            $message->load('quote');
        }

        $quote = $message->quote;

        // If no quote found, deny access
        if (!$quote) {
            return false;
        }

        // User must not be the sender (can't mark own messages as read)
        if ($user->id === $message->sender_id) {
            return false;
        }

        // User must have access to the quote
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('vendor')) {
            return $this->isVendorAssignedToQuote($user, $quote);
        }

        // Default deny
        return false;
    }

    /**
     * Check if the vendor user is assigned to the quote.
     * 
     * This helper method checks if the user is the vendor assigned to the quote.
     * Implementation depends on how vendor users are linked to vendor records.
     * 
     * @param User $user
     * @param OrderVendorNegotiation $quote
     * @return bool
     */
    private function isVendorAssignedToQuote(User $user, OrderVendorNegotiation $quote): bool
    {
        // Option 1: If user has a vendor_id field
        if (isset($user->vendor_id)) {
            return $user->vendor_id === $quote->vendor_id;
        }

        // Option 2: If there's a vendor relationship
        if ($user->relationLoaded('vendor')) {
            return $user->vendor?->id === $quote->vendor_id;
        }

        // Option 3: Load vendor relationship and check
        $vendor = $user->vendor()->first();
        return $vendor && $vendor->id === $quote->vendor_id;
    }
}
