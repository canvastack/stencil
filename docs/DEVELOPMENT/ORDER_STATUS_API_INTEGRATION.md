# Order Status Workflow API Integration

## Overview

This document describes the API integration patterns and endpoints used by the Order Status Workflow UX components. The system follows RESTful principles with optimistic updates and real-time synchronization.

> **📋 Complete API Documentation**: For comprehensive documentation of all new API endpoints added for the Order Status Workflow, see [ORDER_STATUS_NEW_API_ENDPOINTS.md](./ORDER_STATUS_NEW_API_ENDPOINTS.md)

> **🔗 OpenAPI Specification**: All endpoints are documented in the OpenAPI specification at `openapi/paths/content-management/orders.yaml`

## API Endpoints

### Order Management

#### Get Order Details
```http
GET /api/orders/{orderId}
```

**Response:**
```json
{
  "id": "uuid",
  "order_number": "ORD-2024-001",
  "status": "pending",
  "payment_status": "unpaid",
  "total_amount": 150000,
  "customer": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+62812345678"
  },
  "items": [
    {
      "product_id": "uuid",
      "product_name": "Custom Etching Plate",
      "quantity": 2,
      "specifications": {
        "material": "stainless_steel",
        "dimensions": "10x15cm",
        "text_content": "Company Logo"
      },
      "pricing": {
        "unit_price": 75000,
        "total_price": 150000
      }
    }
  ],
  "timeline": [
    {
      "id": "uuid",
      "stage": "draft",
      "status": "new",
      "timestamp": "2024-01-15T10:00:00Z",
      "actor": "system",
      "notes": "Order created"
    }
  ],
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

#### Update Order Status
```http
PATCH /api/orders/{orderId}/status
```

**Request:**
```json
{
  "status": "vendor_sourcing",
  "stage": "vendor_sourcing",
  "notes": "Starting vendor search process",
  "metadata": {
    "reason": "customer_approved",
    "estimated_completion": "2024-01-20"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "id": "uuid",
    "status": "vendor_sourcing",
    "stage": "vendor_sourcing",
    "updated_at": "2024-01-15T11:00:00Z"
  },
  "timeline_event": {
    "id": "uuid",
    "stage": "vendor_sourcing",
    "timestamp": "2024-01-15T11:00:00Z",
    "actor": "admin_user",
    "notes": "Starting vendor search process"
  }
}
```

#### Advance Order Stage
```http
POST /api/orders/{orderId}/advance
```

**Request:**
```json
{
  "to_stage": "vendor_negotiation",
  "notes": "Vendor found, starting negotiation",
  "requirements_met": [
    "vendor_identified",
    "initial_quote_received"
  ],
  "metadata": {
    "vendor_id": "uuid",
    "estimated_cost": 120000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order advanced to vendor negotiation stage",
  "data": {
    "id": "uuid",
    "status": "vendor_negotiation",
    "stage": "vendor_negotiation",
    "progress_percentage": 35,
    "next_stage": "customer_quote",
    "updated_at": "2024-01-15T12:00:00Z"
  },
  "next_steps": [
    "Negotiate final price with vendor",
    "Prepare customer quote",
    "Set delivery timeline"
  ]
}
```

### Timeline Management

#### Get Order Timeline
```http
GET /api/orders/{orderId}/timeline
```

**Query Parameters:**
- `include_synthetic`: Include calculated timeline events (default: true)
- `language`: Response language (id/en, default: id)
- `limit`: Number of events to return (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "timeline": [
    {
      "id": "uuid",
      "stage": "draft",
      "status": "new",
      "timestamp": "2024-01-15T10:00:00Z",
      "actor": "system",
      "actor_name": "System",
      "notes": "Order created",
      "metadata": {
        "synthetic": false,
        "category": "system",
        "is_business_critical": false
      }
    },
    {
      "id": "uuid",
      "stage": "pending",
      "status": "pending",
      "timestamp": "2024-01-15T10:30:00Z",
      "actor": "customer",
      "actor_name": "John Doe",
      "notes": "Order submitted for review",
      "metadata": {
        "synthetic": false,
        "category": "customer",
        "is_business_critical": true
      }
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

#### Add Timeline Note
```http
POST /api/orders/{orderId}/timeline/notes
```

**Request:**
```json
{
  "stage": "vendor_sourcing",
  "notes": "Contacted 3 vendors, waiting for quotes",
  "metadata": {
    "vendors_contacted": ["vendor1", "vendor2", "vendor3"],
    "expected_response": "2024-01-16"
  }
}
```

### Validation and Requirements

#### Get Stage Requirements
```http
GET /api/orders/{orderId}/stages/{stage}/requirements
```

**Response:**
```json
{
  "stage": "vendor_negotiation",
  "requirements": [
    {
      "id": "vendor_identified",
      "label": "Vendor Identified",
      "description": "A suitable vendor has been identified and contacted",
      "completed": true,
      "required": true,
      "metadata": {
        "vendor_id": "uuid",
        "vendor_name": "PT Etching Specialist"
      }
    },
    {
      "id": "initial_quote_received",
      "label": "Initial Quote Received",
      "description": "Vendor has provided initial pricing quote",
      "completed": true,
      "required": true,
      "metadata": {
        "quote_amount": 120000,
        "quote_date": "2024-01-15"
      }
    }
  ],
  "can_advance": true,
  "next_stage": "customer_quote",
  "estimated_completion_days": 2
}
```

#### Validate Stage Transition
```http
POST /api/orders/{orderId}/validate-transition
```

**Request:**
```json
{
  "from_stage": "vendor_sourcing",
  "to_stage": "vendor_negotiation",
  "user_permissions": ["orders.update", "orders.advance"]
}
```

**Response:**
```json
{
  "valid": true,
  "can_advance": true,
  "missing_requirements": [],
  "warnings": [
    "This transition will notify the customer"
  ],
  "confirmation_required": false,
  "estimated_impact": {
    "timeline_change": "+1 day",
    "cost_impact": "none",
    "stakeholders_affected": ["customer", "vendor"]
  }
}
```

## React Query Integration

### Custom Hooks

#### useOrder
```typescript
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/services/api';

export const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => orderApi.getOrder(orderId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // 30 seconds for real-time updates
  });
};
```

#### useAdvanceOrderStage
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/services/api';
import { OptimisticUpdateManager } from '@/utils/OptimisticUpdateManager';

export const useAdvanceOrderStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, toStage, notes, metadata }) => {
      // Optimistic update
      const updateId = OptimisticUpdateManager.startUpdate(orderId, {
        toState: { stage: toStage, status: mapStageToStatus(toStage) },
        userFeedback: {
          showProgress: true,
          progressMessage: 'Advancing order stage...',
          successMessage: `Order advanced to ${toStage}`
        }
      });

      try {
        const result = await orderApi.advanceStage(orderId, {
          to_stage: toStage,
          notes,
          metadata
        });

        OptimisticUpdateManager.confirmUpdate(updateId, result.data);
        return result;
      } catch (error) {
        OptimisticUpdateManager.revertUpdate(updateId, error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries(['orders', variables.orderId]);
      queryClient.invalidateQueries(['orders', variables.orderId, 'timeline']);
      
      // Update cache with new data
      queryClient.setQueryData(['orders', variables.orderId], data.data);
    },
    onError: (error, variables) => {
      console.error('Failed to advance order stage:', error);
      // Error handling is managed by OptimisticUpdateManager
    }
  });
};
```

