<?php

namespace App\Infrastructure\Presentation\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceHttpsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!config('ssl.force_https.enabled', true)) {
            return $next($request);
        }

        if ($this->shouldBypassHttpsRedirect($request)) {
            return $next($request);
        }

        if (!$request->secure() && app()->environment('production')) {
            $redirectUrl = $this->getHttpsUrl($request);
            $statusCode = config('ssl.force_https.redirect_status_code', 301);

            return redirect($redirectUrl, $statusCode);
        }

        return $next($request);
    }

    private function shouldBypassHttpsRedirect(Request $request): bool
    {
        $excludedPaths = config('ssl.force_https.excluded_paths', []);

        foreach ($excludedPaths as $pattern) {
            if ($request->is($pattern)) {
                return true;
            }
        }

        if ($request->is('api/health') || $request->is('health')) {
            return true;
        }

        if (str_starts_with($request->path(), '.well-known/acme-challenge/')) {
            return true;
        }

        return false;
    }

    private function getHttpsUrl(Request $request): string
    {
        return 'https://' . $request->getHost() . $request->getRequestUri();
    }
}
