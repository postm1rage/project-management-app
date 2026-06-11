const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

async function run() {
  await client.connect();
  const db = client.db("project_management");
  const result = await db.collection("projects")
    .find({ status: "active", priority: "high" })
    .toArray();
  console.log("Запрос 1 — Активные проекты с высоким приоритетом:\n");
  console.log(JSON.stringify(result, null, 2));
  await client.close();
}
run();