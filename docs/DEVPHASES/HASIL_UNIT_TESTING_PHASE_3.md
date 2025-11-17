php artisan test

   PASS  Tests\Unit\Application\Product\CreateProductCategoryUseCaseTest
  ✓ it creates root category successfully                                                                                                                                                0.20s
  ✓ it creates child category successfully                                                                                                                                               0.02s
  ✓ it throws exception when slug already exists                                                                                                                                         0.02s
  ✓ it throws exception when parent not found                                                                                                                                            0.03s
  ✓ it creates category with allowed materials                                                                                                                                           0.04s
  ✓ it creates category with quality levels                                                                                                                                              0.03s
  ✓ it creates category with customization options                                                                                                                                       0.03s
  ✓ it creates category with seo information                                                                                                                                             0.02s
  ✓ it creates category with pricing configuration                                                                                                                                       0.02s
  ✓ it validates invalid material values                                                                                                                                                 0.02s
  ✓ it validates invalid quality values                                                                                                                                                  0.02s
  ✓ it validates markup percentage range                                                                                                                                                 0.02s
  ✓ it creates featured category                                                                                                                                                         0.02s
  ✓ it creates hidden menu category                                                                                                                                                      0.02s
  ✓ it creates category with media information                                                                                                                                           0.02s
  ✓ it creates category with custom sort order                                                                                                                                           0.02s

   PASS  Tests\Unit\Application\Product\CreateProductVariantUseCaseTest
  ✓ it creates product variant successfully                                                                                                                                              0.05s
  ✓ it creates variant with pricing information                                                                                                                                          0.02s
  ✓ it creates variant with stock information                                                                                                                                            0.02s
  ✓ it creates variant with dimensions                                                                                                                                                   0.02s
  ✓ it creates variant with custom sku                                                                                                                                                   0.02s
  ✓ it creates variant with etching specifications                                                                                                                                       0.02s
  ✓ it throws exception when category not found                                                                                                                                          0.02s
  ✓ it throws exception when variant already exists                                                                                                                                      0.02s
  ✓ it throws exception when custom sku already exists                                                                                                                                   0.02s
  ✓ it validates invalid material                                                                                                                                                        0.02s
  ✓ it validates invalid quality                                                                                                                                                         0.02s
  ✓ it validates negative dimensions                                                                                                                                                     0.02s
  ✓ it validates negative weight                                                                                                                                                         0.03s
  ✓ it validates negative stock                                                                                                                                                          0.03s
  ✓ it validates invalid pricing                                                                                                                                                         0.03s
  ✓ it calculates price with material and quality multipliers                                                                                                                            0.02s

   PASS  Tests\Unit\Domain\CustomerEntityTest
  ✓ it can be created with valid data                                                                                                                                                    0.05s
  ✓ it can be created as business customer                                                                                                                                               0.03s
  ✓ business customer requires company name                                                                                                                                              0.02s
  ✓ it can update name                                                                                                                                                                   0.02s
  ✓ it can update email                                                                                                                                                                  0.03s
  ✓ it can add and remove tags                                                                                                                                                           0.04s
  ✓ it prevents duplicate tags                                                                                                                                                           0.04s
  ✓ it can suspend and activate                                                                                                                                                          0.03s
  ✓ it can update last order date                                                                                                                                                        0.05s
  ✓ it can calculate days since last order                                                                                                                                               0.03s
  ✓ it returns null for days since last order when no orders                                                                                                                             0.05s
  ✓ it generates correct display name for individual                                                                                                                                     0.05s
  ✓ it generates correct display name for business                                                                                                                                       0.05s
  ✓ it can update phone                                                                                                                                                                  0.04s
  ✓ it can update address                                                                                                                                                                0.03s
  ✓ it can convert to array                                                                                                                                                              0.03s

   PASS  Tests\Unit\Domain\Product\Enums\ProductMaterialTest
  ✓ it has all expected material values                                                                                                                                                  0.06s
  ✓ it returns correct string values                                                                                                                                                     0.03s
  ✓ it returns correct display names                                                                                                                                                     0.03s
  ✓ it returns correct descriptions                                                                                                                                                      0.05s
  ✓ it returns correct pricing multipliers                                                                                                                                               0.04s
  ✓ it identifies metal materials correctly                                                                                                                                              0.03s
  ✓ it identifies plastic materials correctly                                                                                                                                            0.03s
  ✓ it returns correct density values                                                                                                                                                    0.03s
  ✓ it returns correct melting points                                                                                                                                                    0.11s
  ✓ it returns correct hardness levels                                                                                                                                                   0.12s
  ✓ it returns correct corrosion resistance                                                                                                                                              0.08s
  ✓ it returns correct workability levels                                                                                                                                                0.07s
  ✓ it returns correct etching suitability                                                                                                                                               0.06s
  ✓ it returns available thickness options                                                                                                                                               0.09s
  ✓ it returns available finishes                                                                                                                                                        0.06s
  ✓ it calculates weight correctly                                                                                                                                                       0.12s
  ✓ it can be created from string                                                                                                                                                        0.13s
  ✓ it throws exception for invalid string                                                                                                                                               0.03s
  ✓ it returns all materials as options                                                                                                                                                  0.03s
  ✓ it returns metal materials only                                                                                                                                                      0.03s
  ✓ it returns plastic materials only                                                                                                                                                    0.03s
  ✓ it returns materials suitable for etching                                                                                                                                            0.06s
  ✓ it can compare materials by price                                                                                                                                                    0.03s
  ✓ it can get compatible finishes for material                                                                                                                                          0.04s
  ✓ it validates thickness availability                                                                                                                                                  0.04s
  ✓ it validates finish availability                                                                                                                                                     0.03s

   PASS  Tests\Unit\Domain\Product\Enums\ProductQualityTest
  ✓ it has all expected quality values                                                                                                                                                   0.07s
  ✓ it returns correct string values                                                                                                                                                     0.04s
  ✓ it returns correct display names                                                                                                                                                     0.03s
  ✓ it returns correct descriptions                                                                                                                                                      0.03s
  ✓ it returns correct pricing multipliers                                                                                                                                               0.03s
  ✓ it returns correct precision levels                                                                                                                                                  0.03s
  ✓ it returns correct surface finish quality                                                                                                                                            0.03s
  ✓ it returns correct inspection levels                                                                                                                                                 0.03s
  ✓ it returns correct lead times                                                                                                                                                        0.03s
  ✓ it returns correct minimum order quantities                                                                                                                                          0.03s
  ✓ it returns available finishes per quality                                                                                                                                            0.03s
  ✓ it returns correct quality certifications                                                                                                                                            0.03s
  ✓ it checks if requires special tooling                                                                                                                                                0.03s
  ✓ it checks if requires quality approval                                                                                                                                               0.02s
  ✓ it checks if includes documentation                                                                                                                                                  0.03s
  ✓ it returns correct etching depth precision                                                                                                                                           0.03s
  ✓ it returns correct edge quality levels                                                                                                                                               0.03s
  ✓ it calculates price with multiplier                                                                                                                                                  0.03s
  ✓ it can be created from string                                                                                                                                                        0.03s
  ✓ it throws exception for invalid string                                                                                                                                               0.02s
  ✓ it returns all qualities as options                                                                                                                                                  0.03s
  ✓ it can compare quality levels                                                                                                                                                        0.03s
  ✓ it can check if is lower quality                                                                                                                                                     0.03s
  ✓ it returns quality level numeric value                                                                                                                                               0.04s
  ✓ it can sort qualities by level                                                                                                                                                       0.02s
  ✓ it returns qualities above level                                                                                                                                                     0.03s
  ✓ it returns qualities below level                                                                                                                                                     0.03s
  ✓ it calculates quality upgrade cost                                                                                                                                                   0.03s
  ✓ it returns compatible materials per quality                                                                                                                                          0.03s
  ✓ it checks if quality is suitable for application                                                                                                                                     0.03s
  ✓ it returns recommended applications                                                                                                                                                  0.03s

   PASS  Tests\Unit\Domain\Product\ProductCategoryEntityTest
  ✓ it can be created with valid data                                                                                                                                                    0.07s
  ✓ it can be created as child category                                                                                                                                                  0.03s
  ✓ it can update basic information                                                                                                                                                      0.03s
  ✓ it can be activated and deactivated                                                                                                                                                  0.03s
  ✓ it can be featured and unfeatured                                                                                                                                                    0.03s
  ✓ it can toggle menu visibility                                                                                                                                                        0.03s
  ✓ it can set allowed materials                                                                                                                                                         0.03s
  ✓ it can set quality levels                                                                                                                                                            0.03s
  ✓ it can set customization options                                                                                                                                                     0.03s
  ✓ it can update sort order                                                                                                                                                             0.03s
  ✓ it can set media information                                                                                                                                                         0.03s
  ✓ it can set seo information                                                                                                                                                           0.02s
  ✓ it can set pricing configuration                                                                                                                                                     0.03s
  ✓ it validates markup percentage range                                                                                                                                                 0.02s
  ✓ it can check if has etching materials                                                                                                                                                0.03s
  ✓ it can get hierarchy path                                                                                                                                                            0.03s
  ✓ it can convert to array                                                                                                                                                              0.03s
  ✓ it generates correct breadcrumb                                                                                                                                                      0.03s
  ✓ it validates parent relationship prevents circular reference                                                                                                                         0.03s

   PASS  Tests\Unit\Domain\Product\ProductVariantEntityTest
  ✓ it can be created with valid data                                                                                                                                                    0.05s
  ✓ it generates sku automatically                                                                                                                                                       0.02s
  ✓ it can update pricing information                                                                                                                                                    0.03s
  ✓ it calculates profit margin correctly                                                                                                                                                0.03s
  ✓ it handles zero base price for profit margin                                                                                                                                         0.03s
  ✓ it can update stock quantity                                                                                                                                                         0.03s
  ✓ it can increase stock                                                                                                                                                                0.03s
  ✓ it can decrease stock                                                                                                                                                                0.03s
  ✓ it prevents negative stock decrease                                                                                                                                                  0.03s
  ✓ it can set low stock threshold                                                                                                                                                       0.03s
  ✓ it can check stock status                                                                                                                                                            0.03s
  ✓ it can set dimensions                                                                                                                                                                0.03s
  ✓ it validates positive dimensions                                                                                                                                                     0.02s
  ✓ it can set weight                                                                                                                                                                    0.02s
  ✓ it validates positive weight                                                                                                                                                         0.03s
  ✓ it can be activated and deactivated                                                                                                                                                  0.02s
  ✓ it can set custom sku                                                                                                                                                                0.03s
  ✓ it validates unique sku format                                                                                                                                                       0.03s
  ✓ it can set etching specifications                                                                                                                                                    0.03s
  ✓ it can check material properties                                                                                                                                                     0.03s
  ✓ it can check quality level                                                                                                                                                           0.03s
  ✓ it applies material and quality pricing multipliers                                                                                                                                  0.03s
  ✓ it can convert to array                                                                                                                                                              0.03s
  ✓ it generates variant display name                                                                                                                                                    0.03s

   PASS  Tests\Unit\Domain\Product\ValueObjects\ProductCategoryNameTest
  ✓ it can be created with valid name                                                                                                                                                    0.05s
  ✓ it trims whitespace from name                                                                                                                                                        0.03s
  ✓ it validates minimum length                                                                                                                                                          0.03s
  ✓ it validates maximum length                                                                                                                                                          0.02s
  ✓ it rejects empty name                                                                                                                                                                0.04s
  ✓ it rejects only whitespace name                                                                                                                                                      0.03s
  ✓ it allows valid special characters                                                                                                                                                   0.03s
  ✓ it rejects invalid special characters                                                                                                                                                0.03s
  ✓ it allows unicode characters                                                                                                                                                         0.03s
  ✓ it handles mixed case properly                                                                                                                                                       0.02s
  ✓ it can check equality                                                                                                                                                                0.02s
  ✓ it is case sensitive for equality                                                                                                                                                    0.02s
  ✓ it can generate slug suggestion                                                                                                                                                      0.03s
  ✓ it handles unicode in slug generation                                                                                                                                                0.03s
  ✓ it can check if contains etching keywords                                                                                                                                            0.03s
  ✓ it can get character count                                                                                                                                                           0.02s
  ✓ it can get word count                                                                                                                                                                0.03s
  ✓ it can convert to title case                                                                                                                                                         0.03s
  ✓ it can truncate with ellipsis                                                                                                                                                        0.02s
  ✓ it does not truncate short names                                                                                                                                                     0.03s
  ✓ it can check if contains word                                                                                                                                                        0.03s

   PASS  Tests\Unit\Domain\Product\ValueObjects\ProductCategorySlugTest
  ✓ it can be created with valid slug                                                                                                                                                    0.05s
  ✓ it validates minimum length                                                                                                                                                          0.03s
  ✓ it validates maximum length                                                                                                                                                          0.03s
  ✓ it rejects empty slug                                                                                                                                                                0.03s
  ✓ it rejects slug with spaces                                                                                                                                                          0.03s
  ✓ it rejects slug with uppercase letters                                                                                                                                               0.03s
  ✓ it rejects slug with special characters                                                                                                                                              0.03s
  ✓ it allows valid slug formats                                                                                                                                                         0.03s
  ✓ it rejects slug starting with hyphen                                                                                                                                                 0.02s
  ✓ it rejects slug ending with hyphen                                                                                                                                                   0.02s
  ✓ it rejects slug with consecutive hyphens                                                                                                                                             0.02s
  ✓ it can check equality                                                                                                                                                                0.03s
  ✓ it can generate from name                                                                                                                                                            0.03s
  ✓ it handles unicode characters in generation                                                                                                                                          0.03s
  ✓ it removes stopwords when generating from name                                                                                                                                       0.03s
  ✓ it can get parent slug from path                                                                                                                                                     0.02s
  ✓ it can check if etching related                                                                                                                                                      0.03s
  ✓ it can check if material related                                                                                                                                                     0.03s
  ✓ it can get slug depth                                                                                                                                                                0.03s
  ✓ it can append suffix                                                                                                                                                                 0.03s
  ✓ it validates suffix format                                                                                                                                                           0.03s
  ✓ it can prepend prefix                                                                                                                                                                0.03s
  ✓ it validates prefix format                                                                                                                                                           0.03s
  ✓ it can check if contains word                                                                                                                                                        0.03s
  ✓ it generates unique variation                                                                                                                                                        0.03s
  ✓ it returns original if no conflicts                                                                                                                                                  0.02s

   PASS  Tests\Unit\Domain\TenantEntityTest
  ✓ it can be created with valid data                                                                                                                                                    0.06s
  ✓ it can be activated                                                                                                                                                                  0.02s
  ✓ it can be suspended                                                                                                                                                                  0.03s
  ✓ it can start trial                                                                                                                                                                   0.03s
  ✓ it can end trial                                                                                                                                                                     0.03s
  ✓ it can update subscription                                                                                                                                                           0.03s
  ✓ it can expire subscription                                                                                                                                                           0.03s
  ✓ it can set custom domain                                                                                                                                                             0.03s
  ✓ it can remove custom domain                                                                                                                                                          0.03s
  ✓ it generates correct public url with custom domain                                                                                                                                   0.03s
  ✓ it generates correct public url with slug                                                                                                                                            0.03s
  ✓ it generates correct admin url                                                                                                                                                       0.03s
  ✓ it can check if subscription is active                                                                                                                                               0.03s
  ✓ it validates trial status correctly                                                                                                                                                  0.03s
  ✓ it can convert to array                                                                                                                                                              0.03s

   PASS  Tests\Unit\ExampleTest
  ✓ that true is true                                                                                                                                                                    0.02s

   PASS  Tests\Unit\Http\Controllers\Platform\AuthControllerTest
  ✓ it can authenticate platform account with valid credentials                                                                                                                          1.40s
  ✓ it rejects invalid credentials                                                                                                                                                       0.09s
  ✓ it rejects non existent account                                                                                                                                                      0.20s
  ✓ it rejects inactive account                                                                                                                                                          0.09s
  ✓ it validates required fields                                                                                                                                                         0.09s
  ✓ it validates email format                                                                                                                                                            0.09s
  ✓ it enforces rate limiting                                                                                                                                                            0.11s
  ✓ it can logout successfully                                                                                                                                                           0.12s
  ✓ it can get authenticated user info                                                                                                                                                   0.12s
  ✓ it requires authentication for protected endpoints                                                                                                                                   0.09s
  ✓ it rejects invalid tokens                                                                                                                                                            0.09s
  ✓ it handles suspended account login                                                                                                                                                   0.21s
  ✓ it updates last login timestamp on successful authentication                                                                                                                         0.10s
  ✓ it includes proper expiration time                                                                                                                                                   0.10s
  ✓ it includes bearer token type                                                                                                                                                        0.10s

   PASS  Tests\Unit\Http\Controllers\Tenant\AuthControllerTest
  ✓ it can authenticate tenant user with valid credentials                                                                                                                               0.15s
  ✓ it rejects invalid credentials                                                                                                                                                       0.22s
  ✓ it rejects non existent user                                                                                                                                                         0.11s
  ✓ it rejects user from wrong tenant                                                                                                                                                    0.11s
  ✓ it rejects inactive tenant                                                                                                                                                           0.11s
  ✓ it rejects expired subscription                                                                                                                                                      0.11s
  ✓ it rejects inactive user                                                                                                                                                             0.11s
  ✓ it validates required fields                                                                                                                                                         0.10s
  ✓ it validates email format                                                                                                                                                            0.11s
  ✓ it enforces rate limiting per tenant                                                                                                                                                 0.17s
  ✓ it can logout successfully                                                                                                                                                           0.16s
  ✓ it can get authenticated user info                                                                                                                                                   0.16s
  ✓ it includes user permissions in response                                                                                                                                             0.14s
  ✓ it handles suspended user login                                                                                                                                                      0.14s
  ✓ it prevents login to trial expired tenant                                                                                                                                            0.12s
  ✓ it allows login to active trial tenant                                                                                                                                               0.20s
  ✓ it includes tenant context in response                                                                                                                                               0.12s

   PASS  Tests\Unit\Http\Middleware\PlatformAccessMiddlewareTest
  ✓ it allows authenticated platform account                                                                                                                                             0.12s
  ✓ it rejects unauthenticated requests                                                                                                                                                  0.08s
  ✓ it rejects tenant user accessing platform routes                                                                                                                                     0.12s
  ✓ it rejects inactive platform account                                                                                                                                                 0.09s
  ✓ it rejects suspended platform account                                                                                                                                                0.09s
  ✓ it allows different platform account types                                                                                                                                           0.09s
  ✓ it handles invalid token gracefully                                                                                                                                                  0.10s
  ✓ it sets correct guard context                                                                                                                                                        0.09s
  ✓ it logs security events                                                                                                                                                              0.10s

   PASS  Tests\Unit\Http\Middleware\TenantContextMiddlewareTest
  ✓ it identifies tenant from subdomain                                                                                                                                                  0.13s
  ✓ it identifies tenant from custom domain                                                                                                                                              0.11s
  ✓ it identifies tenant from path parameter                                                                                                                                             0.12s
  ✓ it rejects request for nonexistent tenant                                                                                                                                            0.11s
  ✓ it rejects request for inactive tenant                                                                                                                                               0.12s
  ✓ it rejects request for expired subscription                                                                                                                                          0.11s
  ✓ it allows trial tenant within trial period                                                                                                                                           0.12s
  ✓ it rejects expired trial tenant                                                                                                                                                      0.11s
  ✓ it enforces tenant scoped authentication                                                                                                                                             0.22s
  ✓ it rejects user from different tenant                                                                                                                                                0.10s
  ✓ it sets tenant context in application                                                                                                                                                0.10s
  ✓ it handles suspended tenant                                                                                                                                                          0.11s
  ✓ it prioritizes custom domain over subdomain                                                                                                                                          0.10s
  ✓ it handles www prefix in custom domain                                                                                                                                               0.13s

   FAIL  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest
  ✓ it has correct fillable attributes                                                                                                                                                   0.10s
  ✓ it casts attributes correctly                                                                                                                                                        0.08s
  ⨯ it can create product category with basic attributes                                                                                                                                 0.12s
  ⨯ it auto generates uuid on creation                                                                                                                                                   0.09s
  ⨯ it updates hierarchy when parent changes                                                                                                                                             0.09s
  ⨯ it has tenant relationship                                                                                                                                                           0.07s
  ✓ it has parent relationship                                                                                                                                                           0.08s
  ✓ it has children relationship                                                                                                                                                         0.08s
  ⨯ it has descendants relationship                                                                                                                                                      0.09s
  ⨯ it has products relationship                                                                                                                                                         0.08s
  ⨯ it scopes active categories                                                                                                                                                          0.09s
  ⨯ it scopes featured categories                                                                                                                                                        0.08s
  ⨯ it scopes root categories                                                                                                                                                            0.09s
  ⨯ it scopes categories by level                                                                                                                                                        0.12s
  ⨯ it scopes categories shown in menu                                                                                                                                                   0.09s
  ⨯ it scopes ordered categories                                                                                                                                                         0.11s
  ⨯ it checks if category has children                                                                                                                                                   0.12s
  ⨯ it checks if category has products                                                                                                                                                   0.13s
  ⨯ it generates full path                                                                                                                                                               0.09s
  ⨯ it generates breadcrumb                                                                                                                                                              0.09s
  ⨯ it stores allowed materials as array                                                                                                                                                 0.09s
  ⨯ it stores quality levels as array                                                                                                                                                    0.09s
  ⨯ it stores customization options as array                                                                                                                                             0.09s
  ⨯ it stores seo keywords as array                                                                                                                                                      0.09s
  ⨯ it casts base markup percentage as decimal                                                                                                                                           0.23s
  ⨯ it uses soft deletes                                                                                                                                                                 0.10s

   FAIL  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest
  ⨯ it has correct fillable attributes                                                                                                                                                   0.11s
  ⨯ it casts attributes correctly                                                                                                                                                        0.09s
  ⨯ it can create product variant with basic attributes                                                                                                                                  0.21s
  ⨯ it auto generates uuid on creation                                                                                                                                                   0.09s
  ⨯ it has tenant relationship                                                                                                                                                           0.18s
  ⨯ it has category relationship                                                                                                                                                         0.09s
  ⨯ it scopes active variants                                                                                                                                                            0.08s
  ⨯ it scopes variants by material                                                                                                                                                       0.22s
  ⨯ it scopes variants by quality                                                                                                                                                        0.11s
  ⨯ it scopes variants in stock                                                                                                                                                          0.10s
  ⨯ it scopes variants out of stock                                                                                                                                                      0.09s
  ⨯ it scopes variants low stock                                                                                                                                                         0.09s
  ⨯ it scopes variants by price range                                                                                                                                                    0.09s
  ⨯ it checks if variant has stock                                                                                                                                                       0.20s
  ⨯ it checks if variant is low stock                                                                                                                                                    0.09s
  ⨯ it calculates profit margin                                                                                                                                                          0.09s
  ⨯ it handles zero base price in margin calculation                                                                                                                                     0.09s
  ⨯ it calculates dimensions                                                                                                                                                             0.09s
  ⨯ it generates display name                                                                                                                                                            0.09s
  ⨯ it stores etching specifications as array                                                                                                                                            0.09s
  ⨯ it casts prices as decimal                                                                                                                                                           0.20s
  ⨯ it casts dimensions as decimal                                                                                                                                                       0.09s
  ⨯ it uses soft deletes                                                                                                                                                                 0.09s
  ⨯ it maintains category relationship                                                                                                                                                   0.09s

   FAIL  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest
  ⨯ it can save product category
  ⨯ it can find category by id
  ⨯ it returns null when category not found by id
  ⨯ it can find category by slug
  ⨯ it returns null when category not found by slug
  ⨯ it can find root categories
  ⨯ it can find children categories
  ⨯ it can find active categories
  ⨯ it can find featured categories
  ⨯ it can find categories by material
  ⨯ it can find categories by level
  ⨯ it can search categories by name
  ⨯ it can count categories by tenant
  ⨯ it can check if slug exists
  ⨯ it can get category hierarchy
  ⨯ it can delete category
  ⨯ it returns false when deleting non existent category
  ⨯ it can update category
  ⨯ it maintains tenant isolation
  ⨯ it can find categories with pagination
  ⨯ it can find categories with sorting

   FAIL  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest
  ⨯ it can save product variant
  ⨯ it can find variant by id
  ⨯ it returns null when variant not found by id
  ⨯ it can find variant by sku
  ⨯ it returns null when variant not found by sku
  ⨯ it can find variant by category material quality
  ⨯ it can find variants by category
  ⨯ it can find variants by material
  ⨯ it can find variants by quality
  ⨯ it can find active variants
  ⨯ it can find variants in stock
  ⨯ it can find low stock variants
  ⨯ it can find variants by price range
  ⨯ it can update stock quantity
  ⨯ it can increase stock
  ⨯ it can decrease stock
  ⨯ it can update pricing
  ⨯ it can count variants by tenant
  ⨯ it can count variants by category
  ⨯ it can check if sku exists
  ⨯ it can delete variant
  ⨯ it returns false when deleting non existent variant
  ⨯ it maintains tenant isolation
  ⨯ it can find variants with pagination
  ⨯ it can find variants with sorting
  ⨯ it can search variants
  ⨯ it can get stock summary

   PASS  Tests\Unit\Services\Auth\JwtServiceTest
  ✓ it can generate jwt token for platform account                                                                                                                                       0.14s
  ✓ it can generate jwt token for tenant user                                                                                                                                            0.13s
  ✓ it fails authentication with invalid platform credentials                                                                                                                            0.11s
  ✓ it fails authentication with invalid tenant credentials                                                                                                                              0.11s
  ✓ it fails authentication for inactive platform account                                                                                                                                0.11s
  ✓ it fails authentication for inactive tenant                                                                                                                                          0.11s
  ✓ it fails authentication for expired tenant subscription                                                                                                                              0.11s
  ✓ it prevents cross tenant authentication                                                                                                                                              0.11s
  ✓ it includes proper user permissions in token                                                                                                                                         0.13s
  ✓ platform and tenant tokens have different structures                                                                                                                                 0.16s
  ✓ it handles case insensitive email lookup                                                                                                                                             0.12s
  ✓ it validates nonexistent email                                                                                                                                                       0.11s
  ✓ it validates nonexistent tenant                                                                                                                                                      0.12s
  ✓ it includes proper token expiration times                                                                                                                                            0.13s
  ✓ it includes account type in response                                                                                                                                                 0.13s
  ✓ it includes bearer token type                                                                                                                                                        0.11s

   PASS  Tests\Feature\Authentication\PlatformAuthenticationFlowTest
  ✓ complete platform authentication flow works                                                                                                                                          0.51s
  ✓ platform manager has limited permissions                                                                                                                                             0.12s
  ✓ rate limiting prevents brute force attacks                                                                                                                                           0.15s
  ✓ inactive account cannot login                                                                                                                                                        0.23s
  ✓ suspended account cannot login                                                                                                                                                       0.11s
  ✓ last login timestamp is updated                                                                                                                                                      0.13s
  ✓ token refresh works                                                                                                                                                                  0.19s
  ✓ invalid email format is rejected                                                                                                                                                     0.15s
  ✓ empty credentials are rejected                                                                                                                                                       0.12s
  ✓ case insensitive email login works                                                                                                                                                   0.15s
  ✓ concurrent logins are allowed                                                                                                                                                        0.25s

   PASS  Tests\Feature\Authentication\TenantAuthenticationFlowTest
  ✓ complete tenant authentication flow works                                                                                                                                            0.20s
  ✓ manager has limited permissions                                                                                                                                                      0.16s
  ✓ sales user has minimal permissions                                                                                                                                                   0.27s
  ✓ cross tenant authentication is prevented                                                                                                                                             0.12s
  ✓ inactive tenant prevents login                                                                                                                                                       0.12s
  ✓ expired subscription prevents login                                                                                                                                                  0.11s
  ✓ trial period allows login                                                                                                                                                            0.26s
  ✓ expired trial prevents login                                                                                                                                                         0.15s
  ✓ context based login works                                                                                                                                                            0.16s
  ✓ rate limiting is per tenant                                                                                                                                                          0.21s
  ✓ inactive user cannot login                                                                                                                                                           0.27s
  ✓ suspended user cannot login                                                                                                                                                          0.20s
  ✓ last login timestamp is updated                                                                                                                                                      0.29s
  ✓ user with multiple roles gets combined permissions                                                                                                                                   0.15s

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response                                                                                                                                        0.39s

   PASS  Tests\Feature\TenantIsolationTest
  ✓ tenant a cannot access tenant b customers                                                                                                                                            0.22s
  ✓ tenant b cannot access tenant a products                                                                                                                                             0.23s
  ✓ orders are properly scoped to tenant                                                                                                                                                 0.12s
  ✓ cross tenant relationships are prevented                                                                                                                                             0.10s
  ✓ tenant data counts are isolated                                                                                                                                                      0.10s
  ✓ tenant switching works correctly                                                                                                                                                     0.21s
  ✓ tenant models automatically get tenant id                                                                                                                                            0.12s
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it can create product category with basic attributes                                            QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "description", "level", "sort_or
der", "updated_at", "created_at") values (123e4567-e89b-12d3-a456-426614174000, 1, Etching Products, etching-products, All etching related products, 0, 0, 2025-11-17 22:47:52, 2025-11-17 22:47
:52) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it auto generates uuid on creation                                                              QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("tenant_id", "name", "slug", "uuid", "updated_at", "created_at") valu
es (1, Test Category, test-category, 567fa90a-7dd5-4bfc-9eec-5954ecbac386, 2025-11-17 22:47:52, 2025-11-17 22:47:52) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it updates hierarchy when parent changes                                                        QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "path", "updated_at", "
created_at") values (123e4567-e89b-12d3-a456-426614174000, 1, Parent Category, parent-category, 0, parent-category, 2025-11-17 22:47:52, 2025-11-17 22:47:52) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it has tenant relationship                                                                               Error
  Class "App\Infrastructure\Persistence\Eloquent\Models\Tenant" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Concerns\HasRelationships.php:793
    789▕      * @return mixed
    790▕      */
    791▕     protected function newRelatedInstance($class)
    792▕     {
  ➜ 793▕         return tap(new $class, function ($instance) {
    794▕             if (! $instance->getConnectionName()) {
    795▕                 $instance->setConnection($this->connection);
    796▕             }
    797▕         });

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Concerns\HasRelationships.php:793
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Concerns\HasRelationships.php:225

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it has descendants relationship                                                                 QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "updated_at", "created_
at") values (123e4567-e89b-12d3-a456-426614174000, 1, Root, root, 0, 2025-11-17 22:47:52, 2025-11-17 22:47:52) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it has products relationship                                                                             Error
  Class "App\Infrastructure\Persistence\Eloquent\Models\Product" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Concerns\HasRelationships.php:793
    789▕      * @return mixed
    790▕      */
    791▕     protected function newRelatedInstance($class)
    792▕     {
  ➜ 793▕         return tap(new $class, function ($instance) {
    794▕             if (! $instance->getConnectionName()) {
    795▕                 $instance->setConnection($this->connection);
    796▕             }
    797▕         });

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Concerns\HasRelationships.php:793
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Concerns\HasRelationships.php:388

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it scopes active categories                                                                     QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "is_active", "updated_at", "crea
ted_at") values (123e4567-e89b-12d3-a456-426614174000, 1, Active Category, active-category, 1, 2025-11-17 22:47:52, 2025-11-17 22:47:52) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it scopes featured categories                                                                   QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "is_featured", "updated_at", "cr
eated_at") values (123e4567-e89b-12d3-a456-426614174000, 1, Featured Category, featured-category, 1, 2025-11-17 22:47:52, 2025-11-17 22:47:52) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it scopes root categories                                                                       QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "updated_at", "created_
at") values (123e4567-e89b-12d3-a456-426614174000, 1, Root Category, root-category, 0, 2025-11-17 22:47:52, 2025-11-17 22:47:52) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it scopes categories by level                                                                   QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "updated_at", "created_
at") values (123e4567-e89b-12d3-a456-426614174000, 1, Root Category, root-category, 0, 2025-11-17 22:47:53, 2025-11-17 22:47:53) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it scopes categories shown in menu                                                              QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "show_in_menu", "updated_at", "c
reated_at") values (123e4567-e89b-12d3-a456-426614174000, 1, Menu Category, menu-category, 1, 2025-11-17 22:47:53, 2025-11-17 22:47:53) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it scopes ordered categories                                                                    QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "sort_order", "updated_at", "cre
ated_at") values (123e4567-e89b-12d3-a456-426614174000, 1, Z Category, z-category, 30, 2025-11-17 22:47:53, 2025-11-17 22:47:53) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it checks if category has children                                                              QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "updated_at", "created_at") valu
es (123e4567-e89b-12d3-a456-426614174000, 1, Parent Category, parent-category, 2025-11-17 22:47:53, 2025-11-17 22:47:53) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it checks if category has products                                                              QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "updated_at", "created_at") valu
es (123e4567-e89b-12d3-a456-426614174000, 1, Test Category, test-category, 2025-11-17 22:47:53, 2025-11-17 22:47:53) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it generates full path                                                                          QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "updated_at", "created_
at") values (123e4567-e89b-12d3-a456-426614174000, 1, Electronics, electronics, 0, 2025-11-17 22:47:53, 2025-11-17 22:47:53) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it generates breadcrumb                                                                         QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "updated_at", "created_
at") values (123e4567-e89b-12d3-a456-426614174000, 1, Electronics, electronics, 0, 2025-11-17 22:47:53, 2025-11-17 22:47:53) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it stores allowed materials as array                                                            QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "allowed_materials", "updated_at
", "created_at") values (123e4567-e89b-12d3-a456-426614174000, 1, Metal Products, metal-products, ["kuningan","tembaga","stainless_steel"], 2025-11-17 22:47:53, 2025-11-17 22:47:53) returning
"id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it stores quality levels as array                                                               QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "quality_levels", "updated_at",
"created_at") values (123e4567-e89b-12d3-a456-426614174000, 1, Premium Products, premium-products, ["tinggi","premium"], 2025-11-17 22:47:53, 2025-11-17 22:47:53) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it stores customization options as array                                                        QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "customization_options", "update
d_at", "created_at") values (123e4567-e89b-12d3-a456-426614174000, 1, Custom Products, custom-products, {"thickness":["2mm","3mm","5mm"],"finish":["glossy","matte"],"custom_text":true}, 2025-1
1-17 22:47:53, 2025-11-17 22:47:53) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it stores seo keywords as array                                                                 QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "seo_keywords", "updated_at", "c
reated_at") values (123e4567-e89b-12d3-a456-426614174000, 1, Etching Services, etching-services, ["etching","laser","engraving","custom"], 2025-11-17 22:47:54, 2025-11-17 22:47:54) returning "
id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it casts base markup percentage as decimal                                                      QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "base_markup_percentage", "updat
ed_at", "created_at") values (123e4567-e89b-12d3-a456-426614174000, 1, Premium Category, premium-category, 25.75, 2025-11-17 22:47:54, 2025-11-17 22:47:54) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest > it uses soft deletes                                                                            QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "updated_at", "created_at") valu
es (123e4567-e89b-12d3-a456-426614174000, 1, Test Category, test-category, 2025-11-17 22:47:54, 2025-11-17 22:47:54) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it has correct fillable attributes
  Failed asserting that two arrays are equal.
