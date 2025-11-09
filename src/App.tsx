import { useState } from "react";
import { Calculator, Sparkles, Zap } from "lucide-react";
import { SimplexInput } from "./components/SimplexInput";
import { SimplexSolution } from "./components/SimplexSolution";
import { InteractiveSimplex } from "./components/InteractiveSimplex";
import { FeedbackDialog } from "./components/FeedbackDialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import { Card } from "./components/ui/card";
import {
  RadioGroup,
  RadioGroupItem,
} from "./components/ui/radio-group";
import { Label } from "./components/ui/label";
import { Toaster } from "./components/ui/sonner";

export interface Constraint {
  coefficients: number[];
  operator: "<=" | ">=" | "=";
  rhs: number;
}

export interface SimplexProblem {
  objectiveCoefficients: number[];
  constraints: Constraint[];
  isMaximization: boolean;
  numVariables: number;
}

export interface IterationStep {
  iteration: number;
  enteringVar: number;
  leavingVar: number;
  pivotElement: number;
  minRatio: number;
  explanation: string;
}

export interface CanonicalFormInfo {
  initialZRow: number[];
  finalZRow: number[];
  eliminatedVars: Array<{
    varIndex: number;
    coefficient: number;
    rowIndex: number;
  }>;
}

export interface SimplexResult {
  tableaus: number[][][];
  basicVariables: number[][];
  optimalSolution: number[];
  optimalValue: number;
  iterations: number;
  status: "optimal" | "unbounded" | "infeasible";
  phase1Tableaus?: number[][][];
  phase1BasicVariables?: number[][];
  phase1Iterations?: number;
  needsPhase1?: boolean;
  numSlack?: number;
  numArtificial?: number;
  steps?: IterationStep[];
  phase1Steps?: IterationStep[];
  canonicalFormInfo?: CanonicalFormInfo;
}

