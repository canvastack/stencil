# 🏗️ PHASE 2 COMPLETE STRUCTURE

**Enhancement Features - File & Folder Organization**

> **Version**: 1.0  
> **Status**: ✅ Architecture Reference  
> **Prerequisites**: Phase 1 Structure Completed  
> **Reference**: See `PHASE1_STRUCTURE.md` for base architecture

---

## 📋 OVERVIEW

This document provides the **complete file and folder structure** for Phase 2 enhancement features:

1. **Menu Management System**
2. **Package Management System**
3. **License Management System**
4. **Dynamic Content Editor**

All structures follow **Hexagonal Architecture** (Ports & Adapters) as defined in `.zencoder/rules`.

---

## 🗂️ COMPLETE BACKEND STRUCTURE

```
backend/
├── src/
│   ├── Domain/                          # Pure business logic (NO Laravel dependencies)
│   │   │
│   │   ├── Menu/                        # Menu Management Domain
│   │   │   ├── Entity/
│   │   │   │   ├── Menu.php
│   │   │   │   └── MenuItem.php
│   │   │   ├── ValueObject/
│   │   │   │   ├── MenuLocation.php     # Enum: header, footer, admin_sidebar, admin_topbar
│   │   │   │   ├── MenuType.php         # Enum: public, admin
│   │   │   │   └── MenuItemType.php     # Enum: internal, external, custom, divider
│   │   │   ├── Repository/
│   │   │   │   ├── MenuRepositoryInterface.php
│   │   │   │   └── MenuItemRepositoryInterface.php
│   │   │   ├── Service/
│   │   │   │   ├── MenuFilterService.php         # Filter menus by permissions
│   │   │   │   └── MenuHierarchyBuilder.php      # Build tree structure
│   │   │   ├── Event/
│   │   │   │   ├── MenuCreated.php
│   │   │   │   ├── MenuUpdated.php
│   │   │   │   ├── MenuDeleted.php
│   │   │   │   └── MenuItemsReordered.php
│   │   │   └── Exception/
│   │   │       ├── CircularMenuException.php
│   │   │       ├── MenuLocationTakenException.php
│   │   │       └── MaxDepthExceededException.php
│   │   │
│   │   ├── Package/                     # Package Management Domain
│   │   │   ├── Entity/
│   │   │   │   ├── Package.php
│   │   │   │   ├── TenantPackage.php
│   │   │   │   ├── PackageVersion.php
│   │   │   │   └── PackageHook.php
│   │   │   ├── ValueObject/
│   │   │   │   ├── PackageSlug.php
│   │   │   │   ├── SemanticVersion.php         # Parse version (1.2.3)
│   │   │   │   ├── PackageStatus.php           # Enum: installing, active, inactive, updating, failed
│   │   │   │   └── PackageCategory.php         # Enum: business-module, payment-gateway, communication, theme
│   │   │   ├── Repository/
│   │   │   │   ├── PackageRepositoryInterface.php
│   │   │   │   ├── TenantPackageRepositoryInterface.php
│   │   │   │   └── PackageVersionRepositoryInterface.php
│   │   │   ├── Service/
│   │   │   │   ├── PackageCompatibilityService.php    # Check version compatibility
│   │   │   │   ├── PackageHookService.php             # Register/execute hooks
│   │   │   │   ├── PackageDependencyResolver.php      # Resolve dependencies
│   │   │   │   └── PackageSecurityScanner.php         # Scan for malicious code
│   │   │   ├── Event/
│   │   │   │   ├── PackageInstalled.php
│   │   │   │   ├── PackageUpdated.php
│   │   │   │   ├── PackageUninstalled.php
│   │   │   │   └── PackageActivated.php
│   │   │   └── Exception/
│   │   │       ├── PackageNotFoundException.php
│   │   │       ├── IncompatiblePackageException.php
│   │   │       ├── PackageInstallationFailedException.php
│   │   │       └── MaliciousPackageException.php
│   │   │
│   │   ├── License/                     # License Management Domain
│   │   │   ├── Entity/
│   │   │   │   ├── License.php
│   │   │   │   └── LicenseActivation.php
│   │   │   ├── ValueObject/
│   │   │   │   ├── LicenseKey.php              # Encrypted license key
│   │   │   │   ├── LicenseType.php             # Enum: free, per-tenant, per-user, lifetime
│   │   │   │   └── ActivationLimit.php
│   │   │   ├── Repository/
│   │   │   │   ├── LicenseRepositoryInterface.php
│   │   │   │   └── LicenseActivationRepositoryInterface.php
│   │   │   ├── Service/
│   │   │   │   ├── LicenseKeyGenerator.php     # Generate unique keys
│   │   │   │   ├── LicenseValidationService.php # Online/offline validation
│   │   │   │   └── LicenseEncryptionService.php # Encrypt/decrypt keys
│   │   │   ├── Event/
│   │   │   │   ├── LicenseGenerated.php
│   │   │   │   ├── LicenseActivated.php
│   │   │   │   ├── LicenseExpired.php
│   │   │   │   └── LicenseRevoked.php
│   │   │   └── Exception/
│   │   │       ├── InvalidLicenseKeyException.php
│   │   │       ├── LicenseExpiredException.php
│   │   │       ├── MaxActivationsReachedException.php
│   │   │       └── LicenseRevokedException.php
│   │   │
│   │   ├── Content/                     # Dynamic Content Editor Domain
│   │   │   ├── Entity/
│   │   │   │   ├── Page.php
│   │   │   │   ├── PageRevision.php
│   │   │   │   └── PageTemplate.php
│   │   │   ├── ValueObject/
│   │   │   │   ├── PageSlug.php                # Unique slug per tenant
│   │   │   │   ├── PageStatus.php              # Enum: draft, published, archived
│   │   │   │   ├── PageContent.php             # GrapesJS JSON content
│   │   │   │   └── RevisionNumber.php
│   │   │   ├── Repository/
│   │   │   │   ├── PageRepositoryInterface.php
│   │   │   │   ├── PageRevisionRepositoryInterface.php
│   │   │   │   └── PageTemplateRepositoryInterface.php
│   │   │   ├── Service/
│   │   │   │   ├── PageSlugGenerator.php       # Generate unique slugs
│   │   │   │   ├── ContentSanitizer.php        # Sanitize HTML (XSS prevention)
│   │   │   │   └── RevisionManager.php         # Manage page versions
│   │   │   ├── Event/
│   │   │   │   ├── PageCreated.php
│   │   │   │   ├── PagePublished.php
│   │   │   │   ├── PageUnpublished.php
│   │   │   │   └── RevisionCreated.php
│   │   │   └── Exception/
│   │   │       ├── PageSlugTakenException.php
│   │   │       ├── PageNotFoundException.php
│   │   │       └── RevisionNotFoundException.php
│   │   │
│   ├── Application/                     # Use Cases (Application Services)
│   │   │
│   │   ├── Menu/
│   │   │   ├── Command/                 # Write operations (Commands)
│   │   │   │   ├── CreateMenuCommand.php
│   │   │   │   ├── UpdateMenuCommand.php
│   │   │   │   ├── DeleteMenuCommand.php
│   │   │   │   ├── CreateMenuItemCommand.php
│   │   │   │   ├── UpdateMenuItemCommand.php
│   │   │   │   ├── ReorderMenuItemsCommand.php
│   │   │   │   └── DeleteMenuItemCommand.php
│   │   │   ├── Query/                   # Read operations (Queries)
│   │   │   │   ├── GetMenuByIdQuery.php
│   │   │   │   ├── GetMenuByLocationQuery.php
│   │   │   │   ├── GetMenusForTenantQuery.php
│   │   │   │   └── FilterMenuByPermissionsQuery.php
│   │   │   ├── UseCase/
│   │   │   │   ├── CreateMenuUseCase.php
│   │   │   │   ├── UpdateMenuUseCase.php
│   │   │   │   ├── DeleteMenuUseCase.php
│   │   │   │   ├── CreateMenuItemUseCase.php
│   │   │   │   ├── UpdateMenuItemUseCase.php
│   │   │   │   ├── ReorderMenuItemsUseCase.php
│   │   │   │   ├── DeleteMenuItemUseCase.php
│   │   │   │   └── FilterMenuByPermissionsUseCase.php
│   │   │   └── DTO/                     # Data Transfer Objects
│   │   │       ├── MenuDto.php
│   │   │       └── MenuItemDto.php
│   │   │
│   │   ├── Package/
│   │   │   ├── Command/
│   │   │   │   ├── InstallPackageCommand.php
│   │   │   │   ├── UpdatePackageCommand.php
│   │   │   │   ├── UninstallPackageCommand.php
│   │   │   │   ├── ActivatePackageCommand.php
│   │   │   │   └── DeactivatePackageCommand.php
│   │   │   ├── Query/
│   │   │   │   ├── GetPackageBySlugQuery.php
│   │   │   │   ├── GetInstalledPackagesQuery.php
│   │   │   │   ├── SearchPackagesQuery.php
│   │   │   │   └── GetPackagesByCategory.php
│   │   │   ├── UseCase/
│   │   │   │   ├── InstallPackageUseCase.php
│   │   │   │   ├── UpdatePackageUseCase.php
│   │   │   │   ├── UninstallPackageUseCase.php
│   │   │   │   ├── ActivatePackageUseCase.php
│   │   │   │   ├── DeactivatePackageUseCase.php
│   │   │   │   └── ScanPackageSecurityUseCase.php
│   │   │   └── DTO/
│   │   │       ├── PackageDto.php
│   │   │       └── TenantPackageDto.php
│   │   │
│   │   ├── License/
│   │   │   ├── Command/
│   │   │   │   ├── GenerateLicenseCommand.php
│   │   │   │   ├── ActivateLicenseCommand.php
│   │   │   │   ├── RevokeLicenseCommand.php
│   │   │   │   └── ValidateLicenseCommand.php
│   │   │   ├── Query/
│   │   │   │   ├── GetLicenseByKeyQuery.php
│   │   │   │   ├── GetLicensesForPackageQuery.php
│   │   │   │   └── GetActivationsForLicenseQuery.php
│   │   │   ├── UseCase/
│   │   │   │   ├── GenerateLicenseUseCase.php
│   │   │   │   ├── ActivateLicenseUseCase.php
│   │   │   │   ├── ValidateLicenseUseCase.php
│   │   │   │   └── RevokeLicenseUseCase.php
│   │   │   └── DTO/
│   │   │       ├── LicenseDto.php
│   │   │       └── LicenseActivationDto.php
│   │   │
│   │   ├── Content/
│   │   │   ├── Command/
│   │   │   │   ├── CreatePageCommand.php
│   │   │   │   ├── UpdatePageCommand.php
│   │   │   │   ├── PublishPageCommand.php
│   │   │   │   ├── UnpublishPageCommand.php
│   │   │   │   ├── DeletePageCommand.php
│   │   │   │   └── RestoreRevisionCommand.php
│   │   │   ├── Query/
│   │   │   │   ├── GetPageByIdQuery.php
│   │   │   │   ├── GetPageBySlugQuery.php
│   │   │   │   ├── GetPagesForTenantQuery.php
│   │   │   │   ├── GetPageRevisionsQuery.php
│   │   │   │   └── GetPageTemplatesQuery.php
│   │   │   ├── UseCase/
│   │   │   │   ├── CreatePageUseCase.php
│   │   │   │   ├── UpdatePageUseCase.php
│   │   │   │   ├── PublishPageUseCase.php
│   │   │   │   ├── UnpublishPageUseCase.php
│   │   │   │   ├── DeletePageUseCase.php
│   │   │   │   ├── CreateRevisionUseCase.php
│   │   │   │   └── RestoreRevisionUseCase.php
│   │   │   └── DTO/
│   │   │       ├── PageDto.php
│   │   │       ├── PageRevisionDto.php
│   │   │       └── PageTemplateDto.php
│   │   │
│   ├── Infrastructure/                  # Implementation details (Laravel dependencies)
│   │   │
│   │   ├── Persistence/Eloquent/
│   │   │   ├── Model/
│   │   │   │   ├── MenuModel.php
│   │   │   │   ├── MenuItemModel.php
│   │   │   │   ├── PackageModel.php
│   │   │   │   ├── TenantPackageModel.php
│   │   │   │   ├── PackageVersionModel.php
│   │   │   │   ├── LicenseModel.php
│   │   │   │   ├── LicenseActivationModel.php
│   │   │   │   ├── PageModel.php
│   │   │   │   ├── PageRevisionModel.php
│   │   │   │   └── PageTemplateModel.php
│   │   │   │
│   │   │   └── Repository/
│   │   │       ├── EloquentMenuRepository.php
│   │   │       ├── EloquentMenuItemRepository.php
│   │   │       ├── EloquentPackageRepository.php
│   │   │       ├── EloquentTenantPackageRepository.php
│   │   │       ├── EloquentLicenseRepository.php
│   │   │       ├── EloquentLicenseActivationRepository.php
│   │   │       ├── EloquentPageRepository.php
│   │   │       ├── EloquentPageRevisionRepository.php
│   │   │       └── EloquentPageTemplateRepository.php
│   │   │
│   │   ├── Presentation/Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Menu/
│   │   │   │   │   ├── MenuController.php
│   │   │   │   │   ├── MenuItemController.php
│   │   │   │   │   └── PublicMenuController.php
│   │   │   │   ├── Package/
│   │   │   │   │   ├── PackageController.php
│   │   │   │   │   ├── TenantPackageController.php
│   │   │   │   │   └── MarketplaceController.php
│   │   │   │   ├── License/
│   │   │   │   │   ├── LicenseController.php
│   │   │   │   │   └── LicenseActivationController.php
│   │   │   │   └── Content/
│   │   │   │       ├── PageController.php
│   │   │   │       ├── PageRevisionController.php
│   │   │   │       └── PageTemplateController.php
│   │   │   │
│   │   │   ├── Resources/
│   │   │   │   ├── MenuResource.php
│   │   │   │   ├── MenuItemResource.php
│   │   │   │   ├── MenuTreeResource.php
│   │   │   │   ├── PackageResource.php
│   │   │   │   ├── TenantPackageResource.php
│   │   │   │   ├── LicenseResource.php
│   │   │   │   ├── PageResource.php
│   │   │   │   └── PageRevisionResource.php
│   │   │   │
│   │   │   ├── Requests/
│   │   │   │   ├── Menu/
│   │   │   │   │   ├── CreateMenuRequest.php
│   │   │   │   │   ├── UpdateMenuRequest.php
│   │   │   │   │   ├── CreateMenuItemRequest.php
│   │   │   │   │   └── ReorderMenuItemsRequest.php
│   │   │   │   ├── Package/
│   │   │   │   │   ├── InstallPackageRequest.php
│   │   │   │   │   └── UpdatePackageRequest.php
│   │   │   │   ├── License/
│   │   │   │   │   ├── GenerateLicenseRequest.php
│   │   │   │   │   └── ActivateLicenseRequest.php
│   │   │   │   └── Content/
│   │   │   │       ├── CreatePageRequest.php
│   │   │   │       ├── UpdatePageRequest.php
│   │   │   │       └── PublishPageRequest.php
│   │   │   │
│   │   │   └── Middleware/
│   │   │       ├── CheckPackageLicense.php
│   │   │       └── ValidatePackagePermissions.php
│   │   │
│   │   ├── Adapters/
│   │   │   ├── Package/
│   │   │   │   ├── PackageInstallerAdapter.php      # Handles ZIP extraction, migrations
│   │   │   │   ├── PackageRegistryAdapter.php       # Fetches packages from registry
│   │   │   │   └── PackageHookExecutor.php          # Executes package hooks
│   │   │   └── License/
│   │   │       └── LicenseServerAdapter.php         # Online license validation
│   │   │
│   │   └── Cache/
│   │       ├── MenuCacheService.php                 # Redis caching for menus
│   │       └── LicenseCacheService.php              # Cache license validation results
│   │
│   └── Providers/
│       ├── MenuServiceProvider.php                  # Bind Menu repositories
│       ├── PackageServiceProvider.php               # Bind Package repositories  
│       ├── LicenseServiceProvider.php               # Bind License repositories
│       └── ContentServiceProvider.php               # Bind Content repositories
│
├── database/
│   ├── migrations/
│   │   ├── 2024_XX_XX_000001_create_menus_table.php
│   │   ├── 2024_XX_XX_000002_create_menu_items_table.php
│   │   ├── 2024_XX_XX_000003_create_packages_table.php
│   │   ├── 2024_XX_XX_000004_create_tenant_packages_table.php
│   │   ├── 2024_XX_XX_000005_create_package_versions_table.php
│   │   ├── 2024_XX_XX_000006_create_package_hooks_table.php
│   │   ├── 2024_XX_XX_000007_create_licenses_table.php
│   │   ├── 2024_XX_XX_000008_create_license_activations_table.php
│   │   ├── 2024_XX_XX_000009_create_pages_table.php
│   │   ├── 2024_XX_XX_000010_create_page_revisions_table.php
│   │   └── 2024_XX_XX_000011_create_page_templates_table.php
│   │
│   └── seeders/
│       ├── DefaultMenuSeeder.php                    # Seed default admin sidebar menu
│       ├── OfficialPackagesSeeder.php               # Seed official packages (Finance, etc.)
│       └── PageTemplatesSeeder.php                  # Seed default page templates
│
├── routes/
│   └── api.php                                      # Phase 2 API routes
│       # Menu Management Routes
│       # /api/v1/admin/menus/*
│       # /api/v1/menus/location/{location}
│       #
│       # Package Management Routes
│       # /api/v1/admin/packages/*
│       # /api/v1/marketplace/packages/*
│       #
│       # License Management Routes
│       # /api/v1/admin/licenses/*
│       # /api/v1/licenses/activate
│       #
│       # Content Editor Routes
│       # /api/v1/admin/pages/*
│       # /api/v1/pages/{slug}
│
├── tests/
│   ├── Unit/
│   │   ├── Domain/
│   │   │   ├── Menu/
│   │   │   │   ├── MenuTest.php
│   │   │   │   ├── MenuItemTest.php
│   │   │   │   └── MenuFilterServiceTest.php
│   │   │   ├── Package/
│   │   │   │   ├── PackageTest.php
│   │   │   │   ├── SemanticVersionTest.php
│   │   │   │   └── PackageDependencyResolverTest.php
│   │   │   ├── License/
│   │   │   │   ├── LicenseTest.php
│   │   │   │   ├── LicenseKeyGeneratorTest.php
│   │   │   │   └── LicenseValidationServiceTest.php
│   │   │   └── Content/
│   │   │       ├── PageTest.php
│   │   │       ├── PageRevisionTest.php
│   │   │       └── ContentSanitizerTest.php
│   │   │
│   │   └── Application/
│   │       ├── Menu/
│   │       │   ├── CreateMenuUseCaseTest.php
│   │       │   └── ReorderMenuItemsUseCaseTest.php
│   │       ├── Package/
│   │       │   ├── InstallPackageUseCaseTest.php
│   │       │   └── ScanPackageSecurityUseCaseTest.php
│   │       ├── License/
│   │       │   ├── GenerateLicenseUseCaseTest.php
│   │       │   └── ActivateLicenseUseCaseTest.php
│   │       └── Content/
│   │           ├── CreatePageUseCaseTest.php
│   │           └── RestoreRevisionUseCaseTest.php
│   │
│   └── Feature/
│       ├── Menu/
│       │   ├── MenuApiTest.php
│       │   ├── MenuItemApiTest.php
│       │   └── MenuPermissionFilterTest.php
│       ├── Package/
│       │   ├── PackageInstallationTest.php
│       │   ├── PackageUpdateTest.php
│       │   └── PackageSecurityTest.php
│       ├── License/
│       │   ├── LicenseActivationTest.php
│       │   ├── LicenseValidationTest.php
│       │   └── LicenseExpirationTest.php
│       └── Content/
│           ├── PageApiTest.php
│           ├── PagePublishTest.php
│           └── RevisionRestoreTest.php
│
├── packages/                                         # Installed packages directory
│   ├── finance-reporting/                           # First official package
│   │   ├── composer.json                            # Package manifest
│   │   ├── package.json                             # Frontend dependencies
│   │   ├── backend/
│   │   │   ├── Domain/
│   │   │   ├── Application/
│   │   │   ├── Infrastructure/
│   │   │   ├── routes/
│   │   │   │   └── api.php
│   │   │   └── database/
│   │   │       └── migrations/
│   │   ├── frontend/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── index.tsx
│   │   ├── config/
│   │   │   └── finance.php
│   │   └── tests/
│   │
│   └── [other-packages]/
│
└── docs/
    └── api/
        └── openapi-phase2.yaml                      # OpenAPI 3.0 spec for Phase 2 APIs
```

