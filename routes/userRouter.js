require("dotenv").config();
const router = require("express").Router();
const {authMiddleware}=require("../middlewares/authMiddleware");
const {registerUser,loginUser,getUserPreferences,updateUserPreferences}=require("../controllers/userController");

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/preferences",authMiddleware,getUserPreferences);
router.put("/preferences",authMiddleware,updateUserPreferences);

module.exports = router;
