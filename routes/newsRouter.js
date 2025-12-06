require("dotenv").config();
const {authMiddleware}=require("../middlewares/authMiddleware");
const axios = require("axios");
const router = require("express").Router();
const userModel = require("../models/userModel");
router.get("/news",authMiddleware,async(req,res)=>{
    const email=req.user.email;
    const user = await userModel.findOne({
        email: email
    });
    let allcategories="";
    user.preferences.forEach((preference)=>{
        console.log(preference);
        allcategories+=preference+","
    })
    console.log(allcategories);
    let categories=allcategories.substring(0,allcategories.length-1);
    console.log(categories);
    try{

        const news=await axios.get(`https://api.mediastack.com/v1/news?access_key=${process.env.NEWS_API_KEY}&categories=${categories}&countries=in,us`);

        console.log(news.data);
        if(!news){
            return res.status(400).send({
                message: "Please look into selected categories"
            })
        }
        res.status(200).send({
            news: news.data
        }
        )
    }catch(err){
        console.log(err);
        return res.status(501).send({
            message: "Internal Server Error"
        })
    }

})

module.exports = router;