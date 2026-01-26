#!/usr/bin/env node

const fs = require('fs').promises;

const INPUT_FILE = 'spanish-grammar-questions-complete.json';

// Required languages
const REQUIRED_LANGUAGES = ['en', 'de', 'fr', 'ru', 'ar', 'es'];

// Validation function
async function validateGrammarQuestions() {
  console.log('🔍 Validating Spanish Grammar Questions JSON\n');
  
  try {
    const data = await fs.readFile(INPUT_FILE, 'utf8');
    const questions = JSON.parse(data);
    
    console.log(`📊 Total questions: ${questions.length}\n`);
    
    let validCount = 0;
    let invalidCount = 0;
    const issues = [];
    
    questions.forEach((question, index) => {
      const questionNumber = index + 1;
      const questionIssues = [];
      
      // Check top-level structure
      if (!question.translations) {
        questionIssues.push('Missing "translations" field');
      } else {
        // Check all required language translations
        REQUIRED_LANGUAGES.forEach(lang => {
          if (!question.translations[lang]) {
            questionIssues.push(`Missing translation for language: ${lang}`);
          } else if (typeof question.translations[lang] !== 'string' || question.translations[lang].trim() === '') {
            questionIssues.push(`Empty translation for language: ${lang}`);
          }
        });
      }
      
      if (!question.text) {
        questionIssues.push('Missing "text" field');
      } else if (!question.text.includes('**')) {
        questionIssues.push('Text field missing ** markers');
      }
      
      if (!question.question) {
        questionIssues.push('Missing "question" field');
      } else {
        // Check question structure
        if (question.question.type !== 'multiple_choice') {
          questionIssues.push(`Invalid type: ${question.question.type} (expected: multiple_choice)`);
        }
        
        if (!question.question.rendered_sentence) {
          questionIssues.push('Missing "rendered_sentence" field');
        } else if (!question.question.rendered_sentence.includes('____')) {
          questionIssues.push('Rendered sentence missing ____ blank');
        }
        
        if (!question.question.options || !Array.isArray(question.question.options)) {
          questionIssues.push('Missing or invalid "options" array');
        } else {
          const options = question.question.options;
          
          // Should have at least 2 options (1 correct + wrong options)
          if (options.length < 2) {
            questionIssues.push(`Only ${options.length} option(s) found (expected at least 2)`);
          }
          
          // Check for exactly one correct answer
          const correctOptions = options.filter(opt => opt.is_correct === true);
          if (correctOptions.length === 0) {
            questionIssues.push('No correct answer found');
          } else if (correctOptions.length > 1) {
            questionIssues.push(`Multiple correct answers found (${correctOptions.length})`);
          }
          
          // Validate each option
          options.forEach((opt, optIndex) => {
            if (!opt.choice) {
              questionIssues.push(`Option ${optIndex + 1}: Missing "choice" field`);
            }
            
            if (typeof opt.is_correct !== 'boolean') {
              questionIssues.push(`Option ${optIndex + 1}: Missing or invalid "is_correct" field`);
            }
            
            if (!opt.explanation) {
              questionIssues.push(`Option ${optIndex + 1}: Missing "explanation" field`);
            } else {
              // Check all language explanations
              REQUIRED_LANGUAGES.forEach(lang => {
                if (!opt.explanation[lang]) {
                  questionIssues.push(`Option ${optIndex + 1}: Missing explanation for language: ${lang}`);
                } else if (typeof opt.explanation[lang] !== 'string' || opt.explanation[lang].trim() === '') {
                  questionIssues.push(`Option ${optIndex + 1}: Empty explanation for language: ${lang}`);
                }
              });
            }
          });
        }
      }
      
      if (questionIssues.length > 0) {
        invalidCount++;
        issues.push({
          questionNumber,
          text: question.text ? question.text.substring(0, 60) + '...' : 'N/A',
          issues: questionIssues
        });
      } else {
        validCount++;
      }
    });
    
    // Print results
    console.log('=' .repeat(70));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(70));
    console.log(`✅ Valid questions: ${validCount}`);
    console.log(`❌ Invalid questions: ${invalidCount}`);
    console.log('='.repeat(70));
    
    if (issues.length > 0) {
      console.log('\n📋 ISSUES FOUND:\n');
      issues.forEach(issue => {
        console.log(`Question ${issue.questionNumber}: "${issue.text}"`);
        issue.issues.forEach(msg => {
          console.log(`  • ${msg}`);
        });
        console.log('');
      });
    } else {
      console.log('\n🎉 All questions are valid and complete!');
      console.log('\n✅ All entries have:');
      console.log('   • Translations in all 6 languages (en, de, fr, ru, ar, es)');
      console.log('   • Original text with ** markers');
      console.log('   • Rendered sentence with ____ blank');
      console.log('   • Multiple choice options with one correct answer');
      console.log('   • Explanations for all options in all 6 languages');
    }
    
    console.log('\n' + '='.repeat(70));
    
    // Summary statistics
    console.log('\n📈 SUMMARY STATISTICS:');
    console.log(`   • Total questions: ${questions.length}`);
    console.log(`   • Valid: ${validCount} (${(validCount / questions.length * 100).toFixed(1)}%)`);
    console.log(`   • Invalid: ${invalidCount} (${(invalidCount / questions.length * 100).toFixed(1)}%)`);
    
    // Count total options
    const totalOptions = questions.reduce((sum, q) => {
      return sum + (q.question?.options?.length || 0);
    }, 0);
    console.log(`   • Total options across all questions: ${totalOptions}`);
    
    process.exit(invalidCount > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Error reading or parsing file:', error.message);
    process.exit(1);
  }
}

// Run validation
validateGrammarQuestions();
