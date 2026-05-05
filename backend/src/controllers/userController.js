const userService = require("../services/userService");

async function listUsers(req, res) {
  try {
    const result = await userService.listUsers(req.query);
    return res.json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function getUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    const user = await userService.getUserById(id);
    return res.json({ success: true, data: user });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function createUser(req, res) {
  try {
    const user = await userService.createUser(req.body);
    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function updateUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    const user = await userService.updateUser(id, req.body);
    return res.json({ success: true, data: user });
  } catch (err) {
    return res
      .status(
        err.statusCode ||
          (err.code === "P2002" ? 409 : err.code === "P2025" ? 404 : 500),
      )
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function deactivateUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    const user = await userService.deactivateUser(id);
    return res.json({ success: true, data: user, message: "User deactivated" });
  } catch (err) {
    return res
      .status(err.statusCode || (err.code === "P2025" ? 404 : 500))
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function deleteUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    await userService.deleteUser(id);
    return res.json({ success: true, message: "User deleted" });
  } catch (err) {
    return res
      .status(err.statusCode || (err.code === "P2025" ? 404 : 500))
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function borrowingHistory(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    const result = await userService.getUserBorrowingHistory(id, req.query);
    return res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function listRoles(req, res) {
  try {
    const roles = await userService.listRoles();
    return res.json({ success: true, data: roles });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function listBorrowingPolicies(req, res) {
  try {
    const policies = await userService.listBorrowingPolicies();
    return res.json({ success: true, data: policies });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function updateBorrowingPolicy(req, res) {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    if (isNaN(roleId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid role ID" });
    const policy = await userService.updateBorrowingPolicy(roleId, req.body);
    return res.json({ success: true, data: policy });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function searchBorrowers(req, res) {
  try {
    const { q, limit = 8 } = req.query;
    const result = await userService.listUsers({ search: q, limit });
    return res.json({ success: true, data: result.users });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message || "Internal server error" });
  }
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
  borrowingHistory,
  listRoles,
  listBorrowingPolicies,
  updateBorrowingPolicy,
  searchBorrowers,
};
