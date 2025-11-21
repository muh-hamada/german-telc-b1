const fs = require('fs');

/**
 * Analyzes the A2 vocabulary JSON file for quality issues
 * @param {string} filePath - Path to the vocabulary JSON file
 * @param {string} outputFile - Path to write the detailed analysis report
 */
function analyzeVocabulary(filePath, outputFile = 'b1-vocabulary-analysis.txt') {
    console.log('Reading vocabulary file...');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Prepare the report
    let report = [];
    
    const addLine = (line = '') => report.push(line);
    const addSection = (title) => {
        addLine();
        addLine('='.repeat(80));
        addLine(title);
        addLine('='.repeat(80));
        addLine();
    };
    
    addSection(`A2 VOCABULARY ANALYSIS REPORT - ${new Date().toISOString()}`);
    addLine(`Source file: ${filePath}`);
    addLine(`Total entries: ${data.length}`);
    
    // 1. Find duplicates based on "word" key
    addSection('1. DUPLICATE WORDS ANALYSIS');
    
    const wordMap = new Map();
    const duplicates = [];
    
    data.forEach((entry, index) => {
        const word = entry.word;
        if (wordMap.has(word)) {
            wordMap.get(word).push(index);
        } else {
            wordMap.set(word, [index]);
        }
    });
    
    wordMap.forEach((indices, word) => {
        if (indices.length > 1) {
            duplicates.push({
                word,
                count: indices.length,
                indices,
                entries: indices.map(idx => data[idx])
            });
        }
    });
    
    addLine(`Found ${duplicates.length} duplicate words`);
    addLine();
    
    if (duplicates.length > 0) {
        addLine('Complete list of all duplicate words:');
        addLine('-'.repeat(80));
        
        duplicates.forEach((dup, idx) => {
            addLine();
            addLine(`${idx + 1}. Word: "${dup.word}" (appears ${dup.count} times)`);
            addLine(`   Indices: ${dup.indices.join(', ')}`);
            
            dup.entries.forEach((entry, entryIdx) => {
                const wordDisplay = entry.article ? `${entry.article} ${entry.word}` : entry.word;
                addLine(`   [${dup.indices[entryIdx]}] ${wordDisplay} (${entry.type})`);
                addLine(`       Sentences: ${entry.exampleSentences?.length || 0}`);
                
                if (entry.exampleSentences && entry.exampleSentences.length > 0) {
                    entry.exampleSentences.forEach((sent, sentIdx) => {
                        const preview = sent.text.length > 60 
                            ? sent.text.substring(0, 60) + '...' 
                            : sent.text;
                        addLine(`       ${sentIdx + 1}. ${preview}`);
                    });
                }
            });
        });
    } else {
        addLine('No duplicate words found.');
    }
    
    // 2. Find entries without any sentences
    addSection('2. ENTRIES WITHOUT SENTENCES');
    
    const noSentences = [];
    data.forEach((entry, index) => {
        if (!entry.exampleSentences || entry.exampleSentences.length === 0) {
            noSentences.push({
                word: entry.word,
                article: entry.article,
                type: entry.type,
                index
            });
        }
    });
    
    addLine(`Found ${noSentences.length} entries without any sentences`);
    addLine();
    
    if (noSentences.length > 0) {
        addLine('Complete list of entries without sentences:');
        addLine('-'.repeat(80));
        
        noSentences.forEach((entry, idx) => {
            const wordDisplay = entry.article ? `${entry.article} ${entry.word}` : entry.word;
            addLine(`${idx + 1}. [Index ${entry.index}] ${wordDisplay} (${entry.type})`);
        });
    } else {
        addLine('All entries have at least one sentence.');
    }
    
    // 3. Find entries with empty sentences
    addSection('3. ENTRIES WITH EMPTY SENTENCES');
    
    const emptySentences = [];
    
    data.forEach((entry, index) => {
        if (entry.exampleSentences && entry.exampleSentences.length > 0) {
            const emptyOnes = entry.exampleSentences
                .map((s, sIdx) => ({ text: s.text, index: sIdx }))
                .filter(s => !s.text || s.text.trim().length === 0);
            
            if (emptyOnes.length > 0) {
                emptySentences.push({
                    word: entry.word,
                    article: entry.article,
                    type: entry.type,
                    index,
                    emptyCount: emptyOnes.length,
                    totalSentences: entry.exampleSentences.length,
                    emptyIndices: emptyOnes.map(e => e.index)
                });
            }
        }
    });
    
    addLine(`Found ${emptySentences.length} entries with empty sentences`);
    addLine();
    
    if (emptySentences.length > 0) {
        addLine('Complete list of entries with empty sentences:');
        addLine('-'.repeat(80));
        
        emptySentences.forEach((entry, idx) => {
            const wordDisplay = entry.article ? `${entry.article} ${entry.word}` : entry.word;
            addLine(`${idx + 1}. [Index ${entry.index}] ${wordDisplay} (${entry.type})`);
            addLine(`   Empty: ${entry.emptyCount}/${entry.totalSentences} sentences`);
            addLine(`   Empty sentence indices: ${entry.emptyIndices.join(', ')}`);
        });
    } else {
        addLine('No entries with empty sentences found.');
    }
    
    // 4. Additional: Check for very short sentences (likely fragments)
    addSection('4. VERY SHORT SENTENCES (< 10 characters)');
    
    const shortSentences = [];
    
    data.forEach((entry, index) => {
        if (entry.exampleSentences && entry.exampleSentences.length > 0) {
            const shortOnes = entry.exampleSentences
                .map((s, sIdx) => ({ text: s.text, index: sIdx }))
                .filter(s => s.text && s.text.trim().length > 0 && s.text.trim().length < 10);
            
            if (shortOnes.length > 0) {
                shortSentences.push({
                    word: entry.word,
                    article: entry.article,
                    type: entry.type,
                    index,
                    sentences: shortOnes
                });
            }
        }
    });
    
    addLine(`Found ${shortSentences.length} entries with very short sentences`);
    addLine();
    
    if (shortSentences.length > 0) {
        addLine('Complete list of entries with short sentences:');
        addLine('-'.repeat(80));
        
        shortSentences.forEach((entry, idx) => {
            const wordDisplay = entry.article ? `${entry.article} ${entry.word}` : entry.word;
            addLine(`${idx + 1}. [Index ${entry.index}] ${wordDisplay} (${entry.type})`);
            entry.sentences.forEach(s => {
                addLine(`   [Sentence ${s.index}] "${s.text}" (${s.text.length} chars)`);
            });
        });
    } else {
        addLine('No very short sentences found.');
    }
    
    // 5. Check for entries with grammar fragments in sentences
    addSection('5. POTENTIAL GRAMMAR FRAGMENTS IN SENTENCES');
    
    const fragmentPatterns = [
        /^(hat|ist|wird|war)\s+[a-zäöüß]+,?\s+/i,
        /\s+(hat|ist)\s+[a-zäöüß]+\s+(hat|ist)\s+[a-zäöüß]+/i,
        /[a-zäöüß]+,\s+[a-zäöüß]+,\s+[A-ZÄÖÜ]/,
    ];
    
    const potentialFragments = [];
    
    data.forEach((entry, index) => {
        if (entry.exampleSentences && entry.exampleSentences.length > 0) {
            const suspicious = entry.exampleSentences
                .map((s, sIdx) => ({ text: s.text, index: sIdx }))
                .filter(s => {
                    return s.text && fragmentPatterns.some(pattern => pattern.test(s.text));
                });
            
            if (suspicious.length > 0) {
                potentialFragments.push({
                    word: entry.word,
                    article: entry.article,
                    type: entry.type,
                    index,
                    sentences: suspicious
                });
            }
        }
    });
    
    addLine(`Found ${potentialFragments.length} entries with potential grammar fragments`);
    addLine();
    
    if (potentialFragments.length > 0) {
        addLine('Entries that may contain grammar fragments (first 50):');
        addLine('-'.repeat(80));
        
        potentialFragments.slice(0, 50).forEach((entry, idx) => {
            const wordDisplay = entry.article ? `${entry.article} ${entry.word}` : entry.word;
            addLine(`${idx + 1}. [Index ${entry.index}] ${wordDisplay} (${entry.type})`);
            entry.sentences.forEach(s => {
                const preview = s.text.length > 100 ? s.text.substring(0, 100) + '...' : s.text;
                addLine(`   [Sentence ${s.index}] ${preview}`);
            });
        });
        
        if (potentialFragments.length > 50) {
            addLine(`\n... and ${potentialFragments.length - 50} more entries with potential fragments`);
        }
    } else {
        addLine('No obvious grammar fragments detected.');
    }
    
    // Summary
    addSection('SUMMARY');
    addLine(`Total entries:                    ${data.length}`);
    addLine(`Duplicate words:                  ${duplicates.length}`);
    addLine(`Entries without sentences:        ${noSentences.length}`);
    addLine(`Entries with empty sentences:     ${emptySentences.length}`);
    addLine(`Entries with short sentences:     ${shortSentences.length}`);
    addLine(`Entries with potential fragments: ${potentialFragments.length}`);
    addLine();
    
    const issuesCount = duplicates.length + noSentences.length + emptySentences.length;
    addLine(`Critical issues (duplicates, no sentences, empty): ${issuesCount}`);
    
    // Write to file
    const reportText = report.join('\n');
    fs.writeFileSync(outputFile, reportText, 'utf8');
    
    // Print summary to console
    console.log(`\nTotal entries: ${data.length}\n`);
    console.log('='.repeat(60));
    console.log('\nSUMMARY');
    console.log('-'.repeat(60));
    console.log(`Duplicate words:                  ${duplicates.length}`);
    console.log(`Entries without sentences:        ${noSentences.length}`);
    console.log(`Entries with empty sentences:     ${emptySentences.length}`);
    console.log(`Entries with short sentences:     ${shortSentences.length}`);
    console.log(`Entries with potential fragments: ${potentialFragments.length}`);
    console.log(`\nCritical issues:                  ${issuesCount}`);
    console.log(`\n✓ Detailed analysis written to: ${outputFile}`);
    
    // Return the analysis data
    return {
        totalEntries: data.length,
        duplicates,
        noSentences,
        emptySentences,
        shortSentences,
        potentialFragments
    };
}

if (require.main === module) {
    const filePath = process.argv[2] || 'b1-vocabulary-clean.json';
    const outputFile = process.argv[3] || 'b1-vocabulary-analysis.txt';
    
    try {
        const analysis = analyzeVocabulary(filePath, outputFile);
        console.log('\n✓ Analysis complete!\n');
    } catch (error) {
        console.error('✗ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

module.exports = { analyzeVocabulary };

