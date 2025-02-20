import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import { promisify } from 'util';

const app = express();
const port = 3001;

app.use(bodyParser.json());

// Middleware to set Content-Type header
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Initialize SQLite database
let db;
let dbGet, dbRun;
try {
  const sqlite3Module = await import('sqlite3');
  db = new sqlite3Module.default.Database('./users.db', (err) => {
    if (err) {
      console.error(err.message);
      throw err; // Propagate the error to the catch block
    }
    console.log('Connected to the users database.');
  });

  dbGet = promisify(db.get.bind(db));
  dbRun = promisify(db.run.bind(db));

  // Create users table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    isAdmin INTEGER DEFAULT 0
  )`, (err) => {
    if (err) {
      console.error(err.message);
      throw err; // Propagate the error to the catch block
    }
    console.log('Users table created or already exists.');
  });
} catch (dbError) {
  console.error('Database initialization failed:', dbError);
  process.exit(1); // Exit the process if the database fails to initialize
}


// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if username already exists
    const existingUser = await dbGet(`SELECT * FROM users WHERE username = ?`, [username]);

    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine if the new user is the first user (admin)
    const existingUsers = await dbGet(`SELECT * FROM users LIMIT 1`);

    const isAdmin = existingUsers ? 0 : 1;

    // Insert new user into the database
    await dbRun(`INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)`, [username, hashedPassword, isAdmin]);

    console.log(`User ${username} registered successfully with isAdmin=${isAdmin}`);
    res.status(201).json({ message: 'User registered successfully', isAdmin });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Retrieve user from the database
    const user = await dbGet(`SELECT * FROM users WHERE username = ?`, [username]);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password with hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`User ${username} logged in successfully`);
    res.json({ message: 'Logged in successfully', isAdmin: user.isAdmin });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
