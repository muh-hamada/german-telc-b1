const fs = require('fs');

// Read both files
const fileContent = fs.readFileSync('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'utf8');
const incomplete = JSON.parse(fs.readFileSync('/Users/mham/projects/german-telc-b1/incomplete_explanations.json', 'utf8'));

// Split into lines for easier manipulation
let lines = fileContent.split('\n');

// Translation mapping - I'll use Google Translate API or a simple translation service
// For now, let me create a simple translation function that uses the existing translations as reference
// This would need to be replaced with actual translation API calls

const translationMap = {
  // Common phrases found in explanations
  es: {
    'Incorrect.': 'Incorrecto.',
    'Wrong tense.': 'Tiempo verbal incorrecto.',
    'Wrong word order.': 'Orden de palabras incorrecto.',
    'This is': 'Este es',
    'This was': 'Esta era',
    'This would mean': 'Esto significaría',
    'We use': 'Usamos',
    'is used': 'se usa',
    'is a': 'es un',
    'refers to': 'se refiere a',
    'would be': 'sería',
    'cannot be used': 'no se puede usar',
    'expresses': 'expresa',
    'implies': 'implica',
    'means': 'significa',
    'The sentence': 'La frase',
    'After': 'Después de',
    'at the start of a sentence': 'al comienzo de la oración',
    'require inversion': 'requiere inversión',
    'similar to a question form': 'similar a la forma de pregunta',
    'Auxiliary': 'Auxiliar',
    'Subject': 'Sujeto',
    'Main Verb': 'Verbo Principal',
    'refers to a life experience': 'se refiere a una experiencia de vida',
    'Present Perfect': 'Presente Perfecto',
    'standard word order': 'orden de palabras estándar',
    'fails the rule for mandatory inversion': 'no cumple con la regla de inversión obligatoria',
    'Negative adverbs': 'Adverbios negativos',
    'inversion follows': 'sigue la inversión'
  },
  Fr: {
    'Negative adverbs': 'Les adverbes négatifs',
    'at the start of a sentence': 'au début de la phrase',
    'require inversion': 'nécessitent l\'inversion',
    'similar to a question form': 'similaire à la forme interrogative',
    'Auxiliary': 'Auxiliaire',
    'Subject': 'Sujet',
    'Main Verb': 'Verbe Principal',
    'Incorrect.': 'Incorrect.',
    'This is': 'C\'est',
    'standard word order': 'l\'ordre des mots standard',
    'fails the rule for mandatory inversion': 'ne respecte pas la règle d\'inversion obligatoire',
    'Wrong tense.': 'Mauvais temps.',
    'The sentence': 'La phrase',
    'refers to a life experience': 'fait référence à une expérience de vie',
    'Present Perfect': 'Présent Parfait',
    'After': 'Après',
    'inversion follows': 'l\'inversion suit'
  },
  ru: {
    'Negative adverbs': 'Отрицательные наречия',
    'at the start of a sentence': 'в начале предложения',
    'require inversion': 'требуют инверсии',
    'similar to a question form': 'подобно вопросительной форме',
    'Auxiliary': 'Вспомогательный глагол',
    'Subject': 'Подлежащее',
    'Main Verb': 'Основной глагол',
    'Incorrect.': 'Неверно.',
    'This is': 'Это',
    'standard word order': 'стандартный порядок слов',
    'fails the rule for mandatory inversion': 'не соответствует правилу обязательной инверсии',
    'Wrong tense.': 'Неправильное время.',
    'The sentence': 'Предложение',
    'refers to a life experience': 'относится к жизненному опыту',
    'Present Perfect': 'Present Perfect',
    'After': 'После',
    'inversion follows': 'следует инверсия'
  }
};

console.log('This script requires actual translation. Please use a translation API.');
console.log('Found', incomplete.length, 'incomplete explanations.');
console.log('');
console.log('Sample items needing translation:');
incomplete.slice(0, 5).forEach((item, idx) => {
  console.log(`${idx + 1}. Lines ${item.startLine}-${item.endLine}: Missing ${item.missing.join(', ')}`);
  console.log(`   English: "${item.translations.en}"`);
  console.log('');
});

