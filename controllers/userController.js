const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validCategories = ["general", "business", "entertainment", "health", "science", "sports", "technology"];
const emailRegex = /^\S+@\S+\.\S+$/;

const registerUser = async (req, res) => {
  const { name, email, password, preferences } = req.body;
  if (!email || !name || !password) {
    console.log("Invalid Inputs");
    return res.status(400).send({
      message: "Invalid Inputs",
    });
  }
  
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
  if(preferences&&preferences.length>0){

      if(!Array.isArray(preferences)){
        return res.status(400).send({
          message: "Preferences must be an array of strings",
        })
      }
      for(const preference of preferences){
        if(!validCategories.includes(preference)||typeof preference !== 'string'){
          return res.status(400).send({
            message: `Invalid preference category: ${preference}`,
          })
        }
    
      }
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
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send({
      message: "Invalid Inputs",
    });
  }
  const testEmail=emailRegex.test(email);
  
  if(!testEmail){
    console.log("Invalid Email Format");
    return res.status(400).send({
        message: "Invalid Email Format",
    })
  }
  const findUser = await userModel.findOne({
    email: email,
  });
  if (!findUser) {
    return res.status(404).send({
      message: "User Doesn't Exist",
    });
  }
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
};

const getUserPreferences = async(req,res)=>{
    const user=await userModel.findOne({
        email: req.user.email
    })
    if(!user){
        return res.status(503).send({
            message: "Internal Server Error"
        })
    }
     res.status(200).send({
        preferences: user.preferences
    });
}

const updateUserPreferences = async(req,res)=>{
    const { preferences } =req.body;
    const user=await userModel.findOne({
        email: req.user.email
    })
    if(!user){
        return res.status(503).send({
            message: "Internal Server Error"
        })
    }
    if(!Array.isArray(preferences)){
      return res.status(400).send({
        message: "Preferences must be an array of strings",
      })
    }
    for(const preference of preferences){
      if(!validCategories.includes(preference)||typeof preference !== 'string'){
        return res.status(400).send({
          message: `Invalid preference category: ${preference}`,
        })
      }
    }
     user.preferences= preferences;
     const updatedUser=await user.save();
     res.status(200).send({
        preferences:updatedUser.preferences
    });
};

module.exports = {
  registerUser,
  loginUser,
  getUserPreferences,
  updateUserPreferences
};
