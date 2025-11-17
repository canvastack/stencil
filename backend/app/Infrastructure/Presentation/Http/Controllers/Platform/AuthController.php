<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Application\Auth\UseCases\AuthenticationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private AuthenticationService $authService)
    {
    }

    /**
     * Platform Owner Login (Account A)
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $tokenData = $this->authService->authenticatePlatformAccount(
                $request->email,
                $request->password,
                $request->ip()
            );
            
            // Log successful login
            // activity()
            //     ->causedBy($tokenData['account']['id'])
            //     ->withProperties(['ip_address' => $request->ip()])
            //     ->log('platform_login');

            // Transform response to match expected format  
            $response = [
                'access_token' => $tokenData['access_token'],
                'token_type' => $tokenData['token_type'],
                'expires_in' => $tokenData['expires_in'],
                'account' => $tokenData['account'],
                'permissions' => $tokenData['permissions'],
                'account_type' => $tokenData['account_type']
            ];
            
            return response()->json($response);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Authentication failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Login failed',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Platform Owner Logout
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // More comprehensive logout approach
            // First try to get current token
            $currentToken = $user->currentAccessToken();
            
            if ($currentToken) {
                // Delete the specific token
                $currentToken->delete();
            } else {
                // If currentAccessToken doesn't work, try parsing the header
                $authHeader = $request->header('Authorization', '');
                if (preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
                    $tokenValue = $matches[1];
                    // Find the token by its value (plain text tokens are hashed in DB)
                    $token = $user->tokens()->where('token', hash('sha256', $tokenValue))->first();
                    if ($token) {
                        $token->delete();
                    } else {
                        // Last resort: delete all tokens for this user
                        $user->tokens()->delete();
                    }
                } else {
                    // If no Authorization header, delete all tokens
                    $user->tokens()->delete();
                }
            }

            return response()->json([
                'message' => 'Successfully logged out'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Logout failed',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Refresh Platform Token
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $tokenData = $this->authService->refreshToken($user);
            
            // Transform response to match expected format
            $response = [
                'access_token' => $tokenData['access_token'],
                'token_type' => $tokenData['token_type'],
                'expires_in' => $tokenData['expires_in'],
                'account_type' => $tokenData['account_type'],
                'refreshed_at' => now()->toISOString()
            ];
            
            return response()->json($response);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Token refresh failed',
                'error' => 'An unexpected error occurred'
            ], 401);
        }
    }

    /**
     * Get Current Platform Account Info
     */
    public function me(Request $request): JsonResponse
    {
        try {
            $account = $request->user();
            
            return response()->json([
                'user' => [
                    'id' => $account->id,
                    'name' => $account->name,
                    'email' => $account->email,
                    'account_type' => $account->account_type,
                    'status' => $account->status,
                    'avatar' => $account->avatar,
                    'last_login_at' => $account->last_login_at?->toISOString(),
                    'settings' => $account->settings
                ],
                'permissions' => $this->authService->getPlatformAccountPermissions($account),
                'account_type' => 'platform'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve account information',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Validate Platform Token
     */
    public function validateToken(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user || !$user->isActive()) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Invalid or inactive account'
                ], 401);
            }

            return response()->json([
                'valid' => true,
                'account_type' => 'platform',
                'account_id' => $user->id,
                'account_name' => $user->name
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'valid' => false,
                'message' => 'Token validation failed'
            ], 401);
        }
    }
}