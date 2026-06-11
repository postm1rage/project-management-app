const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

async function run() {
  await client.connect();
  const db = client.db("project_management");
  const result = await db.collection("tasks")
    .find({ "comments.0": { $exists: true } })
    .project({ title: 1, "comments.text": 1, _id: 0 })
    .toArray();
  console.log("Запрос 5 — Задачи с комментариями:\n");
  console.log(JSON.stringify(result, null, 2));
  await client.close();
}
run();