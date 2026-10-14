const projectForm = document.getElementById('project-form');
const projectTitle = document.getElementById('project-title');
const projectStatus = document.getElementById('project-status');
const projectDate = document.getElementById('project-date');
const projectDescription = document.getElementById('project-description');
const projectIdField = document.getElementById('project-id');
const projectList = document.getElementById('project-list');
const formError = document.getElementById('form-error');
const cancelButton = document.getElementById('cancel-button');
const saveButton = document.getElementById('save-button');

async function fetchProjects() {
  const response = await fetch('/api/projects');
  if (!response.ok) {
    throw new Error('Unable to load projects.');
  }

  return response.json();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) {
    return 'No due date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No due date';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function renderProject(project) {
  const item = document.createElement('li');
  item.className = 'project-item';

  const dueValue = project.dueDate ? project.dueDate : '';
  const description = project.description || 'No notes added yet.';
  const status = project.status || 'planned';

  item.innerHTML = `
    <header>
      <h3 class="project-title">${escapeHtml(project.title)}</h3>
      <span class="badge">${escapeHtml(status)}</span>
    </header>
    <div class="project-meta">
      <span data-due-date="${escapeHtml(dueValue)}">Due: ${escapeHtml(formatDate(dueValue))}</span>
      <span>Created: ${escapeHtml(new Date(project.createdAt).toLocaleDateString())}</span>
    </div>
    <p>${escapeHtml(description)}</p>
    <div class="actions-row">
      <button type="button" class="edit-button" data-action="edit" data-id="${project.id}">Edit</button>
      <button type="button" class="delete-button" data-action="delete" data-id="${project.id}">Delete</button>
    </div>
  `;

  return item;
}

function updateList(projects) {
  projectList.innerHTML = '';

  if (!projects.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No projects yet. Add your first one above.';
    projectList.appendChild(empty);
    return;
  }

  for (const project of projects) {
    projectList.appendChild(renderProject(project));
  }
}

function setFormError(message) {
  formError.textContent = message || '';
}

function resetForm() {
  projectForm.reset();
  projectIdField.value = '';
  cancelButton.classList.add('hidden');
  saveButton.textContent = 'Save project';
  projectStatus.value = 'planned';
  setFormError('');
}

async function loadProjects() {
  try {
    const projects = await fetchProjects();
    updateList(projects);
  } catch (error) {
    setFormError(error.message);
  }
}

async function saveProject(event) {
  event.preventDefault();

  const payload = {
    title: projectTitle.value,
    description: projectDescription.value,
    status: projectStatus.value,
    dueDate: projectDate.value || null,
  };

  const id = projectIdField.value;
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/projects/${id}` : '/api/projects';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Unable to save project.');
    }

    resetForm();
    await loadProjects();
  } catch (error) {
    setFormError(error.message);
  }
}

async function deleteProject(projectId) {
  try {
    const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Unable to delete project.');
    }

    await loadProjects();
  } catch (error) {
    setFormError(error.message);
  }
}

function handleProjectListClick(event) {
  const target = event.target.closest('button');
  if (!target) {
    return;
  }

  const { id, action } = target.dataset;
  if (!id) {
    return;
  }

  if (action === 'delete') {
    deleteProject(id);
    return;
  }

  if (action === 'edit') {
    const item = target.closest('.project-item');
    const title = item.querySelector('.project-title')?.textContent || '';
    const status = item.querySelector('.badge')?.textContent || 'planned';
    const dueDate = item.querySelector('[data-due-date]')?.dataset.dueDate || '';
    const notes = item.querySelector('p')?.textContent || '';

    projectIdField.value = id;
    projectTitle.value = title;
    projectStatus.value = status.toLowerCase().replace(/\s+/g, '-');
    projectDate.value = dueDate;
    projectDescription.value = notes === 'No notes added yet.' ? '' : notes;
    cancelButton.classList.remove('hidden');
    saveButton.textContent = 'Update project';
    setFormError('');
  }
}

projectForm.addEventListener('submit', saveProject);
projectList.addEventListener('click', handleProjectListClick);
cancelButton.addEventListener('click', resetForm);

loadProjects();