---

## 🎨 COMPLETE FRONTEND STRUCTURE

```
frontend/
├── src/
│   ├── features/                                     # Feature-based modules
│   │   │
│   │   ├── menu/                                    # Menu Management Feature
│   │   │   ├── components/
│   │   │   │   ├── MenuBuilder.tsx                  # Main menu builder
│   │   │   │   ├── MenuEditor.tsx                   # Drag & Drop editor
│   │   │   │   ├── MenuItemForm.tsx                 # Add/Edit form
│   │   │   │   ├── MenuItemRow.tsx                  # Draggable row
│   │   │   │   ├── IconPicker.tsx                   # Icon selection modal
│   │   │   │   ├── PermissionSelector.tsx           # Permission selector
│   │   │   │   └── MenuPreview.tsx                  # Live preview
│   │   │   ├── hooks/
│   │   │   │   ├── useMenus.ts                      # Fetch all menus
│   │   │   │   ├── useMenu.ts                       # Fetch single menu
│   │   │   │   ├── useCreateMenu.ts                 # Create menu mutation
│   │   │   │   ├── useUpdateMenu.ts                 # Update menu mutation
│   │   │   │   ├── useDeleteMenu.ts                 # Delete menu mutation
│   │   │   │   ├── useCreateMenuItem.ts             # Create item mutation
│   │   │   │   ├── useReorderMenuItems.ts           # Reorder mutation
│   │   │   │   └── useDeleteMenuItem.ts             # Delete item mutation
│   │   │   ├── types/
│   │   │   │   ├── menu.ts                          # Menu type definitions
│   │   │   │   └── menuItem.ts                      # MenuItem type definitions
│   │   │   └── menuSlice.ts                         # Redux Toolkit slice
│   │   │
│   │   ├── package-marketplace/                     # Package Management Feature
│   │   │   ├── components/
│   │   │   │   ├── PackageList.tsx                  # Browse packages
│   │   │   │   ├── PackageCard.tsx                  # Package preview card
│   │   │   │   ├── PackageDetail.tsx                # Package detail modal
│   │   │   │   ├── PackageInstaller.tsx             # Installation wizard
│   │   │   │   ├── InstalledPackages.tsx            # Manage installed
│   │   │   │   └── PackageSettings.tsx              # Package configuration
│   │   │   ├── hooks/
│   │   │   │   ├── usePackages.ts                   # Browse all packages
│   │   │   │   ├── useInstalledPackages.ts          # Installed packages
│   │   │   │   ├── useInstallPackage.ts             # Install mutation
│   │   │   │   ├── useUpdatePackage.ts              # Update mutation
│   │   │   │   └── useUninstallPackage.ts           # Uninstall mutation
│   │   │   ├── types/
│   │   │   │   ├── package.ts
│   │   │   │   └── tenantPackage.ts
│   │   │   └── packageSlice.ts                      # Redux Toolkit slice
│   │   │
│   │   ├── license/                                 # License Management Feature
│   │   │   ├── components/
│   │   │   │   ├── LicenseActivationForm.tsx        # Activate license
│   │   │   │   ├── LicenseStatus.tsx                # Show license status
│   │   │   │   ├── LicenseList.tsx                  # List all licenses
│   │   │   │   └── ExpirationWarning.tsx            # Expiration notice
│   │   │   ├── hooks/
│   │   │   │   ├── useLicenses.ts
│   │   │   │   ├── useActivateLicense.ts
│   │   │   │   └── useValidateLicense.ts
│   │   │   ├── types/
│   │   │   │   └── license.ts
│   │   │   └── licenseSlice.ts
│   │   │
│   │   └── content-editor/                          # Dynamic Content Editor Feature
│   │       ├── components/
│   │       │   ├── PageEditor.tsx                   # Main editor (GrapesJS)
│   │       │   ├── PageList.tsx                     # List all pages
│   │       │   ├── PageForm.tsx                     # Create/edit page
│   │       │   ├── RevisionHistory.tsx              # Version history
│   │       │   ├── TemplateSelector.tsx             # Template browser
│   │       │   └── ComponentLibrary.tsx             # Custom components
│   │       ├── hooks/
│   │       │   ├── usePages.ts
│   │       │   ├── usePage.ts
│   │       │   ├── useCreatePage.ts
│   │       │   ├── useUpdatePage.ts
│   │       │   ├── usePublishPage.ts
│   │       │   └── useRevisions.ts
│   │       ├── grapesjs/
│   │       │   ├── grapesjsConfig.ts                # GrapesJS configuration
│   │       │   ├── customBlocks.ts                  # Custom block definitions
│   │       │   └── customComponents.ts              # Custom component definitions
│   │       ├── types/
│   │       │   ├── page.ts
│   │       │   ├── pageRevision.ts
│   │       │   └── pageTemplate.ts
│   │       └── contentSlice.ts
│   │
│   ├── pages/admin/                                  # Admin pages
│   │   ├── Menus/
│   │   │   ├── index.tsx                            # List menus
│   │   │   └── Editor.tsx                           # Menu editor page
│   │   ├── Packages/
│   │   │   ├── Marketplace.tsx                      # Browse marketplace
│   │   │   ├── Installed.tsx                        # Installed packages
│   │   │   └── Detail.tsx                           # Package detail page
│   │   ├── Licenses/
│   │   │   ├── index.tsx                            # List licenses
│   │   │   └── Activate.tsx                         # Activate license page
│   │   └── Pages/
│   │       ├── index.tsx                            # List pages
│   │       ├── Create.tsx                           # Create page
│   │       └── Edit.tsx                             # Edit page with GrapesJS
│   │
│   ├── components/
│   │   └── ui/                                      # shadcn-ui components (existing from Phase 1)
│   │       └── [button, input, select, etc.]
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── menuApi.ts                           # Menu API client
│   │   │   ├── packageApi.ts                        # Package API client
│   │   │   ├── licenseApi.ts                        # License API client
│   │   │   └── contentApi.ts                        # Content API client
│   │   │
│   │   └── utils/
│   │       ├── menuHelpers.ts                       # Menu utility functions
│   │       └── packageHelpers.ts                    # Package utility functions
│   │
│   ├── types/
│   │   ├── api/
│   │   │   ├── menu.ts                              # API response types
│   │   │   ├── package.ts
│   │   │   ├── license.ts
│   │   │   └── content.ts
│   │   │
│   │   └── global.d.ts                              # Global type definitions
│   │
│   └── store/
│       └── index.ts                                 # Redux store (Phase 1 + Phase 2 slices)
│
└── package.json
    # New dependencies for Phase 2:
    # - react-beautiful-dnd (Drag & Drop for menus)
    # - grapesjs (Visual editor)
    # - grapesjs-react (React wrapper for GrapesJS)
```

