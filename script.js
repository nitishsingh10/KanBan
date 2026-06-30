// Keeping JS basic and functional
const STORAGE_KEY = 'kanban-tasks';
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// DOM Elements
const addBtn = document.getElementById('add-task-btn');
const modal = document.getElementById('task-modal');
const modalTitle = document.getElementById('modal-title');
const taskInput = document.getElementById('task-input');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');

let editingTaskId = null;

// Initialize app
function init() {
    renderTasks();
    setupEventListeners();
}

// Render all tasks based on their status
function renderTasks() {
    document.getElementById('todo-list').innerHTML = '';
    document.getElementById('in-progress-list').innerHTML = '';
    document.getElementById('done-list').innerHTML = '';

    tasks.forEach(task => {
        const card = createTaskElement(task);
        const list = document.getElementById(`${task.status}-list`);
        if (list) {
            list.appendChild(card);
        }
    });
}

// Create a draggable task card element
function createTaskElement(task) {
    const div = document.createElement('div');
    div.classList.add('task-card');
    div.draggable = true;
    div.dataset.id = task.id;

    const infoDiv = document.createElement('div');
    infoDiv.classList.add('task-info');

    const titleSpan = document.createElement('span');
    titleSpan.classList.add('task-title');
    titleSpan.textContent = task.title;

    const timeSpan = document.createElement('p');
    timeSpan.classList.add('task-time');
    
    // Parse timestamp (fallback to task id for older tasks, or Date.now)
    const taskDate = task.createdAt ? new Date(task.createdAt) : new Date(parseInt(task.id) || Date.now());
    timeSpan.innerHTML = `<i class="bi bi-clock"></i> ${taskDate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

    infoDiv.appendChild(titleSpan);
    infoDiv.appendChild(timeSpan);

    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('task-actions');

    const editBtn = document.createElement('button');
    editBtn.classList.add('icon-btn', 'edit');
    editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
    editBtn.title = 'Edit task';
    editBtn.onclick = () => openModal(task.id);

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('icon-btn', 'delete');
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.title = 'Delete task';
    deleteBtn.onclick = () => deleteTask(task.id);

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    div.appendChild(infoDiv);
    div.appendChild(actionsDiv);

    // Setup HTML5 Drag and Drop events
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);

    return div;
}

// Persist data to localStorage
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Delete a task
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
    }
}

// Open modal for create/edit
function openModal(id = null) {
    editingTaskId = id;
    if (id) {
        const task = tasks.find(t => t.id === id);
        taskInput.value = task.title;
        modalTitle.textContent = 'Edit Task';
    } else {
        taskInput.value = '';
        modalTitle.textContent = 'Create Task';
    }
    modal.classList.remove('hidden');
    taskInput.focus();
}

// Close modal
function closeModal() {
    modal.classList.add('hidden');
    taskInput.value = '';
    editingTaskId = null;
}

// Save task (Create or Edit)
function saveTask() {
    const title = taskInput.value.trim();
    if (!title) {
        alert('Task title cannot be empty.');
        return;
    }

    if (editingTaskId) {
        // Edit existing
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.title = title;
        }
    } else {
        // Create new
        tasks.push({
            id: Date.now().toString(),
            title: title,
            status: 'todo', // Default status
            createdAt: new Date().toISOString()
        });
    }

    saveTasks();
    renderTasks();
    closeModal();
}

// Setup static event listeners
function setupEventListeners() {
    addBtn.addEventListener('click', () => openModal());
    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveTask);

    // Save on Enter key
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveTask();
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Configure drop zones for columns
    const columns = document.querySelectorAll('.column');
    columns.forEach(col => {
        col.addEventListener('dragover', handleDragOver);
        col.addEventListener('dragleave', handleDragLeave);
        col.addEventListener('drop', handleDrop);
    });
}

// --- Drag and Drop Logic ---
let draggedTaskId = null;

function handleDragStart(e) {
    draggedTaskId = this.dataset.id;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedTaskId = null;

    // Cleanup visual drag-over indicators
    document.querySelectorAll('.column').forEach(col => {
        col.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';

    const taskList = this.querySelector('.task-list');
    if (taskList) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    const newStatus = this.dataset.status;
    const taskIndex = tasks.findIndex(t => t.id === id);

    // Update status if moved to a different column
    if (taskIndex !== -1 && tasks[taskIndex].status !== newStatus) {
        tasks[taskIndex].status = newStatus;
        saveTasks();
        renderTasks();
    }
}

// Boot up
init();
