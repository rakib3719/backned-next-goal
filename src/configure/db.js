
import dotenv from 'dotenv'

import mongoose from "mongoose"
dotenv.config();

const connectDB = async()=>{


try {
    const connect = await mongoose.connect('mongodb://localhost:27017/', {
        dbName: 'next-goal', 
      });
   console.log(`moongdo db connected `);
    
} catch (error) {
    console.log(error.message, "error");
}
}

export default connectDB;










