<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Convert an authentication exception into a response.
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        if ($request->expectsJson() || str_starts_with($request->path(), 'api/')) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // For web requests, determine the correct login route
        $path = $request->path();
        
        if (str_starts_with($path, 'platform') || str_starts_with($path, 'admin')) {
            return redirect()->route('platform.auth.login');
        }
        
        if (str_starts_with($path, 'tenant')) {
            return redirect()->route('tenant.auth.login');  
        }
        
        // Default to tenant login
        return redirect()->route('tenant.auth.login');
    }
}
