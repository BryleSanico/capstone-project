import { openDatabase, SQLiteDatabase, enablePromise } from 'react-native-sqlite-storage';
import { Event } from '../types/event';
import { Ticket } from '../types/ticket';

// Enable promises for SQLite operations
enablePromise(true);

const DB_NAME = 'EventAppCache.db';
let db: SQLiteDatabase;

//  Database Initialization 

/**
 * Opens the database connection.
 */
const getDB = async (): Promise<SQLiteDatabase> => {
  if (db) {
    return db;
  }
  db = await openDatabase({ name: DB_NAME, location: 'default' });
  return db;
};

/**
 * Creates all necessary tables if they don't exist.
 * This should be run once when the app starts.
 * We store the event object as JSON for simplicity.
 */
export const initDB = async () => {
  const db = await getDB();
  await db.transaction(async (tx) => {
    // Events Table (for Discover feed)
    await tx.executeSql(`
      CREATE TABLE IF NOT EXISTS Events (
        id INTEGER PRIMARY KEY NOT NULL,
        eventData TEXT NOT NULL
      );
    `);
    
    // MyEvents Table
    await tx.executeSql(`
      CREATE TABLE IF NOT EXISTS MyEvents (
        id INTEGER PRIMARY KEY NOT NULL,
        eventData TEXT NOT NULL
      );
    `);
    
    // Tickets Table
    await tx.executeSql(`
      CREATE TABLE IF NOT EXISTS Tickets (
        id INTEGER PRIMARY KEY NOT NULL,
        ticketData TEXT NOT NULL
      );
    `);
    
    // Favorites Table (just store the IDs)
    await tx.executeSql(`
      CREATE TABLE IF NOT EXISTS FavoriteEventIds (
        id INTEGER PRIMARY KEY NOT NULL
      );
    `);
  });
  console.log('[SQLite] Database initialized');
};

/**
 * Wipes all data from all tables.
 * Used on logout.
 */
export const clearDatabase = async () => {
  const db = await getDB();
  await db.transaction(async (tx) => {
    await tx.executeSql('DELETE FROM Events');
    await tx.executeSql('DELETE FROM MyEvents');
    await tx.executeSql('DELETE FROM Tickets');
    await tx.executeSql('DELETE FROM FavoriteEventIds');
  });
  console.log('[SQLite] Database cleared');
};

//  Helper: Generic Upsert (Insert or Replace) 
const upsertItems = async (table: string, idColumn: string, dataColumn: string, items: any[]) => {
  if (items.length === 0) return;
  const db = await getDB();
  await db.transaction(async (tx) => {
    // Prepare a single, large query
    const query = `INSERT OR REPLACE INTO ${table} (${idColumn}, ${dataColumn}) VALUES ${items.map(() => '(?, ?)').join(', ')}`;
    const params: (string | number)[] = [];
    items.forEach(item => {
      params.push(item.id);
      params.push(JSON.stringify(item));
    });
    
    await tx.executeSql(query, params);
  });
};

//  Events 
export const saveEvents = async (events: Event[]) => {
  await upsertItems('Events', 'id', 'eventData', events);
};
export const getEvents = async (): Promise<Event[]> => {
  const db = await getDB();
  const [results] = await db.executeSql('SELECT eventData FROM Events');
  return results.rows.raw().map(row => JSON.parse(row.eventData));
};

//  MyEvents 
export const saveMyEvents = async (events: Event[]) => {
  await upsertItems('MyEvents', 'id', 'eventData', events);
};
export const getMyEvents = async (): Promise<Event[]> => {
  const db = await getDB();
  const [results] = await db.executeSql('SELECT eventData FROM MyEvents');
  return results.rows.raw().map(row => JSON.parse(row.eventData));
};

//  Tickets 
export const saveTickets = async (tickets: Ticket[]) => {
  await upsertItems('Tickets', 'id', 'ticketData', tickets);
};
export const getTickets = async (): Promise<Ticket[]> => {
  const db = await getDB();
  const [results] = await db.executeSql('SELECT ticketData FROM Tickets');
  return results.rows.raw().map(row => JSON.parse(row.ticketData));
};

//  Favorites 
export const saveFavoriteIds = async (ids: number[]) => {
  const db = await getDB();
  await db.transaction(async (tx) => {
    // Clear old favorites
    await tx.executeSql('DELETE FROM FavoriteEventIds');
    // Insert new ones
    if (ids.length > 0) {
      const query = `INSERT INTO FavoriteEventIds (id) VALUES ${ids.map(() => '(?)').join(', ')}`;
      await tx.executeSql(query, ids);
    }
  });
};
export const getFavoriteIds = async (): Promise<number[]> => {
  const db = await getDB();
  const [results] = await db.executeSql('SELECT id FROM FavoriteEventIds');
  return results.rows.raw().map(row => row.id);
};