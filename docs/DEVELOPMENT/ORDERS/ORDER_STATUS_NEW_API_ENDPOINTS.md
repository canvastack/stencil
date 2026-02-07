# Order Status Workflow - New API Endpoints Documentation

## Overview

This document provides comprehensive documentation for the new API endpoints that were added as part of the Order Status Workflow UX improvement implementation. These endpoints support the enhanced order status management features including stage advancement, timeline management, and improved status transitions.

## New API Endpoints

### 1. Advance Order Stage

**Endpoint:** `POST /api/tenant/orders/{id}/advance-stage`

**Description:** Advances an order to a specific business stage with validation and requirement checking.

**Authentication:** Required (Bearer Token)

**Parameters:**
- `id` (path, required): Order UUID

**Request Body:**
```json
{
  "action": "advance_stage",
  "target_stage": "vendor_negotiation",
  "notes": "Vendor identified and initial contact made",
  "requirements": {
    "vendor_identified": true,
    "initial_quote_received": true
  },
  "metadata": {
    "advanced_by": "user-uuid",
    "advanced_at": "2024-01-15T12:00:00Z",
    "previous_status": "vendor_sourcing"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Order advanced to vendor negotiation stage successfully",
  "data": {
    "id": "order-uuid",
    "order_number": "ORD-2024-001",
    "status": "vendor_negotiation",
    "stage": "vendor_negotiation",
    "progress_percentage": 35,
    "next_stage": "customer_quote",
    "updated_at": "2024-01-15T12:00:00Z",
    "customer": {
      "id": "customer-uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "items": [...],
    "timeline": [...]
  },
  "next_steps": [
    "Negotiate final price with vendor",
    "Prepare customer quote",
    "Set delivery timeline"
  ],
  "requirements_met": {
    "vendor_identified": true,
    "initial_quote_received": true
  }
}
```

**Error Responses:**

**400 Bad Request:**
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

**403 Forbidden:**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "User does not have permission to advance order stages",
    "required_permissions": ["orders.update", "orders.advance"],
    "user_permissions": ["orders.view"]
  }
}
```

**422 Unprocessable Entity:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Stage advancement validation failed",
    "details": {
      "target_stage": ["The selected target stage is invalid"],
      "requirements": ["Missing required vendor identification"]
    }
  }
}
```

### 2. Get Order Timeline (Enhanced)

**Endpoint:** `GET /api/tenant/orders/{id}/timeline`

**Description:** Retrieves comprehensive timeline of order status changes and business events.

**Authentication:** Required (Bearer Token)

