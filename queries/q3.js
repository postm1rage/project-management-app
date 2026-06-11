const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

async function run() {
  await client.connect();
  const db = client.db("project_management");
  const user = await db.collection("users").findOne({ email: "petr.dev@project.ru" });
  const result = await db.collection("tasks")
    .find({ assigneeId: user._id })
    .toArray();
  console.log("Запрос 3 — Задачи исполнителя Петра Кодова:\n");
  console.log(JSON.stringify(result, null, 2));
  await client.close();
}
run();