<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | This option controls the default authentication "guard" and password
    | reset options for your application. You may change these defaults
    | as required, but they're a perfect start for most applications.
    |
    */

    'defaults' => [
        'guard' => 'web',
        'passwords' => 'users',
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | Multi-tenant authentication system with separate guards for:
    | - Platform owners (Account A) 
    | - Tenant users (Account B)
    |
    */

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
        
        // Account A: Platform Owner Guard
        'platform' => [
            'driver' => 'sanctum',
            'provider' => 'accounts',
        ],
        
        // Account B: Tenant User Guard  
        'tenant' => [
            'driver' => 'sanctum',
            'provider' => 'users',
        ],
        
        // API Guard for general API access
        'api' => [
            'driver' => 'sanctum',
            'provider' => 'users',
            'hash' => false,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    |
    | Multi-tenant user providers for different account types.
    |
    */

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class,
        ],

        'accounts' => [
            'driver' => 'eloquent', 
            'model' => App\Infrastructure\Persistence\Eloquent\AccountEloquentModel::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resetting Passwords
    |--------------------------------------------------------------------------
    |
    | Password reset configurations for both account types.
    |
    */

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
        
        'accounts' => [
            'provider' => 'accounts',
            'table' => 'password_reset_tokens', 
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    |
    | Here you may define the amount of seconds before a password confirmation
    | times out and the user is prompted to re-enter their password via the
    | confirmation screen. By default, the timeout lasts for three hours.
    |
    */

    'password_timeout' => 10800,

];