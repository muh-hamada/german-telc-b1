const fs = require('fs');

/**
 * Removes exact duplicate entries from the vocabulary JSON file.
 * Only removes entries where word AND all sentences match 100%.
 * @param {string} inputFile - Path to the input vocabulary JSON file
 * @param {string} outputFile - Path to write the deduplicated JSON file
 * @param {string} reportFile - Path to write the deduplication report
 */
function deduplicateVocabulary(inputFile, outputFile, reportFile = 'deduplication-report.txt') {
    console.log('Reading vocabulary file...');
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    
    console.log(`Total entries before deduplication: ${data.length}`);
    
    // Track duplicates
    const seen = new Map(); // key -> first index
    const duplicates = []; // list of duplicate entries with their indices
    const toKeep = []; // indices to keep
    
    data.forEach((entry, index) => {
        // Create a unique key based on word, article, type, and all sentences
        const key = createEntryKey(entry);
        
        if (seen.has(key)) {
            // This is a duplicate
            const firstIndex = seen.get(key);
            duplicates.push({
                firstIndex,
                duplicateIndex: index,
                entry: entry,
                key
            });
            console.log(`  Found duplicate: "${entry.word}" at index ${index} (first seen at ${firstIndex})`);
        } else {
            // First occurrence
            seen.set(key, index);
            toKeep.push(index);
        }
    });
    
    // Filter the data to keep only non-duplicates
    const cleanedData = data.filter((entry, index) => toKeep.includes(index));
    
    console.log(`\nTotal entries after deduplication: ${cleanedData.length}`);
    console.log(`Removed ${data.length - cleanedData.length} duplicate entries`);
    
    // Write cleaned data to output file
    fs.writeFileSync(outputFile, JSON.stringify(cleanedData, null, 2), 'utf8');
    console.log(`\n✓ Cleaned data written to: ${outputFile}`);
    
    // Generate detailed report
    generateReport(data, cleanedData, duplicates, reportFile);
    console.log(`✓ Deduplication report written to: ${reportFile}`);
    
    return {
        originalCount: data.length,
        cleanedCount: cleanedData.length,
        removedCount: data.length - cleanedData.length,
        duplicates
    };
}

/**
 * Creates a unique key for an entry based on its content
 * @param {Object} entry - The vocabulary entry
 * @returns {string} A unique key
 */
function createEntryKey(entry) {
    // Sort sentences to ensure consistent comparison
    const sentences = (entry.exampleSentences || [])
        .map(s => s.text.trim())
        .sort()
        .join('|||');
    
    return JSON.stringify({
        word: entry.word,
        article: entry.article || '',
        type: entry.type,
        sentences
    });
}

/**
 * Generates a detailed deduplication report
 */
