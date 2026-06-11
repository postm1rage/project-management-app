const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

async function run() {
  await client.connect();
  const db = client.db("project_management");
  const result = await db.collection("tasks")
    .aggregate([
      { $lookup: { from: "users", localField: "assigneeId", foreignField: "_id", as: "assignee" } },
      { $unwind: "$assignee" },
      { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
      { $unwind: "$project" },
      { $project: { title: 1, "assignee.fullName": 1, "project.name": 1, status: 1, _id: 0 } }
    ])
    .toArray();
  console.log("Запрос 8 — Задачи с исполнителем и проектом:\n");
  console.log(JSON.stringify(result, null, 2));
  await client.close();
}
run();