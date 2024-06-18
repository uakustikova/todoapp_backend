const { body, validationResult } = require("express-validator");
const db = require("../db/db");

var express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
var router = express.Router();

/* Read all todos */
router.get("/", authenticateToken, async (req, res, next) => {
  const todos = await db.models.todo.findAll({
    where: { user_id: req.userId },
  });

  res.status(200).json(todos);
});

/* Create todos */
router.post(
  "/",
  authenticateToken,
  body("name").not().isEmpty(),
  body("name").isLength({ max: 255 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const todo = await db.models.todo.create({
      name: req.body.name,
      user_id: req.userId,
    });

    res.status(201).json(todo);
  }
);

/* Update todos with done */
router.put("/:id/done", authenticateToken, async (req, res, next) => {
  const pk = req.params.id;
  try {
    var todo = await db.models.todo.findOne({
      where: { id: pk, user_id: req.userId },
    });

    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    todo = await todo.update({ done_date: new Date() });
    res.status(200).json(todo);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* Update todos with undone */
router.delete("/:id/done", authenticateToken, async (req, res, next) => {
  const pk = req.params.id;
  try {
    var todo = await db.models.todo.findOne({
      where: { id: pk, user_id: req.userId },
    });

    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    const updatedTodo = await todo.update({ done_date: null });

    res.status(200).json(updatedTodo);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
