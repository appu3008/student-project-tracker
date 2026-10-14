
const projectForm = document.getElementById('project-form');
const nameInput = document.getElementById('name');
const statusInput = document.getElementById('status');
const projectList = document.getElementById('project-list');
const emptyState = document.getElementById('empty-state');
const message = document.getElementById('message');
const saveButton = document.getElementById('save-button');
const cancelButton = document.getElementById('cancel-button');

const STORAGE_KEY = 'workshop-projects-v1';

let projects = [];
let editingId = null;
let nextId = 1;
let storageReady = false;

function showMessage(text) {
  message.textContent = text;
}

function isValidProjects(data) {
  if (!Array.isArray(data)) return false;

  const ids = new Set();

  return data.every(project => {
    if (
      !project ||
      typeof project.id !== 'string' ||
      !project.id ||
      typeof project.name !== 'string' ||
      typeof project.status !== 'string' ||
      !['Planned', 'In Progress', 'Completed'].includes(project.status) ||
      ids.has(project.id)
    ) return false;

    ids.add(project.id);
    return true;
  });
}

function loadProjects() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
      projects = [];
    } else {
      const parsed = JSON.parse(saved);

      if (!isValidProjects(parsed)) {
        showMessage('Saved data is invalid. Existing storage was not changed.');
        return;
      }

      projects = parsed;
    }

    nextId = projects.reduce((max, project) => {
      const match = /^p(\d+)$/.exec(project.id);
      return match ? Math.max(max, Number(match[1]) + 1) : max;
    }, 1);

    storageReady = true;
    renderProjects();
    showMessage('');
  } catch (error) {
    showMessage('Could not load projects from browser storage.');
    console.error(error);
  }
}

function saveProjects() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch (error) {
    showMessage('Could not save projects to browser storage.');
    console.error(error);
    return false;
  }
}

function renderProjects() {
  projectList.replaceChildren();
  emptyState.hidden = projects.length > 0;

  projects.forEach(project => {
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
    editButton.dataset.id = project.id;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.id = project.id;

    actions.append(editButton, deleteButton);
    item.append(title, status, actions);
    projectList.appendChild(item);
  });
}

function resetForm() {
  projectForm.reset();
  editingId = null;
  saveButton.textContent = 'Save Project';
  cancelButton.hidden = true;
}

function startEditing(id) {
  const project = projects.find(item => item.id === id);

  if (!project) {
    showMessage('Project not found.');
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

projectForm.addEventListener('submit', event => {
  event.preventDefault();

  if (!storageReady) {
    showMessage('Projects could not be loaded safely. No changes made.');
    return;
  }

  const name = nameInput.value.trim();
  const status = statusInput.value;

  if (!name) {
    showMessage('Please enter a project name.');
    nameInput.focus();
    return;
  }

  const wasEditing = editingId !== null;
  const previousProjects = projects.map(project => ({ ...project }));
  const previousNextId = nextId;

  if (wasEditing) {
    const project = projects.find(item => item.id === editingId);

    if (!project) {
      showMessage('Project not found.');
      resetForm();
      return;
    }

    project.name = name;
    project.status = status;
  } else {
    projects.push({ id: `p${nextId++}`, name, status });
  }

  if (!saveProjects()) {
    projects = previousProjects;
    nextId = previousNextId;
    renderProjects();
    return;
  }

  renderProjects();
  resetForm();
  showMessage(wasEditing ? 'Project updated and saved.' : 'Project added and saved.');
});

projectList.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button || !projectList.contains(button)) return;

  const { id, action } = button.dataset;

  if (action === 'edit') {
    startEditing(id);
    return;
  }

  if (action === 'delete') {
    const project = projects.find(item => item.id === id);
    if (!project) return;

    if (!window.confirm(`Delete "${project.name}"?`)) return;

    const previousProjects = projects;
    projects = projects.filter(item => item.id !== id);

    if (!saveProjects()) {
      projects = previousProjects;
      renderProjects();
      return;
    }

    if (editingId === id) resetForm();

    renderProjects();
    showMessage('Project deleted and saved.');
  }
});

cancelButton.addEventListener('click', () => {
  resetForm();
  showMessage('Edit cancelled. No changes were saved.');
});

loadProjects();
