const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbDirectory = path.join(__dirname, 'data');
const dbPath = process.env.PROJECTS_DB_PATH || path.join(dbDirectory, 'projects.db');

fs.mkdirSync(dbDirectory, { recursive: true });

const db = new DatabaseSync(dbPath);

function mapProject(row) {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    status: row.status || 'planned',
    dueDate: row.due_date || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

function normalizeProjectPayload(rawInput = {}) {
  const payload = rawInput && typeof rawInput === 'object' ? rawInput : {};
  const title = String(payload.title ?? payload.name ?? payload.projectName ?? '').trim();
  const description = String(payload.description ?? '').trim();
  const status = String(payload.status ?? payload.progress ?? payload.state ?? 'planned').trim() || 'planned';
  const dueDateValue = payload.dueDate ?? payload.deadline ?? payload.date ?? null;

  let dueDate = null;
  if (dueDateValue !== null && dueDateValue !== undefined && String(dueDateValue).trim() !== '') {
    const date = new Date(dueDateValue);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Project due date is invalid.');
    }
    dueDate = date.toISOString().slice(0, 10);
  }

  return { title, description, status, dueDate };
}

function validateProjectPayload(payload) {
  if (!payload.title) {
    throw new Error('Project title is required.');
  }

  if (!payload.status) {
    throw new Error('Project status is required.');
  }
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      due_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  return true;
}

function getProjects() {
  const rows = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  return rows.map(mapProject);
}

function getProjectById(projectId) {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  return mapProject(row);
}

function createProject(rawInput = {}) {
  const normalized = normalizeProjectPayload(rawInput);
  validateProjectPayload(normalized);

  const now = new Date().toISOString();
  const statement = db.prepare(
    'INSERT INTO projects (title, description, status, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)' 
  );
  const result = statement.run(
    normalized.title,
    normalized.description,
    normalized.status,
    normalized.dueDate,
    now,
    now
  );

  return getProjectById(result.lastInsertRowid);
}

function updateProject(projectId, rawInput = {}) {
  const normalized = normalizeProjectPayload(rawInput);
  validateProjectPayload(normalized);

  const result = db.prepare(
    'UPDATE projects SET title = ?, description = ?, status = ?, due_date = ?, updated_at = ? WHERE id = ?'
  ).run(
    normalized.title,
    normalized.description,
    normalized.status,
    normalized.dueDate,
    new Date().toISOString(),
    projectId
  );

  if (result.changes === 0) {
    return null;
  }

  return getProjectById(projectId);
}

function deleteProject(projectId) {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  return result.changes > 0;
}

module.exports = {
  db,
  initDatabase,
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  normalizeProjectPayload,
  validateProjectPayload,
};
