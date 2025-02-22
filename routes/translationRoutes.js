const express = require("express")
const translationController = require("../controllers/translationController")
const Router = express.Router()
Router.route("/:transcriptionId/:targetLang").post(translationController.translateTranscript)
module.exports = Router;
