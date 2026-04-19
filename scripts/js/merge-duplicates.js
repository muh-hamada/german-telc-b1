const fs = require('fs');

/**
 * Merges duplicate word entries by combining their example sentences.
 * If the same word appears multiple times, all unique sentences are combined into one entry.
 * @param {string} inputFile - Path to the input vocabulary JSON file
 * @param {string} outputFile - Path to write the merged JSON file
 * @param {string} reportFile - Path to write the merge report
 */
function mergeDuplicateWords(inputFile, outputFile, reportFile = 'merge-report.txt') {
    console.log('Reading vocabulary file...');
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    
    console.log(`Total entries before merging: ${data.length}`);
    
    // Group entries by word+article+type
    const wordGroups = new Map();
    
    data.forEach((entry, index) => {
        // Create a key based on word, article, and type (NOT sentences)
        const key = createWordKey(entry);
        
        if (!wordGroups.has(key)) {
            wordGroups.set(key, []);
        }
        
        wordGroups.get(key).push({
            entry,
            originalIndex: index
        });
    });
    
    console.log(`Found ${wordGroups.size} unique words`);
    
    // Merge entries with the same word but different sentences
    const mergedData = [];
    const mergeLog = [];
    let totalMerged = 0;
    
    wordGroups.forEach((group, key) => {
        if (group.length === 1) {
            // Only one entry for this word, keep as is
            mergedData.push(group[0].entry);
        } else {
            // Multiple entries for this word - merge them
            console.log(`  Merging ${group.length} entries for: "${group[0].entry.word}"`);
            
            const mergedEntry = mergeEntries(group);
            mergedData.push(mergedEntry);
            
            totalMerged += group.length - 1; // Count how many duplicates were merged
            
            mergeLog.push({
                word: mergedEntry.word,
                article: mergedEntry.article,
                type: mergedEntry.type,
                originalCount: group.length,
                originalIndices: group.map(g => g.originalIndex),
                totalSentences: mergedEntry.exampleSentences.length,
                entries: group.map(g => ({
                    index: g.originalIndex,
                    sentenceCount: g.entry.exampleSentences?.length || 0,
                    sentences: g.entry.exampleSentences || []
                }))
            });
        }
    });
    
    console.log(`\nTotal entries after merging: ${mergedData.length}`);
    console.log(`Merged ${totalMerged} duplicate word entries`);
    
    // Write merged data to output file
    fs.writeFileSync(outputFile, JSON.stringify(mergedData, null, 2), 'utf8');
    console.log(`\n✓ Merged data written to: ${outputFile}`);
    
    // Generate detailed report
    generateMergeReport(data, mergedData, mergeLog, reportFile);
    console.log(`✓ Merge report written to: ${reportFile}`);
    
    return {
        originalCount: data.length,
        mergedCount: mergedData.length,
        reducedBy: data.length - mergedData.length,
        mergeLog
    };
}

/**
 * Creates a unique key for a word (WITHOUT sentences)
 * @param {Object} entry - The vocabulary entry
 * @returns {string} A unique key based on word, article, and type only
 */
function createWordKey(entry) {
    return JSON.stringify({
        word: entry.word.trim(),
        article: (entry.article || '').trim(),
        type: entry.type
    });
}

/**
 * Merges multiple entries of the same word into one
 * Combines all unique sentences and preserves other fields
 */
function mergeEntries(group) {
    // Use the first entry as the base
    const baseEntry = { ...group[0].entry };
    
    // Collect all sentences from all entries
    const allSentences = [];
    const seenSentences = new Set();
    
    group.forEach(({ entry }) => {
        if (entry.exampleSentences && Array.isArray(entry.exampleSentences)) {
            entry.exampleSentences.forEach(sentenceObj => {
                const sentenceText = sentenceObj.text.trim();
                
                // Only add if we haven't seen this exact sentence before
                if (!seenSentences.has(sentenceText)) {
                    seenSentences.add(sentenceText);
                    allSentences.push(sentenceObj);
                }
            });
        }
    });
    
    // Sort sentences alphabetically for consistency
    allSentences.sort((a, b) => a.text.localeCompare(b.text));
    
    // Update the merged entry with all unique sentences
    baseEntry.exampleSentences = allSentences;
    
    return baseEntry;
}

/**
 * Generates a detailed merge report
 */
