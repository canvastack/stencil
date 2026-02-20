# 🚀 Quick Start - Payment Simulation

## Run Seeder

```bash
# Windows
cd backend
run-payment-seeder.bat

# Linux/Mac
cd backend
chmod +x run-payment-seeder.sh
./run-payment-seeder.sh

# Or direct command
cd backend
php artisan db:seed --class=PaymentSimulationSeeder
```

## View Results

### Frontend
```
URL: http://localhost:5173/customer/quotes
Login: customer@demo.com / password
```

### Database
```sql
SELECT quote_number, title, grand_total/100 as amount, status
FROM customer_quotes
WHERE quote_number LIKE 'QT-20260220-%';
```

## 5 Scenarios Created

1. **Pending** - IDR 1,581,750 (unpaid)
2. **Partial** - IDR 1,975,800 (50% DP paid)
3. **Paid** - IDR 4,440,000 (100% paid)
4. **Overdue** - IDR 2,009,100 (2 days late)
5. **Refunded** - IDR 2,053,500 (cancelled)

## Files Created

- `backend/database/seeders/PaymentSimulationSeeder.php`
- `backend/run-payment-seeder.bat` (Windows)
- `backend/run-payment-seeder.sh` (Linux/Mac)
- `PAYMENT_FLOW_DOCUMENTATION.md`
- `PAYMENT_SIMULATION_SUMMARY.md`
- `PAYMENT_SEEDER_SUCCESS.md`

## What's Next?

1. ✅ Seeder complete
2. ✅ Frontend NaN fixed
3. ⏳ Create payment page UI
4. ⏳ Implement payment API
5. ⏳ Integrate Midtrans/Xendit

---

**Status**: Ready for payment UI development