#### useOrderTimeline
```typescript
export const useOrderTimeline = (orderId: string, options = {}) => {
  return useQuery({
    queryKey: ['orders', orderId, 'timeline', options],
    queryFn: () => orderApi.getTimeline(orderId, options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
};
```

### Optimistic Updates

The system implements optimistic updates for better user experience:

```typescript
// OptimisticUpdateManager handles immediate UI updates
class OptimisticUpdateManager {
  static startUpdate(orderId: string, context: UpdateContext): string {
    const updateId = generateUpdateId();
    
    // Immediately update the UI
    this.updateOrderCache(orderId, context.toState);
    
    // Show progress indicator
    if (context.userFeedback?.showProgress) {
      OrderStatusMessaging.showProgressIndicator(updateId, {
        title: context.userFeedback.progressMessage,
        estimatedDuration: 3000
      });
    }
    
    return updateId;
  }

  static confirmUpdate(updateId: string, serverData: any): void {
    // Update cache with server response
    this.updateOrderCache(serverData.id, serverData);
    
    // Dismiss progress indicator
    OrderStatusMessaging.dismissProgressIndicator(updateId);
    
    // Show success message
    OrderStatusMessaging.showSuccess('Order updated successfully');
  }

  static revertUpdate(updateId: string, error: any): void {
    // Revert optimistic changes
    this.revertOrderCache(updateId);
    
    // Dismiss progress indicator
    OrderStatusMessaging.dismissProgressIndicator(updateId);
    
    // Show error message
    OrderStatusMessaging.showError('Failed to update order', error);
  }
}
```