--- Expected
+++ Actual
@@ @@
 Array (
     0 => 'uuid'
     1 => 'tenant_id'
-    2 => 'category_id'
-    3 => 'material'
-    4 => 'quality'
-    5 => 'sku'
-    6 => 'base_price'
-    7 => 'selling_price'
-    8 => 'retail_price'
-    9 => 'cost_price'
-    10 => 'stock_quantity'
-    11 => 'low_stock_threshold'
-    12 => 'length'
-    13 => 'width'
-    14 => 'thickness'
-    15 => 'weight'
-    16 => 'etching_specifications'
-    17 => 'is_active'
+    2 => 'product_id'
+    3 => 'name'
+    4 => 'sku'
+    5 => 'material'
+    6 => 'quality'
+    7 => 'thickness'
+    8 => 'color'
+    9 => 'color_hex'
+    10 => 'dimensions'
+    11 => 'price_adjustment'
+    12 => 'markup_percentage'
+    13 => 'vendor_price'
+    14 => 'stock_quantity'
+    15 => 'low_stock_threshold'
+    16 => 'track_inventory'
+    17 => 'allow_backorder'
+    18 => 'is_active'
+    19 => 'is_default'
+    20 => 'sort_order'
+    21 => 'lead_time_days'
+    22 => 'lead_time_note'
+    23 => 'images'
+    24 => 'custom_fields'
+    25 => 'special_notes'
+    26 => 'weight'
+    27 => 'shipping_dimensions'
 )

  at tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest.php:50
     46▕         ];
     47▕
     48▕         $variant = new ProductVariant();
     49▕
  ➜  50▕         $this->assertEquals($expectedFillable, $variant->getFillable());
     51▕     }
     52▕
     53▕     /** @test */
     54▕     public function it_casts_attributes_correctly(): void

  1   tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest.php:50

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it casts attributes correctly                                                                    ErrorException
  Undefined array key "base_price"

  at tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest.php:75
     71▕
     72▕         $variant = new ProductVariant();
     73▕
     74▕         foreach ($expectedCasts as $attribute => $cast) {
  ➜  75▕             $this->assertEquals($cast, $variant->getCasts()[$attribute]);
     76▕         }
     77▕     }
     78▕
     79▕     /** @test */

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it can create product variant with basic attributes                                              QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:54, 2025-11-17 22:47:54) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it auto generates uuid on creation                                                               QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:54, 2025-11-17 22:47:54) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it has tenant relationship                                                                                Error
  Class "App\Infrastructure\Persistence\Eloquent\Models\Tenant" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Concerns\HasRelationships.php:793
    789▕      * @return mixed
    790▕      */
    791▕     protected function newRelatedInstance($class)
    792▕     {
  ➜ 793▕         return tap(new $class, function ($instance) {
    794▕             if (! $instance->getConnectionName()) {
    795▕                 $instance->setConnection($this->connection);
    796▕             }
    797▕         });

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Concerns\HasRelationships.php:793
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Concerns\HasRelationships.php:225

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it has category relationship                                                             BadMethodCallException
  Call to undefined method App\Infrastructure\Persistence\Eloquent\Models\ProductVariant::category()

  at vendor\laravel\framework\src\Illuminate\Support\Traits\ForwardsCalls.php:67
     63▕      * @throws \BadMethodCallException
     64▕      */
     65▕     protected static function throwBadMethodCallException($method)
     66▕     {
  ➜  67▕         throw new BadMethodCallException(sprintf(
     68▕             'Call to undefined method %s::%s()', static::class, $method
     69▕         ));
     70▕     }
     71▕ }

  1   vendor\laravel\framework\src\Illuminate\Support\Traits\ForwardsCalls.php:67
  2   vendor\laravel\framework\src\Illuminate\Support\Traits\ForwardsCalls.php:36

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it scopes active variants                                                                        QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:55, 2025-11-17 22:47:55) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it scopes variants by material                                                                   QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:55, 2025-11-17 22:47:55) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it scopes variants by quality                                                                    QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:55, 2025-11-17 22:47:55) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it scopes variants in stock                                                                      QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:55, 2025-11-17 22:47:55) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it scopes variants out of stock                                                                  QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:55, 2025-11-17 22:47:55) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it scopes variants low stock                                                                     QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:55, 2025-11-17 22:47:55) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it scopes variants by price range                                                                QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:55, 2025-11-17 22:47:55) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it checks if variant has stock                                                                   QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:56, 2025-11-17 22:47:56) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it checks if variant is low stock                                                                QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:56, 2025-11-17 22:47:56) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it calculates profit margin                                                                      QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:56, 2025-11-17 22:47:56) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it handles zero base price in margin calculation                                                 QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:56, 2025-11-17 22:47:56) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it calculates dimensions                                                                         QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:56, 2025-11-17 22:47:56) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it generates display name                                                                        QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:56, 2025-11-17 22:47:56) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it stores etching specifications as array                                                        QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:56, 2025-11-17 22:47:56) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it casts prices as decimal                                                                       QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:56, 2025-11-17 22:47:56) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it casts dimensions as decimal                                                                   QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:56, 2025-11-17 22:47:56) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it uses soft deletes                                                                             QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:56, 2025-11-17 22:47:56) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest > it maintains category relationship                                                               QueryException
  SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants". (Connection: pgsql, SQL: insert into "product_categories" ("uuid", "tenant_id", "name", "slug", "level", "sort_order", "updated_
