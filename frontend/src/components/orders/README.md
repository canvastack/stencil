# Order Status Workflow Components

This directory contains the enhanced order status workflow components that provide an intuitive, action-oriented interface for managing order statuses in the CanvaStencil platform.

## Components Overview

### Core Components

- **[EnhancedOrderDetailHeader](./EnhancedOrderDetailHeader.tsx)** - Comprehensive order information display with status indicators and quick actions
- **[ActionableStageModal](./ActionableStageModal.tsx)** - Context-aware modal with stage-specific actions and guidance
- **[StatusActionPanel](./StatusActionPanel.tsx)** - Unified status management panel with transitions and recent activity

### Supporting Components

- **[WhatsNextGuidanceSystem](./WhatsNextGuidanceSystem.tsx)** - Contextual guidance and suggested actions
- **[StatusChangeConfirmationDialog](./StatusChangeConfirmationDialog.tsx)** - Enhanced confirmation for critical status changes
- **[StageAdvancementModal](./StageAdvancementModal.tsx)** - Specialized modal for stage advancement with validation

### Timeline Components

- **[EnhancedTimelineTab](./EnhancedTimelineTab.tsx)** - Interactive timeline with embedded actions
- **[InteractiveTimeline](./InteractiveTimeline.tsx)** - Clickable timeline stages with hover effects

## Architecture

The components follow a **hierarchical architecture** with clear data flow:

```
OrderDetailPage
├── EnhancedOrderDetailHeader (status display + quick actions)
├── OrderTabs
│   ├── ItemsTab
│   ├── CustomerTab
│   ├── PaymentsTab
│   └── EnhancedTimelineTab (interactive timeline)
├── StatusActionPanel (unified status management)
└── Modals
    ├── ActionableStageModal (stage-specific actions)
    ├── StatusChangeConfirmationDialog (confirmations)
    └── StageAdvancementModal (advancement workflow)
```

## Key Features

### 1. Action-Oriented Design
- Every clickable element has a clear purpose and outcome
- Context-aware actions based on current stage and user permissions
- Clear visual feedback for all interactions

### 2. Business Workflow Integration
- Aligned with PT CEX business processes
- Stage-specific guidance and requirements
- Proper validation for status transitions

### 3. Accessibility Compliance
- WCAG 2.1 AA compliant
- Full keyboard navigation support
- Screen reader optimized with proper ARIA labels
- High contrast and color-blind friendly design

### 4. Mobile Responsive
- Optimized layouts for all screen sizes
- Touch-friendly interactions
- Progressive disclosure for mobile devices

### 5. Real-time Updates
- Optimistic updates for immediate feedback
- Server synchronization with rollback on failure
- Live status updates across components

## Usage Patterns

### Basic Implementation

```tsx
import { EnhancedOrderDetailHeader } from './orders/EnhancedOrderDetailHeader';
import StatusActionPanel from './orders/StatusActionPanel';
import { ActionableStageModal } from './orders/ActionableStageModal';

const OrderDetailPage = () => {
  const { data: order, isLoading } = useOrder(orderId);
  const [selectedStage, setSelectedStage] = useState<BusinessStage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <EnhancedOrderDetailHeader 
        order={order} 
        isLoading={isLoading}
        onBack={() => navigate('/admin/orders')}
      />
      
      <StatusActionPanel
        currentStatus={order.status}
        timeline={order.timeline}
        userPermissions={userPermissions}
        orderId={order.id}
      />
      
      <ActionableStageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        stage={selectedStage}
        currentStatus={order.status}
        userPermissions={userPermissions}
        orderId={order.id}
      />
    </div>
  );
};
```

### Advanced Integration

```tsx
// With custom handlers and state management
const OrderDetailPage = () => {
  const { data: order } = useOrder(orderId);
  const { mutate: advanceStage } = useAdvanceOrderStage();
  const { mutate: addNote } = useAddOrderNote();

  const handleStageAdvancement = async (toStage: BusinessStage, notes: string) => {
    try {
      await advanceStage({ orderId, toStage, notes });
      toast.success('Stage advanced successfully');
    } catch (error) {
      toast.error('Failed to advance stage');
    }
  };

  const handleAddNote = async (note: string) => {
    try {
      await addNote({ orderId, note });
      toast.success('Note added successfully');
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  return (
    <StatusActionPanel
      currentStatus={order.status}
      timeline={order.timeline}
      userPermissions={userPermissions}
      orderId={order.id}
      onAddNote={handleAddNote}
      onAdvanceStage={handleStageAdvancement}
    />
  );
};
```

