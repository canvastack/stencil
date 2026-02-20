<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Customer Quote Security Middleware
 * 
 * Provides additional security measures for customer quote endpoints:
 * - Input sanitization
 * - XSS prevention
 * - SQL injection prevention
 * - Request validation
 * - Suspicious activity detection
 */
class CustomerQuoteSecurityMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Sanitize input data
        $this->sanitizeInput($request);
        
        // Check for suspicious patterns
        if ($this->detectSuspiciousActivity($request)) {
            Log::warning('Suspicious activity detected in customer quote request', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'url' => $request->fullUrl(),
                'input' => $request->except(['password', 'password_confirmation']),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Request blocked due to suspicious activity',
            ], 403);
        }
        
        // Add security headers to response
        $response = $next($request);
        
        return $this->addSecurityHeaders($response);
    }
    
    /**
     * Sanitize input data to prevent XSS and injection attacks
     */
    private function sanitizeInput(Request $request): void
    {
        $input = $request->all();
        
        array_walk_recursive($input, function (&$value) {
            if (is_string($value)) {
                // Remove null bytes
                $value = str_replace("\0", '', $value);
                
                // Trim whitespace
                $value = trim($value);
            }
        });
        
        $request->merge($input);
    }
    
    /**
     * Detect suspicious activity patterns
     */
    private function detectSuspiciousActivity(Request $request): bool
    {
        $input = $request->all();
        
        // Check for SQL injection patterns
        $sqlPatterns = [
            '/(\bUNION\b.*\bSELECT\b)/i',
            '/(\bSELECT\b.*\bFROM\b)/i',
            '/(\bINSERT\b.*\bINTO\b)/i',
            '/(\bUPDATE\b.*\bSET\b)/i',
            '/(\bDELETE\b.*\bFROM\b)/i',
            '/(\bDROP\b.*\bTABLE\b)/i',
            '/(\bEXEC\b|\bEXECUTE\b)/i',
            '/(--|#|\/\*|\*\/)/i',
        ];
        
        // Check for XSS patterns
        $xssPatterns = [
            '/<script[^>]*>.*?<\/script>/is',
            '/<iframe[^>]*>.*?<\/iframe>/is',
            '/javascript:/i',
            '/on\w+\s*=/i', // Event handlers like onclick=
            '/<embed[^>]*>/i',
            '/<object[^>]*>/i',
        ];
        
        // Check for path traversal
        $pathTraversalPatterns = [
            '/\.\.[\/\\\\]/',
            '/\.\.[\/\\\\]\.\.[\/\\\\]/',
        ];
        
        $allPatterns = array_merge($sqlPatterns, $xssPatterns, $pathTraversalPatterns);
        
        foreach ($input as $key => $value) {
            if (is_string($value)) {
                foreach ($allPatterns as $pattern) {
                    if (preg_match($pattern, $value)) {
                        // Log to security audit table
                        \DB::table('security_audit_log')->insert([
                            'event_type' => 'suspicious_activity',
                            'ip_address' => $request->ip(),
                            'user_agent' => $request->userAgent(),
                            'url' => $request->fullUrl(),
                            'details' => json_encode([
                                'pattern' => $pattern,
                                'field' => $key,
                                'value' => substr($value, 0, 100),
                            ]),
                            'created_at' => now(),
                        ]);
                        return true;
                    }
                }
            }
        }
        
        // Check for excessive input length (potential DoS)
        foreach ($input as $key => $value) {
            if (is_string($value) && strlen($value) > 10000) {
                \DB::table('security_audit_log')->insert([
                    'event_type' => 'suspicious_activity',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'url' => $request->fullUrl(),
                    'details' => json_encode([
                        'reason' => 'excessive_input_length',
                        'field' => $key,
                        'length' => strlen($value),
                    ]),
                    'created_at' => now(),
                ]);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Add security headers to response
     */
    private function addSecurityHeaders(Response $response): Response
    {
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Content Security Policy
        $response->headers->set('Content-Security-Policy', 
            "default-src 'self'; " .
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " .
            "style-src 'self' 'unsafe-inline'; " .
            "img-src 'self' data: https:; " .
            "font-src 'self' data:; " .
            "connect-src 'self';"
        );
        
        return $response;
    }
}
