<?php

namespace App\Infrastructure\Presentation\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->secure() && config('ssl.security.hsts_max_age')) {
            $this->addHSTSHeaders($response);
        }

        $this->addGeneralSecurityHeaders($response);

        $this->addCSPHeaders($response);

        return $response;
    }

    private function addHSTSHeaders(Response $response): void
    {
        $maxAge = config('ssl.security.hsts_max_age', 31536000);
        $includeSubdomains = config('ssl.security.hsts_include_subdomains', true);
        $preload = config('ssl.security.hsts_preload', true);

        $hstsValue = "max-age={$maxAge}";
        
        if ($includeSubdomains) {
            $hstsValue .= '; includeSubDomains';
        }
        
        if ($preload) {
            $hstsValue .= '; preload';
        }

        $response->headers->set('Strict-Transport-Security', $hstsValue);
    }

    private function addGeneralSecurityHeaders(Response $response): void
    {
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        $response->headers->set('X-XSS-Protection', '1; mode=block');

        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        $response->headers->set('Permissions-Policy', implode(', ', [
            'geolocation=()',
            'microphone=()',
            'camera=()',
            'payment=()',
            'usb=()',
            'magnetometer=()',
            'gyroscope=()',
            'accelerometer=()',
        ]));
    }

    private function addCSPHeaders(Response $response): void
    {
        $cspDirectives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://api.stencil.canvastack.com wss://api.stencil.canvastack.com",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests",
        ];

        $csp = implode('; ', $cspDirectives);

        $response->headers->set('Content-Security-Policy', $csp);
    }
}
