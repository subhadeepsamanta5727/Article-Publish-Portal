const crypto = require("crypto");
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

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setAuthCookies = (res, refreshToken) => {
  res.cookie("seo_refresh_token", refreshToken, refreshCookieOptions);
  res.cookie("seo_csrf_token", crypto.randomBytes(32).toString("hex"), {
    secure: refreshCookieOptions.secure,
    sameSite: "strict",
    path: "/",
    maxAge: refreshCookieOptions.maxAge,
  });
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

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
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();
  setAuthCookies(res, refreshToken);

  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: userResponse,
        accessToken,
      },
      "Login successful"
    )
  );
});
//Refresh token(module)
const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.seo_refresh_token;

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

  const user = await User.findById(decoded.userId).select("+refreshTokenHash");

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

  if (!user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new ApiError(401, "Refresh token has been rotated or revoked");
  }

  const accessToken = generateAccessToken(user);
  const rotatedRefreshToken = generateRefreshToken(user);
  user.refreshTokenHash = hashToken(rotatedRefreshToken);
  await user.save();
  setAuthCookies(res, rotatedRefreshToken);

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

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.seo_refresh_token;
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      await User.findByIdAndUpdate(decoded.userId, { $set: { refreshTokenHash: null } });
    } catch {
      // Clearing the cookies is sufficient when the refresh token is already invalid.
    }
  }
  res.clearCookie("seo_refresh_token", refreshCookieOptions);
  res.clearCookie("seo_csrf_token", { ...refreshCookieOptions, httpOnly: false, path: "/" });
  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
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
  logout,
  getMe,
};
