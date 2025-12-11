import React from 'react';
import { 
  BookOpen, 
  Calculator, 
  CheckCircle, 
  Play, 
  Settings, 
  Target, 
  TrendingUp,
  FileDown,
  Save,
  FolderOpen,
  Lightbulb,
  AlertTriangle,
  Info,
  HelpCircle,
  FileSpreadsheet,
  FileText,
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

export function UserManual() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-3">
          <BookOpen className="w-10 h-10 text-indigo-600" />
          <h1 className="text-indigo-900">Simplex Tool User Manual</h1>
        </div>
        <p className="text-gray-600">
          Complete guide to using the Interactive Simplex Method Calculator
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The Interactive Simplex Method Calculator is an educational tool designed to help students learn linear programming 
            by solving Simplex problems step-by-step. The tool guides you through the entire algorithm, from setting up the 
            initial tableau to finding the optimal solution.
          </p>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Key Features
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Step-by-step interactive solving with real-time feedback</li>
              <li>Support for Standard Simplex and Two-Phase Simplex methods</li>
              <li>Manual tableau setup to understand standard form conversion</li>
              <li>Automatic mode for instant solutions</li>
              <li>Save and load problem functionality</li>
              <li>Built-in problem library with examples</li>
              <li>Export solutions to Excel or PDF</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="space-y-4">
        <AccordionItem value="getting-started">
          <Card>
            <AccordionTrigger className="px-6 pt-6 pb-0 hover:no-underline">
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                1. Getting Started
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Choosing a Solving Mode</h3>
                  <p className="text-sm mb-3">
                    Before entering your problem, select one of two modes:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Interactive Mode</h4>
                      <p className="text-sm text-gray-700">
                        Solve problems step-by-step with guided assistance. Perfect for learning and understanding 
                        each phase of the Simplex algorithm.
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Automatic Mode</h4>
                      <p className="text-sm text-gray-700">
                        Get instant solutions with complete tableaus and iterations displayed. Useful for checking 
                        your work or solving problems quickly.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Entering a Problem</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      <strong>Set the number of decision variables</strong> - Enter how many variables your problem has (e.g., x₁, x₂, x₃)
                    </li>
                    <li>
                      <strong>Set the number of constraints</strong> - Enter the number of constraint equations
                    </li>
                    <li>
                      <strong>Choose optimization type</strong> - Select either Maximize or Minimize
                    </li>
                    <li>
                      <strong>Enter objective function coefficients</strong> - Input the coefficients for each variable
                    </li>
                    <li>
                      <strong>Enter constraint coefficients</strong> - For each constraint, input:
                      <ul className="list-disc list-inside ml-6 mt-1">
                        <li>Coefficients for each variable</li>
                        <li>Constraint type (≤, ≥, or =)</li>
                        <li>Right-hand side value</li>
                      </ul>
                    </li>
                  </ol>
                  <Alert className="mt-4">
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Tip:</strong> Use the "Load from Library" button to explore pre-built example problems 
                      and learn from different problem types.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="interactive-mode">
          <Card>
            <AccordionTrigger className="px-6 pt-6 pb-0 hover:no-underline">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                2. Interactive Mode - Setup Phase
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm">
                  In Interactive Mode, you'll first complete the tableau setup phase. This teaches you how to convert 
                  linear programming problems into standard form.
                </p>

                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                      Determine Slack/Surplus Variables
                    </h4>
                    <p className="text-sm text-gray-700">
                      Count how many slack or surplus variables are needed:
                    </p>
                    <ul className="list-disc list-inside ml-4 text-sm text-gray-700 mt-2">
                      <li><strong>≤ constraints:</strong> Add one slack variable</li>
                      <li><strong>≥ constraints:</strong> Add one surplus variable</li>
                      <li><strong>= constraints:</strong> No slack/surplus needed</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                      Check for Phase 1 Requirement
                    </h4>
                    <p className="text-sm text-gray-700">
                      Determine if artificial variables are needed:
                    </p>
                    <ul className="list-disc list-inside ml-4 text-sm text-gray-700 mt-2">
                      <li><strong>≥ constraints:</strong> Need one artificial variable each</li>
                      <li><strong>= constraints:</strong> Need one artificial variable each</li>
                      <li><strong>If any artificial variables needed:</strong> Two-Phase method is required</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                      Build Constraint Rows
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      For each constraint, enter the complete row including:
                    </p>
                    <ul className="list-disc list-inside ml-4 text-sm text-gray-700">
                      <li>Original decision variable coefficients</li>
                      <li>Slack/surplus variable (1, -1, or 0 in appropriate column)</li>
                      <li>Artificial variables (if needed)</li>
                      <li>RHS value</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                      Set Up Objective Function Row(s)
                    </h4>
                    <p className="text-sm text-gray-700">
                      <strong>Standard Simplex:</strong> Build the (-f) row with negative objective coefficients
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Two-Phase Simplex:</strong> Build both (-f) and (-w) rows, then eliminate artificial 
                      variables from the (-w) row using row operations.
                    </p>
                  </div>
                </div>

                <Alert>
                  <HelpCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Need Help?</strong> Use the "Show Hint" button at each step for guidance, or "Show Explanation" 
                    for detailed instructions.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="solving-phase">
          <Card>
            <AccordionTrigger className="px-6 pt-6 pb-0 hover:no-underline">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                3. Interactive Mode - Solving Phase
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm">
                  After setup, you'll perform Simplex iterations to find the optimal solution.
                </p>

                <div className="space-y-4">
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <h4 className="font-semibold mb-2">Step 1: Check Optimality</h4>
                    <p className="text-sm text-gray-700">
                      Review the objective row ((-f) in Phase 2, (-w) in Phase 1). If all coefficients are 
                      non-negative, the current solution is optimal.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold mb-2">Step 2: Select Entering Variable</h4>
                    <p className="text-sm text-gray-700">
                      Click on the column with the <strong>most negative coefficient</strong> in the objective row. 
                      This variable will enter the basis.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold mb-2">Step 3: Calculate Ratios (Minimum Ratio Test)</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      For each constraint row, calculate the ratio:
                    </p>
                    <div className="bg-gray-100 p-3 rounded font-mono text-sm text-center">
                      Ratio = b value ÷ entering variable coefficient
                    </div>
                    <p className="text-sm text-gray-700 mt-2">
                      Only calculate ratios where the entering variable coefficient is positive. Enter "N/A" 
                      for negative or zero coefficients.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold mb-2">Step 4: Select Leaving Variable</h4>
                    <p className="text-sm text-gray-700">
                      Click on the row with the <strong>smallest non-negative ratio</strong>. The basic variable 
                      in this row will leave the basis.
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold mb-2">Step 5: Calculate New Pivot Row</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Divide each element in the pivot row by the pivot element:
                    </p>
                    <div className="bg-gray-100 p-3 rounded font-mono text-sm text-center">
                      New Pivot Row = Old Pivot Row ÷ Pivot Element
                    </div>
                  </div>

                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold mb-2">Step 6: Calculate Other Rows</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      For each other row (including objective rows), use row elimination:
                    </p>
                    <div className="bg-gray-100 p-3 rounded font-mono text-sm text-center">
                      New Row = Old Row - (multiplier × New Pivot Row)
                    </div>
                    <p className="text-sm text-gray-700 mt-2">
                      The multiplier is the value in the entering variable's column of the row being updated.
                    </p>
                  </div>

                  <div className="border-l-4 border-teal-500 pl-4">
                    <h4 className="font-semibold mb-2">Step 7: Repeat</h4>
                    <p className="text-sm text-gray-700">
                      Continue iterations until all coefficients in the objective row are non-negative.
                    </p>
                  </div>
                </div>

                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <strong>Important:</strong> The tool rounds all calculations to 2 decimal places. Make sure your 
                    manual calculations also round to 2 decimal places for answers to match.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="two-phase">
          <Card>
            <AccordionTrigger className="px-6 pt-6 pb-0 hover:no-underline">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                4. Two-Phase Simplex Method
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm">
                  When your problem has ≥ or = constraints, you'll need artificial variables, which requires 
                  the Two-Phase Simplex method.
                </p>

                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Phase 1: Find a Basic Feasible Solution</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <strong>Objective:</strong> Minimize the sum of artificial variables (w = sum of artificial variables)
                      </p>
                      <p>
                        <strong>Tableau Structure:</strong>
                      </p>
                      <ul className="list-disc list-inside ml-4">
                        <li>Constraint rows with decision, slack, and artificial variables</li>
                        <li>(-f) row: Original objective (kept for Phase 2)</li>
                        <li>(-w) row: Phase 1 objective with coefficients of 1 for artificial variables</li>
                      </ul>
                      <p className="mt-2">
                        <strong>Key Step:</strong> Eliminate artificial variables from the (-w) row by subtracting 
                        rows that have artificial variables in the basis.
                      </p>
                      <p className="mt-2">
                        <strong>Success Criteria:</strong> Phase 1 is successful if the optimal value of w = 0. 
                        If w &gt; 0, the problem is infeasible.
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Phase 2: Solve the Original Problem</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <strong>Setup:</strong> Remove artificial variable columns and the (-w) row from the final 
                        Phase 1 tableau
                      </p>
                      <p>
                        <strong>Canonical Form Conversion:</strong> The (-f) row may have non-zero values for basic 
                        variables. Eliminate these using row operations.
                      </p>
                      <p>
                        <strong>Then:</strong> Proceed with standard Simplex iterations using the (-f) row to 
                        determine entering variables.
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    The tool will guide you through each phase and automatically transition from Phase 1 to Phase 2 
                    when appropriate.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="save-load">
          <Card>
            <AccordionTrigger className="px-6 pt-6 pb-0 hover:no-underline">
              <CardTitle className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                5. Save & Load Features
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Progress
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Save your current problem and solving progress to continue later:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                      <li>Click "Save Progress" in Interactive Mode</li>
                      <li>Enter a descriptive name for your progress</li>
                      <li>Click Save - your progress is stored in browser memory</li>
                    </ol>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Load Progress
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Resume a previously saved problem:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                      <li>Click "Load Progress" on the Problem Setup tab</li>
                      <li>Select from your saved progress files</li>
                      <li>Click Load - you'll continue exactly where you left off</li>
                    </ol>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileDown className="w-4 h-4" />
                      Export Problem
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Save problem definition as a JSON file:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                      <li>Enter your problem on the Problem Setup tab</li>
                      <li>Click "Export Problem"</li>
                      <li>JSON file downloads with your problem definition</li>
                    </ol>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Load from Library
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Access pre-built example problems:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                      <li>Click "Load from Library"</li>
                      <li>Browse categories and examples</li>
                      <li>Select a problem to load it instantly</li>
                    </ol>
                    <p className="text-xs text-gray-600 mt-2">
                      Library includes: Standard Simplex, Two-Phase, Unbounded, Infeasible, and Degenerate cases
                    </p>
                  </div>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Tip:</strong> Saved progress is stored in your browser's local storage. Clearing browser 
                    data will delete saved progress, but exported JSON files are permanent.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="export">
          <Card>
            <AccordionTrigger className="px-6 pt-6 pb-0 hover:no-underline">
              <CardTitle className="flex items-center gap-2">
                <FileDown className="w-5 h-5" />
                6. Export Solutions
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm">
                  Export your complete solution with all iterations and calculations to Excel or PDF format.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel Export
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Exports include:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Complete problem definition</li>
                      <li>All tableau iterations</li>
                      <li>Row labels (basis, (-f), (-w))</li>
                      <li>Basic variable tracking</li>
                      <li>Final optimal solution</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      PDF Export
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      PDF includes:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Formatted problem statement</li>
                      <li>All iterations with proper formatting</li>
                      <li>Row and column labels</li>
                      <li>Clear presentation of each phase</li>
                      <li>Optimal solution summary</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Both export formats properly label rows including (-f) and (-w) rows in Phase 1, and correct 
                    (-f) row labeling in Phase 2 after Phase 1 completion.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="tips">
          <Card>
            <AccordionTrigger className="px-6 pt-6 pb-0 hover:no-underline">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                7. Tips for Success
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Badge className="bg-indigo-600">1</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Round to 2 Decimal Places</h4>
                      <p className="text-sm text-gray-700">
                        All calculations should be rounded to 2 decimal places to match the tool's validation. 
                        For example, 1/3 = 0.33, not 0.333.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Badge className="bg-indigo-600">2</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Use Hints Wisely</h4>
                      <p className="text-sm text-gray-700">
                        Try to solve each step yourself first. Use hints only when stuck. This helps reinforce 
                        learning and understanding of the algorithm.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Badge className="bg-indigo-600">3</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Check Your Ratios Carefully</h4>
                      <p className="text-sm text-gray-700">
                        In the minimum ratio test, only positive values in the entering variable column should have 
                        ratios calculated. Use "N/A" for zero or negative values.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Badge className="bg-indigo-600">4</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Save Your Progress Regularly</h4>
                      <p className="text-sm text-gray-700">
                        For complex problems, save your progress after completing major steps. This way you can 
                        return later without losing your work.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Badge className="bg-indigo-600">5</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Start with Simple Examples</h4>
                      <p className="text-sm text-gray-700">
                        Use the problem library to start with basic Standard Simplex problems before moving to 
                        Two-Phase problems. Build your understanding progressively.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Badge className="bg-indigo-600">6</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Understand Row Operations</h4>
                      <p className="text-sm text-gray-700">
                        The row elimination formula (New Row = Old Row - multiplier × Pivot Row) is fundamental. 
                        The multiplier is always the value in the entering variable's column of the row being updated.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Badge className="bg-indigo-600">7</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Compare with Automatic Mode</h4>
                      <p className="text-sm text-gray-700">
                        After solving a problem interactively, try solving the same problem in Automatic Mode to 
                        compare your work and verify your understanding.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="troubleshooting">
          <Card>
            <AccordionTrigger className="px-6 pt-6 pb-0 hover:no-underline">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                8. Troubleshooting
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-4">
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold mb-2">My answer is marked wrong but looks correct</h4>
                    <p className="text-sm text-gray-700">
                      <strong>Solution:</strong> Check your rounding. All values must be rounded to exactly 2 decimal 
                      places. For example, 0.666... must be entered as 0.67, not 0.66 or 0.667.
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold mb-2">I don't know how many artificial variables to add</h4>
                    <p className="text-sm text-gray-700">
                      <strong>Solution:</strong> Count constraints with ≥ or = operators. Each needs one artificial 
                      variable. Use the "Show Hint" button for specific guidance.
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold mb-2">The row operation formulas are confusing</h4>
                    <p className="text-sm text-gray-700">
                      <strong>Solution:</strong> Click "Show Formula" during the row calculation steps. The tool shows 
                      the exact formula with the specific numbers for your problem.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold mb-2">I can't find my saved progress</h4>
                    <p className="text-sm text-gray-700">
                      <strong>Solution:</strong> Saved progress is stored in browser local storage. If you cleared 
                      browser data or switched browsers/devices, the progress won't be available. Use "Export Problem" 
                      to create permanent JSON backups.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold mb-2">How do I know if I need Phase 1?</h4>
                    <p className="text-sm text-gray-700">
                      <strong>Solution:</strong> You need Phase 1 (Two-Phase method) if you have any constraints with 
                      ≥ or = operators. The tool will ask you during setup to determine if Phase 1 is needed.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold mb-2">The ratio test is confusing</h4>
                    <p className="text-sm text-gray-700">
                      <strong>Solution:</strong> Only calculate ratios for positive coefficients in the entering 
                      variable column. Enter "N/A" (without quotes) for zero or negative coefficients. The minimum 
                      positive ratio determines the leaving variable.
                    </p>
                  </div>
                </div>

                <Alert className="bg-indigo-50 border-indigo-200">
                  <Info className="h-4 w-4 text-indigo-600" />
                  <AlertDescription>
                    <strong>Still stuck?</strong> Try loading a similar problem from the library and solving it in 
                    Automatic Mode to see all the steps, then return to your problem.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>

      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Trophy className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Ready to Start Learning?</h3>
              <p className="text-sm text-gray-700 mb-3">
                The Simplex Method is a powerful algorithm for solving linear programming problems. With this 
                interactive tool, you'll gain hands-on experience and deep understanding of how it works.
              </p>
              <p className="text-sm text-gray-700">
                Start with a simple example from the library, work through it step-by-step, and gradually 
                tackle more complex problems. Remember, learning happens through practice!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}