## Error Handling

### API Error Responses

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STAGE_TRANSITION",
    "message": "Cannot advance from vendor_sourcing to completed",
    "details": {
      "current_stage": "vendor_sourcing",
      "requested_stage": "completed",
      "missing_requirements": [
        "vendor_negotiation",
        "customer_quote",
        "payment_received"
      ]
    }
  },
  "suggestions": [
    "Complete vendor negotiation first",
    "Ensure customer has approved quote",
    "Verify payment has been received"
  ]
}
```

### Error Handling in Components

```typescript
const StatusActionPanel = ({ orderId, currentStatus }) => {
  const advanceStage = useAdvanceOrderStage();

  const handleAdvance = async (toStage: BusinessStage) => {
    try {
      await advanceStage.mutateAsync({
        orderId,
        toStage,
        notes: 'Stage advancement'
      });
    } catch (error) {
      // Error is handled by OptimisticUpdateManager
      // Additional component-specific error handling can be added here
      if (error.code === 'INVALID_STAGE_TRANSITION') {
        setShowRequirementsModal(true);
      }
    }
  };

  return (
    <Button 
      onClick={() => handleAdvance(BusinessStage.VENDOR_NEGOTIATION)}
      disabled={advanceStage.isLoading}
    >
      {advanceStage.isLoading ? 'Advancing...' : 'Advance Stage'}
    </Button>
  );
};
```

## Real-time Updates

### WebSocket Integration (Future)

```typescript
// WebSocket connection for real-time updates
const useOrderWebSocket = (orderId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/orders/${orderId}`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      if (update.type === 'status_changed') {
        // Update order cache
        queryClient.setQueryData(['orders', orderId], (oldData) => ({
          ...oldData,
          status: update.new_status,
          updated_at: update.timestamp
        }));

        // Show notification
        toast.info(`Order status changed to ${update.new_status}`);
      }
    };

    return () => ws.close();
  }, [orderId, queryClient]);
};
```

### Polling Strategy

Current implementation uses intelligent polling:

```typescript
const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => orderApi.getOrder(orderId),
    refetchInterval: (data) => {
      // More frequent polling for active orders
      if (data?.status === 'in_production') return 10 * 1000; // 10 seconds
      if (data?.status === 'pending') return 30 * 1000; // 30 seconds
      return 60 * 1000; // 1 minute for stable orders
    },
    refetchOnWindowFocus: true,
  });
};
```

## Performance Optimization

### Caching Strategy

```typescript
// Query key factory for consistent caching
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: string) => [...orderKeys.lists(), { filters }] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  timeline: (id: string) => [...orderKeys.detail(id), 'timeline'] as const,
  requirements: (id: string, stage: string) => 
    [...orderKeys.detail(id), 'requirements', stage] as const,
};
```

### Request Deduplication

```typescript
// Automatic request deduplication with React Query
const useMultipleOrderDetails = (orderIds: string[]) => {
  return useQueries({
    queries: orderIds.map(id => ({
      queryKey: orderKeys.detail(id),
      queryFn: () => orderApi.getOrder(id),
      staleTime: 5 * 60 * 1000,
    }))
  });
};
```

## Testing API Integration

### Mock API Responses

```typescript
// MSW handlers for testing
export const orderHandlers = [
  rest.get('/api/orders/:orderId', (req, res, ctx) => {
    const { orderId } = req.params;
    return res(
      ctx.json({
        id: orderId,
        order_number: 'ORD-2024-001',
        status: 'pending',
        // ... other order data
      })
    );
  }),

  rest.patch('/api/orders/:orderId/status', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: 'Order status updated successfully',
        data: {
          id: req.params.orderId,
          status: req.body.status,
          updated_at: new Date().toISOString()
        }
      })
    );
  }),
];
```

### Integration Tests

```typescript
describe('Order Status API Integration', () => {
  it('should advance order stage successfully', async () => {
    const { result } = renderHook(() => useAdvanceOrderStage(), {
      wrapper: createQueryWrapper()
    });

    await act(async () => {
      await result.current.mutateAsync({
        orderId: 'test-order-1',
        toStage: BusinessStage.VENDOR_NEGOTIATION,
        notes: 'Test advancement'
      });
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      rest.post('/api/orders/:orderId/advance', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            success: false,
            error: {
              code: 'INVALID_STAGE_TRANSITION',
              message: 'Cannot advance to this stage'
            }
          })
        );
      })
    );

    const { result } = renderHook(() => useAdvanceOrderStage(), {
      wrapper: createQueryWrapper()
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          orderId: 'test-order-1',
          toStage: BusinessStage.COMPLETED,
          notes: 'Invalid advancement'
        });
      } catch (error) {
        expect(error.code).toBe('INVALID_STAGE_TRANSITION');
      }
    });
  });
});
```

## Security Considerations

### Authentication

All API requests include authentication headers:

```typescript
const apiClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Permission Validation

API endpoints validate user permissions:

```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "User does not have permission to advance order stages",
    "required_permissions": ["orders.update", "orders.advance"],
    "user_permissions": ["orders.view"]
  }
}
```

### Data Validation

All requests are validated on both client and server:

```typescript
// Client-side validation
const advanceStageSchema = z.object({
  orderId: z.string().uuid(),
  toStage: z.nativeEnum(BusinessStage),
  notes: z.string().min(10).max(500),
  metadata: z.record(z.any()).optional()
});

