# Quote Management Workflow - Deployment Checklist

## Pre-Deployment (1 Week Before)

### Code Quality
- [ ] All Phase 1-4 tasks completed and verified
- [ ] Code reviewed by at least 2 developers
- [ ] All merge conflicts resolved
- [ ] No TODO or FIXME comments in production code
- [ ] All console.log statements removed from frontend
- [ ] All dd() and dump() statements removed from backend

### Testing
- [ ] Backend unit tests: 100% pass rate
- [ ] Backend integration tests: All passing
- [ ] Frontend unit tests: All passing
- [ ] E2E tests: All critical workflows tested
- [ ] Performance tests: Response times < 500ms
- [ ] Load tests: System handles 100 concurrent users
- [ ] Security audit: No critical vulnerabilities
- [ ] Cross-browser testing: Chrome, Firefox, Safari, Edge
- [ ] Mobile responsiveness: Tested on iOS and Android

### Documentation
- [ ] API documentation updated (OpenAPI/Swagger)
- [ ] User guide created and reviewed
- [ ] Developer documentation complete
- [ ] Deployment guide reviewed
- [ ] Changelog updated with all changes
- [ ] README updated if needed

### Infrastructure
- [ ] Staging environment fully tested
- [ ] Production database backup verified
- [ ] Backup restoration tested
- [ ] Monitoring tools configured (Sentry, New Relic)
- [ ] Log aggregation ready (CloudWatch, Papertrail)
- [ ] CDN configured for frontend assets
- [ ] SSL certificates valid and renewed

### Team Coordination
- [ ] Deployment date and time scheduled
- [ ] Maintenance window communicated to users
- [ ] Deployment team roles assigned
- [ ] Support team briefed on new features
- [ ] Rollback plan reviewed with team
- [ ] Emergency contacts list updated
- [ ] Communication channels ready (Slack, email)

---

## Deployment Day (T-0)

### Pre-Deployment (2 hours before)

#### Database Preparation
- [ ] Create production database backup
  ```bash
  pg_dump -h prod-db-host -U postgres -d stencil_production > backup_prod_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Verify backup integrity
  ```bash
  pg_restore --list backup_prod_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Store backup in secure location (S3, backup server)
- [ ] Document backup location and timestamp

#### Code Preparation
- [ ] Pull latest code from main branch
  ```bash
  git checkout main
  git pull origin main
  ```
- [ ] Verify commit hash matches approved release
- [ ] Tag release version
  ```bash
  git tag -a v1.5.0 -m "Quote Management Workflow Phase 1"
  git push origin v1.5.0
  ```

#### Communication
- [ ] Send "Deployment Starting" notification to team
- [ ] Update status page: "Maintenance in progress"
- [ ] Post maintenance notice on user dashboard

### Backend Deployment (30 minutes)

#### Step 1: Maintenance Mode
- [ ] Enable maintenance mode
  ```bash
  php artisan down --message="Deploying Quote Management features. Back online in 30 minutes."
  ```
- [ ] Verify maintenance page displays correctly

#### Step 2: Code Deployment
- [ ] SSH into production server
- [ ] Navigate to application directory
  ```bash
  cd /var/www/stencil/backend
  ```
- [ ] Pull latest code
  ```bash
  git pull origin main
  ```
- [ ] Verify correct commit hash
  ```bash
  git log -1
  ```

#### Step 3: Dependencies
- [ ] Install/update Composer dependencies
  ```bash
  composer install --no-dev --optimize-autoloader
  ```
- [ ] Verify no errors in composer output

#### Step 4: Database Migration
- [ ] Run migrations
  ```bash
  php artisan migrate --force
  ```
- [ ] Verify migrations completed successfully
- [ ] Check migration status
  ```bash
  php artisan migrate:status
  ```
