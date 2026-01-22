<?php

namespace Tests\Unit\Infrastructure\Middleware;

use App\Infrastructure\Presentation\Http\Middleware\ForceHttpsMiddleware;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Tests\TestCase;

class ForceHttpsMiddlewareTest extends TestCase
{
    private ForceHttpsMiddleware $middleware;

    protected function setUp(): void
    {
        parent::setUp();

        $this->middleware = new ForceHttpsMiddleware();
    }

    public function test_redirects_http_to_https_in_production(): void
    {
        $this->app['env'] = 'production';
        config(['ssl.force_https.enabled' => true]);

        $request = Request::create('http://example.com/some/path', 'GET');

        $response = $this->middleware->handle($request, function () {
            $this->fail('Should have redirected before reaching next middleware');
        });

        $this->assertEquals(301, $response->getStatusCode());
        $this->assertEquals('https://example.com/some/path', $response->headers->get('Location'));
    }

    public function test_uses_configured_redirect_status_code(): void
    {
        $this->app['env'] = 'production';
        config(['ssl.force_https.enabled' => true]);
        config(['ssl.force_https.redirect_status_code' => 302]);

        $request = Request::create('http://example.com/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            $this->fail('Should have redirected');
        });

        $this->assertEquals(302, $response->getStatusCode());
    }

    public function test_allows_https_requests_to_pass_through(): void
    {
        $this->app['env'] = 'production';
        config(['ssl.force_https.enabled' => true]);

        $request = Request::create('https://example.com/test', 'GET');
        $called = false;

        $response = $this->middleware->handle($request, function ($req) use (&$called) {
            $called = true;
            return new Response('OK', 200);
        });

        $this->assertTrue($called);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_bypasses_redirect_when_disabled_in_config(): void
    {
        $this->app['env'] = 'production';
        config(['ssl.force_https.enabled' => false]);

        $request = Request::create('http://example.com/test', 'GET');
        $called = false;

        $response = $this->middleware->handle($request, function ($req) use (&$called) {
            $called = true;
            return new Response('OK', 200);
        });

        $this->assertTrue($called);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_bypasses_redirect_in_non_production_environment(): void
    {
        $this->app['env'] = 'local';
        config(['ssl.force_https.enabled' => true]);

        $request = Request::create('http://example.com/test', 'GET');
        $called = false;

        $response = $this->middleware->handle($request, function ($req) use (&$called) {
            $called = true;
            return new Response('OK', 200);
        });

        $this->assertTrue($called);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_bypasses_acme_challenge_paths(): void
    {
        $this->app['env'] = 'production';
        config(['ssl.force_https.enabled' => true]);

        $request = Request::create('http://example.com/.well-known/acme-challenge/token123', 'GET');
        $called = false;

        $response = $this->middleware->handle($request, function ($req) use (&$called) {
            $called = true;
            return new Response('token-response', 200);
        });

        $this->assertTrue($called);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_bypasses_health_check_endpoint(): void
    {
        $this->app['env'] = 'production';
        config(['ssl.force_https.enabled' => true]);

        $request = Request::create('http://example.com/health', 'GET');
        $called = false;

        $response = $this->middleware->handle($request, function ($req) use (&$called) {
            $called = true;
            return new Response('OK', 200);
        });

        $this->assertTrue($called);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_bypasses_api_health_check_endpoint(): void
    {
        $this->app['env'] = 'production';
        config(['ssl.force_https.enabled' => true]);

        $request = Request::create('http://example.com/api/health', 'GET');
        $called = false;

        $response = $this->middleware->handle($request, function ($req) use (&$called) {
            $called = true;
            return new Response('OK', 200);
        });

        $this->assertTrue($called);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_bypasses_configured_excluded_paths(): void
    {
        $this->app['env'] = 'production';
        config(['ssl.force_https.enabled' => true]);
        config(['ssl.force_https.excluded_paths' => [
            'webhook/*',
            'public/download/*',
        ]]);

        $request = Request::create('http://example.com/webhook/stripe', 'POST');
        $called = false;

        $response = $this->middleware->handle($request, function ($req) use (&$called) {
            $called = true;
            return new Response('OK', 200);
        });

        $this->assertTrue($called);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_preserves_query_string_in_redirect(): void
    {
        $this->app['env'] = 'production';
        config(['ssl.force_https.enabled' => true]);

        $request = Request::create('http://example.com/page?foo=bar&baz=qux', 'GET');

        $response = $this->middleware->handle($request, function () {
            $this->fail('Should have redirected');
        });

        $this->assertEquals(301, $response->getStatusCode());
        $this->assertEquals('https://example.com/page?foo=bar&baz=qux', $response->headers->get('Location'));
    }

    public function test_handles_post_requests_with_redirect(): void
    {
        $this->app['env'] = 'production';
        config(['ssl.force_https.enabled' => true]);

        $request = Request::create('http://example.com/form', 'POST', ['field' => 'value']);

        $response = $this->middleware->handle($request, function () {
            $this->fail('Should have redirected');
        });

        $this->assertEquals(301, $response->getStatusCode());
        $this->assertEquals('https://example.com/form', $response->headers->get('Location'));
    }

    public function test_redirects_with_custom_port(): void
    {
        $this->app['env'] = 'production';
        config(['ssl.force_https.enabled' => true]);

        $request = Request::create('http://example.com:8080/test', 'GET');
        $request->server->set('HTTP_HOST', 'example.com:8080');

        $response = $this->middleware->handle($request, function () {
            $this->fail('Should have redirected');
        });

        $this->assertEquals(301, $response->getStatusCode());
        $this->assertStringStartsWith('https://', $response->headers->get('Location'));
    }
}
