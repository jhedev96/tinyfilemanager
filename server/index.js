const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const port = 3001;

app.use(express.json());

// Session middleware
app.use(session({
  secret: 'a-very-secret-key-that-should-be-in-env-vars',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using https
}));

// Hardcoded users
const users = {
    admin: { passwordHash: '$2b$10$OHLBtdZtPIS.xRreMthsz.XXQhP2z0buj.6a5KqjBJ9r9baZqKARy' }, // admin@123
    user: { passwordHash: '$2b$10$2xcuDy/nBZYzExXyrI7pg.JbMm8eS1fULJb.eWJkERYy1.bbpctO2' }    // 12345
};

// Auth middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
};

// This is the root directory from which files will be served.
const filesDirPath = path.join(__dirname, 'data');
fs.mkdir(filesDirPath, { recursive: true });

// Auth routes
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users[username];
    if (user && await bcrypt.compare(password, user.passwordHash)) {
        req.session.user = { username };
        res.status(200).json({ username });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.status(200).send('Logged out');
});

// Protected file management routes
app.get('/api/files', isAuthenticated, async (req, res) => {
  try {
    let currentPath = req.query.path ? path.join(filesDirPath, req.query.path) : filesDirPath;
    if (!currentPath.startsWith(filesDirPath)) {
        return res.status(400).send('Invalid path');
    }
    const files = await fs.readdir(currentPath, { withFileTypes: true });
    const fileList = await Promise.all(files.map(async file => {
        const filePath = path.join(currentPath, file.name);
        const stats = await fs.stat(filePath);
        return {
            name: file.name,
            isDirectory: file.isDirectory(),
            size: stats.size,
            mtime: stats.mtime,
        };
    }));
    res.json(fileList);
  } catch (error) {
    console.error(error);
    if (error.code === 'ENOENT') {
      return res.status(404).send('Directory not found');
    }
    res.status(500).send('Server Error');
  }
});

app.post('/api/files', isAuthenticated, async (req, res) => {
    try {
        const { name, type, path: relativePath } = req.body;
        if (!name || !type) {
            return res.status(400).send('Missing name or type');
        }
        const currentPath = relativePath ? path.join(filesDirPath, relativePath) : filesDirPath;
        if (!currentPath.startsWith(filesDirPath)) {
            return res.status(400).send('Invalid path');
        }
        const newPath = path.join(currentPath, name);
        if (type === 'folder') {
            await fs.mkdir(newPath);
        } else {
            await fs.writeFile(newPath, '');
        }
        res.status(201).send('Item created');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.delete('/api/files', isAuthenticated, async (req, res) => {
    try {
        const { name, path: relativePath } = req.body;
        if (!name) {
            return res.status(400).send('Missing name');
        }
        const currentPath = relativePath ? path.join(filesDirPath, relativePath) : filesDirPath;
        if (!currentPath.startsWith(filesDirPath)) {
            return res.status(400).send('Invalid path');
        }
        const itemPath = path.join(currentPath, name);
        await fs.rm(itemPath, { recursive: true, force: true });
        res.status(200).send('Item deleted');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
