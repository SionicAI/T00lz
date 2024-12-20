document.addEventListener('DOMContentLoaded', () => {
    // Configuración del tema
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        themeToggle.textContent = document.body.dataset.theme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', document.body.dataset.theme);
    });

    // Cargar tema guardado
    document.body.dataset.theme = localStorage.getItem('theme') || 'light';
    themeToggle.textContent = document.body.dataset.theme === 'dark' ? '☀️' : '🌙';

    // Estado inicial
    let groups = JSON.parse(localStorage.getItem('groups')) || [
        { id: 'default', name: 'Mi Lista', tasks: [] }
    ];
    let currentGroupId = localStorage.getItem('currentGroupId') || 'default';

    // Inicializar Sortable
    const tasksList = document.getElementById('tasksList');
    new Sortable(tasksList, {
        animation: 150,
        onEnd: function() {
            saveTasksOrder();
        }
    });

    // Funciones de renderizado
    function renderGroups() {
        const groupSelect = document.getElementById('groupSelect');
        groupSelect.innerHTML = '';
        
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            option.selected = group.id === currentGroupId;
            groupSelect.appendChild(option);
        });
    }

    function renderTasks() {
        const currentGroup = groups.find(g => g.id === currentGroupId);
        
        const tasksList = document.getElementById('tasksList');
        const completedList = document.getElementById('completedTasksList');
        
        tasksList.innerHTML = '';
        completedList.innerHTML = '';

        currentGroup.tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            if (task.completed) {
                completedList.appendChild(taskElement);
            } else {
                tasksList.appendChild(taskElement);
            }
        });
    }

    function createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item ${task.completed ? 'completed' : ''}`;
        div.setAttribute('data-id', task.id);
        
        div.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <div class="task-actions">
                <button class="edit-task">✎</button>
                <button class="delete-task">✖</button>
            </div>
        `;

        // Event listeners para cada tarea
        div.querySelector('.task-checkbox').onchange = () => toggleTask(task.id);
        div.querySelector('.edit-task').onclick = () => editTask(task.id);
        div.querySelector('.delete-task').onclick = () => deleteTask(task.id);

        return div;
    }

    // Funciones de manipulación de grupos
    function addGroup() {
        const name = prompt('Nombre del nuevo grupo:');
        if (name) {
            const newGroup = {
                id: Date.now().toString(),
                name: name,
                tasks: []
            };
            groups.push(newGroup);
            saveData();
            renderGroups();
        }
    }

    function editCurrentGroup() {
        const currentGroup = groups.find(g => g.id === currentGroupId);
        const newName = prompt('Nuevo nombre del grupo:', currentGroup.name);
        if (newName) {
            currentGroup.name = newName;
            saveData();
            renderGroups();
            renderTasks();
        }
    }

    // Funciones de manipulación de tareas
    function addTask(text) {
        const currentGroup = groups.find(g => g.id === currentGroupId);
        currentGroup.tasks.push({
            id: Date.now().toString(),
            text: text,
            completed: false
        });
        saveData();
        renderTasks();
    }

    function toggleTask(taskId) {
        const currentGroup = groups.find(g => g.id === currentGroupId);
        const task = currentGroup.tasks.find(t => t.id === taskId);
        task.completed = !task.completed;
        saveData();
        renderTasks();
    }

    function editTask(taskId) {
        const currentGroup = groups.find(g => g.id === currentGroupId);
        const task = currentGroup.tasks.find(t => t.id === taskId);
        const newText = prompt('Editar tarea:', task.text);
        
        if (newText) {
            task.text = newText;
            saveData();
            renderTasks();
        }
    }

    function deleteTask(taskId) {
        const currentGroup = groups.find(g => g.id === currentGroupId);
        currentGroup.tasks = currentGroup.tasks.filter(t => t.id !== taskId);
        saveData();
        renderTasks();
    }

    function clearCompletedTasks() {
        const currentGroup = groups.find(g => g.id === currentGroupId);
        currentGroup.tasks = currentGroup.tasks.filter(task => !task.completed);
        saveData();
        renderTasks();
    }

    // Funciones de utilidad
    function saveData() {
        localStorage.setItem('groups', JSON.stringify(groups));
        localStorage.setItem('currentGroupId', currentGroupId);
    }

    function switchGroup(groupId) {
        currentGroupId = groupId;
        saveData();
        renderTasks();
    }

    function saveTasksOrder() {
        const taskElements = document.querySelectorAll('#tasksList .task-item');
        const currentGroup = groups.find(g => g.id === currentGroupId);
        const newTasksOrder = Array.from(taskElements).map(el => {
            return currentGroup.tasks.find(t => t.id === el.dataset.id);
        });
        
        currentGroup.tasks = newTasksOrder.concat(
            currentGroup.tasks.filter(t => t.completed)
        );
        saveData();
    }

    // Event Listeners
    document.querySelector('.add-group-btn').onclick = addGroup;
    document.querySelector('.edit-group-btn').onclick = editCurrentGroup;
    document.getElementById('groupSelect').onchange = e => switchGroup(e.target.value);
    document.querySelector('.clear-completed').onclick = clearCompletedTasks;

    // Agregar tarea con Enter
    document.getElementById('newTask').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            addTask(this.value.trim());
            this.value = '';
        }
    });

    // Inicialización
    renderGroups();
    renderTasks();

    // Pomodoro Timer
    const pomodoroTimer = {
        minutes: 25,
        seconds: 0,
        isRunning: false,
        interval: null,
        
        updateDisplay() {
            document.getElementById('minutes').textContent = String(this.minutes).padStart(2, '0');
            document.getElementById('seconds').textContent = String(this.seconds).padStart(2, '0');
        },
        
        start() {
            if (!this.isRunning) {
                this.isRunning = true;
                this.interval = setInterval(() => {
                    if (this.seconds === 0) {
                        if (this.minutes === 0) {
                            this.playAlarm();
                            this.reset();
                            return;
                        }
                        this.minutes--;
                        this.seconds = 59;
                    } else {
                        this.seconds--;
                    }
                    this.updateDisplay();
                }, 1000);
            }
        },
        
        pause() {
            this.isRunning = false;
            clearInterval(this.interval);
        },
        
        reset() {
            this.pause();
            this.minutes = parseInt(document.querySelector('.timer-mode.active').dataset.time);
            this.seconds = 0;
            this.updateDisplay();
        },
        
        playAlarm() {
            // Puedes agregar un sonido de alarma aquí
            alert('¡Tiempo completado!');
        }
    };

    // Event Listeners para el Pomodoro
    document.querySelector('.toggle-pomodoro').addEventListener('click', function() {
        const content = document.querySelector('.pomodoro-content');
        
        // Toggle de las clases
        content.classList.toggle('show');
        this.classList.toggle('open');
    });

    document.querySelectorAll('.timer-mode').forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode;
            const timeValue = button.dataset.time;
            
            // Actualizar clases active
            document.querySelectorAll('.timer-mode').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Actualizar modo actual
            document.querySelector('.pomodoro-content').dataset.currentMode = mode;
            document.querySelector('.timer-display').dataset.mode = mode;
            
            // Actualizar el timer
            pomodoroTimer.minutes = parseInt(timeValue);
            pomodoroTimer.seconds = 0;
            pomodoroTimer.reset();
        });
    });

    document.getElementById('startTimer').addEventListener('click', () => pomodoroTimer.start());
    document.getElementById('pauseTimer').addEventListener('click', () => pomodoroTimer.pause());
    document.getElementById('resetTimer').addEventListener('click', () => pomodoroTimer.reset());

    // Cerrar el panel al hacer clic fuera
    document.addEventListener('click', (e) => {
        const panel = document.querySelector('.pomodoro-panel');
        const toggle = document.querySelector('.toggle-pomodoro');
        if (!panel.contains(e.target) && !toggle.contains(e.target) && panel.classList.contains('show')) {
            panel.classList.remove('show');
        }
    });
});