const express = require("express");
const session = require("express-session");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const app = express();
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "project-management-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 },
  })
);

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") return res.redirect("/projects");
  next();
}

app.get("/", (req, res) => {
  res.redirect("/projects");
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    await client.connect();
    const db = client.db("project_management");
    const user = await db.collection("users").findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.render("login", { error: "Неверный email или пароль" });
    }
    if (user.isBlocked) {
      return res.render("login", { error: "Учетная запись заблокирована" });
    }
    req.session.user = { _id: user._id.toString(), fullName: user.fullName, role: user.role };
    res.redirect("/projects");
  } catch (e) {
    res.render("login", { error: "Ошибка сервера" });
  }
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  const { email, password, fullName } = req.body;
  try {
    await client.connect();
    const db = client.db("project_management");
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return res.render("register", { error: "Пользователь уже существует" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await db.collection("users").insertOne({
      email,
      passwordHash,
      fullName,
      role: "member",
      position: "Новый сотрудник",
      isBlocked: false,
      createdAt: new Date(),
    });
    res.redirect("/login");
  } catch (e) {
    res.render("register", { error: "Ошибка сервера" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

app.get("/projects", requireAuth, async (req, res) => {
  try {
    await client.connect();
    const db = client.db("project_management");
    let projects;
    if (req.session.user.role === "member") {
      projects = await db.collection("projects").find({ "team.userId": new ObjectId(req.session.user._id) }).toArray();
    } else {
      projects = await db.collection("projects").find().toArray();
    }
    res.render("projects", { projects, user: req.session.user });
  } catch (e) {
    res.send("Ошибка загрузки проектов");
  }
});

app.post("/projects", requireAuth, async (req, res) => {
  if (req.session.user.role === "member") return res.redirect("/projects");
  const { name, description, startDate, endDate, priority } = req.body;
  try {
    await client.connect();
    const db = client.db("project_management");
    const project = {
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      priority,
      status: "active",
      createdBy: new ObjectId(req.session.user._id),
      team: [{ userId: new ObjectId(req.session.user._id), role: "manager" }],
      createdAt: new Date(),
    };
    await db.collection("projects").insertOne(project);
    res.redirect("/projects");
  } catch (e) {
    res.send("Ошибка создания проекта");
  }
});

app.post("/projects/:id/status", requireAuth, async (req, res) => {
  if (req.session.user.role === "member") return res.redirect("/projects");
  const { status } = req.body;
  try {
    await client.connect();
    const db = client.db("project_management");
    await db.collection("projects").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status } }
    );
    res.redirect("/projects");
  } catch (e) {
    res.send("Ошибка обновления статуса проекта");
  }
});

app.post("/projects/:id/priority", requireAuth, async (req, res) => {
  if (req.session.user.role === "member") return res.redirect("/projects");
  const { priority } = req.body;
  try {
    await client.connect();
    const db = client.db("project_management");
    await db.collection("projects").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { priority } }
    );
    res.redirect("/projects");
  } catch (e) {
    res.send("Ошибка обновления приоритета проекта");
  }
});

app.post("/projects/:id/delete", requireAuth, async (req, res) => {
  if (req.session.user.role === "member") return res.redirect("/projects");
  try {
    await client.connect();
    const db = client.db("project_management");
    await db.collection("tasks").deleteMany({ projectId: new ObjectId(req.params.id) });
    await db.collection("projects").deleteOne({ _id: new ObjectId(req.params.id) });
    res.redirect("/projects");
  } catch (e) {
    res.send("Ошибка удаления проекта");
  }
});

app.get("/projects/:id", requireAuth, async (req, res) => {
  try {
    await client.connect();
    const db = client.db("project_management");
    const project = await db.collection("projects").findOne({ _id: new ObjectId(req.params.id) });
    if (!project) return res.send("Проект не найден");
    if (req.session.user.role === "member") {
      const isMember = project.team.some(t => t.userId.toString() === req.session.user._id);
      if (!isMember) return res.send("Доступ запрещён");
    }
    const tasksRaw = await db.collection("tasks").find({ projectId: new ObjectId(req.params.id) }).toArray();
    const userIds = [...new Set(tasksRaw.flatMap(t => (t.comments || []).map(c => c.userId.toString())))];
    const usersMap = {};
    if (userIds.length) {
      const usersArr = await db.collection("users")
        .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
        .project({ fullName: 1 })
        .toArray();
      usersArr.forEach(u => usersMap[u._id.toString()] = u.fullName);
    }
    const tasks = tasksRaw.map(task => ({
      ...task,
      comments: (task.comments || []).map(c => ({ ...c, userFullName: usersMap[c.userId.toString()] || "Неизвестный" }))
    }));
    const allUsers = await db.collection("users").find({}, { projection: { _id: 1, fullName: 1 } }).toArray();
    res.render("project", { project, tasks, allUsers, user: req.session.user });
  } catch (e) {
    res.send("Ошибка загрузки проекта");
  }
});

