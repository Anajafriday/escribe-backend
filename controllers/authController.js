const jwt = require("jsonwebtoken")
const catchAsync = require("../utils/catchAsync")
const User = require("../model/userModel")
const AppError = require("../utils/appError")
const createSendToken = (req, res, user, statusCode) => {
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRETE, {
        expiresIn: process.env.JWT_EXPIRES_IN,
        algorithm: "RS512"
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
    createSendToken(req, res, newUser, 201)
})
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) return next(new AppError("Please provide email and password", 400));

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Incorrect email or password", 401));
    }

    const token = user.generateAuthToken();

    res.status(200).json({
        status: "success",
        token,
    });
});

exports.protect = (req, res, next) => {

}

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