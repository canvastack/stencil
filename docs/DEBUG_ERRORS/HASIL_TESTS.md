php artisan test
PHP Warning:  Module "openssl" is already loaded in Unknown on line 0

Warning: Module "openssl" is already loaded in Unknown on line 0

Warning: Module "openssl" is already loaded in Unknown on line 0
PHP Warning:  Module "openssl" is already loaded in Unknown on line 0

   PASS  Tests\Unit\Application\Order\AssignVendorUseCaseTest
  ✓ it assigns vendor to order successfully                                                                                                                                              0.59s
  ✓ it fails when order not found                                                                                                                                                        0.08s
  ✓ it fails when order belongs to different tenant                                                                                                                                      0.02s
  ✓ it fails when vendor not found                                                                                                                                                       0.02s
  ✓ it fails when order status does not allow vendor assignment                                                                                                                          0.02s
  ✓ it fails when tenant id is empty                                                                                                                                                     0.02s
  ✓ it fails when order id is empty                                                                                                                                                      0.02s
  ✓ it fails when vendor id is empty                                                                                                                                                     0.02s

   PASS  Tests\Unit\Application\Order\CreatePurchaseOrderUseCaseTest
  ✓ it creates order successfully                                                                                                                                                        0.15s
  ✓ it fails when order number already exists                                                                                                                                            0.02s
  ✓ it fails when tenant id is empty                                                                                                                                                     0.02s
  ✓ it fails when customer id is empty                                                                                                                                                   0.02s
  ✓ it fails when total amount is negative                                                                                                                                               0.02s
  ✓ it fails when items array is empty                                                                                                                                                   0.03s
  ✓ it fails when item missing required fields                                                                                                                                           0.03s
  ✓ it fails when item quantity is zero                                                                                                                                                  0.03s
  ✓ it fails when item unit price is negative                                                                                                                                            0.03s
  ✓ it creates order with shipping and billing address                                                                                                                                   0.02s
  ✓ it creates order with default currency                                                                                                                                               0.02s

   PASS  Tests\Unit\Application\Order\Handlers\CommandHandlersTest
  ✓ assign vendor handler delegates to use case                                                                                                                                          0.06s
  ✓ negotiate with vendor handler delegates to use case                                                                                                                                  0.23s
  ✓ complete order handler delegates to use case                                                                                                                                         0.11s

   PASS  Tests\Unit\Application\Order\Handlers\CreatePurchaseOrderHandlerTest
  ✓ it handles create purchase order command                                                                                                                                             0.05s
  ✓ it returns order from use case                                                                                                                                                       0.03s

   PASS  Tests\Unit\Application\Order\Handlers\QueryHandlersTest
  ✓ get order query handler returns order by id                                                                                                                                          0.13s
  ✓ get orders by status query handler returns paginated orders                                                                                                                          0.10s
  ✓ get orders by status query handler handles pagination                                                                                                                                0.02s
  ✓ get orders by customer query handler returns customer orders                                                                                                                         0.09s
  ✓ get order analytics query handler returns analytics                                                                                                                                  0.08s
  ✓ get order history query handler returns recent orders                                                                                                                                0.20s

   PASS  Tests\Unit\Application\Order\NegotiateWithVendorUseCaseTest
  ✓ it negotiates with vendor successfully                                                                                                                                               0.03s
  ✓ it fails when order not found                                                                                                                                                        0.03s
  ✓ it fails when order status does not allow negotiation                                                                                                                                0.02s
  ✓ it fails when quoted price is negative                                                                                                                                               0.03s
  ✓ it fails when lead time is invalid                                                                                                                                                   0.03s
  ✓ it fails when vendor not found                                                                                                                                                       0.02s

   PASS  Tests\Unit\Application\Order\Services\ApplicationServicesTest
  ✓ order application service creates order with transaction                                                                                                                             0.36s
  ✓ payment service verifies payment successfully                                                                                                                                        0.08s
  ✓ payment service validates payment amount                                                                                                                                             0.03s
  ✓ payment service calculates down payment                                                                                                                                              0.03s
  ✓ payment service generates invoice number                                                                                                                                             0.03s
  ✓ vendor negotiation service starts negotiation                                                                                                                                        0.07s
  ✓ vendor negotiation service requests quote                                                                                                                                            0.02s
  ✓ vendor negotiation service validates quote price                                                                                                                                     0.03s
  ✓ vendor negotiation service compares quotes                                                                                                                                           0.02s
  ✓ vendor negotiation service sets deadline                                                                                                                                             0.02s
  ✓ vendor negotiation service sets urgent deadline                                                                                                                                      0.02s
  ✓ vendor negotiation service concludes negotiation                                                                                                                                     0.02s

   PASS  Tests\Unit\Application\Order\Subscribers\EventSubscribersTest
  ✓ order workflow subscriber registered correctly                                                                                                                                       0.16s
  ✓ order workflow subscriber handles vendor assigned                                                                                                                                    0.11s
  ✓ order workflow subscriber handles quote requested                                                                                                                                    0.09s
  ✓ order workflow subscriber handles quote approved                                                                                                                                     0.09s
  ✓ order workflow subscriber handles order shipped                                                                                                                                      0.09s
  ✓ order workflow subscriber handles order completed                                                                                                                                    0.19s
  ✓ payment workflow subscriber registered correctly                                                                                                                                     0.13s
  ✓ payment workflow subscriber handles payment received                                                                                                                                 0.14s
  ✓ payment workflow subscriber handles refund processed                                                                                                                                 0.13s
  ✓ notification subscriber registered correctly                                                                                                                                         0.10s
  ✓ notification subscriber handles order created                                                                                                                                        0.09s
  ✓ notification subscriber handles order status changed                                                                                                                                 0.09s
  ✓ notification subscriber handles payment received                                                                                                                                     0.10s
  ✓ notification subscriber handles order shipped                                                                                                                                        0.09s
  ✓ notification subscriber handles order delivered                                                                                                                                      0.09s
  ✓ notification subscriber handles order cancelled                                                                                                                                      0.10s
  ✓ subscribers maintain event mapping                                                                                                                                                   0.09s
  ✓ subscribers properly delegate to listeners                                                                                                                                           0.09s
  ✓ multiple subscribers can handle same event                                                                                                                                           0.09s
  ✓ event subscriber isolation                                                                                                                                                           0.10s

   PASS  Tests\Unit\Application\Product\CreateProductCategoryUseCaseTest
  ✓ it creates root category successfully                                                                                                                                                0.38s
  ✓ it creates child category successfully                                                                                                                                               0.03s
  ✓ it throws exception when slug already exists                                                                                                                                         0.02s
  ✓ it throws exception when parent not found                                                                                                                                            0.03s
  ✓ it creates category with allowed materials                                                                                                                                           0.09s
  ✓ it creates category with quality levels                                                                                                                                              0.05s
  ✓ it creates category with customization options                                                                                                                                       0.03s
  ✓ it creates category with seo information                                                                                                                                             0.02s
  ✓ it creates category with pricing configuration                                                                                                                                       0.03s
  ✓ it validates invalid material values                                                                                                                                                 0.03s
  ✓ it validates invalid quality values                                                                                                                                                  0.02s
  ✓ it validates markup percentage range                                                                                                                                                 0.02s
  ✓ it creates featured category                                                                                                                                                         0.02s
  ✓ it creates hidden menu category                                                                                                                                                      0.02s
  ✓ it creates category with media information                                                                                                                                           0.02s
  ✓ it creates category with custom sort order                                                                                                                                           0.02s

   PASS  Tests\Unit\Application\Product\CreateProductVariantUseCaseTest
  ✓ it creates product variant successfully                                                                                                                                              0.27s
  ✓ it creates variant with pricing information                                                                                                                                          0.02s
  ✓ it creates variant with stock information                                                                                                                                            0.02s
  ✓ it creates variant with dimensions                                                                                                                                                   0.02s
  ✓ it creates variant with custom sku                                                                                                                                                   0.06s
  ✓ it creates variant with etching specifications                                                                                                                                       0.03s
  ✓ it throws exception when category not found                                                                                                                                          0.02s
  ✓ it throws exception when variant already exists                                                                                                                                      0.03s
  ✓ it throws exception when custom sku already exists                                                                                                                                   0.02s
  ✓ it validates invalid material                                                                                                                                                        0.02s
  ✓ it validates invalid quality                                                                                                                                                         0.02s
  ✓ it validates negative dimensions                                                                                                                                                     0.02s
  ✓ it validates negative weight                                                                                                                                                         0.02s
  ✓ it validates negative stock                                                                                                                                                          0.03s
  ✓ it validates invalid pricing                                                                                                                                                         0.03s
  ✓ it calculates price with material and quality multipliers                                                                                                                            0.02s

   PASS  Tests\Unit\Domain\CustomerEntityTest
  ✓ it can be created with valid data                                                                                                                                                    0.20s
  ✓ it can be created as business customer                                                                                                                                               0.03s
  ✓ business customer requires company name                                                                                                                                              0.02s
  ✓ it can update name                                                                                                                                                                   0.02s
  ✓ it can update email                                                                                                                                                                  0.02s
  ✓ it can add and remove tags                                                                                                                                                           0.02s
  ✓ it prevents duplicate tags                                                                                                                                                           0.02s
  ✓ it can suspend and activate                                                                                                                                                          0.02s
  ✓ it can update last order date                                                                                                                                                        0.03s
  ✓ it can calculate days since last order                                                                                                                                               0.02s
  ✓ it returns null for days since last order when no orders                                                                                                                             0.02s
  ✓ it generates correct display name for individual                                                                                                                                     0.03s
  ✓ it generates correct display name for business                                                                                                                                       0.02s
  ✓ it can update phone                                                                                                                                                                  0.05s
  ✓ it can update address                                                                                                                                                                0.06s
  ✓ it can convert to array                                                                                                                                                              0.02s

   PASS  Tests\Unit\Domain\Customer\Services\CustomerSegmentationServiceTest
  ✓ calculate rfm score for champion customer                                                                                                                                            2.46s
  ✓ calculate rfm score for new customer                                                                                                                                                 0.10s
  ✓ segment all customers returns collection                                                                                                                                             0.10s
  ✓ get segment distribution returns valid data                                                                                                                                          0.15s
  ✓ get lifetime value calculates correctly                                                                                                                                              0.11s
  ✓ get churn risk identifies at risk customer                                                                                                                                           0.09s
  ✓ get churn risk identifies low risk customer                                                                                                                                          0.15s
  ✓ get high value customers filters correctly                                                                                                                                           0.17s
  ✓ get at risk customers returns high churn risk                                                                                                                                        0.11s

   PASS  Tests\Unit\Domain\Order\Jobs\OrderSlaMonitorJobTest
  ✓ job handles order sla monitoring                                                                                                                                                     0.10s
  ✓ sla breach detection                                                                                                                                                                 0.11s
  ✓ multi level escalation slack channel                                                                                                                                                 0.09s
  ✓ multi level escalation email channel                                                                                                                                                 0.10s
  ✓ role based routing procurement lead                                                                                                                                                  0.10s
  ✓ threshold configuration sourcing vendor                                                                                                                                              0.10s
  ✓ threshold configuration vendor negotiation                                                                                                                                           0.10s
  ✓ notification dispatch on escalation                                                                                                                                                  0.10s
  ✓ job returns early if order not found                                                                                                                                                 0.07s
  ✓ job returns early if status mismatch                                                                                                                                                 0.10s
  ✓ escalation index null with threshold check                                                                                                                                           0.23s
  ✓ multiple escalation levels triggered sequentially                                                                                                                                    0.10s
  ✓ sla metadata updated after job execution                                                                                                                                             0.10s
  ✓ job handles in production state                                                                                                                                                      0.09s
  ✓ job handles quality check state                                                                                                                                                      0.11s
  ✓ sla not breached if within threshold                                                                                                                                                 0.10s
  ✓ tenant scoping respected in job                                                                                                                                                      0.11s

   PASS  Tests\Unit\Domain\Order\Listeners\EventListenersTest
  ✓ send vendor assignment email listener                                                                                                                                                0.11s
  ✓ send quote request to vendor listener                                                                                                                                                0.09s
  ✓ send quote approval to customer listener                                                                                                                                             0.22s
  ✓ update inventory on order complete listener                                                                                                                                          0.09s
  ✓ trigger invoice generation on payment received                                                                                                                                       0.10s
  ✓ trigger invoice generation on order completed                                                                                                                                        0.09s
  ✓ send shipping notification listener                                                                                                                                                  0.09s
  ✓ process order completion listener                                                                                                                                                    0.10s
  ✓ handle refund workflow listener                                                                                                                                                      0.11s
  ✓ listener handles missing customer gracefully                                                                                                                                         0.10s
  ✓ listener handles missing vendor gracefully                                                                                                                                           0.09s
  ✓ listener handles exceptions gracefully                                                                                                                                               0.10s
  ✓ invoice number generation format                                                                                                                                                     0.10s
  ✓ refund updates order status                                                                                                                                                          0.23s
  ✓ process order completion updates customer metrics                                                                                                                                    0.10s
  ✓ listeners maintain multi tenant isolation                                                                                                                                            0.11s
  ✓ invoice generation idempotent                                                                                                                                                        0.10s

   PASS  Tests\Unit\Domain\Order\Notifications\NotificationPreferencesTest
  ✓ channel preference management whatsapp enabled                                                                                                                                       0.10s
  ✓ channel preference management sms enabled                                                                                                                                            0.09s
  ✓ disabled channel filtering whatsapp                                                                                                                                                  0.09s
  ✓ disabled channel filtering sms                                                                                                                                                       0.09s
  ✓ disabled channel filtering multiple channels                                                                                                                                         0.20s
  ✓ customer notification opt out complete disable                                                                                                                                       0.09s
  ✓ customer notification opt out via metadata                                                                                                                                           0.10s
  ✓ phone number validation valid indonesian number                                                                                                                                      0.15s
  ✓ phone number validation international format                                                                                                                                         0.09s
  ✓ phone number formatting local to international                                                                                                                                       0.10s
  ✓ phone number validation returns null for invalid                                                                                                                                     0.08s
  ✓ notification not sent when phone empty                                                                                                                                               0.09s
  ✓ notification not sent when phone null                                                                                                                                                0.08s
  ✓ whatsapp channel disabled by config                                                                                                                                                  0.08s
  ✓ sms channel disabled by config                                                                                                                                                       0.08s
  ✓ channel preference specific channels                                                                                                                                                 0.08s
  ✓ database notification channel always included                                                                                                                                        0.08s
  ✓ mail channel always included                                                                                                                                                         0.10s
  ✓ multiple notification types respect preferences                                                                                                                                      0.08s
  ✓ metadata notification channels array                                                                                                                                                 0.09s
  ✓ fallback to default preferences when none set                                                                                                                                        0.09s
  ✓ preference priority metadata over preferences                                                                                                                                        0.09s
  ✓ sms payload contains phone number                                                                                                                                                    0.09s
  ✓ sms payload contains message body                                                                                                                                                    0.08s
  ✓ notification context includes order id                                                                                                                                               0.08s
  ✓ notification context includes order number                                                                                                                                           0.08s

   PASS  Tests\Unit\Domain\Order\Notifications\OrderNotificationChannelsTest
  ✓ via includes whatsapp and sms when enabled                                                                                                                                           0.05s
  ✓ via excludes whatsapp when customer disables channel                                                                                                                                 0.03s
  ✓ whatsapp payload contains expected context                                                                                                                                           0.03s

   PASS  Tests\Unit\Domain\Order\Services\OrderPaymentServiceTest
  ✓ record customer payment with valid amount                                                                                                                                            0.11s
  ✓ record down payment detection                                                                                                                                                        0.11s
  ✓ record partial payment handling                                                                                                                                                      0.11s
  ✓ final payment detection when amount equals remaining                                                                                                                                 0.10s
  ✓ payment amount capped to remaining                                                                                                                                                   0.10s
  ✓ throw exception when order already paid                                                                                                                                              0.09s
  ✓ throw exception with zero or negative amount                                                                                                                                         0.09s
  ✓ payment method validation                                                                                                                                                            0.10s
  ✓ duplicate payment prevention through reference                                                                                                                                       0.10s
  ✓ vendor disbursement recording                                                                                                                                                        0.10s
  ✓ multiple vendor disbursements                                                                                                                                                        0.11s
  ✓ throw exception when disbursing without vendor                                                                                                                                       0.21s
  ✓ throw exception with zero disbursement amount                                                                                                                                        0.09s
  ✓ payment metadata tracking                                                                                                                                                            0.10s
  ✓ vendor disbursement metadata tracking                                                                                                                                                0.11s
  ✓ payment with custom currency                                                                                                                                                         0.10s
  ✓ payment with due date                                                                                                                                                                0.10s
  ✓ down payment amount stored in order                                                                                                                                                  0.10s
  ✓ transaction tenant scoping                                                                                                                                                           0.11s

   PASS  Tests\Unit\Domain\Order\Services\OrderStateMachineTest
  ✓ can transition from new to sourcing vendor                                                                                                                                           0.16s
  ✓ cannot transition from new to completed                                                                                                                                              0.10s
  ✓ cannot transition to same status                                                                                                                                                     0.08s
  ✓ get available transitions returns valid next states                                                                                                                                  0.08s
  ✓ validate transition requires vendor for negotiation                                                                                                                                  0.08s
  ✓ validate transition requires quotation amount                                                                                                                                        0.08s
  ✓ validate transition requires tracking number for shipped                                                                                                                             0.09s
  ✓ validate transition requires cancellation reason                                                                                                                                     0.13s
  ✓ transition updates order status successfully                                                                                                                                         0.10s
  ✓ transition throws exception for invalid transition                                                                                                                                   0.08s
  ✓ transition to payment received updates payment info                                                                                                                                  0.11s
  ✓ partial payment sets partially paid status                                                                                                                                           0.11s
  ✓ additional payment during production completes balance                                                                                                                               0.13s
  ✓ vendor disbursement is recorded during production transition                                                                                                                         0.12s
  ✓ transition to shipped records tracking number                                                                                                                                        0.11s
  ✓ transition to cancelled stores reason in metadata                                                                                                                                    0.10s
  ✓ transition to vendor negotiation creates negotiation record                                                                                                                          0.23s
  ✓ transition initializes sla timer for status with policy                                                                                                                              0.10s
  ✓ transition records sla history and triggers escalation on breach                                                                                                                     0.12s
  ✓ initialize sla schedules monitor jobs                                                                                                                                                0.11s
  ✓ sla escalation job updates metadata and dispatches event                                                                                                                             0.10s
  ✓ sla threshold job marks breach and dispatches event                                                                                                                                  0.10s

   PASS  Tests\Unit\Domain\Order\Services\VendorNegotiationServiceTest
  ✓ start negotiation creates new negotiation                                                                                                                                            0.12s
  ✓ negotiation workflow open to countered                                                                                                                                               0.11s
  ✓ round tracking in negotiation                                                                                                                                                        0.11s
  ✓ counter offer recording with history                                                                                                                                                 0.11s
  ✓ expiration enforcement                                                                                                                                                               0.10s
  ✓ negotiation approved conclusion                                                                                                                                                      0.12s
  ✓ negotiation rejected conclusion                                                                                                                                                      0.11s
  ✓ negotiation expired conclusion                                                                                                                                                       0.11s
  ✓ negotiation cancelled conclusion                                                                                                                                                     0.12s
  ✓ throw exception for invalid conclusion status                                                                                                                                        0.10s
  ✓ throw exception when starting without vendor                                                                                                                                         0.09s
  ✓ existing open negotiation returns without creating new                                                                                                                               0.10s
  ✓ negotiation history audit trail                                                                                                                                                      0.10s
  ✓ negotiation terms tracking                                                                                                                                                           0.10s
  ✓ order metadata updated during negotiation                                                                                                                                            0.11s
  ✓ metadata updated after counter offer                                                                                                                                                 0.10s
  ✓ negotiation currency tracking                                                                                                                                                        0.10s
  ✓ multiple vendor negotiations on same order                                                                                                                                           0.11s
  ✓ negotiation tenant scoping                                                                                                                                                           0.10s
  ✓ history entry timestamp format                                                                                                                                                       0.10s
  ✓ negotiation conclusion with final amount                                                                                                                                             0.10s

   PASS  Tests\Unit\Domain\Order\StateTransition\EdgeCaseTest
  ✓ invalid state transition from new to completed                                                                                                                                       0.11s
  ✓ invalid state transition from completed backward                                                                                                                                     0.10s
  ✓ invalid state transition to self                                                                                                                                                     0.09s
  ✓ concurrent transition attempts                                                                                                                                                       0.12s
  ✓ transition with missing required field                                                                                                                                               0.09s
  ✓ transition with empty metadata                                                                                                                                                       0.11s
  ✓ transition with corrupted metadata                                                                                                                                                   0.11s
  ✓ rapid sequential transitions                                                                                                                                                         0.10s
  ✓ transition with null vendor                                                                                                                                                          0.09s
  ✓ transition with extreme currency values                                                                                                                                              0.22s
  ✓ transition with zero amount                                                                                                                                                          0.09s
  ✓ transition with negative amount                                                                                                                                                      0.09s
  ✓ rollback on transition failure                                                                                                                                                       0.11s
  ✓ validation error handling missing tracking number                                                                                                                                    0.11s
  ✓ validation error handling missing cancellation reason                                                                                                                                0.10s
  ✓ order with special characters in metadata                                                                                                                                            0.11s
  ✓ transition with unicode characters                                                                                                                                                   0.09s
  ✓ transition maintains timestamps                                                                                                                                                      0.10s
  ✓ transition with very old order                                                                                                                                                       0.10s
  ✓ transition with future timestamps                                                                                                                                                    0.10s
  ✓ cannot transition with invalid enum value                                                                                                                                            0.09s
  ✓ get available transitions for all states                                                                                                                                             0.10s
  ✓ state machine handles concurrent orders                                                                                                                                              0.12s
  ✓ transition isolation between tenants                                                                                                                                                 0.13s
  ✓ transition with minimal metadata payload                                                                                                                                             0.10s
  ✓ transition with deeply nested metadata                                                                                                                                               0.12s
  ✓ validation with multiple errors                                                                                                                                                      0.10s

   PASS  Tests\Unit\Domain\Product\Enums\ProductMaterialTest
  ✓ it has all expected material values                                                                                                                                                  0.05s
  ✓ it returns correct string values                                                                                                                                                     0.02s
  ✓ it returns correct display names                                                                                                                                                     0.02s
  ✓ it returns correct descriptions                                                                                                                                                      0.03s
  ✓ it returns correct pricing multipliers                                                                                                                                               0.03s
  ✓ it identifies metal materials correctly                                                                                                                                              0.02s
  ✓ it identifies plastic materials correctly                                                                                                                                            0.02s
  ✓ it returns correct density values                                                                                                                                                    0.02s
  ✓ it returns correct melting points                                                                                                                                                    0.02s
  ✓ it returns correct hardness levels                                                                                                                                                   0.02s
  ✓ it returns correct corrosion resistance                                                                                                                                              0.03s
  ✓ it returns correct workability levels                                                                                                                                                0.02s
  ✓ it returns correct etching suitability                                                                                                                                               0.02s
  ✓ it returns available thickness options                                                                                                                                               0.02s
  ✓ it returns available finishes                                                                                                                                                        0.02s
  ✓ it calculates weight correctly                                                                                                                                                       0.02s
  ✓ it can be created from string                                                                                                                                                        0.02s
  ✓ it throws exception for invalid string                                                                                                                                               0.03s
  ✓ it returns all materials as options                                                                                                                                                  0.02s
  ✓ it returns metal materials only                                                                                                                                                      0.02s
  ✓ it returns plastic materials only                                                                                                                                                    0.02s
  ✓ it returns materials suitable for etching                                                                                                                                            0.02s
  ✓ it can compare materials by price                                                                                                                                                    0.02s
  ✓ it can get compatible finishes for material                                                                                                                                          0.03s
  ✓ it validates thickness availability                                                                                                                                                  0.02s
  ✓ it validates finish availability                                                                                                                                                     0.02s

   PASS  Tests\Unit\Domain\Product\Enums\ProductQualityTest
  ✓ it has all expected quality values                                                                                                                                                   0.05s
  ✓ it returns correct string values                                                                                                                                                     0.02s
  ✓ it returns correct display names                                                                                                                                                     0.02s
  ✓ it returns correct descriptions                                                                                                                                                      0.02s
  ✓ it returns correct pricing multipliers                                                                                                                                               0.02s
  ✓ it returns correct precision levels                                                                                                                                                  0.02s
  ✓ it returns correct surface finish quality                                                                                                                                            0.03s
  ✓ it returns correct inspection levels                                                                                                                                                 0.02s
  ✓ it returns correct lead times                                                                                                                                                        0.02s
  ✓ it returns correct minimum order quantities                                                                                                                                          0.03s
  ✓ it returns available finishes per quality                                                                                                                                            0.03s
  ✓ it returns correct quality certifications                                                                                                                                            0.02s
  ✓ it checks if requires special tooling                                                                                                                                                0.02s
  ✓ it checks if requires quality approval                                                                                                                                               0.03s
  ✓ it checks if includes documentation                                                                                                                                                  0.03s
  ✓ it returns correct etching depth precision                                                                                                                                           0.02s
  ✓ it returns correct edge quality levels                                                                                                                                               0.02s
  ✓ it calculates price with multiplier                                                                                                                                                  0.02s
  ✓ it can be created from string                                                                                                                                                        0.02s
  ✓ it throws exception for invalid string                                                                                                                                               0.02s
  ✓ it returns all qualities as options                                                                                                                                                  0.02s
  ✓ it can compare quality levels                                                                                                                                                        0.02s
  ✓ it can check if is lower quality                                                                                                                                                     0.02s
  ✓ it returns quality level numeric value                                                                                                                                               0.02s
  ✓ it can sort qualities by level                                                                                                                                                       0.02s
  ✓ it returns qualities above level                                                                                                                                                     0.02s
  ✓ it returns qualities below level                                                                                                                                                     0.02s
  ✓ it calculates quality upgrade cost                                                                                                                                                   0.02s
  ✓ it returns compatible materials per quality                                                                                                                                          0.02s
  ✓ it checks if quality is suitable for application                                                                                                                                     0.03s
  ✓ it returns recommended applications                                                                                                                                                  0.02s

   PASS  Tests\Unit\Domain\Product\ProductCategoryEntityTest
  ✓ it can be created with valid data                                                                                                                                                    0.05s
  ✓ it can be created as child category                                                                                                                                                  0.02s
  ✓ it can update basic information                                                                                                                                                      0.02s
  ✓ it can be activated and deactivated                                                                                                                                                  0.02s
  ✓ it can be featured and unfeatured                                                                                                                                                    0.02s
  ✓ it can toggle menu visibility                                                                                                                                                        0.02s
  ✓ it can set allowed materials                                                                                                                                                         0.03s
  ✓ it can set quality levels                                                                                                                                                            0.02s
  ✓ it can set customization options                                                                                                                                                     0.03s
  ✓ it can update sort order                                                                                                                                                             0.03s
  ✓ it can set media information                                                                                                                                                         0.03s
  ✓ it can set seo information                                                                                                                                                           0.02s
  ✓ it can set pricing configuration                                                                                                                                                     0.02s
  ✓ it validates markup percentage range                                                                                                                                                 0.02s
  ✓ it can check if has etching materials                                                                                                                                                0.02s
  ✓ it can get hierarchy path                                                                                                                                                            0.02s
  ✓ it can convert to array                                                                                                                                                              0.02s
  ✓ it generates correct breadcrumb                                                                                                                                                      0.02s
  ✓ it validates parent relationship prevents circular reference                                                                                                                         0.02s

   PASS  Tests\Unit\Domain\Product\ProductVariantEntityTest
  ✓ it can be created with valid data                                                                                                                                                    0.04s
  ✓ it generates sku automatically                                                                                                                                                       0.02s
  ✓ it can update pricing information                                                                                                                                                    0.02s
  ✓ it calculates profit margin correctly                                                                                                                                                0.03s
  ✓ it handles zero base price for profit margin                                                                                                                                         0.03s
  ✓ it can update stock quantity                                                                                                                                                         0.03s
  ✓ it can increase stock                                                                                                                                                                0.03s
  ✓ it can decrease stock                                                                                                                                                                0.02s
  ✓ it prevents negative stock decrease                                                                                                                                                  0.02s
  ✓ it can set low stock threshold                                                                                                                                                       0.02s
  ✓ it can check stock status                                                                                                                                                            0.02s
  ✓ it can set dimensions                                                                                                                                                                0.02s
  ✓ it validates positive dimensions                                                                                                                                                     0.02s
  ✓ it can set weight                                                                                                                                                                    0.02s
  ✓ it validates positive weight                                                                                                                                                         0.02s
  ✓ it can be activated and deactivated                                                                                                                                                  0.02s
  ✓ it can set custom sku                                                                                                                                                                0.02s
  ✓ it validates unique sku format                                                                                                                                                       0.02s
  ✓ it can set etching specifications                                                                                                                                                    0.02s
  ✓ it can check material properties                                                                                                                                                     0.02s
  ✓ it can check quality level                                                                                                                                                           0.03s
  ✓ it applies material and quality pricing multipliers                                                                                                                                  0.02s
  ✓ it can convert to array                                                                                                                                                              0.02s
  ✓ it generates variant display name                                                                                                                                                    0.02s

   PASS  Tests\Unit\Domain\Product\ValueObjects\ProductCategoryNameTest
  ✓ it can be created with valid name                                                                                                                                                    0.04s
  ✓ it trims whitespace from name                                                                                                                                                        0.02s
  ✓ it validates minimum length                                                                                                                                                          0.02s
  ✓ it validates maximum length                                                                                                                                                          0.02s
  ✓ it rejects empty name                                                                                                                                                                0.02s
  ✓ it rejects only whitespace name                                                                                                                                                      0.03s
  ✓ it allows valid special characters                                                                                                                                                   0.02s
  ✓ it rejects invalid special characters                                                                                                                                                0.02s
  ✓ it allows unicode characters                                                                                                                                                         0.06s
  ✓ it handles mixed case properly                                                                                                                                                       0.03s
  ✓ it can check equality                                                                                                                                                                0.02s
  ✓ it is case sensitive for equality                                                                                                                                                    0.02s
  ✓ it can generate slug suggestion                                                                                                                                                      0.02s
  ✓ it handles unicode in slug generation                                                                                                                                                0.02s
  ✓ it can check if contains etching keywords                                                                                                                                            0.02s
  ✓ it can get character count                                                                                                                                                           0.02s
  ✓ it can get word count                                                                                                                                                                0.02s
  ✓ it can convert to title case                                                                                                                                                         0.02s
  ✓ it can truncate with ellipsis                                                                                                                                                        0.02s
  ✓ it does not truncate short names                                                                                                                                                     0.02s
  ✓ it can check if contains word                                                                                                                                                        0.02s

   PASS  Tests\Unit\Domain\Product\ValueObjects\ProductCategorySlugTest
  ✓ it can be created with valid slug                                                                                                                                                    0.04s
  ✓ it validates minimum length                                                                                                                                                          0.03s
  ✓ it validates maximum length                                                                                                                                                          0.02s
  ✓ it rejects empty slug                                                                                                                                                                0.02s
  ✓ it rejects slug with spaces                                                                                                                                                          0.03s
  ✓ it rejects slug with uppercase letters                                                                                                                                               0.02s
  ✓ it rejects slug with special characters                                                                                                                                              0.02s
  ✓ it allows valid slug formats                                                                                                                                                         0.03s
  ✓ it rejects slug starting with hyphen                                                                                                                                                 0.03s
  ✓ it rejects slug ending with hyphen                                                                                                                                                   0.02s
  ✓ it rejects slug with consecutive hyphens                                                                                                                                             0.02s
  ✓ it can check equality                                                                                                                                                                0.02s
  ✓ it can generate from name                                                                                                                                                            0.09s
  ✓ it handles unicode characters in generation                                                                                                                                          0.03s
  ✓ it removes stopwords when generating from name                                                                                                                                       0.03s
  ✓ it can get parent slug from path                                                                                                                                                     0.02s
  ✓ it can check if etching related                                                                                                                                                      0.02s
  ✓ it can check if material related                                                                                                                                                     0.03s
  ✓ it can get slug depth                                                                                                                                                                0.02s
  ✓ it can append suffix                                                                                                                                                                 0.02s
  ✓ it validates suffix format                                                                                                                                                           0.02s
  ✓ it can prepend prefix                                                                                                                                                                0.02s
  ✓ it validates prefix format                                                                                                                                                           0.02s
  ✓ it can check if contains word                                                                                                                                                        0.02s
  ✓ it generates unique variation                                                                                                                                                        0.03s
  ✓ it returns original if no conflicts                                                                                                                                                  0.02s

   PASS  Tests\Unit\Domain\TenantEntityTest
  ✓ it can be created with valid data                                                                                                                                                    0.90s
  ✓ it can be activated                                                                                                                                                                  0.02s
  ✓ it can be suspended                                                                                                                                                                  0.02s
  ✓ it can start trial                                                                                                                                                                   0.02s
  ✓ it can end trial                                                                                                                                                                     0.03s
  ✓ it can update subscription                                                                                                                                                           0.02s
  ✓ it can expire subscription                                                                                                                                                           0.02s
  ✓ it can set custom domain                                                                                                                                                             0.02s
  ✓ it can remove custom domain                                                                                                                                                          0.02s
  ✓ it generates correct public url with custom domain                                                                                                                                   0.02s
  ✓ it generates correct public url with slug                                                                                                                                            0.02s
  ✓ it generates correct admin url                                                                                                                                                       0.02s
  ✓ it can check if subscription is active                                                                                                                                               0.02s
  ✓ it validates trial status correctly                                                                                                                                                  0.02s
  ✓ it can convert to array                                                                                                                                                              0.02s

   PASS  Tests\Unit\Domain\Vendor\Services\VendorPerformanceTest
  ✓ vendor sla compliance tracking                                                                                                                                                       0.47s
  ✓ quality score calculation                                                                                                                                                            0.13s
  ✓ on time delivery metrics                                                                                                                                                             0.14s
  ✓ rating updates                                                                                                                                                                       0.13s
  ✓ performance ranking                                                                                                                                                                  0.34s
  ✓ top performing vendors                                                                                                                                                               1.07s
  ✓ underperforming vendors identification                                                                                                                                               0.17s
  ✓ vendor trend analysis                                                                                                                                                                0.13s
  ✓ vendor comparison                                                                                                                                                                    0.25s
  ✓ sla metrics calculation                                                                                                                                                              0.11s
  ✓ sla compliance rate                                                                                                                                                                  0.12s
  ✓ sla status determination                                                                                                                                                             0.13s
  ✓ sla violations identification                                                                                                                                                        0.11s
  ✓ vendor evaluation includes all metrics                                                                                                                                               0.15s
  ✓ vendor evaluation score range                                                                                                                                                        0.18s
  ✓ performance recommendations generation                                                                                                                                               0.12s
  ✓ vendor reliability score calculation                                                                                                                                                 0.25s
  ✓ price competitiveness scoring                                                                                                                                                        0.13s
  ✓ response time scoring                                                                                                                                                                0.13s
  ✓ empty vendor evaluation                                                                                                                                                              0.09s
  ✓ trend summary calculation                                                                                                                                                            0.14s
  ✓ tenant scoping in evaluation                                                                                                                                                         0.16s

   PASS  Tests\Unit\ExampleTest
  ✓ that true is true                                                                                                                                                                    0.02s

   PASS  Tests\Unit\Http\Controllers\Platform\AuthControllerTest
  ✓ it can authenticate platform account with valid credentials                                                                                                                          4.20s
  ✓ it rejects invalid credentials                                                                                                                                                       0.14s
  ✓ it rejects non existent account                                                                                                                                                      0.07s
  ✓ it rejects inactive account                                                                                                                                                          0.08s
  ✓ it validates required fields                                                                                                                                                         0.10s
  ✓ it validates email format                                                                                                                                                            0.19s
  ✓ it enforces rate limiting                                                                                                                                                            0.10s
  ✓ it can logout successfully                                                                                                                                                           0.42s
  ✓ it can get authenticated user info                                                                                                                                                   0.09s
  ✓ it requires authentication for protected endpoints                                                                                                                                   0.11s
  ✓ it rejects invalid tokens                                                                                                                                                            0.08s
  ✓ it handles suspended account login                                                                                                                                                   0.08s
  ✓ it updates last login timestamp on successful authentication                                                                                                                         0.19s
  ✓ it includes proper expiration time                                                                                                                                                   0.09s
  ✓ it includes bearer token type                                                                                                                                                        0.09s

   PASS  Tests\Unit\Http\Controllers\Tenant\AuthControllerTest
  ✓ it can authenticate tenant user with valid credentials                                                                                                                               0.51s
  ✓ it rejects invalid credentials                                                                                                                                                       0.09s
  ✓ it rejects non existent user                                                                                                                                                         0.09s
  ✓ it rejects user from wrong tenant                                                                                                                                                    0.20s
  ✓ it rejects inactive tenant                                                                                                                                                           0.09s
  ✓ it rejects expired subscription                                                                                                                                                      0.10s
  ✓ it rejects inactive user                                                                                                                                                             0.09s
  ✓ it validates required fields                                                                                                                                                         0.09s
  ✓ it validates tenant context required                                                                                                                                                 0.10s
  ✓ it validates email format                                                                                                                                                            0.09s
  ✓ it enforces rate limiting per tenant                                                                                                                                                 0.12s
  ✓ it can logout successfully                                                                                                                                                           0.11s
  ✓ it can get authenticated user info                                                                                                                                                   0.12s
  ✓ it includes user permissions in response                                                                                                                                             0.11s
  ✓ it handles suspended user login                                                                                                                                                      0.09s
  ✓ it prevents login to trial expired tenant                                                                                                                                            0.09s
  ✓ it allows login to active trial tenant                                                                                                                                               0.24s
  ✓ it includes tenant context in response                                                                                                                                               0.11s

   PASS  Tests\Unit\Http\Middleware\PlatformAccessMiddlewareTest
  ✓ it allows authenticated platform account                                                                                                                                             0.14s
  ✓ it rejects unauthenticated requests                                                                                                                                                  0.08s
  ✓ it rejects tenant user accessing platform routes                                                                                                                                     0.18s
  ✓ it rejects inactive platform account                                                                                                                                                 0.09s
  ✓ it rejects suspended platform account                                                                                                                                                0.07s
  ✓ it allows different platform account types                                                                                                                                           0.20s
  ✓ it handles invalid token gracefully                                                                                                                                                  0.07s
  ✓ it sets correct guard context                                                                                                                                                        0.07s
  ✓ it logs security events                                                                                                                                                              0.07s

   PASS  Tests\Unit\Http\Middleware\TenantContextMiddlewareTest
  ✓ it identifies tenant from subdomain                                                                                                                                                  0.24s
  ✓ it identifies tenant from custom domain                                                                                                                                              0.09s
  ✓ it identifies tenant from path parameter                                                                                                                                             0.09s
  ✓ it rejects request for nonexistent tenant                                                                                                                                            0.08s
  ✓ it rejects request for inactive tenant                                                                                                                                               0.09s
  ✓ it rejects request for expired subscription                                                                                                                                          0.09s
  ✓ it allows trial tenant within trial period                                                                                                                                           0.09s
  ✓ it rejects expired trial tenant                                                                                                                                                      0.08s
  ✓ it enforces tenant scoped authentication                                                                                                                                             0.09s
  ✓ it rejects user from different tenant                                                                                                                                                0.09s
  ✓ it sets tenant context in application                                                                                                                                                0.08s
  ✓ it handles suspended tenant                                                                                                                                                          0.09s
  ✓ it prioritizes custom domain over subdomain                                                                                                                                          0.08s
  ✓ it handles www prefix in custom domain                                                                                                                                               0.09s

   PASS  Tests\Unit\Infrastructure\Product\Models\ProductCategoryModelTest
  ✓ it has correct fillable attributes                                                                                                                                                   0.14s
  ✓ it casts attributes correctly                                                                                                                                                        0.07s
  ✓ it can create product category with basic attributes                                                                                                                                 0.08s
  ✓ it auto generates uuid on creation                                                                                                                                                   0.08s
  ✓ it updates hierarchy when parent changes                                                                                                                                             0.21s
  ✓ it has tenant relationship                                                                                                                                                           0.07s
  ✓ it has parent relationship                                                                                                                                                           0.07s
  ✓ it has children relationship                                                                                                                                                         0.07s
  ✓ it has descendants relationship                                                                                                                                                      0.09s
  ✓ it has products relationship                                                                                                                                                         0.12s
  ✓ it scopes active categories                                                                                                                                                          0.20s
  ✓ it scopes featured categories                                                                                                                                                        0.08s
  ✓ it scopes root categories                                                                                                                                                            0.08s
  ✓ it scopes categories by level                                                                                                                                                        0.09s
  ✓ it scopes categories shown in menu                                                                                                                                                   0.09s
  ✓ it scopes ordered categories                                                                                                                                                         0.09s
  ✓ it checks if category has children                                                                                                                                                   0.09s
  ✓ it checks if category has products                                                                                                                                                   0.09s
  ✓ it generates full path                                                                                                                                                               0.09s
  ✓ it generates breadcrumb                                                                                                                                                              0.08s
  ✓ it stores allowed materials as array                                                                                                                                                 0.08s
  ✓ it stores quality levels as array                                                                                                                                                    0.08s
  ✓ it stores customization options as array                                                                                                                                             0.19s
  ✓ it stores seo keywords as array                                                                                                                                                      0.08s
  ✓ it casts base markup percentage as decimal                                                                                                                                           0.12s
  ✓ it uses soft deletes                                                                                                                                                                 0.13s

   PASS  Tests\Unit\Infrastructure\Product\Models\ProductVariantModelTest
  ✓ it has correct fillable attributes                                                                                                                                                   0.15s
  ✓ it casts attributes correctly                                                                                                                                                        0.07s
  ✓ it can create product variant with basic attributes                                                                                                                                  0.11s
  ✓ it auto generates uuid on creation                                                                                                                                                   0.11s
  ✓ it has tenant relationship                                                                                                                                                           0.07s
  ✓ it has category relationship                                                                                                                                                         0.07s
  ✓ it scopes active variants                                                                                                                                                            0.10s
  ✓ it scopes variants by material                                                                                                                                                       0.11s
  ✓ it scopes variants by quality                                                                                                                                                        0.11s
  ✓ it scopes variants in stock                                                                                                                                                          0.12s
  ✓ it scopes variants out of stock                                                                                                                                                      0.11s
  ✓ it scopes variants low stock                                                                                                                                                         0.11s
  ✓ it scopes variants by price range                                                                                                                                                    0.12s
  ✓ it checks if variant has stock                                                                                                                                                       0.11s
  ✓ it checks if variant is low stock                                                                                                                                                    0.11s
  ✓ it calculates profit margin                                                                                                                                                          0.10s
  ✓ it handles zero base price in margin calculation                                                                                                                                     0.10s
  ✓ it calculates dimensions                                                                                                                                                             0.10s
  ✓ it generates display name                                                                                                                                                            0.11s
  ✓ it stores etching specifications as array                                                                                                                                            0.10s
  ✓ it casts prices as decimal                                                                                                                                                           0.10s
  ✓ it casts dimensions as decimal                                                                                                                                                       0.10s
  ✓ it uses soft deletes                                                                                                                                                                 0.11s
  ✓ it maintains category relationship                                                                                                                                                   0.11s

   PASS  Tests\Unit\Infrastructure\Product\ProductCategoryEloquentRepositoryTest
  ✓ it can save product category                                                                                                                                                         0.20s
  ✓ it can find category by id                                                                                                                                                           0.09s
  ✓ it returns null when category not found by id                                                                                                                                        0.06s
  ✓ it can find category by slug                                                                                                                                                         0.09s
  ✓ it returns null when category not found by slug                                                                                                                                      0.07s
  ✓ it can find root categories                                                                                                                                                          0.10s
  ✓ it can find children categories                                                                                                                                                      0.11s
  ✓ it can find active categories                                                                                                                                                        0.10s
  ✓ it can find featured categories                                                                                                                                                      0.09s
  ✓ it can find categories by material                                                                                                                                                   0.11s
  ✓ it can find categories by level                                                                                                                                                      0.11s
  ✓ it can search categories by name                                                                                                                                                     0.10s
  ✓ it can count categories by tenant                                                                                                                                                    0.10s
  ✓ it can check if slug exists                                                                                                                                                          0.09s
  ✓ it can get category hierarchy                                                                                                                                                        0.11s
  ✓ it can delete category                                                                                                                                                               0.09s
  ✓ it returns false when deleting non existent category                                                                                                                                 0.07s
  ✓ it can update category                                                                                                                                                               0.09s
  ✓ it maintains tenant isolation                                                                                                                                                        0.10s
  ✓ it can find categories with pagination                                                                                                                                               0.23s
  ✓ it can find categories with sorting                                                                                                                                                  0.10s

   PASS  Tests\Unit\Infrastructure\Product\ProductVariantEloquentRepositoryTest
  ✓ it can save product variant                                                                                                                                                          0.17s
  ✓ it can find variant by id                                                                                                                                                            0.12s
  ✓ it returns null when variant not found by id                                                                                                                                         0.06s
  ✓ it can find variant by sku                                                                                                                                                           0.12s
  ✓ it returns null when variant not found by sku                                                                                                                                        0.08s
  ✓ it can find variant by category material quality                                                                                                                                     0.12s
  ✓ it can find variants by category                                                                                                                                                     0.11s
  ✓ it can find variants by material                                                                                                                                                     0.15s
  ✓ it can find variants by quality                                                                                                                                                      0.15s
  ✓ it can find active variants                                                                                                                                                          0.14s
  ✓ it can find variants in stock                                                                                                                                                        0.14s
  ✓ it can find low stock variants                                                                                                                                                       0.13s
  ✓ it can find variants by price range                                                                                                                                                  0.15s
  ✓ it can update stock quantity                                                                                                                                                         0.12s
  ✓ it can increase stock                                                                                                                                                                0.12s
  ✓ it can decrease stock                                                                                                                                                                0.12s
  ✓ it can update pricing                                                                                                                                                                0.12s
  ✓ it can count variants by tenant                                                                                                                                                      0.13s
  ✓ it can count variants by category                                                                                                                                                    0.14s
  ✓ it can check if sku exists                                                                                                                                                           0.12s
  ✓ it can delete variant                                                                                                                                                                0.12s
  ✓ it returns false when deleting non existent variant                                                                                                                                  0.07s
  ✓ it maintains tenant isolation                                                                                                                                                        0.14s
  ✓ it can find variants with pagination                                                                                                                                                 0.33s
  ✓ it can find variants with sorting                                                                                                                                                    0.16s
  ✓ it can search variants                                                                                                                                                               0.14s
  ✓ it can get stock summary                                                                                                                                                             0.13s

   PASS  Tests\Unit\Infrastructure\TenantAware\TenantAwareTraitTest
  ✓ customer model implements tenant aware interface                                                                                                                                     0.11s
  ✓ it returns correct tenant id                                                                                                                                                         0.08s
  ✓ it has tenant relationship                                                                                                                                                           0.08s
  ✓ it scopes to current tenant                                                                                                                                                          0.09s
  ✓ it scopes to specific tenant                                                                                                                                                         0.09s
  ✓ it checks belongs to current tenant                                                                                                                                                  0.09s
  ✓ it checks belongs to specific tenant                                                                                                                                                 0.09s
  ✓ it auto assigns tenant id on creation                                                                                                                                                0.08s
  ✓ global scope filters by tenant automatically                                                                                                                                         0.11s
  ✓ can query across tenants with scope removal                                                                                                                                          0.09s
  ✓ uuid field is auto generated                                                                                                                                                         0.11s

   PASS  Tests\Unit\Services\Auth\JwtServiceTest
  ✓ it can generate jwt token for platform account                                                                                                                                       0.11s
  ✓ it can generate jwt token for tenant user                                                                                                                                            0.22s
  ✓ it fails authentication with invalid platform credentials                                                                                                                            0.09s
  ✓ it fails authentication with invalid tenant credentials                                                                                                                              0.09s
  ✓ it fails authentication for inactive platform account                                                                                                                                0.09s
  ✓ it fails authentication for inactive tenant                                                                                                                                          0.09s
  ✓ it fails authentication for expired tenant subscription                                                                                                                              0.13s
  ✓ it prevents cross tenant authentication                                                                                                                                              0.10s
  ✓ it includes proper user permissions in token                                                                                                                                         0.10s
  ✓ platform and tenant tokens have different structures                                                                                                                                 0.13s
  ✓ it handles case insensitive email lookup                                                                                                                                             0.10s
  ✓ it validates nonexistent email                                                                                                                                                       0.10s
  ✓ it validates nonexistent tenant                                                                                                                                                      0.09s
  ✓ it includes proper token expiration times                                                                                                                                            0.12s
  ✓ it includes account type in response                                                                                                                                                 0.12s
  ✓ it includes bearer token type                                                                                                                                                        0.10s

   FAIL  Tests\Feature\Auth\EmailVerificationTest
  ⨯ can send verification email for tenant user                                                                                                                                          1.64s
  ✓ can send verification email for platform user                                                                                                                                        0.09s
  ⨯ can verify email with valid token                                                                                                                                                    0.09s
  ✓ cannot verify email with invalid token                                                                                                                                               0.08s
  ✓ cannot verify email with expired token                                                                                                                                               0.09s
  ✓ cannot verify already verified token                                                                                                                                                 0.08s
  ✓ can resend verification email                                                                                                                                                        0.09s
  ⨯ cannot resend verification if already verified                                                                                                                                       0.09s
  ✓ rate limiting prevents frequent resend requests                                                                                                                                      0.09s
  ⨯ can check email verification status                                                                                                                                                  0.08s
  ✓ cleanup expired tokens                                                                                                                                                               0.09s
  ⨯ send tenant verification api endpoint                                                                                                                                                0.19s
  ⨯ send platform verification api endpoint                                                                                                                                              0.09s
  ⨯ verify email api endpoint                                                                                                                                                            0.21s
  ⨯ check verification status api endpoint                                                                                                                                               0.08s
  ⨯ api validation errors                                                                                                                                                                0.09s

   FAIL  Tests\Feature\Auth\PasswordResetTest
  ✓ tenant user can request password reset                                                                                                                                               1.58s
  ✓ platform user can request password reset                                                                                                                                             0.75s
  ⨯ tenant user can reset password with valid token                                                                                                                                      0.23s
  ⨯ platform user can reset password with valid token                                                                                                                                    0.10s
  ⨯ reset fails with invalid token                                                                                                                                                       0.31s
  ✓ reset fails with mismatched passwords                                                                                                                                                0.09s
  ⨯ rate limiting prevents spam requests                                                                                                                                                 0.12s
  ⨯ token validation works correctly                                                                                                                                                     0.10s
  ⨯ expired tokens are rejected                                                                                                                                                          0.09s
  ⨯ nonexistent email returns same response for security                                                                                                                                 0.36s

   PASS  Tests\Feature\Auth\SimpleEmailVerificationTest
  ✓ simple mail sending                                                                                                                                                                  0.21s
  ✓ service sends email                                                                                                                                                                  0.08s

   FAIL  Tests\Feature\Auth\UserRegistrationTest
  ✓ can register tenant user                                                                                                                                                             0.22s
  ✓ can register platform account                                                                                                                                                        0.10s
  ✓ can register tenant with admin                                                                                                                                                       0.11s
  ✓ cannot register duplicate tenant user email                                                                                                                                          0.08s
  ✓ cannot register duplicate platform account email                                                                                                                                     0.08s
  ✓ can check email availability                                                                                                                                                         0.09s
  ✓ tenant user limit enforcement                                                                                                                                                        0.09s
  ✓ get registration stats                                                                                                                                                               0.09s
  ✓ validation rules                                                                                                                                                                     0.08s
  ⨯ tenant user registration api                                                                                                                                                         0.08s
  ⨯ platform account registration api                                                                                                                                                    0.08s
  ⨯ tenant with admin registration api                                                                                                                                                   0.26s
  ⨯ check email availability api                                                                                                                                                         0.11s
  ⨯ get registration stats api                                                                                                                                                           0.09s
  ⨯ api validation errors                                                                                                                                                                0.20s

   FAIL  Tests\Feature\Authentication\DataIsolationInfrastructureTest
  ⨯ tenant can only access own customers
  ⨯ tenant cannot access other tenant customers
  ⨯ tenant can only access own products
  ⨯ tenant cannot access other tenant products
  ⨯ tenant can only access own orders
  ⨯ tenant cannot access other tenant orders
  ⨯ tenant can only access own vendors
  ⨯ tenant cannot access other tenant vendors
  ⨯ platform account cannot access tenant specific data
  ⨯ platform account can access platform specific data
  ⨯ tenant cannot create data for other tenants
  ⨯ tenant cannot update data from other tenants
  ⨯ tenant cannot delete data from other tenants
  ⨯ api endpoint segregation is enforced
  ⨯ middleware prevents tenant context manipulation
  ⨯ database schema isolation prevents cross tenant queries

   PASS  Tests\Feature\Authentication\PlatformAuthenticationFlowTest
  ✓ complete platform authentication flow works                                                                                                                                          0.18s
  ✓ platform manager has limited permissions                                                                                                                                             0.12s
  ✓ rate limiting prevents brute force attacks                                                                                                                                           0.11s
  ✓ inactive account cannot login                                                                                                                                                        0.09s
  ✓ suspended account cannot login                                                                                                                                                       0.21s
  ✓ last login timestamp is updated                                                                                                                                                      0.10s
  ✓ token refresh works                                                                                                                                                                  0.11s
  ✓ invalid email format is rejected                                                                                                                                                     0.09s
  ✓ empty credentials are rejected                                                                                                                                                       0.12s
  ✓ case insensitive email login works                                                                                                                                                   0.14s
  ✓ concurrent logins are allowed                                                                                                                                                        0.15s

   FAIL  Tests\Feature\Authentication\PlatformTenantContextSeparationTest
  ⨯ platform authentication returns platform context                                                                                                                                     0.16s
  ⨯ tenant authentication returns tenant context                                                                                                                                         0.17s
  ⨯ platform token cannot access tenant endpoints                                                                                                                                        0.26s
  ⨯ tenant token cannot access platform endpoints                                                                                                                                        0.22s
  ⨯ platform me endpoint returns platform account info                                                                                                                                   0.22s
  ⨯ tenant me endpoint returns tenant user info                                                                                                                                          0.12s
  ⨯ authentication contexts are completely isolated                                                                                                                                      0.14s
  ⨯ cross authentication attempts are rejected                                                                                                                                           0.09s
  ⨯ platform logout invalidates platform token only                                                                                                                                      0.12s
  ⨯ tenant logout invalidates tenant token only                                                                                                                                          0.13s
  ⨯ token validation respects context boundaries                                                                                                                                         0.18s

   FAIL  Tests\Feature\Authentication\RoutingAndMiddlewareTest
  ✓ platform routes are properly structured                                                                                                                                              0.10s
  ⨯ tenant routes are properly structured                                                                                                                                                0.09s
  ⨯ platform routes require platform authentication                                                                                                                                      0.21s
  ⨯ tenant routes require tenant authentication                                                                                                                                          0.10s
  ⨯ platform middleware validates account type                                                                                                                                           0.11s
  ⨯ tenant middleware validates account type                                                                                                                                             0.12s
  ✓ tenant middleware enforces tenant context                                                                                                                                            0.57s
  ✓ cors headers are properly set                                                                                                                                                        0.09s
  ⨯ rate limiting is applied per context                                                                                                                                                 0.14s
  ⨯ route model binding respects tenant scope                                                                                                                                            0.22s
  ⨯ api versioning is consistent                                                                                                                                                         0.08s
  ✓ options requests are handled for cors                                                                                                                                                0.08s
  ⨯ content type validation is enforced                                                                                                                                                  0.08s
  ✓ middleware execution order is correct                                                                                                                                                0.13s
  ⨯ error responses maintain context separation                                                                                                                                          0.08s

   PASS  Tests\Feature\Authentication\TenantAuthenticationFlowTest
  ✓ complete tenant authentication flow works                                                                                                                                            0.15s
  ✓ manager has limited permissions                                                                                                                                                      0.12s
  ✓ sales user has minimal permissions                                                                                                                                                   0.12s
  ✓ cross tenant authentication is prevented                                                                                                                                             0.10s
  ✓ inactive tenant prevents login                                                                                                                                                       0.10s
  ✓ expired subscription prevents login                                                                                                                                                  0.10s
  ✓ trial period allows login                                                                                                                                                            0.12s
  ✓ expired trial prevents login                                                                                                                                                         0.10s
  ✓ context based login works                                                                                                                                                            0.12s
  ✓ rate limiting is per tenant                                                                                                                                                          0.15s
  ✓ inactive user cannot login                                                                                                                                                           0.10s
  ✓ suspended user cannot login                                                                                                                                                          0.11s
  ✓ last login timestamp is updated                                                                                                                                                      0.12s
  ✓ user with multiple roles gets combined permissions                                                                                                                                   0.13s

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response                                                                                                                                        2.08s

   PASS  Tests\Feature\Notifications\MultiChannelDeliveryTest
  ✓ email fallback when sms fails                                                                                                                                                        0.18s
  ✓ email fallback when whatsapp fails                                                                                                                                                   0.09s
  ✓ retry logic for failed deliveries                                                                                                                                                    0.09s
  ✓ rate limiting per channel whatsapp                                                                                                                                                   0.08s
  ✓ rate limiting per channel sms                                                                                                                                                        0.08s
  ✓ batch notification sending                                                                                                                                                           0.13s
  ✓ multi channel delivery all channels enabled                                                                                                                                          0.09s
  ✓ multi channel delivery whatsapp only                                                                                                                                                 0.08s
  ✓ multi channel delivery sms only                                                                                                                                                      0.09s
  ✓ multi channel delivery no sms channels                                                                                                                                               0.09s
  ✓ channel priority order                                                                                                                                                               0.08s
  ✓ notification delivery tracking                                                                                                                                                       0.08s
  ✓ different notification types multi channel                                                                                                                                           0.09s
  ✓ whatsapp payload structure                                                                                                                                                           0.09s
  ✓ sms payload structure                                                                                                                                                                0.09s
  ✓ email payload structure                                                                                                                                                              0.15s
  ✓ database notification structure                                                                                                                                                      0.09s
  ✓ fallback to email when phone invalid                                                                                                                                                 0.08s
  ✓ channel delivery with customer preferences                                                                                                                                           0.09s
  ✓ retry on transient failure                                                                                                                                                           0.09s
  ✓ batch delivery performance                                                                                                                                                           0.49s
  ✓ notification queuing                                                                                                                                                                 0.08s
  ✓ multiple customers batch delivery                                                                                                                                                    0.10s
  ✓ channel disable preserves others                                                                                                                                                     0.09s
  ✓ rollout new notification channel                                                                                                                                                     0.08s
  ✓ gradual channel migration                                                                                                                                                            0.09s

   FAIL  Tests\Feature\Order\CompleteOrderLifecycleTest
  ⨯ complete order workflow from creation to completion                                                                                                                                  0.23s
  ⨯ order can be cancelled at pending stage                                                                                                                                              0.11s
  ⨯ order can be cancelled after approval                                                                                                                                                0.09s
  ⨯ multiple products in single order                                                                                                                                                    0.09s
  ⨯ order lifecycle respects tenant isolation                                                                                                                                            0.09s
  ⨯ concurrent orders for different customers                                                                                                                                            0.09s

   FAIL  Tests\Feature\Order\ErrorHandlingAndRecoveryTest
  ⨯ invalid order id throws exception                                                                                                                                                    0.21s
  ⨯ payment exceeding order total throws exception                                                                                                                                       0.08s
  ⨯ negative payment amount throws exception                                                                                                                                             0.10s
  ⨯ invalid percentage in downpayment throws exception                                                                                                                                   0.08s
  ✓ invalid quote price throws exception                                                                                                                                                 0.08s
  ✓ missing lead time throws exception                                                                                                                                                   0.09s
  ✓ invalid negotiation deadline throws exception                                                                                                                                        0.16s
  ✓ invalid concluded price throws exception                                                                                                                                             0.10s
  ✓ invalid concluded lead time throws exception                                                                                                                                         0.10s
  ✓ empty quote comparison throws exception                                                                                                                                              0.08s
  ⨯ cross tenant order access throws exception                                                                                                                                           0.08s
  ✓ cross vendor assignment throws exception                                                                                                                                             0.08s
  ⨯ order recovery after partial failure                                                                                                                                                 0.08s
  ⨯ order cancellation on error condition                                                                                                                                                0.08s
  ⨯ multiple payment attempts with error recovery                                                                                                                                        0.08s
  ⨯ negotiation recovery from validation errors                                                                                                                                          0.08s

   FAIL  Tests\Feature\Order\MultiVendorNegotiationTest
  ⨯ negotiate with multiple vendors sequentially                                                                                                                                         0.11s
  ✓ compare quotes from multiple vendors                                                                                                                                                 0.10s
  ✓ vendor with lowest price selected                                                                                                                                                    0.09s
  ✓ vendor with best lead time selected                                                                                                                                                  0.09s
  ⨯ price negotiation round escalation                                                                                                                                                   0.09s
  ✓ negotiation deadline and urgency                                                                                                                                                     0.09s
  ⨯ negotiation escalation workflow                                                                                                                                                      0.09s
  ✓ multi tenant vendor negotiation isolation                                                                                                                                            0.09s

   FAIL  Tests\Feature\Order\PaymentProcessingTest
  ⨯ full payment processing workflow                                                                                                                                                     0.09s
  ⨯ downpayment and final payment                                                                                                                                                        0.09s
  ⨯ partial payment tracking                                                                                                                                                             0.09s
  ✓ payment amount validation                                                                                                                                                            0.08s
  ✓ negative payment amount rejected                                                                                                                                                     0.09s
  ⨯ invoice generation for payment tracking                                                                                                                                              0.08s
  ⨯ payment method recording                                                                                                                                                             0.09s
  ⨯ multiple payment transactions same order                                                                                                                                             0.09s
  ⨯ payment processing multi tenant isolation                                                                                                                                            0.09s

   FAIL  Tests\Feature\ShippingTest
  ⨯ calculate shipping cost
  ⨯ create shipment
  ⨯ process shipment
  ⨯ cannot process non pending shipment
  ⨯ update tracking
  ⨯ cancel shipment
  ⨯ cannot cancel delivered shipment
  ⨯ shipment has correct delivery status
  ⨯ get latest tracking event
  ⨯ shipping method scopes
  ⨯ shipment scopes

   PASS  Tests\Feature\TenantIsolationTest
  ✓ tenant a cannot access tenant b customers                                                                                                                                            0.09s
  ✓ tenant b cannot access tenant a products                                                                                                                                             0.09s
  ✓ orders are properly scoped to tenant                                                                                                                                                 0.09s
  ✓ cross tenant relationships are prevented                                                                                                                                             0.08s
  ✓ tenant data counts are isolated                                                                                                                                                      0.08s
  ✓ tenant switching works correctly                                                                                                                                                     0.08s
  ✓ tenant models automatically get tenant id                                                                                                                                            0.08s

   PASS  Tests\Feature\Tenant\Api\AnalyticsSegmentationExportTest
  ✓ customer segmentation endpoint returns distribution                                                                                                                                  0.30s
  ✓ vendor analytics endpoint returns summary                                                                                                                                            0.18s
  ✓ analytics export endpoints return data                                                                                                                                               0.21s
  ✓ inventory reconciliation flow and export                                                                                                                                             0.75s

   PASS  Tests\Feature\Tenant\Api\CustomerVendorSearchExportTest
  ✓ customer search returns segmentation data                                                                                                                                            0.14s
  ✓ customer export streams csv                                                                                                                                                          0.31s
  ✓ vendor search includes performance metrics                                                                                                                                           0.21s
  ✓ vendor export respects min score filter                                                                                                                                              0.16s
  ✓ product taxonomy helpers return data                                                                                                                                                 0.31s

   PASS  Tests\Feature\Tenant\Api\InventoryControllerTest
  ✓ can create location and set stock                                                                                                                                                    0.17s
  ✓ transfer stock between locations updates balances                                                                                                                                    0.24s
  ✓ reserve and release stock updates balances                                                                                                                                           0.34s
  ✓ run reconciliation async dispatches job                                                                                                                                              0.22s
  ✓ reconciliation job balances item and logs variance                                                                                                                                   0.20s
  ✓ reconciliation job accounts for global reservations                                                                                                                                  0.21s

   PASS  Tests\Feature\Tenant\Api\MultiTenantIsolationTest
  ✓ tenant a cannot see tenant b orders                                                                                                                                                  0.16s
  ✓ tenant a cannot access tenant b order detail                                                                                                                                         0.18s
  ✓ tenant a cannot see tenant b customers                                                                                                                                               0.11s
  ✓ tenant a cannot access tenant b customer detail                                                                                                                                      0.10s
  ✓ tenant a cannot see tenant b products                                                                                                                                                0.17s
  ✓ tenant a cannot see tenant b vendors                                                                                                                                                 0.11s
  ✓ tenant a cannot update tenant b order                                                                                                                                                0.32s
  ✓ tenant a cannot delete tenant b customer                                                                                                                                             0.10s
  ✓ orders include only tenant specific customers                                                                                                                                        0.17s
  ✓ analytics only show tenant data                                                                                                                                                      0.23s
  ✓ dashboard stats isolated by tenant                                                                                                                                                   0.24s
  ✓ switching tenant context works correctly                                                                                                                                             0.24s
  ✓ database queries automatically scope by tenant                                                                                                                                       0.12s

   PASS  Tests\Feature\Tenant\Api\OrderApiTest
  ✓ can list orders                                                                                                                                                                      0.34s
  ✓ order list excludes other tenant data                                                                                                                                                0.12s
  ✓ can filter orders by status                                                                                                                                                          0.12s
  ✓ can create order                                                                                                                                                                     0.12s
  ✓ can show order detail                                                                                                                                                                0.11s
  ✓ can update order                                                                                                                                                                     0.11s
  ✓ can update order status                                                                                                                                                              0.15s
  ✓ cannot update to invalid status                                                                                                                                                      0.10s
  ✓ can ship order with tracking number                                                                                                                                                  0.13s
  ✓ can cancel order with reason                                                                                                                                                         0.11s
  ✓ can get available transitions                                                                                                                                                        0.11s
  ✓ cannot update other tenant order                                                                                                                                                     0.11s
  ✓ cannot delete other tenant order                                                                                                                                                     0.11s
  ✓ cannot access other tenant orders                                                                                                                                                    0.11s
  ✓ order search works correctly                                                                                                                                                         0.21s
  ✓ order date range filter works                                                                                                                                                        0.25s
  ✓ status endpoint is tenant scoped                                                                                                                                                     0.24s
  ✓ customer endpoint is tenant scoped                                                                                                                                                   0.13s
  ✓ quotations endpoint is tenant scoped                                                                                                                                                 0.22s

   WARN  Tests\Feature\Tenant\Api\PaymentRefundTest
  - initiate refund → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund status tracking → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - vendor reversal disbursement → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - payment reconciliation after refund → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund with multiple partial amounts → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - cannot refund more than paid → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund with zero amount rejected → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund status pending on creation → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund status completed after processing → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund reason stored → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund timestamp recorded → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - list refunds for order → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund payment method preserved → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund audit trail → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund cannot be initiated on unpaid order → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund updates order payment status → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund creates transaction record → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund isolation between tenants → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund approval workflow → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  - refund rejection workflow → Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\EmailVerificationTest > can send verification email for tenant user
  The expected [App\Mail\Auth\EmailVerificationMail] mailable was not queued.
