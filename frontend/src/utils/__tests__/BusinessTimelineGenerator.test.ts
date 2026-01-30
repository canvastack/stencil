/**
 * Business Timeline Generator Tests
 * 
 * Tests for PT CEX business timeline generation functionality
 * Ensures proper event mapping and business flow alignment
 */

import { describe, it, expect } from 'vitest';
import { OrderStatus } from '@/types/order';
import { 
  BusinessTimelineGenerator, 
  type BusinessTimelineEvent,
  type TimelineGenerationOptions 
} from '@/utils/BusinessTimelineGenerator';
import { BusinessStage } from '@/utils/OrderProgressCalculator';

describe('BusinessTimelineGenerator', () => {
  const mockOrderEvents = [
    {
      id: '1',
      action: 'Order Created',
      status: OrderStatus.New,
      timestamp: '2024-01-27T10:00:00Z',
      actor: 'System',
      description: 'Order was created by customer'
    },
    {
      id: '2',
      action: 'Status Updated',
      status: OrderStatus.Pending,
      timestamp: '2024-01-27T11:00:00Z',
      actor: 'Admin User',
      description: 'Order moved to pending status'
    },
    {
      id: '3',
      action: 'Vendor Sourcing Started',
      status: OrderStatus.VendorSourcing,
      timestamp: '2024-01-27T14:00:00Z',
      actor: 'Admin User',
      description: 'Started looking for suitable vendors'
    }
  ];

  describe('generateTimeline', () => {
    it('should generate business timeline from order events', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        mockOrderEvents,
        OrderStatus.VendorSourcing
      );

      expect(timeline).toBeDefined();
      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline[0]).toHaveProperty('stage');
      expect(timeline[0]).toHaveProperty('indonesianTitle');
      expect(timeline[0]).toHaveProperty('indonesianDescription');
    });

    it('should include synthetic events for missing stages', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        [],
        OrderStatus.InProduction
      );

      // Should have synthetic events for all completed stages
      expect(timeline.length).toBeGreaterThan(0);
      
      const syntheticEvents = timeline.filter(e => e.metadata?.synthetic);
      expect(syntheticEvents.length).toBeGreaterThan(0);
    });

    it('should sort events by timestamp (newest first)', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        mockOrderEvents,
        OrderStatus.VendorSourcing
      );

      for (let i = 0; i < timeline.length - 1; i++) {
        const currentTime = new Date(timeline[i].timestamp).getTime();
        const nextTime = new Date(timeline[i + 1].timestamp).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
      }
    });

    it('should respect maxEvents option', () => {
      const options: TimelineGenerationOptions = {
        maxEvents: 2
      };

      const timeline = BusinessTimelineGenerator.generateTimeline(
        mockOrderEvents,
        OrderStatus.Completed,
        options
      );

      expect(timeline.length).toBeLessThanOrEqual(2);
    });

    it('should filter system events when includeSystemEvents is false', () => {
      const options: TimelineGenerationOptions = {
        includeSystemEvents: false
      };

      const timeline = BusinessTimelineGenerator.generateTimeline(
        mockOrderEvents,
        OrderStatus.VendorSourcing,
        options
      );

      const systemEvents = timeline.filter(e => e.actorType === 'system');
      // Should have fewer system events (only synthetic ones)
      expect(systemEvents.length).toBeLessThan(timeline.length);
    });
  });

  describe('event mapping', () => {
    it('should correctly map order status to business stage', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        [mockOrderEvents[2]], // VendorSourcing event
        OrderStatus.VendorSourcing
      );

      const vendorSourcingEvent = timeline.find(e => e.status === OrderStatus.VendorSourcing);
      expect(vendorSourcingEvent?.stage).toBe(BusinessStage.VENDOR_SOURCING);
    });

    it('should determine correct actor type', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        mockOrderEvents,
        OrderStatus.VendorSourcing
      );

      const systemEvent = timeline.find(e => e.actor === 'System');
      expect(systemEvent?.actorType).toBe('system');

      const adminEvent = timeline.find(e => e.actor === 'Admin User');
      expect(adminEvent?.actorType).toBe('admin');
    });

    it('should categorize events correctly', () => {
      const paymentEvent = {
        id: '4',
        action: 'Payment Received',
        status: OrderStatus.FullPayment,
        timestamp: '2024-01-28T10:00:00Z',
        actor: 'System',
        amount: 1000000
      };

      const timeline = BusinessTimelineGenerator.generateTimeline(
        [paymentEvent],
        OrderStatus.FullPayment
      );

      const event = timeline.find(e => e.status === OrderStatus.FullPayment);
      expect(event?.category).toBe('payment');
      expect(event?.isBusinessCritical).toBe(true);
    });

    it('should extract metadata correctly', () => {
      const eventWithMetadata = {
        id: '5',
        action: 'Payment Processed',
        status: OrderStatus.PartialPayment,
        timestamp: '2024-01-28T10:00:00Z',
        actor: 'System',
        amount: 500000,
        payment_method: 'Bank Transfer',
        notes: 'DP 50% received'
      };

      const timeline = BusinessTimelineGenerator.generateTimeline(
        [eventWithMetadata],
        OrderStatus.PartialPayment
      );

      // Find the event that came from our input (not synthetic)
      const event = timeline.find(e => !e.metadata?.synthetic);
      expect(event).toBeDefined();
      expect(event!.metadata).toHaveProperty('amount', 500000);
      expect(event!.metadata).toHaveProperty('payment_method', 'Bank Transfer');
      expect(event!.metadata).toHaveProperty('notes', 'DP 50% received');
    });
  });

  describe('business logic', () => {
    it('should identify business critical events', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        mockOrderEvents,
        OrderStatus.FullPayment
      );

      const paymentEvents = timeline.filter(e => e.category === 'payment');
      paymentEvents.forEach(event => {
        expect(event.isBusinessCritical).toBe(true);
      });
    });

    it('should identify events requiring action', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        [],
        OrderStatus.VendorSourcing
      );

      const currentEvent = timeline.find(e => e.stage === BusinessStage.VENDOR_SOURCING);
      expect(currentEvent?.requiresAction).toBe(true);
      expect(currentEvent?.nextActions).toBeDefined();
      expect(currentEvent?.nextActions?.length).toBeGreaterThan(0);
    });

    it('should generate appropriate next actions', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        [],
        OrderStatus.VendorNegotiation
      );

      const currentEvent = timeline.find(e => e.stage === BusinessStage.VENDOR_NEGOTIATION);
      expect(currentEvent?.nextActions).toContain('Negosiasi harga');
      expect(currentEvent?.nextActions).toContain('Finalisasi syarat');
    });

    it('should handle terminal statuses correctly', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        [],
        OrderStatus.Completed
      );

      const completedEvent = timeline.find(e => e.stage === BusinessStage.COMPLETED);
      expect(completedEvent?.requiresAction).toBe(false);
      expect(completedEvent?.nextActions).toEqual(['Arsip pesanan', 'Minta feedback']);
    });
  });

  describe('Indonesian localization', () => {
    it('should provide Indonesian titles and descriptions', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        mockOrderEvents,
        OrderStatus.VendorSourcing,
        { useIndonesian: true }
      );

      timeline.forEach(event => {
        expect(event.indonesianTitle).toBeDefined();
        expect(event.indonesianDescription).toBeDefined();
        expect(event.indonesianTitle.length).toBeGreaterThan(0);
        expect(event.indonesianDescription.length).toBeGreaterThan(0);
      });
    });

    it('should provide Indonesian next actions', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        [],
        OrderStatus.CustomerQuote,
        { useIndonesian: true }
      );

      const currentEvent = timeline.find(e => e.stage === BusinessStage.CUSTOMER_QUOTE);
      expect(currentEvent?.nextActions).toContain('Kirim quote ke customer');
      expect(currentEvent?.nextActions).toContain('Follow up quote');
    });
  });

  describe('getTimelineStats', () => {
    it('should calculate timeline statistics correctly', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        mockOrderEvents,
        OrderStatus.InProduction
      );

      const stats = BusinessTimelineGenerator.getTimelineStats(timeline);

      expect(stats.totalEvents).toBe(timeline.length);
      expect(stats.businessCriticalEvents).toBeGreaterThanOrEqual(0);
      expect(stats.actionRequiredEvents).toBeGreaterThanOrEqual(0);
      expect(stats.eventsByCategory).toBeDefined();
      expect(stats.eventsByActor).toBeDefined();
      expect(stats.averageStageTime).toBeGreaterThanOrEqual(0);
    });

    it('should count events by category correctly', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        mockOrderEvents,
        OrderStatus.FullPayment
      );

      const stats = BusinessTimelineGenerator.getTimelineStats(timeline);

      const totalCategoryCounts = Object.values(stats.eventsByCategory).reduce((sum, count) => sum + count, 0);
      expect(totalCategoryCounts).toBe(timeline.length);
    });

    it('should count events by actor type correctly', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        mockOrderEvents,
        OrderStatus.Shipping
      );

      const stats = BusinessTimelineGenerator.getTimelineStats(timeline);

      const totalActorCounts = Object.values(stats.eventsByActor).reduce((sum, count) => sum + count, 0);
      expect(totalActorCounts).toBe(timeline.length);
    });
  });

  describe('edge cases', () => {
    it('should handle empty order events', () => {
      const timeline = BusinessTimelineGenerator.generateTimeline(
        [],
        OrderStatus.Draft
      );

      expect(timeline).toBeDefined();
      expect(timeline.length).toBeGreaterThan(0); // Should have synthetic events
    });

    it('should handle invalid order status gracefully', () => {
      expect(() => {
        BusinessTimelineGenerator.generateTimeline(
          mockOrderEvents,
          'invalid_status' as OrderStatus
        );
      }).not.toThrow();
    });

    it('should handle events without timestamps', () => {
      const eventsWithoutTimestamp = mockOrderEvents.map(event => ({
        ...event,
        timestamp: undefined
      }));

      const timeline = BusinessTimelineGenerator.generateTimeline(
        eventsWithoutTimestamp,
        OrderStatus.Pending
      );

      expect(timeline).toBeDefined();
      timeline.forEach(event => {
        expect(event.timestamp).toBeDefined();
      });
    });

    it('should handle events without actors', () => {
      const eventsWithoutActor = mockOrderEvents.map(event => ({
        ...event,
        actor: undefined
      }));

      const timeline = BusinessTimelineGenerator.generateTimeline(
        eventsWithoutActor,
        OrderStatus.Pending
      );

      expect(timeline).toBeDefined();
      timeline.forEach(event => {
        expect(event.actor).toBeDefined();
        expect(event.actorType).toBeDefined();
      });
    });
  });
});