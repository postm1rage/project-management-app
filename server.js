const express = require("express");
const session = require("express-session");
const { MongoClient } = require("mongodb");
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

app.get("/", (req, res) => {
  res.redirect("/login");
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

app.listen(3000, () => {
  console.log("Сервер запущен на http://localhost:3000");
});