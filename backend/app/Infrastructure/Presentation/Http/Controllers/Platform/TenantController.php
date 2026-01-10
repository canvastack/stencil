<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = TenantEloquentModel::select(['id', 'uuid', 'name', 'slug', 'domain', 'status', 'subscription_status', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tenants->map(function ($tenant) {
                return [
                    'id' => $tenant->uuid,
                    'uuid' => $tenant->uuid,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'domain' => $tenant->domain,
                    'status' => $tenant->status,
                    'subscription_status' => $tenant->subscription_status,
                    'created_at' => $tenant->created_at?->toIso8601String(),
                ];
            })
        ]);
    }

    public function store()
    {
        return response()->json(['message' => 'Tenant creation not implemented yet']);
    }

    public function show($tenant)
    {
        return response()->json(['message' => 'Tenant details not implemented yet']);
    }

    public function update($tenant)
    {
        return response()->json(['message' => 'Tenant update not implemented yet']);
    }

    public function destroy($tenant)
    {
        return response()->json(['message' => 'Tenant deletion not implemented yet']);
    }

    public function activate($tenant)
    {
        return response()->json(['message' => 'Tenant activation not implemented yet']);
    }

    public function suspend($tenant)
    {
        return response()->json(['message' => 'Tenant suspension not implemented yet']);
    }

    public function startTrial($tenant)
    {
        return response()->json(['message' => 'Trial start not implemented yet']);
    }

    public function overview($tenant)
    {
        return response()->json(['message' => 'Tenant overview not implemented yet']);
    }

    public function usersCount($tenant)
    {
        return response()->json(['message' => 'User count not implemented yet']);
    }

    public function usage($tenant)
    {
        return response()->json(['message' => 'Usage stats not implemented yet']);
    }
}