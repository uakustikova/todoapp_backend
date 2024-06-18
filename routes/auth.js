const { body, validationResult } = require("express-validator");
var jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const db = require("../db/db");

var express = require("express");
var router = express.Router();

// User registration endpoint
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await db.models.user.create({
      username,
      password: hashedPassword,
    });
    res.status(201).send({ message: "User created" });
  } catch (error) {
    res.status(500).send({ message: "Username is already taken" });
  }
});

// User login endpoint
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await db.models.user.findOne({ where: { username } });
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.send({ token });
  } else {
    res.status(401).send({ message: "Invalid credentials" });
  }
});

module.exports = router;
