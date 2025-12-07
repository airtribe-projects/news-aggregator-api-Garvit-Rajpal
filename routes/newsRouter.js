const router = require("express").Router();
const {getCategoryNews,searchNews}=require("../controllers/newsController");
router.get("/",getCategoryNews);
router.get("/search/:keyword",searchNews);

module.exports = router;

