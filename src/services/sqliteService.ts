import {
  openDatabase,
  SQLiteDatabase,
  enablePromise,
} from "react-native-sqlite-storage";
import { Event } from "../types/event";
import { Ticket } from "../types/ticket";

enablePromise(true);
// Semaphore to prevent overlapping saves
let isSavingFavorites = false;
const DB_NAME = "EventAppCache.db";
let db: SQLiteDatabase;

// promise-safe connection handlers
let dbOpenPromise: Promise<SQLiteDatabase> | null = null;
let dbInitializationPromise: Promise<void> | null = null;

/**
 * Gets the database instance, ensuring openDatabase is only called once.
 */
const getDB = (): Promise<SQLiteDatabase> => {
  if (db) {
    return Promise.resolve(db);
  }
  if (dbOpenPromise) {
    return dbOpenPromise;
  }
  // Create the promise and store it
  dbOpenPromise = new Promise(async (resolve, reject) => {
    try {
      console.log("[SQLite] Opening database connection...");
      const database = await openDatabase({
        name: DB_NAME,
        location: "default",
      });
      db = database; // Set global instance
      console.log("[SQLite] Database connection opened.");
      resolve(db);
    } catch (e) {
      console.error("[SQLite] FAILED to open database connection:", e);
      dbOpenPromise = null; // Reset promise on failure
      reject(e);
    }
  });
  return dbOpenPromise;
};

/**
 * Creates all necessary tables if they don't exist.
 * This function now runs each CREATE TABLE statement in its own.
 * We store the event object as JSON for simplicity.
 */
export const initDB = (): Promise<void> => {
  if (dbInitializationPromise) {
    return dbInitializationPromise;
  }
  // Create the promise and store it
  dbInitializationPromise = new Promise(async (resolve, reject) => {
    try {
      const dbInstance = await getDB(); // Wait for the single connection
      console.log("[SQLite] Initializing tables...");

      // Run each CREATE statement in its own transaction
      await dbInstance.transaction(async (tx) => {
        await tx.executeSql(`
          CREATE TABLE IF NOT EXISTS Events (
            id INTEGER PRIMARY KEY NOT NULL,
            eventData TEXT NOT NULL
          );
        `);
      });
      console.log("[SQLite] Table [Events] initialized.");

      await dbInstance.transaction(async (tx) => {
        await tx.executeSql(`
          CREATE TABLE IF NOT EXISTS MyEvents (
            id INTEGER PRIMARY KEY NOT NULL,
            eventData TEXT NOT NULL
          );
        `);
      });
      console.log("[SQLite] Table [MyEvents] initialized.");

      await dbInstance.transaction(async (tx) => {
        await tx.executeSql(`
          CREATE TABLE IF NOT EXISTS Tickets (
            id INTEGER PRIMARY KEY NOT NULL,
            ticketData TEXT NOT NULL
          );
        `);
      });
      console.log("[SQLite] Table [Tickets] initialized.");

      await dbInstance.transaction(async (tx) => {
        await tx.executeSql(`
          CREATE TABLE IF NOT EXISTS FavoriteEventIds (
            id INTEGER PRIMARY KEY NOT NULL
          );
        `);
      });
      console.log("[SQLite] Table [FavoriteEventIds] initialized.");

      console.log("[SQLite] All database tables initialized.");
      resolve();
    } catch (e) {
      console.error("[SQLite] FAILED to initialize tables:", e);
      dbInitializationPromise = null; // Reset promise on failure
      reject(e);
    }
  });
  return dbInitializationPromise;
};

/**
 * Wipes all user-specific data from user tables.
 * Used on logout.
 */
export const clearPrivateData = async () => {
  try {
    await initDB(); // Ensure tables exist before clearing
    const dbInstance = await getDB();
    await dbInstance.transaction(async (tx) => {
      await tx.executeSql("DELETE FROM MyEvents");
      await tx.executeSql("DELETE FROM Tickets");
      await tx.executeSql("DELETE FROM FavoriteEventIds");
    });
    console.log("[SQLite] Private user data cleared");
  } catch (e) {
    console.error("[SQLite] FAILED to clear private data:", e);
  }
};

