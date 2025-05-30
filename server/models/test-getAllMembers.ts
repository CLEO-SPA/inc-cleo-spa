import memberModel from '../models/memberModel.js';
import { pool, getProdPool as prodPool } from '../config/database.js';

(async () => {
  try {
    const result = await memberModel.getAllMembers(
      0,                     // offset
      20,                    // limit
      undefined,          // startDate_utc
      undefined,          // endDate_utc
      undefined,           // createdBy
      undefined,               // name
      undefined                  // phoneNumber
    );

    console.log('Filtered members:', result.members);
    console.log('Total pages:', result.totalPages);
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await pool().end(); // close DB connection
  }
})();