function generateMergeReport(originalData, mergedData, mergeLog, reportFile) {
    const report = [];
    const addLine = (line = '') => report.push(line);
    
    addLine('='.repeat(80));
    addLine(`WORD MERGE REPORT - ${new Date().toISOString()}`);
    addLine('='.repeat(80));
    addLine();
    
    addLine('SUMMARY');
    addLine('-'.repeat(80));
    addLine(`Original entries:      ${originalData.length}`);
    addLine(`Merged entries:        ${mergedData.length}`);
    addLine(`Reduced by:            ${originalData.length - mergedData.length} entries`);
    addLine(`Words that were merged: ${mergeLog.length}`);
    addLine();
    
    if (mergeLog.length === 0) {
        addLine('No duplicate words found - all words were unique.');
    } else {
        addLine('MERGED WORDS');
        addLine('-'.repeat(80));
        addLine(`Found ${mergeLog.length} word(s) with multiple entries that were merged`);
        addLine();
        
        mergeLog.forEach((log, idx) => {
            const wordDisplay = log.article 
                ? `${log.article} ${log.word}` 
                : log.word;
            
            addLine(`${idx + 1}. Word: "${wordDisplay}" (${log.type})`);
            addLine(`   Original entries: ${log.originalCount} (at indices: ${log.originalIndices.join(', ')})`);
            addLine(`   Total unique sentences after merge: ${log.totalSentences}`);
            addLine();
            
            // Show what was merged
            addLine(`   ORIGINAL ENTRIES:`);
            log.entries.forEach((entry, entryIdx) => {
                addLine(`   [Index ${entry.index}] - ${entry.sentenceCount} sentence(s):`);
                entry.sentences.forEach((sent, sentIdx) => {
                    const preview = sent.text.length > 70 
                        ? sent.text.substring(0, 70) + '...' 
                        : sent.text;
                    addLine(`     ${sentIdx + 1}. ${preview}`);
                });
                if (entryIdx < log.entries.length - 1) {
                    addLine();
                }
            });
            
            addLine();
            addLine(`   MERGED RESULT: ${log.totalSentences} unique sentence(s)`);
            
            // Find the merged entry to show final result
            const mergedEntry = mergedData.find(e => 
                e.word === log.word && 
                e.article === log.article && 
                e.type === log.type
            );
            
            if (mergedEntry && mergedEntry.exampleSentences) {
                mergedEntry.exampleSentences.forEach((sent, sentIdx) => {
                    const preview = sent.text.length > 70 
                        ? sent.text.substring(0, 70) + '...' 
                        : sent.text;
                    addLine(`     ${sentIdx + 1}. ${preview}`);
                });
            }
            
            addLine();
            addLine('-'.repeat(80));
            addLine();
        });
    }
    
    addLine();
    addLine('='.repeat(80));
    addLine('VERIFICATION');
    addLine('='.repeat(80));
    addLine();
    addLine('Checking for any remaining duplicates...');
    addLine('-'.repeat(80));
    
    // Check for remaining duplicates
    const wordCount = new Map();
    mergedData.forEach((entry, index) => {
        const key = createWordKey(entry);
        if (!wordCount.has(key)) {
            wordCount.set(key, []);
        }
        wordCount.get(key).push(index);
    });
    
    const stillDuplicate = [];
    wordCount.forEach((indices, key) => {
        if (indices.length > 1) {
            const entry = mergedData[indices[0]];
            stillDuplicate.push({ 
                word: entry.word, 
                count: indices.length, 
                indices 
            });
        }
    });
    
    if (stillDuplicate.length === 0) {
        addLine('✓ SUCCESS - All duplicate words have been merged!');
        addLine('  Every word now appears exactly once in the vocabulary.');
    } else {
        addLine(`⚠ WARNING - Found ${stillDuplicate.length} word(s) that still appear multiple times:`);
        addLine();
        stillDuplicate.forEach((dup, idx) => {
            addLine(`${idx + 1}. "${dup.word}" appears ${dup.count} times at indices: ${dup.indices.join(', ')}`);
        });
        addLine();
        addLine('This might indicate entries with identical word+article+type.');
    }
    
    addLine();
    addLine('='.repeat(80));
    
    // Write report to file
    fs.writeFileSync(reportFile, report.join('\n'), 'utf8');
}

if (require.main === module) {
    const inputFile = process.argv[2] || 'b1-vocabulary-clean-new.json';
    const outputFile = process.argv[3] || 'b1-vocabulary-merged.json';
    const reportFile = process.argv[4] || 'merge-report.txt';
    
    console.log('='.repeat(60));
    console.log('VOCABULARY WORD MERGER');
    console.log('='.repeat(60));
    console.log(`Input:  ${inputFile}`);
    console.log(`Output: ${outputFile}`);
    console.log(`Report: ${reportFile}`);
    console.log();
    
    try {
        const result = mergeDuplicateWords(inputFile, outputFile, reportFile);
        
        console.log('\n' + '='.repeat(60));
        console.log('MERGE COMPLETE');
        console.log('='.repeat(60));
        console.log(`Original:  ${result.originalCount} entries`);
        console.log(`Merged:    ${result.mergedCount} entries`);
        console.log(`Reduced:   ${result.reducedBy} duplicates merged`);
        console.log();
        console.log('✓ Word merge complete!\n');
    } catch (error) {
        console.error('\n✗ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

module.exports = { mergeDuplicateWords };

