const express = require("express")
const translationController = require("../controllers/translationController")
const authController = require("../controllers/authController")

const Router = express.Router()

Router.use(authController.protect, authController.restrictToSubscribedUsers, authController.checkTranscriptionLimit)

Router.route("/:transcriptionId/:targetLang").post(translationController.translateTranscript)

module.exports = Router;
