const toDo = document.getElementById('todo');
const inProgress = document.getElementById('inProgress');
const done = document.getElementById('done');
const input = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const modeToggleBtn = document.getElementById('modeToggleBtn'); 
const body = document.body;
let tasks = JSON.parse(localStorage.getItem('kanbanTasks')) || [];
let nextId = tasks.length > 0 ? Math.max(...tasks.map(t => parseInt(t.id.replace('task-', '')))) + 1 : 1;

function saveTasks() {
    localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
}

function calculateDuration(startDateISO, endDateISO, status) {
    if (!startDateISO) {
        return 'Not started yet';
    }
    const start = new Date(startDateISO);
    const end = endDateISO ? new Date(endDateISO) : new Date();
    let diff = end.getTime() - start.getTime();
    if (diff < 0) return 'Date Error';
    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    const remainingMinutes = totalMinutes % 60;
    let result = [];
    if (status === 'done') {
        if (days > 0) {
            result.push(`${days} days`);
            if (remainingHours > 0) result.push(`${remainingHours} hours`);
        } else if (totalHours > 0) {
            result.push(`${totalHours} hours`);
            if (remainingMinutes > 0) result.push(`${remainingMinutes} mins`);
        } else {
            result.push(`${totalMinutes} mins`);
        }
    } else if (status === 'inProgress') {
        if (days > 0) {
            result.push(`${days} days`);
        } else if (remainingHours > 0) {
            result.push(`${remainingHours} hours`);
        } else {
            result.push(`${remainingMinutes} mins`);
        }
        if (result.length === 0) return 'A few seconds ago';
    }
    return result.join(', ');
}

function deleteTask(taskId) {
    const taskElement = document.getElementById(taskId);
    if (taskElement) {
        taskElement.remove();
    }
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
}

function clearAllTasks() {
    if (!confirm("Are you sure you want to delete ALL tasks? This action cannot be undone.")) {
        return;
    }
    tasks = [];
    saveTasks();
    const taskContainers = document.querySelectorAll('.tasks-container');
    taskContainers.forEach(container => {
        container.innerHTML = '';
    });
}

function getTaskDetailsHTML(task) {
    const duration = calculateDuration(task.startedAt, task.finishedAt, task.status);
    const createdDate = new Date(task.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    const startedDate = task.startedAt ? new Date(task.startedAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'Not started';
    const finishedDate = task.finishedAt ? new Date(task.finishedAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'Not finished';
    return `
        <p><strong>Created:</strong> ${createdDate}</p>
        <p><strong>Started:</strong> ${startedDate}</p>
        <p><strong>Finished:</strong> ${finishedDate}</p>
        <p><strong>Total Duration:</strong> ${duration}</p>
        <p>${task.description ? `(Details: ${task.description.substring(0, 50)}...)` : ''}</p>
    `;
}

function saveTaskChanges(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    const task = tasks[taskIndex];
    const taskItem = document.getElementById(taskId);
    const newTitle = document.getElementById(`edit-title-${taskId}`).value.trim();
    const newDescription = document.getElementById(`edit-desc-${taskId}`).value;
    if (newTitle === "") {
        alert("Task title cannot be empty!");
        return;
    }
    task.text = newTitle;
    task.description = newDescription; 
    saveTasks();
    taskItem.classList.remove('editing');
    const parentContainer = taskItem.parentElement;
    const newTaskElement = createTaskElement(task);
    parentContainer.replaceChild(newTaskElement, taskItem);
}

function renderEditMode(task, taskItem) {
    taskItem.classList.add('editing');
    taskItem.innerHTML = ''; 
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = task.text;
    titleInput.className = 'edit-title-input';
    titleInput.id = `edit-title-${task.id}`;
    const descriptionTextarea = document.createElement('textarea');
    descriptionTextarea.value = task.description || '';
    descriptionTextarea.placeholder = 'Enter task details here...';
    descriptionTextarea.className = 'edit-description-textarea';
    descriptionTextarea.id = `edit-desc-${task.id}`;
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'edit-details-info';
    detailsDiv.innerHTML = getTaskDetailsHTML(task);
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save ';
    saveBtn.className = 'save-edit-btn';
    saveBtn.addEventListener('click', () => saveTaskChanges(task.id));
    taskItem.appendChild(titleInput);
    taskItem.appendChild(descriptionTextarea);
    taskItem.appendChild(detailsDiv);
    taskItem.appendChild(saveBtn);
    taskItem.draggable = false;
}

function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-card';
    taskItem.id = task.id;
    taskItem.draggable = true;
    
    taskItem.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn') || taskItem.classList.contains('editing')) {
            return;
        }
        document.querySelectorAll('.task-card').forEach(t => t.classList.remove('selected'));
        taskItem.classList.add('selected');
    });

    taskItem.addEventListener('dblclick', (e) => {
        if (!e.target.classList.contains('delete-btn') && !taskItem.classList.contains('editing')) {
            renderEditMode(task, taskItem);
        }
    });

    const taskContent = document.createElement('span');
    taskContent.textContent = task.text;
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        deleteTask(task.id);
    });
    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'task-time-info';
    timeDisplay.id = `time-display-${task.id}`;
    const durationText = calculateDuration(task.startedAt, task.finishedAt, task.status);
    let infoHTML = '';
    if (task.status === 'done') {
        infoHTML = ` <strong>Finished:</strong> ${durationText}`;
    } else if (task.status === 'inProgress') {
        infoHTML = ` <strong>In Progress for:</strong> ${durationText}`;
    } else {
        infoHTML = ` <strong>Created on:</strong> ${new Date(task.createdAt).toLocaleDateString('en-US')}`;
    }
    timeDisplay.innerHTML = infoHTML;
    taskItem.appendChild(taskContent);
    taskItem.appendChild(timeDisplay); 
    taskItem.appendChild(deleteBtn);
    addDragEvents(taskItem);
    return taskItem;
}