/**
 * A generic helper to INSERT OR REPLACE (upsert) a list of items.
 */
const upsertItems = async (
  table: string,
  idColumn: string,
  dataColumn: string,
  items: any[]
) => {
  console.log(
    `[SQLite] Attempting to SAVE ${items.length} items to table [${table}]`
  );

  if (items.length === 0) return;

  try {
    await initDB(); // Ensure table exists before writing
    const dbInstance = await getDB();

    await dbInstance.transaction(async (tx) => {
      const chunkSize = 100;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const query = `INSERT OR REPLACE INTO ${table} (${idColumn}, ${dataColumn}) VALUES ${chunk
          .map(() => "(?, ?)")
          .join(", ")};`;

        const params: (string | number)[] = [];
        chunk.forEach((item) => {
          params.push(item.id);
          params.push(JSON.stringify(item));
        });

        await tx.executeSql(query, params);
      }
    });

    console.log(
      `[SQLite] SUCCESSFULLY SAVED ${items.length} items to table [${table}]`
    );
  } catch (e) {
    console.error(`[SQLite] FAILED to SAVE items to table [${table}]:`, e);
  }
};

/**
 * A generic helper to read all items from a table.
 */
const getItems = async <T>(table: string, dataColumn: string): Promise<T[]> => {
  try {
    await initDB(); // Ensure table exists before reading
    const dbInstance = await getDB();

    const [results] = await dbInstance.executeSql(
      `SELECT ${dataColumn} FROM ${table}`
    );
    if (results.rows.length === 0) {
      console.log(`[SQLite] GET query on table [${table}]: No data found.`);
      return [];
    }
    const data = results.rows.raw().map((row) => JSON.parse(row[dataColumn]));

    console.log(
      `[SQLite] GET query on table [${table}]: Found ${
        data.length
      } items. Data: ${JSON.stringify(data, null, 2)}`
    );

    return data;
  } catch (e: any) {
    console.error(`[SQLite] FAILED to GET items from table [${table}]:`, e);
    if (e.message.includes("no such table")) {
      console.warn(`[SQLite] Table ${table} not found, re-initializing DB.`);
      // Re-run init and try one more time
      dbInitializationPromise = null; // Force re-init
      await initDB();
      return getItems(table, dataColumn); // Retry
    }
    throw e;
  }
};

// Events
export const saveEvents = (events: Event[]) =>
  upsertItems("Events", "id", "eventData", events);
export const getEvents = (): Promise<Event[]> =>
  getItems<Event>("Events", "eventData");

// MyEvents
export const saveMyEvents = (events: Event[]) =>
  upsertItems("MyEvents", "id", "eventData", events);
export const getMyEvents = (): Promise<Event[]> =>
  getItems<Event>("MyEvents", "eventData");

// Tickets
export const saveTickets = (tickets: Ticket[]) =>
  upsertItems("Tickets", "id", "ticketData", tickets);
export const getTickets = (): Promise<Ticket[]> =>
  getItems<Ticket>("Tickets", "ticketData");

export const saveFavoriteIds = async (ids: number[]) => {
  if (isSavingFavorites) {
    console.warn("[SQLite] Save already in progress, skipping.");
    return;
  }
  isSavingFavorites = true;
  console.log(`[SQLite] Saving ${ids.length} favorite IDs:`, ids);

  try {
    await initDB();
    const dbInstance = await getDB();
    const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));

    // Clear table (Atomic Transaction)
    await dbInstance.transaction(async (tx) => {
      await tx.executeSql("DELETE FROM FavoriteEventIds");
    });

    // Batch Insert (Loop OUTSIDE transaction, chunked)
    // Matches the logic of upsertItems
    if (numericIds.length > 0) {
      const chunkSize = 50;
      for (let i = 0; i < numericIds.length; i += chunkSize) {
        const chunk = numericIds.slice(i, i + chunkSize);

        await dbInstance.transaction(async (tx) => {
          const placeholders = chunk.map(() => "(?)").join(", ");
          const query = `INSERT INTO FavoriteEventIds (id) VALUES ${placeholders}`;
          await tx.executeSql(query, chunk);
        });
      }
    }

    //Verification
    const [result] = await dbInstance.executeSql(
      "SELECT count(*) as count FROM FavoriteEventIds"
    );
    console.log(
      `[SQLite] Favorite IDs saved. Count: ${result.rows.item(0).count}`
    );
  } catch (e) {
    console.error(`[SQLite] FAILED to SAVE favorite IDs:`, e);
    throw e;
  } finally {
    isSavingFavorites = false;
  }
};

