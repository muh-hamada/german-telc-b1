import { evaluateWritingB1 } from './evaluate-german-b1';
import { evaluateWritingB2 } from './evaluate-german-b2';
import { deleteUserAccount } from './delete-user-account';

export {
  evaluateWritingB1 as evaluateWriting, // Backward compatibility
  evaluateWritingB2,
  deleteUserAccount
};