Failed asserting that false is true.

  at vendor\laravel\framework\src\Illuminate\Support\Testing\Fakes\MailFake.php:173
    169▕         if (is_numeric($callback)) {
    170▕             return $this->assertQueuedTimes($mailable, $callback);
    171▕         }
    172▕
  ➜ 173▕         PHPUnit::assertTrue(
    174▕             $this->queued($mailable, $callback)->count() > 0,
    175▕             "The expected [{$mailable}] mailable was not queued."
    176▕         );
    177▕     }

  1   vendor\laravel\framework\src\Illuminate\Support\Testing\Fakes\MailFake.php:173
  2   vendor\laravel\framework\src\Illuminate\Support\Facades\Facade.php:355

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\EmailVerificationTest > can verify email with valid token
  Failed asserting that null is not null.

  at tests\Feature\Auth\EmailVerificationTest.php:119
    115▕         $this->assertTrue($result);
    116▕
    117▕         // Check that user is now verified
    118▕         $this->tenantUser->refresh();
  ➜ 119▕         $this->assertNotNull($this->tenantUser->email_verified_at);
    120▕
    121▕         // Check that verification record is marked as verified
    122▕         $verification->refresh();
    123▕         $this->assertTrue($verification->verified);

  1   tests\Feature\Auth\EmailVerificationTest.php:119

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\EmailVerificationTest > cannot resend verification if already verified
  Failed asserting that exception of type "Illuminate\Validation\ValidationException" is thrown.

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\EmailVerificationTest > can check email verification status
  Failed asserting that false is true.

  at tests\Feature\Auth\EmailVerificationTest.php:230
    226▕         $result = $this->emailVerificationService->isEmailVerified(
    227▕             $this->tenantUser->email,
    228▕             $this->tenant->id
    229▕         );
  ➜ 230▕         $this->assertTrue($result);
    231▕     }
    232▕
    233▕     public function test_cleanup_expired_tokens(): void
    234▕     {

  1   tests\Feature\Auth\EmailVerificationTest.php:230

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\EmailVerificationTest > send tenant verification api endpoint
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests\Feature\Auth\EmailVerificationTest.php:291
    287▕             'email' => $this->tenantUser->email,
    288▕             'tenant_id' => $this->tenant->id,
    289▕         ]);
    290▕
  ➜ 291▕         $response->assertStatus(200)
    292▕                 ->assertJson([
    293▕                     'success' => true,
    294▕                     'message' => 'If the email exists in our system, a verification link has been sent.'
    295▕                 ]);

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\EmailVerificationTest > send platform verification api endpoint
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests\Feature\Auth\EmailVerificationTest.php:306
    302▕         $response = $this->postJson('/api/v1/auth/platform/send-verification', [
    303▕             'email' => $this->platformUser->email,
    304▕         ]);
    305▕
  ➜ 306▕         $response->assertStatus(200)
    307▕                 ->assertJson([
    308▕                     'success' => true,
    309▕                     'message' => 'If the email exists in our system, a verification link has been sent.'
    310▕                 ]);

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\EmailVerificationTest > verify email api endpoint
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests\Feature\Auth\EmailVerificationTest.php:327
    323▕         $response = $this->postJson('/api/v1/auth/tenant/' . $this->tenant->id . '/verify-email', [
    324▕             'token' => $verification->token,
    325▕         ]);
    326▕
  ➜ 327▕         $response->assertStatus(200)
    328▕                 ->assertJson([
    329▕                     'success' => true,
    330▕                     'message' => 'Email verified successfully.'
    331▕                 ]);

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\EmailVerificationTest > check verification status api endpoint
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests\Feature\Auth\EmailVerificationTest.php:346
    342▕             'email' => $this->tenantUser->email,
    343▕             'tenant_id' => $this->tenant->id,
    344▕         ]));
    345▕
  ➜ 346▕         $response->assertStatus(200)
    347▕                 ->assertJson([
    348▕                     'success' => true,
    349▕                     'verified' => false
    350▕                 ]);

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\EmailVerificationTest > api validation errors
  Expected response status code [422] but received 404.
