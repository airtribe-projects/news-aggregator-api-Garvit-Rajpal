const mongoose=require('mongoose');

const usersSchema=mongoose.Schema({
    email:{
        type: "String",
        required: true,
        trim: true,
        unique: true
    },
    name:{
        type: "String",
        required: true,
        trim: true
    },
    password:{
        type: "String",
        required: true
    },
    preferences:[{
        type: "String"
    }]
})

module.exports = mongoose.model("User",usersSchema);