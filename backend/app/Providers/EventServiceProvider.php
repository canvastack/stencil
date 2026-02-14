<?php

namespace App\Providers;

use App\Domain\Order\Events\OrderStatusChanged;
use App\Domain\Order\Listeners\BroadcastOrderStatusChanged;
use App\Domain\Order\Listeners\OrderStatusChangedListener;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        
        // Order Status Change Events
        OrderStatusChanged::class => [
            OrderStatusChangedListener::class,
            BroadcastOrderStatusChanged::class,
        ],
        
        // Quote Response Events
        \App\Domain\Quote\Events\VendorRespondedToQuote::class => [
            \App\Domain\Quote\Listeners\SendVendorResponseNotification::class,
            \App\Domain\Quote\Listeners\SendAdminQuoteAcceptedNotification::class,
        ],
        
        // Admin Counter Offer Events
        \App\Domain\Quote\Events\AdminCounteredQuoteEvent::class => [
            \App\Domain\Quote\Listeners\SendAdminCounterOfferNotification::class,
        ],
        
        // Vendor Production Update Events
        \App\Domain\VendorProduction\Events\ProductionUpdateCreated::class => [
            \App\Domain\VendorProduction\Listeners\SendProductionUpdateNotification::class,
            \App\Domain\VendorProduction\Listeners\SendProductionDelayedNotification::class,
        ],
        
        \App\Domain\VendorProduction\Events\ProductionCompleted::class => [
            \App\Domain\VendorProduction\Listeners\SendProductionCompletedNotification::class,
        ],
    ];

    protected $subscribe = [
        \App\Domain\Order\Listeners\SendOrderNotifications::class,
        \App\Application\Order\Subscribers\OrderWorkflowSubscriber::class,
        \App\Application\Order\Subscribers\PaymentWorkflowSubscriber::class,
        \App\Application\Order\Subscribers\NotificationSubscriber::class,
        \App\Domain\Payment\Listeners\RefundWorkflowNotificationListener::class,
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
