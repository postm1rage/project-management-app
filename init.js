const { MongoClient, ObjectId } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("project_management");

    await db.collection("users").drop().catch(() => {});
    await db.collection("projects").drop().catch(() => {});
    await db.collection("tasks").drop().catch(() => {});

    const userIds = {
      admin: new ObjectId(),
      manager1: new ObjectId(),
      manager2: new ObjectId(),
      member1: new ObjectId(),
      member2: new ObjectId()
    };

    const users = [
      {
        _id: userIds.admin,
        email: "admin@project.ru",
        passwordHash: "$2b$10$examplehashadmin",
        fullName: "Алексей Админов",
        role: "admin",
        position: "Системный администратор",
        isBlocked: false,
        createdAt: new Date("2025-01-10")
      },
      {
        _id: userIds.manager1,
        email: "ivan.manager@project.ru",
        passwordHash: "$2b$10$examplehashmanager1",
        fullName: "Иван Петров",
        role: "manager",
        position: "Руководитель проектов",
        isBlocked: false,
        createdAt: new Date("2025-01-15")
      },
      {
        _id: userIds.manager2,
        email: "olga.manager@project.ru",
        passwordHash: "$2b$10$examplehashmanager2",
        fullName: "Ольга Смирнова",
        role: "manager",
        position: "Старший руководитель",
        isBlocked: false,
        createdAt: new Date("2025-02-01")
      },
      {
        _id: userIds.member1,
        email: "petr.dev@project.ru",
        passwordHash: "$2b$10$examplehashmember1",
        fullName: "Пётр Кодов",
        role: "member",
        position: "Разработчик",
        isBlocked: false,
        createdAt: new Date("2025-02-10")
      },
      {
        _id: userIds.member2,
        email: "anna.design@project.ru",
        passwordHash: "$2b$10$examplehashmember2",
        fullName: "Анна Дизайнова",
        role: "member",
        position: "Дизайнер",
        isBlocked: true,
        createdAt: new Date("2025-02-15")
      }
    ];

    await db.collection("users").insertMany(users);
    console.log(`Вставлено ${users.length} пользователей`);

    const projectIds = {
      p1: new ObjectId(),
      p2: new ObjectId(),
      p3: new ObjectId(),
      p4: new ObjectId(),
      p5: new ObjectId()
    };

    const projects = [
      {
        _id: projectIds.p1,
        name: "Разработка CRM-системы",
        description: "Создание внутренней CRM для отдела продаж",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-09-01"),
        priority: "high",
        status: "active",
        createdBy: userIds.manager1,
        team: [
          { userId: userIds.manager1, role: "manager" },
          { userId: userIds.member1, role: "member" }
        ],
        createdAt: new Date("2025-03-01")
      },
      {
        _id: projectIds.p2,
        name: "Мобильное приложение",
        description: "Разработка мобильной версии личного кабинета",
        startDate: new Date("2025-04-01"),
        endDate: new Date("2025-12-01"),
        priority: "medium",
        status: "active",
        createdBy: userIds.manager2,
        team: [
          { userId: userIds.manager2, role: "manager" },
          { userId: userIds.member2, role: "member" }
        ],
        createdAt: new Date("2025-04-01")
      },
      {
        _id: projectIds.p3,
        name: "Редизайн сайта",
        description: "Обновление корпоративного сайта компании",
        startDate: new Date("2025-02-15"),
        endDate: new Date("2025-05-15"),
        priority: "low",
        status: "completed",
        createdBy: userIds.manager1,
        team: [
          { userId: userIds.manager1, role: "manager" },
          { userId: userIds.member2, role: "member" }
        ],
        createdAt: new Date("2025-02-15")
      },
      {
        _id: projectIds.p4,
        name: "Внедрение DevOps",
        description: "Настройка CI/CD, мониторинга и автоматизации",
        startDate: new Date("2025-05-01"),
        endDate: new Date("2025-08-01"),
        priority: "medium",
        status: "on_hold",
        createdBy: userIds.admin,
        team: [
          { userId: userIds.manager1, role: "manager" },
          { userId: userIds.member1, role: "member" }
        ],
        createdAt: new Date("2025-05-01")
      },
      {
        _id: projectIds.p5,
        name: "Обучение персонала",
        description: "Повышение квалификации сотрудников",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-07-01"),
        priority: "low",
        status: "active",
        createdBy: userIds.manager2,
        team: [
          { userId: userIds.manager2, role: "manager" },
          { userId: userIds.member1, role: "member" },
          { userId: userIds.member2, role: "member" }
        ],
        createdAt: new Date("2025-06-01")
      }
    ];

    await db.collection("projects").insertMany(projects);
    console.log(`Вставлено ${projects.length} проектов`);

    const taskIds = {
      t1: new ObjectId(),
      t2: new ObjectId(),
      t3: new ObjectId(),
      t4: new ObjectId(),
      t5: new ObjectId()
    };

    const tasks = [
      {
        _id: taskIds.t1,
        projectId: projectIds.p1,
        title: "Спроектировать схему БД",
        description: "Разработать структуру коллекций и связей",
        status: "done",
        priority: "high",
        assigneeId: userIds.member1,
        reporterId: userIds.manager1,
        dueDate: new Date("2025-03-15"),
        tags: ["backend", "database"],
        attachments: ["schema_v1.pdf"],
        comments: [
          {
            userId: userIds.manager1,
            text: "Отличная работа, утверждено",
            createdAt: new Date("2025-03-14")
          },
          {
            userId: userIds.member1,
            text: "Спасибо, внёс правки",
            createdAt: new Date("2025-03-13")
          }
        ],
        history: [
          {
            changedBy: userIds.member1,
            field: "status",
            oldValue: "in_progress",
            newValue: "done",
            changedAt: new Date("2025-03-14")
          }
        ],
        createdAt: new Date("2025-03-02")
      },
      {
        _id: taskIds.t2,
        projectId: projectIds.p1,
        title: "Разработать API",
        description: "REST API для работы с задачами",
        status: "in_progress",
        priority: "high",
        assigneeId: userIds.member1,
        reporterId: userIds.manager1,
        dueDate: new Date("2025-04-01"),
        tags: ["backend", "api"],
        attachments: [],
        comments: [
          {
            userId: userIds.member1,
            text: "Начинаю писать эндпоинты",
            createdAt: new Date("2025-03-20")
          }
        ],
        history: [
          {
            changedBy: userIds.manager1,
            field: "status",
            oldValue: "todo",
            newValue: "in_progress",
            changedAt: new Date("2025-03-19")
          }
        ],
        createdAt: new Date("2025-03-16")
      },
      {
        _id: taskIds.t3,
        projectId: projectIds.p2,
        title: "Дизайн главного экрана",
        description: "Разработать макет главного экрана приложения",
        status: "review",
        priority: "medium",
        assigneeId: userIds.member2,
        reporterId: userIds.manager2,
        dueDate: new Date("2025-04-15"),
        tags: ["design", "mobile"],
        attachments: ["main_screen_mockup.fig"],
        comments: [
          {
            userId: userIds.manager2,
            text: "Нужно поправить цвета кнопок",
            createdAt: new Date("2025-04-10")
          }
        ],
        history: [
          {
            changedBy: userIds.member2,
            field: "status",
            oldValue: "in_progress",
            newValue: "review",
            changedAt: new Date("2025-04-09")
          }
        ],
        createdAt: new Date("2025-04-05")
      },
      {
        _id: taskIds.t4,
        projectId: projectIds.p3,
        title: "Обновить шапку сайта",
        description: "Сменить логотип и навигацию",
        status: "done",
        priority: "low",
        assigneeId: userIds.member2,
        reporterId: userIds.manager1,
        dueDate: new Date("2025-03-01"),
        tags: ["frontend", "design"],
        attachments: [],
        comments: [],
        history: [
          {
            changedBy: userIds.member2,
            field: "status",
            oldValue: "todo",
            newValue: "done",
            changedAt: new Date("2025-02-28")
          }
        ],
        createdAt: new Date("2025-02-20")
      },
      {
        _id: taskIds.t5,
        projectId: projectIds.p5,
        title: "Подготовить учебные материалы",
        description: "Собрать презентации и тесты для тренинга",
        status: "todo",
        priority: "low",
        assigneeId: userIds.member1,
        reporterId: userIds.manager2,
        dueDate: new Date("2025-06-10"),
        tags: ["hr", "training"],
        attachments: ["materials.zip"],
        comments: [],
        history: [],
        createdAt: new Date("2025-06-02")
      }
    ];

    await db.collection("tasks").insertMany(tasks);
    console.log(`Вставлено ${tasks.length} задач`);

    console.log("Инициализация базы данных завершена.");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);