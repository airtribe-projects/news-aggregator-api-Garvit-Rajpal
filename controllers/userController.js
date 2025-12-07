const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validCategories = ["general", "business", "entertainment", "health", "science", "sports", "technology"];
const emailRegex = /^\S+@\S+\.\S+$/;


const commonPasswords = new Set([
  'password','123456','12345678','qwerty','abc123','password1','iloveyou','admin'
]);

const validatePassword = (password) => {
  if (typeof password !== 'string') return 'Password must be a string';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password is too long';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) return 'Password must contain at least one special character';
  if (/\s/.test(password)) return 'Password must not contain spaces';
  if (commonPasswords.has(password.toLowerCase())) return 'Password is too common';
  return null;
};

// add this helper
const validatePreferences = (prefs, { required = false } = {}) => {
  if (prefs === undefined || prefs === null) {
    return required ? "Preferences are required" : null;
  }
  if (!Array.isArray(prefs)) {
    return "Preferences must be an array of strings";
  }
  for (const p of prefs) {
    if (typeof p !== "string" || !validCategories.includes(p)) {
      return `Invalid preference category: ${p}`;
    }
  }
  return null;
};

const registerUser = async (req, res) => {
  const { name, email, password, preferences } = req.body;
  if (!email || !name || !password) {
    return res.status(400).send({
      message: "Invalid Inputs",
    });
  }
  
  const testEmail=emailRegex.test(email);
  
  if(!testEmail){
    return res.status(400).send({
        message: "Invalid Email Format",
    })
  }
  const pwdError = validatePassword(password);
  if (pwdError) {
    return res.status(400).send({ message: pwdError });
  }
  const preferencesError = validatePreferences(preferences, { required: false });
  if (preferencesError) {
    return res.status(400).send({ message: preferencesError });
  }

  const user = await userModel.findOne({
    email: email,
  });
  if (user) {
    return res.status(400).send({
      message: "User Already Exists. Please Login !!",
    });
  }

  // hash with a safe default rounds
  const saltRounds = Number(process.env.SALT_ROUND) || 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
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
    const preferencesError = validatePreferences(preferences, { required: false });
    if (preferencesError) {
      return res.status(400).send({ message: preferencesError });
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
