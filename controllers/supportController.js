const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Support = require("../model/supportModel");
const User = require("../model/userModel");

/**
 * Handles support messages from users.
 * 
 * - Retrieves user ID based on email if not provided.
 * - Creates a support message record in the database.
 * - (TODO) Sends an email to the support team upon successful submission.
 */
exports.messageSupport = catchAsync(async (req, res, next) => {
    // Allow email to be passed via URL parameters
    if (req.params.email) req.body.email = req.params.email;

    // Retrieve user ID from email if not explicitly provided
    if (!req.body.userId && req.body.email) {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(new AppError("The provided email does not exist in our records.", 404));
        }

        req.body.userId = user.__vid;
    }


    const { subject, message, email, userId } = req.body;

    // Validate required fields
    if (!subject || !message || !email || !userId) {
        return next(new AppError("Missing required fields: subject, message, email, or user ID.", 400));
    }

    // Create a new support message entry
    const newSupport = await Support.create({ subject, userId, message, email });

    // (TODO) Send email notification to the support team when implemented

    // Send response
    res.status(201).json({
        status: "success",
        data: { newSupport },
    });
    // return next(new AppError("An error occurred while submitting the support request.", 500));
});


exports.resolveSupport = catchAsync(async (req, res, next) => {
    const { message } = req.body;

    // Retrieve the support request by ID
    const userSupport = await Support.findById(req.params.supportId);
    if (!userSupport) {
        return next(new AppError("The requested support ticket could not be found.", 404));
    }

    // Check if the support ticket is already resolved
    if (userSupport.status === "Resolved") {
        return next(new AppError("This support request has already been resolved.", 400));
    }

    try {
        // TODO: Send an email notification with the resolution message (message from rich text editor)

        // Update support status to "Resolved"
        await userSupport.updateSupportStatus("Resolved");

        // Send a success response
        res.status(200).json({
            status: "success",
            message: "Support request has been successfully resolved.",
        });
    } catch (err) {
        // Log the error and revert the support status to "Open" in case of failure
        await userSupport.updateSupportStatus("Open");
        return next(new AppError(`An error occurred while resolving support: ${err.message}`, 500));
    }
});
