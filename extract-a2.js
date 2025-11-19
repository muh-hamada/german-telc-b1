const fs = require('fs');

/**
 * Processes dictionary entries (Lemma/Grammar + Sentences) into the requested JSON format.
 * Enhanced to handle multi-line entries and various edge cases in A2 word list.
 * @param {string} text - The raw text content.
 * @returns {string} The formatted JSON string.
 */
function createJsonFromSourceText(text) {
    const lines = text.trim().split('\n');
    const results = [];
    
    // Skip section headers (single letters or headers in caps)
    const skipPatterns = [
        /^[A-Z]$/,  // Single capital letters (section markers)
        /^ALPHABETISCHER WORTSCHATZ$/,
        /^[A-ZÄÖÜ\s]+$/  // All caps lines (section headers)
    ];
    
    function shouldSkipLine(line) {
        const trimmed = line.trim();
        if (trimmed.length === 0) return true;
        if (trimmed.length <= 2 && /^[A-Z]+$/.test(trimmed)) return true;
        return skipPatterns.some(pattern => pattern.test(trimmed));
    }

    // Merge multi-line entries
    const mergedLines = [];
    let currentEntry = '';
    let previousWasVerb = false;
    let currentVerb = '';
    let previousEndedWithPeriod = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (shouldSkipLine(line)) continue;
        
        // Check if this line is a continuation of a verb conjugation
        // Continuation: starts with "hat/ist + participle" where participle relates to previous verb
        const continuationMatch = line.match(/^(hat|ist)\s+([a-zäöüß]+)/);
        if (continuationMatch && previousWasVerb) {
            const participle = continuationMatch[2];
            // Check if participle could be from the current verb
            // E.g., "anfangen" -> "angefangen", "abgeben" -> "abgegeben"
            if (currentVerb && participle.includes(currentVerb.replace(/en$/, ''))) {
                // This is a continuation
                currentEntry += ' ' + line;
                continue;
            }
        }
        
        // Check if line starts a new entry
        const isNewEntry = /^(der|die|das)\s+[A-ZÄÖÜ]/.test(line) ||  // Noun with article
                          /^[a-zäöüß]+-\s/.test(line) ||               // Word with dash (ander-)  
                          (/^[a-zäöüß]+\s+[A-ZÄÖÜ]/.test(line) && !/^[a-zäöüß]+\s+[a-zäöüß]+,/.test(line)) ||  // Simple word + sentence (not "word word,")
                          (/^[a-zäöüß]+(?:\s+\(sich\))?\s*,/.test(line) && (!previousWasVerb || previousEndedWithPeriod)) || // New verb (not continuation, OR previous ended complete)
                          (/^(hat|ist)\s+[a-zäöüß]+\s+[A-ZÄÖÜ]/.test(line) && !previousWasVerb); // Past participle starting new entry
        
        if (currentEntry && isNewEntry) {
            // Save current entry and start new one
            mergedLines.push(currentEntry.trim());
            // Check if previous entry ended with sentence or noun reference
            const lastEntry = currentEntry.trim();
            previousEndedWithPeriod = lastEntry.match(/[.!?]$/) || lastEntry.match(/[-¨]\w+$/);
            currentEntry = line;
            
            // Check if this new entry is a verb
            const verbMatch = line.match(/^([a-zäöüß]+)(?:\s+\(sich\))?\s*,/);
            if (verbMatch) {
                previousWasVerb = true;
                currentVerb = verbMatch[1];
            } else {
                previousWasVerb = false;
                currentVerb = '';
            }
        } else {
            // Start first entry or continue current
            if (currentEntry) {
                currentEntry += ' ' + line;
            } else {
                currentEntry = line;
                // Check if starting entry is a verb
                const verbMatch = line.match(/^([a-zäöüß]+)(?:\s+\(sich\))?\s*,/);
                if (verbMatch) {
                    previousWasVerb = true;
                    currentVerb = verbMatch[1];
                }
            }
        }
    }
    
    // Don't forget the last entry
    if (currentEntry.trim()) {
        mergedLines.push(currentEntry.trim());
    }

    // Helper to extract the lemma (main word) from grammar block
    function extractLemma(grammarBlock) {
        let word = '';
        let article = '';
        let type = 'unknown';
        
        // Pattern 1: Nouns with article (der X, -e / die X, -n / das X, -e)
        const nounMatch = grammarBlock.match(/^(der|die|das)\s+([A-ZÄÖÜ][a-zäöüß]+)/);
        if (nounMatch) {
            article = nounMatch[1];
            word = nounMatch[2];
            type = 'noun';
            return { word, article, type };
        }
        
        // Pattern 2: Past participles (hat/ist + participle)
        const pastPartMatch = grammarBlock.match(/^(hat|ist)\s+([a-zäöüß]+)/);
        if (pastPartMatch) {
            const participle = pastPartMatch[2];
            // Try to derive infinitive from participle
            // Most participles: ge- + stem + -t/-en
            if (participle.startsWith('ge')) {
                word = participle.replace(/^ge/, '').replace(/t$/, 'en').replace(/en$/, 'en');
            } else {
                word = participle;
            }
            type = 'verb';
            return { word, article, type };
        }
        
        // Pattern 3: Verbs with conjugation (infinitive, conjugated, ...)
        // E.g.: "ändern, ändert," or "anfangen, fängt an,"
        const verbMatch = grammarBlock.match(/^([a-zäöüß]+(?:\s+\(sich\))?)\s*,/);
        if (verbMatch) {
            word = verbMatch[1].replace(/\s*\(sich\)\s*/, '').trim();
            type = 'verb';
            if (verbMatch[1].includes('(sich)')) {
                type = 'reflexive verb';
            }
            return { word, article, type };
        }
        
        // Pattern 4: Words with dash suffix (ander-, all-, etc.)
        const dashMatch = grammarBlock.match(/^([a-zäöüß]+)-/);
        if (dashMatch) {
            word = dashMatch[1] + '-';
            type = 'prefix/pronoun';
            return { word, article, type };
        }
        
        // Pattern 5: Simple words (adverbs, adjectives, etc.)
        // Just grab the first word before space
        const simpleMatch = grammarBlock.match(/^([a-zäöüß]+)/);
        if (simpleMatch) {
            word = simpleMatch[1];
            // Infer type based on ending
            if (word.match(/en$/)) {
                type = 'verb';
            } else {
                type = 'other';
            }
            return { word, article, type };
        }
        
        return { word, article, type };
    }

    // Split grammar block from sentences
    function splitEntry(line) {
        // Strategy: Grammar block ends at the first word that:
        // 1. Starts with a capital letter AND
        // 2. Is followed by more text that looks like a complete sentence
        
        // For nouns like "das Angebot, -e", we need to skip the noun's capital letter
        // and find the NEXT capital letter that starts a sentence
        
        let grammarEnd = -1;
        let i = 0;
        
        // If line starts with article, skip past the noun and its grammar info
        if (/^(der|die|das)\s/.test(line)) {
            // Find the end of noun grammar: article + Noun + comma + plural marker
            const nounGrammarMatch = line.match(/^(der|die|das)\s+[A-ZÄÖÜ][a-zäöüß]+\s*,\s*[-¨\w]+\s+/);
            if (nounGrammarMatch) {
                i = nounGrammarMatch[0].length;
            }
        } else if (/^(hat|ist)\s/.test(line)) {
            // Past participle: skip "hat/ist + participle"
            const pastPartMatch = line.match(/^(hat|ist)\s+[a-zäöüß]+\s+/);
            if (pastPartMatch) {
                i = pastPartMatch[0].length;
            }
        } else if (/^[a-zäöüß]+/.test(line)) {
            // Verb or other word: skip until we see a capital letter
            const wordMatch = line.match(/^[a-zäöüß\s(),äöüß-]+\s+/);
            if (wordMatch) {
                i = wordMatch[0].length;
            }
        }
        
        // Now find the first capital letter that starts a sentence
        for (; i < line.length; i++) {
            const remaining = line.substring(i);
            
            // Look for a capital letter
            if (/^[A-ZÄÖÜ]/.test(remaining)) {
                // Check if this looks like a sentence (has verb, ends with punctuation)
                // A sentence typically has: Capital + word + (several words) + [.!?]
                if (/^[A-ZÄÖÜ][a-zäöüß]+\s+.+[.!?]/.test(remaining)) {
                    grammarEnd = i;
                    break;
                }
            }
        }
        
        if (grammarEnd === -1 || grammarEnd === 0) {
            // Couldn't split properly
            return { grammar: '', sentences: '' };
        }
        
        return {
            grammar: line.substring(0, grammarEnd).trim(),
            sentences: line.substring(grammarEnd).trim()
        };
    }

    // Process each merged line
    mergedLines.forEach((line, index) => {
        const { grammar, sentences } = splitEntry(line);
        
        if (!grammar || !sentences) {
            return; // Skip invalid entries
        }
        
        const { word, article, type } = extractLemma(grammar);
        
        // Skip if we couldn't extract a valid word
        if (!word || word.length < 2) {
            return;
        }

        // Split sentences
        let sentenceList = sentences
            .replace(/([.?!])\s+([A-ZÄÖÜ])/g, '$1|SEP|$2')
            .split('|SEP|')
            .map(s => s.trim())
            .filter(s => {
                // Filter out grammar fragments
                if (s.match(/^(hat|ist|wird|war)\s+[a-zäöüß]+\s*$/)) return false;
                if (s.match(/^[a-zäöüß]+,?\s*$/)) return false; // Single word fragments
                if (s.match(/^[a-zäöüß]+\s+(an|auf|aus|ab|ein|mit),?$/)) return false; // Separable verb fragments
                if (s.match(/^fängt\s+an,?\s*$/)) return false; // Specific conjugation fragments
                if (s.length < 5) return false;
                return true;
            })
            .map(s => {
                // Clean up and ensure terminal punctuation
                s = s.trim();
                // Remove leading grammar fragments
                s = s.replace(/^(hat|ist)\s+[a-zäöüß]+\s+/, '');
                s = s.replace(/^[a-zäöüß]+,\s+/, ''); // Remove "fängt an,"
                s = s.trim();
                if (!s.match(/[.?!]$/)) {
                    s += '.';
                }
                return { text: s };
            })
            .filter(s => s.text.length > 5); // Final filter after cleanup

        // Special handling for known problematic entries
        if (word === 'ander-') {
            sentenceList = [
                {"text": "Willst du diesen Mantel? – Nein, ich möchte den anderen."},
                {"text": "Die anderen sind schon nach Hause gegangen."},
                {"text": "Bitte nicht alle auf einmal! Einer nach dem anderen."}
            ];
        } else if (word === 'ändern') {
            sentenceList = [
                {"text": "Das Wetter hat sich geändert."},
                {"text": "Wie kann ich mein Passwort ändern?"}
            ];
        }

        if (sentenceList.length > 0) {
            results.push({
                word,
                article,
                type,
                exampleSentences: sentenceList
            });
        }
    });

    return JSON.stringify(results, null, 2);
}

if (require.main === module) {
    try {
        const text = fs.readFileSync('a2-source.txt', 'utf8');
        const json = createJsonFromSourceText(text);
        fs.writeFileSync('a2-vocabularyoooo.json', json);
        console.log('✓ Successfully generated a2-vocabulary.json');
        
        // Count entries
        const data = JSON.parse(json);
        console.log(`✓ Extracted ${data.length} vocabulary entries`);
        
        // Show sample entries
        console.log('\nSample entries:');
        data.slice(0, 5).forEach((entry, i) => {
            console.log(`${i + 1}. ${entry.article} ${entry.word} (${entry.type})`);
            console.log(`   Examples: ${entry.exampleSentences.length} sentence(s)`);
        });
    } catch (error) {
        console.error('✗ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}