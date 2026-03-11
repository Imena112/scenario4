import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import Database from "better-sqlite3";

declare module "express-session" {
  interface SessionData {
    user: { id: number; username: string };
  }
}
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("hospital.db");

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS department (
    DeptId INTEGER PRIMARY KEY AUTOINCREMENT,
    DeptName TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS post (
    PostID INTEGER PRIMARY KEY AUTOINCREMENT,
    PostTitle TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS staff (
    EmployeeID INTEGER PRIMARY KEY AUTOINCREMENT,
    PostID INTEGER,
    DeptId INTEGER,
    FirstName TEXT NOT NULL,
    LastName TEXT NOT NULL,
    Gender TEXT,
    DOB TEXT,
    Email TEXT UNIQUE,
    Phone TEXT,
    Address TEXT,
    HireDate TEXT,
    Salary REAL,
    Status TEXT,
    Experience INTEGER DEFAULT 0,
    FOREIGN KEY (PostID) REFERENCES post(PostID),
    FOREIGN KEY (DeptId) REFERENCES department(DeptId)
  );

  CREATE TABLE IF NOT EXISTS users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    EmployeeID INTEGER,
    Username TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    FOREIGN KEY (EmployeeID) REFERENCES staff(EmployeeID)
  );

  CREATE TABLE IF NOT EXISTS leave_records (
    LeaveID INTEGER PRIMARY KEY AUTOINCREMENT,
    EmployeeID INTEGER,
    StartDate TEXT,
    EndDate TEXT,
    Reason TEXT,
    Status TEXT DEFAULT 'Pending',
    FOREIGN KEY (EmployeeID) REFERENCES staff(EmployeeID)
  );
`);

// Seed initial data if empty
const deptCount = db.prepare("SELECT COUNT(*) as count FROM department").get() as { count: number };
if (deptCount.count === 0) {
  db.prepare("INSERT INTO department (DeptName) VALUES (?)").run("Cardiology");
  db.prepare("INSERT INTO department (DeptName) VALUES (?)").run("Neurology");
  db.prepare("INSERT INTO department (DeptName) VALUES (?)").run("Pediatrics");
  db.prepare("INSERT INTO department (DeptName) VALUES (?)").run("General Medicine");
  
  db.prepare("INSERT INTO post (PostTitle) VALUES (?)").run("Doctor");
  db.prepare("INSERT INTO post (PostTitle) VALUES (?)").run("Nurse");
  db.prepare("INSERT INTO post (PostTitle) VALUES (?)").run("Technician");
  db.prepare("INSERT INTO post (PostTitle) VALUES (?)").run("Administrator");

  // Admin user
  db.prepare("INSERT INTO users (Username, Password) VALUES (?, ?)").run("admin", "admin123");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(session({
    secret: "hospital-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    if (req.session.user) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE Username = ? AND Password = ?").get(username, password) as any;
    if (user) {
      req.session.user = { id: user.UserID, username: user.Username };
      res.json({ message: "Login successful", user: req.session.user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/me", (req, res) => {
    res.json({ user: req.session.user || null });
  });

  // Staff CRUD
  app.get("/api/staff", authenticate, (req, res) => {
    const { deptId, postId, minExperience } = req.query;
    let query = `
      SELECT s.*, p.PostTitle, d.DeptName 
      FROM staff s
      LEFT JOIN post p ON s.PostID = p.PostID
      LEFT JOIN department d ON s.DeptId = d.DeptId
      WHERE 1=1
    `;
    const params: any[] = [];

    if (deptId) {
      query += " AND s.DeptId = ?";
      params.push(deptId);
    }
    if (postId) {
      query += " AND s.PostID = ?";
      params.push(postId);
    }
    if (minExperience) {
      query += " AND s.Experience >= ?";
      params.push(minExperience);
    }

    const staff = db.prepare(query).all(...params);
    res.json(staff);
  });

  app.post("/api/staff", authenticate, (req, res) => {
    const { FirstName, LastName, Gender, DOB, Email, Phone, Address, PostID, DeptId, HireDate, Salary, Status, Experience } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO staff (FirstName, LastName, Gender, DOB, Email, Phone, Address, PostID, DeptId, HireDate, Salary, Status, Experience)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(FirstName, LastName, Gender, DOB, Email, Phone, Address, PostID, DeptId, HireDate, Salary, Status, Experience || 0);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/staff/:id", authenticate, (req, res) => {
    const { id } = req.params;
    const { FirstName, LastName, Gender, DOB, Email, Phone, Address, PostID, DeptId, HireDate, Salary, Status, Experience } = req.body;
    try {
      db.prepare(`
        UPDATE staff SET 
          FirstName = ?, LastName = ?, Gender = ?, DOB = ?, Email = ?, Phone = ?, 
          Address = ?, PostID = ?, DeptId = ?, HireDate = ?, Salary = ?, Status = ?, Experience = ?
        WHERE EmployeeID = ?
      `).run(FirstName, LastName, Gender, DOB, Email, Phone, Address, PostID, DeptId, HireDate, Salary, Status, Experience, id);
      res.json({ message: "Staff updated" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/staff/:id", authenticate, (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM staff WHERE EmployeeID = ?").run(id);
    res.json({ message: "Staff deleted" });
  });

  // Metadata Routes
  app.get("/api/departments", authenticate, (req, res) => {
    res.json(db.prepare("SELECT * FROM department").all());
  });

  app.get("/api/posts", authenticate, (req, res) => {
    res.json(db.prepare("SELECT * FROM post").all());
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