---

## 🔗 INTEGRATION WITH PHASE 1

### **Backend Integration**

**Phase 1 Modules** (DO NOT MODIFY):
- `src/Domain/Product/`
- `src/Domain/Customer/`
- `src/Domain/Vendor/`
- `src/Domain/Order/`
- `src/Domain/Invoice/`
- `src/Domain/Payment/`

**Phase 2 Modules** (NEW):
- `src/Domain/Menu/`
- `src/Domain/Package/`
- `src/Domain/License/`
- `src/Domain/Content/`

**Shared Infrastructure** (EXTEND, don't replace):
- `src/Infrastructure/Persistence/Eloquent/` - Add new models & repositories
- `src/Infrastructure/Presentation/Http/Controllers/` - Add new controllers
- `routes/api.php` - Add new routes (keep existing Phase 1 routes)

### **Frontend Integration**

**Phase 1 Components** (REUSE):
- `src/components/ui/*` - shadcn-ui components
- `src/components/layout/*` - AdminLayout, Sidebar (will be enhanced with Menu Management)
- `src/lib/api/client.ts` - API client (reuse for Phase 2)

**Phase 2 Enhancements**:
- `src/components/layout/Sidebar.tsx` - Enhanced to use Menu Management API
- `src/pages/admin/Settings.tsx` - Add tabs for Package & License management

---

## 📦 PACKAGE STRUCTURE SPECIFICATION

Every package MUST follow this structure:

```
packages/{package-slug}/
├── composer.json                    # Required: Package manifest
├── package.json                     # Required if has frontend components
├── README.md                        # Required: Package documentation
├── LICENSE.md                       # Required: License type
├── backend/
│   ├── Domain/                      # Package business logic
│   ├── Application/                 # Package use cases
│   ├── Infrastructure/              # Package implementations
│   ├── routes/
│   │   └── api.php                  # Package API routes
│   └── database/
│       ├── migrations/              # Package migrations
│       └── seeders/                 # Package seeders
├── frontend/
│   ├── components/                  # Package React components
│   ├── pages/                       # Package pages
│   ├── hooks/                       # Package hooks
│   └── index.tsx                    # Package entry point
├── config/
│   └── {package}.php                # Package configuration
├── assets/
│   ├── images/
│   └── styles/
└── tests/
    ├── Unit/
    └── Feature/
```

**composer.json Example**:
```json
{
  "name": "stencil/finance-reporting",
  "type": "stencil-package",
  "extra": {
    "stencil": {
      "requires-license": true,
      "compatible-versions": ["2.0", "2.1"],
      "hooks": [
        {
          "event": "order.completed",
          "handler": "FinanceReporting\\\\Listeners\\\\RecordRevenue"
        }
      ],
      "menu-items": [
        {
          "title": "Financial Reports",
          "url": "/admin/finance",
          "icon": "DollarSign",
          "permissions": ["view_finance"]
        }
      ]
    }
  }
}
```

---

## 🧪 TESTING STRUCTURE

```
tests/
├── Unit/                                # 100% coverage required
│   ├── Domain/                          # Test all entities, value objects, services
│   └── Application/                     # Test all use cases
│
├── Feature/                             # 90%+ coverage required
│   ├── Menu/                            # API endpoint tests
│   ├── Package/
│   ├── License/
│   └── Content/
│
└── Integration/                         # End-to-end flows
    ├── MenuManagementFlowTest.php       # Create → Edit → Reorder → Preview
    ├── PackageInstallationFlowTest.php  # Browse → Install → Activate → Configure
    ├── LicenseActivationFlowTest.php    # Generate → Activate → Validate
    └── ContentPublishingFlowTest.php    # Create → Edit → Publish → View
```

---

## 🔐 SECURITY CONSIDERATIONS

### **Package Sandboxing**

Packages MUST be sandboxed to prevent:
- Unauthorized file system access
- Direct database queries outside package schema
- Accessing other tenant data

**Implementation**:
```php
class PackageSandbox
{
    public function execute(Package $package, callable $code)
    {
        $allowedPaths = [
            storage_path('app/packages/' . $package->slug),
            public_path('packages/' . $package->slug),
        ];
        
        $disallowedFunctions = ['eval', 'exec', 'system', 'shell_exec'];
    }
}
```

### **License Validation Caching**

**DO**:
- Cache validation results for 1 hour
- Validate on package activation
- Background job for daily validation

**DON'T**:
- Validate on every request (performance issue)
- Store unencrypted license keys

---

## 📐 NAMING CONVENTIONS

### **Backend (PHP)**

Follow PSR-12 + Domain-Driven Design:
- **Entities**: Singular noun - `Menu`, `Package`, `License`
- **Value Objects**: Descriptive name - `MenuLocation`, `SemanticVersion`
- **Services**: Action + Service - `MenuFilterService`, `LicenseKeyGenerator`
- **Use Cases**: Verb + Noun + UseCase - `CreateMenuUseCase`
- **Events**: Past tense - `MenuCreated`, `PackageInstalled`

### **Frontend (TypeScript)**

Follow React best practices:
- **Components**: PascalCase - `MenuBuilder`, `PackageCard`
- **Hooks**: camelCase with `use` prefix - `useMenus`, `useInstallPackage`
- **Types**: PascalCase - `Menu`, `MenuItem`, `Package`
- **Functions**: camelCase - `reorderMenuItems`, `validateLicense`

---

## ✅ STRUCTURE VERIFICATION CHECKLIST

Before starting development, verify:

- [ ] Phase 1 structure exists and is intact
- [ ] Domain folders created for all 4 features
- [ ] Application folders created for all 4 features
- [ ] Infrastructure folders created for all 4 features
- [ ] Migration files created for all new tables
- [ ] API routes planned for all endpoints
- [ ] Frontend feature folders created
- [ ] Test folders created matching structure
- [ ] Package directory structure defined
- [ ] OpenAPI spec file created

---

**Document Version:** 1.0  
**Created:** November 2025  
**Last Updated:** November 2025  
**Status:** ✅ Architecture Reference Ready

**Related Documents:**
- `PHASE1_STRUCTURE.md` - Base structure reference
- `PHASE2_COMPLETE_ROADMAP.md` - Development timeline
- `.zencoder/rules` - Architecture rules (MUST FOLLOW)

---

**END OF PHASE 2 STRUCTURE**