**Parameters:**
- `id` (path, required): Order UUID
- `include_synthetic` (query, optional): Include calculated timeline events (default: true)
- `language` (query, optional): Response language (id/en, default: id)
- `limit` (query, optional): Number of events to return (default: 50)
- `offset` (query, optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "id": "timeline-event-uuid",
        "stage": "draft",
        "status": "new",
        "timestamp": "2024-01-15T10:00:00Z",
        "actor": "system",
        "actor_name": "System",
        "notes": "Order created",
        "metadata": {
          "synthetic": false,
          "category": "system",
          "is_business_critical": false,
          "event_type": "order_created"
        }
      },
      {
        "id": "timeline-event-uuid-2",
        "stage": "pending",
        "status": "pending",
        "timestamp": "2024-01-15T10:30:00Z",
        "actor": "customer",
        "actor_name": "John Doe",
        "notes": "Order submitted for review",
        "metadata": {
          "synthetic": false,
          "category": "customer",
          "is_business_critical": true,
          "event_type": "status_change",
          "previous_status": "draft"
        }
      },
      {
        "id": "timeline-event-uuid-3",
        "stage": "vendor_sourcing",
        "status": "vendor_sourcing",
        "timestamp": "2024-01-15T11:00:00Z",
        "actor": "admin_user",
        "actor_name": "Admin User",
        "notes": "Starting vendor search process",
        "metadata": {
          "synthetic": false,
          "category": "admin",
          "is_business_critical": true,
          "event_type": "stage_advancement",
          "requirements_met": ["order_approved", "specifications_confirmed"]
        }
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 50,
      "offset": 0,
      "has_more": false
    },
    "summary": {
      "total_events": 5,
      "business_critical_events": 3,
      "last_update": "2024-01-15T11:00:00Z",
      "current_stage": "vendor_sourcing",
      "days_in_current_stage": 2
    }
  }
}
```

### 3. Add Timeline Note

**Endpoint:** `POST /api/tenant/orders/{id}/timeline/notes`

**Description:** Adds a note to the order timeline for a specific stage.

**Authentication:** Required (Bearer Token)

**Parameters:**
- `id` (path, required): Order UUID

**Request Body:**
```json
{
  "stage": "vendor_sourcing",
  "notes": "Contacted 3 vendors, waiting for quotes",
  "metadata": {
    "vendors_contacted": ["vendor1", "vendor2", "vendor3"],
    "expected_response": "2024-01-16",
    "priority": "high"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Timeline note added successfully",
  "data": {
    "id": "timeline-note-uuid",
    "stage": "vendor_sourcing",
    "notes": "Contacted 3 vendors, waiting for quotes",
    "timestamp": "2024-01-15T14:30:00Z",
    "actor": "admin_user",
    "actor_name": "Admin User",
    "metadata": {
      "vendors_contacted": ["vendor1", "vendor2", "vendor3"],
      "expected_response": "2024-01-16",
      "priority": "high",
      "event_type": "note_added"
    }
  }
}
```

### 4. Get Stage Requirements

**Endpoint:** `GET /api/tenant/orders/{id}/stages/{stage}/requirements`

**Description:** Retrieves requirements and validation status for advancing to a specific stage.

**Authentication:** Required (Bearer Token)

**Parameters:**
- `id` (path, required): Order UUID
- `stage` (path, required): Target business stage

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "stage": "vendor_negotiation",
    "requirements": [
      {
        "id": "vendor_identified",
        "label": "Vendor Identified",
        "description": "A suitable vendor has been identified and contacted",
        "completed": true,
        "required": true,
        "metadata": {
          "vendor_id": "vendor-uuid",
          "vendor_name": "PT Etching Specialist",
          "contact_date": "2024-01-14"
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
          "quote_date": "2024-01-15",
          "quote_currency": "IDR"
        }
      },
      {
        "id": "specifications_confirmed",
        "label": "Specifications Confirmed",
        "description": "Product specifications have been confirmed with vendor",
        "completed": false,
        "required": true,
        "metadata": {
          "pending_confirmation": ["material_grade", "finishing_options"]
        }
      }
    ],
    "can_advance": false,
    "next_stage": "customer_quote",
    "estimated_completion_days": 2,
    "completion_percentage": 67,
    "blocking_requirements": ["specifications_confirmed"]
  }
}
```

### 5. Validate Stage Transition

**Endpoint:** `POST /api/tenant/orders/{id}/validate-transition`

**Description:** Validates whether a stage transition is allowed and provides detailed feedback.

**Authentication:** Required (Bearer Token)

**Parameters:**
- `id` (path, required): Order UUID

**Request Body:**
```json
{
  "from_stage": "vendor_sourcing",
  "to_stage": "vendor_negotiation",
  "user_permissions": ["orders.update", "orders.advance"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "can_advance": true,
    "missing_requirements": [],
    "warnings": [
      "This transition will notify the customer",
      "Vendor will be automatically notified of status change"
    ],
    "confirmation_required": false,
    "estimated_impact": {
      "timeline_change": "+1 day",
      "cost_impact": "none",
      "stakeholders_affected": ["customer", "vendor"]
    },
    "next_actions": [
      "Negotiate final price with vendor",
      "Prepare customer quote",
      "Set delivery timeline"
    ]
  }
}
```

**Response (400 Bad Request) - Invalid Transition:**
```json
{
  "success": false,
  "data": {
    "valid": false,
    "can_advance": false,
    "missing_requirements": [
      "vendor_identified",
      "initial_quote_received"
    ],
    "errors": [
      "Cannot advance to vendor_negotiation without identifying a vendor",
      "Initial quote must be received before negotiation can begin"
    ],
    "suggestions": [
      "Complete vendor identification process",
      "Request initial quotes from potential vendors"
    ]
  }
}
```

### 6. Get Available Transitions (Enhanced)

**Endpoint:** `GET /api/tenant/orders/{id}/available-transitions`

**Description:** Enhanced version of the existing endpoint with additional context and validation.

**Authentication:** Required (Bearer Token)

**Parameters:**
- `id` (path, required): Order UUID
- `include_requirements` (query, optional): Include requirement details (default: false)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "current_status": "vendor_sourcing",
    "current_stage": "vendor_sourcing",
    "available_transitions": [
      {
        "to_status": "vendor_negotiation",
        "to_stage": "vendor_negotiation",
        "label": "Advance to Vendor Negotiation",
        "description": "Begin price and terms negotiation with selected vendor",
        "can_transition": true,
        "requirements_met": true,
        "confirmation_required": false,
        "estimated_duration": "2-3 days",
        "requirements": [
          {
            "id": "vendor_identified",
            "completed": true
          },
          {
            "id": "initial_quote_received",
            "completed": true
          }
        ]
      },
      {
        "to_status": "on_hold",
        "to_stage": "on_hold",
        "label": "Put Order On Hold",
        "description": "Temporarily suspend order processing",
        "can_transition": true,
        "requirements_met": true,
        "confirmation_required": true,
        "estimated_duration": "indefinite",
        "requirements": []
      }
    ],
    "blocked_transitions": [
      {
        "to_status": "customer_quote",
        "to_stage": "customer_quote",
        "label": "Generate Customer Quote",
        "description": "Create quote for customer approval",
        "can_transition": false,
        "blocking_reasons": [
          "Vendor negotiation must be completed first",
          "Final pricing not yet determined"
        ]
      }
    ]
  }
}
```

## Integration Guidelines

### React Query Integration

These endpoints are designed to work seamlessly with React Query for optimal caching and real-time updates:

```typescript
// Custom hooks for new endpoints
export const useAdvanceOrderStage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, targetStage, notes, requirements }) =>
      ordersService.advanceOrderStage(orderId, targetStage, notes, requirements),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries(['orders', variables.orderId]);
      queryClient.invalidateQueries(['orders', variables.orderId, 'timeline']);
      queryClient.invalidateQueries(['orders', variables.orderId, 'requirements']);
    }
  });
};

