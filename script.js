// ===== STORAGE =====
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const load = (key, fallback) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : fallback;
};

// ===== STATE =====
let tasks       = load('tasks', []);
let links       = load('links', []);
let isDark      = load('darkMode', false);
let userName    = load('userName', '');
let totalPoints = load('totalPoints', 0);
let sortAsc     = true;
let editIndex   = null;

let timerInterval = null;
let timerRunning  = false;
let timerSeconds  = 25 * 60;

// ===== DOM =====
const greetingText  = document.getElementById('greeting-text');
const greetingName  = document.getElementById('greeting-name');
const clockEl       = document.getElementById('clock');
const dateEl        = document.getElementById('date-display');
const pointsDisplay = document.getElementById('points-display');

const todoInput  = document.getElementById('todo-input');
const addTodoBtn = document.getElementById('add-todo-btn');
const todoList   = document.getElementById('todo-list');
const todoEmpty  = document.getElementById('todo-empty');
const sortBtn    = document.getElementById('sort-btn');

const timerDisplay  = document.getElementById('timer-display');
const timerDuration = document.getElementById('timer-duration');
const timerStart    = document.getElementById('timer-start');
const timerStop     = document.getElementById('timer-stop');
const timerReset    = document.getElementById('timer-reset');

const linkName       = document.getElementById('link-name');
const linkUrl        = document.getElementById('link-url');
const addLinkBtn     = document.getElementById('add-link-btn');
const linksContainer = document.getElementById('links-container');
const linksEmpty     = document.getElementById('links-empty');

const themeToggle   = document.getElementById('theme-toggle');
const nameModal     = document.getElementById('name-modal');
const nameInput     = document.getElementById('name-input');
const nameSaveBtn   = document.getElementById('name-save-btn');
const editModal     = document.getElementById('edit-modal');
const editInput     = document.getElementById('edit-input');
const editSaveBtn   = document.getElementById('edit-save-btn');
const editCancelBtn = document.getElementById('edit-cancel-btn');

// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');

  clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  const hour = now.getHours();
  greetingText.textContent =
    hour >= 5  && hour < 12 ? 'Good morning,'  :
    hour >= 12 && hour < 17 ? 'Good afternoon,' :
    hour >= 17 && hour < 21 ? 'Good evening,'  : 'Good night,';
}

// ===== NAME =====
function initName() {
  if (userName) {
    greetingName.textContent = userName + '!';
  } else {
    nameModal.classList.remove('hidden');
  }
}

function openNameModal() {
  nameInput.value = userName;
  nameModal.querySelector('h2').textContent = userName ? 'Change your name?' : 'Welcome to your Dashboard!';
  nameModal.querySelector('p').textContent  = userName ? 'Enter a new name below.' : "What's your name?";
  nameModal.classList.remove('hidden');
  setTimeout(() => nameInput.focus(), 50);
}

function saveName() {
  const name = nameInput.value.trim();
  if (!name) return;
  userName = name;
  save('userName', userName);
  greetingName.textContent = userName + '!';
  nameModal.classList.add('hidden');
}

greetingName.addEventListener('click', openNameModal);
nameSaveBtn.addEventListener('click', saveName);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); });

// ===== THEME =====
function applyTheme() {
  document.body.classList.toggle('dark', isDark);
  themeToggle.textContent = isDark ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  save('darkMode', isDark);
  applyTheme();
});

// ===== POINTS =====
function calcPoints() {
  return Math.max(5, Math.ceil((parseInt(timerDuration.value) || 25) / 10) * 5);
}

function renderPoints() {
  pointsDisplay.textContent = totalPoints;
}

// ===== TASKS =====
function getSortedTasks() {
  const priority = tasks.filter(t => t.priority && !t.done);
  const rest     = tasks.filter(t => !t.priority || t.done);
  return [...priority, ...rest];
}