at", "created_at") values (456e7890-e12b-34c5-d678-901234567890, 1, Test Category, test-category, 0, 0, 2025-11-17 22:47:57, 2025-11-17 22:47:57) returning "id")

  at vendor\laravel\framework\src\Illuminate\Database\Connection.php:829
    825▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    826▕                 );
    827▕             }
    828▕
  ➜ 829▕             throw new QueryException(
    830▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    831▕             );
    832▕         }
    833▕     }

  1   vendor\laravel\framework\src\Illuminate\Database\Connection.php:829

  2   vendor\laravel\framework\src\Illuminate\Database\Connection.php:428
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23503]: Foreign key violation: 7 ERROR:  insert or update on table "product_categories" violates foreign key constraint "product
_categories_tenant_id_foreign"
DETAIL:  Key (tenant_id)=(1) is not present in table "tenants".")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can save product category                                                                       Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can find category by id                                                                         Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it returns null when category not found by id                                                      Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can find category by slug                                                                       Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it returns null when category not found by slug                                                    Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can find root categories                                                                        Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can find children categories                                                                    Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can find active categories                                                                      Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can find featured categories                                                                    Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can find categories by material                                                                 Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can find categories by level                                                                    Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can search categories by name                                                                   Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can count categories by tenant                                                                  Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can check if slug exists                                                                        Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can get category hierarchy                                                                      Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can delete category                                                                             Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it returns false when deleting non existent category                                               Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can update category                                                                             Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it maintains tenant isolation                                                                      Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can find categories with pagination                                                             Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest > it can find categories with sorting                                                                Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28
     24▕     protected function setUp(): void
     25▕     {
     26▕         parent::setUp();
     27▕
  ➜  28▕         $this->repository = new ProductCategoryEloquentRepository();
     29▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     30▕
     31▕         // Set up test tenant context
     32▕         app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

  1   tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest.php:28

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can save product variant                                                                         Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can find variant by id                                                                           Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it returns null when variant not found by id                                                        Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can find variant by sku                                                                          Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it returns null when variant not found by sku                                                       Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can find variant by category material quality                                                    Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can find variants by category                                                                    Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can find variants by material                                                                    Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can find variants by quality                                                                     Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can find active variants                                                                         Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can find variants in stock                                                                       Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can find low stock variants                                                                      Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can find variants by price range                                                                 Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can update stock quantity                                                                        Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can increase stock                                                                               Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can decrease stock                                                                               Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can update pricing                                                                               Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can count variants by tenant                                                                     Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can count variants by category                                                                   Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can check if sku exists                                                                          Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can delete variant                                                                               Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it returns false when deleting non existent variant                                                 Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it maintains tenant isolation                                                                       Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can find variants with pagination                                                                Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can find variants with sorting                                                                   Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can search variants                                                                              Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest > it can get stock summary                                                                            Error
  Class "App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository" not found

  at tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26
     22▕     protected function setUp(): void
     23▕     {
     24▕         parent::setUp();
     25▕
  ➜  26▕         $this->repository = new ProductVariantEloquentRepository();
     27▕         $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
     28▕         $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
     29▕
     30▕         // Set up test tenant context

  1   tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest.php:26


  Tests:    94 failed, 319 passed (1157 assertions)
  Duration: 34.49s
