/* =============================================
   LIFE DASHBOARD — app.js
   Features:
   ✅ Greeting + Clock + Date
   ✅ Custom name (saved in localStorage)
   ✅ Dark / Light mode toggle
   ✅ To-Do List (add, edit, delete, done, save)
   ✅ Prevent duplicate tasks
   ✅ Sort tasks A-Z / Z-A
   ✅ Focus Timer (adjustable duration)
   ✅ Quick Links (add, delete, save)
============================================= */

// ===== STORAGE HELPERS =====
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const load = (key, fallback) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : fallback;
};

// ===== STATE =====
let tasks = load('tasks', []);
let links = load('links', []);
let isDark = load('darkMode', false);
let userName = load('userName', '');
let sortAsc = true;
let editIndex = null;

// Timer state
let timerInterval = null;
let timerRunning = false;
let timerSeconds = 25 * 60;

// ===== DOM REFS =====
const greetingText = document.getElementById('greeting-text');
const greetingName = document.getElementById('greeting-name');
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date-display');

const todoInput = document.getElementById('todo-input');
const addTodoBtn = document.getElementById('add-todo-btn');
const todoList = document.getElementById('todo-list');
const todoEmpty = document.getElementById('todo-empty');
const sortBtn = document.getElementById('sort-btn');

const timerDisplay = document.getElementById('timer-display');
const timerDuration = document.getElementById('timer-duration');
const timerStart = document.getElementById('timer-start');
const timerStop = document.getElementById('timer-stop');
const timerReset = document.getElementById('timer-reset');

const linkName = document.getElementById('link-name');
const linkUrl = document.getElementById('link-url');
const addLinkBtn = document.getElementById('add-link-btn');
const linksContainer = document.getElementById('links-container');
const linksEmpty = document.getElementById('links-empty');

const themeToggle = document.getElementById('theme-toggle');
const nameModal = document.getElementById('name-modal');
const nameInput = document.getElementById('name-input');
const nameSaveBtn = document.getElementById('name-save-btn');
const editModal = document.getElementById('edit-modal');
const editInput = document.getElementById('edit-input');
const editSaveBtn = document.getElementById('edit-save-btn');
const editCancelBtn = document.getElementById('edit-cancel-btn');