function renderTasks() {
  todoList.innerHTML = '';
  todoEmpty.style.display = tasks.length === 0 ? 'block' : 'none';
  if (tasks.length === 0) return;

  getSortedTasks().forEach(task => {
    const index = tasks.indexOf(task);

    const li = document.createElement('li');
    li.className = ['todo-item', task.done && 'done', task.priority && !task.done && 'priority']
      .filter(Boolean).join(' ');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', 'Mark task done');
    checkbox.addEventListener('change', () => toggleTask(index));

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    const starBtn = document.createElement('button');
    starBtn.className = 'btn-star' + (task.priority ? ' active' : '');
    starBtn.textContent = '★';
    starBtn.setAttribute('aria-label', task.priority ? 'Remove priority' : 'Set priority');
    starBtn.addEventListener('click', () => togglePriority(index));

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

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    actions.append(starBtn, editBtn, delBtn);

    li.append(checkbox, span, actions);
    todoList.appendChild(li);
  });
}

function addTask() {
  const text = todoInput.value.trim();
  if (!text) return;

  if (tasks.some(t => t.text.toLowerCase() === text.toLowerCase())) {
    todoInput.style.borderColor = 'var(--danger)';
    todoInput.placeholder = 'Task already exists!';
    setTimeout(() => {
      todoInput.style.borderColor = '';
      todoInput.placeholder = 'Add a new task...';
    }, 1800);
    return;
  }

  tasks.push({ text, done: false, priority: false });
  save('tasks', tasks);
  todoInput.value = '';
  renderTasks();
}

function toggleTask(index) {
  const completing = !tasks[index].done;
  tasks[index].done = completing;

  if (completing) {
    totalPoints += calcPoints();
    tasks[index].priority = false;
  } else {
    totalPoints = Math.max(0, totalPoints - calcPoints());
  }

  save('tasks', tasks);
  save('totalPoints', totalPoints);
  renderPoints();
  renderTasks();
}

function togglePriority(index) {
  tasks[index].priority = !tasks[index].priority;
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

function saveEdit() {
  const newText = editInput.value.trim();
  if (!newText || editIndex === null) return;

  if (tasks.some((t, i) => i !== editIndex && t.text.toLowerCase() === newText.toLowerCase())) {
    editInput.style.borderColor = 'var(--danger)';
    return;
  }

  tasks[editIndex].text = newText;
  save('tasks', tasks);
  editModal.classList.add('hidden');
  editIndex = null;
  renderTasks();
}

function cancelEdit() {
  editModal.classList.add('hidden');
  editIndex = null;
}

editSaveBtn.addEventListener('click', saveEdit);
editCancelBtn.addEventListener('click', cancelEdit);
editInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveEdit();
  if (e.key === 'Escape') cancelEdit();
});

sortBtn.addEventListener('click', () => {
  tasks.sort((a, b) => sortAsc ? a.text.localeCompare(b.text) : b.text.localeCompare(a.text));
  sortAsc = !sortAsc;
  sortBtn.textContent = sortAsc ? '⇅ Sort A–Z' : '⇅ Sort Z–A';
  save('tasks', tasks);
  renderTasks();
});

addTodoBtn.addEventListener('click', addTask);
todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

// ===== TIMER =====
function formatTime(secs) {
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
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
      timerDisplay.classList.replace('running', 'finished');
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
  timerSeconds = (parseInt(timerDuration.value) || 25) * 60;
  timerDisplay.classList.remove('running', 'finished');
  updateTimerDisplay();
});

timerDuration.addEventListener('change', () => {
  if (!timerRunning) {
    timerSeconds = (parseInt(timerDuration.value) || 25) * 60;
    updateTimerDisplay();
  }
});

// ===== LINKS =====
function renderLinks() {
  linksContainer.innerHTML = '';
  linksEmpty.style.display = links.length === 0 ? 'block' : 'none';
  if (links.length === 0) return;

  links.forEach((link, index) => {
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

    const chip = document.createElement('div');
    chip.className = 'link-chip';
    chip.append(a, delBtn);
    linksContainer.appendChild(chip);
  });
}

function addLink() {
  const name = linkName.value.trim();
  let url    = linkUrl.value.trim();
  if (!name || !url) return;

  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  links.push({ name, url });
  save('links', links);
  linkName.value = '';
  linkUrl.value  = '';
  renderLinks();
}

addLinkBtn.addEventListener('click', addLink);
linkUrl.addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });

// ===== INIT =====
function init() {
  applyTheme();
  initName();
  updateClock();
  setInterval(updateClock, 1000);
  updateTimerDisplay();
  renderPoints();
  renderTasks();
  renderLinks();
}

init();
