import { initDB, createResponse } from './db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return createResponse({ success: true }, 200);
  }

  try {
    await initDB();
    return createResponse({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Init error:', error);
    return createResponse({ 
      success: false, 
      error: error.message 
    }, 500);
  }
}
