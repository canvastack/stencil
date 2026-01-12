<?php

namespace App\Contracts;

interface PluginInterface
{
    public function getName(): string;
    
    public function getVersion(): string;
    
    public function getDisplayName(): string;
    
    public function getDescription(): string;
    
    public function getAuthor(): string;
    
    public function getRequirements(): array;
    
    public function getDependencies(): array;
    
    public function getMigrations(): array;
    
    public function getSeeders(): array;
    
    public function getPermissions(): array;
    
    public function getRoutes(): array;
    
    public function getServiceProviders(): array;
    
    public function getFrontendModules(): array;
    
    public function install(): bool;
    
    public function uninstall(): bool;
    
    public function enable(): bool;
    
    public function disable(): bool;
}
