
# Student Project Tracker

A hands-on web development project for adding, displaying, editing, and deleting student engineering projects. Project records are stored in a local SQLite database.

## Requirements

- Node.js 22.18.x
- npm
- Git
- Visual Studio Code (recommended)

## Run Locally

Open a terminal in the project directory and run:

```bash
nvm use 22.18.0
DB_FILE=data/workshop-projects.db npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Stop the server with `Ctrl+C`.

## How It Works

Browser HTML/CSS/JavaScript → HTTP requests using `fetch()` → Express API → SQLite database → JSON response → updated page.

## Project Files

- `public/index.html` — Page structure and form.
- `public/style.css` — Appearance and responsive layout.
- `public/script.js` — API requests, input handling, rendering, and feedback.
- `server.js` — Starts the server.
- `app.js` — API routes, validation, and responses.
- `database.js` — SQLite database operations.
- `test/crud.test.js` — Automated API tests.

## API Endpoints

- `GET /api/health` — Checks server health.
- `GET /api/projects` — Lists projects.
- `POST /api/projects` — Creates a project.
- `PUT /api/projects/:id` — Updates a project.
- `DELETE /api/projects/:id` — Deletes a project.

## Verification

- Automated API test: Passed (1 test reported by `npm test`).
- Browser CRUD checks: Not yet fully confirmed.
- Restart and persistence checks: Record your observed result.
- Failure recovery and mobile layout: Record your observed result.

Run the automated test using:

```bash
npm test
```

The API test uses a temporary database. It does not prove that every browser interaction works.

## Workshop Limitations

This is a local teaching application without sign-in or per-user permissions. Users accessing the same server share its project collection.

The SQLite database files and `node_modules` should remain local and should not be uploaded to GitHub.

Cloud hosting requires separate server and database configuration.
