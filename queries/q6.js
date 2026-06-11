const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

async function run() {
  await client.connect();
  const db = client.db("project_management");
  const result = await db.collection("tasks")
    .find({ dueDate: { $lt: new Date() }, status: { $ne: "done" } })
    .toArray();
  console.log("Запрос 6 — Просроченные задачи:\n");
  console.log(JSON.stringify(result, null, 2));
  await client.close();
}
run();