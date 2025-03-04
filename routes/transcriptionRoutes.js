const express = require("express");
const Router = express.Router();
const audioController = require("../controllers/audioController")
const authController = require("../controllers/authController")
const transcriptionController = require("../controllers/transcriptionController")
Router.use(authController.protect, authController.restrictToSubscribedUsers, authController.checkTranscriptionLimit)

Router.route("/").post(audioController.uploadAudioFile.single("audiofile"), audioController.uploadAudio, transcriptionController.generateAudioTranscripts)

module.exports = Router;
