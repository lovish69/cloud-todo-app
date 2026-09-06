const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory task storage (simulates database)
let tasks = [
    { id: 1, title: "Set up AWS EC2 instance and security groups", completed: true, tag: "DevOps" },
    { id: 2, title: "Create GitHub repository and push initial code", completed: true, tag: "Git" },
    { id: 3, title: "Write Dockerfile and build container image", completed: false, tag: "Docker" },
    { id: 4, title: "Configure GitHub Actions CI/CD pipeline", completed: false, tag: "CI/CD" },
    { id: 5, title: "Integrate DynamoDB for task storage", completed: false, tag: "AWS" },
    { id: 6, title: "Set up CloudWatch monitoring and alerts", completed: false, tag: "Monitor" },
    { id: 7, title: "Add Telegram bot for deployment notifications", completed: false, tag: "Notify" },
];
let nextId = 8;

// GET all tasks
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// GET single task
app.get('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
});

// CREATE task
app.post('/api/tasks', (req, res) => {
    const { title, tag } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const task = {
        id: nextId++,
        title: title,
        completed: false,
        tag: tag || 'General'
    };
    tasks.push(task);
    res.status(201).json(task);
});

// UPDATE task
app.put('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (req.body.title) task.title = req.body.title;
    if (req.body.completed !== undefined) task.completed = req.body.completed;
    if (req.body.tag) task.tag = req.body.tag;
    res.json(task);
});

// DELETE task
app.delete('/api/tasks/:id', (req, res) => {
    const index = tasks.findIndex(t => t.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Task not found' });
    const deleted = tasks.splice(index, 1);
    res.json({ message: 'Task deleted', task: deleted[0] });
});

// Health check endpoint (for monitoring)
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', uptime: process.uptime() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Todo app server running on http://localhost:${PORT}`);
});
