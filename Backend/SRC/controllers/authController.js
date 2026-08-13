//import(module)
const bcrypt = require("bcryptjs");

const User = require("../Models/User");

const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/token");

//register(Module)
const register=asyncHandler(async(req,res)=>{
    const {name,email,phone,password,}=req.body || {};
    //Validation
    if(!name || !email || !password){
        throw new ApiError(400,"Name,email and password are required");
    }
    //Check existing user
    const existingUser=await User.findOne({
        email:email.toLowerCase(),
    });
    if (existingUser){
        throw new ApiError(409,"User already exists with this email");
    }
    //Hash password
    const hashedPassword=await bcrypt.hash(password,12);
    //Create user
    const user=await User.create({
        name,
        email:email.toLowerCase(),
        phone,
        password:hashedPassword
    });
    // Remove password
  const userResponse = user.toObject();
  delete userResponse.password;

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        userResponse,
        "Registration successful"
      )
    );   
});
//login(Module)
const login = asyncHandler(async (req, res) => {
  const {
    email,
    password,
  } = req.body || {};

  if (!email || !password) {
    throw new ApiError(
      400,
      "Email and password are required"
    );
  }

  // Explicitly select password because User schema
  // should have select:false
  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select("+password");

  if (!user) {
    throw new ApiError(
      401,
      "Invalid email or password"
    );
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      "Your account is inactive"
    );
  }

  // Compare password
  const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordCorrect) {
    throw new ApiError(
      401,
      "Invalid email or password"
    );
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: userResponse,
        accessToken,
        refreshToken,
      },
      "Login successful"
    )
  );
});
//Refresh token(module)
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(
      401,
      "Refresh token is required"
    );
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(
      401,
      "Invalid or expired refresh token"
    );
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new ApiError(
      401,
      "User not found"
    );
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      "User account is inactive"
    );
  }

  const accessToken = generateAccessToken(user);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken,
      },
      "Access token refreshed"
    )
  );
});
//Get current user
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new ApiError(
      404,
      "User not found"
    );
  }

  res.status(200).json(
    new ApiResponse(
      200,
      user,
      "user fetched successfully"
    )
  );
});

//Export(Module)
module.exports = {
  register,
  login,
  refreshAccessToken,
  getMe,
};
