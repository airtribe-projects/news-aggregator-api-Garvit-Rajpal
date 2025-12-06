require('dotenv').config();
const jwt = require('jsonwebtoken');

const authMiddleware=async(req,res,next)=>{
    const authHeader = req.headers['Authorization'] || req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({
            message: "Authorization header missing"
        })
    }

    // Accept bearer or normal token
    const token = authHeader.startsWith('Bearer ')?authHeader.split(' ')[1].trim():authHeader.trim();
    if(!token){
        return res.status(400).send({
            message: "Token not found"
        })
    }
    try{

    
    const decodedToken = await jwt.verify(token,process.env.JWT_SECRET);
    console.log("Decoded Token:",decodedToken);
    req.user=decodedToken;
    next();
}catch(err){
    console.log("Error in auth middleware",err);
    return res.status(403).send({
            message: "Unauthenticated Request"
        })
}

}
module.exports = {authMiddleware};