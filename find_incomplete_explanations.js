const fs = require('fs');

// Read the JSON file
const data = JSON.parse(fs.readFileSync('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'utf8'));

const requiredLanguages = ['de', 'ar', 'en', 'Fr', 'ru', 'es'];
const incomplete = [];

// Traverse the data structure
data.forEach((topic, topicIndex) => {
  if (topic.sentences) {
    topic.sentences.forEach((sentence, sentenceIndex) => {
      if (sentence.question && sentence.question.options) {
        sentence.question.options.forEach((option, optionIndex) => {
          if (option.explanation) {
            const existingLanguages = Object.keys(option.explanation);
            const missingLanguages = requiredLanguages.filter(lang => !existingLanguages.includes(lang));
            
            if (missingLanguages.length > 0) {
              incomplete.push({
                topic: topic.name,
                topicIndex,
                sentenceIndex,
                optionIndex,
                choice: option.choice,
                existingLanguages,
                missingLanguages,
                explanation: option.explanation
              });
            }
          }
        });
      }
    });
  }
});

console.log(`Found ${incomplete.length} incomplete explanation objects:\n`);
incomplete.forEach((item, index) => {
  console.log(`${index + 1}. Topic: "${item.topic}"`);
  console.log(`   Indices: [${item.topicIndex}][sentences][${item.sentenceIndex}][question][options][${item.optionIndex}]`);
  console.log(`   Choice: "${item.choice}"`);
  console.log(`   Missing languages: ${item.missingLanguages.join(', ')}`);
  console.log(`   Existing translations:`, JSON.stringify(item.explanation, null, 2));
  console.log('');
});

// Also write to a JSON file for easier processing
fs.writeFileSync('/Users/mham/projects/german-telc-b1/incomplete_explanations.json', JSON.stringify(incomplete, null, 2));

