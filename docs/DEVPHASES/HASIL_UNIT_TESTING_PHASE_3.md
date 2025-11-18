
   PASS  Tests\Unit\Application\Product\CreateProductCategoryUseCaseTest
  ✓ it creates root category successfully                                                                        0.34s  
  ✓ it creates child category successfully                                                                       0.02s  
  ✓ it throws exception when slug already exists                                                                 0.02s  
  ✓ it throws exception when parent not found                                                                    0.02s  
  ✓ it creates category with allowed materials                                                                   0.03s  
  ✓ it creates category with quality levels                                                                      0.03s  
  ✓ it creates category with customization options                                                               0.02s  
  ✓ it creates category with seo information                                                                     0.02s  
  ✓ it creates category with pricing configuration                                                               0.03s  
  ✓ it validates invalid material values                                                                         0.02s  
  ✓ it validates invalid quality values                                                                          0.03s  
  ✓ it validates markup percentage range                                                                         0.02s  
  ✓ it creates featured category                                                                                 0.02s  
  ✓ it creates hidden menu category                                                                              0.02s  
  ✓ it creates category with media information                                                                   0.03s  
  ✓ it creates category with custom sort order                                                                   0.02s  

   PASS  Tests\Unit\Application\Product\CreateProductVariantUseCaseTest
  ✓ it creates product variant successfully                                                                      0.06s  
  ✓ it creates variant with pricing information                                                                  0.02s  
  ✓ it creates variant with stock information                                                                    0.03s  
  ✓ it creates variant with dimensions                                                                           0.02s  
  ✓ it creates variant with custom sku                                                                           0.03s  
  ✓ it creates variant with etching specifications                                                               0.02s  
  ✓ it throws exception when category not found                                                                  0.03s  
  ✓ it throws exception when variant already exists                                                              0.02s  
  ✓ it throws exception when custom sku already exists                                                           0.02s  
  ✓ it validates invalid material                                                                                0.02s  
  ✓ it validates invalid quality                                                                                 0.02s  
  ✓ it validates negative dimensions                                                                             0.03s  
  ✓ it validates negative weight                                                                                 0.02s  
  ✓ it validates negative stock                                                                                  0.02s  
  ✓ it validates invalid pricing                                                                                 0.02s  
  ✓ it calculates price with material and quality multipliers                                                    0.03s  

   PASS  Tests\Unit\Domain\CustomerEntityTest
  ✓ it can be created with valid data                                                                            0.04s  
  ✓ it can be created as business customer                                                                       0.03s  
  ✓ business customer requires company name                                                                      0.03s  
  ✓ it can update name                                                                                           0.02s  
  ✓ it can update email                                                                                          0.02s  
  ✓ it can add and remove tags                                                                                   0.03s  
  ✓ it prevents duplicate tags                                                                                   0.04s  
  ✓ it can suspend and activate                                                                                  0.02s  
  ✓ it can update last order date                                                                                0.02s  
  ✓ it can calculate days since last order                                                                       0.03s  
  ✓ it returns null for days since last order when no orders                                                     0.02s  
  ✓ it generates correct display name for individual                                                             0.02s  
  ✓ it generates correct display name for business                                                               0.02s  
  ✓ it can update phone                                                                                          0.02s  
  ✓ it can update address                                                                                        0.03s  
  ✓ it can convert to array                                                                                      0.02s  

   PASS  Tests\Unit\Domain\Product\Enums\ProductMaterialTest
  ✓ it has all expected material values                                                                          0.04s  
  ✓ it returns correct string values                                                                             0.03s  
  ✓ it returns correct display names                                                                             0.03s  
  ✓ it returns correct descriptions                                                                              0.03s  
  ✓ it returns correct pricing multipliers                                                                       0.03s  
  ✓ it identifies metal materials correctly                                                                      0.03s  
  ✓ it identifies plastic materials correctly                                                                    0.03s  
  ✓ it returns correct density values                                                                            0.03s  
  ✓ it returns correct melting points                                                                            0.03s  
  ✓ it returns correct hardness levels                                                                           0.04s  
  ✓ it returns correct corrosion resistance                                                                      0.03s  
  ✓ it returns correct workability levels                                                                        0.03s  
  ✓ it returns correct etching suitability                                                                       0.03s  
  ✓ it returns available thickness options                                                                       0.03s  
  ✓ it returns available finishes                                                                                0.03s  
  ✓ it calculates weight correctly                                                                               0.03s  
  ✓ it can be created from string                                                                                0.03s  
  ✓ it throws exception for invalid string                                                                       0.03s  
  ✓ it returns all materials as options                                                                          0.03s  
  ✓ it returns metal materials only                                                                              0.03s  
  ✓ it returns plastic materials only                                                                            0.03s  
  ✓ it returns materials suitable for etching                                                                    0.03s  
  ✓ it can compare materials by price                                                                            0.03s  
  ✓ it can get compatible finishes for material                                                                  0.03s  
  ✓ it validates thickness availability                                                                          0.03s  
  ✓ it validates finish availability                                                                             0.03s  

   PASS  Tests\Unit\Domain\Product\Enums\ProductQualityTest
  ✓ it has all expected quality values                                                                           0.06s  
  ✓ it returns correct string values                                                                             0.04s  
  ✓ it returns correct display names                                                                             0.03s  
  ✓ it returns correct descriptions                                                                              0.03s  
  ✓ it returns correct pricing multipliers                                                                       0.03s  
  ✓ it returns correct precision levels                                                                          0.03s  
  ✓ it returns correct surface finish quality                                                                    0.03s  
  ✓ it returns correct inspection levels                                                                         0.03s  
  ✓ it returns correct lead times                                                                                0.03s  
  ✓ it returns correct minimum order quantities                                                                  0.03s  
  ✓ it returns available finishes per quality                                                                    0.03s  
  ✓ it returns correct quality certifications                                                                    0.03s  
  ✓ it checks if requires special tooling                                                                        0.03s  
  ✓ it checks if requires quality approval                                                                       0.03s  
  ✓ it checks if includes documentation                                                                          0.03s  
  ✓ it returns correct etching depth precision                                                                   0.03s  
  ✓ it returns correct edge quality levels                                                                       0.03s  
  ✓ it calculates price with multiplier                                                                          0.03s  
  ✓ it can be created from string                                                                                0.03s  
  ✓ it throws exception for invalid string                                                                       0.03s  
  ✓ it returns all qualities as options                                                                          0.03s  
  ✓ it can compare quality levels                                                                                0.03s  
  ✓ it can check if is lower quality                                                                             0.03s  
  ✓ it returns quality level numeric value                                                                       0.04s  
  ✓ it can sort qualities by level                                                                               0.03s  
  ✓ it returns qualities above level                                                                             0.03s  
  ✓ it returns qualities below level                                                                             0.04s  
  ✓ it calculates quality upgrade cost                                                                           0.03s  
  ✓ it returns compatible materials per quality                                                                  0.03s  
  ✓ it checks if quality is suitable for application                                                             0.03s  
  ✓ it returns recommended applications                                                                          0.03s  

   PASS  Tests\Unit\Domain\Product\ProductCategoryEntityTest
  ✓ it can be created with valid data                                                                            0.06s  
  ✓ it can be created as child category                                                                          0.03s  
  ✓ it can update basic information                                                                              0.03s  
  ✓ it can be activated and deactivated                                                                          0.03s  
  ✓ it can be featured and unfeatured                                                                            0.03s  
  ✓ it can toggle menu visibility                                                                                0.04s  
  ✓ it can set allowed materials                                                                                 0.03s  
  ✓ it can set quality levels                                                                                    0.03s  
  ✓ it can set customization options                                                                             0.03s  
  ✓ it can update sort order                                                                                     0.03s  
  ✓ it can set media information                                                                                 0.04s  
  ✓ it can set seo information                                                                                   0.03s  
  ✓ it can set pricing configuration                                                                             0.03s  
  ✓ it validates markup percentage range                                                                         0.03s  
  ✓ it can check if has etching materials                                                                        0.03s  
  ✓ it can get hierarchy path                                                                                    0.03s  
  ✓ it can convert to array                                                                                      0.03s  
  ✓ it generates correct breadcrumb                                                                              0.03s  
  ✓ it validates parent relationship prevents circular reference                                                 0.03s  

   PASS  Tests\Unit\Domain\Product\ProductVariantEntityTest
  ✓ it can be created with valid data                                                                            0.05s  
  ✓ it generates sku automatically                                                                               0.03s  
  ✓ it can update pricing information                                                                            0.03s  
  ✓ it calculates profit margin correctly                                                                        0.03s  
  ✓ it handles zero base price for profit margin                                                                 0.03s  
  ✓ it can update stock quantity                                                                                 0.03s  
  ✓ it can increase stock                                                                                        0.03s  
  ✓ it can decrease stock                                                                                        0.03s  
  ✓ it prevents negative stock decrease                                                                          0.03s  
  ✓ it can set low stock threshold                                                                               0.03s  
  ✓ it can check stock status                                                                                    0.04s  
  ✓ it can set dimensions                                                                                        0.03s  
  ✓ it validates positive dimensions                                                                             0.03s  
  ✓ it can set weight                                                                                            0.03s  
  ✓ it validates positive weight                                                                                 0.03s  
  ✓ it can be activated and deactivated                                                                          0.03s  
  ✓ it can set custom sku                                                                                        0.03s  
  ✓ it validates unique sku format                                                                               0.04s  
  ✓ it can set etching specifications                                                                            0.03s  
  ✓ it can check material properties                                                                             0.03s  
  ✓ it can check quality level                                                                                   0.03s  
  ✓ it applies material and quality pricing multipliers                                                          0.03s  
  ✓ it can convert to array                                                                                      0.03s  
  ✓ it generates variant display name                                                                            0.03s  

   PASS  Tests\Unit\Domain\Product\ValueObjects\ProductCategoryNameTest
  ✓ it can be created with valid name                                                                            0.06s  
  ✓ it trims whitespace from name                                                                                0.03s  
  ✓ it validates minimum length                                                                                  0.04s  
  ✓ it validates maximum length                                                                                  0.03s  
  ✓ it rejects empty name                                                                                        0.05s  
  ✓ it rejects only whitespace name                                                                              0.03s  
  ✓ it allows valid special characters                                                                           0.03s  
  ✓ it rejects invalid special characters                                                                        0.03s  
  ✓ it allows unicode characters                                                                                 0.03s  
  ✓ it handles mixed case properly                                                                               0.04s  
  ✓ it can check equality                                                                                        0.03s  
  ✓ it is case sensitive for equality                                                                            0.05s  
  ✓ it can generate slug suggestion                                                                              0.05s  
  ✓ it handles unicode in slug generation                                                                        0.03s  
  ✓ it can check if contains etching keywords                                                                    0.04s  
  ✓ it can get character count                                                                                   0.04s  
  ✓ it can get word count                                                                                        0.04s  
  ✓ it can convert to title case                                                                                 0.04s  
  ✓ it can truncate with ellipsis                                                                                0.04s  
  ✓ it does not truncate short names                                                                             0.04s  
  ✓ it can check if contains word                                                                                0.05s  

   PASS  Tests\Unit\Domain\Product\ValueObjects\ProductCategorySlugTest
  ✓ it can be created with valid slug                                                                            0.07s  
  ✓ it validates minimum length                                                                                  0.05s  
  ✓ it validates maximum length                                                                                  0.03s  
  ✓ it rejects empty slug                                                                                        0.03s  
  ✓ it rejects slug with spaces                                                                                  0.04s  
  ✓ it rejects slug with uppercase letters                                                                       0.04s  
  ✓ it rejects slug with special characters                                                                      0.03s  
  ✓ it allows valid slug formats                                                                                 0.03s  
  ✓ it rejects slug starting with hyphen                                                                         0.03s  
  ✓ it rejects slug ending with hyphen                                                                           0.03s  
  ✓ it rejects slug with consecutive hyphens                                                                     0.03s  
  ✓ it can check equality                                                                                        0.03s  
  ✓ it can generate from name                                                                                    0.03s  
  ✓ it handles unicode characters in generation                                                                  0.03s  
  ✓ it removes stopwords when generating from name                                                               0.03s  
  ✓ it can get parent slug from path                                                                             0.03s  
  ✓ it can check if etching related                                                                              0.03s  
  ✓ it can check if material related                                                                             0.03s  
  ✓ it can get slug depth                                                                                        0.03s  
  ✓ it can append suffix                                                                                         0.03s  
  ✓ it validates suffix format                                                                                   0.03s  
  ✓ it can prepend prefix                                                                                        0.03s  
  ✓ it validates prefix format                                                                                   0.05s  
  ✓ it can check if contains word                                                                                0.03s  
  ✓ it generates unique variation                                                                                0.04s  
  ✓ it returns original if no conflicts                                                                          0.03s  

   PASS  Tests\Unit\Domain\TenantEntityTest
  ✓ it can be created with valid data                                                                            0.06s  
  ✓ it can be activated                                                                                          0.03s  
  ✓ it can be suspended                                                                                          0.03s  
  ✓ it can start trial                                                                                           0.03s  
  ✓ it can end trial                                                                                             0.03s  
  ✓ it can update subscription                                                                                   0.03s  
  ✓ it can expire subscription                                                                                   0.03s  
  ✓ it can set custom domain                                                                                     0.03s  
  ✓ it can remove custom domain                                                                                  0.03s  
  ✓ it generates correct public url with custom domain                                                           0.03s  
  ✓ it generates correct public url with slug                                                                    0.03s  
  ✓ it generates correct admin url                                                                               0.03s  
  ✓ it can check if subscription is active                                                                       0.03s  
  ✓ it validates trial status correctly                                                                          0.03s  
  ✓ it can convert to array                                                                                      0.03s  

   PASS  Tests\Unit\ExampleTest
  ✓ that true is true                                                                                            0.02s  

   PASS  Tests\Unit\Http\Controllers\Platform\AuthControllerTest
  ✓ it can authenticate platform account with valid credentials                                                  1.46s  
  ✓ it rejects invalid credentials                                                                               0.11s  
  ✓ it rejects non existent account                                                                              0.10s  
  ✓ it rejects inactive account                                                                                  0.10s  
  ✓ it validates required fields                                                                                 0.10s  
  ✓ it validates email format                                                                                    0.10s  
  ✓ it enforces rate limiting                                                                                    0.12s  
  ✓ it can logout successfully                                                                                   0.12s  
  ✓ it can get authenticated user info                                                                           0.12s  
  ✓ it requires authentication for protected endpoints                                                           0.11s  
  ✓ it rejects invalid tokens                                                                                    0.11s  
  ✓ it handles suspended account login                                                                           0.15s  
  ✓ it updates last login timestamp on successful authentication                                                 0.19s  
  ✓ it includes proper expiration time                                                                           0.17s  
  ✓ it includes bearer token type                                                                                0.23s  

   PASS  Tests\Unit\Http\Controllers\Tenant\AuthControllerTest
  ✓ it can authenticate tenant user with valid credentials                                                       0.23s  
  ✓ it rejects invalid credentials                                                                               0.13s  
  ✓ it rejects non existent user                                                                                 0.12s  
  ✓ it rejects user from wrong tenant                                                                            0.12s  
  ✓ it rejects inactive tenant                                                                                   0.11s  
  ✓ it rejects expired subscription                                                                              0.12s  
  ✓ it rejects inactive user                                                                                     0.13s  
  ✓ it validates required fields                                                                                 0.12s  
  ✓ it validates email format                                                                                    0.13s  
  ✓ it enforces rate limiting per tenant                                                                         0.16s  
  ✓ it can logout successfully                                                                                   0.15s  
  ✓ it can get authenticated user info                                                                           0.27s  
  ✓ it includes user permissions in response                                                                     0.26s  
  ✓ it handles suspended user login                                                                              0.24s  
  ✓ it prevents login to trial expired tenant                                                                    0.16s  
  ✓ it allows login to active trial tenant                                                                       0.15s  
  ✓ it includes tenant context in response                                                                       0.20s  

   PASS  Tests\Unit\Http\Middleware\PlatformAccessMiddlewareTest
  ✓ it allows authenticated platform account                                                                     0.13s  
  ✓ it rejects unauthenticated requests                                                                          0.10s  
  ✓ it rejects tenant user accessing platform routes                                                             0.15s  
  ✓ it rejects inactive platform account                                                                         0.10s  
  ✓ it rejects suspended platform account                                                                        0.14s  
  ✓ it allows different platform account types                                                                   0.09s  
  ✓ it handles invalid token gracefully                                                                          0.09s  
  ✓ it sets correct guard context                                                                                0.10s  
  ✓ it logs security events                                                                                      0.09s  

   PASS  Tests\Unit\Http\Middleware\TenantContextMiddlewareTest
  ✓ it identifies tenant from subdomain                                                                          0.12s  
  ✓ it identifies tenant from custom domain                                                                      0.10s  
  ✓ it identifies tenant from path parameter                                                                     0.10s  
  ✓ it rejects request for nonexistent tenant                                                                    0.10s  
  ✓ it rejects request for inactive tenant                                                                       0.11s  
  ✓ it rejects request for expired subscription                                                                  0.11s  
  ✓ it allows trial tenant within trial period                                                                   0.11s  
  ✓ it rejects expired trial tenant                                                                              0.11s  
  ✓ it enforces tenant scoped authentication                                                                     0.13s  
  ✓ it rejects user from different tenant                                                                        0.13s  
  ✓ it sets tenant context in application                                                                        0.12s  
  ✓ it handles suspended tenant                                                                                  0.11s  
  ✓ it prioritizes custom domain over subdomain                                                                  0.13s  
  ✓ it handles www prefix in custom domain                                                                       0.13s  

   PASS  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest
  ✓ it has correct fillable attributes                                                                           0.11s  
  ✓ it casts attributes correctly                                                                                0.10s  
  ✓ it can create product category with basic attributes                                                         0.14s  
  ✓ it auto generates uuid on creation                                                                           0.16s  
  ✓ it updates hierarchy when parent changes                                                                     0.20s  
  ✓ it has tenant relationship                                                                                   0.18s  
  ✓ it has parent relationship                                                                                   0.15s  
  ✓ it has children relationship                                                                                 0.14s  
  ✓ it has descendants relationship                                                                              0.25s  
  ✓ it has products relationship                                                                                 0.12s  
  ✓ it scopes active categories                                                                                  0.14s  
  ✓ it scopes featured categories                                                                                0.23s  
  ✓ it scopes root categories                                                                                    0.11s  
  ✓ it scopes categories by level                                                                                0.13s  
  ✓ it scopes categories shown in menu                                                                           0.24s  
  ✓ it scopes ordered categories                                                                                 0.12s  
  ✓ it checks if category has children                                                                           0.11s  
  ✓ it checks if category has products                                                                           0.11s  
  ✓ it generates full path                                                                                       0.23s  
  ✓ it generates breadcrumb                                                                                      0.11s  
  ✓ it stores allowed materials as array                                                                         0.20s  
  ✓ it stores quality levels as array                                                                            0.10s  
  ✓ it stores customization options as array                                                                     0.09s  
  ✓ it stores seo keywords as array                                                                              0.21s  
  ✓ it casts base markup percentage as decimal                                                                   0.11s  
  ✓ it uses soft deletes                                                                                         0.14s  

   PASS  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest
  ✓ it has correct fillable attributes                                                                           0.30s  
  ✓ it casts attributes correctly                                                                                0.09s  
  ✓ it can create product variant with basic attributes                                                          0.24s  
  ✓ it auto generates uuid on creation                                                                           0.28s  
  ✓ it has tenant relationship                                                                                   0.10s  
  ✓ it has category relationship                                                                                 0.09s  
  ✓ it scopes active variants                                                                                    0.13s  
  ✓ it scopes variants by material                                                                               0.14s  
  ✓ it scopes variants by quality                                                                                0.13s  
  ✓ it scopes variants in stock                                                                                  0.14s  
  ✓ it scopes variants out of stock                                                                              0.14s  
  ✓ it scopes variants low stock                                                                                 0.17s  
  ✓ it scopes variants by price range                                                                            0.17s  
  ✓ it checks if variant has stock                                                                               0.14s  
  ✓ it checks if variant is low stock                                                                            0.13s  
  ✓ it calculates profit margin                                                                                  0.13s  
  ✓ it handles zero base price in margin calculation                                                             0.25s  
  ✓ it calculates dimensions                                                                                     0.13s  
  ✓ it generates display name                                                                                    0.24s  
  ✓ it stores etching specifications as array                                                                    0.13s  
  ✓ it casts prices as decimal                                                                                   0.13s  
  ✓ it casts dimensions as decimal                                                                               0.13s  
  ✓ it uses soft deletes                                                                                         0.26s  
  ✓ it maintains category relationship                                                                           0.14s  

   PASS  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest
  ✓ it can save product category                                                                                 0.14s  
  ✓ it can find category by id                                                                                   0.11s  
  ✓ it returns null when category not found by id                                                                0.09s  
  ✓ it can find category by slug                                                                                 0.11s  
  ✓ it returns null when category not found by slug                                                              0.09s  
  ✓ it can find root categories                                                                                  0.13s  
  ✓ it can find children categories                                                                              0.14s  
  ✓ it can find active categories                                                                                0.12s  
  ✓ it can find featured categories                                                                              0.13s  
  ✓ it can find categories by material                                                                           0.13s  
  ✓ it can find categories by level                                                                              0.26s  
  ✓ it can search categories by name                                                                             0.12s  
  ✓ it can count categories by tenant                                                                            0.12s  
  ✓ it can check if slug exists                                                                                  0.11s  
  ✓ it can get category hierarchy                                                                                0.13s  
  ✓ it can delete category                                                                                       0.24s  
  ✓ it returns false when deleting non existent category                                                         0.20s  
  ✓ it can update category                                                                                       0.10s  
  ✓ it maintains tenant isolation                                                                                0.11s  
  ✓ it can find categories with pagination                                                                       0.18s  
  ✓ it can find categories with sorting                                                                          0.25s  

   PASS  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest
  ✓ it can save product variant                                                                                  0.19s  
  ✓ it can find variant by id                                                                                    0.12s  
  ✓ it returns null when variant not found by id                                                                 0.07s  
  ✓ it can find variant by sku                                                                                   0.12s  
  ✓ it returns null when variant not found by sku                                                                0.08s  
  ✓ it can find variant by category material quality                                                             0.12s  
  ✓ it can find variants by category                                                                             0.14s  
  ✓ it can find variants by material                                                                             0.17s  
  ✓ it can find variants by quality                                                                              0.29s  
  ✓ it can find active variants                                                                                  0.15s  
  ✓ it can find variants in stock                                                                                0.17s  
  ✓ it can find low stock variants                                                                               0.18s  
  ✓ it can find variants by price range                                                                          0.17s  
  ✓ it can update stock quantity                                                                                 0.15s  
  ✓ it can increase stock                                                                                        0.15s  
  ✓ it can decrease stock                                                                                        0.27s  
  ✓ it can update pricing                                                                                        0.16s  
  ✓ it can count variants by tenant                                                                              0.19s  
  ✓ it can count variants by category                                                                            0.19s  
  ✓ it can check if sku exists                                                                                   0.16s  
  ✓ it can delete variant                                                                                        0.14s  
  ✓ it returns false when deleting non existent variant                                                          0.09s  
  ✓ it maintains tenant isolation                                                                                0.18s  
  ✓ it can find variants with pagination                                                                         0.41s  
  ✓ it can find variants with sorting                                                                            0.19s  
  ✓ it can search variants                                                                                       0.17s  
  ✓ it can get stock summary                                                                                     0.16s  

   PASS  Tests\Unit\Services\Auth\JwtServiceTest
  ✓ it can generate jwt token for platform account                                                               0.17s  
  ✓ it can generate jwt token for tenant user                                                                    0.15s  
  ✓ it fails authentication with invalid platform credentials                                                    0.22s  
  ✓ it fails authentication with invalid tenant credentials                                                      0.13s  
  ✓ it fails authentication for inactive platform account                                                        0.12s  
  ✓ it fails authentication for inactive tenant                                                                  0.23s  
  ✓ it fails authentication for expired tenant subscription                                                      0.12s  
  ✓ it prevents cross tenant authentication                                                                      0.12s  
  ✓ it includes proper user permissions in token                                                                 0.13s  
  ✓ platform and tenant tokens have different structures                                                         0.16s  
  ✓ it handles case insensitive email lookup                                                                     0.25s  
  ✓ it validates nonexistent email                                                                               0.12s  
  ✓ it validates nonexistent tenant                                                                              0.12s  
  ✓ it includes proper token expiration times                                                                    0.27s  
  ✓ it includes account type in response                                                                         0.16s  
  ✓ it includes bearer token type                                                                                0.13s  

   PASS  Tests\Feature\Authentication\PlatformAuthenticationFlowTest
  ✓ complete platform authentication flow works                                                                  0.18s  
  ✓ platform manager has limited permissions                                                                     0.13s  
  ✓ rate limiting prevents brute force attacks                                                                   0.14s  
  ✓ inactive account cannot login                                                                                0.12s  
  ✓ suspended account cannot login                                                                               0.12s  
  ✓ last login timestamp is updated                                                                              0.24s  
  ✓ token refresh works                                                                                          0.14s  
  ✓ invalid email format is rejected                                                                             0.14s  
  ✓ empty credentials are rejected                                                                               0.13s  
  ✓ case insensitive email login works                                                                           0.14s  
  ✓ concurrent logins are allowed                                                                                0.18s  

   PASS  Tests\Feature\Authentication\TenantAuthenticationFlowTest
  ✓ complete tenant authentication flow works                                                                    0.18s  
  ✓ manager has limited permissions                                                                              0.26s  
  ✓ sales user has minimal permissions                                                                           0.15s  
  ✓ cross tenant authentication is prevented                                                                     0.26s  
  ✓ inactive tenant prevents login                                                                               0.25s  
  ✓ expired subscription prevents login                                                                          0.16s  
  ✓ trial period allows login                                                                                    0.17s  
  ✓ expired trial prevents login                                                                                 0.17s  
  ✓ context based login works                                                                                    0.23s  
  ✓ rate limiting is per tenant                                                                                  0.28s  
  ✓ inactive user cannot login                                                                                   0.13s  
  ✓ suspended user cannot login                                                                                  0.29s  
  ✓ last login timestamp is updated                                                                              0.15s  
  ✓ user with multiple roles gets combined permissions                                                           0.27s  

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response                                                                0.07s  

   PASS  Tests\Feature\TenantIsolationTest
  ✓ tenant a cannot access tenant b customers                                                                    0.11s  
  ✓ tenant b cannot access tenant a products                                                                     0.12s  
  ✓ orders are properly scoped to tenant                                                                         0.12s  
  ✓ cross tenant relationships are prevented                                                                     0.11s  
  ✓ tenant data counts are isolated                                                                              0.11s  
  ✓ tenant switching works correctly                                                                             0.23s  
  ✓ tenant models automatically get tenant id                                                                    0.11s  

  Tests:    413 passed (1432 assertions)
  Duration: 39.76s

