# Product Importer E2E Test Plan - Dry Run Validation

## Test Scenario Overview

**Objective**: Validate the complete product import flow in dry-run mode using Playwright E2E tests.

**Test Data Source**: `tests/e2e/product-import-test.csv` (19 products)

**Route Under Test**: `/adm/products/import`

## Test Data Characteristics

### CSV Structure
```
Columns: CODPROV, CODIGO, PRODUCTO, PRESENTACION, STOCK, MAYORISTA, 
          CONTADO, MINORISTA, PRECIO COMPRA, RUBRO, SUBRUBRO
```

### Edge Cases Covered

| # | Edge Case | Example Row | Expected Behavior |
|---|-----------|-------------|-------------------|
| 1 | Leading slash in name | `/DEFLECTOR P/VENTANILLA...` | Should be cleaned/transformed |
| 2 | Empty CODPROV | Row 2, 4, 5, 18, 19 | Should handle gracefully |
| 3 | Negative stock | Row 3: `STOCK=-3` | Should be flagged or skipped |
| 4 | Zero stock | Multiple rows | Should be accepted or skipped based on settings |
| 5 | Spanish number format | `34727,00` | Convert to `34727.00` |
| 6 | Special chars (dot) | Row 18: `.,7790627100537` | Should be handled |
| 7 | Multiple price columns | MAYORISTA, CONTADO, MINORISTA | Map appropriately |

### Categories Detected
- DEFLECTORES (1 product)
- ELECTRICIDAD (2 products)
- ACEITES Y LUBRICANTES (4 products)
- ACCESORIOS (4 products)
- COSMETICA (5 products)
- AUDIO (4 products)

## Expected Transformations

### 1. Name Transformation
```
Input:  /DEFLECTOR P/VENTANILLA RENAULT SANDERO
Output: Deflector P/Ventanilla Renault Sandero
```

### 2. Price Transformation (Spanish → Decimal)
```
Input:  "34727,00"
Output: 34727.00 (as Decimal)
```

### 3. Stock Handling
```
Input:  -3
Behavior: Flag as invalid OR skip based on skipStockLessThanOne setting
```

### 4. SKU/Code Handling
```
Input:  (empty), 01614FU, HX8 1LT, .
Output: Handle empty values, uppercase, trim
```

## Test Steps & Validation Points

### Step 1: CSV Upload
**Actions:**
1. Navigate to `/adm/products/import`
2. Upload `product-import-test.csv`
3. Verify auto-detection of encoding and delimiter

**Expected Results:**
- File accepted (CSV format)
- Columns detected: 11 columns
- Preview shows first 5-10 rows
- Auto-redirect to Step 2

### Step 2: Column Mapping
**Actions:**
1. Verify auto-detected mappings:
   - PRODUCTO → name
   - RUBRO → categoryId
   - STOCK → stock
   - MAYORISTA → salePrice (or CONTADO)
   - PRECIO COMPRA → costPrice
   - CODPROV → sku

2. Review global options:
   - skipStockLessThanOne: default false
   - duplicateAction: 'skip'

**Expected Results:**
- All relevant columns auto-mapped
- Spanish header detection working
- Can proceed to review step

### Step 3: Review (Dry Run)
**Actions:**
1. Wait for validation API call to complete
2. Review statistics:
   - Total: 19
   - Valid: ? (depends on validation rules)
   - Invalid: ?
   - Categories to create: 6

3. Check tabs:
   - Nuevos: Products to be created
   - Omitidos: Skipped/invalid products
   - Categorías: Category mapping

**Expected Results:**
- Validation completes without errors
- Statistics displayed correctly
- All 6 categories detected
- Negative stock products flagged if appropriate
- Spanish prices converted correctly

### Step 4: Data Quality Checks
**Validations:**
1. ✓ Product names capitalized and cleaned
2. ✓ Prices converted from Spanish format
3. ✓ Stock values handled (negative flagged)
4. ✓ Categories detected and normalized
5. ✓ Empty SKUs handled gracefully

## Known Issues & Limitations

### Current Behavior to Validate
1. **Negative Stock**: Currently may be accepted; should check if skipStockLessThanOne works
2. **Empty CODPROV**: Should be handled as optional field
3. **Leading Slash**: Should be stripped from product names
4. **Dot in CODPROV**: Row 18 has `.` as CODPROV

### Potential Bugs to Find
1. Does the validation API handle all 19 rows?
2. Are Spanish number formats correctly parsed?
3. Is the category fuzzy matching working?
4. Does the UI show all tabs correctly?
5. Are error messages clear when validation fails?

## Test Execution Commands

### Run All E2E Tests
```bash
cd /Users/cenco/Github/galiprandi/rpm
pnpm exec playwright test tests/e2e/product-importer-dry-run.spec.ts --headed
```

### Run Specific Test Group
```bash
# Step 1 tests only
pnpm exec playwright test tests/e2e/product-importer-dry-run.spec.ts --grep "Step 1"

# Step 3 tests only
pnpm exec playwright test tests/e2e/product-importer-dry-run.spec.ts --grep "Step 3"
```

### Debug Mode
```bash
pnpm exec playwright test tests/e2e/product-importer-dry-run.spec.ts --debug
```

## Pre-conditions for Test Execution

1. **Development server running**:
   ```bash
   pnpm dev
   # or
   DEBUG_AUTH=true pnpm run start:debug
   ```

2. **Database seeded** with:
   - At least one user for authentication
   - Some existing categories (to test duplicate detection)

3. **Test user credentials** configured in test

## Post-Test Validation Checklist

- [ ] All 19 products processed by validation API
- [ ] No JavaScript errors in console
- [ ] UI responsive throughout flow
- [ ] Screenshots captured for documentation
- [ ] Any bugs found documented with reproduction steps

## Files Created for Testing

1. `tests/e2e/product-import-test.csv` - Test data subset
2. `tests/e2e/product-importer-dry-run.spec.ts` - E2E test spec
3. `tests/e2e/TEST_PLAN.md` - This document

## Next Steps

1. Start development server
2. Execute E2E tests with Playwright
3. Document any issues found
4. Fix bugs and re-run tests
5. Create regression test suite