Failed asserting that 404 is identical to 422.

  at tests\Feature\Auth\EmailVerificationTest.php:375
    371▕         $response = $this->postJson('/api/v1/auth/tenant/' . $this->tenant->id . '/send-verification', [
    372▕             'tenant_id' => $this->tenant->id,
    373▕         ]);
    374▕
  ➜ 375▕         $response->assertStatus(422)
    376▕                 ->assertJsonValidationErrors(['email']);
    377▕
    378▕         // Invalid email format
    379▕         $response = $this->postJson('/api/v1/auth/tenant/' . $this->tenant->id . '/send-verification', [

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\PasswordResetTest > tenant user can reset password with valid token
  Expected response status code [200] but received 422.
Failed asserting that 422 is identical to 200.

The following errors occurred during the last request:

{
    "message": "The password field must contain at least one uppercase and one lowercase letter.",
    "errors": {
        "password": [
            "The password field must contain at least one uppercase and one lowercase letter."
        ]
    }
}

  at tests\Feature\Auth\PasswordResetTest.php:138
    134▕             'password' => $newPassword,
    135▕             'password_confirmation' => $newPassword
    136▕         ]);
    137▕
  ➜ 138▕         $response->assertStatus(200)
    139▕             ->assertJson([
    140▕                 'success' => true,
    141▕                 'message' => 'Password has been reset successfully.'
    142▕             ]);

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\PasswordResetTest > platform user can reset password with valid token
  Expected response status code [200] but received 422.
