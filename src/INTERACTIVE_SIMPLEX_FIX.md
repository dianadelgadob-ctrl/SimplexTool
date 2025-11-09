# Fix for InteractiveSimplex.tsx

## Issue
Line 230 in handleConstraintRowSubmit always sets step to 'setup-objective', but it should check if Phase 1 is needed.

## Current Code (lines 227-233)
```typescript
      } else {
        // All constraints done, move to objective
        setFeedback('✅ All constraints are set up! Now let\\'s set up the objective function row.');
        setStep('setup-objective');
        const objRow = new Array(totalVars + 1).fill(0);
        setUserObjectiveRow(objRow);
      }
```

## Should Be
```typescript
      } else {
        // All constraints done, move to objective
        const objRow = new Array(totalVars + 1).fill(0);
        setUserObjectiveRow(objRow);
        
        if (needsPhase1) {
          setFeedback('✅ All constraints are set up! Now set up the Phase 1 objective function.');
          setStep('setup-phase1-objective');
        } else {
          setFeedback('✅ All constraints are set up! Now set up the objective function row.');
          setStep('setup-objective');
        }
      }
```

## Manual Fix Required
The edit tools are having issues with the escaped quotes in the string. Please manually replace lines 228-232 with the corrected version above.