// ===== GREETING & CLOCK =====
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${h}:${m}:${s}`;

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const day = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  dateEl.textContent = `${day}, ${date} ${month} ${year}`;

  const hour = now.getHours();
  if (hour >= 5 && hour < 12) {
    greetingText.textContent = 'Good morning,';
  } else if (hour >= 12 && hour < 17) {
    greetingText.textContent = 'Good afternoon,';
  } else if (hour >= 17 && hour < 21) {
    greetingText.textContent = 'Good evening,';
  } else {
    greetingText.textContent = 'Good night,';
  }
}

// ===== CUSTOM NAME =====
function initName() {
  if (userName) {
    greetingName.textContent = userName + '!';
  } else {
    nameModal.classList.remove('hidden');
  }
}

nameSaveBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) return;
  userName = name;
  save('userName', userName);
  greetingName.textContent = userName + '!';
  nameModal.classList.add('hidden');
});

nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') nameSaveBtn.click();
});

// ===== DARK MODE =====
function applyTheme() {
  if (isDark) {
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️';
  } else {
    document.body.classList.remove('dark');
    themeToggle.textContent = '🌙';
  }
}

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  save('darkMode', isDark);
  applyTheme();
});

// ===== TO-DO LIST =====
function renderTasks() {
  todoList.innerHTML = '';
  if (tasks.length === 0) {
    todoEmpty.style.display = 'block';
    return;
  }
  todoEmpty.style.display = 'none';

  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (task.done ? ' done' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', 'Mark task done');
    checkbox.addEventListener('change', () => toggleTask(index));

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.addEventListener('click', () => openEditModal(index));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.textContent = '🗑️';
    delBtn.setAttribute('aria-label', 'Delete task');
    delBtn.addEventListener('click', () => deleteTask(index));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);
    todoList.appendChild(li);
  });
}

function addTask() {
  const text = todoInput.value.trim();
  if (!text) return;

  // Prevent duplicate tasks (case-insensitive)
  const duplicate = tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
  if (duplicate) {
    todoInput.style.borderColor = 'var(--danger)';
    todoInput.placeholder = 'Task already exists!';
    setTimeout(() => {
      todoInput.style.borderColor = '';
      todoInput.placeholder = 'Add a new task...';
    }, 1800);
    return;
  }

  tasks.push({ text, done: false });
  save('tasks', tasks);
  todoInput.value = '';
  renderTasks();
}

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  save('tasks', tasks);
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  save('tasks', tasks);
  renderTasks();
}

function openEditModal(index) {
  editIndex = index;
  editInput.value = tasks[index].text;
  editModal.classList.remove('hidden');
  editInput.focus();
}

editSaveBtn.addEventListener('click', () => {
  const newText = editInput.value.trim();
  if (!newText || editIndex === null) return;

  const duplicate = tasks.some((t, i) => i !== editIndex && t.text.toLowerCase() === newText.toLowerCase());
  if (duplicate) {
    editInput.style.borderColor = 'var(--danger)';
    return;
  }

  tasks[editIndex].text = newText;
  save('tasks', tasks);
  editModal.classList.add('hidden');
  editIndex = null;
  renderTasks();
});

editCancelBtn.addEventListener('click', () => {
  editModal.classList.add('hidden');
  editIndex = null;
});

editInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') editSaveBtn.click();
  if (e.key === 'Escape') editCancelBtn.click();
});

// Sort A-Z / Z-A
sortBtn.addEventListener('click', () => {
  tasks.sort((a, b) => {
    const cmp = a.text.localeCompare(b.text);
    return sortAsc ? cmp : -cmp;
  });
  sortAsc = !sortAsc;
  sortBtn.textContent = sortAsc ? '⇅ Sort A–Z' : '⇅ Sort Z–A';
  save('tasks', tasks);
  renderTasks();
});

addTodoBtn.addEventListener('click', addTask);
todoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

// ===== FOCUS TIMER =====
function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timerSeconds);
}

timerStart.addEventListener('click', () => {
  if (timerRunning) return;
  timerRunning = true;
  timerDisplay.classList.add('running');
  timerDisplay.classList.remove('finished');

  timerInterval = setInterval(() => {
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.classList.remove('running');
      timerDisplay.classList.add('finished');
      timerDisplay.textContent = 'Done! 🎉';
      return;
    }
    timerSeconds--;
    updateTimerDisplay();
  }, 1000);
});

timerStop.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  timerDisplay.classList.remove('running');
});

timerReset.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = parseInt(timerDuration.value) * 60 || 25 * 60;
  timerDisplay.classList.remove('running', 'finished');
  updateTimerDisplay();
});

timerDuration.addEventListener('change', () => {
  if (!timerRunning) {
    timerSeconds = parseInt(timerDuration.value) * 60 || 25 * 60;
    updateTimerDisplay();
  }
});

// ===== QUICK LINKS =====
function renderLinks() {
  linksContainer.innerHTML = '';
  if (links.length === 0) {
    linksEmpty.style.display = 'block';
    return;
  }
  linksEmpty.style.display = 'none';

  links.forEach((link, index) => {
    const chip = document.createElement('div');
    chip.className = 'link-chip';

    const a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = link.name;

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete-link';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', 'Remove link');
    delBtn.addEventListener('click', () => {
      links.splice(index, 1);
      save('links', links);
      renderLinks();
    });

    chip.appendChild(a);
    chip.appendChild(delBtn);
    linksContainer.appendChild(chip);
  });
}

function addLink() {
  const name = linkName.value.trim();
  let url = linkUrl.value.trim();
  if (!name || !url) return;

  // Auto-add https:// if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  links.push({ name, url });
  save('links', links);
  linkName.value = '';
  linkUrl.value = '';
  renderLinks();
}

addLinkBtn.addEventListener('click', addLink);
linkUrl.addEventListener('keydown', e => {
  if (e.key === 'Enter') addLink();
});

// ===== INIT =====
function init() {
  applyTheme();
  initName();
  updateClock();
  setInterval(updateClock, 1000);
  updateTimerDisplay();
  renderTasks();
  renderLinks();
}

init();