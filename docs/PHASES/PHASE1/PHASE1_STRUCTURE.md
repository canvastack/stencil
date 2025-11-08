# 📂 Phase 1: Complete Backend & OpenAPI Structure

> **Detailed File & Folder Organization**  
> **Companion Document to**: PHASE1_COMPLETE_ROADMAP.md

---

## 🏗️ **COMPLETE BACKEND STRUCTURE**

```
backend/
├── app/
│   ├── Domain/                              # 🔵 PURE BUSINESS LOGIC (No Laravel!)
│   │   │
│   │   ├── Shared/                          # Shared across all domains
│   │   │   ├── ValueObject/
│   │   │   │   ├── Money.php                # Immutable money value object
│   │   │   │   ├── Email.php                # Email validation VO
│   │   │   │   ├── PhoneNumber.php         # Phone number VO
│   │   │   │   └── Address.php              # Address VO
│   │   │   ├── Contract/
│   │   │   │   └── RepositoryInterface.php  # Base repository interface
│   │   │   └── Exception/
│   │   │       ├── DomainException.php
│   │   │       └── ValidationException.php
│   │   │
│   │   ├── Order/                           # Order Management Context
│   │   │   ├── Entity/
│   │   │   │   ├── PurchaseOrder.php
│   │   │   │   ├── OrderItem.php
│   │   │   │   └── OrderQuote.php
│   │   │   ├── ValueObject/
│   │   │   │   ├── OrderCode.php
│   │   │   │   ├── OrderDetails.php
│   │   │   │   └── PaymentTerms.php
│   │   │   ├── Enum/
│   │   │   │   ├── OrderStatus.php
│   │   │   │   ├── ProductionType.php
│   │   │   │   ├── PaymentMethod.php
│   │   │   │   └── PaymentType.php
│   │   │   ├── Repository/
│   │   │   │   ├── PurchaseOrderRepositoryInterface.php
│   │   │   │   └── OrderQuoteRepositoryInterface.php
│   │   │   ├── Service/
│   │   │   │   ├── PriceCalculatorService.php
│   │   │   │   ├── OrderCodeGeneratorService.php
│   │   │   │   └── OrderStatusManager.php
│   │   │   ├── Event/
│   │   │   │   ├── PurchaseOrderCreated.php
│   │   │   │   ├── OrderStatusChanged.php
│   │   │   │   ├── VendorAssigned.php
│   │   │   │   └── PaymentReceived.php
│   │   │   └── Exception/
│   │   │       ├── InvalidOrderStateException.php
│   │   │       ├── InvalidOrderTransitionException.php
│   │   │       └── OrderNotFoundException.php
│   │   │
│   │   ├── Product/                         # Product Catalog Context
│   │   │   ├── Entity/
│   │   │   │   ├── Product.php
│   │   │   │   └── ProductCategory.php
│   │   │   ├── ValueObject/
│   │   │   │   └── ProductSpecifications.php
│   │   │   ├── Repository/
│   │   │   │   └── ProductRepositoryInterface.php
│   │   │   ├── Service/
│   │   │   │   └── ProductService.php
│   │   │   └── Exception/
│   │   │       └── ProductNotFoundException.php
│   │   │
│   │   ├── Customer/                        # Customer Management Context
│   │   │   ├── Entity/
│   │   │   │   └── Customer.php
│   │   │   ├── Repository/
│   │   │   │   └── CustomerRepositoryInterface.php
│   │   │   └── Exception/
│   │   │       └── CustomerNotFoundException.php
│   │   │
│   │   ├── Vendor/                          # Vendor Management Context
│   │   │   ├── Entity/
│   │   │   │   └── Vendor.php
│   │   │   ├── ValueObject/
│   │   │   │   ├── Specializations.php
│   │   │   │   └── BankDetails.php
│   │   │   ├── Repository/
│   │   │   │   └── VendorRepositoryInterface.php
│   │   │   └── Exception/
│   │   │       └── VendorNotFoundException.php
│   │   │
│   │   └── Financial/                       # Financial/Accounting Context
│   │       ├── Entity/
│   │       │   ├── Invoice.php
│   │       │   └── Payment.php
│   │       ├── Enum/
│   │       │   └── InvoiceStatus.php
│   │       ├── Repository/
│   │       │   ├── InvoiceRepositoryInterface.php
│   │       │   └── PaymentRepositoryInterface.php
│   │       └── Service/
│   │           └── InvoiceGeneratorService.php
│   │
│   ├── Application/                         # 🟢 USE CASES (Orchestration)
│   │   │
│   │   ├── Order/
│   │   │   ├── Command/                     # Write operations
│   │   │   │   ├── CreatePurchaseOrderCommand.php
│   │   │   │   ├── AssignVendorCommand.php
│   │   │   │   ├── NegotiateWithVendorCommand.php
│   │   │   │   ├── CreateCustomerQuotationCommand.php
│   │   │   │   ├── UpdateOrderStatusCommand.php
│   │   │   │   └── VerifyPaymentCommand.php
│   │   │   │
│   │   │   ├── Query/                       # Read operations
│   │   │   │   ├── GetPurchaseOrderQuery.php
│   │   │   │   ├── ListOrdersQuery.php
│   │   │   │   └── GetOrderStatisticsQuery.php
│   │   │   │
│   │   │   ├── UseCase/
│   │   │   │   ├── CreatePurchaseOrderUseCase.php
│   │   │   │   ├── AssignVendorToOrderUseCase.php
│   │   │   │   ├── NegotiateWithVendorUseCase.php
│   │   │   │   ├── CreateCustomerQuotationUseCase.php
│   │   │   │   ├── HandleCustomerApprovalUseCase.php
│   │   │   │   ├── VerifyCustomerPaymentUseCase.php
│   │   │   │   ├── ProcessVendorPaymentUseCase.php
│   │   │   │   ├── UpdateProductionStatusUseCase.php
│   │   │   │   └── CompleteOrderUseCase.php
│   │   │   │
│   │   │   └── DTO/
│   │   │       ├── OrderDTO.php
│   │   │       ├── OrderListDTO.php
│   │   │       └── OrderStatisticsDTO.php
│   │   │
│   │   ├── Product/
│   │   │   ├── Command/
│   │   │   │   ├── CreateProductCommand.php
│   │   │   │   ├── UpdateProductCommand.php
│   │   │   │   └── DeleteProductCommand.php
│   │   │   ├── Query/
│   │   │   │   ├── GetProductQuery.php
│   │   │   │   └── ListProductsQuery.php
│   │   │   ├── UseCase/
│   │   │   │   ├── CreateProductUseCase.php
│   │   │   │   ├── UpdateProductUseCase.php
│   │   │   │   └── DeleteProductUseCase.php
│   │   │   └── DTO/
│   │   │       └── ProductDTO.php
│   │   │
│   │   ├── Customer/
│   │   │   ├── Command/
│   │   │   │   └── RegisterCustomerCommand.php
│   │   │   ├── UseCase/
│   │   │   │   └── RegisterCustomerUseCase.php
│   │   │   └── DTO/
│   │   │       └── CustomerDTO.php
│   │   │
│   │   └── Vendor/
│   │       ├── Command/
│   │       │   └── RegisterVendorCommand.php
│   │       ├── UseCase/
│   │       │   └── RegisterVendorUseCase.php
│   │       └── DTO/
│   │           └── VendorDTO.php
│   │
│   └── Infrastructure/                      # 🟡 TECHNICAL IMPLEMENTATIONS
│       │
│       ├── Persistence/
│       │   └── Eloquent/
│       │       │
│       │       ├── Model/                   # Eloquent Models
│       │       │   ├── PurchaseOrderModel.php
│       │       │   ├── ProductModel.php
│       │       │   ├── CustomerModel.php
│       │       │   ├── VendorModel.php
│       │       │   ├── InvoiceModel.php
│       │       │   └── PaymentModel.php
│       │       │
│       │       └── Repository/              # Repository Implementations
│       │           ├── EloquentPurchaseOrderRepository.php
│       │           ├── EloquentProductRepository.php
│       │           ├── EloquentCustomerRepository.php
│       │           ├── EloquentVendorRepository.php
│       │           ├── EloquentInvoiceRepository.php
│       │           └── EloquentPaymentRepository.php
│       │
│       ├── Adapters/                        # External Service Adapters
│       │   │
│       │   ├── Mail/
│       │   │   ├── MailAdapterInterface.php
│       │   │   └── LaravelMailAdapter.php
│       │   │
│       │   ├── PaymentGateway/
│       │   │   ├── PaymentGatewayInterface.php
│       │   │   ├── MidtransAdapter.php
│       │   │   ├── XenditAdapter.php
│       │   │   └── StripeAdapter.php
│       │   │
│       │   ├── SMS/
│       │   │   ├── SMSGatewayInterface.php
│       │   │   └── TwilioSMSAdapter.php
│       │   │
│       │   └── Storage/
│       │       ├── FileStorageInterface.php
│       │       ├── S3StorageAdapter.php
│       │       └── LocalStorageAdapter.php
│       │
│       └── Presentation/                    # Entry Points
│           │
│           ├── Http/
│           │   │
│           │   ├── Controllers/
│           │   │   ├── Api/
│           │   │   │   ├── V1/
│           │   │   │   │   ├── Admin/
│           │   │   │   │   │   ├── ProductController.php
│           │   │   │   │   │   ├── OrderController.php
│           │   │   │   │   │   ├── CustomerController.php
│           │   │   │   │   │   ├── VendorController.php
│           │   │   │   │   │   ├── DashboardController.php
│           │   │   │   │   │   └── SettingsController.php
│           │   │   │   │   └── Public/
│           │   │   │   │       ├── ProductController.php
│           │   │   │   │       └── OrderController.php
│           │   │   │   └── Auth/
│           │   │   │       ├── LoginController.php
│           │   │   │       ├── RegisterController.php
│           │   │   │       └── LogoutController.php
│           │   │   └── ...
│           │   │
│           │   ├── Middleware/
│           │   │   ├── TenantMiddleware.php
│           │   │   ├── PermissionMiddleware.php
│           │   │   ├── TenantAwareMiddleware.php
│           │   │   └── ApiVersionMiddleware.php
│           │   │
│           │   ├── Requests/
│           │   │   ├── Product/
│           │   │   │   ├── CreateProductRequest.php
│           │   │   │   └── UpdateProductRequest.php
│           │   │   ├── Order/
│           │   │   │   ├── CreateOrderRequest.php
│           │   │   │   └── UpdateOrderStatusRequest.php
│           │   │   └── Auth/
│           │   │       ├── LoginRequest.php
│           │   │       └── RegisterRequest.php
│           │   │
│           │   ├── Resources/
│           │   │   ├── ProductResource.php
│           │   │   ├── ProductCollection.php
│           │   │   ├── OrderResource.php
│           │   │   ├── OrderCollection.php
│           │   │   ├── CustomerResource.php
│           │   │   └── VendorResource.php
│           │   │
│           │   └── Responses/
│           │       ├── ApiResponse.php
│           │       ├── SuccessResponse.php
│           │       └── ErrorResponse.php
│           │
│           └── Console/
│               └── Commands/
│                   ├── TenantProvisionCommand.php
│                   ├── TenantMigrateCommand.php
│                   └── GenerateOrderCodeCommand.php
│
├── bootstrap/
├── config/
│   ├── app.php
│   ├── database.php
│   ├── permission.php                       # Spatie permission config
│   ├── sanctum.php                          # Laravel Sanctum config
│   └── tenancy.php                          # Multi-tenancy config
│
├── database/
│   ├── factories/
│   │   ├── PurchaseOrderFactory.php
│   │   ├── ProductFactory.php
│   │   └── UserFactory.php
│   │
│   ├── migrations/
│   │   ├── landlord/                        # Landlord database
│   │   │   ├── 2024_01_01_000001_create_tenants_table.php
│   │   │   ├── 2024_01_01_000002_create_users_table.php
│   │   │   ├── 2024_01_01_000003_create_tenant_user_pivot_table.php
│   │   │   └── 2024_01_01_000004_create_permission_tables.php
│   │   │
│   │   └── tenant/                          # Tenant databases
│   │       ├── 2024_01_01_000001_create_products_table.php
│   │       ├── 2024_01_01_000002_create_customers_table.php
│   │       ├── 2024_01_01_000003_create_vendors_table.php
│   │       ├── 2024_01_01_000004_create_purchase_orders_table.php
│   │       ├── 2024_01_01_000005_create_order_quotes_table.php
│   │       ├── 2024_01_01_000006_create_invoices_table.php
│   │       ├── 2024_01_01_000007_create_payments_table.php
│   │       └── 2024_01_01_000008_create_settings_table.php
│   │
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── TenantSeeder.php
│       ├── UserSeeder.php
│       └── RolePermissionSeeder.php
│
├── docs/                                     # Documentation
│   └── openapi/                              # See OPENAPI STRUCTURE section
│
├── routes/
│   ├── api.php                               # Landlord API routes
│   ├── tenant.php                            # Tenant API routes
│   ├── web.php
│   └── console.php
│
├── storage/
├── tests/
│   ├── Unit/
│   │   ├── Domain/
│   │   │   ├── Order/
│   │   │   │   ├── PurchaseOrderTest.php
│   │   │   │   └── PriceCalculatorServiceTest.php
│   │   │   └── Product/
│   │   │       └── ProductTest.php
│   │   └── Application/
│   │       └── Order/
│   │           └── CreatePurchaseOrderUseCaseTest.php
│   │
│   ├── Feature/
│   │   ├── Api/
│   │   │   ├── ProductApiTest.php
│   │   │   ├── OrderApiTest.php
│   │   │   └── AuthApiTest.php
│   │   └── MultiTenancy/
│   │       └── TenantIsolationTest.php
│   │
│   └── TestCase.php
│
├── .env
├── .env.example
├── .gitignore
├── artisan
├── composer.json
├── composer.lock
├── phpunit.xml
└── README.md
```

