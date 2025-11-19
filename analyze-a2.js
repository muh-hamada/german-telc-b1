const fs = require('fs');

/**
 * Analyzes the A2 vocabulary JSON file for quality issues
 */
function analyzeVocabulary(filePath) {
    console.log('Reading vocabulary file...');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    console.log(`\nTotal entries: ${data.length}\n`);
    console.log('='.repeat(60));
    
    // 1. Find duplicates based on "word" key
    console.log('\n1. DUPLICATE WORDS ANALYSIS');
    console.log('-'.repeat(60));
    
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
                indices
            });
        }
    });
    
    console.log(`Found ${duplicates.length} duplicate words`);
    
    if (duplicates.length > 0) {
        console.log('\nDuplicate words (showing first 20):');
        duplicates.slice(0, 20).forEach(dup => {
            console.log(`  - "${dup.word}" appears ${dup.count} times at indices: ${dup.indices.join(', ')}`);
        });
        
        if (duplicates.length > 20) {
            console.log(`  ... and ${duplicates.length - 20} more duplicates`);
        }
    }
    
    // 2. Find entries without any sentences
    console.log('\n\n2. ENTRIES WITHOUT SENTENCES');
    console.log('-'.repeat(60));
    
    const noSentences = data.filter((entry, index) => {
        return !entry.exampleSentences || entry.exampleSentences.length === 0;
    }).map((entry, idx, arr) => {
        const originalIndex = data.indexOf(entry);
        return { word: entry.word, article: entry.article, index: originalIndex };
    });
    
    console.log(`Found ${noSentences.length} entries without any sentences`);
    
    if (noSentences.length > 0) {
        console.log('\nEntries without sentences (showing first 20):');
        noSentences.slice(0, 20).forEach(entry => {
            const wordDisplay = entry.article ? `${entry.article} ${entry.word}` : entry.word;
            console.log(`  [${entry.index}] ${wordDisplay}`);
        });
        
        if (noSentences.length > 20) {
            console.log(`  ... and ${noSentences.length - 20} more entries`);
        }
    }
    
    // 3. Find entries with empty sentences
    console.log('\n\n3. ENTRIES WITH EMPTY SENTENCES');
    console.log('-'.repeat(60));
    
    const emptySentences = [];
    
    data.forEach((entry, index) => {
        if (entry.exampleSentences && entry.exampleSentences.length > 0) {
            const emptyOnes = entry.exampleSentences.filter(s => {
                return !s.text || s.text.trim().length === 0;
            });
            
            if (emptyOnes.length > 0) {
                emptySentences.push({
                    word: entry.word,
                    article: entry.article,
                    index,
                    emptyCount: emptyOnes.length,
                    totalSentences: entry.exampleSentences.length
                });
            }
        }
    });
    
    console.log(`Found ${emptySentences.length} entries with empty sentences`);
    
    if (emptySentences.length > 0) {
        console.log('\nEntries with empty sentences (showing first 20):');
        emptySentences.slice(0, 20).forEach(entry => {
            const wordDisplay = entry.article ? `${entry.article} ${entry.word}` : entry.word;
            console.log(`  [${entry.index}] ${wordDisplay} - ${entry.emptyCount}/${entry.totalSentences} empty`);
        });
        
        if (emptySentences.length > 20) {
            console.log(`  ... and ${emptySentences.length - 20} more entries`);
        }
    }
    
    // 4. Additional: Check for very short sentences (likely fragments)
    console.log('\n\n4. ADDITIONAL: VERY SHORT SENTENCES (< 10 chars)');
    console.log('-'.repeat(60));
    
    const shortSentences = [];
    
    data.forEach((entry, index) => {
        if (entry.exampleSentences && entry.exampleSentences.length > 0) {
            const shortOnes = entry.exampleSentences.filter(s => {
                return s.text && s.text.trim().length > 0 && s.text.trim().length < 10;
            });
            
            if (shortOnes.length > 0) {
                shortSentences.push({
                    word: entry.word,
                    article: entry.article,
                    index,
                    sentences: shortOnes.map(s => s.text)
                });
            }
        }
    });
    
    console.log(`Found ${shortSentences.length} entries with very short sentences`);
    
    if (shortSentences.length > 0) {
        console.log('\nEntries with short sentences (showing first 10):');
        shortSentences.slice(0, 10).forEach(entry => {
            const wordDisplay = entry.article ? `${entry.article} ${entry.word}` : entry.word;
            console.log(`  [${entry.index}] ${wordDisplay}:`);
            entry.sentences.forEach(s => console.log(`    - "${s}"`));
        });
        
        if (shortSentences.length > 10) {
            console.log(`  ... and ${shortSentences.length - 10} more entries`);
        }
    }
    
    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total entries:              ${data.length}`);
    console.log(`Duplicate words:            ${duplicates.length}`);
    console.log(`Entries without sentences:  ${noSentences.length}`);
    console.log(`Entries with empty sentences: ${emptySentences.length}`);
    console.log(`Entries with short sentences: ${shortSentences.length}`);
    
    const issuesCount = duplicates.length + noSentences.length + emptySentences.length;
    console.log(`\nTotal issues found:         ${issuesCount}`);
    
    // Return the analysis data
    return {
        totalEntries: data.length,
        duplicates,
        noSentences,
        emptySentences,
        shortSentences
    };
}

if (require.main === module) {
    const filePath = process.argv[2] || 'a2-vocabulary.json';
    
    try {
        const analysis = analyzeVocabulary(filePath);
        console.log('\n✓ Analysis complete!\n');
    } catch (error) {
        console.error('✗ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

module.exports = { analyzeVocabulary };

