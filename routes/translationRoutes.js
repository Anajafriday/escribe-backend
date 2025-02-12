const express = require("express")
const translationController = require("../controllers/translationController")
const Router = express.Router()
Router.route("/:transcriptionId/:sourceLanguage").post(translationController.translateTranscript)
module.exports = Router;
