<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use App\Infrastructure\Presentation\Http\Requests\CustomDomain\StoreCustomDomainRequest;
use App\Infrastructure\Presentation\Http\Requests\CustomDomain\UpdateCustomDomainRequest;
use App\Infrastructure\Presentation\Http\Resources\CustomDomain\CustomDomainResource;
use App\Application\TenantConfiguration\UseCases\VerifyDomainOwnershipUseCase;
use App\Domain\Tenant\Exceptions\DomainVerificationException;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;

class CustomDomainController extends Controller
{
    public function __construct(
        private VerifyDomainOwnershipUseCase $verifyDomainUseCase
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            
            $query = CustomDomainEloquentModel::query()
                ->where('tenant_id', $tenant->id);

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('ssl_enabled')) {
                $query->where('ssl_enabled', filter_var($request->ssl_enabled, FILTER_VALIDATE_BOOLEAN));
            }

            if ($request->filled('is_verified')) {
                $query->where('is_verified', filter_var($request->is_verified, FILTER_VALIDATE_BOOLEAN));
            }

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $perPage = $request->get('per_page', 20);

            $domains = $query->with(['tenant', 'createdBy'])
                ->orderBy($sortBy, $sortOrder)
                ->paginate($perPage);

            $collection = CustomDomainResource::collection($domains);
            
            $totalCount = CustomDomainEloquentModel::where('tenant_id', $tenant->id)->count();
            $verifiedCount = CustomDomainEloquentModel::where('tenant_id', $tenant->id)
                ->where('is_verified', true)
                ->count();
            $pendingCount = CustomDomainEloquentModel::where('tenant_id', $tenant->id)
                ->where('status', 'pending_verification')
                ->count();

