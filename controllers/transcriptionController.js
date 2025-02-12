const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Transcription = require("../model/transcriptionModel");
const audioController = require('./audioController');

// ✅ Controller to generate an audio transcript
exports.generateAudioTranscripts = catchAsync(async (req, res, next) => {
    // Retrieve the final audio metadata from the request (added in a previous middleware)
    const audioData = req.finalAudio;

    // If no audio data is found, return an error
    if (!audioData) return next(new AppError("Please specify an audio file", 400));

    try {
        // ✅ Call the transcription function to process the audio
        const { transcript, language } = await audioController.transcribeAudio(audioData.fileUrl);

        // If transcription fails, return an error
        if (!transcript) return next(new AppError("There was a problem while generating the transcript", 500));

        // ✅ Save the transcription data in the database
        const newTranscript = await Transcription.create({
            audio: audioData._id, // Reference to the audio file
            transcript, // Transcribed text
            language, // Detected language
            translationAvailable: !!language // Boolean to indicate if a language was detected
        });

        // ✅ Update the audio transcription status to "Completed"
        await audioData.updateTranscripeStatus("Completed");

        // ✅ Send success response
        res.status(200).json({
            status: "success",
            data: { newTranscript }
        });

    } catch (error) {
        // ✅ If an error occurs, update the transcription status to "Failed"
        await audioData.updateTranscripeStatus("Failed");

        // Log the error for debugging purposes
        console.log("TRANSCRIPTION ERROR: ", error);

        // Return an error response
        next(new AppError(`Transcription failed. Try again later. ${error.message}`, 500));
    }
});

exports.generateAudioTranscriptsOnFileUrl = catchAsync(async (req, res, next) => {
    if (!req.audioUrl || !req.audioId) return next(new AppError("pls specify an audio ", 400))
    // ✅ Call the transcription function to process the audio
    const { transcript, language } = await audioController.transcribeAudio(req.audioUrl);

    // If transcription fails, return an error
    if (!transcript) return next(new AppError("There was a problem while generating the transcript", 500));

    // ✅ Save the transcription data in the database
    const newTranscript = await Transcription.create({
        audio: req.audioId, // Reference to the audio file
        transcript, // Transcribed text
        language, // Detected language
        translationAvailable: !!language // Boolean to indicate if a language was detected
    });
    if (!newTranscript) return next(new AppError("Something went wrong while saving this transcript.", 500))
    // ✅ Send success response
    res.status(201).json({
        status: "success",
        data: { newTranscript }
    });
})
