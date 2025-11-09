import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Download, FileSpreadsheet, FileText, Info, ArrowRight, Calculator } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { SimplexResult, SimplexProblem, IterationStep, CanonicalFormInfo } from '../App';

interface SimplexSolutionProps {
  result: SimplexResult;
  problem: SimplexProblem;
}

export function SimplexSolution({ result, problem }: SimplexSolutionProps) {
  const [currentTableau, setCurrentTableau] = useState(
    result.tableaus && result.tableaus.length > 0 ? result.tableaus.length - 1 : 0
  );
  const [phase1Tableau, setPhase1Tableau] = useState(
    result.phase1Tableaus ? result.phase1Tableaus.length - 1 : 0
  );
  const [activePhase, setActivePhase] = useState<'phase1' | 'phase2'>(
    result.needsPhase1 ? 'phase1' : 'phase2'
  );

  const formatNumber = (num: number): string => {
    if (Math.abs(num) < 1e-10) return '0';
    return num.toFixed(3);
  };

  const goToPrevious = () => {
    if (activePhase === 'phase1') {
      if (phase1Tableau > 0) {
        setPhase1Tableau(phase1Tableau - 1);
      }
    } else {
      if (currentTableau > 0) {
        setCurrentTableau(currentTableau - 1);
      }
    }
  };

  const goToNext = () => {
    if (activePhase === 'phase1') {
      if (result.phase1Tableaus && phase1Tableau < result.phase1Tableaus.length - 1) {
        setPhase1Tableau(phase1Tableau + 1);
      }
    } else {
      if (result.tableaus && currentTableau < result.tableaus.length - 1) {
        setCurrentTableau(currentTableau + 1);
      }
    }
  };

  const exportToPDF = async () => {
    console.log('Auto Solution Export PDF - Result:', result);
    console.log('Auto Solution Export PDF - Phase 1 tableaus:', result.phase1Tableaus?.length || 0);
    console.log('Auto Solution Export PDF - Phase 2 tableaus:', result.tableaus?.length || 0);
    
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    
    let yPos = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    
    // Title
    doc.setFontSize(16);
    doc.text('Simplex Method Solution', 105, yPos, { align: 'center' });
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
    
    // Solution
    if (result.status === 'optimal') {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Optimal Solution', 20, yPos);
      yPos += lineHeight * 1.5;
      
      doc.setFontSize(10);
      result.optimalSolution.forEach((value, i) => {
        doc.text(`x${i+1} = ${formatNumber(value)}`, 25, yPos);
        yPos += lineHeight;
      });
      
      yPos += lineHeight * 0.5;
      doc.setFontSize(12);
      doc.text(`Optimal Value: Z = ${formatNumber(result.optimalValue)}`, 25, yPos);
      yPos += lineHeight;
      doc.text(`Total Iterations: ${result.iterations}`, 25, yPos);
      yPos += lineHeight * 2;
    }
    
    // Phase 1 tableaus (if they exist)
    if (result.phase1Tableaus && result.phase1Tableaus.length > 0) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Phase 1: Finding Feasible Solution', 20, yPos);
      yPos += lineHeight * 2;
      
      const slackCount = result.numSlack || 0;
      const artificialCount = result.numArtificial || 0;
      
      result.phase1Tableaus.forEach((tableau, iteration) => {
        const basicVars = result.phase1BasicVariables![iteration];
        const numConstraints = tableau.length - 1;
        
        if (yPos > pageHeight - 80) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(11);
        doc.text(`Iteration ${iteration}`, 20, yPos);
        yPos += lineHeight;
        
        // Generate proper headers for Phase 1 (includes slack and artificial vars)
        const slackHeaders = Array.from({ length: slackCount }, (_, i) => `s${i+1}`);
        const artificialHeaders = Array.from({ length: artificialCount }, (_, i) => `a${i+1}`);
        
        const headers = [
          'Basic',
          ...Array.from({ length: problem.numVariables }, (_, i) => `x${i+1}`),
          ...slackHeaders,
          ...artificialHeaders,
          'b'
        ];
        
        const body = [
          ...tableau.slice(0, numConstraints).map((row, i) => {
            let basicVar;
            if (basicVars[i] < problem.numVariables) {
              basicVar = `x${basicVars[i] + 1}`;
            } else if (basicVars[i] < problem.numVariables + slackCount) {
              basicVar = `s${basicVars[i] - problem.numVariables + 1}`;
            } else {
              basicVar = `a${basicVars[i] - problem.numVariables - slackCount + 1}`;
            }
            return [basicVar, ...row.map(v => formatNumber(v))];
          }),
          ['w', ...tableau[numConstraints].map(v => formatNumber(v))]
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
    if (result.tableaus && result.tableaus.length > 0) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      const phaseTitle = result.needsPhase1 ? 'Phase 2: Optimizing Objective Function' : 'Simplex Iterations';
      doc.text(phaseTitle, 20, yPos);
      yPos += lineHeight * 2;
      
      result.tableaus.forEach((tableau, iteration) => {
        const basicVars = result.basicVariables[iteration];
        const numConstraints = tableau.length - 1;
        const snapshotNumCols = tableau[0].length - 1 - problem.numVariables;
        
        if (yPos > pageHeight - 80) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(11);
        doc.text(`Iteration ${iteration}`, 20, yPos);
        yPos += lineHeight;
        
        const headers = [
          'Basic',
          ...Array.from({ length: problem.numVariables }, (_, i) => `x${i+1}`),
          ...Array.from({ length: snapshotNumCols }, (_, i) => `s${i+1}`),
          'b'
        ];
        
        const body = [
          ...tableau.slice(0, numConstraints).map((row, i) => {
            const basicVar = basicVars[i] < problem.numVariables 
              ? `x${basicVars[i] + 1}` 
              : `s${basicVars[i] - problem.numVariables + 1}`;
            return [basicVar, ...row.map(v => formatNumber(v))];
          }),
          ['Z', ...tableau[numConstraints].map(v => formatNumber(v))]
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
    
    // Save
    doc.save('simplex-solution.pdf');
  };

  const exportToExcel = async () => {
    console.log('Auto Solution Export Excel - Result:', result);
    console.log('Auto Solution Export Excel - Phase 1 tableaus:', result.phase1Tableaus?.length || 0);
    console.log('Auto Solution Export Excel - Phase 2 tableaus:', result.tableaus?.length || 0);
    
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    
    // Problem sheet
    const problemData = [
      ['Simplex Method Solution'],
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
    
    if (result.status === 'optimal') {
      problemData.push(
        [],
        ['Optimal Solution:'],
        ...result.optimalSolution.map((val, i) => [`x${i+1}`, formatNumber(val)]),
        [],
        ['Optimal Value:', formatNumber(result.optimalValue)],
        ['Iterations:', result.iterations]
      );
    }
    
    const problemSheet = XLSX.utils.aoa_to_sheet(problemData);
    XLSX.utils.book_append_sheet(wb, problemSheet, 'Problem & Solution');
    
    // Phase 1 tableaus
    if (result.phase1Tableaus && result.phase1Tableaus.length > 0) {
      const slackCount = result.numSlack || 0;
      const artificialCount = result.numArtificial || 0;
      
      result.phase1Tableaus.forEach((tableau, iteration) => {
        const basicVars = result.phase1BasicVariables![iteration];
        const numConstraints = tableau.length - 1;
        
        // Generate proper headers for Phase 1 (includes slack and artificial vars)
        const slackHeaders = Array.from({ length: slackCount }, (_, i) => `s${i+1}`);
        const artificialHeaders = Array.from({ length: artificialCount }, (_, i) => `a${i+1}`);
        
        const headers = [
          'Basic',
          ...Array.from({ length: problem.numVariables }, (_, i) => `x${i+1}`),
          ...slackHeaders,
          ...artificialHeaders,
          '(-f)',
          'b'
        ];
        
        const rows = tableau.slice(0, numConstraints).map((row, i) => {
          let basicVar;
          if (basicVars[i] < problem.numVariables) {
            basicVar = `x${basicVars[i] + 1}`;
          } else if (basicVars[i] < problem.numVariables + slackCount) {
            basicVar = `s${basicVars[i] - problem.numVariables + 1}`;
          } else {
            basicVar = `a${basicVars[i] - problem.numVariables - slackCount + 1}`;
          }
          const rowData = row.map(v => parseFloat(formatNumber(v)));
          // Insert (-f) column with value 0 before b
          rowData.splice(rowData.length - 1, 0, 0);
          return [basicVar, ...rowData];
        });
        
        const wRowData = tableau[numConstraints].map(v => parseFloat(formatNumber(v)));
        // Insert (-f) column with value 1 before b
        wRowData.splice(wRowData.length - 1, 0, 1);
        const wRow = ['(-f)', ...wRowData];
        
        const tableauData = [
          [`Phase 1 - Iteration ${iteration}`],
          headers,
          ...rows,
          wRow
        ];
        
        const tableauSheet = XLSX.utils.aoa_to_sheet(tableauData);
        XLSX.utils.book_append_sheet(wb, tableauSheet, `Phase1-Iter${iteration}`);
      });
    }
    
    // Phase 2 tableaus
    if (result.tableaus && result.tableaus.length > 0) {
      result.tableaus.forEach((tableau, iteration) => {
        const basicVars = result.basicVariables[iteration];
        const numConstraints = tableau.length - 1;
        const snapshotNumCols = tableau[0].length - 1 - problem.numVariables;
        
        const headers = [
          'Basic',
          ...Array.from({ length: problem.numVariables }, (_, i) => `x${i+1}`),
          ...Array.from({ length: snapshotNumCols }, (_, i) => `s${i+1}`),
          '(-f)',
          'b'
        ];
        
        const rows = tableau.slice(0, numConstraints).map((row, i) => {
          const basicVar = basicVars[i] < problem.numVariables 
            ? `x${basicVars[i] + 1}` 
            : `s${basicVars[i] - problem.numVariables + 1}`;
          const rowData = row.map(v => parseFloat(formatNumber(v)));
          // Insert (-f) column with value 0 before b
          rowData.splice(rowData.length - 1, 0, 0);
          return [basicVar, ...rowData];
        });
        
        const zRowData = tableau[numConstraints].map(v => parseFloat(formatNumber(v)));
        // Insert (-f) column with value 1 before b
        zRowData.splice(zRowData.length - 1, 0, 1);
        const zRow = ['(-f)', ...zRowData];
        
        const phaseLabel = result.needsPhase1 ? 'Phase 2' : 'Simplex';
        const tableauData = [
          [`${phaseLabel} - Iteration ${iteration}`],
          headers,
          ...rows,
          zRow
        ];
        
        const tableauSheet = XLSX.utils.aoa_to_sheet(tableauData);
        const sheetName = result.needsPhase1 ? `Phase2-Iter${iteration}` : `Iter${iteration}`;
        XLSX.utils.book_append_sheet(wb, tableauSheet, sheetName);
      });
    }
    
    XLSX.writeFile(wb, 'simplex-solution.xlsx');
  };

  // Only get current tableau data if not in phase1 or if tableaus exist
  const tableau = result.tableaus && result.tableaus.length > 0 
    ? result.tableaus[currentTableau] 
    : [];
  const basicVars = result.basicVariables && result.basicVariables.length > 0
    ? result.basicVariables[currentTableau]
    : [];
  const numConstraints = tableau.length > 0 ? tableau.length - 1 : 0;
  const numVars = tableau.length > 0 && tableau[0] ? tableau[0].length - 1 : 0;

  return (
    <div className="space-y-6">
      {result.status === 'optimal' ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Optimal solution found in {result.iterations} iteration{result.iterations !== 1 ? 's' : ''}!
            {result.needsPhase1 && ` (Phase 1: ${result.phase1Iterations} iterations, Phase 2: ${result.iterations} iterations)`}
          </AlertDescription>
        </Alert>
      ) : result.status === 'unbounded' ? (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            The problem is unbounded. The objective function can increase indefinitely.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            The problem is infeasible. No solution exists.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 justify-end">
        <Button onClick={exportToPDF} variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
        <Button onClick={exportToExcel} variant="outline" size="sm">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {result.status === 'optimal' && (
        <Card>
          <CardHeader>
            <CardTitle>Optimal Solution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="space-y-1">
                  {result.optimalSolution.map((value, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <span className="text-gray-700">x<sub>{index + 1}</sub></span>
                      <span>{formatNumber(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="text-center p-6 bg-indigo-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">
                    {problem.isMaximization ? 'Maximum' : 'Minimum'} Value
                  </div>
                  <div className="text-indigo-900">
                    Z = {formatNumber(result.optimalValue)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {result.needsPhase1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Two-Phase Simplex Method</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activePhase} onValueChange={(val) => setActivePhase(val as 'phase1' | 'phase2')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phase1">
                  Phase 1 - Find Feasible Solution
                </TabsTrigger>
                <TabsTrigger value="phase2" disabled={result.status === 'infeasible'}>
                  Phase 2 - Solve Original Problem
                </TabsTrigger>
              </TabsList>

              <TabsContent value="phase1" className="mt-4">
                {result.phase1Tableaus && result.phase1BasicVariables && (
                  <TableauDisplay
                    tableau={result.phase1Tableaus[phase1Tableau]}
                    basicVars={result.phase1BasicVariables[phase1Tableau]}
                    problem={problem}
                    currentIndex={phase1Tableau}
                    totalTableaus={result.phase1Tableaus.length}
                    onPrevious={() => phase1Tableau > 0 && setPhase1Tableau(phase1Tableau - 1)}
                    onNext={() => phase1Tableau < result.phase1Tableaus!.length - 1 && setPhase1Tableau(phase1Tableau + 1)}
                    formatNumber={formatNumber}
                    numArtificial={result.numArtificial || 0}
                    numSlack={result.numSlack || 0}
                    isPhase1={true}
                    steps={result.phase1Steps}
                  />
                )}
              </TabsContent>

              <TabsContent value="phase2" className="mt-4">
                {/* Show canonical form explanation for the first tableau */}
                {currentTableau === 0 && result.canonicalFormInfo && (
                  <CanonicalFormExplanation
                    canonicalFormInfo={result.canonicalFormInfo}
                    basicVars={basicVars}
                    problem={problem}
                    numSlack={result.numSlack || 0}
                    formatNumber={formatNumber}
                  />
                )}
                
                <TableauDisplay
                  tableau={tableau}
                  basicVars={basicVars}
                  problem={problem}
                  currentIndex={currentTableau}
                  totalTableaus={result.tableaus.length}
                  onPrevious={() => currentTableau > 0 && setCurrentTableau(currentTableau - 1)}
                  onNext={() => currentTableau < result.tableaus.length - 1 && setCurrentTableau(currentTableau + 1)}
                  formatNumber={formatNumber}
                  numArtificial={0}
                  numSlack={result.numSlack || 0}
                  isPhase1={false}
                  steps={result.steps}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Simplex Tableau</CardTitle>
              {result.tableaus && result.tableaus.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Iteration {currentTableau} of {result.tableaus.length - 1}
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <TableauDisplay
              tableau={tableau}
              basicVars={basicVars}
              problem={problem}
              currentIndex={currentTableau}
              totalTableaus={result.tableaus.length}
              onPrevious={goToPrevious}
              onNext={goToNext}
              formatNumber={formatNumber}
              numArtificial={0}
              numSlack={result.numSlack || 0}
              isPhase1={false}
              steps={result.steps}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Separate component for displaying tableaus
interface TableauDisplayProps {
  tableau: number[][];
  basicVars: number[];
  problem: SimplexProblem;
  currentIndex: number;
  totalTableaus: number;
  onPrevious: () => void;
  onNext: () => void;
  formatNumber: (num: number) => string;
  numArtificial: number;
  numSlack: number;
  isPhase1: boolean;
  steps?: IterationStep[];
}

function TableauDisplay({
  tableau,
  basicVars,
  problem,
  currentIndex,
  totalTableaus,
  onPrevious,
  onNext,
  formatNumber,
  numArtificial,
  numSlack,
  isPhase1,
  steps,
}: TableauDisplayProps) {
  // For Phase 1: tableau has constraint rows, (-f) row, (-w) row
  // For Phase 2: tableau has constraint rows, Z row
  const numConstraints = isPhase1 ? tableau.length - 2 : tableau.length - 1;
  const numVars = tableau[0].length - 1;
  
  // Get the step for this iteration (if not the initial tableau)
  const currentStep = steps && currentIndex > 0 ? steps[currentIndex - 1] : null;
  
  // Helper function to get variable name
  const getVarName = (varIdx: number): string => {
    if (varIdx < problem.numVariables) {
      return `x${varIdx + 1}`;
    } else if (varIdx < problem.numVariables + numSlack) {
      return `s${varIdx - problem.numVariables + 1}`;
    } else {
      return `a${varIdx - problem.numVariables - numSlack + 1}`;
    }
  };

  return (
    <>
      {/* Step Explanation for non-initial tableaus */}
      {currentStep && (
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="text-sm">
                <strong className="text-blue-900">Iteration {currentStep.iteration}:</strong>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-3 rounded-md">
                  <div className="text-blue-700 mb-1"><strong>1. Select Entering Variable</strong></div>
                  <div className="text-gray-700">
                    Selected <strong className="text-indigo-600">{getVarName(currentStep.enteringVar)}</strong> (most negative coefficient in objective row)
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-md">
                  <div className="text-blue-700 mb-1"><strong>2. Minimum Ratio Test</strong></div>
                  <div className="text-gray-700">
                    Leaving variable: <strong className="text-indigo-600">{getVarName(currentStep.leavingVar)}</strong><br/>
                    Minimum ratio: <strong>{formatNumber(currentStep.minRatio)}</strong>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-md col-span-1 md:col-span-2">
                  <div className="text-blue-700 mb-1"><strong>3. Pivot Operation</strong></div>
                  <div className="text-gray-700">
                    Pivot element: <strong className="text-indigo-600">{formatNumber(currentStep.pivotElement)}</strong>
                    <br/>
                    <span className="text-xs text-gray-600">
                      • Divide pivot row by pivot element to make it equal to 1<br/>
                      • Eliminate entering variable from all other rows using row operations
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Initial Tableau Info */}
      {currentIndex === 0 && (
        <Alert className="mb-4 bg-gray-50 border-gray-200">
          <Info className="h-4 w-4 text-gray-600" />
          <AlertDescription className="text-sm text-gray-700">
            <strong>Initial Tableau:</strong> The starting point with all {isPhase1 ? 'artificial' : 'slack'} variables in the basis.
            {isPhase1 && ' Phase 1 objective is to minimize the sum of artificial variables (w).'}
            {!isPhase1 && ' Look for negative values in the Z-row to determine if optimization is needed.'}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Final Tableau Info */}
      {currentIndex === totalTableaus - 1 && currentIndex > 0 && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            <strong>Optimal Solution Reached:</strong> No negative coefficients remain in the {isPhase1 ? 'w-row' : 'Z-row'}, indicating optimality.
            {isPhase1 && ' All artificial variables have been eliminated from the basis.'}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Basic</TableHead>
              {Array.from({ length: problem.numVariables }, (_, i) => (
                <TableHead key={i} className="text-center">
                  x<sub>{i + 1}</sub>
                </TableHead>
              ))}
              {Array.from({ length: numSlack }, (_, i) => (
                <TableHead key={i} className="text-center text-gray-500">
                  s<sub>{i + 1}</sub>
                </TableHead>
              ))}
              {isPhase1 && Array.from({ length: numArtificial }, (_, i) => (
                <TableHead key={i} className="text-center text-orange-600">
                  a<sub>{i + 1}</sub>
                </TableHead>
              ))}
              <TableHead className="text-center">(-f)</TableHead>
              {isPhase1 && (
                <TableHead className="text-center bg-orange-100">(-w)</TableHead>
              )}
              <TableHead className="text-center">b</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableau.slice(0, numConstraints).map((row, i) => (
              <TableRow key={i}>
                <TableCell className="text-center">
                  {basicVars[i] < problem.numVariables ? (
                    <span>x<sub>{basicVars[i] + 1}</sub></span>
                  ) : basicVars[i] < problem.numVariables + numSlack ? (
                    <span className="text-gray-500">s<sub>{basicVars[i] - problem.numVariables + 1}</sub></span>
                  ) : (
                    <span className="text-orange-600">a<sub>{basicVars[i] - problem.numVariables - numSlack + 1}</sub></span>
                  )}
                </TableCell>
                {row.map((value, j) => {
                  const isWCol = isPhase1 && j === row.length - 2; // (-w) column is second to last in Phase 1
                  const isRHS = j === row.length - 1;
                  return (
                    <React.Fragment key={j}>
                      {!isPhase1 && isRHS && (
                        <TableCell className="text-center tabular-nums bg-gray-50">
                          0
                        </TableCell>
                      )}
                      {isPhase1 && (isWCol || isRHS) ? null : (
                        <TableCell className="text-center tabular-nums">
                          {formatNumber(value)}
                        </TableCell>
                      )}
                      {!isPhase1 && isRHS && (
                        <TableCell className="text-center tabular-nums">
                          {formatNumber(value)}
                        </TableCell>
                      )}
                      {isPhase1 && isWCol && (
                        <>
                          <TableCell className="text-center tabular-nums bg-gray-50">0</TableCell>
                          <TableCell className="text-center tabular-nums bg-orange-50">
                            {formatNumber(value)}
                          </TableCell>
                        </>
                      )}
                      {isPhase1 && isRHS && (
                        <TableCell className="text-center tabular-nums">
                          {formatNumber(value)}
                        </TableCell>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableRow>
            ))}
            {/* (-f) row */}
            {isPhase1 ? (
              <TableRow className="bg-indigo-50">
                <TableCell className="text-center">(-f)</TableCell>
                {tableau[numConstraints].map((value, j) => {
                  const isWCol = j === tableau[numConstraints].length - 2;
                  const isRHS = j === tableau[numConstraints].length - 1;
                  return (
                    <React.Fragment key={j}>
                      {(isWCol || isRHS) ? null : (
                        <TableCell className="text-center tabular-nums">
                          {formatNumber(value)}
                        </TableCell>
                      )}
                      {isWCol && (
                        <>
                          <TableCell className="text-center tabular-nums bg-indigo-100">1</TableCell>
                          <TableCell className="text-center tabular-nums bg-orange-100">
                            {formatNumber(value)}
                          </TableCell>
                        </>
                      )}
                      {isRHS && (
                        <TableCell className="text-center tabular-nums">
                          {formatNumber(value)}
                        </TableCell>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableRow>
            ) : (
              <TableRow className="bg-indigo-50">
                <TableCell className="text-center">(-f)</TableCell>
                {tableau[numConstraints].map((value, j) => {
                  const isRHS = j === tableau[numConstraints].length - 1;
                  return (
                    <React.Fragment key={j}>
                      {isRHS && (
                        <TableCell className="text-center tabular-nums bg-indigo-100">
                          1
                        </TableCell>
                      )}
                      <TableCell className="text-center tabular-nums">
                        {formatNumber(value)}
                      </TableCell>
                    </React.Fragment>
                  );
                })}
              </TableRow>
            )}
            {/* (-w) row - only for Phase 1 */}
            {isPhase1 && (
              <TableRow className="bg-orange-50">
                <TableCell className="text-center">(-w)</TableCell>
                {tableau[numConstraints + 1].map((value, j) => {
                  const isWCol = j === tableau[numConstraints + 1].length - 2;
                  const isRHS = j === tableau[numConstraints + 1].length - 1;
                  return (
                    <React.Fragment key={j}>
                      {(isWCol || isRHS) ? null : (
                        <TableCell className="text-center tabular-nums">
                          {formatNumber(value)}
                        </TableCell>
                      )}
                      {isWCol && (
                        <>
                          <TableCell className="text-center tabular-nums bg-gray-50">0</TableCell>
                          <TableCell className="text-center tabular-nums bg-orange-100">
                            1
                          </TableCell>
                        </>
                      )}
                      {isRHS && (
                        <TableCell className="text-center tabular-nums">
                          {formatNumber(value)}
                        </TableCell>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <Button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        
        <span className="text-sm text-gray-600">
          {currentIndex === 0 ? 'Initial Tableau' : 
           currentIndex === totalTableaus - 1 ? 'Final Tableau' : 
           `Iteration ${currentIndex}`}
        </span>
        
        <Button
          onClick={onNext}
          disabled={currentIndex === totalTableaus - 1}
          variant="outline"
          size="sm"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </>
  );
}

// Component to explain canonical form conversion
interface CanonicalFormExplanationProps {
  canonicalFormInfo: CanonicalFormInfo;
  basicVars: number[];
  problem: SimplexProblem;
  numSlack: number;
  formatNumber: (num: number) => string;
}

function CanonicalFormExplanation({
  canonicalFormInfo,
  basicVars,
  problem,
  numSlack,
  formatNumber,
}: CanonicalFormExplanationProps) {
  // Helper function to get variable name
  const getVarName = (varIdx: number): string => {
    if (varIdx < problem.numVariables) {
      return `x${varIdx + 1}`;
    } else if (varIdx < problem.numVariables + numSlack) {
      return `s${varIdx - problem.numVariables + 1}`;
    } else {
      return `a${varIdx - problem.numVariables - numSlack + 1}`;
    }
  };

  return (
    <Card className="mb-4 bg-purple-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Calculator className="w-5 h-5" />
          Converting Z-row to Canonical Form
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-white rounded-lg">
          <p className="text-sm mb-3">
            <strong>Goal:</strong> Eliminate all basic variables from the Z-row so they have 0 coefficients.
          </p>
          
          <p className="text-sm text-gray-700 mb-2">
            <strong>Current Basic Variables:</strong>
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {basicVars.map((bv, i) => (
              <span key={i} className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded text-sm">
                Row {i + 1}: {getVarName(bv)}
              </span>
            ))}
          </div>

          {canonicalFormInfo.eliminatedVars.length > 0 ? (
            <div className="pt-3 border-t border-purple-200">
              <p className="text-sm mb-2"><strong>📝 Elimination Steps Performed:</strong></p>
              <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
                {canonicalFormInfo.eliminatedVars.map((elimVar, idx) => {
                  const varName = getVarName(elimVar.varIndex);
                  return (
                    <li key={idx}>
                      Eliminate <strong>{varName}</strong> from Z-row. Original coefficient: {formatNumber(elimVar.coefficient)}
                      <br />
                      <span className="text-indigo-600 font-mono text-xs">
                        Z_new = Z_old - ({formatNumber(elimVar.coefficient)}) × Row_{elimVar.rowIndex + 1}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <div className="pt-3 border-t border-purple-200">
              <p className="text-sm text-green-700">
                ✓ All basic variables already have 0 coefficients! Z-row is already in canonical form.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-lg">
            <p className="text-sm mb-2"><strong>Initial Z-row (before elimination):</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {Array.from({ length: problem.numVariables }, (_, i) => (
                      <th key={i} className="border p-2 bg-gray-100">
                        x<sub>{i + 1}</sub>
                      </th>
                    ))}
                    {Array.from({ length: numSlack }, (_, i) => (
                      <th key={i} className="border p-2 bg-gray-100">
                        s<sub>{i + 1}</sub>
                      </th>
                    ))}
                    <th className="border p-2 bg-gray-100">b</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {canonicalFormInfo.initialZRow.map((value, j) => (
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
            <p className="text-sm mb-2"><strong>Final Z-row (after elimination):</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {Array.from({ length: problem.numVariables }, (_, i) => (
                      <th key={i} className="border p-2 bg-indigo-100">
                        x<sub>{i + 1}</sub>
                      </th>
                    ))}
                    {Array.from({ length: numSlack }, (_, i) => (
                      <th key={i} className="border p-2 bg-indigo-100">
                        s<sub>{i + 1}</sub>
                      </th>
                    ))}
                    <th className="border p-2 bg-indigo-100">b</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {canonicalFormInfo.finalZRow.map((value, j) => (
                      <td key={j} className="border p-2 text-center tabular-nums">
                        {formatNumber(value)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            <strong>Why Canonical Form?</strong> The tableau must be in canonical form to ensure that basic variables have a coefficient of 0 in the objective row and a coefficient of 1 in their respective constraint row. This allows us to directly read the solution values and correctly apply the simplex algorithm.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}