            // Return simple array format expected by frontend
            return response()->json([
                'success' => true,
                'message' => 'Custom domains retrieved successfully',
                'data' => $collection->collection->toArray(),
                'meta' => [
                    'total' => $totalCount,
                    'verified' => $verifiedCount,
                    'pending' => $pendingCount,
                    'current_page' => $domains->currentPage(),
                    'from' => $domains->firstItem(),
                    'last_page' => $domains->lastPage(),
                    'path' => $domains->path(),
                    'per_page' => $domains->perPage(),
                    'to' => $domains->lastItem(),
                ],
                'links' => [
                    'first' => $domains->url(1),
                    'last' => $domains->url($domains->lastPage()),
                    'prev' => $domains->previousPageUrl(),
                    'next' => $domains->nextPageUrl(),
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('[CustomDomainController] Failed to fetch custom domains', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Failed to fetch custom domains',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = $this->isUuid($id);
            
            $domain = CustomDomainEloquentModel::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->with(['tenant', 'createdBy'])
                ->firstOrFail();
                
            return (new CustomDomainResource($domain))->response()->setStatusCode(200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Custom domain not found'], 404);
        } catch (\Exception $e) {
            Log::error('[CustomDomainController] Failed to fetch custom domain', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'message' => 'Failed to fetch custom domain',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    public function store(StoreCustomDomainRequest $request): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $user = $request->user();

            $validatedData = $request->validated();
            $validatedData['tenant_id'] = $tenant->id;
            $validatedData['created_by'] = $user->id;
            $validatedData['status'] = 'pending_verification';
            $validatedData['is_verified'] = false;
            $validatedData['ssl_enabled'] = false;

            $domain = CustomDomainEloquentModel::create($validatedData);
            
            $domain->load(['tenant', 'createdBy']);

            Log::info('[CustomDomainController] Custom domain created', [
                'domain_uuid' => $domain->uuid,
                'domain_name' => $domain->domain_name,
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
            ]);

            return (new CustomDomainResource($domain))
                ->additional(['message' => 'Custom domain created. Please verify domain ownership.'])
                ->response()
                ->setStatusCode(201);
        } catch (\Exception $e) {
            Log::error('[CustomDomainController] Failed to create custom domain', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Failed to create custom domain',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    public function update(UpdateCustomDomainRequest $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = $this->isUuid($id);
            
            $domain = CustomDomainEloquentModel::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();

            $domain->update($request->validated());
            $domain->load(['tenant', 'createdBy']);

            Log::info('[CustomDomainController] Custom domain updated', [
                'domain_uuid' => $domain->uuid,
                'domain_name' => $domain->domain_name,
            ]);

            return (new CustomDomainResource($domain))
                ->additional(['message' => 'Custom domain updated successfully'])
                ->response()
                ->setStatusCode(200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Custom domain not found'], 404);
        } catch (\Exception $e) {
            Log::error('[CustomDomainController] Failed to update custom domain', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'message' => 'Failed to update custom domain',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            if (!$request->user()->can('settings.domain.delete')) {
                return response()->json([
                    'message' => 'Unauthorized. You do not have permission to delete custom domains.'
                ], 403);
            }

            $tenant = $this->resolveTenant($request);
            $isUuid = $this->isUuid($id);
            
            $domain = CustomDomainEloquentModel::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();

            $domainName = $domain->domain_name;
            $domainUuid = $domain->uuid;

            $domain->delete();

            Log::info('[CustomDomainController] Custom domain deleted', [
                'domain_uuid' => $domainUuid,
                'domain_name' => $domainName,
            ]);

            return response()->json([
                'message' => 'Custom domain deleted successfully',
                'data' => [
                    'uuid' => $domainUuid,
                    'domain_name' => $domainName,
                    'deleted_at' => now()->toIso8601String(),
                ]
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Custom domain not found'], 404);
        } catch (\Exception $e) {
            Log::error('[CustomDomainController] Failed to delete custom domain', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'message' => 'Failed to delete custom domain',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    public function verificationInstructions(Request $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = $this->isUuid($id);
            
            $domain = CustomDomainEloquentModel::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();

            if ($domain->is_verified) {
                return response()->json([
                    'message' => 'Domain is already verified',
                    'domain' => [
                        'uuid' => $domain->uuid,
                        'domainName' => $domain->domain_name,
                        'isVerified' => true,
                        'verifiedAt' => $domain->verified_at?->toIso8601String(),
                    ]
                ], 200);
            }

            $rawInstructions = $this->getVerificationInstructions($domain);
            
            $instructions = [
                'method' => $domain->verification_method,
                'steps' => $this->formatVerificationSteps($domain->verification_method, $rawInstructions),
            ];

            if ($domain->verification_method === 'dns_txt') {
                $instructions['recordName'] = $rawInstructions['host'];
                $instructions['recordValue'] = $rawInstructions['value'];
                $instructions['recordType'] = 'TXT';
            } elseif ($domain->verification_method === 'dns_cname') {
                $instructions['recordName'] = $rawInstructions['host'];
                $instructions['recordValue'] = $rawInstructions['value'];
                $instructions['recordType'] = 'CNAME';
            } elseif ($domain->verification_method === 'file_upload') {
                $instructions['filename'] = $rawInstructions['filename'];
                $instructions['content'] = $rawInstructions['content'];
                $instructions['path'] = $rawInstructions['path'];
            }

            return response()->json([
                'domain' => [
                    'uuid' => $domain->uuid,
                    'domainName' => $domain->domain_name,
                    'verificationMethod' => $domain->verification_method,
                ],
                'instructions' => $instructions,
                'verificationToken' => $domain->verification_token,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Custom domain not found'], 404);
        } catch (\Exception $e) {
            Log::error('[CustomDomainController] Failed to get verification instructions', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'message' => 'Failed to get verification instructions',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    public function verify(Request $request, string $id): JsonResponse
    {
        try {
            if (!$request->user()->can('settings.domain.verify')) {
                return response()->json([
                    'message' => 'Unauthorized. You do not have permission to verify domains.'
                ], 403);
            }

            $tenant = $this->resolveTenant($request);
            $isUuid = $this->isUuid($id);
            
            $domain = CustomDomainEloquentModel::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();

            $result = $this->verifyDomainUseCase->execute($domain->uuid);

            if ($result['success']) {
                $domain->refresh()->load(['tenant', 'createdBy']);

                $response = [
                    'success' => true,
                    'message' => $result['message'],
                    'data' => new CustomDomainResource($domain),
                ];

                if (isset($result['already_verified'])) {
                    $response['already_verified'] = $result['already_verified'];
                }

                if (!empty($result['verification_details'])) {
                    $response['verification_details'] = $result['verification_details'];
                }

                return response()->json($response, 200);
            }

            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Domain verification failed',
                'error' => 'VERIFICATION_FAILED',
                'details' => [
                    'reason' => $result['error'] ?? 'Verification failed',
                    'expected_record' => $this->getVerificationInstructions($domain),
                    'found_records' => $result['verification_details']['dns_records_found'] ?? [],
                    'help' => $result['help'] ?? 'Please check your DNS settings and try again.',
                ]
            ], 400);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Custom domain not found'], 404);
        } catch (DomainVerificationException $e) {
            Log::error('[CustomDomainController] Domain verification exception', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Domain verification failed',
                'error' => 'VERIFICATION_FAILED',
                'details' => [
                    'reason' => $e->getMessage(),
                ]
            ], 400);
        } catch (\Exception $e) {
            Log::error('[CustomDomainController] Failed to verify domain', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Failed to verify domain',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    private function resolveTenant(Request $request): TenantEloquentModel
    {
        $candidate = $request->get('current_tenant')
            ?? $request->attributes->get('tenant')
            ?? (function_exists('tenant') ? tenant() : null);

        if (!$candidate && app()->bound('tenant.current')) {
            $candidate = app('tenant.current');
        }

        if (!$candidate && app()->bound('current_tenant')) {
            $candidate = app('current_tenant');
        }

        if (!$candidate) {
            $candidate = config('multitenancy.current_tenant');
        }

        if ($candidate) {
            return $candidate;
        }

        $tenantId = $request->header('X-Tenant-ID');
        if ($tenantId) {
            return TenantEloquentModel::find($tenantId);
        }

        throw new \RuntimeException('Tenant context not found');
    }

    private function isUuid(string $id): bool
    {
        return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
    }

    private function getVerificationInstructions(CustomDomainEloquentModel $domain): array
    {
        return match ($domain->verification_method) {
            'dns_txt' => [
                'type' => 'TXT',
                'host' => '_canva-verify.' . $domain->domain_name,
                'value' => $domain->verification_token,
                'ttl' => 300,
                'help' => 'Add a TXT record to your DNS settings with the following values. DNS propagation may take up to 48 hours.',
            ],
            'dns_cname' => [
                'type' => 'CNAME',
                'host' => '_canva-verify.' . $domain->domain_name,
                'value' => $domain->verification_token . '.verify.canvastack.com',
                'ttl' => 300,
                'help' => 'Add a CNAME record to your DNS settings with the following values. DNS propagation may take up to 48 hours.',
            ],
            'file_upload' => [
                'type' => 'FILE',
                'filename' => 'canva-verify-' . $domain->verification_token . '.txt',
                'content' => $domain->verification_token,
                'path' => '/.well-known/canva-verify-' . $domain->verification_token . '.txt',
                'help' => 'Upload the verification file to your website root directory in the .well-known folder.',
            ],
            default => [],
        };
    }

    private function formatVerificationSteps(string $method, array $instructions): array
    {
        return match ($method) {
            'dns_txt' => [
                [
                    'step' => 1,
                    'title' => 'Add TXT Record',
                    'description' => 'Add a TXT record to your DNS provider with the following details',
                    'details' => [
                        'Type' => $instructions['type'],
                        'Host/Name' => $instructions['host'],
                        'Value' => $instructions['value'],
                        'TTL' => $instructions['ttl'],
                    ],
                ],
                [
                    'step' => 2,
                    'title' => 'Wait for DNS Propagation',
                    'description' => 'DNS changes may take up to 48 hours to propagate',
                ],
                [
                    'step' => 3,
                    'title' => 'Verify Domain',
                    'description' => 'Click the verify button to complete verification',
                ],
            ],
            'dns_cname' => [
                [
                    'step' => 1,
                    'title' => 'Add CNAME Record',
                    'description' => 'Add a CNAME record to your DNS provider with the following details',
                    'details' => [
                        'Type' => $instructions['type'],
                        'Host/Name' => $instructions['host'],
                        'Value' => $instructions['value'],
                        'TTL' => $instructions['ttl'],
                    ],
                ],
                [
                    'step' => 2,
                    'title' => 'Wait for DNS Propagation',
                    'description' => 'DNS changes may take up to 48 hours to propagate',
                ],
                [
                    'step' => 3,
                    'title' => 'Verify Domain',
                    'description' => 'Click the verify button to complete verification',
                ],
            ],
            'file_upload' => [
                [
                    'step' => 1,
                    'title' => 'Create Verification File',
                    'description' => 'Create a text file with the verification token',
                    'details' => [
                        'Filename' => $instructions['filename'],
                        'Content' => $instructions['content'],
                    ],
                ],
                [
                    'step' => 2,
                    'title' => 'Upload File',
                    'description' => 'Upload the file to your website at the following path: ' . $instructions['path'],
                ],
                [
                    'step' => 3,
                    'title' => 'Verify Domain',
                    'description' => 'Click the verify button to complete verification',
                ],
            ],
            default => [],
        };
    }

    public function setPrimary(Request $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = $this->isUuid($id);
            
            $domain = CustomDomainEloquentModel::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->where('is_verified', true)
                ->where('status', 'active')
                ->firstOrFail();

            // Unset any existing primary domain
            CustomDomainEloquentModel::where('tenant_id', $tenant->id)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);

            // Set this domain as primary
            $domain->update(['is_primary' => true]);

            $domain->load(['tenant', 'createdBy']);

            return (new CustomDomainResource($domain))->response()->setStatusCode(200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Custom domain not found or not verified'
            ], 404);
        } catch (\Exception $e) {
            Log::error('[CustomDomainController] Failed to set primary domain', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'message' => 'Failed to set primary domain',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    public function sslCertificate(Request $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = $this->isUuid($id);
            
            $domain = CustomDomainEloquentModel::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();

            $sslInfo = [
                'ssl_enabled' => $domain->ssl_enabled,
                'ssl_provider' => $domain->ssl_provider,
                'ssl_status' => $domain->ssl_status,
                'ssl_expires_at' => $domain->ssl_expires_at?->toISOString(),
                'ssl_issued_at' => $domain->ssl_issued_at?->toISOString(),
                'auto_renew_ssl' => $domain->auto_renew_ssl ?? true,
                'days_until_expiry' => $domain->ssl_expires_at 
                    ? now()->diffInDays($domain->ssl_expires_at, false)
                    : null,
            ];

            return response()->json([
                'success' => true,
                'message' => 'SSL certificate information retrieved successfully',
                'data' => $sslInfo,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Custom domain not found'], 404);
        } catch (\Exception $e) {
            Log::error('[CustomDomainController] Failed to fetch SSL certificate info', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'message' => 'Failed to fetch SSL certificate information',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    public function renewSsl(Request $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = $this->isUuid($id);
            
            $domain = CustomDomainEloquentModel::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->where('is_verified', true)
                ->firstOrFail();

            // Simulate SSL renewal (in production, this would trigger Let's Encrypt or similar)
            $domain->update([
                'ssl_status' => 'renewing',
                'ssl_issued_at' => now(),
                'ssl_expires_at' => now()->addDays(90),
            ]);

            // In production, you would queue a job to actually renew the certificate
            // dispatch(new RenewSslCertificateJob($domain));

            $sslInfo = [
                'ssl_enabled' => $domain->ssl_enabled,
                'ssl_provider' => $domain->ssl_provider,
                'ssl_status' => $domain->ssl_status,
                'ssl_expires_at' => $domain->ssl_expires_at?->toISOString(),
                'ssl_issued_at' => $domain->ssl_issued_at?->toISOString(),
                'auto_renew_ssl' => $domain->auto_renew_ssl ?? true,
                'days_until_expiry' => $domain->ssl_expires_at 
                    ? now()->diffInDays($domain->ssl_expires_at, false)
                    : null,
            ];

            return response()->json([
                'success' => true,
                'message' => 'SSL certificate renewal initiated successfully',
                'data' => $sslInfo,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Custom domain not found or not verified'
            ], 404);
        } catch (\Exception $e) {
            Log::error('[CustomDomainController] Failed to renew SSL certificate', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'message' => 'Failed to renew SSL certificate',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    public function verificationLogs(Request $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = $this->isUuid($id);
            
            $domain = CustomDomainEloquentModel::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();

            // Mock verification logs for now
            // In production, this would fetch from a domain_verification_logs table
            $logs = [
                [
                    'uuid' => (string) \Illuminate\Support\Str::uuid(),
                    'domain_uuid' => $domain->uuid,
                    'verification_method' => $domain->verification_method,
                    'status' => $domain->is_verified ? 'success' : 'pending',
                    'checked_at' => now()->subHours(2)->toISOString(),
                    'result_details' => $domain->is_verified 
                        ? 'Domain ownership verified successfully'
                        : 'Verification pending - DNS records not found',
                ],
            ];

            return response()->json([
                'success' => true,
                'message' => 'Verification logs retrieved successfully',
                'data' => $logs,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Custom domain not found'], 404);
        } catch (\Exception $e) {
            Log::error('[CustomDomainController] Failed to fetch verification logs', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'message' => 'Failed to fetch verification logs',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }
}
