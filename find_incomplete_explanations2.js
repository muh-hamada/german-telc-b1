const fs = require('fs');

// Read the file line by line to handle JSON syntax issues
const fileContent = fs.readFileSync('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'utf8');
const lines = fileContent.split('\n');

// Track incomplete explanation objects
const incomplete = [];
let inExplanation = false;
let explanationLines = [];
let explanationStartLine = -1;
let contextBefore = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('"explanation": {')) {
    inExplanation = true;
    explanationStartLine = i;
    explanationLines = [line];
    contextBefore = [];
    // Get context before (previous 5 lines)
    for (let j = Math.max(0, i - 5); j < i; j++) {
      contextBefore.push({lineNum: j + 1, text: lines[j]});
    }
  } else if (inExplanation) {
    explanationLines.push(line);
    if (line.trim() === '}' || line.trim() === '},') {
      // End of explanation object
      inExplanation = false;
      
      // Analyze the explanation
      const explanationText = explanationLines.join('\n');
      const hasDe = explanationText.includes('"de":');
      const hasAr = explanationText.includes('"ar":');
      const hasEn = explanationText.includes('"en":');
      const hasFr = explanationText.includes('"Fr":');
      const hasRu = explanationText.includes('"ru":');
      const hasEs = explanationText.includes('"es":');
      
      const missing = [];
      if (!hasDe) missing.push('de');
      if (!hasAr) missing.push('ar');
      if (!hasEn) missing.push('en');
      if (!hasFr) missing.push('Fr');
      if (!hasRu) missing.push('ru');
      if (!hasEs) missing.push('es');
      
      if (missing.length > 0) {
        // Extract existing translations
        const translations = {};
        const langPattern = /"(de|ar|en|Fr|ru|es)": "([^"]*)"/g;
        let match;
        while ((match = langPattern.exec(explanationText)) !== null) {
          translations[match[1]] = match[2];
        }
        
        incomplete.push({
          startLine: explanationStartLine + 1,
          endLine: i + 1,
          missing,
          existing: Object.keys(translations),
          translations,
          contextBefore,
          explanationLines: explanationLines.map((l, idx) => ({
            lineNum: explanationStartLine + idx + 1,
            text: l
          }))
        });
      }
      
      explanationLines = [];
    }
  }
}

console.log(`Found ${incomplete.length} incomplete explanation objects:\n`);
incomplete.forEach((item, index) => {
  console.log(`${index + 1}. Lines ${item.startLine}-${item.endLine}`);
  console.log(`   Missing: ${item.missing.join(', ')}`);
  console.log(`   Existing translations (${item.existing.join(', ')}):`, JSON.stringify(item.translations, null, 2));
  console.log(`   Context before:`);
  item.contextBefore.forEach(ctx => {
    console.log(`     Line ${ctx.lineNum}: ${ctx.text.trim()}`);
  });
  console.log('');
});

// Write results to JSON
fs.writeFileSync(
  '/Users/mham/projects/german-telc-b1/incomplete_explanations.json',
  JSON.stringify(incomplete, null, 2)
);

console.log(`\nResults written to incomplete_explanations.json`);

