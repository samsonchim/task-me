import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

export type LocalTask = {
  id: string;
  title: string;
  duration: string; // "2h 30m 10s"
  importance: string;
  category: string;
  start_time: string; // "7:00 AM"
  reminder_every_mins?: number | null;
  created_at: string; // ISO
};

const STORAGE_KEY_WEB = 'taskme.tasks.v1';
const DB_NAME = 'taskme.db';
const TABLE = 'tasks';

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  // Good enough for local-only IDs.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type StoredShape = { tasks: LocalTask[] };

async function loadWeb(): Promise<StoredShape> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY_WEB);
  if (!raw) return { tasks: [] };
  try {
    const parsed = JSON.parse(raw) as StoredShape;
    return { tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [] };
  } catch {
    return { tasks: [] };
  }
}

async function saveWeb(shape: StoredShape) {
  await AsyncStorage.setItem(STORAGE_KEY_WEB, JSON.stringify(shape));
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function ensureColumnAsync(db: SQLite.SQLiteDatabase, column: string, definition: string) {
  const cols = (await db.getAllAsync(`PRAGMA table_info(${TABLE});`)) as any[];
  const has = cols.some((c) => String(c.name) === column);
  if (has) return;
  await db.execAsync(`ALTER TABLE ${TABLE} ADD COLUMN ${column} ${definition};`);
}

async function getDb() {
  if (Platform.OS === 'web') {
    throw new Error('SQLite is not available on web in this app.');
  }

  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS ${TABLE} (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          duration TEXT NOT NULL,
          importance TEXT NOT NULL,
          category TEXT NOT NULL,
          start_time TEXT NOT NULL,
          reminder_every_mins INTEGER,
          created_at TEXT NOT NULL
        );`
      );

      // Migrations (safe to run repeatedly)
      await ensureColumnAsync(db, 'reminder_every_mins', 'INTEGER');
      return db;
    })();
  }
  return dbPromise;
}

async function mapRowToTask(row: any): Promise<LocalTask> {
  return {
    id: String(row.id),
    title: String(row.title),
    duration: String(row.duration),
    importance: String(row.importance),
    category: String(row.category),
    start_time: String(row.start_time),
    reminder_every_mins:
      row.reminder_every_mins === null || row.reminder_every_mins === undefined
        ? null
        : Number(row.reminder_every_mins),
    created_at: String(row.created_at),
  };
}

export async function listTasks(): Promise<LocalTask[]> {
  if (Platform.OS === 'web') {
    const shape = await loadWeb();
    return shape.tasks;
  }

  const db = await getDb();
  const rows = await db.getAllAsync(`SELECT * FROM ${TABLE} ORDER BY created_at DESC;`);
  const out: LocalTask[] = [];
  for (const r of rows) out.push(await mapRowToTask(r));
  return out;
}

export async function addTask(input: Omit<LocalTask, 'id' | 'created_at'>): Promise<LocalTask> {
  const task: LocalTask = {
    ...input,
    id: createId(),
    created_at: nowIso(),
  };

  if (Platform.OS === 'web') {
    const shape = await loadWeb();
    shape.tasks.unshift(task);
    await saveWeb(shape);
    return task;
  }

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO ${TABLE} (id,title,duration,importance,category,start_time,reminder_every_mins,created_at) VALUES (?,?,?,?,?,?,?,?);`,
    [
      task.id,
      task.title,
      task.duration,
      task.importance,
      task.category,
      task.start_time,
      task.reminder_every_mins ?? null,
      task.created_at,
    ]
  );
  return task;
}

export async function removeTask(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    const shape = await loadWeb();
    shape.tasks = shape.tasks.filter((t) => t.id !== id);
    await saveWeb(shape);
    return;
  }

  const db = await getDb();
  await db.runAsync(`DELETE FROM ${TABLE} WHERE id = ?;`, [id]);
}

export async function replaceAllTasks(tasks: LocalTask[]): Promise<void> {
  if (Platform.OS === 'web') {
    await saveWeb({ tasks });
    return;
  }

  const db = await getDb();
  await db.execAsync(`DELETE FROM ${TABLE};`);
  for (const task of tasks) {
    await db.runAsync(
      `INSERT INTO ${TABLE} (id,title,duration,importance,category,start_time,reminder_every_mins,created_at) VALUES (?,?,?,?,?,?,?,?);`,
      [
        task.id,
        task.title,
        task.duration,
        task.importance,
        task.category,
        task.start_time,
        task.reminder_every_mins ?? null,
        task.created_at,
      ]
    );
  }
}