## State Management

Components use a combination of:

- **Local State**: UI state (modals, forms, selections)
- **React Query**: Server state with caching and synchronization
- **Context**: Shared state like user permissions and theme
- **Optimistic Updates**: Immediate UI feedback with server sync

## Testing

Each component includes comprehensive tests:

```bash
# Run component tests
npm test -- orders/

# Run specific component tests
npm test -- EnhancedOrderDetailHeader.test.tsx
npm test -- ActionableStageModal.test.tsx
npm test -- StatusActionPanel.test.tsx

# Run accessibility tests
npm test -- accessibility.test.tsx

# Run integration tests
npm test -- integration/
```

## Performance

### Optimization Strategies

1. **Lazy Loading**: Components are loaded on demand
2. **Memoization**: Expensive calculations are cached
3. **Virtual Scrolling**: For large timeline datasets
4. **Debounced Updates**: Prevents excessive API calls

### Bundle Impact

- **Core Components**: ~45KB gzipped
- **Supporting Components**: ~25KB gzipped
- **Utilities**: ~15KB gzipped
- **Total**: ~85KB gzipped (lazy loaded)

## Customization

### Theme Customization

```tsx
// Custom theme integration
const CustomOrderHeader = () => {
  const theme = useTheme();
  
  return (
    <EnhancedOrderDetailHeader
      order={order}
      className={cn(
        "custom-header",
        theme.orderHeader.className
      )}
      statusColors={theme.statusColors}
    />
  );
};
```

### Permission Integration

```tsx
// Custom permission checks
const PermissionAwareStatusPanel = () => {
  const permissions = usePermissions();
  
  const customPermissions = [
    ...permissions,
    'custom.order.action'
  ];
  
  return (
    <StatusActionPanel
      userPermissions={customPermissions}
      customActions={customActions}
    />
  );
};
```

## Migration from Legacy Components

### Step-by-Step Migration

1. **Install Dependencies**: Ensure all required utilities are available
2. **Update Imports**: Replace legacy component imports
3. **Update Props**: Adapt to new prop interfaces
4. **Test Integration**: Verify functionality with existing data
5. **Update Styles**: Apply new design system classes

### Backward Compatibility

Legacy components are still supported during transition:

```tsx
// Gradual migration with feature flags
const OrderHeader = () => {
  const useEnhanced = useFeatureFlag('enhanced-order-header');
  
  return useEnhanced ? (
    <EnhancedOrderDetailHeader order={order} />
  ) : (
    <LegacyOrderHeader order={order} />
  );
};
```

## Troubleshooting

### Common Issues

1. **Component Not Rendering**
   - Check user permissions
   - Verify order data structure
   - Check console for errors

2. **Actions Not Working**
   - Verify API endpoints
   - Check user permissions
   - Ensure valid order state

3. **Styling Issues**
   - Verify Tailwind CSS setup
   - Check for CSS conflicts
   - Ensure design system imports

### Debug Mode

Enable debug mode for development:

```tsx
<EnhancedOrderDetailHeader 
  order={order}
  debug={process.env.NODE_ENV === 'development'}
/>
```

## Contributing

### Development Guidelines

1. **Follow TypeScript**: All components must be fully typed
2. **Accessibility First**: Ensure WCAG 2.1 AA compliance
3. **Test Coverage**: Maintain >90% test coverage
4. **Performance**: Monitor bundle size and runtime performance
5. **Documentation**: Update documentation for any changes

### Code Style

- Use functional components with hooks
- Follow the established prop interface patterns
- Implement proper error boundaries
- Use consistent naming conventions
- Include comprehensive JSDoc comments

## Support

For questions or issues:

1. Check the [main documentation](../../docs/DEVELOPMENT/ORDER_STATUS_WORKFLOW_COMPONENTS.md)
2. Review component tests for usage examples
3. Check the troubleshooting section above
4. Contact the development team

## Changelog

### v2.0.0 (Current)
- Complete rewrite with enhanced UX
- Action-oriented design
- Accessibility compliance
- Mobile responsive
- Real-time updates

### v1.0.0 (Legacy)
- Basic status display
- Limited interactivity
- Desktop only
- Manual refresh required