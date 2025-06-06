import { CursorPayload } from '../types/common.types.js';

function encodeCursor(createdAt: Date, id: string) {
  if (!createdAt || id === undefined || id === null) {
    return null;
  }

  return Buffer.from(`${createdAt.toISOString()},${id}`).toString('base64');
}

function decodeCursor(cursor: string): CursorPayload | null {
  if (!cursor) {
    return null;
  }
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    const [createdAtStr, idStr] = decoded.split(',');
    const createdAt = new Date(createdAtStr);
    const id = parseInt(idStr, 10);

    if (isNaN(createdAt.getTime()) || isNaN(id)) {
      return null; // Invalid date or ID
    }
    return { createdAt, id };
  } catch (error) {
    console.error('Error decoding cursor:', error);
    return null; // Handle decoding errors gracefully
  }
}

export { encodeCursor, decodeCursor };
