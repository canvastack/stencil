<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * QuotePolicy
 * 
 * Authorization policy for quote (OrderVendorNegotiation) operations.
 * Enforces tenant isolation and role-based access control.
 * 
 * Authorization Rules:
 * - All operations require tenant_id match for data isolation
 * - Admins can view, update, and delete quotes in their tenant
 * - Vendors can only view quotes assigned to them
 * - Platform admins have no access to tenant quotes
 */
class QuotePolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the user can view the quote.
     * 
     * Rules:
     * - User must belong to the same tenant as the quote
     * - Admins can view all quotes in their tenant
     * - Vendors can only view quotes assigned to them
     * 
     * @param User $user
     * @param OrderVendorNegotiation $quote
     * @return bool
     */
    public function view(User $user, OrderVendorNegotiation $quote): bool
    {
        // Enforce tenant isolation
        if ($user->tenant_id !== $quote->tenant_id) {
            return false;
        }

        // Admins can view all quotes in their tenant
        if ($user->hasRole('admin')) {
            return true;
        }

        // Vendors can only view quotes assigned to them
        if ($user->hasRole('vendor')) {
            // Check if the vendor_id matches the user's vendor record
            // This assumes there's a vendor relationship or vendor_id on the user
            return $this->isVendorAssignedToQuote($user, $quote);
        }

        // Default deny
        return false;
    }

    /**
     * Determine if the user can update the quote.
     * 
     * Rules:
     * - User must belong to the same tenant as the quote
     * - Only admins can update quotes
     * - Vendors cannot update quotes (they respond via separate endpoints)
     * 
     * @param User $user
     * @param OrderVendorNegotiation $quote
     * @return bool
     */
    public function update(User $user, OrderVendorNegotiation $quote): bool
    {
        // Enforce tenant isolation
        if ($user->tenant_id !== $quote->tenant_id) {
            return false;
        }

        // Only admins can update quotes
        return $user->hasRole('admin');
    }

    /**
     * Determine if the user can delete the quote.
     * 
     * Rules:
     * - User must belong to the same tenant as the quote
     * - Only admins can delete quotes
     * - Soft delete maintains audit trail
     * 
     * @param User $user
     * @param OrderVendorNegotiation $quote
     * @return bool
     */
    public function delete(User $user, OrderVendorNegotiation $quote): bool
    {
        // Enforce tenant isolation
        if ($user->tenant_id !== $quote->tenant_id) {
            return false;
        }

        // Only admins can delete quotes
        return $user->hasRole('admin');
    }

    /**
     * Determine if the user can create quotes.
     * 
     * Rules:
     * - Only admins can create quotes
     * - Tenant isolation enforced at creation time
     * 
     * @param User $user
     * @return bool
     */
    public function create(User $user): bool
    {
        // Only admins can create quotes
        return $user->hasRole('admin');
    }

    /**
     * Determine if the user can send the quote to vendor.
     * 
     * Rules:
     * - User must belong to the same tenant as the quote
     * - Only admins can send quotes to vendors
     * 
     * @param User $user
     * @param OrderVendorNegotiation $quote
     * @return bool
     */
    public function sendToVendor(User $user, OrderVendorNegotiation $quote): bool
    {
        // Enforce tenant isolation
        if ($user->tenant_id !== $quote->tenant_id) {
            return false;
        }

        // Only admins can send quotes
        return $user->hasRole('admin');
    }

    /**
     * Determine if the user can respond to the quote.
     * 
     * Rules:
     * - User must belong to the same tenant as the quote
     * - Only vendors assigned to the quote can respond
     * 
     * @param User $user
     * @param OrderVendorNegotiation $quote
     * @return bool
     */
    public function respond(User $user, OrderVendorNegotiation $quote): bool
    {
        // Enforce tenant isolation
        if ($user->tenant_id !== $quote->tenant_id) {
            return false;
        }

        // Only vendors can respond
        if (!$user->hasRole('vendor')) {
            return false;
        }

        // Vendor must be assigned to this quote
        return $this->isVendorAssignedToQuote($user, $quote);
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
