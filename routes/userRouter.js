require("dotenv").config();
const router = require("express").Router();
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {authMiddleware}=require("../middlewares/authMiddleware");
const axios = require("axios");

router.post("/signup", async (req, res) => {
  const { name, email, password, preferences } = req.body;
  if (!email || !name || !password) {
    console.log("Invalid Inputs");
    return res.status(400).send({
      message: "Invalid Inputs",
    });
  }
  const emailRegex = /^\S+@\S+\.\S+$/;
  const testEmail=emailRegex.test(email);
  
  if(!testEmail){
    console.log("Invalid Email Format");
    return res.status(400).send({
        message: "Invalid Email Format",
    })
  }
  if(password.length<6){
    console.log("Password must be at least 6 characters");
    return res.status(400).send({
        message: "Password must be at least 6 characters",
    })
  }
  const user = await userModel.findOne({
    email: email,
  });
  if (user) {
    console.log("User Already Exists. Please Login !!",user);
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
    return res.status(401).send({
      message: "Wrong Username or password",
    });
  }
  const token = await jwt.sign(
    {
      email: findUser.email,
      name: findUser.name
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

router.get("/preferences",authMiddleware,async(req,res)=>{
    console.log(req.user.email);
    const user=await userModel.findOne({
        email: req.user.email
    })
    if(!user){
        return res.status(501).send({
            message: "Internal Server Error"
        })
    }
     res.status(200).send({
        preferences: user.preferences
    });
})

router.put("/preferences",authMiddleware,async(req,res)=>{
    const { preferences } =req.body;
    console.log(req.user.email);
    const user=await userModel.findOne({
        email: req.user.email
    })
    if(!user){
        return res.status(501).send({
            message: "Internal Server Error"
        })
    }
     user.preferences= preferences;
     const updatedUser=await user.save();
     res.status(200).send({
        preferences:updatedUser.preferences
    });
})

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
