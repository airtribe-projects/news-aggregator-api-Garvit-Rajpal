require("dotenv").config();
const router = require("express").Router();
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/signup", async (req, res) => {
  const { name, email, password, preferences } = req.body;
  if (!email || !name || !password) {
    return res.status(400).send({
      message: "Invalid Inputs",
    });
  }
  const user = await userModel.findOne({
    email: email,
  });
  if (user) {
    return res.status(400).send({
      message: "User Already Exists. Please Login !!",
    });
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(process.env.SALT_ROUND) || 3
  );
  const newUser = {
    name: name,
    email: email,
    password: hashedPassword,
    preferences: preferences || [],
  };
  const dbUser = await userModel.create(newUser);
  res.status(200).send({
    id: dbUser._id,
    email: dbUser.email,
    message: "Successfully Created The User",
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send({
      message: "Invalid Inputs",
    });
  }
  const findUser = await userModel.findOne({
    email: email,
  });
  if (!findUser) {
    return res.status(400).send({
      message: "User Doesn't Exist",
    });
  }
  console.log(password);
  console.log(findUser);
  const samePassword = await bcrypt.compare(password, findUser.password);

  if (!samePassword) {
    return res.status(400).send({
      message: "Wrong Username or password",
    });
  }
  const token = await jwt.sign(
    {
      id: findUser._id,
      email: findUser.email,
      name: findUser.name,
      preferences: findUser.preferences,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  res.status(200).send({
    token: token,
    message: "User Logged In Successfully",
  });
});

module.exports = router;