app.post("/projects/:id/tasks", requireAuth, async (req, res) => {
  if (req.session.user.role === "member") return res.redirect(`/projects/${req.params.id}`);
  const { title, description, priority, assigneeId, dueDate } = req.body;
  try {
    await client.connect();
    const db = client.db("project_management");
    const task = {
      projectId: new ObjectId(req.params.id),
      title,
      description,
      status: "todo",
      priority,
      assigneeId: new ObjectId(assigneeId),
      reporterId: new ObjectId(req.session.user._id),
      dueDate: new Date(dueDate),
      tags: [],
      attachments: [],
      comments: [],
      history: [{ changedBy: new ObjectId(req.session.user._id), field: "created", oldValue: "", newValue: title, changedAt: new Date() }],
      createdAt: new Date(),
    };
    await db.collection("tasks").insertOne(task);
    res.redirect(`/projects/${req.params.id}`);
  } catch (e) {
    res.send("Ошибка создания задачи");
  }
});

app.post("/tasks/:id/status", requireAuth, async (req, res) => {
  if (req.session.user.role === "member") return res.redirect("/projects");
  const { status, projectId } = req.body;
  try {
    await client.connect();
    const db = client.db("project_management");
    const task = await db.collection("tasks").findOne({ _id: new ObjectId(req.params.id) });
    await db.collection("tasks").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: { status },
        $push: {
          history: {
            changedBy: new ObjectId(req.session.user._id),
            field: "status",
            oldValue: task.status,
            newValue: status,
            changedAt: new Date(),
          },
        },
      }
    );
    res.redirect(`/projects/${projectId}`);
  } catch (e) {
    res.send("Ошибка обновления статуса");
  }
});

app.post("/tasks/:id/priority", requireAuth, async (req, res) => {
  if (req.session.user.role === "member") return res.redirect("/projects");
  const { priority, projectId } = req.body;
  try {
    await client.connect();
    const db = client.db("project_management");
    await db.collection("tasks").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { priority } }
    );
    res.redirect(`/projects/${projectId}`);
  } catch (e) {
    res.send("Ошибка обновления приоритета задачи");
  }
});

app.post("/tasks/:id/delete", requireAuth, async (req, res) => {
  if (req.session.user.role === "member") return res.redirect("/projects");
  const { projectId } = req.body;
  try {
    await client.connect();
    const db = client.db("project_management");
    await db.collection("tasks").deleteOne({ _id: new ObjectId(req.params.id) });
    res.redirect(`/projects/${projectId}`);
  } catch (e) {
    res.send("Ошибка удаления задачи");
  }
});

app.post("/tasks/:id/comment", requireAuth, async (req, res) => {
  const { text, projectId } = req.body;
  try {
    await client.connect();
    const db = client.db("project_management");
    await db.collection("tasks").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $push: {
          comments: {
            userId: new ObjectId(req.session.user._id),
            text,
            createdAt: new Date(),
          },
        },
      }
    );
    res.redirect(`/projects/${projectId}`);
  } catch (e) {
    res.send("Ошибка добавления комментария");
  }
});

app.get("/admin", requireAuth, requireAdmin, async (req, res) => {
  try {
    await client.connect();
    const db = client.db("project_management");
    const users = await db.collection("users").find().toArray();
    res.render("admin", { users, currentUser: req.session.user });
  } catch (e) {
    res.send("Ошибка загрузки админ-панели");
  }
});

app.post("/admin/users/:id/toggle", requireAuth, requireAdmin, async (req, res) => {
  try {
    await client.connect();
    const db = client.db("project_management");
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.params.id) });
    await db.collection("users").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { isBlocked: !user.isBlocked } }
    );
    res.redirect("/admin");
  } catch (e) {
    res.send("Ошибка");
  }
});

app.listen(3000, () => {
  console.log("Сервер запущен на http://localhost:3000");
});