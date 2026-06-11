const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

async function run() {
  await client.connect();
  const db = client.db("project_management");
  const result = await db.collection("tasks")
    .aggregate([
      { $group: { _id: { projectId: "$projectId", status: "$status" }, count: { $sum: 1 } } },
      { $lookup: { from: "projects", localField: "_id.projectId", foreignField: "_id", as: "project" } },
      { $unwind: "$project" },
      { $project: { project: "$project.name", status: "$_id.status", count: 1, _id: 0 } },
      { $sort: { project: 1, status: 1 } }
    ])
    .toArray();
  console.log("Запрос 10 — Сводка по проектам:\n");
  console.log(JSON.stringify(result, null, 2));
  await client.close();
}
run();