Failed asserting that 422 is identical to 200.

The following errors occurred during the last request:

{
    "message": "The password field must contain at least one uppercase and one lowercase letter.",
    "errors": {
        "password": [
            "The password field must contain at least one uppercase and one lowercase letter."
        ]
    }
}

  at tests\Feature\Auth\PasswordResetTest.php:176
    172▕             'password' => $newPassword,
    173▕             'password_confirmation' => $newPassword
    174▕         ]);
    175▕
  ➜ 176▕         $response->assertStatus(200)
    177▕             ->assertJson([
    178▕                 'success' => true,
    179▕                 'message' => 'Password has been reset successfully.'
    180▕             ]);

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\PasswordResetTest > reset fails with invalid token
  Unable to find JSON:

[{
    "success": false,
    "error": {
        "code": "INVALID_TOKEN",
        "message": "Invalid or expired reset token."
    }
}]

within response JSON:

[{
    "message": "The password field must contain at least one uppercase and one lowercase letter.",
    "errors": {
        "password": [
            "The password field must contain at least one uppercase and one lowercase letter."
        ]
    }
}].


Failed asserting that an array has the subset Array &0 [
    'success' => false,
    'error' => Array &1 [
        'code' => 'INVALID_TOKEN',
        'message' => 'Invalid or expired reset token.',
    ],
].
--- Expected
+++ Actual
@@ @@
       0 => 'The password field must contain at least one uppercase and one lowercase letter.',
     ),
   ),
