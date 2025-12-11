import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Play, TrendingUp, TrendingDown, Library, Upload, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';
import type { SimplexProblem, Constraint } from '../App';
import { PROBLEM_LIBRARY, CATEGORY_LABELS } from '../lib/problemLibrary';

interface SimplexInputProps {
  onSolve: (problem: SimplexProblem) => void;
  onLoadProgress?: (problem: SimplexProblem, progressState: any) => void;
  initialProblem?: SimplexProblem | null;
}

export function SimplexInput({ onSolve, onLoadProgress, initialProblem }: SimplexInputProps) {
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
  
  // File input ref for loading from JSON
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State to track when starting solve for green highlight
  const [isStartingSolve, setIsStartingSolve] = useState(false);

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
    setIsStartingSolve(true);
    setTimeout(() => setIsStartingSolve(false), 1000); // Reset after 1 second
  };

  const loadProblem = (problem: SimplexProblem) => {
    setNumVariables(problem.numVariables);
    setIsMaximization(problem.isMaximization);
    setObjectiveCoefficients(problem.objectiveCoefficients);
    setObjDisplayValues(problem.objectiveCoefficients.map(String));
    setConstraints(problem.constraints);
    setConstraintDisplayValues(
      problem.constraints.map(c => c.coefficients.map(String))
    );
    setRhsDisplayValues(problem.constraints.map(c => String(c.rhs)));
  };

  const handleLoadFromLibrary = (problemId: string) => {
    if (problemId === '') return;
    
    const savedProblem = PROBLEM_LIBRARY.find(p => p.id === problemId);
    if (savedProblem) {
      loadProblem(savedProblem.problem);
      toast.success(`Loaded: ${savedProblem.name}`, {
        description: savedProblem.description,
      });
    }
  };

  const handleLoadFromFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate the file format
        if (!data.problem || !data.problem.objectiveCoefficients || !data.problem.constraints) {
          toast.error('Invalid file format', {
            description: 'The file does not contain a valid problem definition.',
          });
          return;
        }

        // Check if this is a saved progress file (contains state)
        if (data.state && onLoadProgress) {
          // This is a progress file with saved state
          loadProblem(data.problem); // Load the problem into the input form
          onLoadProgress(data.problem, data.state); // Pass progress to parent
          toast.success('Progress loaded successfully', {
            description: `Loaded saved progress from ${file.name}. The problem is loaded. Switch to Interactive Solve to continue.`,
          });
        } else {
          // This is just a problem definition file
          loadProblem(data.problem);
          toast.success('Problem loaded successfully', {
            description: `Loaded from ${file.name}`,
          });
        }
      } catch (error) {
        toast.error('Error loading file', {
          description: 'The file could not be parsed. Please check the format.',
        });
      }
    };

    reader.readAsText(file);
    
    // Reset the input so the same file can be loaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProblem = () => {
    const problem: SimplexProblem = {
      objectiveCoefficients,
      constraints,
      isMaximization,
      numVariables
    };

    const saveData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      problem,
    };

    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simplex-problem-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Problem saved', {
      description: 'Problem definition downloaded as JSON file',
    });
  };

  return (
    <div className="space-y-6">
      {/* Load Problem Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Library className="w-5 h-5 text-indigo-600" />
          <Label className="text-indigo-900">Load Example Problem</Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Select onValueChange={handleLoadFromLibrary} value="">
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Choose from library..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
                  const problems = PROBLEM_LIBRARY.filter(p => p.category === category);
                  if (problems.length === 0) return null;
                  
                  return (
                    <SelectGroup key={category}>
                      <SelectLabel>{label}</SelectLabel>
                      {problems.map(problem => (
                        <SelectItem key={problem.id} value={problem.id}>
                          <div className="flex flex-col">
                            <span>{problem.name}</span>
                            <span className="text-xs text-gray-500">{problem.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Button 
              onClick={handleLoadFromFile} 
              variant="outline" 
              className="w-full bg-white hover:bg-indigo-50 border-indigo-300"
            >
              <Upload className="w-4 h-4 mr-2" />
              Load from JSON File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
        
        <p className="text-xs text-gray-600 mt-2">
          Start with an example problem or load a previously saved problem from a JSON file
        </p>
      </div>

      <Separator />

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Button 
          onClick={handleSaveProblem} 
          variant="outline" 
          size="lg"
          className="md:col-span-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Save Problem
        </Button>
        <Button 
          onClick={handleSolve} 
          className={`md:col-span-3 ${isMaximization ? 'highlight-next-step' : 'highlight-blue-step'}`} 
          size="lg"
        >
          <Play className="w-4 h-4 mr-2" />
          Solve with Simplex Method
        </Button>
      </div>
    </div>
  );
}