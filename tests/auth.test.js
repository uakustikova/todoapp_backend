const request = require("supertest");
const app = require("../app");
const db = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

jest.mock("../db/db");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("Auth tests", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "testsecret";
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("POST /register", () => {
    test("should create a new user and return 201", async () => {
      bcrypt.hash.mockResolvedValue("hashedpassword");
      db.models.user.create.mockResolvedValue({});

      const res = await request(app)
        .post("/auth/register")
        .send({ username: "testuser", password: "password" })
        .expect(201);

      expect(res.body).toHaveProperty("message", "User created");
      expect(bcrypt.hash).toHaveBeenCalledWith("password", 10);
      expect(db.models.user.create).toHaveBeenCalledWith({
        username: "testuser",
        password: "hashedpassword",
      });
    });

    test("should return 500 if username is already taken", async () => {
      bcrypt.hash.mockResolvedValue("hashedpassword");
      db.models.user.create.mockRejectedValue(
        new Error("Username is already taken")
      );

      const res = await request(app)
        .post("/auth/register")
        .send({ username: "existinguser", password: "password" })
        .expect(500);

      expect(res.body).toHaveProperty("message", "Username is already taken");
      expect(db.models.user.create).toHaveBeenCalledWith({
        username: "existinguser",
        password: "hashedpassword",
      });
    });
  });

  describe("POST /login", () => {
    test("should return a token for valid credentials", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        password: "hashedpassword",
      };

      db.models.user.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("validtoken");

      const res = await request(app)
        .post("/auth/login")
        .send({ username: "testuser", password: "password" })
        .expect(200);

      expect(res.body).toHaveProperty("token", "validtoken");
      expect(db.models.user.findOne).toHaveBeenCalledWith({
        where: { username: "testuser" },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith("password", "hashedpassword");
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
    });

    test("should return 401 for invalid credentials", async () => {
      db.models.user.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post("/auth/login")
        .send({ username: "invaliduser", password: "password" })
        .expect(401);

      expect(res.body).toHaveProperty("message", "Invalid credentials");
      expect(db.models.user.findOne).toHaveBeenCalledWith({
        where: { username: "invaliduser" },
      });
    });

    test("should return 401 for incorrect password", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        password: "hashedpassword",
      };

      db.models.user.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app)
        .post("/auth/login")
        .send({ username: "testuser", password: "wrongpassword" })
        .expect(401);

      expect(res.body).toHaveProperty("message", "Invalid credentials");
      expect(db.models.user.findOne).toHaveBeenCalledWith({
        where: { username: "testuser" },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongpassword",
        "hashedpassword"
      );
    });
  });
});
