import * as SQLite from 'expo-sqlite';

export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface Goal {
  id: number;
  title: string;
  target_value: number;
  current_value: number;
  unit: string | null;
  deadline: string | null;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  reflection: string | null;
  goal_id: number | null;
  created_at: string;
  completed_at: string | null;
  goal_title?: string | null;
}

export interface CreateGoalInput {
  title: string;
  target_value: number;
  current_value?: number;
  unit?: string | null;
  deadline?: string | null;
}

export interface UpdateGoalInput {
  title?: string;
  target_value?: number;
  current_value?: number;
  unit?: string | null;
  deadline?: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  goal_id?: number | null;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  goal_id?: number | null;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync('tasks_goals.db');
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      target_value REAL NOT NULL,
      current_value REAL NOT NULL DEFAULT 0,
      unit TEXT,
      deadline TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'not_started',
      reflection TEXT,
      goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );
  `);

  dbInstance = db;
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  await getDatabase();
}

// ---------------- Goals CRUD ----------------

export async function getGoals(): Promise<Goal[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Goal>(
    'SELECT * FROM goals ORDER BY id DESC;'
  );
}

export async function getGoalById(id: number): Promise<Goal | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Goal>(
    'SELECT * FROM goals WHERE id = ?;',
    [id]
  );
  return row ?? null;
}

export async function createGoal(data: CreateGoalInput): Promise<number> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO goals (title, target_value, current_value, unit, deadline, created_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      data.title.trim(),
      data.target_value,
      data.current_value ?? 0,
      data.unit?.trim() || null,
      data.deadline?.trim() || null,
      createdAt,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateGoal(id: number, data: UpdateGoalInput): Promise<void> {
  const db = await getDatabase();
  const existing = await getGoalById(id);
  if (!existing) {
    throw new Error(`Цель с id ${id} не найдена`);
  }

  const title = data.title !== undefined ? data.title.trim() : existing.title;
  const targetValue = data.target_value !== undefined ? data.target_value : existing.target_value;
  const currentValue = data.current_value !== undefined ? data.current_value : existing.current_value;
  const unit = data.unit !== undefined ? (data.unit?.trim() || null) : existing.unit;
  const deadline = data.deadline !== undefined ? (data.deadline?.trim() || null) : existing.deadline;

  await db.runAsync(
    `UPDATE goals
     SET title = ?, target_value = ?, current_value = ?, unit = ?, deadline = ?
     WHERE id = ?;`,
    [title, targetValue, currentValue, unit, deadline, id]
  );
}

export async function addGoalProgress(id: number, delta: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE goals
     SET current_value = current_value + ?
     WHERE id = ?;`,
    [delta, id]
  );
}

export async function deleteGoal(id: number): Promise<void> {
  const db = await getDatabase();
  // We can detach tasks or rely on ON DELETE SET NULL
  await db.runAsync('UPDATE tasks SET goal_id = NULL WHERE goal_id = ?;', [id]);
  await db.runAsync('DELETE FROM goals WHERE id = ?;', [id]);
}

export async function getTasksByGoalId(goalId: number): Promise<Task[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Task>(
    `SELECT tasks.*, goals.title AS goal_title
     FROM tasks
     LEFT JOIN goals ON tasks.goal_id = goals.id
     WHERE tasks.goal_id = ?
     ORDER BY tasks.id DESC;`,
    [goalId]
  );
}

// ---------------- Tasks CRUD ----------------

export async function getTasks(filter?: 'all' | TaskStatus): Promise<Task[]> {
  const db = await getDatabase();
  if (filter && filter !== 'all') {
    return await db.getAllAsync<Task>(
      `SELECT tasks.*, goals.title AS goal_title
       FROM tasks
       LEFT JOIN goals ON tasks.goal_id = goals.id
       WHERE tasks.status = ?
       ORDER BY tasks.id DESC;`,
      [filter]
    );
  }

  return await db.getAllAsync<Task>(
    `SELECT tasks.*, goals.title AS goal_title
     FROM tasks
     LEFT JOIN goals ON tasks.goal_id = goals.id
     ORDER BY tasks.id DESC;`
  );
}

export async function getTaskById(id: number): Promise<Task | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Task>(
    `SELECT tasks.*, goals.title AS goal_title
     FROM tasks
     LEFT JOIN goals ON tasks.goal_id = goals.id
     WHERE tasks.id = ?;`,
    [id]
  );
  return row ?? null;
}

export async function createTask(data: CreateTaskInput): Promise<number> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  const status = data.status || 'not_started';
  const result = await db.runAsync(
    `INSERT INTO tasks (title, description, status, goal_id, created_at)
     VALUES (?, ?, ?, ?, ?);`,
    [
      data.title.trim(),
      data.description?.trim() || null,
      status,
      data.goal_id ?? null,
      createdAt,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateTask(id: number, data: UpdateTaskInput): Promise<void> {
  const db = await getDatabase();
  const existing = await getTaskById(id);
  if (!existing) {
    throw new Error(`Задача с id ${id} не найдена`);
  }

  const title = data.title !== undefined ? data.title.trim() : existing.title;
  const description = data.description !== undefined ? (data.description?.trim() || null) : existing.description;
  const goalId = data.goal_id !== undefined ? data.goal_id : existing.goal_id;

  await db.runAsync(
    `UPDATE tasks
     SET title = ?, description = ?, goal_id = ?
     WHERE id = ?;`,
    [title, description, goalId, id]
  );
}

export async function updateTaskStatus(
  id: number,
  status: TaskStatus,
  reflection?: string | null
): Promise<void> {
  const db = await getDatabase();
  if (status === 'completed') {
    const completedAt = new Date().toISOString();
    await db.runAsync(
      `UPDATE tasks
       SET status = ?, completed_at = ?, reflection = COALESCE(?, reflection)
       WHERE id = ?;`,
      [status, completedAt, reflection !== undefined ? reflection : null, id]
    );
  } else {
    await db.runAsync(
      `UPDATE tasks
       SET status = ?, completed_at = NULL
       WHERE id = ?;`,
      [status, id]
    );
  }
}

export async function updateTaskReflection(id: number, reflection: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE tasks
     SET reflection = ?
     WHERE id = ?;`,
    [reflection, id]
  );
}

export async function deleteTask(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM tasks WHERE id = ?;', [id]);
}
