php artisan test

   PASS  Tests\Unit\Domain\CustomerEntityTest
  ✓ it can be created with valid data                                                                                                                                                 0.22s
  ✓ it can be created as business customer                                                                                                                                            0.03s
  ✓ business customer requires company name                                                                                                                                           0.03s
  ✓ it can update name                                                                                                                                                                0.02s
  ✓ it can update email                                                                                                                                                               0.03s
  ✓ it can add and remove tags                                                                                                                                                        0.03s
  ✓ it prevents duplicate tags                                                                                                                                                        0.03s
  ✓ it can suspend and activate                                                                                                                                                       0.02s
  ✓ it can update last order date                                                                                                                                                     0.02s
  ✓ it can calculate days since last order                                                                                                                                            0.02s
  ✓ it returns null for days since last order when no orders                                                                                                                          0.02s
  ✓ it generates correct display name for individual                                                                                                                                  0.03s
  ✓ it generates correct display name for business                                                                                                                                    0.03s
  ✓ it can update phone                                                                                                                                                               0.03s
  ✓ it can update address                                                                                                                                                             0.02s
  ✓ it can convert to array                                                                                                                                                           0.03s

   PASS  Tests\Unit\Domain\TenantEntityTest
  ✓ it can be created with valid data                                                                                                                                                 0.05s
  ✓ it can be activated                                                                                                                                                               0.03s
  ✓ it can be suspended                                                                                                                                                               0.02s
  ✓ it can start trial                                                                                                                                                                0.03s
  ✓ it can end trial                                                                                                                                                                  0.02s
  ✓ it can update subscription                                                                                                                                                        0.03s
  ✓ it can expire subscription                                                                                                                                                        0.02s
  ✓ it can set custom domain                                                                                                                                                          0.03s
  ✓ it can remove custom domain                                                                                                                                                       0.03s
  ✓ it generates correct public url with custom domain                                                                                                                                0.03s
  ✓ it generates correct public url with slug                                                                                                                                         0.03s
  ✓ it generates correct admin url                                                                                                                                                    0.02s
  ✓ it can check if subscription is active                                                                                                                                            0.03s
  ✓ it validates trial status correctly                                                                                                                                               0.03s
  ✓ it can convert to array                                                                                                                                                           0.03s

   PASS  Tests\Unit\ExampleTest
  ✓ that true is true                                                                                                                                                                 0.02s

   PASS  Tests\Unit\Http\Controllers\Platform\AuthControllerTest
  ✓ it can authenticate platform account with valid credentials                                                                                                                       1.16s
  ✓ it rejects invalid credentials                                                                                                                                                    0.10s
  ✓ it rejects non existent account                                                                                                                                                   0.10s
  ✓ it rejects inactive account                                                                                                                                                       0.22s
  ✓ it validates required fields                                                                                                                                                      0.11s
  ✓ it validates email format                                                                                                                                                         0.11s
  ✓ it enforces rate limiting                                                                                                                                                         0.16s
  ✓ it can logout successfully                                                                                                                                                        0.13s
  ✓ it can get authenticated user info                                                                                                                                                0.12s
  ✓ it requires authentication for protected endpoints                                                                                                                                0.09s
  ✓ it rejects invalid tokens                                                                                                                                                         0.10s
  ✓ it handles suspended account login                                                                                                                                                0.10s
  ✓ it updates last login timestamp on successful authentication                                                                                                                      0.12s
  ✓ it includes proper expiration time                                                                                                                                                0.12s
  ✓ it includes bearer token type                                                                                                                                                     0.12s

   PASS  Tests\Unit\Http\Controllers\Tenant\AuthControllerTest
  ✓ it can authenticate tenant user with valid credentials                                                                                                                            0.18s
  ✓ it rejects invalid credentials                                                                                                                                                    0.12s
  ✓ it rejects non existent user                                                                                                                                                      0.24s
  ✓ it rejects user from wrong tenant                                                                                                                                                 0.12s
  ✓ it rejects inactive tenant                                                                                                                                                        0.12s
  ✓ it rejects expired subscription                                                                                                                                                   0.12s
  ✓ it rejects inactive user                                                                                                                                                          0.12s
  ✓ it validates required fields                                                                                                                                                      0.12s
  ✓ it validates email format                                                                                                                                                         0.11s
  ✓ it enforces rate limiting per tenant                                                                                                                                              0.17s
  ✓ it can logout successfully                                                                                                                                                        0.17s
  ✓ it can get authenticated user info                                                                                                                                                0.16s
  ✓ it includes user permissions in response                                                                                                                                          0.15s
  ✓ it handles suspended user login                                                                                                                                                   0.23s
  ✓ it prevents login to trial expired tenant                                                                                                                                         0.12s
  ✓ it allows login to active trial tenant                                                                                                                                            0.17s
  ✓ it includes tenant context in response                                                                                                                                            0.50s

   PASS  Tests\Unit\Http\Middleware\PlatformAccessMiddlewareTest
  ✓ it allows authenticated platform account                                                                                                                                          0.37s
  ✓ it rejects unauthenticated requests                                                                                                                                               0.10s
  ✓ it rejects tenant user accessing platform routes                                                                                                                                  0.13s
  ✓ it rejects inactive platform account                                                                                                                                              0.10s
  ✓ it rejects suspended platform account                                                                                                                                             0.10s
  ✓ it allows different platform account types                                                                                                                                        0.22s
  ✓ it handles invalid token gracefully                                                                                                                                               0.11s
  ✓ it sets correct guard context                                                                                                                                                     0.09s
  ✓ it logs security events                                                                                                                                                           0.09s

   PASS  Tests\Unit\Http\Middleware\TenantContextMiddlewareTest
  ✓ it identifies tenant from subdomain                                                                                                                                               0.15s
  ✓ it identifies tenant from custom domain                                                                                                                                           0.13s
  ✓ it identifies tenant from path parameter                                                                                                                                          0.11s
  ✓ it rejects request for nonexistent tenant                                                                                                                                         0.10s
  ✓ it rejects request for inactive tenant                                                                                                                                            0.11s
  ✓ it rejects request for expired subscription                                                                                                                                       0.11s
  ✓ it allows trial tenant within trial period                                                                                                                                        0.11s
  ✓ it rejects expired trial tenant                                                                                                                                                   0.11s
  ✓ it enforces tenant scoped authentication                                                                                                                                          0.11s
  ✓ it rejects user from different tenant                                                                                                                                             0.11s
  ✓ it sets tenant context in application                                                                                                                                             0.10s
  ✓ it handles suspended tenant                                                                                                                                                       0.12s
  ✓ it prioritizes custom domain over subdomain                                                                                                                                       0.11s
  ✓ it handles www prefix in custom domain                                                                                                                                            0.11s

   PASS  Tests\Unit\Services\Auth\JwtServiceTest
  ✓ it can generate jwt token for platform account                                                                                                                                    0.15s
  ✓ it can generate jwt token for tenant user                                                                                                                                         0.25s
  ✓ it fails authentication with invalid platform credentials                                                                                                                         0.12s
  ✓ it fails authentication with invalid tenant credentials                                                                                                                           0.12s
  ✓ it fails authentication for inactive platform account                                                                                                                             0.25s
  ✓ it fails authentication for inactive tenant                                                                                                                                       0.12s
  ✓ it fails authentication for expired tenant subscription                                                                                                                           0.11s
  ✓ it prevents cross tenant authentication                                                                                                                                           0.24s
  ✓ it includes proper user permissions in token                                                                                                                                      0.11s
  ✓ platform and tenant tokens have different structures                                                                                                                              0.12s
  ✓ it handles case insensitive email lookup                                                                                                                                          0.10s
  ✓ it validates nonexistent email                                                                                                                                                    0.10s
  ✓ it validates nonexistent tenant                                                                                                                                                   0.09s
  ✓ it includes proper token expiration times                                                                                                                                         0.25s
  ✓ it includes account type in response                                                                                                                                              0.12s
  ✓ it includes bearer token type                                                                                                                                                     0.11s

   PASS  Tests\Feature\Authentication\PlatformAuthenticationFlowTest
  ✓ complete platform authentication flow works                                                                                                                                       0.27s
  ✓ platform manager has limited permissions                                                                                                                                          0.12s
  ✓ rate limiting prevents brute force attacks                                                                                                                                        0.12s
  ✓ inactive account cannot login                                                                                                                                                     0.21s
  ✓ suspended account cannot login                                                                                                                                                    0.11s
  ✓ last login timestamp is updated                                                                                                                                                   0.12s
  ✓ token refresh works                                                                                                                                                               0.13s
  ✓ invalid email format is rejected                                                                                                                                                  0.23s
  ✓ empty credentials are rejected                                                                                                                                                    0.09s
  ✓ case insensitive email login works                                                                                                                                                0.10s
  ✓ concurrent logins are allowed                                                                                                                                                     0.11s

   PASS  Tests\Feature\Authentication\TenantAuthenticationFlowTest
  ✓ complete tenant authentication flow works                                                                                                                                         0.15s
  ✓ manager has limited permissions                                                                                                                                                   0.13s
  ✓ sales user has minimal permissions                                                                                                                                                0.18s
  ✓ cross tenant authentication is prevented                                                                                                                                          0.19s
  ✓ inactive tenant prevents login                                                                                                                                                    0.22s
  ✓ expired subscription prevents login                                                                                                                                               0.24s
  ✓ trial period allows login                                                                                                                                                         0.43s
  ✓ expired trial prevents login                                                                                                                                                      0.15s
  ✓ context based login works                                                                                                                                                         0.17s
  ✓ rate limiting is per tenant                                                                                                                                                       0.20s
  ✓ inactive user cannot login                                                                                                                                                        0.26s
  ✓ suspended user cannot login                                                                                                                                                       0.14s
  ✓ last login timestamp is updated                                                                                                                                                   0.21s
  ✓ user with multiple roles gets combined permissions                                                                                                                                0.33s

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response                                                                                                                                     0.15s

   PASS  Tests\Feature\TenantIsolationTest
  ✓ tenant a cannot access tenant b customers                                                                                                                                         0.17s
  ✓ tenant b cannot access tenant a products                                                                                                                                          0.20s
  ✓ orders are properly scoped to tenant                                                                                                                                              0.51s
  ✓ cross tenant relationships are prevented                                                                                                                                          0.22s
  ✓ tenant data counts are isolated                                                                                                                                                   0.15s
  ✓ tenant switching works correctly                                                                                                                                                  0.35s
  ✓ tenant models automatically get tenant id                                                                                                                                         0.15s

  Tests:    136 passed (482 assertions)
  Duration: 18.87s