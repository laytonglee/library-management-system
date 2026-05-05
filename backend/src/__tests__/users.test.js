const request = require("supertest");

jest.mock("jsonwebtoken");
jest.mock("../services/userService", () => ({
  listUsers: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deactivateUser: jest.fn(),
  deleteUser: jest.fn(),
  getUserBorrowingHistory: jest.fn(),
  listRoles: jest.fn(),
  listBorrowingPolicies: jest.fn(),
  updateBorrowingPolicy: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const userService = require("../services/userService");
const app = require("../app");

function fakeUser(role = "admin", userId = 1) {
  return { userId, role, username: `${role}-user` };
}

beforeEach(() => {
  jest.clearAllMocks();
  jwt.verify.mockReturnValue(fakeUser());
});

describe("Users API", () => {
  it("lists users for admins", async () => {
    userService.listUsers.mockResolvedValue({
      users: [{ id: 7, username: "teacher1" }],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const res = await request(app)
      .get("/api/v1/users?role=teacher")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(userService.listUsers).toHaveBeenCalledWith(
      expect.objectContaining({ role: "teacher" }),
    );
  });

  it("blocks non-admin users from listing users", async () => {
    jwt.verify.mockReturnValue(fakeUser("librarian", 42));

    const res = await request(app)
      .get("/api/v1/users")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("requires manage_users to fetch a user profile", async () => {
    jwt.verify.mockReturnValue(fakeUser("student", 22));

    const res = await request(app)
      .get("/api/v1/users/22")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("creates a user", async () => {
    userService.createUser.mockResolvedValue({ id: 44, username: "new-user" });

    const res = await request(app)
      .post("/api/v1/users")
      .set("Cookie", "accessToken=fake")
      .send({
        fullName: "New User",
        username: "new-user",
        email: "new@example.com",
        password: "Secret123!",
        roleId: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(44);
    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "new-user",
        email: "new@example.com",
      }),
    );
  });

  it("updates a user", async () => {
    userService.updateUser.mockResolvedValue({ id: 11, fullName: "Updated User" });

    const res = await request(app)
      .put("/api/v1/users/11")
      .set("Cookie", "accessToken=fake")
      .send({ fullName: "Updated User" });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe("Updated User");
    expect(userService.updateUser).toHaveBeenCalledWith(
      11,
      expect.objectContaining({ fullName: "Updated User" }),
    );
  });

  it("deactivates a user", async () => {
    userService.deactivateUser.mockResolvedValue({ id: 14, isActive: false });

    const res = await request(app)
      .put("/api/v1/users/14/deactivate")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
    expect(res.body.message).toBe("User deactivated");
    expect(userService.deactivateUser).toHaveBeenCalledWith(14);
  });

  it("deletes a user", async () => {
    userService.deleteUser.mockResolvedValue();

    const res = await request(app)
      .delete("/api/v1/users/18")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User deleted");
    expect(userService.deleteUser).toHaveBeenCalledWith(18);
  });

  it("returns borrowing history for admins", async () => {
    userService.getUserBorrowingHistory.mockResolvedValue({
      transactions: [{ id: 100, status: "ACTIVE" }],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const res = await request(app)
      .get("/api/v1/users/9/borrowing-history?status=ACTIVE")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(userService.getUserBorrowingHistory).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ status: "ACTIVE" }),
    );
  });

  it("blocks students from reading any user's borrowing history", async () => {
    jwt.verify.mockReturnValue(fakeUser("student", 9));

    const res = await request(app)
      .get("/api/v1/users/10/borrowing-history")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(userService.getUserBorrowingHistory).not.toHaveBeenCalled();
  });
});
