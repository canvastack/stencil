<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "CMS Permissions Check\n======================\n\n";

$user = \App\Infrastructure\Persistence\Eloquent\UserEloquentModel::where('email', 'admin@etchinx.com')->first();
echo "User: {$user->email}\n";

setPermissionsTeamId($user->tenant_id);
$user->load('roles');
echo "Roles: " . $user->roles->pluck('name')->implode(', ') . "\n\n";

echo "CMS Permissions:\n";
$allPerms = $user->getAllPermissions();
$cmsPerms = [];
foreach ($allPerms as $p) {
    $name = is_string($p) ? $p : $p->name;
    if (substr($name, 0, 6) === 'pages:') {
        $cmsPerms[] = $name;
        echo "  " . $name . "\n";
    }
}

echo "\nTotal CMS permissions: " . count($cmsPerms) . "\n";
echo "Can view content-types: " . ($user->can('pages:content-types:view') ? 'YES' : 'NO') . "\n\n";
