# Database Indexes Documentation

## Order Vendor Negotiations Table

### Composite Indexes

#### 1. idx_ovn_order_vendor_status
**Columns**: `(order_id, vendor_id, status)`

**Purpose**: Optimizes duplicate quote detection queries

**Use Cases**:
- Checking if an active quote exists for a specific order + vendor combination
- Preventing duplicate quote creation
- Filtering quotes by order, vendor, and status simultaneously

**Query Example**:
```sql
SELECT * FROM order_vendor_negotiations 
WHERE order_id = ? 
  AND vendor_id = ? 
  AND status IN ('draft', 'open', 'sent', 'countered');
```

**Performance Impact**: 
- Reduces query time from O(n) to O(log n) for duplicate checks
- Critical for quote creation workflow
- Expected query time: < 10ms even with 10,000+ quotes

---

#### 2. idx_ovn_order_created
**Columns**: `(order_id, created_at)`

**Purpose**: Optimizes quote listing queries sorted by creation date

**Use Cases**:
- Fetching all quotes for a specific order
- Displaying quote history in chronological order
- Quote timeline views in admin panel

**Query Example**:
```sql
SELECT * FROM order_vendor_negotiations 
WHERE order_id = ? 
ORDER BY created_at DESC;
```

**Performance Impact**:
- Eliminates need for filesort operation
- Enables efficient pagination
- Expected query time: < 20ms for 100+ quotes per order

---

## Testing

Performance tests are located in:
- `tests/Performance/QuoteIndexPerformanceTest.php`

Run tests with:
```bash
php artisan test tests/Performance/QuoteIndexPerformanceTest.php
```

## Maintenance

### Monitoring
- Monitor query execution plans using `EXPLAIN ANALYZE`
- Track slow query logs for queries > 100ms
- Review index usage statistics monthly

### Optimization
- Consider adding partial indexes if certain status values dominate
- Monitor index bloat and rebuild if necessary
- Update statistics regularly with `ANALYZE` command

## Related Documentation
- Quote Management Workflow: `.kiro/specs/quote-management-workflow/`
- Database Schema Reference: `roadmaps/ARCHITECTURE/BUSINESS_HEXAGONAL_PLAN/AUDIT/DATABASE_SCHEMA_REFERENCE.md`
