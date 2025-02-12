const express = require("express");
const Router = express.Router();
const audioController = require("../controllers/audioController")
const transcriptionController = require("../controllers/transcriptionController")

Router.route("/").post(audioController.uploadAudioFile.single("audiofile"), audioController.uploadAudio, transcriptionController.generateAudioTranscripts)
module.exports = Router;