-  'success' => false,
-  'error' =>
-  array (
-    'code' => 'INVALID_TOKEN',
-    'message' => 'Invalid or expired reset token.',
-  ),
 )

  at tests\Feature\Auth\PasswordResetTest.php:198
    194▕             'password_confirmation' => 'newpassword123@'
    195▕         ]);
    196▕
    197▕         $response->assertStatus(422)
  ➜ 198▕             ->assertJson([
    199▕                 'success' => false,
    200▕                 'error' => [
    201▕                     'code' => 'INVALID_TOKEN',
    202▕                     'message' => 'Invalid or expired reset token.'

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\PasswordResetTest > rate limiting prevents spam requests
  Expected response status code [422] but received 200.
Failed asserting that 200 is identical to 422.

  at tests\Feature\Auth\PasswordResetTest.php:231
    227▕                 'email' => $this->user->email
    228▕             ]);
    229▕         }
    230▕
  ➜ 231▕         $response->assertStatus(422)
    232▕             ->assertJsonValidationErrors(['email']);
    233▕     }
    234▕
    235▕     /** @test */

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\PasswordResetTest > token validation works correctly
  Expected response status code [200] but received 422.
Failed asserting that 422 is identical to 200.

The following errors occurred during the last request:

{
    "message": "Password must be at least 8 characters long. (and 3 more errors)",
    "errors": {
        "password": [
            "Password must be at least 8 characters long.",
            "The password field must contain at least one uppercase and one lowercase letter.",
            "The password field must contain at least one symbol.",
            "The password field must contain at least one number."
        ]
    }
}

  at tests\Feature\Auth\PasswordResetTest.php:252
    248▕             'password' => 'dummy',
    249▕             'password_confirmation' => 'dummy'
    250▕         ]);
    251▕
  ➜ 252▕         $response->assertStatus(200)
    253▕             ->assertJson([
    254▕                 'success' => true,
    255▕                 'data' => [
    256▕                     'valid' => true,

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\PasswordResetTest > expired tokens are rejected
  Unable to find JSON:

[{
    "success": false,
    "error": {
        "code": "INVALID_TOKEN"
    }
}]

within response JSON:

[{
    "message": "The password field must contain at least one uppercase and one lowercase letter.",
    "errors": {
        "password": [
            "The password field must contain at least one uppercase and one lowercase letter."
        ]
    }
}].


Failed asserting that an array has the subset Array &0 [
    'success' => false,
    'error' => Array &1 [
        'code' => 'INVALID_TOKEN',
    ],
].
--- Expected
+++ Actual
@@ @@
       0 => 'The password field must contain at least one uppercase and one lowercase letter.',
     ),
   ),
-  'success' => false,
-  'error' =>
-  array (
-    'code' => 'INVALID_TOKEN',
-  ),
 )

  at tests\Feature\Auth\PasswordResetTest.php:284
    280▕             'password_confirmation' => 'newpassword123@'
    281▕         ]);
    282▕
    283▕         $response->assertStatus(422)
  ➜ 284▕             ->assertJson([
    285▕                 'success' => false,
    286▕                 'error' => [
    287▕                     'code' => 'INVALID_TOKEN'
    288▕                 ]

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\PasswordResetTest > nonexistent email returns same response for security
  Expected response status code [200] but received 422.
Failed asserting that 422 is identical to 200.

The following errors occurred during the last request:

{
    "message": "Please provide a valid email address.",
    "errors": {
        "email": [
            "Please provide a valid email address."
        ]
    }
}

  at tests\Feature\Auth\PasswordResetTest.php:300
    296▕             'email' => 'nonexistent@example.com'
    297▕         ]);
    298▕
    299▕         // Should return same response to prevent email enumeration
  ➜ 300▕         $response->assertStatus(200)
    301▕             ->assertJson([
    302▕                 'success' => true,
    303▕                 'message' => 'If an account with that email exists, a password reset link has been sent.'
    304▕             ]);

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\UserRegistrationTest > tenant user registration api
  Expected response status code [201] but received 404.
Failed asserting that 404 is identical to 201.

  at tests\Feature\Auth\UserRegistrationTest.php:318
    314▕         ];
    315▕
    316▕         $response = $this->postJson("/api/v1/auth/tenant/{$this->tenant->id}/register", $userData);
    317▕
  ➜ 318▕         $response->assertStatus(201)
    319▕                 ->assertJson([
    320▕                     'success' => true,
    321▕                     'message' => 'User registered successfully. Please check your email to verify your account.',
    322▕                 ])

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\UserRegistrationTest > platform account registration api
  Expected response status code [201] but received 404.
Failed asserting that 404 is identical to 201.

  at tests\Feature\Auth\UserRegistrationTest.php:355
    351▕         ];
    352▕
    353▕         $response = $this->postJson('/api/v1/auth/platform/register', $accountData);
    354▕
  ➜ 355▕         $response->assertStatus(201)
    356▕                 ->assertJson([
    357▕                     'success' => true,
    358▕                     'message' => 'Platform account registered successfully. Please check your email to verify your account.',
    359▕                 ])

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\UserRegistrationTest > tenant with admin registration api
  Expected response status code [201] but received 500.
