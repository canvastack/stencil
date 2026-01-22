<?php

namespace Tests\Unit\Infrastructure\Middleware;

use App\Infrastructure\Presentation\Http\Middleware\SecurityHeadersMiddleware;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Tests\TestCase;

class SecurityHeadersMiddlewareTest extends TestCase
{
    private SecurityHeadersMiddleware $middleware;

    protected function setUp(): void
    {
        parent::setUp();

        $this->middleware = new SecurityHeadersMiddleware();
    }

    public function test_adds_hsts_headers_for_secure_requests(): void
    {
        config([
            'ssl.security.hsts_max_age' => 31536000,
            'ssl.security.hsts_include_subdomains' => true,
            'ssl.security.hsts_preload' => true,
        ]);

        $request = Request::create('https://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $this->assertTrue($response->headers->has('Strict-Transport-Security'));
        $hstsHeader = $response->headers->get('Strict-Transport-Security');
        $this->assertStringContainsString('max-age=31536000', $hstsHeader);
        $this->assertStringContainsString('includeSubDomains', $hstsHeader);
        $this->assertStringContainsString('preload', $hstsHeader);
    }

    public function test_hsts_header_respects_include_subdomains_config(): void
    {
        config([
            'ssl.security.hsts_max_age' => 31536000,
            'ssl.security.hsts_include_subdomains' => false,
            'ssl.security.hsts_preload' => false,
        ]);

        $request = Request::create('https://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $hstsHeader = $response->headers->get('Strict-Transport-Security');
        $this->assertStringNotContainsString('includeSubDomains', $hstsHeader);
        $this->assertStringNotContainsString('preload', $hstsHeader);
        $this->assertEquals('max-age=31536000', $hstsHeader);
    }

    public function test_does_not_add_hsts_headers_for_insecure_requests(): void
    {
        config([
            'ssl.security.hsts_max_age' => 31536000,
            'ssl.security.hsts_include_subdomains' => true,
            'ssl.security.hsts_preload' => true,
        ]);

        $request = Request::create('http://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $this->assertFalse($response->headers->has('Strict-Transport-Security'));
    }

    public function test_adds_x_content_type_options_header(): void
    {
        $request = Request::create('https://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $this->assertTrue($response->headers->has('X-Content-Type-Options'));
        $this->assertEquals('nosniff', $response->headers->get('X-Content-Type-Options'));
    }

    public function test_adds_x_frame_options_header(): void
    {
        $request = Request::create('https://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $this->assertTrue($response->headers->has('X-Frame-Options'));
        $this->assertEquals('SAMEORIGIN', $response->headers->get('X-Frame-Options'));
    }

    public function test_adds_x_xss_protection_header(): void
    {
        $request = Request::create('https://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $this->assertTrue($response->headers->has('X-XSS-Protection'));
        $this->assertEquals('1; mode=block', $response->headers->get('X-XSS-Protection'));
    }

    public function test_adds_referrer_policy_header(): void
    {
        $request = Request::create('https://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $this->assertTrue($response->headers->has('Referrer-Policy'));
        $this->assertEquals('strict-origin-when-cross-origin', $response->headers->get('Referrer-Policy'));
    }

    public function test_adds_permissions_policy_header(): void
    {
        $request = Request::create('https://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $this->assertTrue($response->headers->has('Permissions-Policy'));
        $permissionsPolicy = $response->headers->get('Permissions-Policy');
        
        $this->assertStringContainsString('geolocation=()', $permissionsPolicy);
        $this->assertStringContainsString('microphone=()', $permissionsPolicy);
        $this->assertStringContainsString('camera=()', $permissionsPolicy);
        $this->assertStringContainsString('payment=()', $permissionsPolicy);
        $this->assertStringContainsString('usb=()', $permissionsPolicy);
        $this->assertStringContainsString('magnetometer=()', $permissionsPolicy);
        $this->assertStringContainsString('gyroscope=()', $permissionsPolicy);
        $this->assertStringContainsString('accelerometer=()', $permissionsPolicy);
    }

    public function test_adds_content_security_policy_header(): void
    {
        $request = Request::create('https://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $this->assertTrue($response->headers->has('Content-Security-Policy'));
        $csp = $response->headers->get('Content-Security-Policy');
        
        $this->assertStringContainsString("default-src 'self'", $csp);
        $this->assertStringContainsString("script-src", $csp);
        $this->assertStringContainsString("style-src", $csp);
        $this->assertStringContainsString("font-src", $csp);
        $this->assertStringContainsString("img-src", $csp);
        $this->assertStringContainsString("connect-src", $csp);
        $this->assertStringContainsString("frame-ancestors 'self'", $csp);
        $this->assertStringContainsString("base-uri 'self'", $csp);
        $this->assertStringContainsString("form-action 'self'", $csp);
        $this->assertStringContainsString("upgrade-insecure-requests", $csp);
    }

    public function test_csp_allows_required_script_sources(): void
    {
        $request = Request::create('https://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $csp = $response->headers->get('Content-Security-Policy');
        
        $this->assertStringContainsString('https://cdn.jsdelivr.net', $csp);
        $this->assertStringContainsString('https://unpkg.com', $csp);
        $this->assertStringContainsString("'unsafe-inline'", $csp);
        $this->assertStringContainsString("'unsafe-eval'", $csp);
    }

    public function test_csp_allows_required_style_sources(): void
    {
        $request = Request::create('https://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $csp = $response->headers->get('Content-Security-Policy');
        
        $this->assertStringContainsString('https://fonts.googleapis.com', $csp);
    }

    public function test_csp_allows_required_font_sources(): void
    {
        $request = Request::create('https://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $csp = $response->headers->get('Content-Security-Policy');
        
        $this->assertStringContainsString('https://fonts.gstatic.com', $csp);
        $this->assertStringContainsString('data:', $csp);
    }

    public function test_csp_allows_required_connection_sources(): void
    {
        $request = Request::create('https://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $csp = $response->headers->get('Content-Security-Policy');
        
        $this->assertStringContainsString('https://api.stencil.canvastack.com', $csp);
        $this->assertStringContainsString('wss://api.stencil.canvastack.com', $csp);
    }

    public function test_applies_all_headers_to_json_response(): void
    {
        $request = Request::create('https://example.com/api/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return response()->json(['status' => 'success'], 200);
        });

        $this->assertTrue($response->headers->has('X-Content-Type-Options'));
        $this->assertTrue($response->headers->has('X-Frame-Options'));
        $this->assertTrue($response->headers->has('X-XSS-Protection'));
        $this->assertTrue($response->headers->has('Referrer-Policy'));
        $this->assertTrue($response->headers->has('Permissions-Policy'));
        $this->assertTrue($response->headers->has('Content-Security-Policy'));
    }

    public function test_applies_headers_to_all_http_methods(): void
    {
        $methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

        foreach ($methods as $method) {
            $request = Request::create('https://example.com/test', $method);

            $response = $this->middleware->handle($request, function () {
                return new Response('OK', 200);
            });

            $this->assertTrue($response->headers->has('X-Content-Type-Options'), "Failed for {$method}");
            $this->assertTrue($response->headers->has('Content-Security-Policy'), "Failed for {$method}");
        }
    }

    public function test_headers_are_added_after_next_middleware(): void
    {
        $request = Request::create('https://example.com/test', 'GET');

        $middlewareCalled = false;

        $response = $this->middleware->handle($request, function ($req) use (&$middlewareCalled) {
            $middlewareCalled = true;
            $response = new Response('OK', 200);
            $this->assertFalse($response->headers->has('X-Frame-Options'));
            return $response;
        });

        $this->assertTrue($middlewareCalled);
        $this->assertTrue($response->headers->has('X-Frame-Options'));
    }

    public function test_custom_hsts_max_age_is_respected(): void
    {
        config(['ssl.security.hsts_max_age' => 63072000]);

        $request = Request::create('https://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return new Response('OK', 200);
        });

        $hstsHeader = $response->headers->get('Strict-Transport-Security');
        $this->assertStringContainsString('max-age=63072000', $hstsHeader);
    }
}
