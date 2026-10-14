const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'data', 'test-projects.db');
process.env.PROJECTS_DB_PATH = dbPath;

const { startServer } = require('../app');
const { db } = require('../database');

let server;
let baseUrl;

test.before(async () => {
  server = await startServer(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
  db.exec('DELETE FROM projects');
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  db.close();
  fs.rmSync(dbPath, { force: true });
});

test('health endpoint is available', { concurrency: false }, async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.status, 'healthy');
});

test('create project validates required title and persists project', { concurrency: false }, async () => {
  const invalidResponse = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '', description: 'Missing title', status: 'planned' }),
  });

  assert.equal(invalidResponse.status, 400);

  const validResponse = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Portfolio rewrite', description: 'New portfolio', status: 'in-progress', dueDate: '2026-12-01' }),
  });

  assert.equal(validResponse.status, 201);
  const project = await validResponse.json();
  assert.equal(project.title, 'Portfolio rewrite');
  assert.equal(project.status, 'in-progress');
  assert.ok(project.id);
});

test('update and delete project work', { concurrency: false }, async () => {
  const createResponse = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Capstone plan', description: 'Initial plan', status: 'planned' }),
  });

  const created = await createResponse.json();
  const updateResponse = await fetch(`${baseUrl}/api/projects/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Capstone plan', description: 'Updated plan', status: 'completed', dueDate: '2026-10-30' }),
  });

  assert.equal(updateResponse.status, 200);
  const updated = await updateResponse.json();
  assert.equal(updated.description, 'Updated plan');
  assert.equal(updated.status, 'completed');

  const deleteResponse = await fetch(`${baseUrl}/api/projects/${created.id}`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 204);
});
