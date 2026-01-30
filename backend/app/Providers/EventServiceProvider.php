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
