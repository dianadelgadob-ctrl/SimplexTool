import { useState, useEffect } from 'react';
import { Plus, Trash2, Play, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import type { SimplexProblem, Constraint } from '../App';

interface SimplexInputProps {
  onSolve: (problem: SimplexProblem) => void;
  initialProblem?: SimplexProblem | null;
}

export function SimplexInput({ onSolve, initialProblem }: SimplexInputProps) {
  const [numVariables, setNumVariables] = useState(2);
  const [isMaximization, setIsMaximization] = useState(true);
  const [objectiveCoefficients, setObjectiveCoefficients] = useState<number[]>([3, 5]);
  const [constraints, setConstraints] = useState<Constraint[]>([
    { coefficients: [1, 0], operator: '<=', rhs: 4 },
    { coefficients: [0, 2], operator: '<=', rhs: 12 },
    { coefficients: [3, 2], operator: '<=', rhs: 18 },
  ]);

  // Display values for inputs (as strings to allow "-" and other intermediate states)
  const [objDisplayValues, setObjDisplayValues] = useState<string[]>(['3', '5']);
  const [constraintDisplayValues, setConstraintDisplayValues] = useState<string[][]>([
    ['1', '0'],
    ['0', '2'],
    ['3', '2'],
  ]);
  const [rhsDisplayValues, setRhsDisplayValues] = useState<string[]>(['4', '12', '18']);

  // Load initial problem if provided
  useEffect(() => {
    if (initialProblem) {
      setNumVariables(initialProblem.numVariables);
      setIsMaximization(initialProblem.isMaximization);
      setObjectiveCoefficients(initialProblem.objectiveCoefficients);
      setObjDisplayValues(initialProblem.objectiveCoefficients.map(String));
      setConstraints(initialProblem.constraints);
      setConstraintDisplayValues(
        initialProblem.constraints.map(c => c.coefficients.map(String))
      );
      setRhsDisplayValues(initialProblem.constraints.map(c => String(c.rhs)));
    }
  }, [initialProblem]);

  const handleNumVariablesChange = (num: number) => {
    setNumVariables(num);
    
    // Adjust objective coefficients
    const newObjCoeffs = [...objectiveCoefficients];
    const newObjDisplay = [...objDisplayValues];
    while (newObjCoeffs.length < num) {
      newObjCoeffs.push(0);
      newObjDisplay.push('0');
    }
    setObjectiveCoefficients(newObjCoeffs.slice(0, num));
    setObjDisplayValues(newObjDisplay.slice(0, num));
    
    // Adjust constraints
    const newConstraints = constraints.map(constraint => ({
      ...constraint,
      coefficients: (() => {
        const coeffs = [...constraint.coefficients];
        while (coeffs.length < num) {
          coeffs.push(0);
        }
        return coeffs.slice(0, num);
      })()
    }));
    
    const newConstraintDisplay = constraintDisplayValues.map(displayRow => {
      const row = [...displayRow];
      while (row.length < num) {
        row.push('0');
      }
      return row.slice(0, num);
    });
    
    setConstraints(newConstraints);
    setConstraintDisplayValues(newConstraintDisplay);
  };

  // Helper to remove leading zeros on Enter key press
  const handleEnterKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, currentValue: string, updateFn: (value: string) => void) => {
    if (e.key === 'Enter') {
      if (currentValue !== '') {
        const parsed = parseFloat(currentValue);
        if (!isNaN(parsed)) {
          // Convert to number and back to string to remove leading zeros
          updateFn(String(parsed));
        }
      }
    }
  };

  const handleObjectiveCoefficientChange = (index: number, value: string) => {
    // Update display value
    const newObjDisplay = [...objDisplayValues];
    newObjDisplay[index] = value;
    setObjDisplayValues(newObjDisplay);
    
    // Update actual numeric value
    const newCoeffs = [...objectiveCoefficients];
    if (value === '' || value === '-' || value === '.' || value === '-.') {
      // Allow intermediate states but keep previous numeric value
      // Only update to 0 if it was a valid 0
      if (value === '') {
        newCoeffs[index] = 0;
      }
    } else {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        newCoeffs[index] = parsed;
      }
    }
    setObjectiveCoefficients(newCoeffs);
  };

  const handleConstraintCoefficientChange = (constraintIdx: number, coeffIdx: number, value: string) => {
    // Update display value
    const newConstraintDisplay = [...constraintDisplayValues];
    newConstraintDisplay[constraintIdx][coeffIdx] = value;
    setConstraintDisplayValues(newConstraintDisplay);
    
    // Update actual numeric value
    const newConstraints = [...constraints];
    if (value === '' || value === '-' || value === '.' || value === '-.') {
      // Allow intermediate states
      if (value === '') {
        newConstraints[constraintIdx].coefficients[coeffIdx] = 0;
      }
    } else {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        newConstraints[constraintIdx].coefficients[coeffIdx] = parsed;
      }
    }
    setConstraints(newConstraints);
  };

  const handleConstraintOperatorChange = (constraintIdx: number, operator: '<=' | '>=' | '=') => {
    const newConstraints = [...constraints];
    newConstraints[constraintIdx].operator = operator;
    setConstraints(newConstraints);
  };

  const handleConstraintRhsChange = (constraintIdx: number, value: string) => {
    // Update display value
    const newRhsDisplay = [...rhsDisplayValues];
    newRhsDisplay[constraintIdx] = value;
    setRhsDisplayValues(newRhsDisplay);
    
    // Update actual numeric value
    const newConstraints = [...constraints];
    if (value === '' || value === '-' || value === '.' || value === '-.') {
      // Allow intermediate states
      if (value === '') {
        newConstraints[constraintIdx].rhs = 0;
      }
    } else {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        newConstraints[constraintIdx].rhs = parsed;
      }
    }
    setConstraints(newConstraints);
  };

  const addConstraint = () => {
    setConstraints([
      ...constraints,
      { coefficients: new Array(numVariables).fill(0), operator: '<=', rhs: 0 }
    ]);
    setConstraintDisplayValues([
      ...constraintDisplayValues,
      new Array(numVariables).fill('0')
    ]);
    setRhsDisplayValues([
      ...rhsDisplayValues,
      '0'
    ]);
  };

  const removeConstraint = (index: number) => {
    setConstraints(constraints.filter((_, i) => i !== index));
    setConstraintDisplayValues(constraintDisplayValues.filter((_, i) => i !== index));
    setRhsDisplayValues(rhsDisplayValues.filter((_, i) => i !== index));
  };

  const handleSolve = () => {
    const problem: SimplexProblem = {
      objectiveCoefficients,
      constraints,
      isMaximization,
      numVariables
    };
    onSolve(problem);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="numVariables">Number of Variables</Label>
          <Select
            value={numVariables.toString()}
            onValueChange={(val) => handleNumVariablesChange(parseInt(val))}
          >
            <SelectTrigger id="numVariables" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5, 6].map(num => (
                <SelectItem key={num} value={num.toString()}>
                  {num} variables
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-3 block">Optimization Type</Label>
          <RadioGroup
            value={isMaximization ? 'max' : 'min'}
            onValueChange={(val) => setIsMaximization(val === 'max')}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="max" id="max" className="peer sr-only" />
              <Label 
                htmlFor="max" 
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 bg-white cursor-pointer transition-all hover:border-green-300 hover:shadow-md peer-data-[state=checked]:border-green-600 peer-data-[state=checked]:bg-green-50 peer-data-[state=checked]:shadow-lg"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 peer-data-[state=checked]:bg-green-600">
                  <TrendingUp className="w-5 h-5 text-green-600 peer-data-[state=checked]:text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Maximize</div>
                  <div className="text-xs text-gray-600 mt-0.5">Find the maximum value</div>
                </div>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="min" id="min" className="peer sr-only" />
              <Label 
                htmlFor="min" 
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 bg-white cursor-pointer transition-all hover:border-blue-300 hover:shadow-md peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:shadow-lg"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 peer-data-[state=checked]:bg-blue-600">
                  <TrendingDown className="w-5 h-5 text-blue-600 peer-data-[state=checked]:text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Minimize</div>
                  <div className="text-xs text-gray-600 mt-0.5">Find the minimum value</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label>Objective Function</Label>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-600">{isMaximization ? 'Maximize' : 'Minimize'} Z =</span>
          {objectiveCoefficients.map((coeff, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && <span className="text-gray-400">+</span>}
              <Input
                type="number"
                value={objDisplayValues[index]}
                onChange={(e) => handleObjectiveCoefficientChange(index, e.target.value)}
                onKeyDown={(e) => handleEnterKeyPress(e, objDisplayValues[index], (val) => handleObjectiveCoefficientChange(index, val))}
                className="w-20"
                step="0.1"
              />
              <span className="text-gray-600">x<sub>{index + 1}</sub></span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Constraints</Label>
          <Button onClick={addConstraint} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add Constraint
          </Button>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Checkbox 
            id="non-negative" 
            checked={true} 
            disabled 
            className="mt-0.5"
          />
          <div className="flex-1">
            <label 
              htmlFor="non-negative" 
              className="text-sm text-gray-700 cursor-default"
            >
              All variables are non-negative (x₁, x₂, x₃, ... ≥ 0)
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Note: This tool cannot handle unrestricted variables
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {constraints.map((constraint, cIdx) => (
            <div key={cIdx} className="flex items-center gap-3 flex-wrap p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-semibold text-sm flex-shrink-0">
                {cIdx + 1}
              </div>
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {constraint.coefficients.map((coeff, vIdx) => (
                  <div key={vIdx} className="flex items-center gap-1">
                    {vIdx > 0 && <span className="text-gray-400">+</span>}
                    <Input
                      type="number"
                      value={constraintDisplayValues[cIdx][vIdx]}
                      onChange={(e) => handleConstraintCoefficientChange(cIdx, vIdx, e.target.value)}
                      onKeyDown={(e) => handleEnterKeyPress(e, constraintDisplayValues[cIdx][vIdx], (val) => handleConstraintCoefficientChange(cIdx, vIdx, val))}
                      className="w-20"
                      step="0.1"
                    />
                    <span className="text-gray-600">x<sub>{vIdx + 1}</sub></span>
                  </div>
                ))}
                
                <Select
                  value={constraint.operator}
                  onValueChange={(val) => handleConstraintOperatorChange(cIdx, val as '<=' | '>=' | '=')}
                >
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<=">≤</SelectItem>
                    <SelectItem value=">=">≥</SelectItem>
                    <SelectItem value="=">=</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  type="number"
                  value={rhsDisplayValues[cIdx]}
                  onChange={(e) => handleConstraintRhsChange(cIdx, e.target.value)}
                  onKeyDown={(e) => handleEnterKeyPress(e, rhsDisplayValues[cIdx], (val) => handleConstraintRhsChange(cIdx, val))}
                  className="w-20"
                  step="0.1"
                />
              </div>
              
              <Button
                onClick={() => removeConstraint(cIdx)}
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {constraints.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No constraints added. Click "Add Constraint" to begin.
          </div>
        )}
      </div>

      <Separator />

      <Button onClick={handleSolve} className="w-full" size="lg">
        <Play className="w-4 h-4 mr-2" />
        Solve with Simplex Method
      </Button>
    </div>
  );
}