Failed asserting that 500 is identical to 201.

  at tests\Feature\Auth\UserRegistrationTest.php:399
    395▕         ];
    396▕
    397▕         $response = $this->postJson('/api/v1/auth/register-tenant', $requestData);
    398▕
  ➜ 399▕         $response->assertStatus(201)
    400▕                 ->assertJson([
    401▕                     'success' => true,
    402▕                     'message' => 'Tenant and admin user created successfully. Please check your email to verify the admin account.',
    403▕                 ])

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\UserRegistrationTest > check email availability api
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests\Feature\Auth\UserRegistrationTest.php:439
    435▕             'email' => $email,
    436▕             'tenant_id' => $this->tenant->id,
    437▕         ]);
    438▕
  ➜ 439▕         $response->assertStatus(200)
    440▕                 ->assertJson([
    441▕                     'success' => true,
    442▕                     'available' => true,
    443▕                 ]);

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\UserRegistrationTest > get registration stats api
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests\Feature\Auth\UserRegistrationTest.php:472
    468▕         }
    469▕
    470▕         $response = $this->getJson("/api/v1/auth/tenant/{$this->tenant->id}/registration-stats");
    471▕
  ➜ 472▕         $response->assertStatus(200)
    473▕                 ->assertJson([
    474▕                     'success' => true,
    475▕                 ])
    476▕                 ->assertJsonStructure([

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Auth\UserRegistrationTest > api validation errors
  Expected response status code [422] but received 404.
Failed asserting that 404 is identical to 422.

  at tests\Feature\Auth\UserRegistrationTest.php:494
    490▕             'email' => 'invalid-email',
    491▕             // missing name, password
    492▕         ]);
    493▕
  ➜ 494▕         $response->assertStatus(422)
    495▕                 ->assertJsonValidationErrors(['name', 'email', 'password']);
    496▕
    497▕         // Test invalid email format
    498▕         $response = $this->postJson('/api/v1/auth/platform/register', [

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > tenant can only access own customers                                                                 QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (238, 78ac0e75-e0dd-4161-95c4-bcf2f822e5b8, 418, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:58, 2025-12-03 09:05:58, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (418, customer1@example.com, 081234567890, active, 2025-12-03 09:05:58, 2025-12-03 09:05:58) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (238, 78ac0e75-e0dd-4161-95c4-bcf2f822e5b8, 418, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:58, 2025-12-03 09:05:58, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > tenant cannot access other tenant customers                                                          QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (239, 38944de2-bbc8-4f81-9392-f49a88d52861, 420, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:58, 2025-12-03 09:05:58, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (420, customer1@example.com, 081234567890, active, 2025-12-03 09:05:58, 2025-12-03 09:05:58) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (239, 38944de2-bbc8-4f81-9392-f49a88d52861, 420, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:58, 2025-12-03 09:05:58, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > tenant can only access own products                                                                  QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (240, 9fc09600-9fd0-45e9-ba50-b700302c0673, 422, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:58, 2025-12-03 09:05:58, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (422, customer1@example.com, 081234567890, active, 2025-12-03 09:05:58, 2025-12-03 09:05:58) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (240, 9fc09600-9fd0-45e9-ba50-b700302c0673, 422, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:58, 2025-12-03 09:05:58, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > tenant cannot access other tenant products                                                           QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (241, e57fe434-147b-4508-9f28-ee00e79408a3, 424, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (424, customer1@example.com, 081234567890, active, 2025-12-03 09:05:59, 2025-12-03 09:05:59) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (241, e57fe434-147b-4508-9f28-ee00e79408a3, 424, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > tenant can only access own orders                                                                    QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (242, ec97bf75-0925-4d70-a070-fc5b1dfc0d2a, 426, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (426, customer1@example.com, 081234567890, active, 2025-12-03 09:05:59, 2025-12-03 09:05:59) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (242, ec97bf75-0925-4d70-a070-fc5b1dfc0d2a, 426, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > tenant cannot access other tenant orders                                                             QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (243, 82cc4fbf-7a07-424a-86e0-f3521344e863, 428, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (428, customer1@example.com, 081234567890, active, 2025-12-03 09:05:59, 2025-12-03 09:05:59) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (243, 82cc4fbf-7a07-424a-86e0-f3521344e863, 428, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > tenant can only access own vendors                                                                   QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (244, 00ba1455-94a4-4a34-91d4-327c83e7a0f7, 430, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (430, customer1@example.com, 081234567890, active, 2025-12-03 09:05:59, 2025-12-03 09:05:59) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (244, 00ba1455-94a4-4a34-91d4-327c83e7a0f7, 430, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > tenant cannot access other tenant vendors                                                            QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (245, 0a5b7853-930f-469b-8878-2955daeea8dc, 432, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (432, customer1@example.com, 081234567890, active, 2025-12-03 09:05:59, 2025-12-03 09:05:59) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (245, 0a5b7853-930f-469b-8878-2955daeea8dc, 432, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > platform account cannot access tenant specific data                                                  QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (246, d379fc1a-5ce5-416a-98ae-563e0d38b456, 434, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (434, customer1@example.com, 081234567890, active, 2025-12-03 09:05:59, 2025-12-03 09:05:59) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (246, d379fc1a-5ce5-416a-98ae-563e0d38b456, 434, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > platform account can access platform specific data                                                   QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (247, ed87e2d1-94e3-4f4a-aef5-acf6f305fc1d, 436, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (436, customer1@example.com, 081234567890, active, 2025-12-03 09:05:59, 2025-12-03 09:05:59) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (247, ed87e2d1-94e3-4f4a-aef5-acf6f305fc1d, 436, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > tenant cannot create data for other tenants                                                          QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (248, 9aea04e9-8d6b-4a50-8e2b-92d6eb1c084e, 438, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (438, customer1@example.com, 081234567890, active, 2025-12-03 09:05:59, 2025-12-03 09:05:59) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (248, 9aea04e9-8d6b-4a50-8e2b-92d6eb1c084e, 438, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > tenant cannot update data from other tenants                                                         QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (249, f0064b95-82e3-4bd9-966e-fd7a686fbcc2, 440, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (440, customer1@example.com, 081234567890, active, 2025-12-03 09:05:59, 2025-12-03 09:05:59) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (249, f0064b95-82e3-4bd9-966e-fd7a686fbcc2, 440, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > tenant cannot delete data from other tenants                                                         QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (250, 57ecd2f3-89e9-44fb-b850-3e6dc586f329, 442, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (442, customer1@example.com, 081234567890, active, 2025-12-03 09:05:59, 2025-12-03 09:05:59) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (250, 57ecd2f3-89e9-44fb-b850-3e6dc586f329, 442, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:05
:59, 2025-12-03 09:05:59, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > api endpoint segregation is enforced                                                                 QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (251, 2592d533-ca57-45f1-bbb1-cd0e9232c5f0, 444, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:06
:00, 2025-12-03 09:06:00, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (444, customer1@example.com, 081234567890, active, 2025-12-03 09:06:00, 2025-12-03 09:06:00) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (251, 2592d533-ca57-45f1-bbb1-cd0e9232c5f0, 444, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:06
:00, 2025-12-03 09:06:00, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > middleware prevents tenant context manipulation                                                      QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (252, d9530154-96bc-4ff2-b7dc-d0b454bfbd43, 446, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:06
:00, 2025-12-03 09:06:00, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (446, customer1@example.com, 081234567890, active, 2025-12-03 09:06:00, 2025-12-03 09:06:00) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (252, d9530154-96bc-4ff2-b7dc-d0b454bfbd43, 446, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:06
:00, 2025-12-03 09:06:00, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\DataIsolationInfrastructureTest > database schema isolation prevents cross tenant queries                                              QueryException
  SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (253, d883ebce-006a-4416-a6fd-db3eed96ee7d, 448, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:06
:00, 2025-12-03 09:06:00, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null) (Connection: pgsql, SQL: insert into "customers" ("tenant_id", "email", "phone", "status
", "updated_at", "created_at") values (448, customer1@example.com, 081234567890, active, 2025-12-03 09:06:00, 2025-12-03 09:06:00) returning "id")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[23502]: Not null violation: 7 ERROR:  null value in column "name" of relation "customers" violates not-null constraint
DETAIL:  Baris gagal berisi (253, d883ebce-006a-4416-a6fd-db3eed96ee7d, 448, null, null, customer1@example.com, 081234567890, active, individual, null, null, null, null, null, 2025-12-03 09:06
:00, 2025-12-03 09:06:00, null, null, null, null, null, null, null, null, null, null, 0, 0, null, null)")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\PlatformTenantContextSeparationTest > platform authentication returns platform context
  Failed asserting that an array has the key 'uuid'.

  at tests\Feature\Authentication\PlatformTenantContextSeparationTest.php:66
     62▕             'password' => 'password123',
     63▕         ]);
     64▕
     65▕         $response->assertStatus(200)
  ➜  66▕                 ->assertJsonStructure([
     67▕                     'access_token',
     68▕                     'token_type',
     69▕                     'expires_in',
     70▕                     'account' => [

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\PlatformTenantContextSeparationTest > tenant authentication returns tenant context
  Failed asserting that an array has the key 'uuid'.

  at tests\Feature\Authentication\PlatformTenantContextSeparationTest.php:97
     93▕             'tenant_id' => $this->tenant->id,
     94▕         ]);
     95▕
     96▕         $response->assertStatus(200)
  ➜  97▕                 ->assertJsonStructure([
     98▕                     'token',
     99▕                     'token_type',
    100▕                     'expires_in',
    101▕                     'user' => [

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\PlatformTenantContextSeparationTest > platform token cannot access tenant endpoints
  Expected response status code [401] but received 404.
Failed asserting that 404 is identical to 401.

  at tests\Feature\Authentication\PlatformTenantContextSeparationTest.php:142
    138▕             'Authorization' => "Bearer $platformToken",
    139▕             'Content-Type' => 'application/json',
    140▕         ])->getJson('/api/v1/tenant/orders');
    141▕
  ➜ 142▕         $response->assertStatus(401); // or 403, depending on implementation
    143▕     }
    144▕
    145▕     /** @test */
    146▕     public function tenant_token_cannot_access_platform_endpoints()

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\PlatformTenantContextSeparationTest > tenant token cannot access platform endpoints
  Expected response status code [401] but received 403.
Failed asserting that 403 is identical to 401.

  at tests\Feature\Authentication\PlatformTenantContextSeparationTest.php:163
    159▕             'Authorization' => "Bearer $tenantToken",
    160▕             'Content-Type' => 'application/json',
    161▕         ])->getJson('/api/v1/platform/tenants');
    162▕
  ➜ 163▕         $response->assertStatus(401); // or 403, depending on implementation
    164▕     }
    165▕
    166▕     /** @test */
    167▕     public function platform_me_endpoint_returns_platform_account_info()

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\PlatformTenantContextSeparationTest > platform me endpoint returns platform account info
  Expected response status code [200] but received 401.
Failed asserting that 401 is identical to 200.

  at tests\Feature\Authentication\PlatformTenantContextSeparationTest.php:173
    169▕         Sanctum::actingAs($this->platformAccount, [], 'platform');
    170▕
    171▕         $response = $this->getJson('/api/v1/platform/me');
    172▕
  ➜ 173▕         $response->assertStatus(200)
    174▕                 ->assertJsonStructure([
    175▕                     'account' => [
    176▕                         'id',
    177▕                         'uuid',

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\PlatformTenantContextSeparationTest > tenant me endpoint returns tenant user info
  Expected response status code [200] but received 401.
Failed asserting that 401 is identical to 200.

  at tests\Feature\Authentication\PlatformTenantContextSeparationTest.php:198
    194▕         Sanctum::actingAs($this->tenantUser, [], 'tenant');
    195▕
    196▕         $response = $this->getJson('/api/v1/tenant/me');
    197▕
  ➜ 198▕         $response->assertStatus(200)
    199▕                 ->assertJsonStructure([
    200▕                     'user' => [
    201▕                         'id',
    202▕                         'tenant_id',

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\PlatformTenantContextSeparationTest > authentication contexts are completely isolated
  Failed asserting that two strings are equal.
--- Expected
+++ Actual
@@ @@
-'platform_owner'
+'platform'

  at tests\Feature\Authentication\PlatformTenantContextSeparationTest.php:259
    255▕         $this->assertArrayHasKey('tenant', $tenantResponse->json());
    256▕         $this->assertArrayNotHasKey('account', $tenantResponse->json());
    257▕
    258▕         // Account types should be different
  ➜ 259▕         $this->assertEquals('platform_owner', $platformResponse->json('account_type'));
    260▕         $this->assertEquals('tenant_user', $tenantResponse->json('account_type'));
    261▕     }
    262▕
    263▕     /** @test */

  1   tests\Feature\Authentication\PlatformTenantContextSeparationTest.php:259

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\PlatformTenantContextSeparationTest > cross authentication attempts are rejected
  Expected response status code [401] but received 422.
Failed asserting that 422 is identical to 401.

The following errors occurred during the last request:

{
    "message": "Authentication failed",
    "errors": {
        "email": [
            "The provided credentials are incorrect."
        ]
    }
}

  at tests\Feature\Authentication\PlatformTenantContextSeparationTest.php:272
    268▕             'email' => 'tenant@example.com',
    269▕             'password' => 'password123',
    270▕         ]);
    271▕
  ➜ 272▕         $response->assertStatus(401);
    273▕
    274▕         // Try tenant login with platform credentials
    275▕         $response = $this->postJson('/api/v1/tenant/login', [
    276▕             'email' => 'platform@example.com',

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\PlatformTenantContextSeparationTest > platform logout invalidates platform token only
  Expected response status code [401] but received 200.
Failed asserting that 200 is identical to 401.

  at tests\Feature\Authentication\PlatformTenantContextSeparationTest.php:310
    306▕
    307▕         // Platform token should be invalid
    308▕         $this->withHeaders(['Authorization' => "Bearer $platformToken"])
    309▕              ->getJson('/api/v1/platform/me')
  ➜ 310▕              ->assertStatus(401);
    311▕
    312▕         // Tenant token should still be valid
    313▕         $this->withHeaders(['Authorization' => "Bearer $tenantToken"])
    314▕              ->getJson('/api/v1/tenant/me')

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\PlatformTenantContextSeparationTest > tenant logout invalidates tenant token only
  Expected response status code [401] but received 200.
Failed asserting that 200 is identical to 401.

  at tests\Feature\Authentication\PlatformTenantContextSeparationTest.php:344
    340▕
    341▕         // Tenant token should be invalid
    342▕         $this->withHeaders(['Authorization' => "Bearer $tenantToken"])
    343▕              ->getJson('/api/v1/tenant/me')
  ➜ 344▕              ->assertStatus(401);
    345▕
    346▕         // Platform token should still be valid
    347▕         $this->withHeaders(['Authorization' => "Bearer $platformToken"])
    348▕              ->getJson('/api/v1/platform/me')

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\PlatformTenantContextSeparationTest > token validation respects context boundaries
  Expected response status code [200] but received 405.
Failed asserting that 405 is identical to 200.

  at tests\Feature\Authentication\PlatformTenantContextSeparationTest.php:373
    369▕
    370▕         // Platform token validation in platform context
    371▕         $this->withHeaders(['Authorization' => "Bearer $platformToken"])
    372▕              ->getJson('/api/v1/platform/validate-token')
  ➜ 373▕              ->assertStatus(200)
    374▕              ->assertJsonFragment(['valid' => true]);
    375▕
    376▕         // Tenant token validation in tenant context
    377▕         $this->withHeaders(['Authorization' => "Bearer $tenantToken"])

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\RoutingAndMiddlewareTest > tenant routes are properly structured
  Tenant route /api/v1/tenant/validate-token should exist
Failed asserting that false is true.

  at tests\Feature\Authentication\RoutingAndMiddlewareTest.php:130
    126▕                     break;
    127▕                 }
    128▕             }
    129▕
  ➜ 130▕             $this->assertTrue($routeExists, "Tenant route {$route} should exist");
    131▕         }
    132▕     }
    133▕
    134▕     /** @test */

  1   tests\Feature\Authentication\RoutingAndMiddlewareTest.php:130

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\RoutingAndMiddlewareTest > platform routes require platform authentication
  Expected response status code [401] but received 500.
Failed asserting that 500 is identical to 401.

The following exception occurred during the last request:

TypeError: App\Application\Auth\UseCases\AuthenticationService::getPlatformAccountPermissions(): Argument #1 ($account) must be of type App\Infrastructure\Persistence\Eloquent\AccountEloquentM
odel, App\Infrastructure\Persistence\Eloquent\UserEloquentModel given, called in D:\worksites\canvastack\projects\stencil\backend\app\Infrastructure\Presentation\Http\Controllers\Platform\Auth
Controller.php on line 166 and defined in D:\worksites\canvastack\projects\stencil\backend\app\Application\Auth\UseCases\AuthenticationService.php:219
Stack trace:
#0 D:\worksites\canvastack\projects\stencil\backend\app\Infrastructure\Presentation\Http\Controllers\Platform\AuthController.php(166): App\Application\Auth\UseCases\AuthenticationService->getP
latformAccountPermissions(Object(App\Infrastructure\Persistence\Eloquent\UserEloquentModel))
#1 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Controller.php(54): App\Infrastructure\Presentation\Http\Controllers\Platform\AuthController
->me(Object(Illuminate\Http\Request))
#2 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\ControllerDispatcher.php(43): Illuminate\Routing\Controller->callAction('me', Array)
#3 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Route.php(259): Illuminate\Routing\ControllerDispatcher->dispatch(Object(Illuminate\Routing\
Route), Object(App\Infrastructure\Presentation\Http\Controllers\Platform\AuthController), 'me')
#4 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Route.php(205): Illuminate\Routing\Route->runController()
#5 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Router.php(806): Illuminate\Routing\Route->run()
#6 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(144): Illuminate\Routing\Router->Illuminate\Routing\{closure}(Object(Illuminat
e\Http\Request))
#7 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Middleware\SubstituteBindings.php(50): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{cl
osure}(Object(Illuminate\Http\Request))
#8 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Routing\Middleware\SubstituteBindings->handle(Object(Illumina
te\Http\Request), Object(Closure))
#9 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Middleware\ThrottleRequests.php(159): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{clo
sure}(Object(Illuminate\Http\Request))
#10 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Middleware\ThrottleRequests.php(125): Illuminate\Routing\Middleware\ThrottleRequests->handl
eRequest(Object(Illuminate\Http\Request), Object(Closure), Array)
#11 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Middleware\ThrottleRequests.php(87): Illuminate\Routing\Middleware\ThrottleRequests->handle
RequestUsingNamedLimiter(Object(Illuminate\Http\Request), Object(Closure), 'api', Object(Closure))
#12 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Routing\Middleware\ThrottleRequests->handle(Object(Illuminat
e\Http\Request), Object(Closure), 'api')
#13 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Auth\Middleware\Authenticate.php(57): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{closure}(O
bject(Illuminate\Http\Request))
#14 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Auth\Middleware\Authenticate->handle(Object(Illuminate\Http\
Request), Object(Closure), 'sanctum')
#15 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(119): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{closure}(Object(Illu
minate\Http\Request))
#16 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Router.php(805): Illuminate\Pipeline\Pipeline->then(Object(Closure))
#17 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Router.php(784): Illuminate\Routing\Router->runRouteWithinStack(Object(Illuminate\Routing\R
oute), Object(Illuminate\Http\Request))
#18 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Router.php(748): Illuminate\Routing\Router->runRoute(Object(Illuminate\Http\Request), Objec
t(Illuminate\Routing\Route))
#19 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Router.php(737): Illuminate\Routing\Router->dispatchToRoute(Object(Illuminate\Http\Request)
)
#20 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Kernel.php(200): Illuminate\Routing\Router->dispatch(Object(Illuminate\Http\Request
))
#21 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(144): Illuminate\Foundation\Http\Kernel->Illuminate\Foundation\Http\{closure}
(Object(Illuminate\Http\Request))
#22 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Middleware\TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->Illuminate\Pipe
line\{closure}(Object(Illuminate\Http\Request))
#23 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull.php(31): Illuminate\Foundation\Http\Middleware
\TransformsRequest->handle(Object(Illuminate\Http\Request), Object(Closure))
#24 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull->handle
(Object(Illuminate\Http\Request), Object(Closure))
#25 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Middleware\TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->Illuminate\Pipe
line\{closure}(Object(Illuminate\Http\Request))
#26 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Middleware\TrimStrings.php(40): Illuminate\Foundation\Http\Middleware\TransformsReq
uest->handle(Object(Illuminate\Http\Request), Object(Closure))
#27 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Foundation\Http\Middleware\TrimStrings->handle(Object(Illumi
nate\Http\Request), Object(Closure))
#28 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Middleware\ValidatePostSize.php(27): Illuminate\Pipeline\Pipeline->Illuminate\Pipel
ine\{closure}(Object(Illuminate\Http\Request))
#29 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Foundation\Http\Middleware\ValidatePostSize->handle(Object(I
lluminate\Http\Request), Object(Closure))
#30 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance.php(99): Illuminate\Pipeline\Pipeline->
Illuminate\Pipeline\{closure}(Object(Illuminate\Http\Request))
#31 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance-
>handle(Object(Illuminate\Http\Request), Object(Closure))
#32 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Http\Middleware\HandleCors.php(62): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{closure}(Obj
ect(Illuminate\Http\Request))
#33 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Http\Middleware\HandleCors->handle(Object(Illuminate\Http\Re
quest), Object(Closure))
#34 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Http\Middleware\TrustProxies.php(39): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{closure}(O
bject(Illuminate\Http\Request))
#35 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Http\Middleware\TrustProxies->handle(Object(Illuminate\Http\
Request), Object(Closure))
#36 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(119): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{closure}(Object(Illu
minate\Http\Request))
#37 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Kernel.php(175): Illuminate\Pipeline\Pipeline->then(Object(Closure))
#38 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Kernel.php(144): Illuminate\Foundation\Http\Kernel->sendRequestThroughRouter(Object
(Illuminate\Http\Request))
#39 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Testing\Concerns\MakesHttpRequests.php(585): Illuminate\Foundation\Http\Kernel->handle(O
bject(Illuminate\Http\Request))
#40 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Testing\Concerns\MakesHttpRequests.php(551): Illuminate\Foundation\Testing\TestCase->cal
l('GET', '/api/v1/platfor...', Array, Array, Array, Array, '[]')
#41 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Testing\Concerns\MakesHttpRequests.php(359): Illuminate\Foundation\Testing\TestCase->jso
n('GET', '/api/v1/platfor...', Array, Array, 0)
#42 D:\worksites\canvastack\projects\stencil\backend\tests\Feature\Authentication\RoutingAndMiddlewareTest.php(151): Illuminate\Foundation\Testing\TestCase->getJson('/api/v1/platfor...')
#43 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestCase.php(1188): Tests\Feature\Authentication\RoutingAndMiddlewareTest->platform_routes_require_pla
tform_authentication()
#44 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Testing\TestCase.php(62): PHPUnit\Framework\TestCase->runTest()
#45 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestCase.php(687): Illuminate\Foundation\Testing\TestCase->runTest()
#46 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestRunner.php(104): PHPUnit\Framework\TestCase->runBare()
#47 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestCase.php(517): PHPUnit\Framework\TestRunner->run(Object(Tests\Feature\Authentication\RoutingAndMid
dlewareTest))
#48 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestSuite.php(378): PHPUnit\Framework\TestCase->run()
#49 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestSuite.php(378): PHPUnit\Framework\TestSuite->run()
#50 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestSuite.php(378): PHPUnit\Framework\TestSuite->run()
#51 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\TextUI\TestRunner.php(62): PHPUnit\Framework\TestSuite->run()
#52 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\TextUI\Application.php(199): PHPUnit\TextUI\TestRunner->run(Object(PHPUnit\TextUI\Configuration\Configuration),
Object(PHPUnit\Runner\ResultCache\DefaultResultCache), Object(PHPUnit\Framework\TestSuite))
#53 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\phpunit(104): PHPUnit\TextUI\Application->run(Array)
#54 {main}

----------------------------------------------------------------------------------

App\Application\Auth\UseCases\AuthenticationService::getPlatformAccountPermissions(): Argument #1 ($account) must be of type App\Infrastructure\Persistence\Eloquent\AccountEloquentModel, App\I
nfrastructure\Persistence\Eloquent\UserEloquentModel given, called in D:\worksites\canvastack\projects\stencil\backend\app\Infrastructure\Presentation\Http\Controllers\Platform\AuthController.
php on line 166

  at tests\Feature\Authentication\RoutingAndMiddlewareTest.php:152
    148▕             // Test with tenant token (wrong type)
    149▕             $tenantToken = $this->getTenantToken();
    150▕             $response = $this->withHeaders(['Authorization' => "Bearer $tenantToken"])
    151▕                              ->getJson($route);
  ➜ 152▕             $response->assertStatus(401);
    153▕         }
    154▕     }
    155▕
    156▕     /** @test */

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\RoutingAndMiddlewareTest > tenant routes require tenant authentication
  Expected response status code [401] but received 500.
