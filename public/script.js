
const projectForm = document.getElementById('project-form');
const nameInput = document.getElementById('name');
const statusInput = document.getElementById('status');
const projectList = document.getElementById('project-list');
const emptyState = document.getElementById('empty-state');
const message = document.getElementById('message');
const saveButton = document.getElementById('save-button');
const cancelButton = document.getElementById('cancel-button');

let projects = [];
let editingId = null;
let apiReady = false;
let loading = false;
let saving = false;

function showMessage(text) {
  message.textContent = text;
}

async function apiRequest(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Network error. Check that the server is running.');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || `Request failed with status ${response.status}.`
    );
  }

  return data;
}

function updateControls() {
  saveButton.disabled = loading || saving;
  cancelButton.disabled = loading || saving;
  projectList.querySelectorAll('button').forEach(button => {
    button.disabled = loading || saving;
  });
}

function renderProjects() {
  projectList.replaceChildren();

  if (!apiReady || loading) {
    emptyState.hidden = true;
    return;
  }

  emptyState.hidden = projects.length > 0;

  for (const project of projects) {
    const item = document.createElement('li');
    item.className = 'project-item';

    const title = document.createElement('h3');
    title.textContent = project.name;

    const status = document.createElement('p');
    status.textContent = `Status: ${project.status}`;

    const actions = document.createElement('div');
    actions.className = 'actions-row';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'Edit';
    editButton.dataset.action = 'edit';
    editButton.dataset.id = String(project.id);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.id = String(project.id);

    actions.append(editButton, deleteButton);
    item.append(title, status, actions);
    projectList.appendChild(item);
  }

  updateControls();
}

async function loadProjects({ showLoading = true } = {}) {
  loading = showLoading;
  if (loading) {
    showMessage('Loading projects...');
    renderProjects();
    updateControls();
  }

  try {
    const data = await apiRequest('/api/projects');

    if (!Array.isArray(data)) {
      throw new Error('The server returned an invalid project list.');
    }

    projects = data;
    apiReady = true;

    if (editingId !== null &&
        !projects.some(project => String(project.id) === String(editingId))) {
      resetForm();
      showMessage('The project being edited no longer exists.');
    }

    renderProjects();
    if (showLoading) {
      showMessage(projects.length ? 'Projects loaded.' : 'No projects yet.');
    }

    return true;
  } catch (error) {
    apiReady = false;
    emptyState.hidden = true;
    projectList.replaceChildren();
    showMessage(`Could not load projects: ${error.message}`);
    return false;
  } finally {
    loading = false;
    updateControls();
  }
}

function resetForm() {
  projectForm.reset();
  editingId = null;
  saveButton.textContent = 'Save Project';
  cancelButton.hidden = true;
}

function startEditing(id) {
  const project = projects.find(item => String(item.id) === id);

  if (!project) {
    showMessage('Project not found. Reloading projects...');
    loadProjects();
    return;
  }

  editingId = project.id;
  nameInput.value = project.name;
  statusInput.value = project.status;
  saveButton.textContent = 'Save changes';
  cancelButton.hidden = false;
  showMessage('Editing project.');
  nameInput.focus();
}

projectForm.addEventListener('submit', async event => {
  event.preventDefault();

  if (saving || loading) return;

  if (!apiReady) {
    showMessage('Projects are not available. Try reloading first.');
    await loadProjects();
    return;
  }

  const name = nameInput.value.trim();
  const status = statusInput.value;
  const wasEditing = editingId !== null;
  const targetId = editingId;

  if (!name || name.length > 80) {
    showMessage('Enter a project name between 1 and 80 characters.');
    nameInput.focus();
    return;
  }

  if (!['Planned', 'In Progress', 'Completed'].includes(status)) {
    showMessage('Please select a valid project status.');
    return;
  }

  saving = true;
  updateControls();
  showMessage(wasEditing ? 'Saving changes...' : 'Adding project...');

  try {
    const payload = { name, status };
    const url = wasEditing
      ? `/api/projects/${encodeURIComponent(targetId)}`
      : '/api/projects';

    await apiRequest(url, {
      method: wasEditing ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });

    if (wasEditing) {
      resetForm();
    } else {
      projectForm.reset();
    }

    showMessage(
      wasEditing
        ? 'Project saved. Refreshing project list...'
        : 'Project added. Refreshing project list...'
    );

    const loaded = await loadProjects({ showLoading: false });

    if (loaded) {
      showMessage(
        wasEditing
          ? 'Project saved successfully.'
          : 'Project added successfully.'
      );
    } else {
      showMessage(
        'The change was saved, but the project list could not reload. Try refreshing.'
      );
    }
  } catch (error) {
    showMessage(`Could not save project: ${error.message}`);
  } finally {
    saving = false;
    updateControls();
  }
});

projectList.addEventListener('click', async event => {
  const button = event.target.closest('button[data-action]');
  if (!button || !projectList.contains(button) || saving || loading) return;

  const { id, action } = button.dataset;

  if (action === 'edit') {
    startEditing(id);
    return;
  }

  if (action !== 'delete') return;

  const project = projects.find(item => String(item.id) === id);
  if (!project) return;

  if (!window.confirm(`Delete "${project.name}"?`)) return;

  saving = true;
  updateControls();
  showMessage('Deleting project...');

  try {
    await apiRequest(`/api/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (String(editingId) === id) {
      resetForm();
    }

    const loaded = await loadProjects({ showLoading: false });

    showMessage(
      loaded
        ? 'Project deleted successfully.'
        : 'Project deleted, but the list could not reload. Try refreshing.'
    );
  } catch (error) {
    showMessage(`Could not delete project: ${error.message}`);
  } finally {
    saving = false;
    updateControls();
  }
});

cancelButton.addEventListener('click', () => {
  if (saving || loading) return;
  resetForm();
  showMessage('Edit cancelled.');
});

loadProjects();
