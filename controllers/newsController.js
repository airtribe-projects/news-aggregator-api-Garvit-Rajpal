require("dotenv").config();
const axios = require("axios");
const userModel = require("../models/userModel");
const { client } = require("../services/redis-client/redis-client");

const getCategoryNews = async(req,res)=>{
    const email=req.user.email;
    const cacheKey=`news_${email}`;

    // Check if news data is present in Redis cache
    const cachedNews = await client.get(cacheKey);
    if(cachedNews){
        console.log("Serving from cache");
        return res.status(200).send({
            news: JSON.parse(cachedNews)
        })
    }
    const user = await userModel.findOne({
        email: email
    });
    let allcategories="";
    user.preferences.forEach((preference)=>{
        console.log(preference);
        allcategories+=preference+","
    })
    let categories=allcategories.substring(0,allcategories.length-1);
    try{

        const news=await axios.get(`https://api.mediastack.com/v1/news?access_key=${process.env.NEWS_API_KEY}&categories=${categories}&countries=in,us`);

        console.log(news.data);
        if(!news){
            return res.status(400).send({
                message: "Please look into selected categories"
            })
        }
        // Store news data in Redis cache for future requests
        await client.set(cacheKey,JSON.stringify(news.data),{ EX: 600 }); // Cache for 10 minutes (600 seconds)
        res.status(200).send({
            news: news.data
        }
        )
    }catch(err){
        console.log(err);
        return res.status(503).send({
            message: "Internal Server Error"
        })
    }

};

const searchNews = async(req,res)=>{
    const { keyword } =req.params;
    console.log(keyword);
    try{
        const news=await axios.get(`https://api.mediastack.com/v1/news?access_key=${process.env.NEWS_API_KEY}&keywords=${keyword}&countries=in,us`);        
        console.log(news.data);
        if(!news){
            return res.status(404).send({
                message: "No News Found For Selected Keyword"
            })
        }
        res.status(200).send({
            news: news.data
        }
        )
    }catch(err){
        console.log(err);
        return res.status(503).send({
            message: "Internal Server Error"
        })
    }
}

module.exports = {
    getCategoryNews,
    searchNews
};