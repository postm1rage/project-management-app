const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

async function run() {
  await client.connect();
  const db = client.db("project_management");
  const project = await db.collection("projects").findOne({ name: "Разработка CRM-системы" });
  if (!project) return console.log("Проект не найден. Запусти init.js.");
  const result = await db.collection("tasks")
    .find({ projectId: project._id })
    .sort({ priority: -1, dueDate: 1 })
    .toArray();
  console.log("Запрос 2 — Задачи проекта с сортировкой:\n");
  console.log(JSON.stringify(result, null, 2));
  await client.close();
}
run();