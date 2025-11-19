<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends UserEloquentModel
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\Infrastructure\Persistence\Eloquent\Models\UserFactory::new();
    }
}
