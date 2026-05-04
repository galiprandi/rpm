# Migration: Simplify Credit Notes

## Changes
- Removed `invoiceId`, `cashAmount`, `accountCreditAmount` columns from `credit_note`
- Changed `status` default from `DRAFT` to `ISSUED`
- Added FK `paymentMethodId -> payment_method(id)`
- Added index on `paymentMethodId`

## Rationale
Credit notes are operational, not fiscal. The fiscal NOTA_CREDITO invoice will be created separately when AFIP integration is ready. MIXED refunds and CASH/ACCOUNT_CREDIT split amounts were removed to simplify the UX.