Failed asserting that 500 is identical to 401.

  at tests\Feature\Authentication\RoutingAndMiddlewareTest.php:175
    171▕             // Test with platform token (wrong type)
    172▕             $platformToken = $this->getPlatformToken();
    173▕             $response = $this->withHeaders(['Authorization' => "Bearer $platformToken"])
    174▕                              ->getJson($route);
  ➜ 175▕             $response->assertStatus(401);
    176▕         }
    177▕     }
    178▕
    179▕     /** @test */

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\RoutingAndMiddlewareTest > platform middleware validates account type
  Expected response status code [401] but received 500.
Failed asserting that 500 is identical to 401.

  at tests\Feature\Authentication\RoutingAndMiddlewareTest.php:192
    188▕
    189▕         // Platform token should NOT work on tenant routes
    190▕         $response = $this->withHeaders(['Authorization' => "Bearer $platformToken"])
    191▕                          ->getJson('/api/v1/tenant/me');
  ➜ 192▕         $response->assertStatus(401);
    193▕     }
    194▕
    195▕     /** @test */
    196▕     public function tenant_middleware_validates_account_type()

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\RoutingAndMiddlewareTest > tenant middleware validates account type
  Expected response status code [401] but received 500.
Failed asserting that 500 is identical to 401.

The following exception occurred during the last request:

TypeError: App\Application\Auth\UseCases\AuthenticationService::getPlatformAccountPermissions(): Argument #1 ($account) must be of type App\Infrastructure\Persistence\Eloquent\AccountEloquentM
odel, App\Infrastructure\Persistence\Eloquent\UserEloquentModel given, called in D:\worksites\canvastack\projects\stencil\backend\app\Infrastructure\Presentation\Http\Controllers\Platform\Auth
Controller.php on line 166 and defined in D:\worksites\canvastack\projects\stencil\backend\app\Application\Auth\UseCases\AuthenticationService.php:219
Stack trace:
#0 D:\worksites\canvastack\projects\stencil\backend\app\Infrastructure\Presentation\Http\Controllers\Platform\AuthController.php(166): App\Application\Auth\UseCases\AuthenticationService->getP
latformAccountPermissions(Object(App\Infrastructure\Persistence\Eloquent\UserEloquentModel))
#1 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Controller.php(54): App\Infrastructure\Presentation\Http\Controllers\Platform\AuthController
->me(Object(Illuminate\Http\Request))
#2 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\ControllerDispatcher.php(43): Illuminate\Routing\Controller->callAction('me', Array)
#3 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Route.php(259): Illuminate\Routing\ControllerDispatcher->dispatch(Object(Illuminate\Routing\
Route), Object(App\Infrastructure\Presentation\Http\Controllers\Platform\AuthController), 'me')
#4 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Route.php(205): Illuminate\Routing\Route->runController()
#5 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Router.php(806): Illuminate\Routing\Route->run()
#6 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(144): Illuminate\Routing\Router->Illuminate\Routing\{closure}(Object(Illuminat
e\Http\Request))
#7 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Middleware\SubstituteBindings.php(50): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{cl
osure}(Object(Illuminate\Http\Request))
#8 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Routing\Middleware\SubstituteBindings->handle(Object(Illumina
te\Http\Request), Object(Closure))
#9 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Middleware\ThrottleRequests.php(159): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{clo
sure}(Object(Illuminate\Http\Request))
#10 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Middleware\ThrottleRequests.php(125): Illuminate\Routing\Middleware\ThrottleRequests->handl
eRequest(Object(Illuminate\Http\Request), Object(Closure), Array)
#11 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Middleware\ThrottleRequests.php(87): Illuminate\Routing\Middleware\ThrottleRequests->handle
RequestUsingNamedLimiter(Object(Illuminate\Http\Request), Object(Closure), 'api', Object(Closure))
#12 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Routing\Middleware\ThrottleRequests->handle(Object(Illuminat
e\Http\Request), Object(Closure), 'api')
#13 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Auth\Middleware\Authenticate.php(57): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{closure}(O
bject(Illuminate\Http\Request))
#14 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Auth\Middleware\Authenticate->handle(Object(Illuminate\Http\
Request), Object(Closure), 'sanctum')
#15 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(119): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{closure}(Object(Illu
minate\Http\Request))
#16 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Router.php(805): Illuminate\Pipeline\Pipeline->then(Object(Closure))
#17 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Router.php(784): Illuminate\Routing\Router->runRouteWithinStack(Object(Illuminate\Routing\R
oute), Object(Illuminate\Http\Request))
#18 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Router.php(748): Illuminate\Routing\Router->runRoute(Object(Illuminate\Http\Request), Objec
t(Illuminate\Routing\Route))
#19 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Routing\Router.php(737): Illuminate\Routing\Router->dispatchToRoute(Object(Illuminate\Http\Request)
)
#20 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Kernel.php(200): Illuminate\Routing\Router->dispatch(Object(Illuminate\Http\Request
))
#21 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(144): Illuminate\Foundation\Http\Kernel->Illuminate\Foundation\Http\{closure}
(Object(Illuminate\Http\Request))
#22 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Middleware\TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->Illuminate\Pipe
line\{closure}(Object(Illuminate\Http\Request))
#23 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull.php(31): Illuminate\Foundation\Http\Middleware
\TransformsRequest->handle(Object(Illuminate\Http\Request), Object(Closure))
#24 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull->handle
(Object(Illuminate\Http\Request), Object(Closure))
#25 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Middleware\TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->Illuminate\Pipe
line\{closure}(Object(Illuminate\Http\Request))
#26 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Middleware\TrimStrings.php(40): Illuminate\Foundation\Http\Middleware\TransformsReq
uest->handle(Object(Illuminate\Http\Request), Object(Closure))
#27 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Foundation\Http\Middleware\TrimStrings->handle(Object(Illumi
nate\Http\Request), Object(Closure))
#28 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Middleware\ValidatePostSize.php(27): Illuminate\Pipeline\Pipeline->Illuminate\Pipel
ine\{closure}(Object(Illuminate\Http\Request))
#29 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Foundation\Http\Middleware\ValidatePostSize->handle(Object(I
lluminate\Http\Request), Object(Closure))
#30 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance.php(99): Illuminate\Pipeline\Pipeline->
Illuminate\Pipeline\{closure}(Object(Illuminate\Http\Request))
#31 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance-
>handle(Object(Illuminate\Http\Request), Object(Closure))
#32 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Http\Middleware\HandleCors.php(62): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{closure}(Obj
ect(Illuminate\Http\Request))
#33 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Http\Middleware\HandleCors->handle(Object(Illuminate\Http\Re
quest), Object(Closure))
#34 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Http\Middleware\TrustProxies.php(39): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{closure}(O
bject(Illuminate\Http\Request))
#35 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(183): Illuminate\Http\Middleware\TrustProxies->handle(Object(Illuminate\Http\
Request), Object(Closure))
#36 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Pipeline\Pipeline.php(119): Illuminate\Pipeline\Pipeline->Illuminate\Pipeline\{closure}(Object(Illu
minate\Http\Request))
#37 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Kernel.php(175): Illuminate\Pipeline\Pipeline->then(Object(Closure))
#38 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Http\Kernel.php(144): Illuminate\Foundation\Http\Kernel->sendRequestThroughRouter(Object
(Illuminate\Http\Request))
#39 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Testing\Concerns\MakesHttpRequests.php(585): Illuminate\Foundation\Http\Kernel->handle(O
bject(Illuminate\Http\Request))
#40 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Testing\Concerns\MakesHttpRequests.php(551): Illuminate\Foundation\Testing\TestCase->cal
l('GET', '/api/v1/platfor...', Array, Array, Array, Array, '[]')
#41 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Testing\Concerns\MakesHttpRequests.php(359): Illuminate\Foundation\Testing\TestCase->jso
n('GET', '/api/v1/platfor...', Array, Array, 0)
#42 D:\worksites\canvastack\projects\stencil\backend\tests\Feature\Authentication\RoutingAndMiddlewareTest.php(207): Illuminate\Foundation\Testing\TestCase->getJson('/api/v1/platfor...')
#43 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestCase.php(1188): Tests\Feature\Authentication\RoutingAndMiddlewareTest->tenant_middleware_validates
_account_type()
#44 D:\worksites\canvastack\projects\stencil\backend\vendor\laravel\framework\src\Illuminate\Foundation\Testing\TestCase.php(62): PHPUnit\Framework\TestCase->runTest()
#45 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestCase.php(687): Illuminate\Foundation\Testing\TestCase->runTest()
#46 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestRunner.php(104): PHPUnit\Framework\TestCase->runBare()
#47 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestCase.php(517): PHPUnit\Framework\TestRunner->run(Object(Tests\Feature\Authentication\RoutingAndMid
dlewareTest))
#48 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestSuite.php(378): PHPUnit\Framework\TestCase->run()
#49 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestSuite.php(378): PHPUnit\Framework\TestSuite->run()
#50 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\Framework\TestSuite.php(378): PHPUnit\Framework\TestSuite->run()
#51 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\TextUI\TestRunner.php(62): PHPUnit\Framework\TestSuite->run()
#52 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\src\TextUI\Application.php(199): PHPUnit\TextUI\TestRunner->run(Object(PHPUnit\TextUI\Configuration\Configuration),
Object(PHPUnit\Runner\ResultCache\DefaultResultCache), Object(PHPUnit\Framework\TestSuite))
#53 D:\worksites\canvastack\projects\stencil\backend\vendor\phpunit\phpunit\phpunit(104): PHPUnit\TextUI\Application->run(Array)
#54 {main}

----------------------------------------------------------------------------------

App\Application\Auth\UseCases\AuthenticationService::getPlatformAccountPermissions(): Argument #1 ($account) must be of type App\Infrastructure\Persistence\Eloquent\AccountEloquentModel, App\I
nfrastructure\Persistence\Eloquent\UserEloquentModel given, called in D:\worksites\canvastack\projects\stencil\backend\app\Infrastructure\Presentation\Http\Controllers\Platform\AuthController.
php on line 166

  at tests\Feature\Authentication\RoutingAndMiddlewareTest.php:208
    204▕
    205▕         // Tenant token should NOT work on platform routes
    206▕         $response = $this->withHeaders(['Authorization' => "Bearer $tenantToken"])
    207▕                          ->getJson('/api/v1/platform/me');
  ➜ 208▕         $response->assertStatus(401);
    209▕     }
    210▕
    211▕     /** @test */
    212▕     public function tenant_middleware_enforces_tenant_context()

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\RoutingAndMiddlewareTest > rate limiting is applied per context
  Expected response status code [200] but received 500.
Failed asserting that 500 is identical to 200.

  at tests\Feature\Authentication\RoutingAndMiddlewareTest.php:267
    263▕         // Multiple tenant requests should work independently
    264▕         for ($i = 0; $i < 5; $i++) {
    265▕             $response = $this->withHeaders(['Authorization' => "Bearer $tenantToken"])
    266▕                              ->getJson('/api/v1/tenant/me');
  ➜ 267▕             $response->assertStatus(200);
    268▕         }
    269▕     }
    270▕
    271▕     /** @test */

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\RoutingAndMiddlewareTest > route model binding respects tenant scope
  Expected response status code [201] but received 422.
Failed asserting that 422 is identical to 201.

The following errors occurred during the last request:

{
    "message": "Tipe customer wajib dipilih",
    "errors": {
        "customer_type": [
            "Tipe customer wajib dipilih"
        ]
    }
}

  at tests\Feature\Authentication\RoutingAndMiddlewareTest.php:285
    281▕                              'phone' => '081234567890',
    282▕                              'type' => 'individual',
    283▕                          ]);
    284▕
  ➜ 285▕         $response->assertStatus(201);
    286▕         $customerId = $response->json('data.id');
    287▕
    288▕         // Access customer by ID (should work)
    289▕         $response = $this->withHeaders(['Authorization' => "Bearer $tenantToken"])

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\RoutingAndMiddlewareTest > api versioning is consistent                                                                                         Error
  Call to undefined method Tests\Feature\Authentication\RoutingAndMiddlewareTest::assertStringContains()

  at tests\Feature\Authentication\RoutingAndMiddlewareTest.php:312
    308▕             '/api/v1/tenant/me',
    309▕         ];
    310▕
    311▕         foreach ($routes as $route) {
  ➜ 312▕             $this->assertStringContains('/api/v1/', $route, "Route should use v1 API versioning");
    313▕         }
    314▕     }
    315▕
    316▕     /** @test */

  1   tests\Feature\Authentication\RoutingAndMiddlewareTest.php:312

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\RoutingAndMiddlewareTest > content type validation is enforced                                                                              TypeError
  Illuminate\Foundation\Testing\TestCase::post(): Argument #2 ($data) must be of type array, string given, called in D:\worksites\canvastack\projects\stencil\backend\tests\Feature\Authenticati
