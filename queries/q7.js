const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

async function run() {
  await client.connect();
  const db = client.db("project_management");
  const result = await db.collection("projects")
    .aggregate([
      { $match: { status: "active" } },
      { $unwind: "$team" },
      { $group: { _id: "$team.userId", projectCount: { $sum: 1 } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { fullName: "$user.fullName", projectCount: 1, _id: 0 } }
    ])
    .toArray();
  console.log("Запрос 7 — Загрузка сотрудников:\n");
  console.log(JSON.stringify(result, null, 2));
  await client.close();
}
run();