function updateTaskDOMDisplay(task) {
    const timeDisplay = document.getElementById(`time-display-${task.id}`);
    if (!timeDisplay) return; 
    const durationText = calculateDuration(task.startedAt, task.finishedAt, task.status);
    let infoHTML = '';
    if (task.status === 'done') {
        infoHTML = ` <strong>Finished:</strong> ${durationText}`;
    } else if (task.status === 'inProgress') {
        infoHTML = ` <strong>In Progress for:</strong> ${durationText}`;
    } else {
        infoHTML = ` <strong>Created on:</strong> ${new Date(task.createdAt).toLocaleDateString('en-US')}`;
    }
    timeDisplay.innerHTML = infoHTML;
}

function moveTask(taskItem, newContainer) {
    const taskId = taskItem.id;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    taskItem.classList.remove('selected');
    const newStatus = newContainer.id;
    const task = tasks[taskIndex];
    newContainer.querySelector('.tasks-container').appendChild(taskItem);
    const currentTime = new Date().toISOString();
    if (newStatus === 'inProgress' && task.status !== 'inProgress') {
        task.startedAt = currentTime;
        task.finishedAt = null;
    } else if (newStatus === 'done' && task.status !== 'done') {
        task.finishedAt = currentTime;
        if (!task.startedAt) {
            task.startedAt = currentTime; 
        }
    } else if (newStatus === 'todo') {
        task.finishedAt = null;
    }
    task.status = newStatus;
    saveTasks();
    updateTaskDOMDisplay(task);
}

const columns = [toDo, inProgress, done];
columns.forEach(column => {
    column.addEventListener('dragover', dragOver);
    column.addEventListener('drop', drop);
});

function addDragEvents(task) {
    task.addEventListener('dragstart', dragStart);
}

let draggedTask = null;
function dragStart(e) {
    draggedTask = e.target;
    e.dataTransfer.setData('text/plain',e.target.id || 'task');
    setTimeout(() =>{
        e.target.classList.add('dragging');
    },0);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const droppedColumn = e.target.closest('.column');
    if (!droppedColumn) return;
    const dropZone = e.target.closest('.column').querySelector('.tasks-container');
    if (dropZone && draggedTask) {
        draggedTask.classList.remove('dragging');
        moveTask(draggedTask, droppedColumn);
        draggedTask = null;
    }
}

addTaskBtn.addEventListener('click', () => {
    const taskText = input.value.trim();
    if (taskText === "") return;
    const newTask = {
        id: `task-${nextId++}`,
        text: taskText,
        status: 'todo',
        createdAt: new Date().toISOString(),
        startedAt: null,
        finishedAt: null,
        deadlineDays: null,
        description: ''
    };
    tasks.push(newTask);
    saveTasks();
    const taskElement = createTaskElement(newTask);
    const todoContainer = toDo.querySelector('.tasks-container');
    todoContainer.appendChild(taskElement);
    input.value = "";
    addDragEvents(taskElement);
});

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTaskBtn.click();
    }
});

clearAllBtn.addEventListener('click', clearAllTasks);

document.addEventListener('keydown', (e) => {
    if (document.activeElement === input || document.activeElement.classList.contains('edit-title-input') || document.activeElement.classList.contains('edit-description-textarea')) {
        return;
    }
    const selectedTask = document.querySelector('.task-card.selected');
    if (!selectedTask) return;
    let targetColumn = null;
    if (e.key === 'p' || e.key === 'P') {
        targetColumn = inProgress;
    } else if (e.key === 'd' || e.key === 'D') {
        targetColumn = done;
    } else if (e.key === 't' || e.key === 'T') {
        targetColumn = toDo;
    }
    if (targetColumn) {
        e.preventDefault();
        moveTask(selectedTask, targetColumn);
    }
});

function loadTasks() {
    const todoContainer = toDo.querySelector('.tasks-container');
    const inProgressContainer = inProgress.querySelector('.tasks-container');
    const doneContainer = done.querySelector('.tasks-container');
    tasks.forEach(task => {
        if (task.description === undefined) {
            task.description = '';
        }
        const taskElement = createTaskElement(task);
        if (task.status === 'todo') {
            todoContainer.appendChild(taskElement);
        } else if (task.status === 'inProgress') {
            inProgressContainer.appendChild(taskElement);
        } else if (task.status === 'done') {
            doneContainer.appendChild(taskElement);
        }
    });
}

function refreshInProcessTime() {
    const inProgressTasks = tasks.filter(t => t.status === 'inProgress');
    inProgressTasks.forEach(task => {
        updateTaskDOMDisplay(task);
    });
}

function toggleMode() {
    body.classList.toggle('darkMode');
    const isDarkMode = body.classList.contains('darkMode');
    localStorage.setItem('mode', isDarkMode ? 'dark' : 'light');
    modeToggleBtn.textContent = isDarkMode ? ' Light Mode' : ' Dark Mode';
}

modeToggleBtn.addEventListener('click', toggleMode);

loadTasks();
setInterval(refreshInProcessTime, 60000);