export const useOrderTimeline = (orderId: string, options = {}) => {
  return useQuery({
    queryKey: ['orders', orderId, 'timeline', options],
    queryFn: () => ordersService.getOrderTimeline(orderId, options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
};

export const useStageRequirements = (orderId: string, stage: string) => {
  return useQuery({
    queryKey: ['orders', orderId, 'requirements', stage],
    queryFn: () => ordersService.getStageRequirements(orderId, stage),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!orderId && !!stage,
  });
};
```

### Error Handling

All endpoints follow consistent error response patterns:

```typescript
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  suggestions?: string[];
}
```

Common error codes:
- `INVALID_STAGE_TRANSITION`: Invalid stage transition attempt
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `VALIDATION_FAILED`: Request validation failed
- `REQUIREMENTS_NOT_MET`: Stage requirements not satisfied
- `ORDER_NOT_FOUND`: Order does not exist
- `CONCURRENT_MODIFICATION`: Order modified by another user

### Optimistic Updates

The frontend implements optimistic updates for better user experience:

```typescript
const advanceStage = useAdvanceOrderStage();

const handleAdvance = async (targetStage: string) => {
  // Optimistic update
  const optimisticOrder = {
    ...currentOrder,
    status: targetStage,
    updated_at: new Date().toISOString()
  };
  
  queryClient.setQueryData(['orders', orderId], optimisticOrder);
  
  try {
    await advanceStage.mutateAsync({
      orderId,
      targetStage,
      notes: 'Stage advancement'
    });
  } catch (error) {
    // Revert optimistic update on error
    queryClient.setQueryData(['orders', orderId], currentOrder);
    throw error;
  }
};
```

### Real-time Updates

For real-time synchronization, the system uses polling with intelligent intervals:

```typescript
const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => ordersService.getOrderById(orderId),
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

## Security Considerations

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt-token>
```

### Authorization
Endpoints validate user permissions:
- `orders.view`: View order details and timeline
- `orders.update`: Update order information
- `orders.advance`: Advance order stages
- `orders.notes`: Add timeline notes

### Data Validation
- All input is validated on both client and server
- UUID format validation for order IDs
- Business rule validation for stage transitions
- Permission checks before any modifications

### Rate Limiting
- Standard rate limiting applies (100 requests per minute per user)
- Stage advancement operations have additional throttling (10 per minute)

## Testing

### Unit Tests
```typescript
describe('Order Stage Advancement API', () => {
  it('should advance order stage successfully', async () => {
    const response = await request(app)
      .post('/api/tenant/orders/test-order-1/advance-stage')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        action: 'advance_stage',
        target_stage: 'vendor_negotiation',
        notes: 'Test advancement'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('vendor_negotiation');
  });
});
```

### Integration Tests
```typescript
describe('Order Timeline Integration', () => {
  it('should create timeline entry when stage is advanced', async () => {
    // Advance stage
    await request(app)
      .post('/api/tenant/orders/test-order-1/advance-stage')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ target_stage: 'vendor_negotiation', notes: 'Test' });

    // Check timeline
    const timelineResponse = await request(app)
      .get('/api/tenant/orders/test-order-1/timeline')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const timeline = timelineResponse.body.data.timeline;
    expect(timeline).toHaveLength(2); // Original + new entry
    expect(timeline[0].stage).toBe('vendor_negotiation');
  });
});
```

## Performance Considerations

### Caching Strategy
- Timeline data cached for 2 minutes
- Requirements data cached for 5 minutes
- Order details cached for 30 seconds during active updates

### Database Optimization
- Indexed queries on order_id, status, and timestamp
- Efficient pagination for timeline queries
- Optimized joins for related data

### Response Size Management
- Timeline pagination to limit response size
- Optional inclusion of detailed metadata
- Compressed responses for large datasets

## Migration Notes

### Backward Compatibility
- All existing endpoints remain functional
- New endpoints are additive, not replacing existing ones
- Existing API clients continue to work without changes

### Database Changes
- New timeline events table for enhanced tracking
- Additional indexes for performance optimization
- No breaking changes to existing schema

### Frontend Migration
- Progressive enhancement approach
- Fallback to existing endpoints if new ones fail
- Graceful degradation for older browsers

This documentation provides comprehensive coverage of the new API endpoints added for the Order Status Workflow UX improvement, ensuring developers can effectively integrate and maintain these features.