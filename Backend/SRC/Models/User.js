const { default: mongoose } = require("mongoose");

const userSchema=new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            trim:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true,
        },
        phone:{
            type:String,
            trim:true,
        },
        password:{
            type:String,
            required:true,
            minlength:4,
            select:false,
        },
        role:{
            type:String,
            enum:["user","admin"],
            default:"user",
            index:true,
        },
        isActive:{
            type:Boolean,
            default:true,
        },
        refreshTokenHash: {
            type: String,
            default: null,
            select: false,
        },
    },
    {
        timestamps:true,
    }
);

module.exports=mongoose.model("User",userSchema);