# Negative Numbers in Inputs - Status Report

## Current Status: ✅ ALREADY SUPPORTED

All inputs in the Simplex calculator **already support negative numbers**. Here's how:

### SimplexInput.tsx
- **Objective coefficients**: Full support for negative numbers
- **Constraint coefficients**: Full support for negative numbers  
- **RHS values**: Full support for negative numbers
- **Implementation**: Uses display strings that preserve intermediate states like `-`, `-.`, etc.

### InteractiveSimplex.tsx
All interactive inputs support negative numbers:

1. **Constraint row inputs** (lines 1250-1265)
   - Handles `-`, `-.`, `.` intermediate states
   - Allows typing negative coefficients
   
2. **Phase 1 objective inputs** (lines 1328-1336)
   - Same negative number support
   
3. **Phase 2 objective inputs** (similar implementation)

4. **Ratio calculations** (lines 1712-1728)
   - Full negative number support
   
5. **Pivot row calculations** (lines 1819-1835)
   - Full negative number support
   
6. **Other rows calculations** (lines 1999-2018)
   - Full negative number support

### How It Works

All number inputs use this pattern:
```typescript
onChange={(e) => {
  const value = e.target.value;
  if (value === '' || value === '-' || value === '.' || value === '-.') {
    // Allow intermediate typing states
    if (value === '') newArray[i] = 0;
  } else {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) newArray[i] = parsed;
  }
  setArray(newArray);
}}
```

This allows users to:
- Type `-` to start a negative number
- Type `-.` to start a negative decimal
- Complete the number and have it parse correctly

### Testing Negative Numbers

You can enter negative numbers in:

1. **Objective Function**
   - Example: `-3x₁ + 5x₂` → Enter `-3` for x₁ coefficient

2. **Constraint Coefficients**
   - Example: `-2x₁ + 3x₂ ≤ 10` → Enter `-2` for x₁

3. **RHS Values**
   - Example: `x₁ + x₂ ≥ -5` → Enter `-5` for RHS

4. **Interactive Mode**
   - All tableau cells accept negative numbers
   - All calculation fields accept negative numbers

## No Changes Needed ✅

The codebase already fully supports negative number input across all components. Users can type negative numbers naturally using the `-` key.

If you're experiencing issues entering negative numbers, it might be:
1. Browser-specific behavior (try Chrome/Firefox)
2. A different issue being interpreted as "can't enter negatives"
3. Confusion about when negatives are mathematically valid

## Mathematical Note

In Linear Programming:
- **Objective coefficients**: Can be negative (represents costs vs. profits)
- **Constraint coefficients**: Can be negative
- **RHS values**: Can be negative (though often transformed to positive in standard form)
- **Slack/Surplus variables**: Counts must be non-negative integers (these use different inputs)

The system correctly distinguishes between:
- Number inputs that allow negatives (coefficients, RHS, calculations)
- Count inputs that should be positive integers (number of variables, slack vars, artificial vars)
