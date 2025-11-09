# How to Improve Negative Number Input UX

## The Issue

While the code *logic* supports negative numbers, the *user experience* when typing them is poor:

1. User clicks in an input showing `5`
2. User presses `-` to type `-5`
3. The `-` character doesn't appear (because the state doesn't update)
4. User is confused and thinks negatives aren't allowed

## The Root Cause

In `InteractiveSimplex.tsx`, inputs use numeric values directly:
```typescript
<Input
  value={userConstraintRows[currentConstraintIndex][j]}  // This is a NUMBER
  onChange={(e) => updateConstraintCell(...)}
/>
```

When you type `-`, the handler checks:
```typescript
if (value === '' || value === '-' || value === '.' || value === '-.') {
  // Don't update state for incomplete values
}
```

Since state doesn't update, React doesn't re-render, so the Input still shows the old number.

## The Solution

Use **display strings** like in `SimplexInput.tsx`:

### Option 1: Full Fix (Recommended but requires refactoring)

Add display value states:
```typescript
const [constraintDisplayValues, setConstraintDisplayValues] = useState<string[][][]>([]);
const [objectiveDisplayValues, setObjectiveDisplayValues] = useState<string[]>([]);
```

Update handlers to manage both numeric and display values:
```typescript
const updateConstraintCell = (rowIdx: number, colIdx: number, value: string) => {
  // Update display value
  const newDisplay = [...constraintDisplayValues];
  newDisplay[rowIdx][colIdx] = value;
  setConstraintDisplayValues(newDisplay);
  
  // Update numeric value
  const newRows = [...userConstraintRows];
  const parsed = parseFloat(value);
  if (!isNaN(parsed)) {
    newRows[rowIdx][colIdx] = parsed;
  } else if (value === '') {
    newRows[rowIdx][colIdx] = 0;
  }
  setUserConstraintRows(newRows);
};
```

Use display values in inputs:
```typescript
<Input
  value={constraintDisplayValues[currentConstraintIndex][j]}
  onChange={(e) => updateConstraintCell(...)}
/>
```

### Option 2: Quick Fix (Simpler but less ideal)

Keep current numeric storage but convert to string in the Input:

```typescript
<Input
  value={String(userConstraintRows[currentConstraintIndex][j])}
  onChange={(e) => updateConstraintCell(...)}
/>
```

And modify the handler to always update state:
```typescript
const updateConstraintCell = (rowIdx: number, colIdx: number, value: string) => {
  const newRows = [...userConstraintRows];
  const parsed = parseFloat(value);
  
  if (value === '') {
    newRows[rowIdx][colIdx] = 0;
  } else if (!isNaN(parsed)) {
    newRows[rowIdx][colIdx] = parsed;
  }
  // Always update to trigger re-render
  setUserConstraintRows(newRows);
};
```

### Option 3: Simplest Fix (Works but not perfect)

Just ensure state updates happen:

```typescript
const updateConstraintCell = (rowIdx: number, colIdx: number, value: string) => {
  const newRows = JSON.parse(JSON.stringify(userConstraintRows)); // Force new reference
  const parsed = parseFloat(value);
  
  if (value === '') {
    newRows[rowIdx][colIdx] = 0;
  } else if (value === '-') {
    newRows[rowIdx][colIdx] = 0; // Temporarily 0 while typing
  } else if (!isNaN(parsed)) {
    newRows[rowIdx][colIdx] = parsed;
  }
  setUserConstraintRows(newRows);
};
```

## Which Inputs Need Fixing?

In `InteractiveSimplex.tsx`:

1. **Constraint rows** (lines ~1250, 1258)
   - Currently: `value={value}`
   - Handler: `updateConstraintCell`

2. **Phase 1 objective** (line ~1330)
   - Currently: `value={value}`
   - Handler: `updateObjectiveCell`

3. **Phase 2 objective** (similar)
   - Handler: `updateObjectiveCell`

4. **Ratios** (line ~1714)
   - Already has inline handler - OK

5. **Pivot row** (line ~1821)
   - Already has inline handler - OK

6. **Other rows** (line ~2001)
   - Already has inline handler - OK

## Recommendation

**Use Option 3 (Simplest Fix)** because:
- Minimal code changes
- Works immediately
- Doesn't break existing logic
- Good enough for educational use

The visual glitch of seeing `0` briefly when typing `-` is acceptable for an educational tool.

## Implementation

See `/FIX_NEGATIVE_INPUT.patch` for the exact code changes needed.
