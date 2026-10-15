 const mongoose= require("mongoose");

 const dbConnect= async()=>{
    try{
      mongoose.connect(process.env.MONGO_URI)
    }catch(err){
      console.log(`DB error:${err}`);
    }
 }

 module.exports=dbConnect;