# Interactive Simplex Method Calculator

A comprehensive web application for learning and solving linear programming problems using the Simplex Method.

## Features

### 🎯 Two Solving Modes

#### Interactive Mode
- **Step-by-step guided solving** with real-time feedback
- **Formula-based approach** - define operations, not cell values (10x faster)
- **Educational hints** for each step
- **Two-Phase Method support** for problems requiring artificial variables
- **Visual highlighting** of entering/leaving variables
- **Progress tracking** with iteration counter

#### Automatic Mode
- Instant solution calculation
- Complete tableau history
- Phase 1 and Phase 2 iterations (when needed)
- Optimal solution with all variable values

### 📝 Problem Setup

- Support for **any number of variables**
- Three constraint types: **≤, ≥, =**
- **Maximize or Minimize** objectives
- **Edit problem during solve** - modify and restart without re-entering everything
- **Problem summary** always visible during interactive mode

### 🎓 Interactive Learning Features

#### Setup Phase (Learn to build tableaus)
1. **Count slack/surplus variables** (≤ and ≥ constraints)
2. **Count artificial variables** (≥ and = constraints)
3. **Build constraint rows** with interactive tableau construction
4. **Build Phase 1 objective** (if artificial variables needed)
5. **Build Phase 2 objective** (from original problem)

#### Solving Phase (Learn the Simplex algorithm)
1. **Select entering variable** (most negative in objective row)
2. **Calculate ratios** (minimum ratio test)
3. **Select leaving variable** (minimum positive ratio)
4. **Define pivot row formula** (enter divisor - pivot element)
5. **Define row operations** (enter multipliers for elimination)
6. **Check optimality** (all objective row values ≥ 0)

### 🚀 Formula-Based Approach

Instead of calculating every cell manually:

**Pivot Row**: Enter one value (the divisor/pivot element)
- System calculates entire new pivot row

**Other Rows**: Enter one value per row (the multiplier)
- System calculates all rows using elimination formula

**Benefits**:
- 10x faster than cell-by-cell calculation
- Focuses on understanding formulas, not arithmetic
- Complete iterations in ~30 seconds instead of 3-5 minutes

### 📊 Export Options

- **PDF Export**: Complete solution with tableaus
- **Excel Export**: All tableaus and solutions in spreadsheet format

### 🎨 User Experience

- **Clean, modern interface** with gradient backgrounds
- **Responsive design** works on desktop and mobile
- **Real-time validation** with helpful error messages
- **Visual feedback** with color-coded states:
  - Green for correct answers
  - Red for incorrect answers  
  - Yellow for hints
  - Blue for information
- **Smooth number input** - properly handles negative numbers and decimals

## Problem Types Supported

### Standard Form Problems
- All constraints ≤
- No artificial variables needed
- Direct solving with slack variables

### Non-Standard Problems (Two-Phase Method)
- Constraints with ≥ or =
- Requires artificial variables
- Phase 1: Find basic feasible solution
- Phase 2: Optimize original objective

### Examples

#### Simple Problem (Standard Form)
```
Maximize Z = 3x₁ + 5x₂
Subject to:
  x₁ ≤ 4
  2x₂ ≤ 12
  3x₁ + 2x₂ ≤ 18
```

#### Complex Problem (Requires Phase 1)
```
Maximize Z = 2x₁ + 3x₂
Subject to:
  x₁ + x₂ ≥ 4
  2x₁ + x₂ = 6
  x₁ ≤ 5
```

## Implementation

### Tech Stack
- **React** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Lucide React** icons
- **jsPDF** for PDF export
- **xlsx** for Excel export

### Architecture

```
App.tsx
├── SimplexInput.tsx         # Problem definition form
├── InteractiveSimplex.tsx   # Step-by-step solver
└── SimplexSolution.tsx      # Automatic solution display
```

### Key Components

**SimplexInput**: 
- Dynamic form for problem setup
- Add/remove constraints
- Validation and error handling
- Pre-fills with previous problem when editing

**InteractiveSimplex**:
- Multi-step guided solver
- Formula-based calculation
- Real-time feedback and hints
- Problem summary with edit option
- Progress tracking

**SimplexSolution**:
- Automatic solver
- Tableau visualization
- Phase 1 and Phase 2 display
- Solution summary

## Educational Value

### For Students
- **Learn by doing** - interactive step-by-step solving
- **Understand formulas** - not just arithmetic
- **Immediate feedback** - know if you're on the right track
- **Visual learning** - see the algorithm in action
- **Error recovery** - hints help you learn from mistakes

### For Educators
- **Classroom demonstrations** - show each step clearly
- **Problem variations** - quickly modify and re-solve
- **Export capabilities** - share solutions with students
- **Self-paced learning** - students can practice independently

## Recent Updates

### Formula-Based Approach (Latest)
- Replaced cell-by-cell calculation with formula definition
- Pivot row: Enter divisor only
- Other rows: Enter multipliers only
- 10x speed improvement

### Edit Problem Feature
- Problem summary card in interactive mode
- Edit button returns to input with all fields pre-filled
- Seamless modification and re-solving

### Two-Phase Interactive Mode
- Full support for artificial variables
- Interactive Phase 1 objective construction
- Automatic transition to Phase 2
- Clear progress indication

### Negative Number Input Fix
- Smooth input of negative numbers
- Proper handling of "-", ".", and intermediate states
- Visual feedback during typing

## Usage

### Quick Start

1. **Choose solving mode**
   - Interactive: Learn step-by-step
   - Automatic: Get instant solution

2. **Define problem**
   - Set number of variables
   - Choose maximize or minimize
   - Enter objective coefficients
   - Add constraints with operators and RHS

3. **Solve**
   - Interactive: Follow guided steps
   - Automatic: View complete solution

4. **Edit if needed**
   - Click "Edit Problem" in interactive mode
   - Modify any values
   - Re-solve with changes

### Tips

- **Use hints** when stuck (click "Show Hint")
- **Check problem summary** before starting
- **Review each step** carefully in interactive mode
- **Export solutions** for reference or sharing
- **Experiment** by editing and re-solving

## Limitations

- Assumes all variables ≥ 0 (non-negativity constraint)
- Handles unbounded and infeasible solutions
- Integer programming not supported (LP only)
- Maximum practical size: ~10 variables, ~10 constraints

## Future Enhancements

Potential additions:
- Sensitivity analysis
- Graphical solution (for 2 variables)
- Step-by-step explanations for automatic mode
- Save/load problems
- Problem library with examples
- Dark mode

## License

See Attributions.md for third-party licenses and credits.

## Support

For issues, questions, or suggestions, please refer to the documentation files in the root directory.

---

**Built with ❤️ for linear programming education**
