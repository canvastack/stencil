<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Vendor Rate Limit Middleware
 * 
 * Implements rate limiting for vendor portal API endpoints.
 * 
 * Rate Limits:
 * - Login: 5 attempts per 15 minutes per IP
 * - API: 60 requests per minute per user
 * - Password Reset: 1 request per 60 seconds per email
 */
class VendorRateLimitMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $type = 'api'): Response
    {
        $key = $this->resolveRequestSignature($request, $type);
        $maxAttempts = $this->getMaxAttempts($type);
        $decayMinutes = $this->getDecayMinutes($type);

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);
            
            return response()->json([
                'message' => 'Too many requests. Please try again later.',
                'error' => 'Rate limit exceeded',
                'retry_after' => $seconds,
            ], 429)->header('Retry-After', $seconds);
        }

        RateLimiter::hit($key, $decayMinutes * 60);

        $response = $next($request);

        // Add rate limit headers
        $response->headers->add([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => RateLimiter::remaining($key, $maxAttempts),
        ]);

        return $response;
    }

    /**
     * Resolve request signature for rate limiting
     * 
     * @param Request $request
     * @param string $type
     * @return string
     */
    protected function resolveRequestSignature(Request $request, string $type): string
    {
        $user = $request->user();

        return match($type) {
            'login' => 'vendor-login:' . $request->ip(),
            'password-reset' => 'vendor-password-reset:' . ($request->input('email') ?? $request->ip()),
            'api' => 'vendor-api:' . ($user ? $user->id : $request->ip()),
            default => 'vendor-default:' . $request->ip(),
        };
    }

    /**
     * Get max attempts for rate limit type
     * 
     * @param string $type
     * @return int
     */
    protected function getMaxAttempts(string $type): int
    {
        return match($type) {
            'login' => 5,           // 5 login attempts
            'password-reset' => 1,  // 1 password reset request
            'api' => 60,            // 60 API requests
            default => 30,          // 30 default requests
        };
    }

    /**
     * Get decay minutes for rate limit type
     * 
     * @param string $type
     * @return int
     */
    protected function getDecayMinutes(string $type): int
    {
        return match($type) {
            'login' => 15,          // 15 minutes for login
            'password-reset' => 1,  // 1 minute for password reset
            'api' => 1,             // 1 minute for API
            default => 1,           // 1 minute default
        };
    }
}
