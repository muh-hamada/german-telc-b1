#!/usr/bin/env node

const fs = require('fs');

// Configuration
const REQUIRED_LANGUAGES = ['en', 'es', 'fr', 'ru', 'ar'];
const REQUIRED_ENTRY_KEYS = ['word', 'article', 'translations', 'type', 'exampleSentences'];

/**
 * Validates the vocabulary JSON file for completeness and duplicates
 * @param {string} inputFile - Path to the vocabulary JSON file
 */
function validateVocabulary(inputFile) {
    console.log('='.repeat(70));
    console.log('VOCABULARY VALIDATION TOOL');
    console.log('='.repeat(70));
    console.log(`Validating: ${inputFile}\n`);
    
    let data;
    try {
        data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    } catch (error) {
        console.error('❌ ERROR: Failed to read or parse JSON file');
        console.error(error.message);
        process.exit(1);
    }
    
    console.log(`📖 Loaded ${data.length} entries\n`);
    
    // Validation results
    const issues = {
        missingKeys: [],
        missingTranslations: [],
        missingExampleSentences: [],
        invalidExampleSentences: [],
        duplicates: [],
        emptyValues: []
    };
    
    // Track word occurrences for duplicate detection
    const wordMap = new Map();
    
    // Validate each entry
    data.forEach((entry, index) => {
        const entryNum = index + 1;
        const wordDisplay = entry.article ? `${entry.article} ${entry.word}` : entry.word;
        
        // Check for missing required keys
        const missingKeys = REQUIRED_ENTRY_KEYS.filter(key => !(key in entry));
        if (missingKeys.length > 0) {
            issues.missingKeys.push({
                index: entryNum,
                word: wordDisplay,
                missing: missingKeys
            });
        }
        
        // Check if word translations exist and are complete
        if (entry.translations) {
            const missingLangs = REQUIRED_LANGUAGES.filter(lang => !entry.translations[lang]);
            if (missingLangs.length > 0) {
                issues.missingTranslations.push({
                    index: entryNum,
                    word: wordDisplay,
                    missing: missingLangs
                });
            }
            
            // Check for empty translation values
            REQUIRED_LANGUAGES.forEach(lang => {
                if (entry.translations[lang] && entry.translations[lang].trim() === '') {
                    issues.emptyValues.push({
                        index: entryNum,
                        word: wordDisplay,
                        field: `translations.${lang}`,
                        value: 'empty string'
                    });
                }
            });
        }
        
        // Check example sentences
        if (!entry.exampleSentences || !Array.isArray(entry.exampleSentences)) {
            issues.missingExampleSentences.push({
                index: entryNum,
                word: wordDisplay,
                issue: 'exampleSentences is missing or not an array'
            });
        } else if (entry.exampleSentences.length === 0) {
            issues.missingExampleSentences.push({
                index: entryNum,
                word: wordDisplay,
                issue: 'no example sentences provided'
            });
        } else {
            // Validate each example sentence
            entry.exampleSentences.forEach((sentence, sentIdx) => {
                if (!sentence.text || sentence.text.trim() === '') {
                    issues.invalidExampleSentences.push({
                        index: entryNum,
                        word: wordDisplay,
                        sentenceNum: sentIdx + 1,
                        issue: 'missing or empty German text'
                    });
                }
                
                if (!sentence.translations) {
                    issues.invalidExampleSentences.push({
                        index: entryNum,
                        word: wordDisplay,
                        sentenceNum: sentIdx + 1,
                        issue: 'missing translations object'
                    });
                } else {
                    const missingLangs = REQUIRED_LANGUAGES.filter(lang => !sentence.translations[lang]);
                    if (missingLangs.length > 0) {
                        issues.invalidExampleSentences.push({
                            index: entryNum,
                            word: wordDisplay,
                            sentenceNum: sentIdx + 1,
                            issue: `missing translations: ${missingLangs.join(', ')}`
                        });
                    }
                    
                    // Check for empty translation values in sentences
                    REQUIRED_LANGUAGES.forEach(lang => {
                        if (sentence.translations[lang] && sentence.translations[lang].trim() === '') {
                            issues.emptyValues.push({
                                index: entryNum,
                                word: wordDisplay,
                                field: `exampleSentences[${sentIdx}].translations.${lang}`,
                                value: 'empty string'
                            });
                        }
                    });
                }
            });
        }
        
        // Check for duplicates (based on word + article + type)
        if (entry.word && entry.type) {
            const key = `${entry.word}|${entry.article || ''}|${entry.type}`;
            if (wordMap.has(key)) {
                wordMap.get(key).push(entryNum);
            } else {
                wordMap.set(key, [entryNum]);
            }
        }
        
        // Check for empty word or type
        if (!entry.word || entry.word.trim() === '') {
            issues.emptyValues.push({
                index: entryNum,
                word: wordDisplay,
                field: 'word',
                value: 'empty or missing'
            });
        }
        
        if (!entry.type || entry.type.trim() === '') {
            issues.emptyValues.push({
                index: entryNum,
                word: wordDisplay,
                field: 'type',
                value: 'empty or missing'
            });
        }
    });
    
    // Find duplicates
    wordMap.forEach((indices, key) => {
        if (indices.length > 1) {
            const [word, article, type] = key.split('|');
            const wordDisplay = article ? `${article} ${word}` : word;
            issues.duplicates.push({
                word: wordDisplay,
                type,
                count: indices.length,
                indices
            });
        }
    });
    
    // Generate report
    generateReport(data, issues);
    
    // Return validation status
    const hasIssues = Object.values(issues).some(arr => arr.length > 0);
    return {
        valid: !hasIssues,
        totalEntries: data.length,
        issues
    };
}

