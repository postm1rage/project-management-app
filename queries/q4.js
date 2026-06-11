const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

async function run() {
  await client.connect();
  const db = client.db("project_management");
  const result = await db.collection("tasks")
    .aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, tasks: { $push: "$title" } } }
    ])
    .toArray();
  console.log("Запрос 4 — Группировка задач по статусам:\n");
  console.log(JSON.stringify(result, null, 2));
  await client.close();
}
run();