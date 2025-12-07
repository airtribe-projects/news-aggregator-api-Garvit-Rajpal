require("dotenv").config();
const {authMiddleware}=require("../middlewares/authMiddleware");
const router = require("express").Router();
const {getCategoryNews,searchNews}=require("../controllers/newsController");
router.get("/news",authMiddleware,getCategoryNews);
router.get("/news/search/:keyword",authMiddleware,searchNews);

module.exports = router;