export default function App() {
  const [problem, setProblem] = useState<SimplexProblem | null>(
    null,
  );
  const [result, setResult] = useState<SimplexResult | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("input");
  const [solveMode, setSolveMode] = useState<
    "auto" | "interactive"
  >("interactive");

  const handleSolve = (newProblem: SimplexProblem) => {
    setProblem(newProblem);

    if (solveMode === "auto") {
      const solution = solveSimplex(newProblem);
      setResult(solution);
      setActiveTab("solution");
    } else {
      setActiveTab("interactive");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Calculator className="w-10 h-10 text-indigo-600" />
            <h1 className="text-indigo-900">
              Interactive Simplex Method
            </h1>
          </div>
          <p className="text-gray-600">
            Learn the Simplex algorithm by solving problems
            step-by-step
          </p>
        </div>

        <Card className="shadow-xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="input">
                Problem Setup
              </TabsTrigger>
              <TabsTrigger
                value="interactive"
                disabled={!problem || solveMode === "auto"}
              >
                Interactive Solve
              </TabsTrigger>
              <TabsTrigger
                value="solution"
                disabled={
                  !result || solveMode === "interactive"
                }
              >
                Auto Solution
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="p-6">
              <div className="mb-6">
                <Label className="mb-3 block">
                  Solving Mode
                </Label>
                <RadioGroup
                  value={solveMode}
                  onValueChange={(val) =>
                    setSolveMode(val as "auto" | "interactive")
                  }
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="interactive"
                      id="interactive"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="interactive"
                      className="flex flex-col items-center gap-3 p-5 rounded-lg border-2 border-gray-200 bg-white cursor-pointer transition-all hover:border-indigo-300 hover:shadow-md peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:bg-indigo-50 peer-data-[state=checked]:shadow-lg"
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 peer-data-[state=checked]:bg-indigo-600">
                        <Sparkles className="w-6 h-6 text-indigo-600 peer-data-[state=checked]:text-white" />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">
                          Interactive Mode
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Solve step-by-step with guidance
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="auto"
                      id="auto"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="auto"
                      className="flex flex-col items-center gap-3 p-5 rounded-lg border-2 border-gray-200 bg-white cursor-pointer transition-all hover:border-indigo-300 hover:shadow-md peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:bg-indigo-50 peer-data-[state=checked]:shadow-lg"
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100">
                        <Zap className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">
                          Automatic Mode
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Get instant solution
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <SimplexInput onSolve={handleSolve} initialProblem={problem} />
            </TabsContent>

            <TabsContent value="interactive" className="p-6">
              {problem && (
                <InteractiveSimplex 
                  problem={problem} 
                  onEditProblem={() => setActiveTab("input")}
                />
              )}
            </TabsContent>

            <TabsContent value="solution" className="p-6">
              {result && problem && (
                <SimplexSolution
                  result={result}
                  problem={problem}
                />
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            The Simplex method is an iterative algorithm for
            solving linear programming problems
          </p>
        </div>
      </div>
      <Toaster />
      <FeedbackDialog />
    </div>
  );
}

// Simplex algorithm implementation
export function solveSimplex(
  problem: SimplexProblem,
): SimplexResult {
  const {
    objectiveCoefficients,
    constraints,
    isMaximization,
    numVariables,
  } = problem;

  // Count slack and artificial variables needed
  let numSlack = 0;
  let numArtificial = 0;

  constraints.forEach((constraint) => {
    if (constraint.operator === "<=") {
      numSlack++;
    } else if (constraint.operator === ">=") {
      numSlack++;
      numArtificial++;
    } else {
      // '='
      numArtificial++;
    }
  });

  const needsPhase1 = numArtificial > 0;
  
  // If we need Phase 1, solve it first
  if (needsPhase1) {
    return solveTwoPhase(problem, numSlack, numArtificial);
  } else {
    // Standard simplex
    return solveStandardSimplex(problem, numSlack, numArtificial);
  }
}

// Standard Simplex (no artificial variables needed)
function solveStandardSimplex(
  problem: SimplexProblem,
  numSlack: number,
  numArtificial: number,
): SimplexResult {
  const {
    objectiveCoefficients,
    constraints,
    isMaximization,
    numVariables,
  } = problem;

  // Convert to standard form (maximization)
  let objCoeffs = isMaximization
    ? [...objectiveCoefficients]
    : objectiveCoefficients.map((c) => -c);

  const tableaus: number[][][] = [];
  const basicVariablesHistory: number[][] = [];
  const steps: IterationStep[] = [];

  const totalVars = numVariables + numSlack;
  const numConstraints = constraints.length;

  // Initialize tableau
  const tableau: number[][] = [];
  const basicVariables: number[] = [];

  // Build constraint rows
  let slackIdx = 0;

  constraints.forEach((constraint) => {
    const row: number[] = new Array(totalVars + 1).fill(0);

    // Original variable coefficients
    constraint.coefficients.forEach((coeff, j) => {
      row[j] = constraint.rhs >= 0 ? coeff : -coeff;
    });

    // Add slack variable (all are <= in this case)
    row[numVariables + slackIdx] = constraint.rhs >= 0 ? 1 : -1;
    basicVariables.push(numVariables + slackIdx);
    slackIdx++;

    // b (right-hand side)
    row[totalVars] = Math.abs(constraint.rhs);

    tableau.push(row);
  });

  // Build objective row
  const objRow: number[] = new Array(totalVars + 1).fill(0);
  objCoeffs.forEach((coeff, i) => {
    objRow[i] = -coeff;
  });

  tableau.push(objRow);

  tableaus.push(JSON.parse(JSON.stringify(tableau)));
  basicVariablesHistory.push([...basicVariables]);

  // Simplex iterations
  let iterations = 0;
  const MAX_ITERATIONS = 100;

  while (iterations < MAX_ITERATIONS) {
    // Find entering variable (most negative in objective row)
    let enteringVar = -1;
    let mostNegative = -1e-10;

    for (let j = 0; j < totalVars; j++) {
      if (tableau[numConstraints][j] < mostNegative) {
        mostNegative = tableau[numConstraints][j];
        enteringVar = j;
      }
    }

    // If no negative values, we have optimal solution
    if (enteringVar === -1) {
      break;
    }

    // Find leaving variable (minimum ratio test)
    let leavingRow = -1;
    let minRatio = Infinity;

    for (let i = 0; i < numConstraints; i++) {
      if (tableau[i][enteringVar] > 1e-10) {
        const ratio =
          tableau[i][totalVars] / tableau[i][enteringVar];
        if (ratio < minRatio) {
          minRatio = ratio;
          leavingRow = i;
        }
      }
    }

    // If no leaving variable, problem is unbounded
    if (leavingRow === -1) {
      return {
        tableaus,
        basicVariables: basicVariablesHistory,
        optimalSolution: [],
        optimalValue: 0,
        iterations,
        status: "unbounded",
        numSlack,
        numArtificial,
        needsPhase1: false,
      };
    }

    // Pivot operation
    const pivotElement = tableau[leavingRow][enteringVar];
    const leavingVar = basicVariables[leavingRow]; // Store before updating

    // Divide pivot row by pivot element
    for (let j = 0; j <= totalVars; j++) {
      tableau[leavingRow][j] /= pivotElement;
    }

    // Eliminate entering variable from other rows
    for (let i = 0; i <= numConstraints; i++) {
      if (i !== leavingRow) {
        const factor = tableau[i][enteringVar];
        for (let j = 0; j <= totalVars; j++) {
          tableau[i][j] -= factor * tableau[leavingRow][j];
        }
      }
    }

    // Update basic variables
    basicVariables[leavingRow] = enteringVar;

    tableaus.push(JSON.parse(JSON.stringify(tableau)));
    basicVariablesHistory.push([...basicVariables]);
    iterations++;

    // Add step to steps array
    steps.push({
      iteration: iterations,
      enteringVar,
      leavingVar,
      pivotElement,
      minRatio,
      explanation: `Pivot on element (${leavingRow + 1}, ${enteringVar + 1}) with ratio ${minRatio.toFixed(2)}`,
    });
  }

  // Extract solution
  const solution = new Array(numVariables).fill(0);
  basicVariables.forEach((varIdx, rowIdx) => {
    if (varIdx < numVariables) {
      solution[varIdx] = tableau[rowIdx][totalVars];
    }
  });

  let optimalValue = tableau[numConstraints][totalVars];
  if (!isMaximization) {
    optimalValue = -optimalValue;
  }

  return {
    tableaus,
    basicVariables: basicVariablesHistory,
    optimalSolution: solution,
    optimalValue,
    iterations,
    status: "optimal",
    numSlack,
    numArtificial,
    needsPhase1: false,
    steps,
  };
}

// Two-Phase Simplex Method
function solveTwoPhase(
  problem: SimplexProblem,
  numSlack: number,
  numArtificial: number,
): SimplexResult {
  const {
    objectiveCoefficients,
    constraints,
    isMaximization,
    numVariables,
  } = problem;

  const totalVars = numVariables + numSlack + numArtificial;
  const numConstraints = constraints.length;

  // ===== PHASE 1: Minimize sum of artificial variables =====
  const phase1Tableau: number[][] = [];
  const phase1BasicVariables: number[] = [];
  const phase1Steps: IterationStep[] = [];

  // Build constraint rows for Phase 1
  // Each row now has: decision vars, slack vars, artificial vars, (-w) column, b column
  let slackIdx = 0;
  let artificialIdx = 0;

  constraints.forEach((constraint) => {
    const row: number[] = new Array(totalVars + 2).fill(0); // +2 for (-w) column and b column

    // Original variable coefficients
    constraint.coefficients.forEach((coeff, j) => {
      row[j] = constraint.rhs >= 0 ? coeff : -coeff;
    });

    // Add slack/surplus and artificial variables
    if (constraint.operator === "<=") {
      row[numVariables + slackIdx] = constraint.rhs >= 0 ? 1 : -1;
      phase1BasicVariables.push(numVariables + slackIdx);
      slackIdx++;
    } else if (constraint.operator === ">=") {
      row[numVariables + slackIdx] = constraint.rhs >= 0 ? -1 : 1;
      row[numVariables + numSlack + artificialIdx] = 1;
      phase1BasicVariables.push(numVariables + numSlack + artificialIdx);
      slackIdx++;
      artificialIdx++;
    } else {
      // '='
      row[numVariables + numSlack + artificialIdx] = 1;
      phase1BasicVariables.push(numVariables + numSlack + artificialIdx);
      artificialIdx++;
    }

    // (-w) column: 0 for all constraint rows
    row[totalVars] = 0;
    
    // b (right-hand side)
    row[totalVars + 1] = Math.abs(constraint.rhs);

    phase1Tableau.push(row);
  });

  // (-f) row: Original objective function (all zeros in Phase 1)
  const fRow: number[] = new Array(totalVars + 2).fill(0);
  fRow[totalVars] = 1; // (-w) column has 1 in (-f) row
  fRow[totalVars + 1] = 0; // b value is 0
  phase1Tableau.push(fRow);

  // (-w) row: Phase 1 objective - Minimize sum of artificial variables
  const phase1WRow: number[] = new Array(totalVars + 2).fill(0);
  
  // Coefficient of 1 for each artificial variable
  for (let i = 0; i < numArtificial; i++) {
    phase1WRow[numVariables + numSlack + i] = 1;
  }
  phase1WRow[totalVars] = 1; // (-w) column has 1 in (-w) row
  phase1WRow[totalVars + 1] = 0; // b value starts at 0

  phase1Tableau.push(phase1WRow);

  // Eliminate artificial variables from w row
  for (let i = 0; i < numConstraints; i++) {
    if (phase1BasicVariables[i] >= numVariables + numSlack) {
      // This row has an artificial variable
      for (let j = 0; j <= totalVars + 1; j++) {
        phase1Tableau[numConstraints + 1][j] -= phase1Tableau[i][j];
      }
    }
  }

  const phase1Tableaus: number[][][] = [];
  const phase1BasicVariablesHistory: number[][] = [];

  phase1Tableaus.push(JSON.parse(JSON.stringify(phase1Tableau)));
  phase1BasicVariablesHistory.push([...phase1BasicVariables]);

  // Run Phase 1 simplex iterations
  let phase1Iterations = 0;
  const MAX_ITERATIONS = 100;

  while (phase1Iterations < MAX_ITERATIONS) {
    // Find entering variable (check (-w) row which is at index numConstraints + 1)
    let enteringVar = -1;
    let mostNegative = -1e-10;

    for (let j = 0; j < totalVars; j++) {
      if (phase1Tableau[numConstraints + 1][j] < mostNegative) {
        mostNegative = phase1Tableau[numConstraints + 1][j];
        enteringVar = j;
      }
    }

    if (enteringVar === -1) {
      break; // Phase 1 complete
    }

    // Find leaving variable (use b column which is now at totalVars + 1)
    let leavingRow = -1;
    let minRatio = Infinity;

    for (let i = 0; i < numConstraints; i++) {
      if (phase1Tableau[i][enteringVar] > 1e-10) {
        const ratio = phase1Tableau[i][totalVars + 1] / phase1Tableau[i][enteringVar];
        if (ratio < minRatio) {
          minRatio = ratio;
          leavingRow = i;
        }
      }
    }

    if (leavingRow === -1) {
      return {
        tableaus: [],
        basicVariables: [],
        optimalSolution: [],
        optimalValue: 0,
        iterations: 0,
        status: "unbounded",
        phase1Tableaus,
        phase1BasicVariables: phase1BasicVariablesHistory,
        phase1Iterations,
        needsPhase1: true,
        numSlack,
        numArtificial,
      };
    }

    // Pivot
    const pivotElement = phase1Tableau[leavingRow][enteringVar];
    const leavingVar = phase1BasicVariables[leavingRow]; // Store before updating

    for (let j = 0; j <= totalVars + 1; j++) {
      phase1Tableau[leavingRow][j] /= pivotElement;
    }

    for (let i = 0; i <= numConstraints + 1; i++) {
      if (i !== leavingRow) {
        const factor = phase1Tableau[i][enteringVar];
        for (let j = 0; j <= totalVars + 1; j++) {
          phase1Tableau[i][j] -= factor * phase1Tableau[leavingRow][j];
        }
      }
    }

    phase1BasicVariables[leavingRow] = enteringVar;

    phase1Tableaus.push(JSON.parse(JSON.stringify(phase1Tableau)));
    phase1BasicVariablesHistory.push([...phase1BasicVariables]);
    phase1Iterations++;

    // Add step to phase1Steps array
    phase1Steps.push({
      iteration: phase1Iterations,
      enteringVar,
      leavingVar,
      pivotElement,
      minRatio,
      explanation: `Pivot on element (${leavingRow + 1}, ${enteringVar + 1}) with ratio ${minRatio.toFixed(2)}`,
    });
  }

  // Check if Phase 1 found a feasible solution
  // (-w) row is at index numConstraints + 1, b column is at totalVars + 1
  const phase1OptimalValue = phase1Tableau[numConstraints + 1][totalVars + 1];
  if (Math.abs(phase1OptimalValue) > 1e-6) {
    // No feasible solution exists
    return {
      tableaus: [],
      basicVariables: [],
      optimalSolution: [],
      optimalValue: 0,
      iterations: 0,
      status: "infeasible",
      phase1Tableaus,
      phase1BasicVariables: phase1BasicVariablesHistory,
      phase1Iterations,
      needsPhase1: true,
      numSlack,
      numArtificial,
    };
  }

  // ===== PHASE 2: Solve original problem =====
  // Remove artificial variable columns and (-w) column from tableau
  const phase2Tableau: number[][] = [];
  const phase2BasicVariables = [...phase1BasicVariables];

  for (let i = 0; i < numConstraints; i++) {
    const row: number[] = [];
    for (let j = 0; j < numVariables + numSlack; j++) {
      row.push(phase1Tableau[i][j]);
    }
    row.push(phase1Tableau[i][totalVars + 1]); // b (right-hand side, skip (-w) column)
    phase2Tableau.push(row);
  }

  // Build Phase 2 objective row with original objective
  const objCoeffs = isMaximization
    ? [...objectiveCoefficients]
    : objectiveCoefficients.map((c) => -c);

  const phase2ObjRow: number[] = new Array(numVariables + numSlack + 1).fill(0);
  objCoeffs.forEach((coeff, i) => {
    phase2ObjRow[i] = -coeff;
  });

  phase2Tableau.push(phase2ObjRow);

  // Track canonical form conversion for educational purposes
  const initialZRow = [...phase2ObjRow];
  const eliminatedVars: Array<{ varIndex: number; coefficient: number; rowIndex: number }> = [];
  
  // Eliminate basic variables from objective row
  for (let i = 0; i < numConstraints; i++) {
    const basicVar = phase2BasicVariables[i];
    if (basicVar < numVariables + numSlack && Math.abs(phase2Tableau[numConstraints][basicVar]) > 1e-10) {
      const factor = phase2Tableau[numConstraints][basicVar];
      eliminatedVars.push({
        varIndex: basicVar,
        coefficient: factor,
        rowIndex: i,
      });
      for (let j = 0; j <= numVariables + numSlack; j++) {
        phase2Tableau[numConstraints][j] -= factor * phase2Tableau[i][j];
      }
    }
  }
  
  const finalZRow = [...phase2Tableau[numConstraints]];
  const canonicalFormInfo: CanonicalFormInfo = {
    initialZRow,
    finalZRow,
    eliminatedVars,
  };

  const phase2Tableaus: number[][][] = [];
  const phase2BasicVariablesHistory: number[][] = [];
  const phase2Steps: IterationStep[] = [];

  phase2Tableaus.push(JSON.parse(JSON.stringify(phase2Tableau)));
  phase2BasicVariablesHistory.push([...phase2BasicVariables]);

  // Run Phase 2 simplex iterations
  let phase2Iterations = 0;

  while (phase2Iterations < MAX_ITERATIONS) {
    // Find entering variable
    let enteringVar = -1;
    let mostNegative = -1e-10;

    for (let j = 0; j < numVariables + numSlack; j++) {
      if (phase2Tableau[numConstraints][j] < mostNegative) {
        mostNegative = phase2Tableau[numConstraints][j];
        enteringVar = j;
      }
    }

    if (enteringVar === -1) {
      break; // Optimal solution found
    }

    // Find leaving variable
    let leavingRow = -1;
    let minRatio = Infinity;

    for (let i = 0; i < numConstraints; i++) {
      if (phase2Tableau[i][enteringVar] > 1e-10) {
        const ratio = phase2Tableau[i][numVariables + numSlack] / phase2Tableau[i][enteringVar];
        if (ratio < minRatio) {
          minRatio = ratio;
          leavingRow = i;
        }
      }
    }

    if (leavingRow === -1) {
      return {
        tableaus: phase2Tableaus,
        basicVariables: phase2BasicVariablesHistory,
        optimalSolution: [],
        optimalValue: 0,
        iterations: phase2Iterations,
        status: "unbounded",
        phase1Tableaus,
        phase1BasicVariables: phase1BasicVariablesHistory,
        phase1Iterations,
        needsPhase1: true,
        numSlack,
        numArtificial,
      };
    }

    // Pivot
    const pivotElement = phase2Tableau[leavingRow][enteringVar];
    const leavingVar = phase2BasicVariables[leavingRow]; // Store before updating

    for (let j = 0; j <= numVariables + numSlack; j++) {
      phase2Tableau[leavingRow][j] /= pivotElement;
    }

    for (let i = 0; i <= numConstraints; i++) {
      if (i !== leavingRow) {
        const factor = phase2Tableau[i][enteringVar];
        for (let j = 0; j <= numVariables + numSlack; j++) {
          phase2Tableau[i][j] -= factor * phase2Tableau[leavingRow][j];
        }
      }
    }

    phase2BasicVariables[leavingRow] = enteringVar;

    phase2Tableaus.push(JSON.parse(JSON.stringify(phase2Tableau)));
    phase2BasicVariablesHistory.push([...phase2BasicVariables]);
    phase2Iterations++;

    // Add step to phase2Steps array
    phase2Steps.push({
      iteration: phase2Iterations,
      enteringVar,
      leavingVar,
      pivotElement,
      minRatio,
      explanation: `Pivot on element (${leavingRow + 1}, ${enteringVar + 1}) with ratio ${minRatio.toFixed(2)}`,
    });
  }

  // Extract solution
  const solution = new Array(numVariables).fill(0);
  phase2BasicVariables.forEach((varIdx, rowIdx) => {
    if (varIdx < numVariables) {
      solution[varIdx] = phase2Tableau[rowIdx][numVariables + numSlack];
    }
  });

  let optimalValue = phase2Tableau[numConstraints][numVariables + numSlack];
  if (!isMaximization) {
    optimalValue = -optimalValue;
  }

  return {
    tableaus: phase2Tableaus,
    basicVariables: phase2BasicVariablesHistory,
    optimalSolution: solution,
    optimalValue,
    iterations: phase2Iterations,
    status: "optimal",
    phase1Tableaus,
    phase1BasicVariables: phase1BasicVariablesHistory,
    phase1Iterations,
    needsPhase1: true,
    numSlack,
    numArtificial,
    steps: phase2Steps,
    phase1Steps,
    canonicalFormInfo,
  };
}