export const getFavoriteIds = async (): Promise<number[]> => {
  try {
    await initDB();
    const dbInstance = await getDB();

    // Similar to getItems structure
    const [results] = await dbInstance.executeSql(
      "SELECT id FROM FavoriteEventIds"
    );

    const ids: number[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      ids.push(results.rows.item(i).id);
    }

    console.log(`[SQLite] Loaded ${ids.length} favorite IDs from DB.`);
    return ids;
  } catch (e) {
    console.error(`[SQLite] FAILED to GET favorite IDs:`, e);
    return [];
  }
};

/**
 * Gets a single event by its ID from the cache.
 * It checks both Events (public) and MyEvents (private) tables.
 */
export const getEventById = async (eventId: number): Promise<Event | null> => {
  if (!eventId) return null;
  await initDB(); // Ensure tables exist
  const dbInstance = await getDB();

  try {
    // Try to find in the main 'Events' table first
    let [results] = await dbInstance.executeSql(
      "SELECT eventData FROM Events WHERE id = ?",
      [eventId]
    );

    if (results.rows.length > 0) {
      console.log(
        `[SQLite] getEventById: Found event ${eventId} in 'Events' table.`
      );
      return JSON.parse(results.rows.item(0).eventData);
    }

    // If not found, try the 'MyEvents' table
    [results] = await dbInstance.executeSql(
      "SELECT eventData FROM MyEvents WHERE id = ?",
      [eventId]
    );

    if (results.rows.length > 0) {
      console.log(
        `[SQLite] getEventById: Found event ${eventId} in 'MyEvents' table.`
      );
      return JSON.parse(results.rows.item(0).eventData);
    }

    // If not found in either
    console.log(
      `[SQLite] getEventById: Event ${eventId} not found in any cache.`
    );
    return null;
  } catch (e) {
    console.error(`[SQLite] FAILED to GET event ${eventId}:`, e);
    return null;
  }
};

export const getEventsByIds = async (eventIds: number[]): Promise<Event[]> => {
  if (!eventIds || eventIds.length === 0) return [];

  try {
    await initDB();
    const dbInstance = await getDB();
    const eventsMap = new Map<number, Event>();
    const placeholders = eventIds.map(() => "?").join(",");

    console.log(
      `[SQLite] getEventsByIds: Searching for IDs: [${eventIds.join(",")}]`
    );

    // Search in 'Events' (Public Cache)
    const [publicResults] = await dbInstance.executeSql(
      `SELECT eventData FROM Events WHERE id IN (${placeholders})`,
      eventIds
    );

    for (let i = 0; i < publicResults.rows.length; i++) {
      const event = JSON.parse(publicResults.rows.item(i).eventData);
      eventsMap.set(event.id, event);
    }

    // Search in 'MyEvents' (Private Cache)
    const missingIds = eventIds.filter((id) => !eventsMap.has(id));
    if (missingIds.length > 0) {
      const myPlaceholders = missingIds.map(() => "?").join(",");
      const [myResults] = await dbInstance.executeSql(
        `SELECT eventData FROM MyEvents WHERE id IN (${myPlaceholders})`,
        missingIds
      );

      for (let i = 0; i < myResults.rows.length; i++) {
        const event = JSON.parse(myResults.rows.item(i).eventData);
        eventsMap.set(event.id, event);
      }
    }

    const foundEvents = Array.from(eventsMap.values());
    console.log(
      `[SQLite] getEventsByIds: Returned ${foundEvents.length} / ${eventIds.length} events.`
    );
    return foundEvents;
  } catch (e) {
    console.error(`[SQLite] FAILED to GET events by IDs:`, e);
    return [];
  }
};
