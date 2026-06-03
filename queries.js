const { MongoClient, ObjectId } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("project_management");

    console.log("=== 1. Все активные проекты с высоким приоритетом ===");
    const result1 = await db.collection("projects")
      .find({ status: "active", priority: "high" })
      .toArray();
    console.log(JSON.stringify(result1, null, 2));

    console.log("\n=== 2. Задачи конкретного проекта с сортировкой по приоритету ===");
    const projectId = (await db.collection("projects").findOne({ name: "Разработка CRM-системы" }))._id;
    const result2 = await db.collection("tasks")
      .find({ projectId })
      .sort({ priority: -1, dueDate: 1 })
      .toArray();
    console.log(JSON.stringify(result2, null, 2));

    console.log("\n=== 3. Все задачи конкретного исполнителя ===");
    const assignee = await db.collection("users").findOne({ email: "petr.dev@project.ru" });
    const result3 = await db.collection("tasks")
      .find({ assigneeId: assignee._id })
      .toArray();
    console.log(JSON.stringify(result3, null, 2));

    console.log("\n=== 4. Канбан-доска: группировка задач по статусам ===");
    const result4 = await db.collection("tasks")
      .aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, tasks: { $push: "$title" } } }
      ])
      .toArray();
    console.log(JSON.stringify(result4, null, 2));

    console.log("\n=== 5. Задачи с комментариями (поиск по вложенному массиву) ===");
    const result5 = await db.collection("tasks")
      .find({ "comments.0": { $exists: true } })
      .project({ title: 1, "comments.text": 1, _id: 0 })
      .toArray();
    console.log(JSON.stringify(result5, null, 2));

    console.log("\n=== 6. Задачи, у которых срок истёк, а статус не done ===");
    const result6 = await db.collection("tasks")
      .find({ dueDate: { $lt: new Date() }, status: { $ne: "done" } })
      .toArray();
    console.log(JSON.stringify(result6, null, 2));

    console.log("\n=== 7. Загрузка сотрудников по активным проектам ===");
    const result7 = await db.collection("projects")
      .aggregate([
        { $match: { status: "active" } },
        { $unwind: "$team" },
        { $group: { _id: "$team.userId", projectCount: { $sum: 1 } } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { fullName: "$user.fullName", projectCount: 1, _id: 0 } }
      ])
      .toArray();
    console.log(JSON.stringify(result7, null, 2));

    console.log("\n=== 8. Задачи с полной информацией об исполнителе и проекте ===");
    const result8 = await db.collection("tasks")
      .aggregate([
        { $lookup: { from: "users", localField: "assigneeId", foreignField: "_id", as: "assignee" } },
        { $unwind: "$assignee" },
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $project: { title: 1, "assignee.fullName": 1, "project.name": 1, status: 1, _id: 0 } }
      ])
      .toArray();
    console.log(JSON.stringify(result8, null, 2));

    console.log("\n=== 9. История изменений конкретной задачи ===");
    const task = await db.collection("tasks").findOne({ title: "Спроектировать схему БД" });
    const result9 = task.history;
    console.log(JSON.stringify(result9, null, 2));

    console.log("\n=== 10. Сводка по проектам: количество задач по статусам ===");
    const result10 = await db.collection("tasks")
      .aggregate([
        { $group: { _id: { projectId: "$projectId", status: "$status" }, count: { $sum: 1 } } },
        { $lookup: { from: "projects", localField: "_id.projectId", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $project: { project: "$project.name", status: "$_id.status", count: 1, _id: 0 } },
        { $sort: { project: 1, status: 1 } }
      ])
      .toArray();
    console.log(JSON.stringify(result10, null, 2));

  } finally {
    await client.close();
  }
}

run().catch(console.dir);