import User from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = "your_jwt_secret_key"; // 👉 use env variable in production
const JWT_EXPIRES = "7d"; // token valid for 7 days

// ========== REGISTER ==========
export const userRegister = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, graduationYear,  position, gpa,  team,  weight, height } = req.body;

    const isExist = await User.findOne({ email });
    if (isExist) {
      return res.status(401).json({ message: "User Already Exist" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashPassword,
      role,
      firstName,
      lastName,
      graduationYear,
      position,
      gpa,
      team,
      weight,
      height
    });

    const savedUser = await newUser.save();

    res.status(200).json({
      message: "Registration Successful",
      data: savedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message || "Something went wrong!",
    });
  }
};

// ========== LOGIN ==========
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User Not Found!" });
    }

    const matchedPassword = await bcrypt.compare(password, user.password);
    if (!matchedPassword) {
      return res.status(401).json({ message: "Wrong Password!" });
    }

    // ===== Generate JWT Token =====
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // ===== Store Token in HTTP-Only Cookie =====
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // ===== Send Response =====
    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message || "Something went wrong!",
    });
  }
};

export const getUser = async(req, res)=>{
  try {


    const email = await req.params.email;
    const user = await User.findOne({email:email});


    res.status(200).json({
      message:"Success",
      data:user
    })
    
  } catch (error) {
    res.status(500).json({
      message:"Somnething went wrong!"
    })
  }
}


export const allUser = async(req, res)=>{
  try {
  const skip = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const users = await User.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);


    res.status(200).json({      message:"Success",
      data:users
    })
    
  } catch (error) {
    res.status(500).json({
      message:error.message 
    })
  }
}