/**
 * Generates a detailed validation report
 */
function generateReport(data, issues) {
    console.log('='.repeat(70));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(70));
    console.log();
    
    const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
    
    if (totalIssues === 0) {
        console.log('✅ SUCCESS - All entries are valid!');
        console.log();
        console.log('Summary:');
        console.log(`  • Total entries: ${data.length}`);
        console.log(`  • All required keys present: ✓`);
        console.log(`  • All translations complete: ✓`);
        console.log(`  • All example sentences valid: ✓`);
        console.log(`  • No duplicates found: ✓`);
        console.log(`  • No empty values: ✓`);
        console.log();
        console.log('🎉 The vocabulary file is 100% complete and valid!');
        return;
    }
    
    console.log(`⚠️  FOUND ${totalIssues} ISSUE(S)\n`);
    
    // Report missing keys
    if (issues.missingKeys.length > 0) {
        console.log(`❌ MISSING REQUIRED KEYS (${issues.missingKeys.length} entries)`);
        console.log('-'.repeat(70));
        issues.missingKeys.forEach(issue => {
            console.log(`  [${issue.index}] ${issue.word}`);
            console.log(`      Missing: ${issue.missing.join(', ')}`);
        });
        console.log();
    }
    
    // Report missing translations
    if (issues.missingTranslations.length > 0) {
        console.log(`❌ MISSING WORD TRANSLATIONS (${issues.missingTranslations.length} entries)`);
        console.log('-'.repeat(70));
        issues.missingTranslations.forEach(issue => {
            console.log(`  [${issue.index}] ${issue.word}`);
            console.log(`      Missing languages: ${issue.missing.join(', ')}`);
        });
        console.log();
    }
    
    // Report missing example sentences
    if (issues.missingExampleSentences.length > 0) {
        console.log(`❌ MISSING EXAMPLE SENTENCES (${issues.missingExampleSentences.length} entries)`);
        console.log('-'.repeat(70));
        issues.missingExampleSentences.forEach(issue => {
            console.log(`  [${issue.index}] ${issue.word}`);
            console.log(`      Issue: ${issue.issue}`);
        });
        console.log();
    }
    
    // Report invalid example sentences
    if (issues.invalidExampleSentences.length > 0) {
        console.log(`❌ INVALID EXAMPLE SENTENCES (${issues.invalidExampleSentences.length} issues)`);
        console.log('-'.repeat(70));
        issues.invalidExampleSentences.forEach(issue => {
            console.log(`  [${issue.index}] ${issue.word} - Sentence #${issue.sentenceNum}`);
            console.log(`      Issue: ${issue.issue}`);
        });
        console.log();
    }
    
    // Report duplicates
    if (issues.duplicates.length > 0) {
        console.log(`❌ DUPLICATE ENTRIES (${issues.duplicates.length} words)`);
        console.log('-'.repeat(70));
        issues.duplicates.forEach(dup => {
            console.log(`  "${dup.word}" (${dup.type})`);
            console.log(`      Appears ${dup.count} times at indices: ${dup.indices.join(', ')}`);
        });
        console.log();
    }
    
    // Report empty values
    if (issues.emptyValues.length > 0) {
        console.log(`❌ EMPTY VALUES (${issues.emptyValues.length} issues)`);
        console.log('-'.repeat(70));
        issues.emptyValues.slice(0, 20).forEach(issue => {
            console.log(`  [${issue.index}] ${issue.word}`);
            console.log(`      Field: ${issue.field} - ${issue.value}`);
        });
        if (issues.emptyValues.length > 20) {
            console.log(`  ... and ${issues.emptyValues.length - 20} more empty values`);
        }
        console.log();
    }
    
    // Summary
    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total entries validated: ${data.length}`);
    console.log(`Total issues found: ${totalIssues}`);
    console.log();
    console.log('Issues breakdown:');
    console.log(`  • Missing keys: ${issues.missingKeys.length}`);
    console.log(`  • Missing word translations: ${issues.missingTranslations.length}`);
    console.log(`  • Missing example sentences: ${issues.missingExampleSentences.length}`);
    console.log(`  • Invalid example sentences: ${issues.invalidExampleSentences.length}`);
    console.log(`  • Duplicate entries: ${issues.duplicates.length}`);
    console.log(`  • Empty values: ${issues.emptyValues.length}`);
    console.log();
}

// Run validation if called directly
if (require.main === module) {
    const inputFile = process.argv[2] || 'b2-vocabulary-complete.json';
    
    try {
        const result = validateVocabulary(inputFile);
        
        if (result.valid) {
            console.log('✅ Validation passed!');
            process.exit(0);
        } else {
            console.log('❌ Validation failed - please fix the issues above');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n✗ Fatal error during validation:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

module.exports = { validateVocabulary };

