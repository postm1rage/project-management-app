const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

async function run() {
  await client.connect();
  const db = client.db("project_management");
  const task = await db.collection("tasks").findOne({ title: "Спроектировать схему БД" });
  console.log("Запрос 9 — История изменений задачи:\n");
  console.log(JSON.stringify(task.history, null, 2));
  await client.close();
}
run();