---

## 📄 **OPENAPI STRUCTURE**

```
docs/openapi/
│
├── openapi.yaml                              # Main entry point
│
├── info.yaml                                 # API metadata
├── servers.yaml                              # Server configurations
├── tags.yaml                                 # API grouping tags
│
├── paths/                                    # API Endpoints
│   │
│   ├── auth/
│   │   ├── login.yaml
│   │   ├── register.yaml
│   │   ├── logout.yaml
│   │   └── refresh.yaml
│   │
│   ├── admin/
│   │   ├── dashboard/
│   │   │   └── statistics.yaml
│   │   │
│   │   ├── products/
│   │   │   ├── index.yaml                    # GET /api/v1/admin/products
│   │   │   ├── store.yaml                    # POST /api/v1/admin/products
│   │   │   ├── show.yaml                     # GET /api/v1/admin/products/{id}
│   │   │   ├── update.yaml                   # PUT /api/v1/admin/products/{id}
│   │   │   └── destroy.yaml                  # DELETE /api/v1/admin/products/{id}
│   │   │
│   │   ├── orders/
│   │   │   ├── index.yaml
│   │   │   ├── store.yaml
│   │   │   ├── show.yaml
│   │   │   ├── update-status.yaml            # PUT /api/v1/admin/orders/{id}/status
│   │   │   ├── assign-vendor.yaml            # POST /api/v1/admin/orders/{id}/assign-vendor
│   │   │   ├── create-quote.yaml             # POST /api/v1/admin/orders/{id}/quotes
│   │   │   └── verify-payment.yaml           # POST /api/v1/admin/orders/{id}/verify-payment
│   │   │
│   │   ├── customers/
│   │   │   ├── index.yaml
│   │   │   ├── store.yaml
│   │   │   ├── show.yaml
│   │   │   └── update.yaml
│   │   │
│   │   ├── vendors/
│   │   │   ├── index.yaml
│   │   │   ├── store.yaml
│   │   │   ├── show.yaml
│   │   │   └── update.yaml
│   │   │
│   │   └── settings/
│   │       ├── index.yaml
│   │       └── update.yaml
│   │
│   ├── public/
│   │   ├── products/
│   │   │   ├── index.yaml
│   │   │   └── show.yaml
│   │   └── orders/
│   │       ├── store.yaml
│   │       └── track.yaml
│   │
│   └── tenant/
│       ├── provision.yaml
│       └── settings.yaml
│
├── components/
│   │
│   ├── schemas/                              # Data Models
│   │   │
│   │   ├── entities/
│   │   │   ├── Product.yaml
│   │   │   ├── PurchaseOrder.yaml
│   │   │   ├── Customer.yaml
│   │   │   ├── Vendor.yaml
│   │   │   ├── Invoice.yaml
│   │   │   └── Payment.yaml
│   │   │
│   │   ├── requests/
│   │   │   ├── auth/
│   │   │   │   ├── LoginRequest.yaml
│   │   │   │   └── RegisterRequest.yaml
│   │   │   ├── products/
│   │   │   │   ├── CreateProductRequest.yaml
│   │   │   │   └── UpdateProductRequest.yaml
│   │   │   └── orders/
│   │   │       ├── CreateOrderRequest.yaml
│   │   │       └── UpdateOrderStatusRequest.yaml
│   │   │
│   │   ├── responses/
│   │   │   ├── ProductResponse.yaml
│   │   │   ├── ProductListResponse.yaml
│   │   │   ├── OrderResponse.yaml
│   │   │   ├── OrderListResponse.yaml
│   │   │   └── DashboardStatisticsResponse.yaml
│   │   │
│   │   ├── common/
│   │   │   ├── Pagination.yaml
│   │   │   ├── Meta.yaml
│   │   │   └── Links.yaml
│   │   │
│   │   └── errors/
│   │       ├── ValidationError.yaml
│   │       ├── AuthenticationError.yaml
│   │       └── NotFoundError.yaml
│   │
│   ├── parameters/
│   │   ├── TenantId.yaml
│   │   ├── ProductId.yaml
│   │   ├── OrderId.yaml
│   │   ├── Page.yaml
│   │   ├── PerPage.yaml
│   │   ├── SortBy.yaml
│   │   └── FilterStatus.yaml
│   │
│   ├── responses/
│   │   ├── Success.yaml
│   │   ├── Created.yaml
│   │   ├── NoContent.yaml
│   │   ├── BadRequest.yaml
│   │   ├── Unauthorized.yaml
│   │   ├── Forbidden.yaml
│   │   ├── NotFound.yaml
│   │   ├── ValidationError.yaml
│   │   └── InternalServerError.yaml
│   │
│   ├── securitySchemes/
│   │   ├── BearerAuth.yaml
│   │   └── ApiKeyAuth.yaml
│   │
│   └── examples/
│       ├── Product.yaml
│       ├── Order.yaml
│       └── User.yaml
│
└── README.md
```

---

**Document continues in PHASE1_DATABASE_SCHEMA.md**

