const mongoose=require("mongoose");

const paymentSchema=new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
            index:true,
        },
        articleIds:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Article",
            required:true,
            index:true,
        }],
        packageSummary:[{
            packageId:{ type:mongoose.Schema.Types.ObjectId, ref:"Package", required:true },
            packageName:{ type:String, required:true },
            unitPrice:{ type:Number, required:true, min:0 },
            quantity:{ type:Number, required:true, min:1 },
        }],
        publisherSummary:[{
            publisherId:{ type:mongoose.Schema.Types.ObjectId, ref:"Publisher", required:true },
            publisherName:{ type:String, required:true },
            unitPrice:{ type:Number, required:true, min:0 },
            quantity:{ type:Number, required:true, min:1 },
        }],
        razorpayOrderId:
        {
            type:String,
            required:true,
            unique:true,
            index:true,
        },
        razorpayPaymentId:{
            type:String,
            default:null,
            index:true,
        },
        razorpaySignature:{
            type:String,
            default:null,
        },
        amount:{
            type:Number,
            required:true,
            min:0,
        },
        currency:{
            type:String,
            default:"INR",
        },
        status:{
            type:String,
            enum:["created", "paid", "failed", "refunded"],
            default:"created",
            index:true,
        },
        paidAt:{
            type:Date,
            default:null,
        },
    },
    {
        timestamps:true,
    }
);
module.exports=mongoose.model("Payment",paymentSchema);
