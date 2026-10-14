# Student Project Tracker

This project is a lightweight project tracker for student work. It includes a browser interface, a REST API, and SQLite-backed persistence.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000 to manage projects.

## Storage

The application stores project records in a SQLite database at `data/projects.db`. Data survives a server restart as long as the project directory remains intact. Browser refreshes do not clear the server-side database, although browser tab data is separate from server-state storage.

## Validation and persistence

The API validates required project details before saving and supports create, update, list, and delete operations for project records.

## Verify

```bash
npm test
```
