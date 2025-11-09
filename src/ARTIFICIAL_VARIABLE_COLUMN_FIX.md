# Fix: Artificial Variable Columns Not Showing in Phase 1 Objective Setup ✅

## Problem

When setting up the Phase 1 objective function row (Z) for problems requiring artificial variables, the table did NOT show the artificial variable columns (a₁, a₂, etc.), even though they were needed for the setup.

## Root Cause

In the constraint setup completion logic (line 234), the code always transitioned to `'setup-objective'` step, regardless of whether Phase 1 was needed:

```typescript
// BEFORE (INCORRECT)
} else {
  // All constraints done, move to objective
  setFeedback('✅ All constraints are set up! Now let\'s set up the objective function row.');
  setStep('setup-objective');  // ❌ Always goes here, even for Phase 1
  const objRow = new Array(totalVars + 1).fill(0);
  setUserObjectiveRow(objRow);
}
```

The `'setup-objective'` step displays a table with:
- Decision variables (x₁, x₂, ...)
- Slack/surplus variables (s₁, s₂, ...)
- **NO artificial variables** ❌

But for Phase 1 problems, we need the `'setup-phase1-objective'` step which displays:
- Decision variables (x₁, x₂, ...)
- Slack/surplus variables (s₁, s₂, ...)
- **Artificial variables (a₁, a₂, ...)** ✅

## The Fix

Added a conditional check to determine which step to transition to based on whether Phase 1 is needed:

```typescript
// AFTER (CORRECT)
} else {
  // All constraints done, move to objective
  if (needsPhase1) {
    setFeedback('✅ All constraints are set up! Now let\'s set up the Phase 1 objective function row.');
    setStep('setup-phase1-objective');  // ✅ Correct step for Phase 1
  } else {
    setFeedback('✅ All constraints are set up! Now let\'s set up the objective function row.');
    setStep('setup-objective');  // ✅ Correct step for standard form
  }
  const objRow = new Array(totalVars + 1).fill(0);
  setUserObjectiveRow(objRow);
}
```

## What Changed

### File Modified
`/components/InteractiveSimplex.tsx` - Line 231-237

### Change Summary
- Added `if (needsPhase1)` check
- Routes to `'setup-phase1-objective'` when Phase 1 is needed
- Routes to `'setup-objective'` for standard form problems
- Updated feedback message to mention "Phase 1" when appropriate

## Impact

### Before Fix
For a problem like:
```
Maximize Z = 2x₁ + 3x₂
Subject to:
  x₁ + x₂ ≥ 4  (needs artificial variable)
  2x₁ + x₂ = 6  (needs artificial variable)
```

When setting up the objective row, the table showed:
```
Headers: | x₁ | x₂ | s₁ | s₂ | RHS |
         (missing a₁ and a₂ columns!)
```

Student tries to enter Phase 1 objective w = a₁ + a₂ but has nowhere to put it! 😵

### After Fix
Same problem now shows:
```
Headers: | x₁ | x₂ | s₁ | s₂ | a₁ | a₂ | RHS |
         (all columns present! ✅)
```

Student can correctly enter Phase 1 objective coefficients! 🎉

## Testing Scenarios

### Scenario 1: Standard Form Problem (No Phase 1)
```
Problem with only ≤ constraints
→ Goes to 'setup-objective'
→ Shows x, s columns (correct)
```

### Scenario 2: Problem Requiring Phase 1
```
Problem with ≥ or = constraints
→ Goes to 'setup-phase1-objective'
→ Shows x, s, a columns (correct) ✅
```

### Scenario 3: Mixed Constraints
```
Constraints: x₁ ≤ 5, x₁ + x₂ ≥ 4, 2x₁ = 6
→ 1 slack variable
→ 2 artificial variables
→ Goes to 'setup-phase1-objective'
→ All columns visible ✅
```

## Step Comparison

### 'setup-objective' Step
**Used for**: Standard form problems (all ≤ constraints)
**Columns shown**:
- ✅ Decision variables (x₁, x₂, ...)
- ✅ Slack variables (s₁, s₂, ...)
- ❌ Artificial variables (not needed)

**Example table**:
| Basic | x₁ | x₂ | s₁ | s₂ | RHS |

### 'setup-phase1-objective' Step
**Used for**: Problems requiring Phase 1 (≥ or = constraints)
**Columns shown**:
- ✅ Decision variables (x₁, x₂, ...)
- ✅ Slack/surplus variables (s₁, s₂, ...)
- ✅ Artificial variables (a₁, a₂, ...) ← **This was missing!**

**Example table**:
| Basic | x₁ | x₂ | s₁ | s₂ | a₁ | a₂ | RHS |

## Technical Details

### Variable Counting
- `numVariables`: Original decision variables
- `userSlackVars`: Slack and surplus variables (one per ≤ or ≥ constraint)
- `userArtificialVars`: Artificial variables (one per ≥ or = constraint)
- `totalVars`: numVariables + userSlackVars + userArtificialVars

### Objective Row Array
The `userObjectiveRow` array has length `totalVars + 1`:
- Indices 0 to numVariables-1: Decision variables
- Indices numVariables to numVariables+userSlackVars-1: Slack/surplus
- Indices numVariables+userSlackVars to totalVars-1: Artificial
- Index totalVars: RHS value

For the table to display correctly, the **headers must match** the array length and structure!

## Educational Value

This fix is critical for learning because:

1. **Visual Consistency**: Students see all the variables they're working with
2. **Proper Setup**: Students can correctly enter Phase 1 objective (w = Σ artificial vars)
3. **Understanding**: Clear distinction between Phase 1 and standard form setup
4. **Correct Learning**: Students learn the proper structure of two-phase tableaus

## Verification

To verify the fix works:

1. Create a problem with ≥ or = constraints
2. Count slack variables (pass)
3. Count artificial variables (pass)
4. Build constraint rows (pass)
5. **Check objective setup screen**
   - Should see "Setup Phase 1 Objective Function" title
   - Should see orange-highlighted artificial variable columns
   - Should be able to enter 1 for each artificial variable

Before fix: ❌ Artificial columns missing
After fix: ✅ All columns present

## Summary

**Line changed**: 1 section (~12 lines)
**Impact**: High - fixes critical bug in Phase 1 setup
**Side effects**: None - only affects routing logic
**Status**: ✅ **FIXED**

The interactive Simplex calculator now correctly displays artificial variable columns during Phase 1 objective function setup! 🎉