- [ ] Verify indexes created
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename = 'order_vendor_negotiations';
  ```

#### Step 5: Cache Management
- [ ] Clear all caches
  ```bash
  php artisan cache:clear
  php artisan config:clear
  php artisan route:clear
  php artisan view:clear
  ```
- [ ] Rebuild caches
  ```bash
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  ```

#### Step 6: Service Restart
- [ ] Restart queue workers
  ```bash
  php artisan queue:restart
  ```
- [ ] Restart PHP-FPM
  ```bash
  sudo systemctl restart php8.2-fpm
  ```
- [ ] Verify services running
  ```bash
  sudo systemctl status php8.2-fpm
  ```

#### Step 7: Bring Online
- [ ] Disable maintenance mode
  ```bash
  php artisan up
  ```
- [ ] Verify application accessible

### Frontend Deployment (15 minutes)

#### Step 1: Build Production Bundle
- [ ] Navigate to frontend directory
  ```bash
  cd frontend
  ```
- [ ] Pull latest code
  ```bash
  git pull origin main
  ```
- [ ] Install dependencies
  ```bash
  npm ci
  ```
- [ ] Run production build
  ```bash
  npm run build
  ```
- [ ] Verify build completed without errors
- [ ] Check bundle size
  ```bash
  du -sh dist/
  ```

#### Step 2: Deploy to Server/CDN
- [ ] Upload build to production server
  ```bash
  rsync -avz --delete dist/ user@prod-server:/var/www/stencil/frontend/
  ```
  OR
- [ ] Deploy to Vercel/Netlify
  ```bash
  vercel --prod
  # or
  netlify deploy --prod --dir=dist
  ```

#### Step 3: Verify Deployment
- [ ] Test homepage loads
  ```bash
  curl -I https://your-domain.com
  ```
- [ ] Verify assets loading correctly
- [ ] Check browser console for errors

### Post-Deployment Verification (30 minutes)

#### Smoke Tests
- [ ] Homepage loads without errors
- [ ] Login functionality works
- [ ] Admin dashboard accessible
- [ ] Quote list page loads
- [ ] Create quote modal opens
- [ ] Quote detail page displays correctly

#### Functional Tests
- [ ] Create new quote successfully
- [ ] Edit existing quote successfully
- [ ] Accept quote workflow completes
  - [ ] Quote status updates to "accepted"
  - [ ] Order status advances to "customer_quote"
  - [ ] Other quotes auto-rejected
  - [ ] Quotation amount calculated correctly
- [ ] Reject quote workflow completes
  - [ ] Quote status updates to "rejected"
  - [ ] Rejection reason saved
  - [ ] Quote becomes read-only
- [ ] Counter offer workflow completes
  - [ ] Quote status updates to "countered"
  - [ ] Round incremented
  - [ ] History updated
- [ ] Duplicate prevention works
  - [ ] Modal opens in edit mode for existing quote
  - [ ] Cannot create duplicate quote

#### Performance Tests
- [ ] API response times < 500ms
  ```bash
  curl -w "@curl-format.txt" -o /dev/null -s https://api.your-domain.com/api/v1/tenant/quotes
  ```
- [ ] Page load times < 3 seconds
- [ ] Database query times < 100ms
- [ ] No N+1 query issues

#### Security Tests
- [ ] Tenant isolation verified
  - [ ] Cannot access other tenant's quotes
  - [ ] API returns 404 for cross-tenant access
- [ ] Authorization checks working
  - [ ] Users without permissions cannot accept quotes
  - [ ] API returns 403 for unauthorized actions
- [ ] Input validation working
  - [ ] Cannot reject quote with short reason
  - [ ] Cannot accept expired quote
  - [ ] API returns 422 for validation errors

#### Database Verification
- [ ] Indexes exist and being used
  ```sql
  EXPLAIN ANALYZE SELECT * FROM order_vendor_negotiations WHERE order_id = 123;
  ```
- [ ] No orphaned records
  ```sql
  SELECT COUNT(*) FROM order_vendor_negotiations ovn
  LEFT JOIN orders o ON ovn.order_id = o.id
  WHERE o.id IS NULL;
  ```
- [ ] Data integrity maintained
  ```sql
  SELECT status, COUNT(*) FROM order_vendor_negotiations GROUP BY status;
  ```

#### Monitoring Setup
- [ ] Sentry capturing errors correctly
- [ ] New Relic/DataDog showing metrics
- [ ] CloudWatch logs streaming
- [ ] Alert rules active
- [ ] Dashboard showing real-time data

### Communication
- [ ] Send "Deployment Complete" notification to team
- [ ] Update status page: "All systems operational"
- [ ] Post success message on user dashboard
- [ ] Send deployment summary email to stakeholders

---

## Post-Deployment (24 Hours)

### Monitoring (First 4 Hours)
- [ ] Monitor error rates every 30 minutes
- [ ] Check API response times hourly
- [ ] Review user feedback/support tickets
- [ ] Watch for unusual patterns in logs
- [ ] Verify no memory leaks
- [ ] Check database connection pool usage

### Metrics Collection (First 24 Hours)
- [ ] Track quote creation rate
- [ ] Track quote acceptance rate
- [ ] Track quote rejection rate
- [ ] Monitor API endpoint usage
- [ ] Measure average response times
- [ ] Count unique users accessing feature

### Issue Tracking
- [ ] Log all reported issues
- [ ] Categorize by severity (critical, high, medium, low)
- [ ] Assign owners to each issue
- [ ] Set resolution timelines
- [ ] Communicate status to users

### Performance Analysis
- [ ] Review slow query logs
- [ ] Identify optimization opportunities
- [ ] Check cache hit rates
- [ ] Analyze database index usage
- [ ] Review frontend bundle size

---

## Week 1 Post-Deployment

### User Feedback
- [ ] Collect user feedback via surveys
- [ ] Review support tickets
- [ ] Analyze user behavior in analytics
- [ ] Identify pain points
- [ ] Document feature requests

### Performance Review
- [ ] Analyze performance trends
- [ ] Compare against baseline metrics
- [ ] Identify bottlenecks
- [ ] Plan optimization tasks
- [ ] Update performance targets

### Documentation Updates
- [ ] Update user guide based on feedback
- [ ] Add FAQ entries for common questions
- [ ] Update troubleshooting guide
- [ ] Document known issues
- [ ] Create video tutorials if needed

### Team Retrospective
- [ ] Schedule retrospective meeting
- [ ] Discuss what went well
- [ ] Identify areas for improvement
- [ ] Document lessons learned
- [ ] Update deployment process

---

## Rollback Checklist (If Needed)

### Decision Criteria
Rollback if:
- [ ] Critical bugs affecting > 10% of users
- [ ] Data integrity issues discovered
- [ ] Performance degradation > 50%
- [ ] Security vulnerabilities found
- [ ] System instability

### Rollback Steps
- [ ] Enable maintenance mode
  ```bash
  php artisan down
  ```
- [ ] Revert backend code
  ```bash
  git checkout <previous-release-tag>
  composer install --no-dev --optimize-autoloader
  ```
- [ ] Rollback database migrations (if needed)
  ```bash
  php artisan migrate:rollback --step=1
  ```
- [ ] Clear and rebuild caches
  ```bash
  php artisan cache:clear
  php artisan config:cache
  php artisan route:cache
  ```
- [ ] Restart services
  ```bash
  php artisan queue:restart
  sudo systemctl restart php8.2-fpm
  ```
- [ ] Revert frontend deployment
  ```bash
  vercel rollback
  # or
  rsync -avz --delete previous-build/ user@prod-server:/var/www/stencil/frontend/
  ```
- [ ] Disable maintenance mode
  ```bash
  php artisan up
  ```
- [ ] Verify rollback successful
- [ ] Communicate rollback to team and users
- [ ] Document rollback reason
- [ ] Plan fix and re-deployment

---

## Success Criteria

Deployment is considered successful when:

- ✅ All checklist items completed
- ✅ Zero critical errors in first 24 hours
- ✅ API response times < 500ms
- ✅ Page load times < 3 seconds
- ✅ User satisfaction > 90%
- ✅ No data integrity issues
- ✅ Tenant isolation verified
- ✅ All workflows functioning correctly
- ✅ Performance metrics within targets
- ✅ No rollback required

---

## Sign-Off

### Deployment Team

- **Technical Lead**: _________________ Date: _______
- **Backend Developer**: _________________ Date: _______
- **Frontend Developer**: _________________ Date: _______
- **DevOps Engineer**: _________________ Date: _______
- **QA Lead**: _________________ Date: _______

### Stakeholders

- **Product Manager**: _________________ Date: _______
- **Project Manager**: _________________ Date: _______
- **CTO**: _________________ Date: _______

---

## Document Information

- **Version**: 1.0
- **Created**: February 2, 2026
- **Last Updated**: February 2, 2026
- **Next Review**: After deployment completion

---

**© 2026 CanvaStencil. All rights reserved.**
