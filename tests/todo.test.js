const request = require("supertest");
const app = require("../app");
const db = require("../db/db");
jest.mock("../db/db");
jest.mock("../middleware/authenticateToken");
const authenticateToken = require("../middleware/authenticateToken");

describe("todo tests", () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    jest.clearAllMocks();

    authenticateToken.mockImplementation((req, res, next) => {
      req.userId = 1; // Mock user ID
      next();
    });

    // Setup default mocks for db models
    db.models.todo.findAll.mockResolvedValue([
      { id: 1, name: "Test Todo", user_id: 1, done_date: null },
    ]);
    db.models.todo.create.mockResolvedValue({
      id: 2,
      name: "New Todo",
      user_id: 1,
    });
    db.models.todo.update.mockResolvedValue({
      id: 2,
      name: "New Todo",
      done_date: "2022-01-01",
      user_id: 1,
    });
    db.models.todo.findOne.mockResolvedValue({
      id: 1,
      name: "Existing Todo",
      user_id: 1,
      update: jest.fn().mockResolvedValue({
        id: 1,
        name: "Existing Todo",
        user_id: 1,
        done_date: "2022-01-01",
      }),
    });
  });

  test("should require authentication for all endpoints", async () => {
    jest.clearAllMocks();
    authenticateToken.mockImplementation((req, res, next) => {
      res.status(401).json({ error: "Unauthorized" });
    });

    await request(app).get("/todos").expect(401);
    await request(app).post("/todos").send({ name: "Todo" }).expect(401);
    await request(app).put("/todos/1/done").expect(401);
    await request(app).delete("/todos/1/done").expect(401);
  });

  test("GET /todos should return 200 and an empty array when no todos are present", async () => {
    db.models.todo.findAll.mockResolvedValue([]);
    const res = await request(app).get("/todos").expect(200);

    expect(res.body).toEqual([]);
  });

  test("POST /todos should create a new todo and return 201", async () => {
    const res = await request(app)
      .post("/todos")
      .send({ name: "New Todo" })
      .expect(201);

    expect(db.models.todo.create).toHaveBeenCalledWith({
      name: "New Todo",
      user_id: 1, // Assuming user_id is added by the middleware
    });
    expect(res.body).toHaveProperty("name", "New Todo");
  });

  test("POST /todos should return 400 for invalid data", async () => {
    const res = await request(app)
      .post("/todos")
      .send({ name: "" }) // Sending empty name to check validation
      .expect(400);

    // Ensure the create method was not called
    expect(db.models.todo.create).not.toHaveBeenCalled();
    expect(res.body).toHaveProperty("errors");
  });

  test("PUT /todos/:id/done should handle failure in updating todo", async () => {
    db.models.todo.findOne.mockResolvedValue({
      id: 1,
      name: "Test Todo",
      user_id: 1,
      update: jest.fn(() => Promise.reject(new Error("DB error"))),
    });

    const res = await request(app).put("/todos/1/done").expect(500);

    expect(res.body).toEqual({ error: "Internal Server Error" });
  });

  test("PUT /todos/:id/done should successfully mark a todo as done and return 200", async () => {
    const res = await request(app).put("/todos/1/done").expect(200);

    expect(res.body).toHaveProperty("done_date");
    expect(res.body.done_date).toBeTruthy();
  });

  test("DELETE /todos/:id/done should handle database failures gracefully", async () => {
    db.models.todo.findOne.mockResolvedValue({
      id: 1,
      name: "Test Todo",
      user_id: 1,
      update: jest.fn(() => Promise.reject(new Error("DB error"))),
    });

    const res = await request(app).delete("/todos/1/done").expect(500);

    expect(res.body).toEqual({ error: "Internal Server Error" });
  });

  test("DELETE /todos/:id/done should successfully unmark a todo and return 200", async () => {
    db.models.todo.findOne.mockResolvedValue({
      id: 1,
      name: "Test Todo",
      user_id: 1,
      update: jest.fn().mockResolvedValue({
        id: 1,
        name: "Existing Todo",
        user_id: 1,
      }),
    });

    const res = await request(app).put("/todos/1/done").expect(200);

    expect(res.body).not.toHaveProperty("done_date");
    expect(res.body.done_date).toBeFalsy();
  });
});
