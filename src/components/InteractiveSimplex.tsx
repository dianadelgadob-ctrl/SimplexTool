import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  ArrowRight, 
  RotateCcw,
  Trophy,
  HelpCircle,
  Plus,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Layers,
  Calculator,
  Download,
  Upload,
  Copy,
  FileDown
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { toast } from 'sonner@2.0.3';
import type { SimplexProblem } from '../App';

interface InteractiveSimplexProps {
  problem: SimplexProblem;
  onEditProblem?: () => void;
}

type Step = 
  | 'setup-slack' 
  | 'setup-artificial'
  | 'setup-constraints' 
  | 'setup-phase1-objective'
  | 'setup-phase2-objective'
  | 'convert-to-canonical'
  | 'select-entering' 
  | 'select-leaving'
  | 'calculate-ratios'
  | 'calculate-pivot-row'
  | 'calculate-other-rows'
  | 'check-optimality'
  | 'check-phase1-feasibility'
  | 'complete';

export function InteractiveSimplex({ problem, onEditProblem }: InteractiveSimplexProps) {
  const [tableau, setTableau] = useState<number[][]>([]);
  const [basicVariables, setBasicVariables] = useState<number[]>([]); 
  const [step, setStep] = useState<Step>('setup-slack');
  const [iteration, setIteration] = useState(0);
  const [selectedEntering, setSelectedEntering] = useState<number | null>(null);
  const [selectedLeaving, setSelectedLeaving] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info'>('info');
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showRatioExplanation, setShowRatioExplanation] = useState(false);
  const [numVariables] = useState(problem.numVariables);
  
  // Setup phase state
  const [userSlackVars, setUserSlackVars] = useState<number>(0);
  const [userArtificialVars, setUserArtificialVars] = useState<number>(0);
  const [userConstraintRows, setUserConstraintRows] = useState<(number | string)[][]>([]);
  const [userObjectiveRow, setUserObjectiveRow] = useState<(number | string)[]>([]);
  const [currentConstraintIndex, setCurrentConstraintIndex] = useState(0);
  const [totalVars, setTotalVars] = useState(0);
  const [correctSlackVars, setCorrectSlackVars] = useState(0);
  const [correctArtificialVars, setCorrectArtificialVars] = useState(0);
  const [needsPhase1, setNeedsPhase1] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<1 | 2>(1);
  const [phase1Iterations, setPhase1Iterations] = useState(0);
  const [askedPhase1Question, setAskedPhase1Question] = useState(false);
  
  // Pivot calculation state
  const [userRatios, setUserRatios] = useState<(number | string)[]>([]);
  const [userBValues, setUserBValues] = useState<(number | string)[]>([]);
  const [userEnteringValues, setUserEnteringValues] = useState<(number | string)[]>([]);
  const [incorrectRatioRows, setIncorrectRatioRows] = useState<number[]>([]);
  const [userPivotDivisor, setUserPivotDivisor] = useState<number | string>(0);
  const [userRowMultipliers, setUserRowMultipliers] = useState<(number | string)[]>([]);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  
  // Canonical form conversion state
  const [initialZRow, setInitialZRow] = useState<number[]>([]);
  const [userCanonicalZRow, setUserCanonicalZRow] = useState<(number | string)[]>([]);
  
  // Explanation visibility state
  const [showConstraintExplanation, setShowConstraintExplanation] = useState(false);
  const [showPivotRowExplanation, setShowPivotRowExplanation] = useState(false);
  
  // History tracking for export
  type TableauSnapshot = {
    tableau: number[][];
    basicVariables: number[];
    iteration: number;
    phase: 1 | 2;
    numSlackVars?: number;
    numArtificialVars?: number;
  };
  const [tableauHistory, setTableauHistory] = useState<TableauSnapshot[]>([]);

  // Initialize
  useEffect(() => {
    resetToSetup();
  }, [problem]);

  const resetToSetup = () => {
    // Calculate correct number of slack/surplus and artificial variables
    let numSlack = 0;
    let numArtificial = 0;
    problem.constraints.forEach(constraint => {
      if (constraint.operator === '<=') {
        numSlack++;
      } else if (constraint.operator === '>=') {
        numSlack++;
        numArtificial++;
      } else if (constraint.operator === '=') {
        numArtificial++;
      }
    });
    
    const requiresPhase1 = numArtificial > 0;
    
    setCorrectSlackVars(numSlack);
    setCorrectArtificialVars(numArtificial);
    setNeedsPhase1(requiresPhase1);
    setCurrentPhase(1);
    setPhase1Iterations(0);
    setUserSlackVars(0);
    setUserArtificialVars(0);
    setAskedPhase1Question(false);
    setStep('setup-slack');
    setIteration(0);
    setSelectedEntering(null);
    setSelectedLeaving(null);
    setCurrentConstraintIndex(0);
    setUserConstraintRows([]);
    setUserObjectiveRow([]);
    setTableau([]);
    setBasicVariables([]);
    setTableauHistory([]);
    setFeedback('First, determine how many slack/surplus variables are needed. Count the number of inequality constraints (≤ and ≥).');
    setFeedbackType('info');
  };

  const handleSlackVarsSubmit = () => {
    if (userSlackVars === correctSlackVars) {
      setFeedback(`✅ Correct! We need ${correctSlackVars} slack/surplus variable(s). Now let's build the constraint rows.`);
      setFeedbackType('success');
      setShowHint(false);
      
      // Always proceed to constraint setup, regardless of whether Phase 1 is needed
      setTotalVars(numVariables + userSlackVars);
      setStep('setup-constraints');
      
      // Initialize first constraint row with empty strings (blank cells)
      const firstRow = new Array(numVariables + userSlackVars + 1).fill('');
      setUserConstraintRows([firstRow]);
    } else {
      setFeedback(`❌ Not quite. We have ${problem.constraints.filter(c => c.operator === '<=' || c.operator === '>=').length} inequality constraint(s). Each needs a slack or surplus variable.`);
      setFeedbackType('error');
    }
  };

  const handlePhase1QuestionAnswer = (userSaysYes: boolean) => {
    const actuallyNeedsPhase1 = correctArtificialVars > 0;
    
    if (userSaysYes === actuallyNeedsPhase1) {
      if (actuallyNeedsPhase1) {
        setFeedback('✅ Correct! The initial basic solution is NOT feasible. Phase 1 is needed. Now count how many artificial variables are required.');
        setFeedbackType('success');
        setAskedPhase1Question(true);
        setShowHint(false);
      } else {
        setFeedback('✅ Correct! The initial basic solution IS feasible. All slack variables are non-negative. We can proceed directly with the Simplex Method.');
        setFeedbackType('success');
        setShowHint(false);
        // Proceed to solving
        setStep('select-entering');
      }
    } else {
      if (actuallyNeedsPhase1) {
        setFeedback('❌ Not quite. Look at the constraints with ≥ or = operators. Can the slack/surplus variables form a basic feasible solution? For ≥ constraints, surplus variables would be negative in the initial solution. For = constraints, there is no slack at all! The initial basic solution is NOT feasible.');
        setFeedbackType('error');
      } else {
        setFeedback('❌ Not quite. All constraints are ≤, so slack variables can form a basic feasible solution with non-negative values. The initial basic solution IS feasible. Phase 1 is not needed.');
        setFeedbackType('error');
      }
    }
  };

  const handleArtificialVarsSubmit = () => {
    if (userArtificialVars === correctArtificialVars) {
      setFeedback(`✅ Correct! We need ${correctArtificialVars} artificial variable(s). Now we need to rebuild the tableau with artificial variables and set up Phase 1.`);
      setFeedbackType('success');
      setTotalVars(numVariables + userSlackVars + userArtificialVars);
      setShowHint(false);
      
      // Rebuild constraint rows with artificial variables
      const newConstraintRows: (number | string)[][] = [];
      let slackIdx = numVariables;
      let artificialIdx = numVariables + userSlackVars;
      
      problem.constraints.forEach(constraint => {
        const row = new Array(numVariables + userSlackVars + userArtificialVars + 1).fill('');
        
        // Copy decision variable coefficients from existing rows
        constraint.coefficients.forEach((coeff, i) => {
          row[i] = coeff;
        });
        
        // Add slack/surplus
        if (constraint.operator === '<=' || constraint.operator === '>=') {
          row[slackIdx] = constraint.operator === '<=' ? 1 : -1;
          slackIdx++;
        }
        
        // Add artificial
        if (constraint.operator === '>=' || constraint.operator === '=') {
          row[artificialIdx] = 1;
          artificialIdx++;
        }
        
        // RHS
        row[row.length - 1] = constraint.rhs;
        newConstraintRows.push(row);
      });
      
      setUserConstraintRows(newConstraintRows);
      
      // Now set up Phase 1 objective
      setStep('setup-phase1-objective');
      const objRow = new Array(numVariables + userSlackVars + userArtificialVars + 1).fill('');
      setUserObjectiveRow(objRow);
      setFeedback('Constraint rows updated with artificial variables. Now set up the Phase 1 objective function (minimize w = sum of artificial variables).');
    } else {
      setFeedback(`❌ Not quite. Count constraints with ≥ (need artificial + surplus) and = (need artificial only). Total: ${correctArtificialVars}.`);
      setFeedbackType('error');
    }
  };

  const handleConstraintRowSubmit = () => {
    const constraint = problem.constraints[currentConstraintIndex];
    const currentRow = userConstraintRows[currentConstraintIndex];
    const rhsCol = currentRow.length - 1;
    
    // Build correct row (only slack/surplus, no artificial variables yet)
    const correctRow = new Array(totalVars + 1).fill(0);
    constraint.coefficients.forEach((coeff, i) => {
      correctRow[i] = coeff;
    });
    
    // Add only slack/surplus variables
    let slackIdx = numVariables;
    
    for (let i = 0; i < currentConstraintIndex; i++) {
      if (problem.constraints[i].operator === '<=' || problem.constraints[i].operator === '>=') {
        slackIdx++;
      }
    }
    
    if (constraint.operator === '<=') {
      correctRow[slackIdx] = 1;
    } else if (constraint.operator === '>=') {
      correctRow[slackIdx] = -1;  // Surplus variable
      // Note: artificial variables will be added later if needed
    } else if (constraint.operator === '=') {
      // No slack/surplus for equality constraints
      // Artificial variable will be added later if needed
    }
    
    correctRow[rhsCol] = constraint.rhs;
    
    // Check if user's row matches (convert strings/empty to numbers)
    let isCorrect = true;
    for (let i = 0; i < correctRow.length; i++) {
      const userValue = typeof currentRow[i] === 'string' 
        ? (currentRow[i] === '' ? 0 : parseFloat(currentRow[i])) 
        : currentRow[i];
      const numericValue = isNaN(userValue) ? 0 : userValue;
      if (Math.abs(numericValue - correctRow[i]) > 1e-6) {
        isCorrect = false;
        break;
      }
    }
    
    if (isCorrect) {
      setFeedback('✅ Perfect! This constraint row is correct.');
      setFeedbackType('success');
      
      if (currentConstraintIndex < problem.constraints.length - 1) {
        // Move to next constraint
        setCurrentConstraintIndex(currentConstraintIndex + 1);
        const nextRow = new Array(totalVars + 1).fill('');
        setUserConstraintRows([...userConstraintRows, nextRow]);
        setFeedback(`✅ Great! Now let's set up constraint ${currentConstraintIndex + 2} of ${problem.constraints.length}.`);
      } else {
        // All constraints done, move to objective (always Phase 2 objective initially)
        setFeedback('✅ All constraints are set up! Now let\'s set up the objective function row.');
        setStep('setup-phase2-objective');
        const objRow = new Array(totalVars + 1).fill('');
        setUserObjectiveRow(objRow);
      }
    } else {
      setFeedback('❌ This row is not quite right. Check the slack/surplus variable placement and the b value.');
      setFeedbackType('error');
    }
  };

  const handleObjectiveRowSubmit = () => {
    if (needsPhase1 && currentPhase === 1) {
      handlePhase1ObjectiveRowSubmit();
    } else {
      handlePhase2ObjectiveRowSubmit();
    }
  };

  const handlePhase1ObjectiveRowSubmit = () => {
    // Phase 1 objective: Minimize w = sum of artificial variables
    const correctRow = new Array(totalVars + 1).fill(0);
    
    // Artificial variables have coefficient of 1
    for (let i = 0; i < userArtificialVars; i++) {
      correctRow[numVariables + userSlackVars + i] = 1;
    }
    correctRow[totalVars] = 0;
    
    let isCorrect = true;
    for (let i = 0; i < correctRow.length; i++) {
      const userValue = typeof userObjectiveRow[i] === 'string' 
        ? (userObjectiveRow[i] === '' ? 0 : parseFloat(userObjectiveRow[i])) 
        : userObjectiveRow[i];
      const numericValue = isNaN(userValue) ? 0 : userValue;
      if (Math.abs(numericValue - correctRow[i]) > 1e-6) {
        isCorrect = false;
        break;
      }
    }
    
    if (isCorrect) {
      setFeedback('✅ Good! Now setting up the Phase 1 tableau with (-f) and (-w) rows. After setup, we\'ll check if the initial basic solution is feasible (w = 0)...');
      setFeedbackType('success');
      
      // Set up basic variables
      const basicVars: number[] = [];
      let slackIdx = numVariables;
      let artificialIdx = numVariables + userSlackVars;
      
      problem.constraints.forEach(constraint => {
        if (constraint.operator === '<=') {
          basicVars.push(slackIdx);
          slackIdx++;
        } else if (constraint.operator === '>=') {
          basicVars.push(artificialIdx);
          slackIdx++;
          artificialIdx++;
        } else {
          basicVars.push(artificialIdx);
          artificialIdx++;
        }
      });
      setBasicVariables(basicVars);
      
      // Build tableau with constraint rows, (-f) row, and (-w) row
      // Each row now has: decision vars, slack vars, artificial vars, (-w) column, b column
      const completeTableau: number[][] = [];
      
      // Add constraint rows with (-w) column inserted before b (convert strings/empty to numbers)
      userConstraintRows.forEach(row => {
        const numericRow = row.map(v => {
          if (typeof v === 'string') {
            return v === '' ? 0 : parseFloat(v) || 0;
          }
          return v;
        });
        const newRow = [...numericRow.slice(0, -1), 0, numericRow[numericRow.length - 1]]; // Insert 0 for (-w) column before b
        completeTableau.push(newRow);
      });
      
      // (-f) row: Original objective function (same setup as Phase 2 Z row)
      const objCoeffs = problem.isMaximization 
        ? problem.objectiveCoefficients 
        : problem.objectiveCoefficients.map(c => -c);
      
      const fRow = new Array(totalVars + 2).fill(0);
      objCoeffs.forEach((coeff, i) => {
        fRow[i] = -coeff;
      });
      // Slack variables have 0 coefficient (already filled)
      // Artificial variables have 0 coefficient (already filled)
      fRow[totalVars] = 0; // (-w) column has 0 in (-f) row
      fRow[totalVars + 1] = 0; // b value is 0
      completeTableau.push(fRow);
      
      // (-w) row: Phase 1 objective with artificial variables (convert strings/empty to numbers)
      const numericObjRow = userObjectiveRow.map(v => {
        if (typeof v === 'string') {
          return v === '' ? 0 : parseFloat(v) || 0;
        }
        return v;
      });
      const wRow = [...numericObjRow.slice(0, -1), 1, numericObjRow[numericObjRow.length - 1]]; // Insert 1 for (-w) column before b
      
      // Eliminate basic variables from (-f) row to achieve canonical form
      const fRowIdx = completeTableau.length - 1; // (-f) row was just added
      for (let i = 0; i < problem.constraints.length; i++) {
        const basicVarIdx = basicVars[i];
        const coefficient = completeTableau[fRowIdx][basicVarIdx];
        if (Math.abs(coefficient) > 1e-10) {
          for (let j = 0; j <= totalVars + 1; j++) {
            completeTableau[fRowIdx][j] -= coefficient * completeTableau[i][j];
          }
        }
      }
      
      // Eliminate artificial variables from (-w) row to achieve canonical form
      const wRowIdx = completeTableau.length;
      completeTableau.push(wRow);
      
      for (let i = 0; i < problem.constraints.length; i++) {
        if (basicVars[i] >= numVariables + userSlackVars) {
          for (let j = 0; j <= totalVars + 1; j++) {
            completeTableau[wRowIdx][j] -= completeTableau[i][j];
          }
        }
      }
      
      setTableau(completeTableau);
      setTableauHistory([{
        tableau: completeTableau,
        basicVariables: basicVars,
        iteration: 0,
        phase: 1,
        numSlackVars: userSlackVars,
        numArtificialVars: userArtificialVars
      }]);
      
      // Check if the basic solution is already feasible
      // Calculate the value of w (sum of artificial variables) in the initial solution
      // The (-w) row's RHS value after canonical form conversion gives us -w
      // wRowIdx is already defined above and points to the (-w) row
      const wValue = -completeTableau[wRowIdx][totalVars + 1]; // Negative because it's the (-w) row
      
      if (Math.abs(wValue) < 1e-10) {
        // w = 0, so all artificial variables = 0. Basic solution is already feasible!
        setFeedback('🎉 Excellent! The Phase 1 tableau is complete. Notice that w = 0, which means all artificial variables equal 0 in the initial basic solution. This means the initial solution is already feasible for the original problem! Phase 1 solving is not needed. We can proceed directly to Phase 2.');
        setFeedbackType('success');
        setShowHint(false);
        
        // Transition directly to Phase 2 setup
        setCurrentPhase(2);
        setPhase1Iterations(0);
        setIteration(0);
        
        // Remove artificial variables and (-w) column from tableau
        const numConstraints = problem.constraints.length;
        const newTableau: number[][] = [];
        
        // Keep only constraint rows (remove (-f) and (-w) rows)
        for (let i = 0; i < numConstraints; i++) {
          const row: number[] = [];
          // Keep decision variables
          for (let j = 0; j < numVariables; j++) {
            row.push(completeTableau[i][j]);
          }
          // Keep slack/surplus variables
          for (let j = numVariables; j < numVariables + userSlackVars; j++) {
            row.push(completeTableau[i][j]);
          }
          // Skip artificial variables (they're all 0 anyway)
          // Skip (-w) column (index totalVars)
          // Add b value (was at totalVars + 1)
          row.push(completeTableau[i][totalVars + 1]);
          newTableau.push(row);
        }
        
        // Update basic variables - replace artificial variables with corresponding slack/surplus
        const newBasicVars = basicVars.map((bv, i) => {
          if (bv >= numVariables + userSlackVars) {
            // This is an artificial variable, need to find the surplus variable for this row
            const constraint = problem.constraints[i];
            if (constraint.operator === '>=') {
              // Find the surplus variable index for this constraint
              let slackCount = 0;
              for (let k = 0; k < i; k++) {
                if (problem.constraints[k].operator === '<=' || problem.constraints[k].operator === '>=') {
                  slackCount++;
                }
              }
              return numVariables + slackCount;
            } else if (constraint.operator === '=') {
              // For = constraints with RHS = 0, we need a basic variable
              // Find the first variable with coefficient = 1 in this row
              for (let j = 0; j < numVariables + userSlackVars; j++) {
                if (Math.abs(newTableau[i][j] - 1) < 1e-10) {
                  // Check if this variable is not already basic in another row
                  const isBasicElsewhere = newBasicVars.some((bvar, idx) => idx !== i && bvar === j);
                  if (!isBasicElsewhere) {
                    return j;
                  }
                }
              }
              // If no suitable variable found, use the first slack variable (fallback)
              return numVariables;
            }
          }
          return bv;
        });
        
        setBasicVariables(newBasicVars);
        setTotalVars(numVariables + userSlackVars);
        setTableau(newTableau);
        
        // Go to Phase 2 objective setup
        setStep('setup-phase2-objective');
        const objRow2 = new Array(numVariables + userSlackVars + 1).fill('');
        setUserObjectiveRow(objRow2);
      } else {
        // w > 0, so we need to perform Phase 1 to minimize w
        setStep('select-entering');
        setShowHint(false);
        setFeedback(`✅ Phase 1 tableau ready! The initial solution has w = ${wValue.toFixed(4)} (sum of artificial variables). Since w > 0, the initial solution is not feasible for the original problem. We need to minimize w to find a feasible solution. Find the entering variable.`);
      }
    } else {
      setFeedback('❌ Not correct. Set coefficient of 1 for each artificial variable, 0 for all others.');
      setFeedbackType('error');
    }
  };

  const handlePhase2ObjectiveRowSubmit = () => {
    const objCoeffs = problem.isMaximization 
      ? problem.objectiveCoefficients 
      : problem.objectiveCoefficients.map(c => -c);
    
    const correctRow = new Array(totalVars + 1).fill(0);
    objCoeffs.forEach((coeff, i) => {
      correctRow[i] = -coeff;
    });
    correctRow[totalVars] = 0;
    
    let isCorrect = true;
    for (let i = 0; i < correctRow.length; i++) {
      const userValue = typeof userObjectiveRow[i] === 'string' 
        ? (userObjectiveRow[i] === '' ? 0 : parseFloat(userObjectiveRow[i])) 
        : userObjectiveRow[i];
      const numericValue = isNaN(userValue) ? 0 : userValue;
      if (Math.abs(numericValue - correctRow[i]) > 1e-6) {
        isCorrect = false;
        break;
      }
    }
    
    if (isCorrect) {
      setFeedback('✅ Excellent! Initial tableau setup complete.');
      setFeedbackType('success');
      
      // Build the tableau and check if the basic solution is feasible
      const numericConstraintRows = userConstraintRows.map(row => 
        row.map(v => {
          if (typeof v === 'string') {
            return v === '' ? 0 : parseFloat(v) || 0;
          }
          return v;
        })
      );
      const numericObjectiveRow = userObjectiveRow.map(v => {
        if (typeof v === 'string') {
          return v === '' ? 0 : parseFloat(v) || 0;
        }
        return v;
      });
      const completeTableau = [...numericConstraintRows, numericObjectiveRow];
      setTableau(completeTableau);
      
      // Determine basic variables based on slack/surplus variables
      const basicVars: number[] = [];
      let slackIdx = numVariables;
      problem.constraints.forEach(constraint => {
        if (constraint.operator === '<=') {
          basicVars.push(slackIdx);
          slackIdx++;
        } else if (constraint.operator === '>=') {
          // For >= constraints, surplus variable would be negative in initial solution
          // Can't use it as basic variable yet
          basicVars.push(-1); // Placeholder - indicates we need artificial variable
          slackIdx++;
        } else {
          // For = constraints, no slack variable exists
          // Can't have basic variable yet
          basicVars.push(-1); // Placeholder - indicates we need artificial variable
        }
      });
      setBasicVariables(basicVars);
      setTableauHistory([{
        tableau: completeTableau,
        basicVariables: basicVars,
        iteration: 0,
        phase: 2
      }]);
      
      // Now ask if the basic solution is feasible
      setStep('setup-artificial');
      setFeedback('Tableau is set up! Now let\'s check if the initial basic solution is feasible.');
      setShowHint(false);
    } else {
      setFeedback('❌ Not correct. Remember to negate coefficients for standard form.');
      setFeedbackType('error');
    }
  };

  const updateConstraintCell = (rowIdx: number, colIdx: number, value: string) => {
    const newRows = JSON.parse(JSON.stringify(userConstraintRows)); // Force new reference for re-render
    
    if (value === '') {
      newRows[rowIdx][colIdx] = '';
    } else {
      const parsed = parseFloat(value);
      // Allow intermediate typing states like "-", ".", "-.", "-1.", etc.
      // Store the raw string if it's incomplete, otherwise store the parsed number
      if (!isNaN(parsed)) {
        newRows[rowIdx][colIdx] = parsed;
      } else if (value === '-' || value === '.' || value === '-.' || value.match(/^-?\d*\.$/)) {
        // Keep the incomplete input as a string for display
        newRows[rowIdx][colIdx] = value;
      } else {
        // Invalid input, keep current value
        return;
      }
    }
    setUserConstraintRows(newRows);
  };

  const updateObjectiveCell = (colIdx: number, value: string) => {
    const newRow = JSON.parse(JSON.stringify(userObjectiveRow)); // Force new reference for re-render
    
    if (value === '') {
      newRow[colIdx] = '';
    } else {
      const parsed = parseFloat(value);
      // Allow intermediate typing states like "-", ".", "-.", "-1.", etc.
      if (!isNaN(parsed)) {
        newRow[colIdx] = parsed;
      } else if (value === '-' || value === '.' || value === '-.' || value.match(/^-?\d*\.$/)) {
        // Keep the incomplete input as a string for display
        newRow[colIdx] = value;
      } else {
        // Invalid input, keep current value
        return;
      }
    }
    setUserObjectiveRow(newRow);
  };

  const updateCanonicalZCell = (colIdx: number, value: string) => {
    const newRow = JSON.parse(JSON.stringify(userCanonicalZRow));
    
    if (value === '') {
      newRow[colIdx] = '';
    } else {
      const parsed = parseFloat(value);
      // Allow intermediate typing states like "-", ".", "-.", "-1.", etc.
      if (!isNaN(parsed)) {
        newRow[colIdx] = parsed;
      } else if (value === '-' || value === '.' || value === '-.' || value.match(/^-?\d*\.$/)) {
        // Keep the incomplete input as a string for display
        newRow[colIdx] = value;
      } else {
        // Invalid input, keep current value
        return;
      }
    }
    setUserCanonicalZRow(newRow);
  };

  const handleCanonicalFormSubmit = () => {
    // Calculate the correct canonical form
    const correctCanonical = [...initialZRow];
    
    for (let i = 0; i < problem.constraints.length; i++) {
      const basicVar = basicVariables[i];
      if (basicVar < totalVars && Math.abs(correctCanonical[basicVar]) > 1e-10) {
        const factor = correctCanonical[basicVar];
        for (let j = 0; j <= totalVars; j++) {
          correctCanonical[j] -= factor * tableau[i][j];
        }
      }
    }
    
    // Check if user's answer matches (convert strings/empty to numbers)
    let isCorrect = true;
    for (let j = 0; j <= totalVars; j++) {
      const userValue = typeof userCanonicalZRow[j] === 'string' 
        ? (userCanonicalZRow[j] === '' ? 0 : parseFloat(userCanonicalZRow[j])) 
        : userCanonicalZRow[j];
      const numericValue = isNaN(userValue) ? 0 : userValue;
      if (Math.abs(numericValue - correctCanonical[j]) > 1e-6) {
        isCorrect = false;
        break;
      }
    }
    
    if (isCorrect) {
      setFeedback('✅ Excellent! You correctly converted the Z-row to canonical form! All basic variables now have 0 coefficients.');
      setFeedbackType('success');
      
      // Update tableau with the canonical form (convert strings/empty to numbers)
      const numericCanonicalRow = userCanonicalZRow.map(v => {
        if (typeof v === 'string') {
          return v === '' ? 0 : parseFloat(v) || 0;
        }
        return v;
      });
      const completeTableau = [...tableau, numericCanonicalRow];
      setTableau(completeTableau);
      setTableauHistory(prev => [...prev, {
        tableau: completeTableau,
        basicVariables: basicVariables,
        iteration: 0,
        phase: 2
      }]);
      
      setStep('select-entering');
      setShowHint(false);
    } else {
      setFeedback('❌ Not quite right. Check your row operations. For each basic variable with non-zero coefficient in the Z-row, use: Z_new = Z_old - (coefficient) × constraint_row');
      setFeedbackType('error');
    }
  };

  const formatNumber = (num: number): string => {
    if (Math.abs(num) < 1e-10) return '0';
    return num.toFixed(3);
  };

  // Helper to remove leading zeros on Enter key press
  const handleEnterKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, currentValue: string | number, updateFn: (value: string) => void) => {
    if (e.key === 'Enter') {
      const stringValue = String(currentValue);
      if (stringValue !== '') {
        const parsed = parseFloat(stringValue);
        if (!isNaN(parsed)) {
          // Convert to number and back to string to remove leading zeros
          updateFn(String(parsed));
        }
      }
    }
  };

  const getCorrectEnteringVariable = (): number => {
    // For Phase 1, use the (-w) row (last row)
    // For Phase 2, use the Z row (last row)
    const objRow = tableau[tableau.length - 1];
    let mostNegative = -1e-10;
    let enteringVar = -1;
    
    // Exclude (-w) column and b column from search
    const numColsToCheck = needsPhase1 && currentPhase === 1 
      ? objRow.length - 2  // Exclude (-w) and b columns in Phase 1
      : objRow.length - 1; // Exclude only b column in Phase 2
    
    for (let j = 0; j < numColsToCheck; j++) {
      if (objRow[j] < mostNegative) {
        mostNegative = objRow[j];
        enteringVar = j;
      }
    }
    
    return enteringVar;
  };

  const getCorrectLeavingVariable = (enteringVar: number): number => {
    let minRatio = Infinity;
    let leavingRow = -1;
    const rhsCol = tableau[0].length - 1;
    
    // Number of constraint rows (exclude (-f) and (-w) rows in Phase 1, Z row in Phase 2)
    const numConstraintRows = needsPhase1 && currentPhase === 1
      ? tableau.length - 2  // Exclude (-f) and (-w) rows
      : tableau.length - 1; // Exclude Z row
    
    for (let i = 0; i < numConstraintRows; i++) {
      if (tableau[i][enteringVar] > 1e-10) {
        const ratio = tableau[i][rhsCol] / tableau[i][enteringVar];
        if (ratio < minRatio) {
          minRatio = ratio;
          leavingRow = i;
        }
      }
    }
    
    return leavingRow;
  };

  const handleColumnClick = (colIndex: number) => {
    if (step !== 'select-entering') return;
    if (colIndex === tableau[0].length - 1) return; // Can't select b column
    
    const correctEntering = getCorrectEnteringVariable();
    const objRow = tableau[tableau.length - 1];
    
    const rowLabel = needsPhase1 && currentPhase === 1 ? 'w row' : 'Z row';
    
    if (objRow[colIndex] >= -1e-10) {
      setFeedback(`❌ This column does not have a negative value in the ${rowLabel}. Select the variable that will be joining the basis by finding the column with the most negative value.`);
      setFeedbackType('error');
      return;
    }
    
    if (colIndex === correctEntering) {
      setSelectedEntering(colIndex);
      setFeedback(`✅ Correct! This variable will be joining the basis (most negative in ${rowLabel}). Now enter the b and entering column values for each row.`);
      setFeedbackType('success');
      setStep('calculate-ratios');
      setShowHint(false);
      
      // Initialize calculation arrays with blank cells
      const numConstraintRows = needsPhase1 && currentPhase === 1 ? tableau.length - 2 : tableau.length - 1;
      setUserRatios(new Array(numConstraintRows).fill(''));
      setUserBValues(new Array(numConstraintRows).fill(''));
      setUserEnteringValues(new Array(numConstraintRows).fill(''));
      setUserPivotDivisor('');
      setUserRowMultipliers(new Array(tableau.length).fill(''));
    } else {
      setFeedback(`❌ Not quite! While this value is negative, it's not the most negative. The most negative value gives us the steepest improvement and indicates which variable will join the basis. Try again!`);
      setFeedbackType('error');
    }
  };

  const handleRowClick = (rowIndex: number) => {
    if (step !== 'select-leaving' || selectedEntering === null) return;
    if (rowIndex === tableau.length - 1) return; // Can't select Z row
    
    const correctLeaving = getCorrectLeavingVariable(selectedEntering);
    const rhsCol = tableau[0].length - 1;
    
    if (tableau[rowIndex][selectedEntering] <= 1e-10) {
      setFeedback('❌ This row has a non-positive or zero value in the entering column. We need a positive value for the ratio test.');
      setFeedbackType('error');
      return;
    }
    
    if (rowIndex === correctLeaving) {
      setSelectedLeaving(rowIndex);
      setFeedback('✅ Perfect! This row has the minimum ratio. Now calculate the new pivot row.');
      setFeedbackType('success');
      setStep('calculate-pivot-row');
      setShowHint(false);
    } else {
      const selectedRatio = userRatios[rowIndex];
      const correctRatio = userRatios[correctLeaving];
      setFeedback(`❌ The ratio for this row is ${selectedRatio.toFixed(3)}, but we need the minimum ratio which is ${correctRatio.toFixed(3)}. Try again!`);
      setFeedbackType('error');
    }
  };

  const handleRatioSubmit = () => {
    if (!selectedEntering && selectedEntering !== 0) return;
    const correctLeaving = getCorrectLeavingVariable(selectedEntering!);
    const rhsCol = tableau[0].length - 1;
    
    let isCorrect = true;
    const incorrectRows: number[] = [];
    
    for (let i = 0; i < userBValues.length; i++) {
      const canCalculate = tableau[i][selectedEntering!] > 1e-10;
      
      if (canCalculate) {
        // Check b value
        const correctB = tableau[i][rhsCol];
        const userBValue = typeof userBValues[i] === 'string' 
          ? (userBValues[i] === '' ? NaN : parseFloat(userBValues[i])) 
          : userBValues[i];
        const numericB = isNaN(userBValue) ? NaN : userBValue;
        
        // Check entering column value
        const correctEntering = tableau[i][selectedEntering!];
        const userEnteringValue = typeof userEnteringValues[i] === 'string' 
          ? (userEnteringValues[i] === '' ? NaN : parseFloat(userEnteringValues[i])) 
          : userEnteringValues[i];
        const numericEntering = isNaN(userEnteringValue) ? NaN : userEnteringValue;
        
        if (isNaN(numericB) || isNaN(numericEntering) || 
            Math.abs(numericB - correctB) > 1e-6 || 
            Math.abs(numericEntering - correctEntering) > 1e-6) {
          isCorrect = false;
          incorrectRows.push(i);
        }
      } else {
        // For non-positive values, both should be empty
        const userBValue = typeof userBValues[i] === 'string' 
          ? userBValues[i] 
          : userBValues[i];
        const userEnteringValue = typeof userEnteringValues[i] === 'string' 
          ? userEnteringValues[i] 
          : userEnteringValues[i];
        
        // Both should be empty strings for non-positive rows
        if (userBValue !== '' || userEnteringValue !== '') {
          isCorrect = false;
          incorrectRows.push(i);
        }
      }
    }
    
    if (isCorrect) {
      setFeedback('✅ Correct! The b and entering column values are entered properly. Now select the row with the minimum positive ratio.');
      setFeedbackType('success');
      setStep('select-leaving');
      setShowHint(false);
      setIncorrectRatioRows([]);
    } else {
      setFeedback('❌ The values are not correct. Check the b value (RHS) and entering column values for each row. Leave blank for rows with non-positive entering column values.');
      setFeedbackType('error');
      setIncorrectRatioRows(incorrectRows);
    }
  };

  const handlePivotRowSubmit = () => {
    const pivotElement = tableau[selectedLeaving][selectedEntering];
    
    // Check if user identified the correct divisor (convert string to number)
    const divisorValue = typeof userPivotDivisor === 'string' 
      ? (userPivotDivisor === '' ? 0 : parseFloat(userPivotDivisor)) 
      : userPivotDivisor;
    const numericDivisor = isNaN(divisorValue) ? 0 : divisorValue;
    
    if (Math.abs(numericDivisor - pivotElement) < 1e-6) {
      // Calculate the new tableau with the pivot row
      const newTableau = JSON.parse(JSON.stringify(tableau));
      for (let j = 0; j < newTableau[0].length; j++) {
        newTableau[selectedLeaving][j] /= pivotElement;
      }
      
      setTableau(newTableau);
      setFeedback('✅ Correct! You divide by the pivot element. The new pivot row has been calculated. Now specify the multipliers for other rows.');
      setFeedbackType('success');
      setStep('calculate-other-rows');
      setShowHint(false);
      
      // Initialize multipliers array with blank cells
      setUserRowMultipliers(new Array(tableau.length).fill(''));
    } else {
      setFeedback(`❌ Not quite right. The divisor should be the pivot element at Row ${selectedLeaving + 1}, Column ${selectedEntering + 1}, which is ${formatNumber(pivotElement)}.`);
      setFeedbackType('error');
    }
  };

  const handleOtherRowsSubmit = () => {
    // Check if all multipliers are correct
    let isCorrect = true;
    let errorDetails = [];
    
    for (let i = 0; i < tableau.length; i++) {
      if (i !== selectedLeaving) {
        const correctMultiplier = tableau[i][selectedEntering];
        const userValue = typeof userRowMultipliers[i] === 'string' 
          ? (userRowMultipliers[i] === '' ? 0 : parseFloat(userRowMultipliers[i])) 
          : userRowMultipliers[i];
        const userMultiplier = isNaN(userValue) ? 0 : userValue;
        
        if (Math.abs(correctMultiplier - userMultiplier) > 1e-6) {
          isCorrect = false;
          let rowLabel;
          if (needsPhase1 && currentPhase === 1) {
            if (i === tableau.length - 1) rowLabel = '(-w) row';
            else if (i === tableau.length - 2) rowLabel = '(-f) row';
            else rowLabel = `Row ${i + 1}`;
          } else {
            rowLabel = i === tableau.length - 1 ? 'Z row' : `Row ${i + 1}`;
          }
          errorDetails.push(`${rowLabel}: expected ${formatNumber(correctMultiplier)}, got ${formatNumber(userMultiplier)}`);
        }
      }
    }
    
    if (!isCorrect) {
      const firstError = errorDetails[0];
      setFeedback(`❌ Not quite right. The multiplier should be the value in the entering variable's column. ${firstError}`);
      setFeedbackType('error');
      return;
    }
    
    // Calculate the new tableau
    const newTableau = JSON.parse(JSON.stringify(tableau));
    
    // Apply row operations
    for (let i = 0; i < newTableau.length; i++) {
      if (i !== selectedLeaving) {
        const factor = tableau[i][selectedEntering];
        for (let j = 0; j < newTableau[0].length; j++) {
          newTableau[i][j] -= factor * newTableau[selectedLeaving][j];
        }
      }
    }
    
    // Update basic variables
    const newBasicVars = [...basicVariables];
    newBasicVars[selectedLeaving] = selectedEntering;
    
    setTableau(newTableau);
    setBasicVariables(newBasicVars);
    setSelectedEntering(null);
    setSelectedLeaving(null);
    setIteration(iteration + 1);
    
    // Save to history for export
    setTableauHistory(prev => [...prev, {
      tableau: newTableau,
      basicVariables: newBasicVars,
      iteration: iteration + 1,
      phase: currentPhase,
      numSlackVars: currentPhase === 1 ? userSlackVars : undefined,
      numArtificialVars: currentPhase === 1 ? userArtificialVars : undefined
    }]);
    
    // Move to optimality check step
    setStep('check-optimality');
    setFeedback('✅ Perfect! The multipliers are correct. The new tableau has been calculated. Now examine the Z row and determine if the solution is optimal.');
    setFeedbackType('success');
  };

  const handleOptimalityCheck = (userThinksOptimal: boolean) => {
    const objRow = tableau[tableau.length - 1];
    let hasNegative = false;
    
    // Determine how many columns to check (exclude (-w) and b in Phase 1, just b in Phase 2)
    const numColsToCheck = needsPhase1 && currentPhase === 1 
      ? objRow.length - 2  // Exclude (-w) and b columns in Phase 1
      : objRow.length - 1; // Exclude only b column in Phase 2
    
    for (let j = 0; j < numColsToCheck; j++) {
      if (objRow[j] < -1e-10) {
        hasNegative = true;
        break;
      }
    }
    
    const isActuallyOptimal = !hasNegative;
    
    // Check if this is end of Phase 1
    if (needsPhase1 && currentPhase === 1 && isActuallyOptimal) {
      const phase1Value = objRow[objRow.length - 1]; // b column value
      
      if (Math.abs(phase1Value) > 1e-6) {
        // Infeasible
        setFeedback('❌ Phase 1 complete: No feasible solution exists. Problem is INFEASIBLE!');
        setFeedbackType('error');
        setStep('complete');
        return;
      }
      
      // Feasible - transition to Phase 2
      setPhase1Iterations(iteration + 1);
      setCurrentPhase(2);
      setIteration(0);
      
      // Remove artificial variables and (-w) column from tableau
      // Keep only constraint rows (exclude (-f) and (-w) rows)
      const newTableau: number[][] = [];
      for (let i = 0; i < tableau.length - 2; i++) { // Exclude (-f) and (-w) rows
        const row: number[] = [];
        for (let j = 0; j < numVariables + userSlackVars; j++) {
          row.push(tableau[i][j]);
        }
        row.push(tableau[i][tableau[i].length - 1]); // b column (skip (-w) column)
        newTableau.push(row);
      }
      
      // Validate and update basic variables
      // All basic variables should be decision or slack variables (not artificial)
      // since Phase 1 drove all artificial variables to 0
      console.log('Phase 1 -> Phase 2 transition');
      console.log('Basic variables before:', basicVariables);
      console.log('Num variables:', numVariables);
      console.log('User slack vars:', userSlackVars);
      console.log('User artificial vars:', userArtificialVars);
      
      const newBasicVars = basicVariables.map((bv, idx) => {
        if (bv >= numVariables + userSlackVars) {
          console.error(`ERROR: Row ${idx} has artificial variable ${bv} as basic! This should not happen.`);
          // This shouldn't happen - artificial variables should be non-basic
          // Find a slack variable to use instead (this is a fallback)
          return numVariables + idx;
        }
        return bv;
      });
      console.log('Basic variables after:', newBasicVars);
      setBasicVariables(newBasicVars);
      
      setTotalVars(numVariables + userSlackVars);
      setTableau(newTableau);
      setStep('setup-phase2-objective');
      const objRow2 = new Array(numVariables + userSlackVars + 1).fill(0);
      setUserObjectiveRow(objRow2);
      setFeedback('🎉 Phase 1 complete! Feasible solution found with w = 0. Artificial variables eliminated. Now transitioning to Phase 2 to optimize the original objective function.');
      setFeedbackType('success');
      return;
    }
    
    if (userThinksOptimal === isActuallyOptimal) {
      if (isActuallyOptimal) {
        setStep('complete');
        const rowLabel = needsPhase1 && currentPhase === 1 ? 'w row' : 'Z row';
        setFeedback(`🎉 Correct! The solution is optimal. All values in the ${rowLabel} are non-negative!`);
        setFeedbackType('success');
        setShowHint(false);
      } else {
        setIteration(iteration + 1);
        setStep('select-entering');
        const rowLabel = needsPhase1 && currentPhase === 1 ? 'w row' : 'Z row';
        setFeedback(`✅ Correct! The solution is not yet optimal. There are still negative values in the ${rowLabel}. Select the next entering variable.`);
        setFeedbackType('success');
        setShowHint(false);
      }
    } else {
      if (userThinksOptimal) {
        // User thinks it's optimal but it's not
        const negativeColumns: string[] = [];
        for (let j = 0; j < objRow.length - 1; j++) {
          if (objRow[j] < -1e-10) {
            const colLabel = j < numVariables ? `x${j + 1}` : `s${j - numVariables + 1}`;
            negativeColumns.push(colLabel);
          }
        }
        const rowLabel = needsPhase1 && currentPhase === 1 ? 'w row' : 'Z row';
        setFeedback(`❌ Not quite. The solution is not optimal yet. Look at the ${rowLabel} - there are still negative values in columns: ${negativeColumns.join(', ')}. The solution is only optimal when ALL values are non-negative.`);
        setFeedbackType('error');
      } else {
        // User thinks it's not optimal but it is
        const rowLabel = needsPhase1 && currentPhase === 1 ? 'w row' : 'Z row';
        setFeedback(`❌ Actually, this solution IS optimal! Look carefully at the ${rowLabel} - all values are non-negative (≥ 0). When this happens, we cannot improve the objective function further.`);
        setFeedbackType('error');
      }
    }
  };

  const getHint = () => {
    if (step === 'setup-artificial' && !askedPhase1Question) {
      // Hint for whether Phase 1 is needed
      const geOrEqConstraints = problem.constraints.filter(c => c.operator === '>=' || c.operator === '=');
      return `Consider the initial basic solution. For ≤ constraints, slack variables are positive in the basic solution. However, for ${geOrEqConstraints.length} constraint(s) with ≥ or =, we cannot use slack/surplus variables alone as they would be negative or zero, making the solution infeasible. When the initial basic solution is not feasible, we need Phase 1 to find a feasible starting point.`;
    } else if (step === 'setup-artificial' && askedPhase1Question) {
      // Hint for counting artificial variables
      const geCount = problem.constraints.filter(c => c.operator === '>=').length;
      const eqCount = problem.constraints.filter(c => c.operator === '=').length;
      return `Count constraints that need artificial variables: ${geCount} constraint(s) with ≥ (need surplus + artificial), ${eqCount} constraint(s) with = (need artificial only). Total artificial variables: ${geCount + eqCount}.`;
    } else if (step === 'setup-phase2-objective') {
      const objCoeffs = problem.isMaximization 
        ? problem.objectiveCoefficients 
        : problem.objectiveCoefficients.map(c => -c);
      const hintRow = objCoeffs.map((c, i) => `x${i+1}: ${-c}`).join(', ');
      return `For the original objective function, enter negated coefficients in standard form. ${hintRow}. Set all slack variables to 0, and b to 0. After you submit, basic variables will be automatically eliminated to achieve canonical form.`;
    } else if (step === 'select-entering') {
      return `Look for the most negative value in the (-f) row - this variable will be joining the basis.`;
    } else if (step === 'select-leaving') {
      const rhsCol = tableau[0].length - 1;
      const correctLeaving = getCorrectLeavingVariable(selectedEntering!);
      if (correctLeaving === -1) {
        return 'Problem is unbounded - no valid leaving variable can be found.';
      }
      const minRatio = tableau[correctLeaving][rhsCol] / tableau[correctLeaving][selectedEntering!];
      return `Calculate b ÷ (entering column value) for each row with positive values. The minimum ratio is ${minRatio.toFixed(3)}.`;
    } else if (step === 'calculate-ratios') {
      const correctLeaving = getCorrectLeavingVariable(selectedEntering!);
      if (correctLeaving === -1) {
        return 'Problem is unbounded - no valid leaving variable can be found.';
      }
      return `For each row with a positive value in the entering column, calculate: ratio = b ÷ (entering column value). Enter 0 for rows with non-positive values.`;
    } else if (step === 'calculate-pivot-row') {
      const pivotElement = tableau[selectedLeaving][selectedEntering];
      return `The pivot element is in Row ${selectedLeaving + 1}, Column ${selectedEntering + 1}. Its value is ${formatNumber(pivotElement)}. To create a 1 in the pivot position, divide the entire pivot row by this value.`;
    } else if (step === 'calculate-other-rows') {
      // Show example for first non-pivot row
      let exampleRow = 0;
      if (exampleRow === selectedLeaving) exampleRow = 1;
      if (exampleRow >= tableau.length) exampleRow = tableau.length - 1;
      
      const factor = tableau[exampleRow][selectedEntering];
      const rowLabel = exampleRow === tableau.length - 1 ? 'Z row' : `Row ${exampleRow + 1}`;
      
      return `For each row, the multiplier is the value in the entering variable's column. For example, ${rowLabel} has ${formatNumber(factor)} in the entering column. Use the formula: New Row = Old Row - (Multiplier × New Pivot Row).`;
    } else if (step === 'convert-to-canonical') {
      // Find which basic variables need to be eliminated
      const varsToEliminate: string[] = [];
      basicVariables.forEach((bv, i) => {
        if (bv < totalVars && Math.abs(initialZRow[bv]) > 1e-10) {
          const varName = bv < numVariables ? `x${bv + 1}` : `s${bv - numVariables + 1}`;
          varsToEliminate.push(`${varName} (coefficient ${formatNumber(initialZRow[bv])} in Row ${i + 1})`);
        }
      });
      if (varsToEliminate.length > 0) {
        return `Identify basic variables with non-zero coefficients in the Z-row: ${varsToEliminate.join(', ')}. For each one, perform: Z_new = Z_old - (Z_old[basicVar]) × constraint_row. Apply all eliminations to get the final canonical form.`;
      }
      return 'All basic variables already have 0 coefficients. The Z-row is already in canonical form!';
    } else if (step === 'check-optimality') {
      const objRow = tableau[tableau.length - 1];
      const negativeCount = objRow.slice(0, -1).filter(v => v < -1e-10).length;
      const rowLabel = needsPhase1 && currentPhase === 1 ? 'w row (Phase 1 objective)' : 'Z row';
      const phaseContext = needsPhase1 && currentPhase === 1 
        ? ' In Phase 1, we are checking if we can eliminate all artificial variables (w = 0).'
        : '';
      if (negativeCount > 0) {
        return `Examine the ${rowLabel} carefully. A solution is optimal when ALL values (excluding b) are non-negative. Currently, there are ${negativeCount} negative value(s).${phaseContext}`;
      } else {
        return `Look at the ${rowLabel}. If all values (excluding b) are non-negative (≥ 0), the solution is optimal!${phaseContext}`;
      }
    }
    return '';
  };

  const calculateRatio = (rowIndex: number, colIndex: number): string => {
    if (colIndex === null || step !== 'select-leaving') return '';
    const rhsCol = tableau[0].length - 1;
    if (tableau[rowIndex][colIndex] <= 1e-10) return '—';
    const ratio = tableau[rowIndex][rhsCol] / tableau[rowIndex][colIndex];
    return ratio.toFixed(3);
  };

  const getSolution = () => {
    const solution = new Array(numVariables).fill(0);
    const rhsCol = tableau[0].length - 1;
    
    basicVariables.forEach((varIdx, rowIdx) => {
      if (varIdx < numVariables) {
        solution[varIdx] = tableau[rowIdx][rhsCol];
      }
    });
    
    const optimalValue = tableau[tableau.length - 1][rhsCol];
    const finalValue = problem.isMaximization ? optimalValue : -optimalValue;
    
    return { solution, optimalValue: finalValue };
  };

  const exportToPDF = async () => {
    console.log('Export PDF - Tableau History:', tableauHistory);
    console.log('Export PDF - Phase 1 count:', tableauHistory.filter(t => t.phase === 1).length);
    console.log('Export PDF - Phase 2 count:', tableauHistory.filter(t => t.phase === 2).length);
    
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    
    let yPos = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    
    // Title
    doc.setFontSize(16);
    doc.text('Interactive Simplex Method Solution', 105, yPos, { align: 'center' });
    yPos += lineHeight * 2;
    
    // Problem statement
    doc.setFontSize(12);
    doc.text(`Objective: ${problem.isMaximization ? 'Maximize' : 'Minimize'}`, 20, yPos);
    yPos += lineHeight;
    
    const objText = `Z = ${problem.objectiveCoefficients.map((c, i) => `${c}x${i+1}`).join(' + ')}`;
    doc.setFontSize(10);
    doc.text(objText, 20, yPos);
    yPos += lineHeight * 1.5;
    
    // Constraints
    doc.setFontSize(12);
    doc.text('Subject to:', 20, yPos);
    yPos += lineHeight;
    
    doc.setFontSize(10);
    problem.constraints.forEach((constraint, i) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      const constraintText = `${constraint.coefficients.map((c, j) => `${c}x${j+1}`).join(' + ')} ${constraint.operator} ${constraint.rhs}`;
      doc.text(constraintText, 25, yPos);
      yPos += lineHeight;
    });
    
    yPos += lineHeight;
    
    // Add phase summary if two-phase method was used
    if (needsPhase1 && phase1Iterations > 0) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.text('Method: Two-Phase Simplex', 20, yPos);
      yPos += lineHeight;
      doc.setFontSize(10);
      doc.text(`Phase 1 Iterations: ${phase1Iterations}`, 25, yPos);
      yPos += lineHeight;
      if (step === 'complete') {
        doc.text(`Phase 2 Iterations: ${iteration}`, 25, yPos);
        yPos += lineHeight;
        doc.text(`Total Iterations: ${phase1Iterations + iteration}`, 25, yPos);
      }
      yPos += lineHeight * 1.5;
    }
    
    // Solution (if complete)
    if (step === 'complete') {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }
      
      const { solution, optimalValue } = getSolution();
      
      doc.setFontSize(14);
      doc.text('Optimal Solution', 20, yPos);
      yPos += lineHeight * 1.5;
      
      doc.setFontSize(10);
      solution.forEach((value, i) => {
        doc.text(`x${i+1} = ${formatNumber(value)}`, 25, yPos);
        yPos += lineHeight;
      });
      
      yPos += lineHeight * 0.5;
      doc.setFontSize(12);
      doc.text(`Optimal Value: Z = ${formatNumber(optimalValue)}`, 25, yPos);
      yPos += lineHeight * 2;
    }
    
    // Add all tableaus from history
    if (tableauHistory.length > 0) {
      // Group by phase
      const phase1Tableaus = tableauHistory.filter(t => t.phase === 1);
      const phase2Tableaus = tableauHistory.filter(t => t.phase === 2);
      
      // Phase 1 tableaus
      if (phase1Tableaus.length > 0) {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Phase 1: Finding Feasible Solution', 20, yPos);
        yPos += lineHeight * 2;
        
        phase1Tableaus.forEach((snapshot, idx) => {
          const t = snapshot.tableau;
          const bv = snapshot.basicVariables;
          const numConstraints = t.length - 1;
          const snapshotNumCols = t[0].length - 1 - numVariables;
          
          if (yPos > pageHeight - 80) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(11);
          doc.text(`Iteration ${snapshot.iteration}`, 20, yPos);
          yPos += lineHeight;
          
          // Generate proper headers for Phase 1 (includes slack and artificial vars)
          const slackCount = snapshot.numSlackVars || 0;
          const artificialCount = snapshot.numArtificialVars || 0;
          const slackHeaders = Array.from({ length: slackCount }, (_, i) => `s${i+1}`);
          const artificialHeaders = Array.from({ length: artificialCount }, (_, i) => `a${i+1}`);
          
          const headers = [
            'Basic',
            ...Array.from({ length: numVariables }, (_, i) => `x${i+1}`),
            ...slackHeaders,
            ...artificialHeaders,
            'RHS'
          ];
          
          const body = [
            ...t.slice(0, numConstraints).map((row, i) => {
              let basicVar;
              if (bv[i] < numVariables) {
                basicVar = `x${bv[i] + 1}`;
              } else if (bv[i] < numVariables + slackCount) {
                basicVar = `s${bv[i] - numVariables + 1}`;
              } else {
                basicVar = `a${bv[i] - numVariables - slackCount + 1}`;
              }
              return [basicVar, ...row.map(v => formatNumber(v))];
            }),
            ['w', ...t[numConstraints].map(v => formatNumber(v))]
          ];
          
          autoTable(doc, {
            head: [headers],
            body: body,
            startY: yPos,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 1.5 },
            headStyles: { fillColor: [234, 88, 12], textColor: 255 },
            bodyStyles: { textColor: 50 },
            alternateRowStyles: { fillColor: [254, 243, 235] },
            margin: { left: 20 },
          });
          
          yPos = (doc as any).lastAutoTable.finalY + 10;
        });
      }
      
      // Phase 2 tableaus
      if (phase2Tableaus.length > 0) {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        const phaseTitle = needsPhase1 ? 'Phase 2: Optimizing Objective Function' : 'Simplex Iterations';
        doc.text(phaseTitle, 20, yPos);
        yPos += lineHeight * 2;
        
        phase2Tableaus.forEach((snapshot, idx) => {
          const t = snapshot.tableau;
          const bv = snapshot.basicVariables;
          const numConstraints = t.length - 1;
          const snapshotNumCols = t[0].length - 1 - numVariables;
          
          if (yPos > pageHeight - 80) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(11);
          doc.text(`Iteration ${snapshot.iteration}`, 20, yPos);
          yPos += lineHeight;
          
          const headers = [
            'Basic',
            ...Array.from({ length: numVariables }, (_, i) => `x${i+1}`),
            ...Array.from({ length: snapshotNumCols }, (_, i) => `s${i+1}`),
            'RHS'
          ];
          
          const body = [
            ...t.slice(0, numConstraints).map((row, i) => {
              const basicVar = bv[i] < numVariables 
                ? `x${bv[i] + 1}` 
                : `s${bv[i] - numVariables + 1}`;
              return [basicVar, ...row.map(v => formatNumber(v))];
            }),
            ['Z', ...t[numConstraints].map(v => formatNumber(v))]
          ];
          
          autoTable(doc, {
            head: [headers],
            body: body,
            startY: yPos,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 1.5 },
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            bodyStyles: { textColor: 50 },
            alternateRowStyles: { fillColor: [245, 245, 255] },
            margin: { left: 20 },
          });
          
          yPos = (doc as any).lastAutoTable.finalY + 10;
        });
      }
    }
    
    // Save
    doc.save('interactive-simplex-solution.pdf');
  };

  const exportToExcel = async () => {
    console.log('Export Excel - Tableau History:', tableauHistory);
    console.log('Export Excel - Phase 1 count:', tableauHistory.filter(t => t.phase === 1).length);
    console.log('Export Excel - Phase 2 count:', tableauHistory.filter(t => t.phase === 2).length);
    
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    
    // Problem sheet
    const problemData = [
      ['Interactive Simplex Method Solution'],
      [],
      ['Optimization Type:', problem.isMaximization ? 'Maximize' : 'Minimize'],
      ['Objective Function:', problem.objectiveCoefficients.map((c, i) => `${c}x${i+1}`).join(' + ')],
      [],
      ['Constraints:'],
      ...problem.constraints.map((c, i) => [
        `Constraint ${i+1}:`,
        c.coefficients.map((coef, j) => `${coef}x${j+1}`).join(' + '),
        c.operator,
        c.rhs
      ]),
    ];
    
    // Add method and iteration summary
    if (needsPhase1 && phase1Iterations > 0) {
      problemData.push(
        [],
        ['Method:', 'Two-Phase Simplex'],
        ['Phase 1 Iterations:', phase1Iterations]
      );
      if (step === 'complete') {
        problemData.push(
          ['Phase 2 Iterations:', iteration],
          ['Total Iterations:', phase1Iterations + iteration]
        );
      }
    }
    
    if (step === 'complete') {
      const { solution, optimalValue } = getSolution();
      problemData.push(
        [],
        ['Optimal Solution:'],
        ...solution.map((val, i) => [`x${i+1}`, formatNumber(val)]),
        [],
        ['Optimal Value:', formatNumber(optimalValue)]
      );
    }
    
    const problemSheet = XLSX.utils.aoa_to_sheet(problemData);
    XLSX.utils.book_append_sheet(wb, problemSheet, 'Problem & Solution');
    
    // Export all tableaus from history
    if (tableauHistory.length > 0) {
      // Group by phase
      const phase1Tableaus = tableauHistory.filter(t => t.phase === 1);
      const phase2Tableaus = tableauHistory.filter(t => t.phase === 2);
      
      // Phase 1 tableaus
      if (phase1Tableaus.length > 0) {
        phase1Tableaus.forEach((snapshot, idx) => {
          const t = snapshot.tableau;
          const bv = snapshot.basicVariables;
          const numConstraints = t.length - 1;
          const snapshotNumCols = t[0].length - 1 - numVariables;
          
          // Generate proper headers for Phase 1 (includes slack and artificial vars)
          const slackCount = snapshot.numSlackVars || 0;
          const artificialCount = snapshot.numArtificialVars || 0;
          const slackHeaders = Array.from({ length: slackCount }, (_, i) => `s${i+1}`);
          const artificialHeaders = Array.from({ length: artificialCount }, (_, i) => `a${i+1}`);
          
          const headers = [
            'Basic',
            ...Array.from({ length: numVariables }, (_, i) => `x${i+1}`),
            ...slackHeaders,
            ...artificialHeaders,
            'RHS'
          ];
          
          const rows = t.slice(0, numConstraints).map((row, i) => {
            let basicVar;
            if (bv[i] < numVariables) {
              basicVar = `x${bv[i] + 1}`;
            } else if (bv[i] < numVariables + slackCount) {
              basicVar = `s${bv[i] - numVariables + 1}`;
            } else {
              basicVar = `a${bv[i] - numVariables - slackCount + 1}`;
            }
            return [basicVar, ...row.map(v => parseFloat(formatNumber(v)))];
          });
          
          const wRow = ['w', ...t[numConstraints].map(v => parseFloat(formatNumber(v)))];
          
          const tableauData = [
            [`Phase 1 - Iteration ${snapshot.iteration}`],
            headers,
            ...rows,
            wRow
          ];
          
          const tableauSheet = XLSX.utils.aoa_to_sheet(tableauData);
          XLSX.utils.book_append_sheet(wb, tableauSheet, `Phase1-Iter${snapshot.iteration}`);
        });
      }
      
      // Phase 2 tableaus
      if (phase2Tableaus.length > 0) {
        phase2Tableaus.forEach((snapshot, idx) => {
          const t = snapshot.tableau;
          const bv = snapshot.basicVariables;
          const numConstraints = t.length - 1;
          const snapshotNumCols = t[0].length - 1 - numVariables;
          
          const headers = [
            'Basic',
            ...Array.from({ length: numVariables }, (_, i) => `x${i+1}`),
            ...Array.from({ length: snapshotNumCols }, (_, i) => `s${i+1}`),
            'RHS'
          ];
          
          const rows = t.slice(0, numConstraints).map((row, i) => {
            const basicVar = bv[i] < numVariables 
              ? `x${bv[i] + 1}` 
              : `s${bv[i] - numVariables + 1}`;
            return [basicVar, ...row.map(v => parseFloat(formatNumber(v)))];
          });
          
          const zRow = ['Z', ...t[numConstraints].map(v => parseFloat(formatNumber(v)))];
          
          const phaseLabel = needsPhase1 ? 'Phase 2' : 'Simplex';
          const tableauData = [
            [`${phaseLabel} - Iteration ${snapshot.iteration}`],
            headers,
            ...rows,
            zRow
          ];
          
          const tableauSheet = XLSX.utils.aoa_to_sheet(tableauData);
          const sheetName = needsPhase1 ? `Phase2-Iter${snapshot.iteration}` : `Iter${snapshot.iteration}`;
          XLSX.utils.book_append_sheet(wb, tableauSheet, sheetName);
        });
      }
    }
    
    XLSX.writeFile(wb, 'interactive-simplex-solution.xlsx');
  };

  // Save/Load Progress Functions
  const saveProgress = () => {
    const progressData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      problem,
      state: {
        tableau,
        basicVariables,
        step,
        iteration,
        selectedEntering,
        selectedLeaving,
        userSlackVars,
        userArtificialVars,
        userConstraintRows,
        userObjectiveRow,
        currentConstraintIndex,
        totalVars,
        correctSlackVars,
        correctArtificialVars,
        needsPhase1,
        currentPhase,
        phase1Iterations,
        askedPhase1Question,
        userRatios,
        userBValues,
        userEnteringValues,
        userPivotDivisor,
        userRowMultipliers,
        currentRowIndex,
        initialZRow,
        userCanonicalZRow,
        tableauHistory
      }
    };
    
    return JSON.stringify(progressData, null, 2);
  };

  const handleDownloadProgress = () => {
    try {
      const progressJson = saveProgress();
      const blob = new Blob([progressJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simplex-progress-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Progress saved successfully!');
    } catch (error) {
      toast.error('Failed to save progress');
      console.error(error);
    }
  };

  const handleCopyProgress = () => {
    try {
      const progressJson = saveProgress();
      navigator.clipboard.writeText(progressJson);
      toast.success('Progress copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy progress');
      console.error(error);
    }
  };

  const loadProgress = (progressJson: string) => {
    try {
      const progressData = JSON.parse(progressJson);
      
      if (!progressData.version || !progressData.state || !progressData.problem) {
        throw new Error('Invalid progress file format');
      }

      // Restore state
      const state = progressData.state;
      setTableau(state.tableau);
      setBasicVariables(state.basicVariables);
      setStep(state.step);
      setIteration(state.iteration);
      setSelectedEntering(state.selectedEntering);
      setSelectedLeaving(state.selectedLeaving);
      setUserSlackVars(state.userSlackVars);
      setUserArtificialVars(state.userArtificialVars);
      setUserConstraintRows(state.userConstraintRows);
      setUserObjectiveRow(state.userObjectiveRow);
      setCurrentConstraintIndex(state.currentConstraintIndex);
      setTotalVars(state.totalVars);
      setCorrectSlackVars(state.correctSlackVars);
      setCorrectArtificialVars(state.correctArtificialVars);
      setNeedsPhase1(state.needsPhase1);
      setCurrentPhase(state.currentPhase);
      setPhase1Iterations(state.phase1Iterations);
      setAskedPhase1Question(state.askedPhase1Question);
      setUserRatios(state.userRatios);
      setUserBValues(state.userBValues);
      setUserEnteringValues(state.userEnteringValues);
      setUserPivotDivisor(state.userPivotDivisor);
      setUserRowMultipliers(state.userRowMultipliers);
      setCurrentRowIndex(state.currentRowIndex);
      setInitialZRow(state.initialZRow);
      setUserCanonicalZRow(state.userCanonicalZRow);
      setTableauHistory(state.tableauHistory);

      // Set appropriate feedback based on step
      setFeedbackType('success');
      setFeedback('Progress loaded successfully! Continue from where you left off.');
      
      toast.success('Progress loaded successfully!');
    } catch (error) {
      toast.error('Failed to load progress. Please check the file format.');
      console.error(error);
    }
  };

  const handleLoadFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          loadProgress(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleLoadFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      loadProgress(clipboardText);
    } catch (error) {
      toast.error('Failed to read from clipboard. Please try uploading a file instead.');
      console.error(error);
    }
  };

  if (tableau.length === 0 && step !== 'setup-slack' && step !== 'setup-artificial' && step !== 'setup-constraints' && step !== 'setup-phase1-objective' && step !== 'setup-phase2-objective' && step !== 'setup-objective') return <div>Loading...</div>;

  const numConstraints = tableau.length > 0 ? tableau.length - 1 : 0;
  // For Phase 1, exclude both (-w) and b columns; for Phase 2, exclude only b column
  const numCols = tableau.length > 0 && tableau[0] 
    ? (needsPhase1 && currentPhase === 1 ? tableau[0].length - 2 : tableau[0].length - 1)
    : 0;
  const progress = step === 'complete' ? 100 : (iteration / (iteration + 3)) * 100;

  return (
    <div className="space-y-6 pb-32">
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary">Iteration {iteration}</Badge>
                {needsPhase1 && (
                  <Badge 
                    variant={currentPhase === 1 ? 'default' : 'outline'}
                    className={currentPhase === 1 ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}
                  >
                    <Layers className="w-3 h-3 mr-1" />
                    Phase {currentPhase}
                  </Badge>
                )}
                <Badge variant={step === 'complete' ? 'default' : 'outline'}>
                  {step === 'setup-slack' && 'Setup: Count Slack Variables'}
                  {step === 'setup-artificial' && 'Setup: Count Artificial Variables'}
                  {step === 'setup-constraints' && 'Setup: Build Constraint Rows'}
                  {step === 'setup-phase1-objective' && 'Setup: Build Phase 1 Objective'}
                  {step === 'setup-phase2-objective' && 'Setup: Build Phase 2 Objective'}
                  {step === 'setup-objective' && 'Setup: Build Objective Row'}
                  {step === 'convert-to-canonical' && 'Convert to Canonical Form'}
                  {step === 'select-entering' && 'Step 1: Select Entering Variable'}
                  {step === 'select-leaving' && 'Step 2: Select Leaving Variable'}
                  {step === 'calculate-ratios' && 'Step 3: Calculate Ratios'}
                  {step === 'calculate-pivot-row' && 'Step 4: Calculate Pivot Row'}
                  {step === 'calculate-other-rows' && 'Step 5: Calculate Other Rows'}
                  {step === 'check-optimality' && 'Step 6: Check Optimality'}
                  {step === 'check-phase1-feasibility' && 'Check Phase 1 Feasibility'}
                  {step === 'complete' && 'Optimal Solution Found!'}
                </Badge>
              </div>
              <Progress value={progress} className="h-2 w-64" />
            </div>
            
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleDownloadProgress} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download your progress as a file</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleCopyProgress} variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy progress to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleLoadFromFile} variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Load
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Load progress from a file</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button onClick={resetToSetup} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky Feedback Section at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Alert className={
            feedbackType === 'success' ? 'bg-green-50 border-green-200' :
            feedbackType === 'error' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }>
            {feedbackType === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {feedbackType === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
            {feedbackType === 'info' && <Lightbulb className="h-5 w-5 text-blue-600" />}
            <AlertDescription className={
              feedbackType === 'success' ? 'text-green-800' :
              feedbackType === 'error' ? 'text-red-800' :
              'text-blue-800'
            }>
              {feedback}
            </AlertDescription>
          </Alert>

          {!['complete', 'setup-constraints', 'setup-slack', 'setup-phase1-objective', 'setup-phase2-objective', 'setup-objective'].includes(step) && (
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => setShowHint(!showHint)}
                variant="outline"
                size="sm"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </Button>
            </div>
          )}

          {showHint && getHint() && (
            <Alert className="mt-3 bg-yellow-50 border-yellow-200">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {getHint()}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Problem Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Problem Summary</CardTitle>
            {onEditProblem && (
              <Button onClick={onEditProblem} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Edit Problem
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">Optimization Type:</div>
              <div className="flex items-center gap-2">
                {problem.isMaximization ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span>Maximize</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span>Minimize</span>
                  </>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">Objective Function:</div>
              <div className="font-mono text-sm">
                Z = {problem.objectiveCoefficients.map((c, i) => {
                  const sign = c >= 0 && i > 0 ? '+ ' : '';
                  return `${sign}${c}x${i + 1}`;
                }).join(' ')}
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Constraints:</div>
              <div className="space-y-1">
                {problem.constraints.map((constraint, i) => (
                  <div key={i} className="font-mono text-sm pl-3">
                    {constraint.coefficients.map((c, j) => {
                      const sign = c >= 0 && j > 0 ? '+ ' : '';
                      return `${sign}${c}x${j + 1}`;
                    }).join(' ')} {constraint.operator} {constraint.rhs}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="text-xs text-gray-500">
              Variables: {problem.numVariables} | Constraints: {problem.constraints.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Information Card - Show during Two-Phase Method */}
      {needsPhase1 && step !== 'setup-slack' && step !== 'setup-artificial' && step !== 'setup-constraints' && (
        <Card className={currentPhase === 1 ? 'bg-orange-50 border-orange-200' : 'bg-indigo-50 border-indigo-200'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className={`w-5 h-5 ${currentPhase === 1 ? 'text-orange-600' : 'text-indigo-600'}`} />
              Two-Phase Simplex Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border-2 ${currentPhase === 1 ? 'bg-orange-100 border-orange-300' : 'bg-orange-50 border-orange-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${currentPhase === 1 ? 'bg-orange-600' : 'bg-orange-300'}`}>
                      1
                    </div>
                    <span className={`${currentPhase === 1 ? 'font-semibold' : ''}`}>Phase 1</span>
                    {currentPhase === 1 && <Badge className="bg-orange-600">Active</Badge>}
                    {currentPhase === 2 && phase1Iterations > 0 && <Badge variant="outline" className="text-green-600 border-green-600">✓ Complete</Badge>}
                  </div>
                  <p className="text-xs text-gray-700">
                    {currentPhase === 1 
                      ? 'Finding a basic feasible solution by minimizing artificial variables (w)'
                      : `Completed in ${phase1Iterations} iteration(s)`
                    }
                  </p>
                </div>
                
                <div className={`p-3 rounded-lg border-2 ${currentPhase === 2 ? 'bg-indigo-100 border-indigo-300' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${currentPhase === 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                      2
                    </div>
                    <span className={`${currentPhase === 2 ? 'font-semibold' : ''}`}>Phase 2</span>
                    {currentPhase === 2 && <Badge className="bg-indigo-600">Active</Badge>}
                  </div>
                  <p className="text-xs text-gray-700">
                    {currentPhase === 2 
                      ? 'Optimizing the original objective function (Z)'
                      : 'Will begin after Phase 1 completes'
                    }
                  </p>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 p-2 bg-white rounded border">
                <strong>Current Status:</strong> {' '}
                {currentPhase === 1 && 'Working to eliminate artificial variables and find a feasible starting solution.'}
                {currentPhase === 2 && 'Feasible solution found! Now optimizing the original objective function.'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-green-600" />
                Optimal Solution
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={exportToPDF} variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={exportToExcel} variant="outline" size="sm">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {needsPhase1 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Two-Phase Method Summary</span>
                  </div>
                  <div className="text-xs text-gray-700 space-y-1">
                    <p>✓ Phase 1: Completed in {phase1Iterations} iteration(s) - Feasible solution found</p>
                    <p>✓ Phase 2: Completed in {iteration} iteration(s) - Optimal solution found</p>
                    <p className="pt-1 text-gray-600">Total iterations: {phase1Iterations + iteration}</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {getSolution().solution.map((value, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-white rounded">
                      <span>x<sub>{index + 1}</sub></span>
                      <span>{formatNumber(value)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center p-6 bg-white rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">
                      {problem.isMaximization ? 'Maximum' : 'Minimum'} Value
                    </div>
                    <div className="text-green-900">
                      Z = {formatNumber(getSolution().optimalValue)}
                    </div>
                    {!needsPhase1 && (
                      <div className="text-xs text-gray-500 mt-2">
                        Found in {iteration} iteration(s)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'setup-slack' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-6 h-6 text-gray-600" />
              Setup Slack/Surplus Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Count the number of inequality constraints (≤ and ≥). Each needs a slack or surplus variable.</p>
              <div className="flex items-center gap-2">
                <Label htmlFor="slack-vars">Number of Slack/Surplus Variables:</Label>
                <Input
                  id="slack-vars"
                  type="number"
                  value={userSlackVars}
                  onChange={(e) => setUserSlackVars(parseInt(e.target.value) || 0)}
                  onKeyDown={(e) => handleEnterKeyPress(e, userSlackVars, (val) => setUserSlackVars(parseInt(val) || 0))}
                  className="w-20"
                />
              </div>
              <Button onClick={handleSlackVarsSubmit} size="sm">
                <ArrowRight className="w-4 h-4 mr-2" />
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'setup-artificial' && !askedPhase1Question && tableau.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-orange-600" />
              Check Initial Basic Solution Feasibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm mb-3">
                  <strong>Initial Simplex Tableau:</strong>
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr>
                        <th className="border p-2 bg-gray-100"></th>
                        {Array.from({ length: numVariables }, (_, i) => (
                          <th key={i} className="border p-2 bg-gray-100">
                            x<sub>{i + 1}</sub>
                          </th>
                        ))}
                        {Array.from({ length: userSlackVars }, (_, i) => (
                          <th key={i} className="border p-2 bg-gray-100">
                            <span className="text-gray-500">s<sub>{i + 1}</sub></span>
                          </th>
                        ))}
                        <th className="border p-2 bg-gray-100">b</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableau.slice(0, -1).map((row, i) => (
                        <tr key={i}>
                          <td className="border p-2 text-center bg-gray-50">
                            Row {i + 1}
                          </td>
                          {row.map((value, j) => (
                            <td key={j} className="border p-2 text-center tabular-nums">
                              {formatNumber(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-yellow-50">
                        <td className="border p-2 text-center">Z</td>
                        {tableau[tableau.length - 1].map((value, j) => (
                          <td key={j} className="border p-2 text-center tabular-nums">
                            {formatNumber(value)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg space-y-3">
                <div>
                  <p className="text-sm mb-2"><strong>📋 Your Constraints:</strong></p>
                  <div className="space-y-1 text-xs">
                    {problem.constraints.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-white rounded">
                        <span className="text-gray-600">Constraint {i + 1}:</span>
                        <span className="font-mono">
                          {c.coefficients.map((coef, j) => {
                            const sign = coef >= 0 && j > 0 ? '+ ' : '';
                            return `${sign}${coef}x${j + 1}`;
                          }).join(' ')} {c.operator === '<=' ? '≤' : c.operator === '>=' ? '≥' : '='} {c.rhs}
                        </span>
                        <Badge variant={c.operator === '<=' ? 'secondary' : 'destructive'} className="text-xs">
                          {c.operator}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-3 border-t border-orange-200">
                  <p className="text-sm mb-2"><strong>🤔 Think About:</strong></p>
                  <div className="text-xs text-gray-700 space-y-2">
                    <p>
                      • For <strong>≤ constraints</strong>: Slack variables can be in the initial basic solution (they're positive)
                    </p>
                    <p>
                      • For <strong>≥ constraints</strong>: Surplus variables would be <strong>negative</strong> in the initial basic solution
                    </p>
                    <p>
                      • For <strong>= constraints</strong>: No slack variable at all - we need a basic variable!
                    </p>
                    <p className="pt-2 text-orange-800">
                      When the initial basic solution is <strong>not feasible</strong> (would have negative values or no basic variables), 
                      we need <strong>Phase 1</strong> to find a feasible starting point using artificial variables.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm mb-3">
                  <strong>Question: Is the initial basic solution feasible (can all slack/surplus variables be non-negative)?</strong>
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handlePhase1QuestionAnswer(false)} 
                    variant="default"
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Yes, It's Feasible
                  </Button>
                  <Button 
                    onClick={() => handlePhase1QuestionAnswer(true)} 
                    variant="outline"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    No, Phase 1 Needed
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'setup-artificial' && askedPhase1Question && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-6 h-6 text-orange-600" />
              Count Artificial Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Now count the number of constraints with ≥ or = operators. Each needs an artificial variable.</p>
              <div className="p-3 bg-orange-50 rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-gray-700 mb-2"><strong>Why artificial variables?</strong></p>
                  <p className="text-xs text-gray-600">
                    For ≥ and = constraints, we cannot use slack variables alone as our initial basic variables 
                    because they would violate the constraints (negative or zero values in the basis).
                  </p>
                </div>
                <div className="pt-2 border-t border-orange-200">
                  <p className="text-sm text-gray-700 mb-1"><strong>Counting Rule:</strong></p>
                  <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                    <li><strong>≥ constraints:</strong> Need 1 artificial variable each (plus 1 surplus variable)</li>
                    <li><strong>= constraints:</strong> Need 1 artificial variable each</li>
                    <li><strong>≤ constraints:</strong> Do NOT need artificial variables</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="artificial-vars">Number of Artificial Variables:</Label>
                <Input
                  id="artificial-vars"
                  type="number"
                  value={userArtificialVars}
                  onChange={(e) => setUserArtificialVars(parseInt(e.target.value) || 0)}
                  onKeyDown={(e) => handleEnterKeyPress(e, userArtificialVars, (val) => setUserArtificialVars(parseInt(val) || 0))}
                  className="w-20"
                />
              </div>
              <Button onClick={handleArtificialVarsSubmit} size="sm">
                <ArrowRight className="w-4 h-4 mr-2" />
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'setup-constraints' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-6 h-6 text-gray-600" />
                Setup Constraint Rows
              </CardTitle>
              <Button
                onClick={() => setShowConstraintExplanation(!showConstraintExplanation)}
                variant="outline"
                size="sm"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                {showConstraintExplanation ? 'Hide Explanation' : 'Request Explanation'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {showConstraintExplanation && (
                <Alert className="bg-purple-50 border-purple-200">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  <AlertDescription className="text-sm text-gray-700 mt-2">
                    Failing to add a slack variable would be effectively forcing the constraint to an equality condition. If the slack variable ultimately turns out to be zero, the constraint is active at the equality condition, but if the slack variable turns out to be non-zero, that constraint is inactive – and the slack variable is indicative of the margin between the left hand side and the right hand side, or slack, hence the name slack variable.
                  </AlertDescription>
                </Alert>
              )}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="mb-2">Constraint {currentConstraintIndex + 1}: {' '}
                  {problem.constraints[currentConstraintIndex].coefficients.map((c, i) => (
                    <span key={i}>
                      {i > 0 && (c >= 0 ? ' + ' : ' ')}
                      {c}x<sub>{i + 1}</sub>
                    </span>
                  ))}
                  {' '}{problem.constraints[currentConstraintIndex].operator === '<=' ? '≤' : 
                       problem.constraints[currentConstraintIndex].operator === '>=' ? '≥' : '='}{' '}
                  {problem.constraints[currentConstraintIndex].rhs}
                </p>
                <p className="text-sm text-gray-600">
                  {problem.constraints[currentConstraintIndex].operator === '<=' && 
                    'For ≤ constraints, add a slack variable (coefficient = 1)'}
                  {problem.constraints[currentConstraintIndex].operator === '>=' && 
                    'For ≥ constraints, add a surplus variable (coefficient = -1) and an artificial variable (coefficient = 1)'}
                  {problem.constraints[currentConstraintIndex].operator === '=' && 
                    'For = constraints, add an artificial variable (coefficient = 1)'}
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {Array.from({ length: numVariables }, (_, i) => (
                        <th key={i} className="border p-2 bg-gray-100">
                          x<sub>{i + 1}</sub>
                        </th>
                      ))}
                      {Array.from({ length: userSlackVars }, (_, i) => (
                        <th key={i} className="border p-2 bg-yellow-100">
                          <span className="text-gray-600">s<sub>{i + 1}</sub></span>
                        </th>
                      ))}
                      {needsPhase1 && Array.from({ length: userArtificialVars }, (_, i) => (
                        <th key={`art-${i}`} className="border p-2 bg-orange-100">
                          <span className="text-orange-600">a<sub>{i + 1}</sub></span>
                        </th>
                      ))}
                      <th className="border p-2 bg-gray-100">b</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {userConstraintRows[currentConstraintIndex].map((value, j) => (
                        <td key={j} className="border p-2 text-center">
                          {j < numVariables || j === totalVars ? (
                            <Input
                              type="number"
                              value={value}
                              onChange={(e) => updateConstraintCell(currentConstraintIndex, j, e.target.value)}
                              onKeyDown={(e) => handleEnterKeyPress(e, value, (val) => updateConstraintCell(currentConstraintIndex, j, val))}
                              className="w-20 text-center"
                              step="0.1"
                            />
                          ) : (
                            <Input
                              type="number"
                              value={value}
                              onChange={(e) => updateConstraintCell(currentConstraintIndex, j, e.target.value)}
                              onKeyDown={(e) => handleEnterKeyPress(e, value, (val) => updateConstraintCell(currentConstraintIndex, j, val))}
                              className="w-20 text-center bg-yellow-50"
                              step="0.1"
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <Button onClick={handleConstraintRowSubmit} size="sm">
                <ArrowRight className="w-4 h-4 mr-2" />
                Check Answer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'setup-phase1-objective' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-6 h-6 text-orange-600" />
              Setup Phase 1 Objective Function
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg space-y-2">
                <p className="text-sm"><strong>Phase 1 Goal:</strong> Minimize w = sum of all artificial variables</p>
                <p className="text-sm text-gray-700">
                  In tableau form, the w row has coefficient of 1 for each artificial variable, 0 for all others.
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Note:</strong> After entering, we'll eliminate artificial variables that are in the basis.
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {Array.from({ length: numVariables }, (_, i) => (
                        <th key={i} className="border p-2 bg-gray-100">
                          x<sub>{i + 1}</sub>
                        </th>
                      ))}
                      {Array.from({ length: userSlackVars }, (_, i) => (
                        <th key={i} className="border p-2 bg-gray-100">
                          <span className="text-gray-500">s<sub>{i + 1}</sub></span>
                        </th>
                      ))}
                      {Array.from({ length: userArtificialVars }, (_, i) => (
                        <th key={i} className="border p-2 bg-orange-100">
                          <span className="text-orange-600">a<sub>{i + 1}</sub></span>
                        </th>
                      ))}
                      <th className="border p-2 bg-gray-100">b</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {userObjectiveRow.map((value, j) => (
                        <td key={j} className="border p-2 text-center">
                          <Input
                            type="number"
                            value={value}
                            onChange={(e) => updateObjectiveCell(j, e.target.value)}
                            onKeyDown={(e) => handleEnterKeyPress(e, value, (val) => updateObjectiveCell(j, val))}
                            className={`w-20 text-center ${
                              j >= numVariables + userSlackVars && j < totalVars ? 'bg-orange-50' : ''
                            }`}
                            step="0.1"
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <Button onClick={handleObjectiveRowSubmit} size="sm">
                <ArrowRight className="w-4 h-4 mr-2" />
                Check Answer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'setup-phase2-objective' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-6 h-6 text-indigo-600" />
              Setup Phase 2 Objective Function (Z-row)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-lg space-y-3">
                <p className="text-sm">
                  <strong>Phase 2:</strong> Now optimize the original objective function using the feasible solution from Phase 1.
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Original Objective:</strong> {problem.isMaximization ? 'Maximize' : 'Minimize'} Z = {' '}
                  {problem.objectiveCoefficients.map((c, i) => (
                    <span key={i}>
                      {i > 0 && (c >= 0 ? ' + ' : ' ')}{c}x<sub>{i + 1}</sub>
                    </span>
                  ))}
                </p>
                <div className="pt-2 border-t border-indigo-200">
                  <p className="text-sm mb-2"><strong>📝 How to set up the Z-row:</strong></p>
                  <ol className="text-xs text-gray-700 space-y-1 ml-4 list-decimal">
                    <li><strong>Step 1:</strong> Enter coefficients in standard form (negated for maximization)</li>
                    <li><strong>Step 2:</strong> Set slack variable coefficients to 0</li>
                    <li><strong>Step 3:</strong> Set RHS to 0</li>
                    <li><strong>Step 4:</strong> After submission, we'll convert to <strong>canonical form</strong> by eliminating basic variables</li>
                  </ol>
                </div>
                <div className="p-2 bg-white rounded border border-indigo-300">
                  <p className="text-xs text-indigo-900">
                    <strong>⚠️ Canonical Form:</strong> For a tableau to be in canonical form, the Z-row must have 0 coefficients 
                    for all basic variables. This ensures we can correctly identify entering variables. We'll automatically 
                    eliminate basic variables using row operations after you enter the initial Z-row.
                  </p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {Array.from({ length: numVariables }, (_, i) => (
                        <th key={i} className="border p-2 bg-gray-100">
                          x<sub>{i + 1}</sub>
                        </th>
                      ))}
                      {Array.from({ length: userSlackVars }, (_, i) => (
                        <th key={i} className="border p-2 bg-gray-100">
                          <span className="text-gray-500">s<sub>{i + 1}</sub></span>
                        </th>
                      ))}
                      <th className="border p-2 bg-gray-100">b</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {userObjectiveRow.map((value, j) => (
                        <td key={j} className="border p-2 text-center">
                          <Input
                            type="number"
                            value={value}
                            onChange={(e) => updateObjectiveCell(j, e.target.value)}
                            onKeyDown={(e) => handleEnterKeyPress(e, value, (val) => updateObjectiveCell(j, val))}
                            className="w-20 text-center"
                            step="0.1"
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <Button onClick={handleObjectiveRowSubmit} size="sm">
                <ArrowRight className="w-4 h-4 mr-2" />
                Check Answer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'convert-to-canonical' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-6 h-6 text-purple-600" />
              Convert Z-row to Canonical Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg space-y-3">
                <p className="text-sm">
                  <strong>Goal:</strong> Eliminate all basic variables from the Z-row so they have 0 coefficients.
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Current Basic Variables:</strong> {' '}
                  {basicVariables.map((bv, i) => {
                    const varName = bv < numVariables 
                      ? `x${bv + 1}` 
                      : bv < numVariables + userSlackVars 
                      ? `s${bv - numVariables + 1}` 
                      : `a${bv - numVariables - userSlackVars + 1}`;
                    return (
                      <span key={i} className="inline-block mr-2 px-2 py-1 bg-white rounded">
                        Row {i + 1}: {varName}
                      </span>
                    );
                  })}
                </p>
                
                <div className="pt-2 border-t border-purple-200">
                  <p className="text-sm mb-2"><strong>📝 Step-by-Step Process:</strong></p>
                  <ol className="text-xs text-gray-700 space-y-2 ml-4 list-decimal">
                    {basicVariables.map((bv, i) => {
                      const coeff = initialZRow[bv];
                      if (Math.abs(coeff) < 1e-10) return null;
                      const varName = bv < numVariables ? `x${bv + 1}` : `s${bv - numVariables + 1}`;
                      return (
                        <li key={i}>
                          Eliminate <strong>{varName}</strong> from Z-row. Current coefficient: {formatNumber(coeff)}
                          <br />
                          <span className="text-indigo-600 font-mono text-xs">
                            Z_new = Z_old - ({formatNumber(coeff)}) × Row_{i + 1}
                          </span>
                        </li>
                      );
                    }).filter(Boolean)}
                  </ol>
                  {basicVariables.every((bv) => Math.abs(initialZRow[bv]) < 1e-10) && (
                    <p className="text-xs text-green-700 mt-2">
                      ✓ All basic variables already have 0 coefficients! Z-row is already in canonical form.
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm mb-2"><strong>Initial Z-row (before elimination):</strong></p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {Array.from({ length: numVariables }, (_, i) => (
                          <th key={i} className="border p-2 bg-gray-100 text-xs">
                            x<sub>{i + 1}</sub>
                          </th>
                        ))}
                        {Array.from({ length: userSlackVars }, (_, i) => (
                          <th key={i} className="border p-2 bg-gray-100 text-xs">
                            s<sub>{i + 1}</sub>
                          </th>
                        ))}
                        <th className="border p-2 bg-gray-100 text-xs">b</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {initialZRow.map((value, j) => (
                          <td key={j} className="border p-2 text-center text-xs tabular-nums">
                            {formatNumber(value)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm mb-2"><strong>Current Constraint Rows:</strong></p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="border p-2 bg-gray-100">Basic</th>
                        {Array.from({ length: numVariables }, (_, i) => (
                          <th key={i} className="border p-2 bg-gray-100">
                            x<sub>{i + 1}</sub>
                          </th>
                        ))}
                        {Array.from({ length: userSlackVars }, (_, i) => (
                          <th key={i} className="border p-2 bg-gray-100">
                            s<sub>{i + 1}</sub>
                          </th>
                        ))}
                        <th className="border p-2 bg-gray-100">b</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableau.map((row, i) => (
                        <tr key={i}>
                          <td className="border p-2 text-center bg-gray-50">
                            {basicVariables[i] < numVariables ? (
                              <span>x<sub>{basicVariables[i] + 1}</sub></span>
                            ) : (
                              <span>s<sub>{basicVariables[i] - numVariables + 1}</sub></span>
                            )}
                          </td>
                          {row.map((value, j) => (
                            <td key={j} className="border p-2 text-center tabular-nums">
                              {formatNumber(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                <p className="text-sm mb-3"><strong>Enter the Z-row after applying all eliminations:</strong></p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {Array.from({ length: numVariables }, (_, i) => (
                          <th key={i} className="border p-2 bg-gray-100 text-xs">
                            x<sub>{i + 1}</sub>
                          </th>
                        ))}
                        {Array.from({ length: userSlackVars }, (_, i) => (
                          <th key={i} className="border p-2 bg-gray-100 text-xs">
                            s<sub>{i + 1}</sub>
                          </th>
                        ))}
                        <th className="border p-2 bg-gray-100 text-xs">b</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {userCanonicalZRow.map((value, j) => (
                          <td key={j} className="border p-2 text-center">
                            <Input
                              type="number"
                              value={value}
                              onChange={(e) => updateCanonicalZCell(j, e.target.value)}
                              onKeyDown={(e) => handleEnterKeyPress(e, value, (val) => updateCanonicalZCell(j, val))}
                              className="w-20 text-center"
                              step="0.1"
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <Button onClick={handleCanonicalFormSubmit} size="sm">
                <ArrowRight className="w-4 h-4 mr-2" />
                Check Canonical Form
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'setup-objective' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-6 h-6 text-gray-600" />
              Setup Objective Function Row
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="mb-2">
                  Objective: {problem.isMaximization ? 'Maximize' : 'Minimize'} Z = {' '}
                  {problem.objectiveCoefficients.map((c, i) => (
                    <span key={i}>
                      {i > 0 && (c >= 0 ? ' + ' : ' ')}
                      {c}x<sub>{i + 1}</sub>
                    </span>
                  ))}
                </p>
                <p className="text-sm text-gray-600">
                  In standard form, we write: Z - ({' '}
                  {problem.isMaximization 
                    ? problem.objectiveCoefficients.map((c, i) => (
                        <span key={i}>
                          {i > 0 && (c >= 0 ? ' + ' : ' ')}
                          {c}x<sub>{i + 1}</sub>
                        </span>
                      ))
                    : problem.objectiveCoefficients.map((c, i) => (
                        <span key={i}>
                          {i > 0 && (-c >= 0 ? ' + ' : ' ')}
                          {-c}x<sub>{i + 1}</sub>
                        </span>
                      ))
                  }) = 0
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  This means: {' '}
                  {(problem.isMaximization ? problem.objectiveCoefficients : problem.objectiveCoefficients.map(c => -c)).map((c, i) => (
                    <span key={i}>
                      {i > 0 && ' '}{-c >= 0 && i > 0 ? '+ ' : ''}{-c < 0 ? '- ' : ''}{Math.abs(-c)}x<sub>{i + 1}</sub>
                    </span>
                  ))} {' '} (slack variables = 0)
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {Array.from({ length: numVariables }, (_, i) => (
                        <th key={i} className="border p-2 bg-gray-100">
                          x<sub>{i + 1}</sub>
                        </th>
                      ))}
                      {Array.from({ length: userSlackVars }, (_, i) => (
                        <th key={i} className="border p-2 bg-gray-100">
                          <span className="text-gray-500">s<sub>{i + 1}</sub></span>
                        </th>
                      ))}
                      <th className="border p-2 bg-gray-100">b</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {userObjectiveRow.map((value, j) => (
                        <td key={j} className="border p-2 text-center">
                          <Input
                            type="number"
                            value={value}
                            onChange={(e) => updateObjectiveCell(j, e.target.value)}
                            onKeyDown={(e) => handleEnterKeyPress(e, value, (val) => updateObjectiveCell(j, val))}
                            className="w-20 text-center"
                            step="0.1"
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <Button onClick={handleObjectiveRowSubmit} size="sm">
                <ArrowRight className="w-4 h-4 mr-2" />
                Check Answer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step !== 'setup-slack' && step !== 'setup-artificial' && step !== 'setup-constraints' && 
       step !== 'setup-phase1-objective' && step !== 'setup-phase2-objective' && step !== 'setup-objective' && 
       step !== 'convert-to-canonical' && (
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                {needsPhase1 && currentPhase === 1 && (
                  <span className="text-orange-600">Phase 1</span>
                )}
                {needsPhase1 && currentPhase === 2 && (
                  <span className="text-indigo-600">Phase 2</span>
                )}
                Simplex Tableau
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {step === 'select-entering' && 'Click on a column header to select the entering variable'}
                {step === 'select-leaving' && 'Click on a row (Basic column) to select the leaving variable'}
                {(step === 'calculate-ratios' || step === 'calculate-pivot-row' || step === 'calculate-other-rows') && 'The pivot element is highlighted in green'}
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-100">Basic</th>
                    {Array.from({ length: numVariables }, (_, i) => (
                      <th
                        key={i}
                        className={`border p-2 cursor-pointer transition-colors ${
                          step === 'select-entering'
                            ? 'hover:bg-blue-100'
                            : ''
                        } ${
                          selectedEntering === i
                            ? 'bg-blue-200'
                            : 'bg-gray-50'
                        }`}
                        onClick={() => handleColumnClick(i)}
                      >
                        x<sub>{i + 1}</sub>
                      </th>
                    ))}
                    {Array.from({ length: numCols - numVariables }, (_, i) => {
                      const isArtificial = needsPhase1 && currentPhase === 1 && 
                                            i >= userSlackVars;
                      return (
                        <th
                          key={i}
                          className={`border p-2 cursor-pointer transition-colors ${
                            step === 'select-entering'
                              ? 'hover:bg-blue-100'
                              : ''
                          } ${
                            selectedEntering === numVariables + i
                              ? 'bg-blue-200'
                              : isArtificial ? 'bg-orange-50' : 'bg-gray-50'
                          }`}
                          onClick={() => handleColumnClick(numVariables + i)}
                        >
                          <span className={isArtificial ? 'text-orange-600' : 'text-gray-500'}>
                            {isArtificial ? 'a' : 's'}<sub>{isArtificial ? i - userSlackVars + 1 : i + 1}</sub>
                          </span>
                        </th>
                      );
                    })}
                    <th className="border p-2 bg-gray-100">(-f)</th>
                    {needsPhase1 && currentPhase === 1 && (
                      <th className="border p-2 bg-orange-100">(-w)</th>
                    )}
                    <th className="border p-2 bg-gray-100">b</th>
                    {step === 'select-leaving' && selectedEntering !== null && (
                      <th className="border p-2 bg-yellow-50">b/a+</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tableau.slice(0, needsPhase1 && currentPhase === 1 ? tableau.length - 2 : numConstraints).map((row, i) => (
                    <tr key={i}>
                      <td
                        className={`border p-2 text-center cursor-pointer transition-colors ${
                          step === 'select-leaving'
                            ? 'hover:bg-blue-100'
                            : ''
                        } ${
                          selectedLeaving === i
                            ? 'bg-blue-200'
                            : 'bg-gray-50'
                        }`}
                        onClick={() => handleRowClick(i)}
                      >
                        {basicVariables[i] < numVariables ? (
                          <span>x<sub>{basicVariables[i] + 1}</sub></span>
                        ) : basicVariables[i] < numVariables + userSlackVars ? (
                          <span className="text-gray-500">
                            s<sub>{basicVariables[i] - numVariables + 1}</sub>
                          </span>
                        ) : (
                          <span className="text-orange-600">
                            a<sub>{basicVariables[i] - numVariables - userSlackVars + 1}</sub>
                          </span>
                        )}
                      </td>
                      {row.map((value, j) => {
                        // In Phase 1: row has decision vars, slack vars, artificial vars, (-w) column, b column
                        // In Phase 2: row has decision vars, slack vars, b column
                        const isPhase1 = needsPhase1 && currentPhase === 1;
                        const isWCol = isPhase1 && j === row.length - 2; // (-w) column is second to last
                        const isRHS = j === row.length - 1; // b column is last
                        
                        // Phase 1: Skip (-w) and b positions, render them specially below
                        if (isPhase1 && (isWCol || isRHS)) {
                          if (isWCol) {
                            // Render (-f) cell and (-w) cell
                            return (
                              <React.Fragment key={j}>
                                <td className="border p-2 text-center tabular-nums bg-gray-50">0</td>
                                <td className="border p-2 text-center tabular-nums bg-orange-50">
                                  {formatNumber(value)}
                                </td>
                              </React.Fragment>
                            );
                          } else if (isRHS) {
                            // Render b cell
                            return (
                              <td
                                key={j}
                                className={`border p-2 text-center tabular-nums ${
                                  selectedLeaving === i ? 'bg-blue-100' : ''
                                }`}
                              >
                                {formatNumber(value)}
                              </td>
                            );
                          }
                        }
                        
                        // Phase 2: When at RHS, render (-f) cell then b cell
                        if (!isPhase1 && isRHS) {
                          return (
                            <React.Fragment key={j}>
                              <td className="border p-2 text-center tabular-nums bg-gray-50">0</td>
                              <td
                                className={`border p-2 text-center tabular-nums ${
                                  selectedLeaving === i ? 'bg-blue-100' : ''
                                }`}
                              >
                                {formatNumber(value)}
                              </td>
                            </React.Fragment>
                          );
                        }
                        
                        // Normal variable cells
                        return (
                          <td
                            key={j}
                            className={`border p-2 text-center tabular-nums ${
                              selectedEntering === j && selectedLeaving === i
                                ? 'bg-green-200'
                                : selectedEntering === j
                                ? 'bg-blue-100'
                                : selectedLeaving === i
                                ? 'bg-blue-100'
                                : ''
                            }`}
                          >
                            {formatNumber(value)}
                          </td>
                        );
                      })}
                      {step === 'select-leaving' && selectedEntering !== null && (
                        <td className="border p-2 text-center bg-yellow-50 tabular-nums">
                          {calculateRatio(i, selectedEntering)}
                        </td>
                      )}
                    </tr>
                  ))}
                  {/* (-f) row - shown for both Phase 1 and Phase 2 */}
                  {needsPhase1 && currentPhase === 1 ? (
                    <tr className="bg-indigo-50">
                      <td className="border p-2 text-center">(-f)</td>
                      {tableau[tableau.length - 2].map((value, j) => {
                        const isWCol = j === tableau[tableau.length - 2].length - 2;
                        const isRHS = j === tableau[tableau.length - 2].length - 1;
                        
                        return (
                          <React.Fragment key={j}>
                            {(isWCol || isRHS) ? null : (
                              <td className="border p-2 text-center tabular-nums">
                                {formatNumber(value)}
                              </td>
                            )}
                            {isWCol && (
                              <>
                                <td className="border p-2 text-center tabular-nums bg-indigo-100">1</td>
                                <td className="border p-2 text-center tabular-nums bg-orange-100">
                                  {formatNumber(value)}
                                </td>
                              </>
                            )}
                            {isRHS && (
                              <td className="border p-2 text-center tabular-nums">
                                {formatNumber(value)}
                              </td>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {step === 'select-leaving' && selectedEntering !== null && (
                        <td className="border p-2"></td>
                      )}
                    </tr>
                  ) : (
                    <tr className="bg-indigo-50">
                      <td className="border p-2 text-center">(-f)</td>
                      {tableau[numConstraints].map((value, j) => {
                        const isRHS = j === tableau[numConstraints].length - 1;
                        return (
                          <React.Fragment key={j}>
                            {isRHS && (
                              <td className="border p-2 text-center tabular-nums bg-indigo-100">
                                1
                              </td>
                            )}
                            <td
                              className={`border p-2 text-center tabular-nums ${
                                selectedEntering === j
                                  ? 'bg-blue-100'
                                  : ''
                              }`}
                            >
                              {formatNumber(value)}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      {step === 'select-leaving' && selectedEntering !== null && (
                        <td className="border p-2"></td>
                      )}
                    </tr>
                  )}
                  {/* (-w) row - only shown for Phase 1 */}
                  {needsPhase1 && currentPhase === 1 && (
                    <tr className="bg-orange-50">
                      <td className="border p-2 text-center">(-w)</td>
                      {tableau[tableau.length - 1].map((value, j) => {
                        const isWCol = j === tableau[tableau.length - 1].length - 2;
                        const isRHS = j === tableau[tableau.length - 1].length - 1;
                        
                        return (
                          <React.Fragment key={j}>
                            {(isWCol || isRHS) ? null : (
                              <td
                                className={`border p-2 text-center tabular-nums ${
                                  selectedEntering === j ? 'bg-blue-100' : ''
                                }`}
                              >
                                {formatNumber(value)}
                              </td>
                            )}
                            {isWCol && (
                              <>
                                <td className="border p-2 text-center tabular-nums bg-gray-50">0</td>
                                <td className="border p-2 text-center tabular-nums bg-orange-100">
                                  1
                                </td>
                              </>
                            )}
                            {isRHS && (
                              <td className="border p-2 text-center tabular-nums">
                                {formatNumber(value)}
                              </td>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {step === 'select-leaving' && selectedEntering !== null && (
                        <td className="border p-2"></td>
                      )}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
              <div className="space-y-2 text-gray-600">
                <p><strong>Legend:</strong></p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-200 border"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-200 border"></div>
                    <span>Pivot Element</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border"></div>
                    <span>Pivot Row/Column</span>
                  </div>
                  {needsPhase1 && currentPhase === 1 && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-100 border border-orange-300"></div>
                      <span>Artificial Variables</span>
                    </div>
                  )}
                </div>
                {needsPhase1 && (
                  <p className="text-xs pt-1">
                    <strong>Objective Row:</strong> {currentPhase === 1 ? 'w (minimize artificial variables)' : 'Z (original objective)'}
                  </p>
                )}
              </div>
            </div>

            {/* Request Explanation Button */}
            <div className="mt-4">
              <Button
                onClick={() => setShowExplanation(!showExplanation)}
                variant="outline"
                size="sm"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                {showExplanation ? 'Hide Explanation' : 'Request Explanation'}
              </Button>
            </div>

            {/* Explanation Section */}
            {showExplanation && (
              <Alert className="mt-4 bg-blue-50 border-blue-200">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <p className="text-sm">
                    The most negative value in the Z row indicates that a unit change in that variable would have the largest impact on improving the objective function. While we still do not know how much we can increase it without violating a constraint, and hence there is no guarantee that adding a different variable might be a better choice (allow a larger improvement in the objective function), it is the one we'll guess should be added to the basis in our efforts to improve the objective function.
                  </p>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Canonical Form Info for Phase 2 Initial Tableau */}
            {needsPhase1 && currentPhase === 2 && iteration === 0 && step === 'select-entering' && (
              <Alert className="mt-4 bg-indigo-50 border-indigo-200">
                <Lightbulb className="h-4 w-4 text-indigo-600" />
                <AlertDescription className="text-indigo-900">
                  <strong>📐 Canonical Form Achieved!</strong>
                  <p className="text-sm mt-1">
                    Notice that the Z-row now has 0 values for all basic variables (check the columns corresponding to variables in the "Basic" column). 
                    This is called <strong>canonical form</strong> and is essential for the Simplex method to work correctly. 
                    The non-zero values you see were eliminated using row operations: Z_row -= (coefficient) × constraint_row.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'calculate-ratios' && selectedEntering !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Calculate Ratios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the b value (RHS) and entering column value for each row. The ratio will be calculated automatically. Leave blank for rows with non-positive values in the entering column.
              </p>

              {/* Request Explanation Button */}
              <div>
                <Button
                  onClick={() => setShowRatioExplanation(!showRatioExplanation)}
                  variant="outline"
                  size="sm"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  {showRatioExplanation ? 'Hide Explanation' : 'Request Explanation'}
                </Button>
              </div>

              {/* Explanation Section */}
              {showRatioExplanation && (
                <Alert className="bg-blue-50 border-blue-200">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <p className="text-sm">
                      The ratio is a measure of how quickly the constraint would be approached as I increase the basic variable. A low value is preferred since it generally means I can increase the variable more before engaging the constraint.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                {tableau.slice(0, numConstraints).map((row, i) => {
                  const rhsCol = tableau[0].length - 1;
                  const canCalculate = tableau[i][selectedEntering] > 1e-10;
                  
                  return (
                    <div key={i} className="p-3 bg-gray-50 rounded space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-16 font-medium">Row {i + 1}:</span>
                        {!canCalculate && (
                          <span className="text-sm text-gray-500">
                            (non-positive value in entering column)
                          </span>
                        )}
                      </div>
                      {canCalculate && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Label className="w-8 text-sm">b =</Label>
                          <Input
                        type="number"
                        value={userBValues[i]}
                        onChange={(e) => {
                          const newBValues = [...userBValues];
                          const value = e.target.value;
                          if (value === '') {
                            newBValues[i] = '';
                          } else {
                            const parsed = parseFloat(value);
                            if (!isNaN(parsed)) {
                              newBValues[i] = parsed;
                            } else if (value === '-' || value === '.' || value === '-.' || value.match(/^-?\d*\.$/)) {
                              newBValues[i] = value;
                            } else {
                              return;
                            }
                          }
                          setUserBValues(newBValues);
                        }}
                        onKeyDown={(e) => handleEnterKeyPress(e, userBValues[i], (val) => {
                          const newBValues = [...userBValues];
                          newBValues[i] = val;
                          setUserBValues(newBValues);
                        })}
                        className="w-28"
                        step="0.001"
                        placeholder="Enter b"
                      />
                      
                      <span className="text-sm text-gray-500">,</span>
                      
                      <Label className="text-sm">entering column =</Label>
                      <Input
                        type="number"
                        value={userEnteringValues[i]}
                        onChange={(e) => {
                          const newEnteringValues = [...userEnteringValues];
                          const value = e.target.value;
                          if (value === '') {
                            newEnteringValues[i] = '';
                          } else {
                            const parsed = parseFloat(value);
                            if (!isNaN(parsed)) {
                              newEnteringValues[i] = parsed;
                            } else if (value === '-' || value === '.' || value === '-.' || value.match(/^-?\\d*\\.$/)) {
                              newEnteringValues[i] = value;
                            } else {
                              return;
                            }
                          }
                          setUserEnteringValues(newEnteringValues);
                        }}
                        onKeyDown={(e) => handleEnterKeyPress(e, userEnteringValues[i], (val) => {
                          const newEnteringValues = [...userEnteringValues];
                          newEnteringValues[i] = val;
                          setUserEnteringValues(newEnteringValues);
                        })}
                        className="w-28"
                        step="0.001"
                        placeholder="Enter value"
                      />
                      
                      <Label className="text-sm font-medium">Ratio</Label>
                      <div className="px-3 py-2 bg-white border rounded text-sm min-w-[80px]">
                        {(() => {
                          const bValue = typeof userBValues[i] === 'string' 
                            ? (userBValues[i] === '' ? NaN : parseFloat(userBValues[i])) 
                            : userBValues[i];
                          const enteringValue = typeof userEnteringValues[i] === 'string' 
                            ? (userEnteringValues[i] === '' ? NaN : parseFloat(userEnteringValues[i])) 
                            : userEnteringValues[i];
                          
                          const calculatedRatio = !isNaN(bValue) && !isNaN(enteringValue) && enteringValue !== 0
                            ? bValue / enteringValue
                            : null;
                          
                          return calculatedRatio !== null ? formatNumber(calculatedRatio) : '—';
                        })()}
                      </div>
                    </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <Button onClick={handleRatioSubmit} size="sm">
                <ArrowRight className="w-4 h-4 mr-2" />
                Check Values
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'calculate-pivot-row' && selectedEntering !== null && selectedLeaving !== null && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Define Pivot Row Formula</CardTitle>
              <Button
                onClick={() => setShowPivotRowExplanation(!showPivotRowExplanation)}
                variant="outline"
                size="sm"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                {showPivotRowExplanation ? 'Hide Explanation' : 'Request Explanation'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {showPivotRowExplanation && (
                <Alert className="bg-purple-50 border-purple-200">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  <AlertDescription className="text-sm text-gray-700 mt-2">
                    Our goal is to perform matrix operations that will produce all zeros in the column for the basic variable just added except for a 1 for that actual variable.
                  </AlertDescription>
                </Alert>
              )}
              <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                <div>
                  <p className="mb-2">
                    <strong>Pivot Row Formula:</strong>
                  </p>
                  <p className="text-sm text-gray-700 font-mono bg-white p-2 rounded border">
                    New Pivot Row = Old Pivot Row ÷ Pivot Element
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-700">
                    The pivot element is at Row {selectedLeaving + 1}, in the entering variable's column.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Question:</strong> What value should you divide the pivot row by?
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Label htmlFor="pivot-divisor">Divide pivot row by:</Label>
                <Input
                  id="pivot-divisor"
                  type="number"
                  value={userPivotDivisor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setUserPivotDivisor('');
                    } else {
                      const parsed = parseFloat(value);
                      if (!isNaN(parsed)) {
                        setUserPivotDivisor(parsed);
                      } else if (value === '-' || value === '.' || value === '-.' || value.match(/^-?\d*\.$/)) {
                        setUserPivotDivisor(value);
                      } else {
                        return;
                      }
                    }
                  }}
                  onKeyDown={(e) => handleEnterKeyPress(e, userPivotDivisor, (val) => setUserPivotDivisor(val))}
                  className="w-32"
                  step="0.001"
                  placeholder="Enter divisor"
                />
              </div>
              
              <div className="p-3 bg-gray-50 rounded text-sm text-gray-600">
                <p><strong>Current Pivot Row:</strong> [{tableau[selectedLeaving].map(v => formatNumber(v)).join(', ')}]</p>
                <p className="mt-2"><strong>Hint:</strong> Look at the value in Row {selectedLeaving + 1}, Column {selectedEntering + 1} (the pivot position). This is the pivot element.</p>
              </div>
              
              <Button onClick={handlePivotRowSubmit} size="sm">
                <ArrowRight className="w-4 h-4 mr-2" />
                Apply Formula
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'calculate-other-rows' && selectedEntering !== null && selectedLeaving !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Define Row Operation Formulas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                <div>
                  <p className="mb-2">
                    <strong>Row Elimination Formula:</strong>
                  </p>
                  <p className="text-sm text-gray-700 font-mono bg-white p-2 rounded border">
                    New Row = Old Row - (Multiplier × New Pivot Row)
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>Multiplier</strong> = the value in the entering variable's column for that row
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    This eliminates the entering variable from all non-pivot rows.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Specify the multiplier for each row:</p>
                
                {tableau.map((row, i) => {
                  if (i === selectedLeaving) return null;
                  
                  let rowLabel;
                  if (needsPhase1 && currentPhase === 1) {
                    if (i === tableau.length - 1) rowLabel = '(-w) row';
                    else if (i === tableau.length - 2) rowLabel = '(-f) row';
                    else rowLabel = `Row ${i + 1}`;
                  } else {
                    rowLabel = i === tableau.length - 1 ? 'Z row' : `Row ${i + 1}`;
                  }
                  
                  return (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                      <span className="w-32 text-sm font-medium">{rowLabel}:</span>
                      <Label htmlFor={`mult-${i}`} className="text-sm">Multiplier =</Label>
                      <Input
                        id={`mult-${i}`}
                        type="number"
                        value={userRowMultipliers[i]}
                        onChange={(e) => {
                          const newMults = [...userRowMultipliers];
                          const value = e.target.value;
                          if (value === '') {
                            newMults[i] = '';
                          } else {
                            const parsed = parseFloat(value);
                            if (!isNaN(parsed)) {
                              newMults[i] = parsed;
                            } else if (value === '-' || value === '.' || value === '-.' || value.match(/^-?\d*\.$/)) {
                              newMults[i] = value;
                            } else {
                              return;
                            }
                          }
                          setUserRowMultipliers(newMults);
                        }}
                        onKeyDown={(e) => handleEnterKeyPress(e, userRowMultipliers[i], (val) => {
                          const newMults = [...userRowMultipliers];
                          newMults[i] = val;
                          setUserRowMultipliers(newMults);
                        })}
                        className="w-24"
                        step="0.001"
                        placeholder="Value"
                      />
                      {showHint && (
                        <span className="text-xs text-gray-500">
                          (Hint: value in entering column = {formatNumber(row[selectedEntering])})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowHint(!showHint)}
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {showHint ? 'Hide Hints' : 'Show Hints'}
                </Button>
                
                <Button onClick={handleOtherRowsSubmit} size="sm">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Apply Formulas
                </Button>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <details className="space-y-2">
                  <summary className="cursor-pointer text-sm font-medium flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Show Example Calculation
                  </summary>
                  <div className="mt-3 text-sm text-gray-700">
                    <p className="mb-2">For each row, look at the value in Column {selectedEntering + 1} (entering variable).</p>
                    <p>That value is the multiplier to use in the formula:</p>
                    <p className="font-mono text-xs mt-2 p-2 bg-white rounded">
                      New Row = Old Row - (Multiplier × New Pivot Row)
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'check-optimality' && tableau.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-purple-600" />
              Check Optimality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg space-y-3">
                <p className="text-sm">
                  <strong>Optimality Condition:</strong>
                </p>
                <p className="text-sm text-gray-700">
                  A solution is <strong>optimal</strong> when ALL values in the {needsPhase1 && currentPhase === 1 ? 'w' : 'Z'} row (excluding b) are <strong>non-negative</strong> (≥ 0).
                </p>
                <p className="text-sm text-gray-700">
                  If any value in the {needsPhase1 && currentPhase === 1 ? 'w' : 'Z'} row is negative, we can still improve the solution by performing another iteration.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-100"></th>
                      {Array.from({ length: numVariables }, (_, i) => (
                        <th key={i} className="border p-2 bg-gray-100">
                          x<sub>{i + 1}</sub>
                        </th>
                      ))}
                      {Array.from({ length: numCols - numVariables }, (_, i) => (
                        <th key={i} className="border p-2 bg-gray-100">
                          <span className="text-gray-500">s<sub>{i + 1}</sub></span>
                        </th>
                      ))}
                      <th className="border p-2 bg-gray-100">b</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableau.map((row, i) => {
                      const isZRow = i === tableau.length - 1;
                      return (
                        <tr key={i} className={isZRow ? 'bg-yellow-50' : ''}>
                          <td className="border p-2 text-center bg-gray-50">
                            {isZRow ? (needsPhase1 && currentPhase === 1 ? 'w' : 'Z') : `Row ${i + 1}`}
                          </td>
                          {row.map((value, j) => {
                            const isRHS = j === row.length - 1;
                            const isNegative = value < -1e-10;
                            return (
                              <td 
                                key={j} 
                                className={`border p-2 text-center tabular-nums ${
                                  isZRow && !isRHS && isNegative ? 'bg-red-100 font-bold' : ''
                                } ${
                                  isZRow && !isRHS && !isNegative ? 'bg-green-100' : ''
                                }`}
                              >
                                {formatNumber(value)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm mb-3">
                  <strong>Examine the Z row above. Is the current solution optimal?</strong>
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleOptimalityCheck(true)} 
                    variant="default"
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Yes, It's Optimal
                  </Button>
                  <Button 
                    onClick={() => handleOptimalityCheck(false)} 
                    variant="outline"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    No, Not Yet Optimal
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Legend:</strong></p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border"></div>
                    <span>Negative value (can improve)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border"></div>
                    <span>Non-negative value</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}