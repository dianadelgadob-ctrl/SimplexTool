# How to Save and Resume Your Progress

## Quick Start

### Saving Your Progress

**Option 1: Download as File (Recommended)**
1. Click the **Save** button at the top of the page (next to Restart)
2. A file will be downloaded to your computer named `simplex-progress-YYYY-MM-DD.json`
3. Keep this file safe - you'll need it to resume later

**Option 2: Copy to Clipboard**
1. Click the **Copy** button at the top of the page
2. Your progress is now in your clipboard as text
3. Paste it into a text file (Notepad, TextEdit, etc.) and save it for later
4. Or share it directly with someone to show your work

### Resuming Your Progress

**Loading from File**
1. Click the **Load** button at the top of the page
2. Select the `.json` file you saved earlier
3. Your progress will be restored exactly where you left off
4. You'll see a success message when loading is complete

**Loading from Clipboard**
1. Copy the JSON text from wherever you saved it (text file, email, etc.)
2. Click the **Load** button
3. The system will attempt to read from your clipboard
4. Your progress will be restored

## Example Workflow

**Scenario 1: Study Session**
1. Start solving a problem in interactive mode
2. Complete the setup phase and do a few iterations
3. Need to stop? Click **Save** to download your progress
4. Later: Click **Load** and select your saved file
5. Continue exactly where you left off!

**Scenario 2: Getting Help**
1. Working on a problem but stuck on a step
2. Click **Copy** to copy your progress
3. Paste it into an email or chat to your instructor/tutor
4. They can **Load** your exact state and see where you're stuck

**Scenario 3: Practice Problems**
1. Solve a problem to a specific checkpoint (e.g., end of Phase 1)
2. Click **Save** to create a checkpoint
3. Try different approaches from that point
4. Can always **Load** the checkpoint to try again

## Tips

✅ **DO:**
- Save frequently on complex problems
- Keep multiple save files for different problems
- Name your files descriptively (e.g., rename to "problem-5-phase1-complete.json")
- Test that you can load a file shortly after saving it

❌ **DON'T:**
- Don't edit the JSON file manually (it will become invalid)
- Don't delete the file until you've finished the problem
- Don't share files publicly if they contain assignment work (academic integrity)

## Troubleshooting

**Problem: "Failed to load progress" error**
- Make sure the file is a valid `.json` file from this tool
- Check that the file hasn't been edited or corrupted
- Try the "Copy" method instead if file loading isn't working

**Problem: "Failed to copy progress" error**  
- Your browser may not support clipboard access
- Use the "Save" method to download a file instead
- Check your browser's clipboard permissions

**Problem: Downloaded file can't be found**
- Check your browser's Downloads folder
- The file is named `simplex-progress-` followed by today's date
- Look for files with `.json` extension

**Problem: Progress loaded but looks wrong**
- Make sure you loaded the correct file
- The file may be from a different problem
- Try clicking **Restart** and start fresh if needed

## What Gets Saved?

Everything you need to continue:
- The original problem (objective, constraints, operators)
- Where you are in the solving process (which step)
- All your entered values (slack vars, constraint rows, tableau, etc.)
- Your iteration count and which phase you're in
- Any calculations in progress

## Privacy & Safety

- All data stays on your computer (nothing is uploaded to a server)
- Progress files only contain mathematical data
- Safe to store in cloud storage (Dropbox, Google Drive, etc.)
- Safe to email to instructors or study partners

## Browser Compatibility

**Fully Supported:**
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

**Note:** Clipboard features may require user permission in some browsers.