on\RoutingAndMiddlewareTest.php on line 331

  at tests\Feature\Authentication\RoutingAndMiddlewareTest.php:331
    327▕     public function content_type_validation_is_enforced()
    328▕     {
    329▕         // Test with invalid content type
    330▕         $response = $this->withHeaders(['Content-Type' => 'text/plain'])
  ➜ 331▕                          ->post('/api/v1/platform/login', 'invalid data');
    332▕
    333▕         // Should handle invalid content type gracefully
    334▕         $this->assertContains($response->status(), [400, 415, 422]);
    335▕

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Authentication\RoutingAndMiddlewareTest > error responses maintain context separation
  Expected response status code [401] but received 422.
Failed asserting that 422 is identical to 401.

The following errors occurred during the last request:

{
    "message": "Authentication failed",
    "errors": {
        "email": [
            "The provided credentials are incorrect."
        ]
    }
}

  at tests\Feature\Authentication\RoutingAndMiddlewareTest.php:376
    372▕             'email' => 'invalid@example.com',
    373▕             'password' => 'wrongpassword'
    374▕         ]);
    375▕
  ➜ 376▕         $response->assertStatus(401);
    377▕         $this->assertStringNotContainsStringIgnoringCase('tenant', $response->getContent());
    378▕
    379▕         // Tenant error responses
    380▕         $response = $this->postJson('/api/v1/tenant/login', [

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\CompleteOrderLifecycleTest > complete order workflow from creation to completion                                                                QueryException
  SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « 9f30393c-ce69-4c4e-88f7-561b8f5d8c34 »
CONTEXT:  unnamed portal parameter $1 = '...' (Connection: pgsql, SQL: select exists(select * from "orders" where "tenant_id" = 9f30393c-ce69-4c4e-88f7-561b8f5d8c34 and "order_number" = ORD-20
251203090612-4C6DB7 and "orders"."deleted_at" is null) as "exists")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « 9f30393c-ce69-4c4e-88f7-561b8f5
d8c34 »
CONTEXT:  unnamed portal parameter $1 = '...'")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\CompleteOrderLifecycleTest > order can be cancelled at pending stage                                                                            QueryException
  SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « a3bea74e-5c83-4f33-85ec-95c8cbc99e1a »
CONTEXT:  unnamed portal parameter $1 = '...' (Connection: pgsql, SQL: select exists(select * from "orders" where "tenant_id" = a3bea74e-5c83-4f33-85ec-95c8cbc99e1a and "order_number" = ORD-20
251203090612-3B6BE5 and "orders"."deleted_at" is null) as "exists")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « a3bea74e-5c83-4f33-85ec-95c8cbc
99e1a »
CONTEXT:  unnamed portal parameter $1 = '...'")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\CompleteOrderLifecycleTest > order can be cancelled after approval                                                                              QueryException
  SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « e920cb23-f8de-461f-8468-de4c22a68d88 »
CONTEXT:  unnamed portal parameter $1 = '...' (Connection: pgsql, SQL: select exists(select * from "orders" where "tenant_id" = e920cb23-f8de-461f-8468-de4c22a68d88 and "order_number" = ORD-20
251203090612-977C19 and "orders"."deleted_at" is null) as "exists")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « e920cb23-f8de-461f-8468-de4c22a
68d88 »
CONTEXT:  unnamed portal parameter $1 = '...'")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\CompleteOrderLifecycleTest > multiple products in single order                                                                                  QueryException
  SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « f161ff50-3488-4747-8cdf-96776ce9807c »
CONTEXT:  unnamed portal parameter $1 = '...' (Connection: pgsql, SQL: select exists(select * from "orders" where "tenant_id" = f161ff50-3488-4747-8cdf-96776ce9807c and "order_number" = ORD-20
251203090612-FF544C and "orders"."deleted_at" is null) as "exists")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « f161ff50-3488-4747-8cdf-96776ce
9807c »
CONTEXT:  unnamed portal parameter $1 = '...'")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\CompleteOrderLifecycleTest > order lifecycle respects tenant isolation                                                                          QueryException
  SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « 745cc139-cc13-4821-a620-328713dd399a »
CONTEXT:  unnamed portal parameter $1 = '...' (Connection: pgsql, SQL: select exists(select * from "orders" where "tenant_id" = 745cc139-cc13-4821-a620-328713dd399a and "order_number" = ORD-20
251203090612-69D502 and "orders"."deleted_at" is null) as "exists")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « 745cc139-cc13-4821-a620-328713d
d399a »
CONTEXT:  unnamed portal parameter $1 = '...'")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\CompleteOrderLifecycleTest > concurrent orders for different customers                                                                          QueryException
  SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « 6cf467bd-06a7-4917-8cba-ab856c46c4a2 »
CONTEXT:  unnamed portal parameter $1 = '...' (Connection: pgsql, SQL: select exists(select * from "orders" where "tenant_id" = 6cf467bd-06a7-4917-8cba-ab856c46c4a2 and "order_number" = ORD-20
251203090613-71365E and "orders"."deleted_at" is null) as "exists")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « 6cf467bd-06a7-4917-8cba-ab856c4
6c4a2 »
CONTEXT:  unnamed portal parameter $1 = '...'")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\ErrorHandlingAndRecoveryTest > invalid order id throws exception
  Failed asserting that exception message 'Invalid UUID format: nonexistent-order-id' contains 'Order not found'.

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\ErrorHandlingAndRecoveryTest > payment exceeding order total throws exception
  Failed asserting that exception message 'Invalid UUID format: 526' contains 'Payment amount exceeds order total'.

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\ErrorHandlingAndRecoveryTest > negative payment amount throws exception
  Failed asserting that exception message 'Invalid UUID format: 527' contains 'Payment amount must be non-negative'.

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\ErrorHandlingAndRecoveryTest > invalid percentage in downpayment throws exception
  Failed asserting that exception message 'Invalid UUID format: 528' contains 'Percentage must be between 0 and 100'.

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\ErrorHandlingAndRecoveryTest > cross tenant order access throws exception                                                             InvalidArgumentException
  Invalid UUID format: 535

  at app\Domain\Shared\ValueObjects\UuidValueObject.php:34
     30▕
     31▕     private function validate(string $value): void
     32▕     {
     33▕         if (!RamseyUuid::isValid($value)) {
  ➜  34▕             throw new InvalidArgumentException("Invalid UUID format: {$value}");
     35▕         }
     36▕     }
     37▕
     38▕     public function getValue(): string

  1   app\Domain\Shared\ValueObjects\UuidValueObject.php:34
  2   app\Domain\Shared\ValueObjects\UuidValueObject.php:17

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\ErrorHandlingAndRecoveryTest > order recovery after partial failure                                                                   InvalidArgumentException
  Invalid UUID format: 539

  at app\Domain\Shared\ValueObjects\UuidValueObject.php:34
     30▕
     31▕     private function validate(string $value): void
     32▕     {
     33▕         if (!RamseyUuid::isValid($value)) {
  ➜  34▕             throw new InvalidArgumentException("Invalid UUID format: {$value}");
     35▕         }
     36▕     }
     37▕
     38▕     public function getValue(): string

  1   app\Domain\Shared\ValueObjects\UuidValueObject.php:34
  2   app\Domain\Shared\ValueObjects\UuidValueObject.php:17

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\ErrorHandlingAndRecoveryTest > order cancellation on error condition                                                                  InvalidArgumentException
  Invalid UUID format: 540

  at app\Domain\Shared\ValueObjects\UuidValueObject.php:34
     30▕
     31▕     private function validate(string $value): void
     32▕     {
     33▕         if (!RamseyUuid::isValid($value)) {
  ➜  34▕             throw new InvalidArgumentException("Invalid UUID format: {$value}");
     35▕         }
     36▕     }
     37▕
     38▕     public function getValue(): string

  1   app\Domain\Shared\ValueObjects\UuidValueObject.php:34
  2   app\Domain\Shared\ValueObjects\UuidValueObject.php:17

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\ErrorHandlingAndRecoveryTest > multiple payment attempts with error recovery                                                          InvalidArgumentException
  Invalid UUID format: 541

  at app\Domain\Shared\ValueObjects\UuidValueObject.php:34
     30▕
     31▕     private function validate(string $value): void
     32▕     {
     33▕         if (!RamseyUuid::isValid($value)) {
  ➜  34▕             throw new InvalidArgumentException("Invalid UUID format: {$value}");
     35▕         }
     36▕     }
     37▕
     38▕     public function getValue(): string

  1   app\Domain\Shared\ValueObjects\UuidValueObject.php:34
  2   app\Domain\Shared\ValueObjects\UuidValueObject.php:17

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\ErrorHandlingAndRecoveryTest > negotiation recovery from validation errors                                                            InvalidArgumentException
  Invalid UUID format: 542

  at app\Domain\Shared\ValueObjects\UuidValueObject.php:34
     30▕
     31▕     private function validate(string $value): void
     32▕     {
     33▕         if (!RamseyUuid::isValid($value)) {
  ➜  34▕             throw new InvalidArgumentException("Invalid UUID format: {$value}");
     35▕         }
     36▕     }
     37▕
     38▕     public function getValue(): string

  1   app\Domain\Shared\ValueObjects\UuidValueObject.php:34
  2   app\Domain\Shared\ValueObjects\UuidValueObject.php:17

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\MultiVendorNegotiationTest > negotiate with multiple vendors sequentially                                                                       QueryException
  SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « 59ddc875-4be3-4228-b98d-bb30f03cfdd0 »
CONTEXT:  unnamed portal parameter $1 = '...' (Connection: pgsql, SQL: select exists(select * from "orders" where "tenant_id" = 59ddc875-4be3-4228-b98d-bb30f03cfdd0 and "order_number" = ORD-20
251203090614-8D69D4 and "orders"."deleted_at" is null) as "exists")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « 59ddc875-4be3-4228-b98d-bb30f03
cfdd0 »
CONTEXT:  unnamed portal parameter $1 = '...'")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\MultiVendorNegotiationTest > price negotiation round escalation                                                                                 QueryException
  SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « 90913e79-ab2d-44dd-98f7-3eede06fee70 »
CONTEXT:  unnamed portal parameter $1 = '...' (Connection: pgsql, SQL: select exists(select * from "orders" where "tenant_id" = 90913e79-ab2d-44dd-98f7-3eede06fee70 and "order_number" = ORD-20
251203090615-447B6C and "orders"."deleted_at" is null) as "exists")

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
      NunoMaduro\Collision\Exceptions\TestException::("SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  sintaks masukan tidak valid untuk tipe bigint : « 90913e79-ab2d-44dd-98f7-3eede06
fee70 »
CONTEXT:  unnamed portal parameter $1 = '...'")

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\MultiVendorNegotiationTest > negotiation escalation workflow                                                                          InvalidArgumentException
  Invalid UUID format: test-order-id

  at app\Domain\Shared\ValueObjects\UuidValueObject.php:34
     30▕
     31▕     private function validate(string $value): void
     32▕     {
     33▕         if (!RamseyUuid::isValid($value)) {
  ➜  34▕             throw new InvalidArgumentException("Invalid UUID format: {$value}");
     35▕         }
     36▕     }
     37▕
     38▕     public function getValue(): string

  1   app\Domain\Shared\ValueObjects\UuidValueObject.php:34
  2   app\Domain\Shared\ValueObjects\UuidValueObject.php:17

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\PaymentProcessingTest > full payment processing workflow                                                                              InvalidArgumentException
  Invalid UUID format: 552

  at app\Domain\Shared\ValueObjects\UuidValueObject.php:34
     30▕
     31▕     private function validate(string $value): void
     32▕     {
     33▕         if (!RamseyUuid::isValid($value)) {
  ➜  34▕             throw new InvalidArgumentException("Invalid UUID format: {$value}");
     35▕         }
     36▕     }
     37▕
     38▕     public function getValue(): string

  1   app\Domain\Shared\ValueObjects\UuidValueObject.php:34
  2   app\Domain\Shared\ValueObjects\UuidValueObject.php:17

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\PaymentProcessingTest > downpayment and final payment                                                                                 InvalidArgumentException
  Invalid UUID format: 553

  at app\Domain\Shared\ValueObjects\UuidValueObject.php:34
     30▕
     31▕     private function validate(string $value): void
     32▕     {
     33▕         if (!RamseyUuid::isValid($value)) {
  ➜  34▕             throw new InvalidArgumentException("Invalid UUID format: {$value}");
     35▕         }
     36▕     }
     37▕
     38▕     public function getValue(): string

  1   app\Domain\Shared\ValueObjects\UuidValueObject.php:34
  2   app\Domain\Shared\ValueObjects\UuidValueObject.php:17

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\PaymentProcessingTest > partial payment tracking                                                                                      InvalidArgumentException
  Invalid UUID format: 554

  at app\Domain\Shared\ValueObjects\UuidValueObject.php:34
     30▕
     31▕     private function validate(string $value): void
     32▕     {
     33▕         if (!RamseyUuid::isValid($value)) {
  ➜  34▕             throw new InvalidArgumentException("Invalid UUID format: {$value}");
     35▕         }
     36▕     }
     37▕
     38▕     public function getValue(): string

  1   app\Domain\Shared\ValueObjects\UuidValueObject.php:34
  2   app\Domain\Shared\ValueObjects\UuidValueObject.php:17

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\PaymentProcessingTest > invoice generation for payment tracking                                                                       InvalidArgumentException
  Invalid UUID format: 557

  at app\Domain\Shared\ValueObjects\UuidValueObject.php:34
     30▕
     31▕     private function validate(string $value): void
     32▕     {
     33▕         if (!RamseyUuid::isValid($value)) {
  ➜  34▕             throw new InvalidArgumentException("Invalid UUID format: {$value}");
     35▕         }
     36▕     }
     37▕
     38▕     public function getValue(): string

  1   app\Domain\Shared\ValueObjects\UuidValueObject.php:34
  2   app\Domain\Shared\ValueObjects\UuidValueObject.php:17

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\PaymentProcessingTest > payment method recording                                                                                      InvalidArgumentException
  Invalid UUID format: 558

  at app\Domain\Shared\ValueObjects\UuidValueObject.php:34
     30▕
     31▕     private function validate(string $value): void
     32▕     {
     33▕         if (!RamseyUuid::isValid($value)) {
  ➜  34▕             throw new InvalidArgumentException("Invalid UUID format: {$value}");
     35▕         }
     36▕     }
     37▕
     38▕     public function getValue(): string

  1   app\Domain\Shared\ValueObjects\UuidValueObject.php:34
  2   app\Domain\Shared\ValueObjects\UuidValueObject.php:17

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\PaymentProcessingTest > multiple payment transactions same order                                                                      InvalidArgumentException
  Invalid UUID format: 559

  at app\Domain\Shared\ValueObjects\UuidValueObject.php:34
     30▕
     31▕     private function validate(string $value): void
     32▕     {
     33▕         if (!RamseyUuid::isValid($value)) {
  ➜  34▕             throw new InvalidArgumentException("Invalid UUID format: {$value}");
     35▕         }
     36▕     }
     37▕
     38▕     public function getValue(): string

  1   app\Domain\Shared\ValueObjects\UuidValueObject.php:34
  2   app\Domain\Shared\ValueObjects\UuidValueObject.php:17

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\Order\PaymentProcessingTest > payment processing multi tenant isolation                                                                     InvalidArgumentException
  Invalid UUID format: 560

  at app\Domain\Shared\ValueObjects\UuidValueObject.php:34
     30▕
     31▕     private function validate(string $value): void
     32▕     {
     33▕         if (!RamseyUuid::isValid($value)) {
  ➜  34▕             throw new InvalidArgumentException("Invalid UUID format: {$value}");
     35▕         }
     36▕     }
     37▕
     38▕     public function getValue(): string

  1   app\Domain\Shared\ValueObjects\UuidValueObject.php:34
  2   app\Domain\Shared\ValueObjects\UuidValueObject.php:17

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ShippingTest > calculate shipping cost                                                                                                                         Error
  Class "Database\Factories\Infrastructure\Persistence\Eloquent\Models\ShippingMethodFactory" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
    825▕     public static function factoryForModel(string $modelName)
    826▕     {
    827▕         $factory = static::resolveFactoryName($modelName);
    828▕
  ➜ 829▕         return $factory::new();
    830▕     }
    831▕
    832▕     /**
    833▕      * Specify the callback that should be invoked to guess factory names based on dynamic relationship names.

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\HasFactory.php:16

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ShippingTest > create shipment                                                                                                                                 Error
  Class "Database\Factories\Infrastructure\Persistence\Eloquent\Models\ShippingMethodFactory" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
    825▕     public static function factoryForModel(string $modelName)
    826▕     {
    827▕         $factory = static::resolveFactoryName($modelName);
    828▕
  ➜ 829▕         return $factory::new();
    830▕     }
    831▕
    832▕     /**
    833▕      * Specify the callback that should be invoked to guess factory names based on dynamic relationship names.

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\HasFactory.php:16

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ShippingTest > process shipment                                                                                                                                Error
  Class "Database\Factories\Infrastructure\Persistence\Eloquent\Models\ShippingMethodFactory" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
    825▕     public static function factoryForModel(string $modelName)
    826▕     {
    827▕         $factory = static::resolveFactoryName($modelName);
    828▕
  ➜ 829▕         return $factory::new();
    830▕     }
    831▕
    832▕     /**
    833▕      * Specify the callback that should be invoked to guess factory names based on dynamic relationship names.

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\HasFactory.php:16

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ShippingTest > cannot process non pending shipment                                                                                                             Error
  Class "Database\Factories\Infrastructure\Persistence\Eloquent\Models\ShippingMethodFactory" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
    825▕     public static function factoryForModel(string $modelName)
    826▕     {
    827▕         $factory = static::resolveFactoryName($modelName);
    828▕
  ➜ 829▕         return $factory::new();
    830▕     }
    831▕
    832▕     /**
    833▕      * Specify the callback that should be invoked to guess factory names based on dynamic relationship names.

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\HasFactory.php:16

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ShippingTest > update tracking                                                                                                                                 Error
  Class "Database\Factories\Infrastructure\Persistence\Eloquent\Models\ShippingMethodFactory" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
    825▕     public static function factoryForModel(string $modelName)
    826▕     {
    827▕         $factory = static::resolveFactoryName($modelName);
    828▕
  ➜ 829▕         return $factory::new();
    830▕     }
    831▕
    832▕     /**
    833▕      * Specify the callback that should be invoked to guess factory names based on dynamic relationship names.

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\HasFactory.php:16

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ShippingTest > cancel shipment                                                                                                                                 Error
  Class "Database\Factories\Infrastructure\Persistence\Eloquent\Models\ShippingMethodFactory" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
    825▕     public static function factoryForModel(string $modelName)
    826▕     {
    827▕         $factory = static::resolveFactoryName($modelName);
    828▕
  ➜ 829▕         return $factory::new();
    830▕     }
    831▕
    832▕     /**
    833▕      * Specify the callback that should be invoked to guess factory names based on dynamic relationship names.

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\HasFactory.php:16

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ShippingTest > cannot cancel delivered shipment                                                                                                                Error
  Class "Database\Factories\Infrastructure\Persistence\Eloquent\Models\ShippingMethodFactory" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
    825▕     public static function factoryForModel(string $modelName)
    826▕     {
    827▕         $factory = static::resolveFactoryName($modelName);
    828▕
  ➜ 829▕         return $factory::new();
    830▕     }
    831▕
    832▕     /**
    833▕      * Specify the callback that should be invoked to guess factory names based on dynamic relationship names.

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\HasFactory.php:16

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ShippingTest > shipment has correct delivery status                                                                                                            Error
  Class "Database\Factories\Infrastructure\Persistence\Eloquent\Models\ShippingMethodFactory" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
    825▕     public static function factoryForModel(string $modelName)
    826▕     {
    827▕         $factory = static::resolveFactoryName($modelName);
    828▕
  ➜ 829▕         return $factory::new();
    830▕     }
    831▕
    832▕     /**
    833▕      * Specify the callback that should be invoked to guess factory names based on dynamic relationship names.

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\HasFactory.php:16

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ShippingTest > get latest tracking event                                                                                                                       Error
  Class "Database\Factories\Infrastructure\Persistence\Eloquent\Models\ShippingMethodFactory" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
    825▕     public static function factoryForModel(string $modelName)
    826▕     {
    827▕         $factory = static::resolveFactoryName($modelName);
    828▕
  ➜ 829▕         return $factory::new();
    830▕     }
    831▕
    832▕     /**
    833▕      * Specify the callback that should be invoked to guess factory names based on dynamic relationship names.

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\HasFactory.php:16

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ShippingTest > shipping method scopes                                                                                                                          Error
  Class "Database\Factories\Infrastructure\Persistence\Eloquent\Models\ShippingMethodFactory" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
    825▕     public static function factoryForModel(string $modelName)
    826▕     {
    827▕         $factory = static::resolveFactoryName($modelName);
    828▕
  ➜ 829▕         return $factory::new();
    830▕     }
    831▕
    832▕     /**
    833▕      * Specify the callback that should be invoked to guess factory names based on dynamic relationship names.

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\HasFactory.php:16

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ShippingTest > shipment scopes                                                                                                                                 Error
  Class "Database\Factories\Infrastructure\Persistence\Eloquent\Models\ShippingMethodFactory" not found

  at vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
    825▕     public static function factoryForModel(string $modelName)
    826▕     {
    827▕         $factory = static::resolveFactoryName($modelName);
    828▕
  ➜ 829▕         return $factory::new();
    830▕     }
    831▕
    832▕     /**
    833▕      * Specify the callback that should be invoked to guess factory names based on dynamic relationship names.

  1   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\Factory.php:829
  2   vendor\laravel\framework\src\Illuminate\Database\Eloquent\Factories\HasFactory.php:16


  Tests:    95 failed, 20 skipped, 789 passed (2651 assertions)
  Duration: 101.78s
