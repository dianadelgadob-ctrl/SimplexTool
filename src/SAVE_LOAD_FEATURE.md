# Save/Load Progress Feature

## Overview
The Simplex Method calculator now includes a comprehensive save/load feature that allows users to save their progress at any point during the interactive solving process and resume later.

## Features

### Save Progress
Users can save their current progress in two ways:

1. **Download as File** (Save button)
   - Downloads progress as a JSON file
   - File is named with the current date: `simplex-progress-YYYY-MM-DD.json`
   - Can be stored on your computer for later use

2. **Copy to Clipboard** (Copy button)
   - Copies progress data to clipboard as JSON text
   - Useful for quickly sharing or temporarily storing progress
   - Can be pasted into a text editor for manual backup

### Load Progress
Users can restore their progress in two ways:

1. **Load from File** (Load button)
   - Opens a file picker to select a previously saved progress file
   - Accepts `.json` files only
   - Restores the exact state when the file was saved

2. **Load from Clipboard** (Coming soon)
   - Paste progress data directly from clipboard
   - Useful for quickly restoring temporarily saved progress

## What Gets Saved

The save file includes:
- **Problem Definition**: Original LP problem (objective function, constraints, etc.)
- **Current State**: 
  - Current tableau and basic variables
  - Current step in the solving process
  - Iteration number
  - Selected entering/leaving variables
- **Setup Progress**:
  - Number of slack/surplus variables entered
  - Number of artificial variables entered
  - Constraint rows built so far
  - Objective row progress
- **Phase Information** (for Two-Phase Method):
  - Current phase (1 or 2)
  - Phase 1 iteration count
  - Whether Phase 1 is needed
- **User Input State**:
  - All partially entered calculations (ratios, pivot divisor, row multipliers, etc.)
  - Current constraint/row being worked on
- **History**:
  - Tableau history for export functionality
  - All previous iterations

## Use Cases

1. **Long Problems**: Save progress on complex problems that take a long time to solve
2. **Learning Sessions**: Save progress and resume your learning later
3. **Checkpoints**: Create save points before attempting difficult steps
4. **Sharing**: Share your progress with instructors or peers for help
5. **Exam Preparation**: Save example problems at various stages for review

## Technical Details

### File Format
Progress files are saved as JSON with the following structure:
```json
{
  "version": "1.0",
  "timestamp": "ISO-8601 timestamp",
  "problem": { /* SimplexProblem object */ },
  "state": { /* All component state */ }
}
```

### Compatibility
- Version 1.0 format
- Forward compatibility: Files saved with this version can be loaded in future versions
- Backward compatibility: The system validates file format before loading

### Security & Privacy
- All data is stored locally (no server upload)
- Progress files contain only mathematical data (no personal information)
- Files are human-readable JSON (can be inspected in any text editor)

## User Interface

The save/load buttons are located in the top card next to the Restart button:
- **Save** (Download icon): Download progress as file
- **Copy** (Copy icon): Copy progress to clipboard  
- **Load** (Upload icon): Load progress from file
- **Restart** (Rotate icon): Reset to beginning (existing functionality)

All buttons include tooltips explaining their function.

## Error Handling

- **Invalid File Format**: Shows error toast if file is not a valid progress file
- **Clipboard Access Denied**: Shows error toast with alternative method
- **File Read Error**: Shows error toast if file cannot be read
- **Corrupted Data**: Validates data structure before loading

## Success Notifications

- Toast notification appears when:
  - Progress is successfully saved/downloaded
  - Progress is successfully copied to clipboard
  - Progress is successfully loaded

## Future Enhancements

Potential future improvements:
- Auto-save to browser localStorage every N steps
- Multiple save slots
- Progress comparison (compare two saved states)
- Cloud sync (optional)
- Share via URL (generate shareable link)
