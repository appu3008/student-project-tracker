const path = require('path');
const express = require('express');

const {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  initDatabase,
} = require('./database');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', async (req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await getProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load projects.' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const project = await createProject(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Unable to create project.' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const project = await updateProject(req.params.id, req.body);

    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Unable to update project.' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const deleted = await deleteProject(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message || 'Unable to delete project.' });
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer(port = Number(process.env.PORT || 3000)) {
  await initDatabase();
  return new Promise((resolve) => {
    const listener = app.listen(port, () => {
      console.log(`Open http://localhost:${port}`);
      resolve(listener);
    });
  });
}

module.exports = {
  app,
  startServer,
};

if (require.main === module) {
  startServer();
}
