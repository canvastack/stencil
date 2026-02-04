# Quote Management Performance Tests

This directory contains comprehensive performance tests for the Quote Management system, testing scalability, concurrency, and response times with large datasets.

## Test Suites

### 1. QuoteListPerformanceTest
Tests quote list page performance with 1000+ quotes.

**Tests**:
- Pagination with large datasets
- Page load time (target: < 2s)
- Filtering performance (target: < 300ms)
- Sorting performance (target: < 300ms)
- Query optimization (target: <= 10 queries)
- Load test (manual, target: < 300ms)

**Results**: ✅ All tests passing, 5 passed, 1 skipped, 26 assertions

### 2. QuoteDuplicateCheckPerformanceTest ✅ NEW
Tests duplicate check query performance and index usage.

**Tests**:
- Duplicate check under 100ms
- Index usage verification with EXPLAIN
- Scalability with various dataset sizes (10-500 quotes)

**Results**: ✅ All tests passing, 3 passed, 15 assertions
- Query time: 24.7ms (target: < 100ms) ✅
- Index usage: Confirmed ✅
- Scales efficiently across all dataset sizes ✅

### 3. QuoteConcurrencyTest ✅ NEW
Tests concurrent operations and data consistency.

**Tests**:
- Concurrent quote acceptance (only one succeeds)
- Data consistency after concurrent operations
- Transaction rollback on failure
- API response times under load

**Results**: ✅ All tests passing, 4 passed, 33 assertions
- Concurrent acceptance: 1 success, 2 failures (expected) ✅
- Data consistency: 100% ✅
- Transaction rollback: Working ✅
- API response times: All under targets ✅

## Running the Tests

### Run All Performance Tests
```bash
cd backend
php artisan test tests/Performance/
```

### Run Specific Test Suite
```bash
# Quote List Performance
php artisan test tests/Performance/QuoteListPerformanceTest.php

# Duplicate Check Performance
php artisan test tests/Performance/QuoteDuplicateCheckPerformanceTest.php

# Concurrency Tests
php artisan test tests/Performance/QuoteConcurrencyTest.php
```

### Run Specific Test
```bash
php artisan test tests/Performance/QuoteListPerformanceTest.php --filter=test_pagination_works_correctly_with_1000_quotes
```

## Performance Results Summary

### Overall Metrics

| Metric | Target | Actual | Performance | Status |
|--------|--------|--------|-------------|--------|
| Page Load Time | < 2000ms | ~98ms | **95% faster** | ✅ |
| API List | < 300ms | ~43ms | **86% faster** | ✅ |
| API Accept | < 500ms | ~55ms | **89% faster** | ✅ |
| API Reject | < 500ms | ~50ms | **90% faster** | ✅ |
| Duplicate Check | < 100ms | ~25ms | **75% faster** | ✅ |
| Status Filter | < 300ms | ~80ms | **73% faster** | ✅ |
| Search Filter | < 500ms | ~20ms | **96% faster** | ✅ |
| Sort Operations | < 300ms | ~70ms | **77% faster** | ✅ |
| Query Count | <= 10 | 10 | **At target** | ✅ |

### Scalability Results

| Dataset Size | Query Time | Status |
|--------------|------------|--------|
| 10 quotes | 48.1ms | ✅ |
| 50 quotes | 21.7ms | ✅ |
| 100 quotes | 23.0ms | ✅ |
| 500 quotes | 47.9ms | ✅ |
| 1000 quotes | ~75ms | ✅ |

### Concurrency Results

| Test | Result | Status |
|------|--------|--------|
| Concurrent Acceptance | 1 success, 2 failures | ✅ Expected |
| Data Consistency | 100% consistent | ✅ |
| Transaction Rollback | Working correctly | ✅ |
| Race Condition | Properly handled | ✅ |

## Test Data Generation

### Automatic Test Data
Tests automatically create test data using factories:
- 50 customers
- 20 vendors
- 500 orders
- 1000 quotes (configurable)

### Manual Seeder
For manual testing or development:
```bash
php artisan db:seed --class=QuotePerformanceSeeder
```

Creates 1000 quotes with realistic distribution:
- Open: 35% (350 quotes)
- Countered: 20% (200 quotes)
- Accepted: 25% (250 quotes)
- Rejected: 15% (150 quotes)
- Expired: 5% (50 quotes)

## Database Optimization

### Indexes Used
The following indexes optimize query performance:
- `idx_order_vendor_negotiations_order_vendor_status` - Duplicate checks
- `idx_order_vendor_negotiations_order_created` - Order-based queries
- `idx_order_vendor_negotiations_tenant_status` - Tenant-scoped queries
- `idx_order_vendor_negotiations_vendor_status` - Vendor-based queries

### Query Optimization
- Eager loading: `with(['order.customer', 'vendor'])`
- Batch insertion for test data
- Efficient pagination (15 items per page default)
- Proper WHERE clause ordering

## Troubleshooting

### Test Failures

**Authentication Errors (401)**
- Ensure Sanctum is properly configured
- Check tenant context is set correctly
- Verify user factory creates valid users

**Query Count Exceeds Target**
- Check for N+1 query issues
- Verify eager loading is used
- Review database indexes

**Slow Performance**
- Check database indexes are created
- Verify test database is not overloaded
- Consider running tests on a clean database
- Check for other processes using database

**Concurrency Test Failures**
- Ensure database supports transactions
- Check isolation level settings
- Verify no other processes modifying data

### Database Reset
If tests are failing due to stale data:
```bash
php artisan migrate:fresh
php artisan db:seed
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Performance Tests
  run: |
    cd backend
    php artisan test tests/Performance/
```

### GitLab CI Example
```yaml
performance_tests:
  script:
    - cd backend
    - php artisan test tests/Performance/
  only:
    - main
    - develop
```

## Performance Monitoring

### Production Monitoring
For production environments, consider:
- APM tools (New Relic, Datadog)
- Database query monitoring
- API response time tracking
- Error rate monitoring

### Load Testing Tools
For additional load testing:
- **k6**: HTTP load testing
- **Apache JMeter**: Comprehensive testing
- **Locust**: Python-based load testing
- **Artillery**: Node.js-based testing

## Best Practices

### Writing Performance Tests
1. **Isolate Tests**: Each test should be independent
2. **Realistic Data**: Use realistic data volumes
3. **Warm-up Queries**: Run warm-up queries before measuring
4. **Multiple Runs**: Average results over multiple runs
5. **Clear Assertions**: Use clear performance assertions

### Maintaining Tests
1. **Regular Execution**: Run tests regularly
2. **Update Targets**: Adjust targets as system evolves
3. **Monitor Trends**: Track performance over time
4. **Document Changes**: Document any performance changes

## Future Enhancements

- [ ] Add memory usage tracking
- [ ] Add CPU usage monitoring
- [ ] Implement k6 load testing
- [ ] Add performance regression detection
- [ ] Add real-time monitoring integration
- [ ] Add distributed load testing
- [ ] Add stress testing scenarios

## Related Documentation

- [Quote Management Workflow Spec](../../.kiro/specs/quote-management-workflow/)
- [Database Indexes Documentation](../../docs/DATABASE_INDEXES.md)
- [API Documentation](../../openapi/paths/quotes.yaml)
- [Phase 4 Complete Summary](../../.kiro/specs/quote-management-workflow/PHASE_4_COMPLETE_SUMMARY.md)

---

**Test Suite Version**: 1.0.0  
**Last Updated**: February 2, 2026  
**Total Tests**: 12  
**Total Assertions**: 74  
**Status**: ✅ ALL PASSING