export const advanceOrderStage = async (data: unknown) => {
  const validatedData = advanceStageSchema.parse(data);
  return apiClient.post(`/api/orders/${validatedData.orderId}/advance`, validatedData);
};
```

## Monitoring and Analytics

### API Metrics

Track key metrics for API performance:

- Response times for each endpoint
- Error rates by endpoint and error type
- Cache hit/miss rates
- Optimistic update success rates

### User Interaction Tracking

```typescript
// Track user interactions with status workflow
const trackStatusAction = (action: string, orderId: string, metadata?: any) => {
  analytics.track('Order Status Action', {
    action,
    orderId,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Usage in components
const handleAdvanceStage = async (toStage: BusinessStage) => {
  trackStatusAction('advance_stage', orderId, { toStage });
  await advanceStage.mutateAsync({ orderId, toStage });
};
```

This comprehensive API integration documentation ensures that developers understand how to properly integrate with the Order Status Workflow system and maintain consistent, reliable communication between the frontend components and backend services.

## Related Documentation

- **[ORDER_STATUS_NEW_API_ENDPOINTS.md](./ORDER_STATUS_NEW_API_ENDPOINTS.md)** - Comprehensive documentation of all new API endpoints
- **[ORDER_STATUS_API_SUMMARY.md](./ORDER_STATUS_API_SUMMARY.md)** - Quick reference summary of all endpoints
- **[ORDER_STATUS_WORKFLOW_COMPONENTS.md](./ORDER_STATUS_WORKFLOW_COMPONENTS.md)** - Frontend component documentation
- **[ORDER_STATUS_TESTING_GUIDE.md](./ORDER_STATUS_TESTING_GUIDE.md)** - Testing strategies and examples
- **[ORDER_STATUS_TROUBLESHOOTING.md](./ORDER_STATUS_TROUBLESHOOTING.md)** - Common issues and solutions

## OpenAPI Specification

All endpoints are fully documented in the OpenAPI specification:
- **Main specification**: `openapi/paths/content-management/orders.yaml`
- **Data schemas**: `openapi/components/schemas.yaml`
- **Generated documentation**: Available through OpenAPI tools