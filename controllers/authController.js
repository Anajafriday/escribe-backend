const jwt = require("jsonwebtoken")
const catchAsync = require("../utils/catchAsync")
const User = require("../model/userModel")
const AppError = require("../utils/appError")
const { promisify } = require("util")

const createSendToken = (req, res, user, statusCode) => {
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRETE, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })

    res.status(statusCode).json({
        status: "success", data: {
            user,
            token
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    const { name, email, password, passwordConfirm } = req.body
    const newUser = await User.create({
        name, email, password, passwordConfirm
    })
    if (!newUser) return next(new AppError("something went wrong while signing up", 500))
    createSendToken(req, res, newUser, 201)
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) return next(new AppError("Please provide email and password", 400));

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.checkCorrectPassword(password, user.password))) {
        return next(new AppError("Incorrect email or password", 401));
    }
    user.password = undefined
    createSendToken(req, res, user, 200)
});

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    const authorization = req.headers.authorization
    // check for token
    if (authorization && authorization.startsWith("Bearer") && authorization.split(" ")[1]) {
        token = authorization.split(" ")[1]
    }

    if (!token) return next(new AppError("You need to login", 403))
    // Verify token
    const verifiedTokenId = await promisify(jwt.verify)(token, process.env.JWT_SECRETE)
    // Check if  the token is associated to a user
    const freshUser = await User.findById(verifiedTokenId.userId)
    if (!freshUser) return next(new AppError("user associated with the  specified token could not be found,pls login again", 400))
    //  check if user has recently changed his password
    if (freshUser.CheckPasswordChanged(verifiedTokenId.iat)) return next(new AppError("password was recently changed by user associated with the  specified token", 400))
    // store user on request for the next middle ware
    req.user = freshUser
    // log in user
    next()
})

exports.restrictToSubscribedUsers = (req, res, next) => {
    const user = req.user; // Retrieved from `protect` middleware

    // If trial is still active, allow access
    if (user.isTrialActive && new Date() < new Date(user.trialEndDate)) {
        return next();
    }

    // If user has an active subscription, allow access
    if (user.subscriptionEndDate && new Date() < new Date(user.subscriptionEndDate)) {
        return next();
    }

    // Restrict access if user has no active trial or subscription
    return next(new AppError("You need an active subscription to access this feature.", 403));
};

exports.checkTranscriptionLimit = async (req, res, next) => {
    const user = req.user; // Retrieved from `protect` middleware

    // Decrease transcription limit if on free trial
    const canProceed = await user.decreaseTranscriptionLimit();

    if (!canProceed) {
        return next(new AppError("You've reached your daily transcription limit. Upgrade your plan to continue.", 403));
    }

    next();
};