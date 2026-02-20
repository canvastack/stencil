<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CustomerAuthController extends Controller
{
    /**
     * Register a new customer account
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:3|max:255',
            'email' => 'required|email|unique:customers,email',
            'phone' => 'required|string|min:10|max:15',
            'password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
        ], [
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Create customer with registered account type
            $customer = Customer::create([
                'uuid' => Str::uuid(),
                'tenant_id' => $request->tenant_id ?? 1, // Default tenant or from context
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'account_type' => 'registered',
                'password_hash' => Hash::make($request->password),
                'registration_token' => Str::uuid(),
            ]);

            // Send email verification
            \Mail::to($customer->email)->send(new \App\Mail\CustomerEmailVerificationMail($customer));

            return response()->json([
                'message' => 'Registration successful. Please check your email for verification.',
                'customer' => [
                    'uuid' => $customer->uuid,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'account_type' => $customer->account_type,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Login customer
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $customer = Customer::where('email', $request->email)
            ->where('account_type', '!=', 'guest')
            ->first();

        if (!$customer || !Hash::check($request->password, $customer->password_hash)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Update login stats
        $customer->update([
            'last_login_at' => now(),
            'login_count' => $customer->login_count + 1,
            'failed_login_attempts' => 0,
        ]);

        // Create token (using Sanctum)
        $token = $customer->createToken('customer-auth')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'customer' => [
                'uuid' => $customer->uuid,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'account_type' => $customer->account_type,
                'email_verified' => !is_null($customer->email_verified_at),
            ],
            'token' => $token,
        ]);
    }

    /**
     * Logout customer
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful',
        ]);
    }

    /**
     * Get current customer profile
     */
    public function profile(Request $request)
    {
        $customer = $request->user();

        return response()->json([
            'customer' => [
                'uuid' => $customer->uuid,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'account_type' => $customer->account_type,
                'email_verified' => !is_null($customer->email_verified_at),
                'created_at' => $customer->created_at,
            ],
        ]);
    }

    /**
     * Verify email with token
     */
    public function verifyEmail(Request $request, string $token)
    {
        $customer = Customer::where('registration_token', $token)->first();

        if (!$customer) {
            return response()->json([
                'message' => 'Invalid verification token',
            ], 404);
        }

        if ($customer->email_verified_at) {
            return response()->json([
                'message' => 'Email already verified',
            ]);
        }

        $customer->update([
            'email_verified_at' => now(),
            'account_type' => 'verified',
            'registration_token' => null,
        ]);

        return response()->json([
            'message' => 'Email verified successfully',
        ]);
    }

    /**
     * Resend verification email
     */
    public function resendVerification(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $customer = Customer::where('email', $request->email)
            ->whereIn('account_type', ['registered', 'verified'])
            ->first();

        if (!$customer) {
            return response()->json([
                'message' => 'Customer not found',
            ], 404);
        }

        if ($customer->email_verified_at) {
            return response()->json([
                'message' => 'Email already verified',
            ]);
        }

        // Generate new token if needed
        if (!$customer->registration_token) {
            $customer->update([
                'registration_token' => Str::uuid(),
            ]);
        }

        // Send verification email
        \Mail::to($customer->email)->send(new \App\Mail\CustomerEmailVerificationMail($customer));

        return response()->json([
            'message' => 'Verification email sent successfully',
        ]);
    }

    /**
     * Upgrade guest account to registered
     */
    public function upgradeGuestAccount(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $customer = Customer::where('email', $request->email)
            ->where('account_type', 'guest')
            ->first();

        if (!$customer) {
            return response()->json([
                'message' => 'Guest account not found',
            ], 404);
        }

        $customer->update([
            'password_hash' => Hash::make($request->password),
            'account_type' => 'registered',
            'registration_token' => Str::uuid(),
        ]);

        // Send email verification
        \Mail::to($customer->email)->send(new \App\Mail\CustomerEmailVerificationMail($customer));

        return response()->json([
            'message' => 'Account upgraded successfully. Please check your email for verification.',
            'customer' => [
                'uuid' => $customer->uuid,
                'name' => $customer->name,
                'email' => $customer->email,
                'account_type' => $customer->account_type,
            ],
        ]);
    }
}