function generateReport(originalData, cleanedData, duplicates, reportFile) {
    const report = [];
    const addLine = (line = '') => report.push(line);
    
    addLine('='.repeat(80));
    addLine(`DEDUPLICATION REPORT - ${new Date().toISOString()}`);
    addLine('='.repeat(80));
    addLine();
    
    addLine('SUMMARY');
    addLine('-'.repeat(80));
    addLine(`Original entries:      ${originalData.length}`);
    addLine(`Cleaned entries:       ${cleanedData.length}`);
    addLine(`Removed duplicates:    ${originalData.length - cleanedData.length}`);
    addLine();
    
    if (duplicates.length === 0) {
        addLine('No exact duplicates found.');
    } else {
        addLine('REMOVED DUPLICATES');
        addLine('-'.repeat(80));
        addLine(`Found ${duplicates.length} exact duplicate(s)`);
        addLine();
        
        // Group duplicates by word
        const groupedDuplicates = new Map();
        duplicates.forEach(dup => {
            const word = dup.entry.word;
            if (!groupedDuplicates.has(word)) {
                groupedDuplicates.set(word, []);
            }
            groupedDuplicates.get(word).push(dup);
        });
        
        let counter = 1;
        groupedDuplicates.forEach((dups, word) => {
            addLine(`${counter}. Word: "${word}"`);
            addLine(`   Occurrences: ${dups.length + 1} (kept 1, removed ${dups.length})`);
            addLine();
            
            // Show the entry that was kept
            const firstDup = dups[0];
            const keptEntry = originalData[firstDup.firstIndex];
            const wordDisplay = keptEntry.article 
                ? `${keptEntry.article} ${keptEntry.word}` 
                : keptEntry.word;
            
            addLine(`   KEPT: [Index ${firstDup.firstIndex}] ${wordDisplay} (${keptEntry.type})`);
            addLine(`   Sentences: ${keptEntry.exampleSentences?.length || 0}`);
            if (keptEntry.exampleSentences && keptEntry.exampleSentences.length > 0) {
                keptEntry.exampleSentences.forEach((sent, idx) => {
                    const preview = sent.text.length > 70 
                        ? sent.text.substring(0, 70) + '...' 
                        : sent.text;
                    addLine(`     ${idx + 1}. ${preview}`);
                });
            }
            addLine();
            
            // Show removed duplicates
            dups.forEach((dup, idx) => {
                addLine(`   REMOVED: [Index ${dup.duplicateIndex}] (duplicate of index ${dup.firstIndex})`);
            });
            addLine();
            
            counter++;
        });
    }
    
    addLine();
    addLine('='.repeat(80));
    addLine('VERIFICATION');
    addLine('='.repeat(80));
    addLine();
    addLine('The following words appear multiple times in the cleaned data:');
    addLine('(These are NOT exact duplicates - they differ in sentences or other fields)');
    addLine('-'.repeat(80));
    
    // Check for remaining duplicates (by word only)
    const wordCount = new Map();
    cleanedData.forEach((entry, index) => {
        const word = entry.word;
        if (!wordCount.has(word)) {
            wordCount.set(word, []);
        }
        wordCount.get(word).push(index);
    });
    
    const remainingDups = [];
    wordCount.forEach((indices, word) => {
        if (indices.length > 1) {
            remainingDups.push({ word, count: indices.length, indices });
        }
    });
    
    if (remainingDups.length === 0) {
        addLine('None - all words are now unique!');
    } else {
        addLine(`Found ${remainingDups.length} word(s) that still appear multiple times:`);
        addLine();
        remainingDups.forEach((dup, idx) => {
            addLine(`${idx + 1}. "${dup.word}" appears ${dup.count} times at indices: ${dup.indices.join(', ')}`);
            // Show differences
            const entries = dup.indices.map(i => cleanedData[i]);
            entries.forEach((entry, entryIdx) => {
                const wordDisplay = entry.article 
                    ? `${entry.article} ${entry.word}` 
                    : entry.word;
                addLine(`   [${dup.indices[entryIdx]}] ${wordDisplay} (${entry.type}) - ${entry.exampleSentences?.length || 0} sentence(s)`);
            });
            addLine();
        });
    }
    
    // Write report to file
    fs.writeFileSync(reportFile, report.join('\n'), 'utf8');
}

if (require.main === module) {
    const inputFile = process.argv[2] || 'b1-vocabulary.json';
    const outputFile = process.argv[3] || 'b1-vocabulary-clean.json';
    const reportFile = process.argv[4] || 'deduplication-report.txt';
    
    console.log('='.repeat(60));
    console.log('B1 VOCABULARY DEDUPLICATION');
    console.log('='.repeat(60));
    console.log(`Input:  ${inputFile}`);
    console.log(`Output: ${outputFile}`);
    console.log(`Report: ${reportFile}`);
    console.log();
    
    try {
        const result = deduplicateVocabulary(inputFile, outputFile, reportFile);
        
        console.log('\n' + '='.repeat(60));
        console.log('DEDUPLICATION COMPLETE');
        console.log('='.repeat(60));
        console.log(`Original:  ${result.originalCount} entries`);
        console.log(`Cleaned:   ${result.cleanedCount} entries`);
        console.log(`Removed:   ${result.removedCount} duplicates`);
        console.log();
        console.log('✓ Deduplication complete!\n');
    } catch (error) {
        console.error('\n✗ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

module.exports = { deduplicateVocabulary };

