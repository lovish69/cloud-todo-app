/**
 * Cloud Todo Application — Backend API Server
 * Automated CI/CD Pipeline for Cloud-Based Todo Application using AWS and Docker
 *
 * Storage strategy:
 *   - If AWS credentials/region are configured (e.g., on an EC2 instance with an
 *     IAM role), tasks are persisted in Amazon DynamoDB.
 *   - Otherwise the server falls back to in-memory storage so the app runs
 *     anywhere (local laptop, CI pipeline) with zero configuration.
 */
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const TABLE_NAME = process.env.TASKS_TABLE || 'Tasks';
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ────────────────────────────────────────────────────────────
// Storage layer: DynamoDB with in-memory fallback
// ────────────────────────────────────────────────────────────
let ddb = null;

async function initStorage() {
  try {
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
    const client = new DynamoDBClient({ region: AWS_REGION });
    ddb = DynamoDBDocumentClient.from(client);
    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    await ddb.send(new ScanCommand({ TableName: TABLE_NAME, Limit: 1 }));
    console.log(`[storage] DynamoDB connected (table: ${TABLE_NAME}, region: ${AWS_REGION})`);
  } catch (err) {
    ddb = null;
    console.warn(`[storage] DynamoDB not available (${err.name || 'error'}) — using in-memory storage`);
  }
}

// In-memory fallback data (used locally / in CI)
let memTasks = [
  { id: '1', title: 'Set up AWS EC2 instance and security groups', completed: true,  tag: 'devops',   priority: 'high' },
  { id: '2', title: 'Create GitHub repository and push initial code', completed: true,  tag: 'git',     priority: 'high' },
  { id: '3', title: 'Write Dockerfile and build container image',    completed: false, tag: 'docker',  priority: 'high' },
  { id: '4', title: 'Configure GitHub Actions CI/CD pipeline',       completed: false, tag: 'cicd',    priority: 'high' },
  { id: '5', title: 'Integrate DynamoDB for task storage',           completed: false, tag: 'aws',     priority: 'medium' },
  { id: '6', title: 'Set up CloudWatch monitoring and alarms',       completed: false, tag: 'monitor', priority: 'medium' },
  { id: '7', title: 'Add Telegram bot for deployment notifications', completed: false, tag: 'notify',  priority: 'low' },
];
let memNextId = 8;

// ────────────────────────────────────────────────────────────
// Task repository (abstracts DynamoDB vs in-memory)
// ────────────────────────────────────────────────────────────
const repo = {
  async list() {
    if (ddb) {
      const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
      const out = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }));
      return out.Items || [];
    }
    return memTasks;
  },

  async get(id) {
    if (ddb) {
      const { GetCommand } = require('@aws-sdk/lib-dynamodb');
      const out = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { id } }));
      return out.Item || null;
    }
    return memTasks.find(t => t.id === id) || null;
  },

  async create({ title, tag, priority }) {
    const task = {
      id: ddb ? require('crypto').randomUUID() : String(memNextId++),
      title,
      completed: false,
      tag: tag || 'general',
      priority: priority || 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (ddb) {
      const { PutCommand } = require('@aws-sdk/lib-dynamodb');
      await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: task }));
    } else {
      memTasks.push(task);
    }
    return task;
  },

  async update(id, patch) {
    if (ddb) {
      const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
      const names = {}, values = {}, sets = [];
      Object.entries(patch).forEach(([k, v], i) => {
        names[`#k${i}`] = k; values[`:v${i}`] = v; sets.push(`#k${i} = :v${i}`);
      });
      values[':now'] = new Date().toISOString();
      const out = await ddb.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: `SET ${sets.join(', ')}, updated_at = :now`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }));
      return out.Attributes || null;
    }
    const task = memTasks.find(t => t.id === id);
    if (!task) return null;
    Object.assign(task, patch, { updated_at: new Date().toISOString() });
    return task;
  },

  async remove(id) {
    if (ddb) {
      const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
      await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));
      return true;
    }
    const i = memTasks.findIndex(t => t.id === id);
    if (i === -1) return false;
    memTasks.splice(i, 1);
    return true;
  },
};

// ────────────────────────────────────────────────────────────
// REST API endpoints
// ────────────────────────────────────────────────────────────

app.get('/api/tasks', async (req, res) => {
  try {
    res.json(await repo.list());
  } catch (e) {
    res.status(500).json({ error: 'Failed to list tasks' });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await repo.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get task' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title, tag, priority } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    const task = await repo.create({ title: String(title).trim(), tag, priority });
    res.status(201).json(task);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const patch = {};
  const { title, completed, tag, priority } = req.body || {};
  if (title !== undefined) patch.title = String(title).trim();
  if (completed !== undefined) patch.completed = !!completed;
  if (tag !== undefined) patch.tag = tag;
  if (priority !== undefined) patch.priority = priority;
  try {
    const task = await repo.update(req.params.id, patch);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const ok = await repo.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted', id: req.params.id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    storage: ddb ? 'dynamodb' : 'in-memory',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ────────────────────────────────────────────────────────────
// Start server
// ────────────────────────────────────────────────────────────
initStorage().finally(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Todo app server running on http://localhost:${PORT}`);
  });
});
