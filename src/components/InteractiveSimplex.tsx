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
  Copy,
  FileDown,
  Edit
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
  savedProgress?: any | null;
  onEditProblem?: () => void;
  onProgressCleared?: () => void;
}

type Step = 
  | 'setup-slack' 
  | 'setup-constraints' 
  | 'setup-objective'
  | 'check-feasibility'
  | 'setup-artificial'
  | 'modify-constraints-artificial'
  | 'setup-phase1-objective'
  | 'eliminate-artificial-w-row'
  | 'select-entering' 
  | 'select-leaving'
  | 'calculate-ratios'
  | 'calculate-pivot-row'
  | 'calculate-other-rows'
  | 'check-optimality'
  | 'check-phase1-feasibility'
  | 'complete';

export function InteractiveSimplex({ problem, savedProgress, onEditProblem, onProgressCleared }: InteractiveSimplexProps) {
  // Local problem state that can be overridden when loading progress
  const [currentProblem, setCurrentProblem] = useState<SimplexProblem>(problem);
  const numVariables = currentProblem.numVariables;
  
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
  
  // Setup phase state
  const [userSlackVars, setUserSlackVars] = useState<number>(0);
  const [userArtificialVars, setUserArtificialVars] = useState<number>(0);
  const [userConstraintRows, setUserConstraintRows] = useState<(number | string)[][]>([]);
  const [userObjectiveRow, setUserObjectiveRow] = useState<(number | string)[]>([]);
  const [userPhase1FRow, setUserPhase1FRow] = useState<(number | string)[]>([]);
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
  const [initialWRow, setInitialWRow] = useState<number[]>([]);
  const [userCanonicalWRow, setUserCanonicalWRow] = useState<(number | string)[]>([]);
  
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

  // Track if we're in the middle of loading progress to prevent reset
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Helper function to determine if next step button should be highlighted
  const shouldHighlightNextButton = () => {
    return feedbackType === 'success';
  };

  // Helper function to get the highlight class for buttons
  const getHighlightClass = () => {
    if (feedbackType === 'success') return 'highlight-next-step';
    if (feedbackType === 'error') return 'highlight-error';
    return '';
  };

  // Initialize
  useEffect(() => {
    // Only update currentProblem from prop if we're not loading progress
    if (!isLoadingProgress) {
      setCurrentProblem(problem);
    }
  }, [problem, isLoadingProgress]);

  useEffect(() => {
    // Don't reset if we're loading progress
    if (!isLoadingProgress) {
      resetToSetup();
    }
  }, [currentProblem, isLoadingProgress]);

  // Load saved progress if provided from Problem Setup
  useEffect(() => {
    if (savedProgress) {
      setIsLoadingProgress(true);
      
      // Restore problem definition
      setCurrentProblem(problem);

      // Restore state
      setTableau(savedProgress.tableau);
      setBasicVariables(savedProgress.basicVariables);
      setStep(savedProgress.step);
      setIteration(savedProgress.iteration);
      setSelectedEntering(savedProgress.selectedEntering);
      setSelectedLeaving(savedProgress.selectedLeaving);
      setUserSlackVars(savedProgress.userSlackVars);
      setUserArtificialVars(savedProgress.userArtificialVars);
      setUserConstraintRows(savedProgress.userConstraintRows);
      setUserObjectiveRow(savedProgress.userObjectiveRow);
      setCurrentConstraintIndex(savedProgress.currentConstraintIndex);
      setTotalVars(savedProgress.totalVars);
      setCorrectSlackVars(savedProgress.correctSlackVars);
      setCorrectArtificialVars(savedProgress.correctArtificialVars);
      setNeedsPhase1(savedProgress.needsPhase1);
      setCurrentPhase(savedProgress.currentPhase);
      setPhase1Iterations(savedProgress.phase1Iterations);
      setAskedPhase1Question(savedProgress.askedPhase1Question);
      setUserRatios(savedProgress.userRatios);
      setUserBValues(savedProgress.userBValues);
      setUserEnteringValues(savedProgress.userEnteringValues);
      setUserPivotDivisor(savedProgress.userPivotDivisor);
      setUserRowMultipliers(savedProgress.userRowMultipliers);
      setCurrentRowIndex(savedProgress.currentRowIndex);
      setInitialZRow(savedProgress.initialZRow);
      setUserCanonicalZRow(savedProgress.userCanonicalZRow);
      setTableauHistory(savedProgress.tableauHistory);

      // Set appropriate feedback
      setFeedbackType('success');
      setFeedback('Progress loaded successfully! Continue from where you left off.');
      
      // Clear the loading flag and notify parent
      setTimeout(() => {
        setIsLoadingProgress(false);
        if (onProgressCleared) {
          onProgressCleared();
        }
      }, 0);
      
      toast.success('Saved progress restored!');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedProgress]);

  const resetToSetup = () => {
    // Calculate correct number of slack/surplus and artificial variables
    let numSlack = 0;
    let numArtificial = 0;
    currentProblem.constraints.forEach(constraint => {
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
      setFeedback(`❌ Not quite. We have ${currentProblem.constraints.filter(c => c.operator === '<=' || c.operator === '>=').length} inequality constraint(s). Each needs a slack or surplus variable.`);
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
        // Move to counting artificial variables
        setStep('setup-artificial');
      } else {
        setFeedback('✅ Correct! The initial basic solution IS feasible. All slack variables are non-negative. We can proceed directly with the Simplex Method.');
        setFeedbackType('success');
        setShowHint(false);
        // Proceed to solving - remove the (-f) column from tableau
        const newTableau = tableau.map(row => {
          // Remove the (-f) column (second to last column)
          return [...row.slice(0, -2), row[row.length - 1]];
        });
        setTableau(newTableau);
        setTableauHistory([{
          tableau: newTableau,
          basicVariables: basicVariables,
          iteration: 0,
          phase: 2
        }]);
        setCurrentPhase(2);
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
      setFeedback(`✅ Correct! We need ${correctArtificialVars} artificial variable(s). Now let's add them to the constraint rows.`);
      setFeedbackType('success');
      setTotalVars(numVariables + userSlackVars + userArtificialVars);
      setShowHint(false);
      
      // Expand constraint rows to include artificial variable columns (initially empty)
      const newConstraintRows: (number | string)[][] = userConstraintRows.map(row => {
        const newRow = new Array(numVariables + userSlackVars + userArtificialVars + 1).fill('');
        // Copy existing values (decision vars + slack/surplus + rhs)
        for (let i = 0; i < numVariables + userSlackVars; i++) {
          newRow[i] = row[i];
        }
        // RHS
        newRow[newRow.length - 1] = row[row.length - 1];
        return newRow;
      });
      
      setUserConstraintRows(newConstraintRows);
      setCurrentConstraintIndex(0);
      setStep('modify-constraints-artificial');
    } else {
      setFeedback(`❌ Not quite. Count constraints with ≥ (need artificial + surplus) and = (need artificial only). Total: ${correctArtificialVars}.`);
      setFeedbackType('error');
    }
  };

  const handleModifiedConstraintRowSubmit = () => {
    const constraint = currentProblem.constraints[currentConstraintIndex];
    const currentRow = userConstraintRows[currentConstraintIndex];
    const rhsCol = currentRow.length - 1;
    
    // Build correct row with artificial variables
    const correctRow = new Array(numVariables + userSlackVars + userArtificialVars + 1).fill(0);
    constraint.coefficients.forEach((coeff, i) => {
      correctRow[i] = coeff;
    });
    
    // Add slack/surplus variables
    let slackIdx = numVariables;
    for (let i = 0; i < currentConstraintIndex; i++) {
      if (currentProblem.constraints[i].operator === '<=' || currentProblem.constraints[i].operator === '>=') {
        slackIdx++;
      }
    }
    
    if (constraint.operator === '<=') {
      correctRow[slackIdx] = 1;
    } else if (constraint.operator === '>=') {
      correctRow[slackIdx] = -1;  // Surplus variable
    }
    
    // Add artificial variables
    let artificialIdx = numVariables + userSlackVars;
    for (let i = 0; i < currentConstraintIndex; i++) {
      if (currentProblem.constraints[i].operator === '>=' || currentProblem.constraints[i].operator === '=') {
        artificialIdx++;
      }
    }
    
    if (constraint.operator === '>=' || constraint.operator === '=') {
      correctRow[artificialIdx] = 1;  // Artificial variable
    }
    
    correctRow[rhsCol] = constraint.rhs;
    
    // Check if user's row matches
    let isCorrect = true;
    for (let i = 0; i < correctRow.length; i++) {
      const userValue = typeof currentRow[i] === 'string' 
        ? (currentRow[i] === '' ? 0 : parseFloat(currentRow[i])) 
        : currentRow[i];
      const numericValue = isNaN(userValue) ? 0 : userValue;
      if (!numbersMatch(numericValue, correctRow[i])) {
        isCorrect = false;
        break;
      }
    }
    
    if (isCorrect) {
      setFeedback('✅ Perfect! This constraint row is correct with artificial variables added.');
      setFeedbackType('success');
      
      if (currentConstraintIndex < currentProblem.constraints.length - 1) {
        // Move to next constraint
        setCurrentConstraintIndex(currentConstraintIndex + 1);
        setFeedback(`✅ Great! Now let's modify constraint ${currentConstraintIndex + 2} of ${currentProblem.constraints.length}.`);
      } else {
        // All constraints done, move to Phase 1 objective
        setFeedback("✅ All constraints updated with artificial variables! Now let's set up the Phase 1 objective function.");
        setStep('setup-phase1-objective');
        const objRow = new Array(numVariables + userSlackVars + userArtificialVars).fill('');
        setUserObjectiveRow(objRow);
      }
    } else {
      setFeedback('❌ This row is not quite right. Check the artificial variable placement. Which constraints need artificial variables?');
      setFeedbackType('error');
    }
  };

  const handleConstraintRowSubmit = () => {
    const constraint = currentProblem.constraints[currentConstraintIndex];
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
      if (currentProblem.constraints[i].operator === '<=' || currentProblem.constraints[i].operator === '>=') {
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
      if (!numbersMatch(numericValue, correctRow[i])) {
        isCorrect = false;
        break;
      }
    }
    
    if (isCorrect) {
      setFeedback('✅ Perfect! This constraint row is correct.');
      setFeedbackType('success');
      
      if (currentConstraintIndex < currentProblem.constraints.length - 1) {
        // Move to next constraint
        setCurrentConstraintIndex(currentConstraintIndex + 1);
        const nextRow = new Array(totalVars + 1).fill('');
        setUserConstraintRows([...userConstraintRows, nextRow]);
        setFeedback(`✅ Great! Now let's set up constraint ${currentConstraintIndex + 2} of ${currentProblem.constraints.length}.`);
      } else {
        // All constraints done, move to objective (always Phase 2 objective initially)
        setFeedback('✅ All constraints are set up! Now let\'s set up the objective function row.');
        setStep('setup-objective');
        const objRow = new Array(totalVars).fill('');
        setUserObjectiveRow(objRow);
      }
    } else {
      setFeedback('❌ This row is not quite right. Check the slack/surplus variable placement and the b value.');
      setFeedbackType('error');
    }
  };

  const handleObjectiveRowSubmit = () => {
    if (step === 'setup-phase1-objective') {
      handlePhase1ObjectiveRowSubmit();
    } else {
      handlePhase2ObjectiveRowSubmit();
    }
  };

  const handlePhase1ObjectiveRowSubmit = () => {
    // Phase 1 objective: Minimize w = sum of artificial variables
    const correctRow = new Array(totalVars).fill(0);
    
    // Artificial variables have coefficient of 1
    for (let i = 0; i < userArtificialVars; i++) {
      correctRow[numVariables + userSlackVars + i] = 1;
    }
    // No b column in setup-phase1-objective step
    
    let isCorrect = true;
    for (let i = 0; i < correctRow.length; i++) {
      const userValue = typeof userObjectiveRow[i] === 'string' 
        ? (userObjectiveRow[i] === '' ? 0 : parseFloat(userObjectiveRow[i])) 
        : userObjectiveRow[i];
      const numericValue = isNaN(userValue) ? 0 : userValue;
      if (!numbersMatch(numericValue, correctRow[i])) {
        isCorrect = false;
        break;
      }
    }
    
    if (isCorrect) {
      setFeedback('✅ Good! The input (-w) row is correct. Now building the Phase 1 tableau...');
      setFeedbackType('success');
      
      // Automatically build the (-f) row by expanding the previously entered objective row
      // The (-f) row is the same as the initial objective row, with zeros for artificial variables
      const expandedFRow: (number | string)[] = [];
      
      // Get the objective row that was entered during setup-objective (before we knew Phase 1 was needed)
      const originalObjRow = tableau[tableau.length - 1]; // Last row of the initial tableau
      
      // Copy decision variables and slack/surplus variables from the original objective row
      for (let i = 0; i < numVariables + userSlackVars; i++) {
        expandedFRow.push(originalObjRow[i]);
      }
      
      // Add zeros for artificial variables
      for (let i = 0; i < userArtificialVars; i++) {
        expandedFRow.push(0);
      }
      
      // Add RHS (0)
      expandedFRow.push(0);
      
      setUserPhase1FRow(expandedFRow);
      
      // Set up basic variables
      const basicVars: number[] = [];
      let slackIdx = numVariables;
      let artificialIdx = numVariables + userSlackVars;
      
      // Use userConstraintRows.length instead of currentProblem.constraints to ensure they match
      for (let i = 0; i < userConstraintRows.length && i < currentProblem.constraints.length; i++) {
        const constraint = currentProblem.constraints[i];
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
      }
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
      
      // (-f) row: Use the expanded F row (convert strings/empty to numbers)
      const numericFRow = expandedFRow.map(v => {
        if (typeof v === 'string') {
          return v === '' ? 0 : parseFloat(v) || 0;
        }
        return v;
      });
      const fRow = [...numericFRow.slice(0, -1), 0, numericFRow[numericFRow.length - 1]]; // Insert 0 for (-w) column before b
      
      // Eliminate basic variables from (-f) row to achieve canonical form
      const fRowIdx = completeTableau.length;
      completeTableau.push(fRow);
      
      for (let i = 0; i < basicVars.length; i++) {
        const basicVarIdx = basicVars[i];
        const coefficient = completeTableau[fRowIdx][basicVarIdx];
        if (Math.abs(coefficient) > 1e-10) {
          for (let j = 0; j <= totalVars + 1; j++) {
            completeTableau[fRowIdx][j] -= coefficient * completeTableau[i][j];
          }
        }
      }
      
      // (-w) row: Phase 1 objective with artificial variables (convert strings/empty to numbers)
      // DO NOT ELIMINATE - just show the input row with 1s in artificial variable columns
      const numericObjRow = userObjectiveRow.map(v => {
        if (typeof v === 'string') {
          return v === '' ? 0 : parseFloat(v) || 0;
        }
        return v;
      });
      const wRow = [...numericObjRow, 1, 0]; // Add (-w) column (1) and b column (0)
      
      // Store the initial W row for the user to eliminate
      setInitialWRow(wRow);
      
      // Add the initial (-w) row to tableau WITHOUT elimination
      completeTableau.push(wRow);
      
      setTableau(completeTableau);
      setTableauHistory([{
        tableau: completeTableau,
        basicVariables: basicVars,
        iteration: 0,
        phase: 1,
        numSlackVars: userSlackVars,
        numArtificialVars: userArtificialVars
      }]);
      
      // Now ask the user to eliminate the artificial variables from the (-w) row
      setShowHint(false);
      setStep('eliminate-artificial-w-row');
      setFeedback('✅ Tableau built! Now you need to eliminate the artificial variables from the (-w) row to achieve canonical form.');
      const canonicalWRow = new Array(totalVars + 2).fill(''); // +2 for (-w) column and b column
      setUserCanonicalWRow(canonicalWRow);
    } else {
      setFeedback('❌ Not correct. Set coefficient of 1 for each artificial variable, 0 for all others.');
      setFeedbackType('error');
    }
  };

  const handlePhase1FRowSubmit = () => {
    // (-f) row: Original objective function (same setup as Phase 2 Z row)
    const objCoeffs = currentProblem.isMaximization 
      ? currentProblem.objectiveCoefficients 
      : currentProblem.objectiveCoefficients.map(c => -c);
    
    const correctRow = new Array(totalVars + 1).fill(0);
    objCoeffs.forEach((coeff, i) => {
      correctRow[i] = -coeff;
    });
    // Slack variables have 0 coefficient (already filled)
    // Artificial variables have 0 coefficient (already filled)
    correctRow[totalVars] = 0; // b value is 0
    
    let isCorrect = true;
    for (let i = 0; i < correctRow.length; i++) {
      const userValue = typeof userPhase1FRow[i] === 'string' 
        ? (userPhase1FRow[i] === '' ? 0 : parseFloat(userPhase1FRow[i])) 
        : userPhase1FRow[i];
      const numericValue = isNaN(userValue) ? 0 : userValue;
      if (!numbersMatch(numericValue, correctRow[i])) {
        isCorrect = false;
        break;
      }
    }
    
    if (isCorrect) {
      setFeedback('✅ Excellent! The (-f) row is correct. Now building the Phase 1 tableau...');
      setFeedbackType('success');
      
      // Set up basic variables
      const basicVars: number[] = [];
      let slackIdx = numVariables;
      let artificialIdx = numVariables + userSlackVars;
      
      // Use userConstraintRows.length instead of currentProblem.constraints to ensure they match
      for (let i = 0; i < userConstraintRows.length && i < currentProblem.constraints.length; i++) {
        const constraint = currentProblem.constraints[i];
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
      }
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
      
      // (-f) row: Use the user's input (convert strings/empty to numbers)
      const numericFRow = userPhase1FRow.map(v => {
        if (typeof v === 'string') {
          return v === '' ? 0 : parseFloat(v) || 0;
        }
        return v;
      });
      const fRow = [...numericFRow.slice(0, -1), 0, numericFRow[numericFRow.length - 1]]; // Insert 0 for (-w) column before b
      
      // Eliminate basic variables from (-f) row to achieve canonical form
      const fRowIdx = completeTableau.length;
      completeTableau.push(fRow);
      
      for (let i = 0; i < basicVars.length; i++) {
        const basicVarIdx = basicVars[i];
        const coefficient = completeTableau[fRowIdx][basicVarIdx];
        if (Math.abs(coefficient) > 1e-10) {
          for (let j = 0; j <= totalVars + 1; j++) {
            completeTableau[fRowIdx][j] -= coefficient * completeTableau[i][j];
          }
        }
      }
      
      // (-w) row: Phase 1 objective with artificial variables (convert strings/empty to numbers)
      const numericObjRow = userObjectiveRow.map(v => {
        if (typeof v === 'string') {
          return v === '' ? 0 : parseFloat(v) || 0;
        }
        return v;
      });
      const wRow = [...numericObjRow.slice(0, -1), 1, numericObjRow[numericObjRow.length - 1]]; // Insert 1 for (-w) column before b
      
      // Eliminate artificial variables from (-w) row to achieve canonical form
      const wRowIdx = completeTableau.length;
      completeTableau.push(wRow);
      
      for (let i = 0; i < basicVars.length; i++) {
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
        const numConstraints = basicVars.length; // Use basicVars length since it matches actual constraint rows
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
            const constraint = currentProblem.constraints[i];
            if (!constraint) {
              // Safety check: if constraint doesn't exist, keep the basic variable as is
              return bv;
            }
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
        
        // Automatically set up Phase 2 objective row
        const objCoeffs2 = currentProblem.isMaximization 
          ? currentProblem.objectiveCoefficients 
          : currentProblem.objectiveCoefficients.map(c => -c);
        
        const phase2ObjRow = new Array(numVariables + userSlackVars + 1).fill(0);
        objCoeffs2.forEach((coeff, i) => {
          phase2ObjRow[i] = -coeff;
        });
        
        // Add Phase 2 objective row to tableau
        const tableauWithPhase2Obj = [...newTableau, phase2ObjRow];
        
        setCurrentPhase(2);
        setPhase1Iterations(0); // No iterations were needed
        setIteration(0); // Reset iteration counter for Phase 2
        
        // Automatically convert to canonical form by eliminating basic variables
        const canonicalZRow = [...phase2ObjRow];
        for (let i = 0; i < currentProblem.constraints.length && i < basicVariables.length && i < tableauWithPhase2Obj.length - 1; i++) {
          const basicVar = basicVariables[i];
          if (basicVar !== undefined && basicVar !== null && !isNaN(basicVar) && basicVar < numVariables + userSlackVars && Math.abs(canonicalZRow[basicVar]) > 1e-10) {
            const factor = canonicalZRow[basicVar];
            for (let j = 0; j <= numVariables + userSlackVars; j++) {
              canonicalZRow[j] -= factor * tableauWithPhase2Obj[i][j];
            }
          }
        }
        
        // Update tableau with canonical Z row
        const completeTableau = [...tableauWithPhase2Obj.slice(0, -1), canonicalZRow];
        setTableau(completeTableau);
        setTableauHistory([{
          tableau: completeTableau,
          basicVariables: basicVariables,
          iteration: 0,
          phase: 2
        }]);
        
        setStep('select-entering');
        setFeedback('🎉 w = 0! The basic solution is already feasible. Phase 2 objective row has been set up in canonical form. Ready to begin the Simplex Method!');
        setFeedbackType('success');
        setShowHint(false);
      } else {
        // w > 0, so we need to perform Phase 1 to minimize w
        setStep('select-entering');
        setShowHint(false);
        setFeedback(`✅ Phase 1 tableau ready! The initial solution has w = ${wValue.toFixed(4)} (sum of artificial variables). Since w > 0, the initial solution is not feasible for the original problem. We need to minimize w to find a feasible solution. Find the entering variable.`);
      }
    } else {
      setFeedback('❌ Not correct. The (-f) row should have the negated coefficients of the original objective function for decision variables, and 0 for slack and artificial variables.');
      setFeedbackType('error');
    }
  };

  const handlePhase2ObjectiveRowSubmit = () => {
    const objCoeffs = currentProblem.isMaximization 
      ? currentProblem.objectiveCoefficients 
      : currentProblem.objectiveCoefficients.map(c => -c);
    
    const correctRow = new Array(totalVars).fill(0);
    objCoeffs.forEach((coeff, i) => {
      correctRow[i] = -coeff;
    });
    // No b column in setup-objective step
    
    let isCorrect = true;
    for (let i = 0; i < correctRow.length; i++) {
      const userValue = typeof userObjectiveRow[i] === 'string' 
        ? (userObjectiveRow[i] === '' ? 0 : parseFloat(userObjectiveRow[i])) 
        : userObjectiveRow[i];
      const numericValue = isNaN(userValue) ? 0 : userValue;
      if (!numbersMatch(numericValue, correctRow[i])) {
        isCorrect = false;
        break;
      }
    }
    
    if (isCorrect) {
      setFeedback('✅ Excellent! Initial tableau setup complete.');
      setFeedbackType('success');
      
      // Build the tableau and check if the basic solution is feasible
      // Insert a (-f) column before the b column (0 for constraints, 1 for objective row)
      const numericConstraintRows = userConstraintRows.map(row => {
        const numericRow = row.map(v => {
          if (typeof v === 'string') {
            return v === '' ? 0 : parseFloat(v) || 0;
          }
          return v;
        });
        // Insert 0 for (-f) column before b
        return [...numericRow.slice(0, -1), 0, numericRow[numericRow.length - 1]];
      });
      const numericObjectiveRow = userObjectiveRow.map(v => {
        if (typeof v === 'string') {
          return v === '' ? 0 : parseFloat(v) || 0;
        }
        return v;
      });
      // Add (-f) column (1) and b column (0) to objective row
      const objectiveRowWithFColumn = [...numericObjectiveRow, 1, 0];
      const completeTableau = [...numericConstraintRows, objectiveRowWithFColumn];
      setTableau(completeTableau);
      
      // Determine basic variables based on slack/surplus variables
      const basicVars: number[] = [];
      let slackIdx = numVariables;
      // Use numericConstraintRows.length instead of currentProblem.constraints to ensure they match
      for (let i = 0; i < numericConstraintRows.length; i++) {
        const constraint = currentProblem.constraints[i];
        if (constraint.operator === '<=') {
          basicVars.push(slackIdx);
          slackIdx++;
        } else if (constraint.operator === '>=') {
          // For >= constraints, show surplus variable in basis (even though it would be negative)
          basicVars.push(slackIdx);
          slackIdx++;
        } else {
          // For = constraints, no slack variable exists
          // Can't have basic variable yet
          basicVars.push(-1); // Placeholder - indicates we need artificial variable
        }
      }
      setBasicVariables(basicVars);
      setTableauHistory([{
        tableau: completeTableau,
        basicVariables: basicVars,
        iteration: 0,
        phase: 2
      }]);
      
      // Now ask if the basic solution is feasible
      setStep('check-feasibility');
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

  const updatePhase1FCell = (colIdx: number, value: string) => {
    const newRow = JSON.parse(JSON.stringify(userPhase1FRow));
    
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
    setUserPhase1FRow(newRow);
  };

  const handleCanonicalFormSubmit = () => {
    // Calculate the correct canonical form
    const correctCanonical = [...initialZRow];
    
    for (let i = 0; i < problem.constraints.length && i < basicVariables.length && i < tableau.length - 1; i++) {
      const basicVar = basicVariables[i];
      if (basicVar !== undefined && basicVar !== null && !isNaN(basicVar) && basicVar < totalVars && Math.abs(correctCanonical[basicVar]) > 1e-10) {
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
      if (!numbersMatch(numericValue, correctCanonical[j])) {
        isCorrect = false;
        break;
      }
    }
    
    if (isCorrect) {
      setFeedback('✅ Excellent! You correctly converted the (-f) row to canonical form! All basic variables now have 0 coefficients. Ready to begin the Simplex Method!');
      setFeedbackType('success');
      
      // Update tableau with the canonical form (convert strings/empty to numbers)
      const numericCanonicalRow = userCanonicalZRow.map(v => {
        if (typeof v === 'string') {
          return v === '' ? 0 : parseFloat(v) || 0;
        }
        return v;
      });
      // Replace the last row (initial Z row) with the canonical Z row
      const completeTableau = [...tableau.slice(0, -1), numericCanonicalRow];
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
      // Find which columns are incorrect to provide specific feedback
      const incorrectCols: string[] = [];
      for (let j = 0; j <= totalVars; j++) {
        const userValue = typeof userCanonicalZRow[j] === 'string' 
          ? (userCanonicalZRow[j] === '' ? 0 : parseFloat(userCanonicalZRow[j])) 
          : userCanonicalZRow[j];
        const numericValue = isNaN(userValue) ? 0 : userValue;
        if (!numbersMatch(numericValue, correctCanonical[j])) {
          const colName = j < numVariables 
            ? `x${j + 1}` 
            : j < numVariables + userSlackVars 
            ? `s${j - numVariables + 1}` 
            : 'b';
          incorrectCols.push(colName);
        }
      }
      setFeedback(`❌ Not quite right. Check columns: ${incorrectCols.join(', ')}. Remember: Z_new = Z_old - (coefficient) × Row for EACH basic variable. Make sure to apply ALL eliminations and compute each column carefully.`);
      setFeedbackType('error');
    }
  };

  const handleCanonicalWRowSubmit = () => {
    // Calculate the correct canonical form for (-w) row by eliminating artificial variables
    const correctCanonical = [...initialWRow];
    
    // Eliminate artificial variables (those that are basic)
    for (let i = 0; i < currentProblem.constraints.length && i < basicVariables.length; i++) {
      const basicVar = basicVariables[i];
      // Check if this is an artificial variable
      if (basicVar >= numVariables + userSlackVars && basicVar < totalVars) {
        // Eliminate this artificial variable from the (-w) row
        for (let j = 0; j <= totalVars + 1; j++) { // +1 for (-w) column, +1 for b column
          correctCanonical[j] -= tableau[i][j];
        }
      }
    }
    
    // Check if user's answer matches (convert strings/empty to numbers)
    let isCorrect = true;
    for (let j = 0; j <= totalVars + 1; j++) {
      const userValue = typeof userCanonicalWRow[j] === 'string' 
        ? (userCanonicalWRow[j] === '' ? 0 : parseFloat(userCanonicalWRow[j])) 
        : userCanonicalWRow[j];
      const numericValue = isNaN(userValue) ? 0 : userValue;
      if (!numbersMatch(numericValue, correctCanonical[j])) {
        isCorrect = false;
        break;
      }
    }
    
    if (isCorrect) {
      setFeedback('✅ Excellent! You correctly eliminated the artificial variables from the (-w) row! The tableau is now in canonical form.');
      setFeedbackType('success');
      
      // Update tableau with the canonical form (convert strings/empty to numbers)
      const numericCanonicalWRow = userCanonicalWRow.map(v => {
        if (typeof v === 'string') {
          return v === '' ? 0 : parseFloat(v) || 0;
        }
        return v;
      });
      
      // Replace the last row (initial W row) with the canonical W row
      const completeTableau = [...tableau.slice(0, -1), numericCanonicalWRow];
      setTableau(completeTableau);
      
      // Check if the basic solution is already feasible
      const wRowIdx = completeTableau.length - 1;
      const wValue = -completeTableau[wRowIdx][totalVars + 1]; // Negative because it's the (-w) row
      
      if (Math.abs(wValue) < 1e-10) {
        // w = 0, so all artificial variables = 0. Basic solution is already feasible!
        setFeedback('🎉 Excellent! Notice that w = 0, which means all artificial variables equal 0 in the initial basic solution. This means the initial solution is already feasible for the original problem! Phase 1 solving is not needed. We can proceed directly to Phase 2.');
        setFeedbackType('success');
        setShowHint(false);
        
        // Transition directly to Phase 2 setup
        setCurrentPhase(2);
        setPhase1Iterations(0);
        setIteration(0);
        
        // Remove artificial variables and (-w) column from tableau
        const numConstraints = basicVariables.length; // Use basicVariables length since it matches actual constraint rows
        const newTableau: number[][] = [];
        const fRowIdx = completeTableau.length - 2; // (-f) row is second to last
        
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
        const newBasicVars = basicVariables.map((bv, i) => {
          if (bv >= numVariables + userSlackVars) {
            // This is an artificial variable, need to find the surplus variable for this row
            const constraint = problem.constraints[i];
            if (!constraint) {
              // Safety check: if constraint doesn't exist, keep the basic variable as is
              return bv;
            }
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
        
        // Add the (-f) row (which is the Z row for Phase 2)
        const zRow: number[] = [];
        // Take from the (-f) row in the phase 1 tableau (fRowIdx)
        for (let j = 0; j < numVariables; j++) {
          zRow.push(completeTableau[fRowIdx][j]);
        }
        for (let j = numVariables; j < numVariables + userSlackVars; j++) {
          zRow.push(completeTableau[fRowIdx][j]);
        }
        // Skip artificial variables and (-w) column
        zRow.push(completeTableau[fRowIdx][totalVars + 1]); // b value
        
        newTableau.push(zRow);
        
        setCurrentPhase(2);
        setPhase1Iterations(0); // No iterations were needed
        setIteration(0); // Reset iteration counter for Phase 2
        
        // Automatically convert to canonical form by eliminating basic variables
        const canonicalZRow = [...zRow];
        for (let i = 0; i < currentProblem.constraints.length && i < basicVariables.length && i < newTableau.length - 1; i++) {
          const basicVar = basicVariables[i];
          if (basicVar !== undefined && basicVar !== null && !isNaN(basicVar) && basicVar < numVariables + userSlackVars && Math.abs(canonicalZRow[basicVar]) > 1e-10) {
            const factor = canonicalZRow[basicVar];
            for (let j = 0; j <= numVariables + userSlackVars; j++) {
              canonicalZRow[j] -= factor * newTableau[i][j];
            }
          }
        }
        
        // Update tableau with canonical Z row
        const completeTableau = [...newTableau.slice(0, -1), canonicalZRow];
        setTableau(completeTableau);
        setTableauHistory([{
          tableau: completeTableau,
          basicVariables: basicVariables,
          iteration: 0,
          phase: 2
        }]);
        
        setStep('select-entering');
        setFeedback('🎉 w = 0! The basic solution is already feasible. Phase 2 objective row has been set up in canonical form. Ready to begin the Simplex Method!');
        setFeedbackType('success');
        setShowHint(false);
      } else {
        // w > 0, so we need to perform Phase 1 to minimize w
        setTableauHistory([{
          tableau: completeTableau,
          basicVariables: basicVariables,
          iteration: 0,
          phase: 1,
          numSlackVars: userSlackVars,
          numArtificialVars: userArtificialVars
        }]);
        setStep('select-entering');
        setShowHint(false);
        setFeedback(`✅ Phase 1 tableau ready! The initial solution has w = ${wValue.toFixed(4)} (sum of artificial variables). Since w > 0, the initial solution is not feasible for the original problem. We need to minimize w to find a feasible solution. Find the entering variable.`);
      }
    } else {
      // Find which columns are incorrect to provide specific feedback
      const incorrectCols: string[] = []
      for (let j = 0; j <= totalVars + 1; j++) {
        const userValue = typeof userCanonicalWRow[j] === 'string' 
          ? (userCanonicalWRow[j] === '' ? 0 : parseFloat(userCanonicalWRow[j])) 
          : userCanonicalWRow[j];
        const numericValue = isNaN(userValue) ? 0 : userValue;
        if (!numbersMatch(numericValue, correctCanonical[j])) {
          const colName = j < numVariables 
            ? `x${j + 1}` 
            : j < numVariables + userSlackVars 
            ? `s${j - numVariables + 1}` 
            : j < totalVars
            ? `a${j - numVariables - userSlackVars + 1}`
            : j === totalVars
            ? '(-w)'
            : 'b';
          incorrectCols.push(colName);
        }
      }
      setFeedback(`❌ Not quite right. Check columns: ${incorrectCols.join(', ')}. Remember: (-w)_new = (-w)_old - Row for EACH artificial basic variable. Make sure to apply eliminations for all artificial variables.`);
      setFeedbackType('error');
    }
  };

  const updateCanonicalWCell = (colIdx: number, value: string) => {
    const newRow = JSON.parse(JSON.stringify(userCanonicalWRow));
    
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
    setUserCanonicalWRow(newRow);
  };

  const formatNumber = (num: number): string => {
    if (Math.abs(num) < 1e-10) return '0';
    return num.toFixed(3);
  };

  // Helper to compare numbers with rounding to 3 decimals (matching display precision)
  const numbersMatch = (a: number, b: number): boolean => {
    const roundedA = Math.round(a * 1000) / 1000;
    const roundedB = Math.round(b * 1000) / 1000;
    return Math.abs(roundedA - roundedB) < 0.001;
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
    // For Phase 2, use the (-f) row (last row)
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
    
    // Number of constraint rows (exclude (-f) and (-w) rows in Phase 1, (-f) row in Phase 2)
    const numConstraintRows = needsPhase1 && currentPhase === 1
      ? tableau.length - 2  // Exclude (-f) and (-w) rows
      : tableau.length - 1; // Exclude (-f) row
    
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
    
    const rowLabel = needsPhase1 && currentPhase === 1 ? 'w row' : '(-f) row';
    
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
    if (rowIndex === tableau.length - 1) return; // Can't select (-f) row
    
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
        // Check b value (round to 3 decimal places for comparison)
        const correctB = Math.round(tableau[i][rhsCol] * 1000) / 1000;
        const userBValue = typeof userBValues[i] === 'string' 
          ? (userBValues[i] === '' ? NaN : parseFloat(userBValues[i])) 
          : userBValues[i];
        const numericB = isNaN(userBValue) ? NaN : Math.round(userBValue * 1000) / 1000;
        
        // Check entering column value (round to 3 decimal places for comparison)
        const correctEntering = Math.round(tableau[i][selectedEntering!] * 1000) / 1000;
        const userEnteringValue = typeof userEnteringValues[i] === 'string' 
          ? (userEnteringValues[i] === '' ? NaN : parseFloat(userEnteringValues[i])) 
          : userEnteringValues[i];
        const numericEntering = isNaN(userEnteringValue) ? NaN : Math.round(userEnteringValue * 1000) / 1000;
        
        if (isNaN(numericB) || isNaN(numericEntering) || 
            Math.abs(numericB - correctB) > 0.001 || 
            Math.abs(numericEntering - correctEntering) > 0.001) {
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
    
    // Round both values to 3 decimals to match what's displayed to the user
    const roundedPivot = Math.round(pivotElement * 1000) / 1000;
    const roundedDivisor = Math.round(numericDivisor * 1000) / 1000;
    
    if (Math.abs(roundedDivisor - roundedPivot) < 0.001) {
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
        
        if (!numbersMatch(correctMultiplier, userMultiplier)) {
          isCorrect = false;
          let rowLabel;
          if (needsPhase1 && currentPhase === 1) {
            if (i === tableau.length - 1) rowLabel = '(-w) row';
            else if (i === tableau.length - 2) rowLabel = '(-f) row';
            else rowLabel = `Row ${i + 1}`;
          } else {
            rowLabel = i === tableau.length - 1 ? '(-f) row' : `Row ${i + 1}`;
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
    setFeedback('✅ Perfect! The multipliers are correct. The new tableau has been calculated. Now examine the (-f) row and determine if the solution is optimal.');
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
      
      // Only keep basic variables for constraint rows (not objective rows)
      const numConstraintRows = tableau.length - 2; // Exclude (-f) and (-w) rows
      const newBasicVars = basicVariables.slice(0, numConstraintRows).map((bv, idx) => {
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
      
      // Automatically set up Phase 2 objective row
      const objCoeffs = problem.isMaximization 
        ? problem.objectiveCoefficients 
        : problem.objectiveCoefficients.map(c => -c);
      
      const phase2ObjRow = new Array(numVariables + userSlackVars + 1).fill(0);
      objCoeffs.forEach((coeff, i) => {
        phase2ObjRow[i] = -coeff;
      });
      
      // Add Phase 2 objective row to tableau
      const tableauWithPhase2Obj = [...newTableau, phase2ObjRow];
      
      setCurrentPhase(2);
      setPhase1Iterations(iteration);
      setIteration(0); // Reset iteration counter for Phase 2
      
      // Automatically convert to canonical form by eliminating basic variables
      const canonicalZRow = [...phase2ObjRow];
      for (let i = 0; i < newBasicVars.length && i < tableauWithPhase2Obj.length - 1; i++) {
        const basicVar = newBasicVars[i];
        if (basicVar !== undefined && basicVar !== null && !isNaN(basicVar) && basicVar < numVariables + userSlackVars && Math.abs(canonicalZRow[basicVar]) > 1e-10) {
          const factor = canonicalZRow[basicVar];
          for (let j = 0; j <= numVariables + userSlackVars; j++) {
            canonicalZRow[j] -= factor * tableauWithPhase2Obj[i][j];
          }
        }
      }
      
      // Update tableau with canonical Z row
      const completeTableau = [...tableauWithPhase2Obj.slice(0, -1), canonicalZRow];
      setTableau(completeTableau);
      setTableauHistory(prev => [...prev, {
        tableau: completeTableau,
        basicVariables: newBasicVars,
        iteration: 0,
        phase: 2
      }]);
      
      setStep('select-entering');
      setFeedback('🎉 Phase 1 complete! Feasible solution found with w = 0. Artificial variables eliminated. Phase 2 objective row has been set up in canonical form. Ready to continue with the Simplex Method!');
      setFeedbackType('success');
      setShowHint(false);
      return;
    }
    
    if (userThinksOptimal === isActuallyOptimal) {
      if (isActuallyOptimal) {
        setStep('complete');
        const rowLabel = needsPhase1 && currentPhase === 1 ? 'w row' : '(-f) row';
        setFeedback(`🎉 Correct! The solution is optimal. All values in the ${rowLabel} are non-negative!`);
        setFeedbackType('success');
        setShowHint(false);
      } else {
        setIteration(iteration + 1);
        setStep('select-entering');
        const rowLabel = needsPhase1 && currentPhase === 1 ? 'w row' : '(-f) row';
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
        const rowLabel = needsPhase1 && currentPhase === 1 ? 'w row' : '(-f) row';
        setFeedback(`❌ Not quite. The solution is not optimal yet. Look at the ${rowLabel} - there are still negative values in columns: ${negativeColumns.join(', ')}. The solution is only optimal when ALL values are non-negative.`);
        setFeedbackType('error');
      } else {
        // User thinks it's not optimal but it is
        const rowLabel = needsPhase1 && currentPhase === 1 ? 'w row' : '(-f) row';
        setFeedback(`❌ Actually, this solution IS optimal! Look carefully at the ${rowLabel} - all values are non-negative (≥ 0). When this happens, we cannot improve the objective function further.`);
        setFeedbackType('error');
      }
    }
  };

  const getHint = () => {
    if (step === 'check-feasibility') {
      // Hint for whether Phase 1 is needed
      const geOrEqConstraints = currentProblem.constraints.filter(c => c.operator === '>=' || c.operator === '=');
      return `Consider the initial basic solution. For ≤ constraints, slack variables are positive in the basic solution. However, for ${geOrEqConstraints.length} constraint(s) with ≥ or =, we cannot use slack/surplus variables alone as they would be negative or zero, making the solution infeasible. When the initial basic solution is not feasible, we need Phase 1 to find a feasible starting point.`;
    } else if (step === 'setup-artificial') {
      // Hint for counting artificial variables
      const geCount = currentProblem.constraints.filter(c => c.operator === '>=').length;
      const eqCount = currentProblem.constraints.filter(c => c.operator === '=').length;
      return `Count constraints that need artificial variables: ${geCount} constraint(s) with ≥ (need surplus + artificial), ${eqCount} constraint(s) with = (need artificial only). Total artificial variables: ${geCount + eqCount}.`;
    } else if (step === 'modify-constraints-artificial') {
      // Hint for adding artificial variables to constraints
      const constraint = currentProblem.constraints[currentConstraintIndex];
      if (constraint.operator === '>=') {
        return `This is a ≥ constraint. It already has a surplus variable (coefficient -1). Now add an artificial variable (coefficient 1) in the appropriate column. Other artificial variable columns should be 0.`;
      } else if (constraint.operator === '=') {
        return `This is an = constraint. It has no slack/surplus variables. Add an artificial variable (coefficient 1) in the appropriate column. Other artificial variable columns should be 0.`;
      } else {
        return `This is a ≤ constraint. It already has a slack variable and does NOT need an artificial variable. All artificial variable columns should be 0.`;
      }
    } else if (step === 'setup-phase1-objective') {
      // Hint for Phase 1 objective function setup
      const objExample = currentProblem.objectiveCoefficients.map((c, i) => {
        return `${i > 0 && c >= 0 ? '+ ' : ''}${c}x${i + 1}`;
      }).join(' ');
      const transformedExample = currentProblem.objectiveCoefficients.map((c, i) => {
        return `${i > 0 && -c >= 0 ? '+ ' : ''}${-c}x${i + 1}`;
      }).join(' ');
      return `In standard form, we write: Z - (${objExample}) = 0\n\nThis means: ${transformedExample} (slack variables = 0)`;
    } else if (step === 'setup-objective') {
      const objCoeffs = currentProblem.isMaximization 
        ? currentProblem.objectiveCoefficients 
        : currentProblem.objectiveCoefficients.map(c => -c);
      const hintRow = objCoeffs.map((c, i) => `x${i+1}: ${-c}`).join(', ');
      return `For the objective function, enter negated coefficients in standard form. ${hintRow}. Set all slack variables to 0.`;
    } else if (step === 'select-entering') {
      const rowLabel = needsPhase1 && currentPhase === 1 ? '(-w) row' : '(-f) row';
      return `Look for the most negative value in the ${rowLabel} - this variable will be joining the basis. If two values are equally the most negative, choose the leftmost one.`;
    } else if (step === 'select-leaving') {
      const rhsCol = tableau[0].length - 1;
      const correctLeaving = getCorrectLeavingVariable(selectedEntering!);
      if (correctLeaving === -1) {
        return 'Problem is unbounded - no valid leaving variable can be found.';
      }
      const minRatio = tableau[correctLeaving][rhsCol] / tableau[correctLeaving][selectedEntering!];
      return `Calculate b ÷ (entering column value) for each row with positive values. The minimum ratio is ${minRatio.toFixed(3)}. If two ratios are equally the smallest, choose the topmost row.`;
    } else if (step === 'calculate-ratios') {
      const correctLeaving = getCorrectLeavingVariable(selectedEntering!);
      if (correctLeaving === -1) {
        return 'Problem is unbounded - no valid leaving variable can be found.';
      }
      return `For each row with a positive value in the entering column, calculate: ratio = b ÷ (entering column value). Enter 0 for rows with non-positive values. If two ratios are equally the smallest, choose the topmost row.`;
    } else if (step === 'calculate-pivot-row') {
      const pivotElement = tableau[selectedLeaving][selectedEntering];
      return `The pivot element is in Row ${selectedLeaving + 1}, Column ${selectedEntering + 1}. Its value is ${formatNumber(pivotElement)}. To create a 1 in the pivot position, divide the entire pivot row by this value.`;
    } else if (step === 'calculate-other-rows') {
      // Show example for first non-pivot row
      let exampleRow = 0;
      if (exampleRow === selectedLeaving) exampleRow = 1;
      if (exampleRow >= tableau.length) exampleRow = tableau.length - 1;
      
      const factor = tableau[exampleRow][selectedEntering];
      const rowLabel = exampleRow === tableau.length - 1 ? '(-f) row' : `Row ${exampleRow + 1}`;
      
      return `For each row, the multiplier is the value in the entering variable's column. For example, ${rowLabel} has ${formatNumber(factor)} in the entering column. Use the formula: New Row = Old Row - (Multiplier × New Pivot Row).`;
    } else if (step === 'convert-to-canonical') {
      // Find which basic variables need to be eliminated
      const varsToEliminate: string[] = [];
      basicVariables.slice(0, tableau.length - 1).forEach((bv, i) => {
        if (bv !== undefined && bv !== null && !isNaN(bv) && bv < totalVars && Math.abs(initialZRow[bv]) > 1e-10) {
          const varName = bv < numVariables 
            ? `x${bv + 1}` 
            : bv < numVariables + userSlackVars 
            ? `s${bv - numVariables + 1}` 
            : `a${bv - numVariables - userSlackVars + 1}`;
          varsToEliminate.push(`${varName} (coefficient ${formatNumber(initialZRow[bv])} in Row ${i + 1})`);
        }
      });
      if (varsToEliminate.length > 0) {
        return `Eliminate these basic variables from (-f) row: ${varsToEliminate.join(', ')}. For each, use: (-f)_new = (-f)_old - (coefficient) × Row. Work through each column: for column j, compute: (-f)_new[j] = (-f)_old[j] - (coefficient) × Row[j].`;
      }
      return 'All basic variables already have 0 coefficients. The (-f) row is already in canonical form!';
    } else if (step === 'eliminate-artificial-w-row') {
      // Find which artificial variables need to be eliminated
      const varsToEliminate: string[] = [];
      basicVariables.forEach((bv, i) => {
        if (bv >= numVariables + userSlackVars && bv < totalVars) {
          const varName = `a${bv - numVariables - userSlackVars + 1}`;
          varsToEliminate.push(`${varName} (basic in Row ${i + 1})`);
        }
      });
      if (varsToEliminate.length > 0) {
        return `Eliminate these artificial variables from (-w) row: ${varsToEliminate.join(', ')}. For each artificial variable that is basic, use: (-w)_new = (-w)_old - Row. Work through each column: for column j, compute: (-w)_new[j] = (-w)_old[j] - Row[j].`;
      }
      return 'No artificial variables are basic. The (-w)-row is already in canonical form!';
    } else if (step === 'check-optimality') {
      const objRow = tableau[tableau.length - 1];
      const negativeCount = objRow.slice(0, -1).filter(v => v < -1e-10).length;
      const rowLabel = needsPhase1 && currentPhase === 1 ? 'w row (Phase 1 objective)' : '(-f) row';
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
    const finalValue = currentProblem.isMaximization ? optimalValue : -optimalValue;
    
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
    doc.text(`Objective: ${currentProblem.isMaximization ? 'Maximize' : 'Minimize'}`, 20, yPos);
    yPos += lineHeight;
    
    const objText = `Z = ${currentProblem.objectiveCoefficients.map((c, i) => `${c}x${i+1}`).join(' + ')}`;
    doc.setFontSize(10);
    doc.text(objText, 20, yPos);
    yPos += lineHeight * 1.5;
    
    // Constraints
    doc.setFontSize(12);
    doc.text('Subject to:', 20, yPos);
    yPos += lineHeight;
    
    doc.setFontSize(10);
    currentProblem.constraints.forEach((constraint, i) => {
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
          const numConstraints = bv.length;
          const snapshotNumCols = t[0].length - 1 - numVariables;
          
          if (yPos > pageHeight - 80) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(11);
          doc.text(`Iteration ${snapshot.iteration}`, 20, yPos);
          yPos += lineHeight;
          
          // Generate proper headers for Phase 1 (includes slack, artificial, (-f) and (-w) columns)
          const slackCount = snapshot.numSlackVars || 0;
          const artificialCount = snapshot.numArtificialVars || 0;
          const slackHeaders = Array.from({ length: slackCount }, (_, i) => `s${i+1}`);
          const artificialHeaders = Array.from({ length: artificialCount }, (_, i) => `a${i+1}`);
          
          const headers = [
            'Basic',
            ...Array.from({ length: numVariables }, (_, i) => `x${i+1}`),
            ...slackHeaders,
            ...artificialHeaders,
            '(-f)',
            '(-w)',
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
            ['(-f)', ...t[numConstraints].map(v => formatNumber(v))],
            ['(-w)', ...t[numConstraints + 1].map(v => formatNumber(v))]
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
          
          // Use appropriate objective row label based on whether Phase 1 was used
          const objectiveRowLabel = needsPhase1 ? '(-f)' : 'Z';
          
          const body = [
            ...t.slice(0, numConstraints).map((row, i) => {
              const basicVar = bv[i] < numVariables 
                ? `x${bv[i] + 1}` 
                : `s${bv[i] - numVariables + 1}`;
              return [basicVar, ...row.map(v => formatNumber(v))];
            }),
            [objectiveRowLabel, ...t[numConstraints].map(v => formatNumber(v))]
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
      ['Optimization Type:', currentProblem.isMaximization ? 'Maximize' : 'Minimize'],
      ['Objective Function:', currentProblem.objectiveCoefficients.map((c, i) => `${c}x${i+1}`).join(' + ')],
      [],
      ['Constraints:'],
      ...currentProblem.constraints.map((c, i) => [
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
          const numConstraints = bv.length;
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
            '(-f)',
            '(-w)',
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
          
          // Phase 1 has two objective rows: (-f) and (-w)
          const fRow = ['(-f)', ...t[numConstraints].map(v => parseFloat(formatNumber(v)))];
          const wRow = ['(-w)', ...t[numConstraints + 1].map(v => parseFloat(formatNumber(v)))];
          
          const tableauData = [
            [`Phase 1 - Iteration ${snapshot.iteration}`],
            headers,
            ...rows,
            fRow,
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
          
          // Use appropriate objective row label based on whether Phase 1 was used
          const objectiveRowLabel = needsPhase1 ? '(-f)' : 'Z';
          const objectiveRow = [objectiveRowLabel, ...t[numConstraints].map(v => parseFloat(formatNumber(v)))];
          
          const phaseLabel = needsPhase1 ? 'Phase 2' : 'Simplex';
          const tableauData = [
            [`${phaseLabel} - Iteration ${snapshot.iteration}`],
            headers,
            ...rows,
            objectiveRow
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
      problem: currentProblem,
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

      // Set flag to prevent useEffect from resetting state
      setIsLoadingProgress(true);

      // Restore problem definition
      setCurrentProblem(progressData.problem);

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
      
      // Clear the loading flag after state is updated
      setTimeout(() => setIsLoadingProgress(false), 0);
      
      toast.success('Progress loaded successfully!');
    } catch (error) {
      setIsLoadingProgress(false);
      toast.error('Failed to load progress. Please check the file format.');
      console.error(error);
    }
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

  if (tableau.length === 0 && step !== 'setup-slack' && step !== 'check-feasibility' && step !== 'setup-artificial' && step !== 'modify-constraints-artificial' && step !== 'setup-constraints' && step !== 'setup-phase1-objective' && step !== 'setup-objective') return <div>Loading...</div>;

  const numConstraints = tableau.length > 0 
    ? (needsPhase1 && currentPhase === 1 && step !== 'check-feasibility' ? tableau.length - 2 : tableau.length - 1)
    : 0;
  
  // Debug: Check if basicVariables matches constraint rows
  if (tableau.length > 0 && basicVariables.length !== numConstraints) {
    console.warn(`Mismatch: tableau has ${numConstraints} constraint rows but basicVariables has ${basicVariables.length} elements`);
    console.log('Tableau rows:', tableau.length);
    console.log('Basic variables:', basicVariables);
    console.log('Current step:', step);
    console.log('Current phase:', currentPhase);
    console.log('Needs Phase 1:', needsPhase1);
    console.log('Problem constraints:', currentProblem.constraints.length);
  }
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
                  {step === 'setup-constraints' && 'Setup: Build Constraint Rows'}
                  {step === 'setup-objective' && 'Setup: Build Objective Row'}
                  {step === 'check-feasibility' && 'Setup: Check Feasibility'}
                  {step === 'setup-artificial' && 'Setup: Count Artificial Variables'}
                  {step === 'modify-constraints-artificial' && 'Setup: Add Artificial Variables to Constraints'}
                  {step === 'setup-phase1-objective' && 'Setup: Build Phase 1 Objective (-w row)'}

                  {step === 'eliminate-artificial-w-row' && 'Eliminate Artificial Variables from (-w) Row'}
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

          {!['complete', 'setup-constraints', 'setup-slack', 'check-feasibility', 'setup-artificial', 'setup-phase1-objective', 'setup-objective'].includes(step) && (
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
                {currentProblem.isMaximization ? (
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
                Z = {currentProblem.objectiveCoefficients.map((c, i) => {
                  const sign = c >= 0 && i > 0 ? '+ ' : '';
                  return `${sign}${c}x${i + 1}`;
                }).join(' ')}
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Constraints:</div>
              <div className="space-y-1">
                {currentProblem.constraints.map((constraint, i) => (
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
              Variables: {currentProblem.numVariables} | Constraints: {currentProblem.constraints.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Information Card - Show during Two-Phase Method */}
      {needsPhase1 && step !== 'setup-slack' && step !== 'setup-artificial' && step !== 'modify-constraints-artificial' && step !== 'setup-constraints' && step !== 'setup-objective' && step !== 'check-feasibility' && (
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
              <Button onClick={handleSlackVarsSubmit} size="sm" className={feedbackType === 'error' ? 'highlight-error' : 'highlight-next-step'}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'check-feasibility' && tableau.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-orange-600" />
                Check Initial Basic Solution Feasibility
              </CardTitle>
              <Button
                onClick={() => setShowHint(!showHint)}
                variant="outline"
                size="sm"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </Button>
            </div>
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
                        <th className="border p-2 bg-yellow-100">(-f)</th>
                        <th className="border p-2 bg-gray-100">b</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableau.slice(0, -1).map((row, i) => {
                        const bv = basicVariables[i];
                        let varName = '';
                        if (bv !== undefined && bv !== null && !isNaN(bv) && bv >= 0) {
                          if (bv < numVariables) {
                            varName = `x${bv + 1}`;
                          } else if (bv < numVariables + userSlackVars) {
                            varName = `s${bv - numVariables + 1}`;
                          } else {
                            varName = `a${bv - numVariables - userSlackVars + 1}`;
                          }
                        } else {
                          varName = `Row ${i + 1}`;
                        }
                        return (
                          <tr key={i}>
                            <td className="border p-2 text-center bg-gray-50">
                              {varName}
                            </td>
                            {row.map((value, j) => (
                              <td key={j} className="border p-2 text-center tabular-nums">
                                {formatNumber(value)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                      <tr className="bg-yellow-50">
                        <td className="border p-2 text-center">(-f)</td>
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
              
              {showHint && (
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
              )}

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm mb-3">
                  <strong>Question: Is the initial basic solution feasible (can all slack/surplus variables be non-negative and do all constraints, including equalities, have basic variables)?</strong>
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

      {step === 'setup-artificial' && (
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
              <Button onClick={handleArtificialVarsSubmit} size="sm" className={getHighlightClass()}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'modify-constraints-artificial' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-6 h-6 text-orange-600" />
                Add Artificial Variables to Constraint Rows
              </CardTitle>
              <Button
                onClick={() => setShowHint(!showHint)}
                variant="outline"
                size="sm"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {showHint && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm whitespace-pre-line">
                    {getHint()}
                  </p>
                </div>
              )}
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="mb-2">
                  <strong>Constraint {currentConstraintIndex + 1} of {problem.constraints.length}:</strong> {' '}
                  {problem.constraints[currentConstraintIndex].coefficients.map((c, i) => (
                    <span key={i}>
                      {i > 0 && (c >= 0 ? ' + ' : ' ')}
                      {c}x<sub>{i + 1}</sub>
                    </span>
                  ))} {' '}
                  <strong>{problem.constraints[currentConstraintIndex].operator}</strong> {' '}
                  {problem.constraints[currentConstraintIndex].rhs}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Add artificial variables (a<sub>1</sub>, a<sub>2</sub>, ...) to the appropriate constraints. 
                  Each ≥ or = constraint needs one artificial variable.
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
                      {userConstraintRows[currentConstraintIndex]?.map((value, j) => (
                        <td key={j} className="border p-2 text-center">
                          <Input
                            type="number"
                            value={value}
                            onChange={(e) => updateConstraintCell(currentConstraintIndex, j, e.target.value)}
                            onKeyDown={(e) => handleEnterKeyPress(e, value, (val) => updateConstraintCell(currentConstraintIndex, j, val))}
                            className={`w-20 text-center ${
                              j >= numVariables + userSlackVars && j < numVariables + userSlackVars + userArtificialVars 
                                ? 'bg-orange-50' 
                                : ''
                            }`}
                            step="0.1"
                            disabled={j < numVariables + userSlackVars || j === userConstraintRows[currentConstraintIndex].length - 1}
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <Button onClick={handleModifiedConstraintRowSubmit} size="sm" className={getHighlightClass()}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Check Answer
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
                {showConstraintExplanation && (
                  <p className="text-sm text-gray-600">
                    {problem.constraints[currentConstraintIndex].operator === '<=' && 
                      'For ≤ constraints, add a slack variable (coefficient = 1)'}
                    {problem.constraints[currentConstraintIndex].operator === '>=' && 
                      'For ≥ constraints, add a surplus variable (coefficient = -1) and an artificial variable (coefficient = 1)'}
                    {problem.constraints[currentConstraintIndex].operator === '=' && 
                      'For = constraints, add an artificial variable (coefficient = 1)'}
                  </p>
                )}
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
              
              <Button onClick={handleConstraintRowSubmit} size="sm" className={getHighlightClass()}>
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-6 h-6 text-orange-600" />
                Setup Phase 1 Objective Function
              </CardTitle>
              <Button
                onClick={() => setShowHint(!showHint)}
                variant="outline"
                size="sm"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </Button>
            </div>
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
              
              {showHint && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm whitespace-pre-line">
                    {getHint()}
                  </p>
                </div>
              )}
              
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
              
              <Button onClick={handleObjectiveRowSubmit} size="sm" className={getHighlightClass()}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Check Answer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'eliminate-artificial-w-row' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-6 h-6 text-orange-600" />
              Eliminate Artificial Variables from (-w) Row
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg space-y-3">
                <p className="text-sm">
                  <strong>Goal:</strong> Eliminate all artificial variables from the (-w) row so they have 0 coefficients.
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Current Basic Variables:</strong> {' '}
                  {basicVariables.map((bv, i) => {
                    if (bv === undefined || bv === null || isNaN(bv)) return null;
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
                  }).filter(Boolean)}
                </p>
                
                <div className="pt-2 border-t border-orange-200">
                  <p className="text-sm mb-2"><strong>📝 How to Eliminate Artificial Variables:</strong></p>
                  <div className="text-xs text-gray-700 space-y-2 p-3 bg-white rounded">
                    <p><strong>Method:</strong> Use row operations to eliminate artificial variables from the (-w) row.</p>
                    <p className="text-orange-700">
                      <strong>Formula:</strong> (-w)_new = (-w)_old - (sum of the constraint rows that have artificial variables)
                    </p>
                    <p>Calculate this as a single operation by adding all rows with artificial basic variables, then subtracting from (-w)_old.</p>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <p className="text-sm"><strong>Calculation:</strong></p>
                    {(() => {
                      const artificialRows = basicVariables.map((bv, i) => {
                        if (bv < numVariables + userSlackVars || bv >= totalVars) return null;
                        return { index: i, varName: `a${bv - numVariables - userSlackVars + 1}` };
                      }).filter(Boolean);
                      
                      if (artificialRows.length > 0) {
                        return (
                          <div className="p-3 bg-white rounded border border-orange-200">
                            <div className="text-sm mb-2">
                              <strong>Rows with artificial basic variables:</strong>
                            </div>
                            <div className="text-xs space-y-1 mb-3">
                              {artificialRows.map((row, idx) => (
                                <div key={idx} className="pl-4">
                                  • Row {row.index + 1}: <strong className="text-orange-700">{row.varName}</strong>
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-indigo-600 font-mono bg-indigo-50 p-2 rounded">
                              (-w)_new = (-w)_old - ({artificialRows.map((row, idx) => 
                                `Row_${row.index + 1}`
                              ).join(' + ')})
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  
                  {basicVariables.every((bv) => {
                    return bv < numVariables + userSlackVars || bv >= totalVars;
                  }) && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs text-green-700">
                        ✓ No artificial variables are basic! Simply copy the Initial (-w) row below.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm mb-2"><strong>Initial (-w) row (before elimination):</strong></p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs" style={{tableLayout: 'fixed'}}>
                    <colgroup>
                      <col style={{width: '60px'}} />
                      {Array.from({ length: numVariables }, () => (
                        <col key={Math.random()} style={{width: '80px'}} />
                      ))}
                      {Array.from({ length: userSlackVars }, () => (
                        <col key={Math.random()} style={{width: '80px'}} />
                      ))}
                      {Array.from({ length: userArtificialVars }, () => (
                        <col key={Math.random()} style={{width: '80px'}} />
                      ))}
                      <col style={{width: '80px'}} />
                      <col style={{width: '80px'}} />
                    </colgroup>
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
                            s<sub>{i + 1}</sub>
                          </th>
                        ))}
                        {Array.from({ length: userArtificialVars }, (_, i) => (
                          <th key={i} className="border p-2 bg-orange-100">
                            <span className="text-orange-600">a<sub>{i + 1}</sub></span>
                          </th>
                        ))}
                        <th className="border p-2 bg-gray-100">(-w)</th>
                        <th className="border p-2 bg-gray-100">b</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2 bg-gray-50"></td>
                        {initialWRow.map((value, j) => (
                          <td key={j} className="border p-2 text-center tabular-nums">
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
                  <table className="w-full border-collapse text-xs" style={{tableLayout: 'fixed'}}>
                    <colgroup>
                      <col style={{width: '60px'}} />
                      {Array.from({ length: numVariables }, () => (
                        <col key={Math.random()} style={{width: '80px'}} />
                      ))}
                      {Array.from({ length: userSlackVars }, () => (
                        <col key={Math.random()} style={{width: '80px'}} />
                      ))}
                      {Array.from({ length: userArtificialVars }, () => (
                        <col key={Math.random()} style={{width: '80px'}} />
                      ))}
                      <col style={{width: '80px'}} />
                      <col style={{width: '80px'}} />
                    </colgroup>
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
                        {Array.from({ length: userArtificialVars }, (_, i) => (
                          <th key={i} className="border p-2 bg-orange-100">
                            <span className="text-orange-600">a<sub>{i + 1}</sub></span>
                          </th>
                        ))}
                        <th className="border p-2 bg-gray-100">(-w)</th>
                        <th className="border p-2 bg-gray-100">b</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableau.slice(0, -2).map((row, i) => {
                        const bv = basicVariables[i];
                        const isValidBV = bv !== undefined && bv !== null && !isNaN(bv);
                        return (
                          <tr key={i}>
                            <td className="border p-2 text-center bg-gray-50">
                              {isValidBV && bv < numVariables ? (
                                <span>x<sub>{bv + 1}</sub></span>
                              ) : isValidBV && bv < numVariables + userSlackVars ? (
                                <span>s<sub>{bv - numVariables + 1}</sub></span>
                              ) : isValidBV && bv < totalVars ? (
                                <span className="text-orange-600">a<sub>{bv - numVariables - userSlackVars + 1}</sub></span>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                            {row.map((value, j) => (
                              <td key={j} className="border p-2 text-center tabular-nums">
                                {formatNumber(value)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm mb-2"><strong>Enter the canonical (-w) row (after eliminating artificial variables):</strong></p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs" style={{tableLayout: 'fixed'}}>
                    <colgroup>
                      <col style={{width: '60px'}} />
                      {Array.from({ length: numVariables }, () => (
                        <col key={Math.random()} style={{width: '80px'}} />
                      ))}
                      {Array.from({ length: userSlackVars }, () => (
                        <col key={Math.random()} style={{width: '80px'}} />
                      ))}
                      {Array.from({ length: userArtificialVars }, () => (
                        <col key={Math.random()} style={{width: '80px'}} />
                      ))}
                      <col style={{width: '80px'}} />
                      <col style={{width: '80px'}} />
                    </colgroup>
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
                            s<sub>{i + 1}</sub>
                          </th>
                        ))}
                        {Array.from({ length: userArtificialVars }, (_, i) => (
                          <th key={i} className="border p-2 bg-orange-100">
                            <span className="text-orange-600">a<sub>{i + 1}</sub></span>
                          </th>
                        ))}
                        <th className="border p-2 bg-gray-100">(-w)</th>
                        <th className="border p-2 bg-gray-100">b</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2 bg-gray-50"></td>
                        {userCanonicalWRow.map((value, j) => (
                          <td key={j} className="border p-2 text-center">
                            <Input
                              type="number"
                              value={value}
                              onChange={(e) => updateCanonicalWCell(j, e.target.value)}
                              onKeyDown={(e) => handleEnterKeyPress(e, value, (val) => updateCanonicalWCell(j, val))}
                              className="w-full text-center"
                              step="0.1"
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <Button onClick={handleCanonicalWRowSubmit} size="sm" className={getHighlightClass()}>
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
              Convert (-f) Row to Canonical Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg space-y-3">
                <p className="text-sm">
                  <strong>Goal:</strong> Eliminate all basic variables from the (-f) row so they have 0 coefficients.
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Current Basic Variables:</strong> {' '}
                  {basicVariables.slice(0, tableau.length - 1).map((bv, i) => {
                    if (bv === undefined || bv === null || isNaN(bv)) return null;
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
                  }).filter(Boolean)}
                </p>
                
                <div className="pt-2 border-t border-purple-200">
                  <p className="text-sm mb-2"><strong>📝 How to Convert to Canonical Form:</strong></p>
                  <div className="text-xs text-gray-700 space-y-2 p-3 bg-white rounded">
                    <p><strong>Method:</strong> Use row operations to eliminate basic variables from the (-f) row.</p>
                    <p className="text-purple-700">
                      <strong>Formula:</strong> (-f)_new = (-f)_old - (coefficient) × (constraint row)
                    </p>
                    <p>Perform this operation for each basic variable that has a non-zero coefficient in the (-f) row.</p>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <p className="text-sm"><strong>Required Eliminations:</strong></p>
                    {basicVariables.slice(0, tableau.length - 1).map((bv, i) => {
                      if (bv === undefined || bv === null || isNaN(bv)) return null;
                      const coeff = initialZRow[bv];
                      if (Math.abs(coeff) < 1e-10) return null;
                      const varName = bv < numVariables 
                        ? `x${bv + 1}` 
                        : bv < numVariables + userSlackVars 
                        ? `s${bv - numVariables + 1}` 
                        : `a${bv - numVariables - userSlackVars + 1}`;
                      return (
                        <div key={i} className="p-2 bg-white rounded border border-purple-200">
                          <div className="text-sm mb-1">
                            <strong>Step {i + 1}:</strong> Eliminate <strong className="text-purple-700">{varName}</strong> (coefficient: {formatNumber(coeff)})
                          </div>
                          <div className="text-xs text-indigo-600 font-mono pl-4">
                            Z_new = Z_old - ({formatNumber(coeff)}) × Row_{i + 1}
                          </div>
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                  
                  {basicVariables.slice(0, tableau.length - 1).every((bv) => {
                    if (bv === undefined || bv === null || isNaN(bv)) return true;
                    return Math.abs(initialZRow[bv]) < 1e-10;
                  }) && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs text-green-700">
                        ✓ All basic variables already have 0 coefficients! Simply copy the Initial (-f) row below.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm mb-2"><strong>Initial (-f) row (before elimination):</strong></p>
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
                      {tableau.slice(0, -1).map((row, i) => {
                        const bv = basicVariables[i];
                        const isValidBV = bv !== undefined && bv !== null && !isNaN(bv);
                        return (
                          <tr key={i}>
                            <td className="border p-2 text-center bg-gray-50">
                              {isValidBV && bv < numVariables ? (
                                <span>x<sub>{bv + 1}</sub></span>
                              ) : isValidBV && bv < numVariables + userSlackVars ? (
                                <span>s<sub>{bv - numVariables + 1}</sub></span>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                            {row.map((value, j) => (
                              <td key={j} className="border p-2 text-center tabular-nums">
                                {formatNumber(value)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-300">
                <p className="text-sm mb-2"><strong>💡 Example Calculation:</strong></p>
                <div className="text-xs text-gray-700 space-y-1">
                  {basicVariables.slice(0, tableau.length - 1).map((bv, i) => {
                    if (bv === undefined || bv === null || isNaN(bv) || i >= tableau.length - 1) return null;
                    const coeff = initialZRow[bv];
                    if (Math.abs(coeff) < 1e-10) return null;
                    const varName = bv < numVariables 
                      ? `x${bv + 1}` 
                      : bv < numVariables + userSlackVars 
                      ? `s${bv - numVariables + 1}` 
                      : `a${bv - numVariables - userSlackVars + 1}`;
                    
                    // Show example for first column only
                    if (i === 0) {
                      const firstColZValue = initialZRow[0];
                      const firstColRowValue = tableau[i][0];
                      const result = firstColZValue - coeff * firstColRowValue;
                      return (
                        <div key={i} className="p-2 bg-white rounded font-mono">
                          For column x<sub>1</sub>: {formatNumber(firstColZValue)} - ({formatNumber(coeff)}) × {formatNumber(firstColRowValue)} = {formatNumber(result)}
                        </div>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                  <p className="text-gray-600 italic pt-1">Apply the same formula to all columns...</p>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                <p className="text-sm mb-3"><strong>Enter the (-f) row after applying all eliminations:</strong></p>
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
              
              <Button onClick={handleCanonicalFormSubmit} size="sm" className={getHighlightClass()}>
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
              </div>

              {/* Request Explanation Button */}
              <div>
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
                <Alert className="bg-blue-50 border-blue-200">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <p className="text-sm mb-2">
                      <strong>Converting to Standard Form:</strong>
                    </p>
                    <p className="text-sm mb-2">
                      The Simplex method requires the objective function to be written in standard form. 
                      {problem.isMaximization ? (
                        <span> For maximization, we write: Z - ({problem.objectiveCoefficients.map((c, i) => 
                          `${i > 0 && c >= 0 ? '+ ' : ''}${c}x${i + 1}`
                        ).join(' ')}) = 0</span>
                      ) : (
                        <span> For minimization, we first convert to maximization by negating coefficients, then write: Z - ({problem.objectiveCoefficients.map((c, i) => 
                          `${i > 0 && -c >= 0 ? '+ ' : ''}${-c}x${i + 1}`
                        ).join(' ')}) = 0</span>
                      )}
                    </p>
                    <p className="text-sm">
                      Rearranging gives us the objective row coefficients: <strong>negate each coefficient</strong> from the original objective function
                      {!problem.isMaximization && <span> (after converting to maximization)</span>}. 
                      All slack/surplus variables have coefficient <strong>0</strong> in the objective function.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              
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
              
              <Button onClick={handleObjectiveRowSubmit} size="sm" className={getHighlightClass()}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Check Answer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step !== 'setup-slack' && step !== 'check-feasibility' && step !== 'setup-artificial' && step !== 'modify-constraints-artificial' && step !== 'setup-constraints' && 
       step !== 'setup-phase1-objective' && step !== 'setup-objective' && step !== 'eliminate-artificial-w-row' && 
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
                  {tableau.slice(0, needsPhase1 && currentPhase === 1 ? tableau.length - 2 : tableau.length - 1).map((row, i) => (
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
                        {basicVariables[i] !== undefined && basicVariables[i] !== null && !isNaN(basicVariables[i]) ? (
                          basicVariables[i] < numVariables ? (
                            <span>x<sub>{basicVariables[i] + 1}</sub></span>
                          ) : basicVariables[i] < numVariables + userSlackVars ? (
                            <span className="text-gray-500">
                              s<sub>{basicVariables[i] - numVariables + 1}</sub>
                            </span>
                          ) : (
                            <span className="text-orange-600">
                              a<sub>{basicVariables[i] - numVariables - userSlackVars + 1}</sub>
                            </span>
                          )
                        ) : (
                          <span className="text-red-600 text-xs">ERROR: No basic variable for row {i + 1}</span>
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
                    The most negative value in the (-f) row indicates that a unit change in that variable would have the largest impact on improving the objective function. While we still do not know how much we can increase it without violating a constraint, and hence there is no guarantee that adding a different variable might be a better choice (allow a larger improvement in the objective function), it is the one we'll guess should be added to the basis in our efforts to improve the objective function.
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
                    Notice that the (-f) row now has 0 values for all basic variables (check the columns corresponding to variables in the "Basic" column). 
                    This is called <strong>canonical form</strong> and is essential for the Simplex method to work correctly.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Optimal Solution Summary - shown after the tableau when complete */}
      {step === 'complete' && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-green-600" />
              Solution Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Decision Variables */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Decision Variables</h4>
                  <div className="space-y-2">
                    {getSolution().solution.map((value, index) => {
                      // Check if this variable is basic
                      const varIndex = index;
                      const isBasic = basicVariables.includes(varIndex);
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex justify-between items-center py-2 px-4 rounded-lg border ${
                            isBasic ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-medium">
                              x<sub>{index + 1}</sub>
                            </span>
                            {isBasic && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                Basic
                              </span>
                            )}
                          </span>
                          <span className="font-mono">{formatNumber(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optimal Value and Summary */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Optimal Objective Value</h4>
                  <div className="bg-white rounded-lg border border-green-200 p-6 text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      {problem.isMaximization ? 'Maximum' : 'Minimum'}
                    </div>
                    <div className="text-3xl font-medium text-green-700 mb-1">
                      Z = {formatNumber(getSolution().optimalValue)}
                    </div>
                    <div className="text-xs text-gray-500 mt-3 space-y-1">
                      {needsPhase1 && phase1Iterations > 0 ? (
                        <>
                          <p>Phase 1: {phase1Iterations} iteration(s)</p>
                          <p>Phase 2: {iteration} iteration(s)</p>
                          <p className="font-medium">Total: {phase1Iterations + iteration} iteration(s)</p>
                        </>
                      ) : (
                        <p>Found in {iteration} iteration(s)</p>
                      )}
                    </div>
                  </div>

                  {/* Basic vs Non-Basic Summary */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Basic variables:</span>
                        <span className="font-medium">{basicVariables.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Non-basic variables:</span>
                        <span className="font-medium">{numVariables - basicVariables.filter(bv => bv < numVariables).length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              
              <Button onClick={handleRatioSubmit} size="sm" className={getHighlightClass()}>
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
              
              <Button onClick={handlePivotRowSubmit} size="sm" className={getHighlightClass()}>
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
                  } else if (needsPhase1) {
                    // Phase 2 after Phase 1 - last row is (-f) row
                    rowLabel = i === tableau.length - 1 ? '(-f) row' : `Row ${i + 1}`;
                  } else {
                    rowLabel = i === tableau.length - 1 ? '(-f) row' : `Row ${i + 1}`;
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
                
                <Button onClick={handleOtherRowsSubmit} size="sm" className={getHighlightClass()}>
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
                  A solution is <strong>optimal</strong> when ALL values in the {needsPhase1 && currentPhase === 1 ? '(-w)' : '(-f)'} row (excluding b) are <strong>non-negative</strong> (≥ 0).
                </p>
                <p className="text-sm text-gray-700">
                  If any value in the {needsPhase1 && currentPhase === 1 ? '(-w)' : '(-f)'} row is negative, we can still improve the solution by performing another iteration.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm mb-3">
                  <strong>Examine the {needsPhase1 && currentPhase === 1 ? '(-w)' : '(-f)'} row in the Simplex Tableau above. Is the current solution optimal?</strong>
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
                <p><strong>Hint:</strong> Look for any negative values in the {needsPhase1 && currentPhase === 1 ? '(-w)' : '(-f)'} row (excluding the b column). If there are no negative values, the solution is optimal.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}