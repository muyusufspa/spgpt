
// Declare sql.js global from CDN
declare var initSqlJs: any;

import type { MockDbUser, ActivityEntry } from '../types';

let db: any = null;

/**
 * Saves the current state of the database to browser's localStorage.
 * The database is exported as a Uint8Array and converted to a base64 string for storage.
 */
const saveDatabase = () => {
    if (db) {
        try {
            const binaryArray = db.export();
            const base64String = btoa(String.fromCharCode.apply(null, Array.from(binaryArray)));
            localStorage.setItem('spa_db_content', base64String);
        } catch (error) {
            console.error("Failed to save database to localStorage:", error);
        }
    }
};

/**
 * Initializes the database.
 * 1. Tries to load the database state from localStorage for persistence.
 * 2. If not found, it fetches the initial `/SPA_DB.db` file.
 * 3. If fetch fails, it creates a new in-memory database as a final fallback.
 * 4. Ensures the 'users' and 'activity_log' tables exist and performs schema migrations if necessary.
 * 5. Seeds the 'users' table with default users only if the database is new and empty.
 * 6. Saves the final state back to localStorage.
 */
export const initDatabase = async (): Promise<void> => {
  if (db) return; // Already initialized

  try {
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });

    // Step 1: Try to load from localStorage first for persistence.
    const savedDbBase64 = localStorage.getItem('spa_db_content');
    let dbInitialized = false;

    if (savedDbBase64) {
        try {
            const binaryString = atob(savedDbBase64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            db = new SQL.Database(bytes);
            console.log("Database loaded from localStorage.");
            dbInitialized = true;
        } catch (error) {
            console.warn("Failed to load database from localStorage, it might be corrupted. Falling back.", error);
            localStorage.removeItem('spa_db_content'); // Clear corrupted data
        }
    }

    // Step 2: If not in localStorage, load from the initial file.
    if (!dbInitialized) {
        try {
            const response = await fetch('/SPA_DB.db');
            if (!response.ok) {
                throw new Error(`Failed to fetch database file: ${response.statusText}`);
            }
            const fileBuffer = await response.arrayBuffer();
            db = new SQL.Database(new Uint8Array(fileBuffer));
            console.log("Database initialized from /SPA_DB.db file.");
        } catch (fetchError) {
            console.warn('Could not load from /SPA_DB.db, creating a new in-memory database as a fallback.', fetchError);
            db = new SQL.Database();
        }
    }
    
    // Step 3: Ensure the `users` and `activity_log` tables exist with a base schema.
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            last_login_at TEXT
        );
    `);
     db.run(`
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            action TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        );
    `);
    
    // Step 4: Perform schema migration to add new columns if they don't exist.
    const pragmaResult = db.exec("PRAGMA table_info(users);");
    if (pragmaResult?.[0]?.values) {
        const columns = pragmaResult[0].values.map((row: any[]) => row[1]);

        if (!columns.includes('is_active')) {
            console.log("Migrating database: adding 'is_active' column.");
            db.run("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL CHECK(is_active IN (0, 1)) DEFAULT 1;");
        }

        if (!columns.includes('is_admin')) {
            console.log("Migrating database: adding 'is_admin' column.");
            db.run("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL CHECK(is_admin IN (0, 1)) DEFAULT 0;");
        }
    } else {
        throw new Error("Could not inspect 'users' table schema after creation.");
    }
    
    // Step 5: Check if the users table is empty and seed if necessary.
    const userCountResult = db.exec("SELECT COUNT(*) FROM users;");
    if (userCountResult?.[0]?.values?.[0]?.[0] === 0) {
        console.log("Users table is empty, seeding database...");
        const adminUser = { username: 'admin', password_hash: 'password', isAdmin: true, isActive: true };
        const standardUser = { username: 'user', password_hash: 'password', isAdmin: false, isActive: true };
        createUser(adminUser);
        createUser(standardUser);
        console.log("Database seeded with default users.");
    }

    // Step 6: Save the final state to localStorage. This ensures the initial DB state or a newly seeded state gets saved.
    saveDatabase();
    
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};

/**
 * Helper to convert sql.js result set to an array of objects.
 * @param result The result from db.exec().
 * @returns An array of objects.
 */
const resultToObjectArray = (result: any[]): any[] => {
    if (!result || result.length === 0) return [];
    const columns = result[0].columns as string[];
    const values = result[0].values as any[][];
    return values.map((row: any[]) => {
        const obj: any = {};
        columns.forEach((col: string, i: number) => {
            obj[col] = row[i];
        });
        return obj;
    });
};

export const getAllUsers = (): MockDbUser[] => {
  if (!db) throw new Error("Database not initialized");
  const result = db.exec("SELECT * FROM users ORDER BY id ASC");
  return resultToObjectArray(result) as MockDbUser[];
};

export const findUserByUsername = (username: string): MockDbUser | null => {
    if (!db) throw new Error("Database not initialized");
    const stmt = db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(:username)");
    stmt.bind({ ':username': username });
    const user = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return user as MockDbUser | null;
};

export const updateUserLoginTime = (userId: number): void => {
    if (!db) throw new Error("Database not initialized");
    db.run("UPDATE users SET last_login_at = :timestamp WHERE id = :id", {
        ':timestamp': new Date().toISOString(),
        ':id': userId
    });
    saveDatabase();
};

export const createUser = (newUser: { username: string; password_hash: string; isAdmin: boolean; isActive: boolean }): MockDbUser => {
    if (!db) throw new Error("Database not initialized");
    const stmt = db.prepare('INSERT INTO users (username, password_hash, created_at, is_active, is_admin) VALUES (?, ?, ?, ?, ?)');
    stmt.run([newUser.username, newUser.password_hash, new Date().toISOString(), newUser.isActive ? 1 : 0, newUser.isAdmin ? 1 : 0]);
    stmt.free();

    const newId = db.exec("SELECT last_insert_rowid();")[0].values[0][0];
    const createdUserStmt = db.prepare("SELECT * FROM users WHERE id = ?");
    createdUserStmt.bind([newId]);
    const user = createdUserStmt.step() ? createdUserStmt.getAsObject() : null;
    createdUserStmt.free();
    if (!user) throw new Error("Failed to retrieve created user.");
    
    saveDatabase();
    return user as MockDbUser;
};

const getUpdatedUser = (userId: number): MockDbUser => {
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    stmt.bind([userId]);
    const user = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    if (!user) throw new Error(`User with id ${userId} not found after update.`);
    return user as MockDbUser;
};

export const toggleUserStatus = (userId: number): MockDbUser => {
    if (!db) throw new Error("Database not initialized");
    db.run('UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?', [userId]);
    const updatedUser = getUpdatedUser(userId);
    saveDatabase();
    return updatedUser;
};

export const toggleAdminStatus = (userId: number): MockDbUser => {
    if (!db) throw new Error("Database not initialized");
    db.run('UPDATE users SET is_admin = CASE WHEN is_admin = 1 THEN 0 ELSE 1 END WHERE id = ?', [userId]);
    const updatedUser = getUpdatedUser(userId);
    saveDatabase();
    return updatedUser;
};

export const deleteUser = (userId: number): void => {
    if (!db) throw new Error("Database not initialized");

    // Safety check: prevent deleting the last admin
    const userToDeleteStmt = db.prepare("SELECT * FROM users WHERE id = ?");
    userToDeleteStmt.bind([userId]);
    const user = userToDeleteStmt.step() ? userToDeleteStmt.getAsObject() : null;
    userToDeleteStmt.free();

    if (user && user.is_admin === 1) {
        const adminCountResult = db.exec("SELECT COUNT(*) FROM users WHERE is_admin = 1;");
        if (adminCountResult?.[0]?.values?.[0]?.[0] <= 1) {
            throw new Error("Cannot delete the last administrator.");
        }
    }

    db.run('DELETE FROM users WHERE id = ?', [userId]);
    saveDatabase();
};

// --- Activity Log Functions ---

export const addActivityLog = (user: string, action: string): void => {
    if (!db) throw new Error("Database not initialized");
    const stmt = db.prepare('INSERT INTO activity_log (user, action, timestamp) VALUES (?, ?, ?)');
    stmt.run([user, action, Date.now()]);
    stmt.free();
    saveDatabase();
};

export const getActivityLog = (): ActivityEntry[] => {
    if (!db) throw new Error("Database not initialized");
    const result = db.exec("SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 1000");
    return resultToObjectArray(result) as ActivityEntry[];
};
