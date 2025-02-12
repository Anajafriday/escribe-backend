const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Translation = require("../model/translationModel");
const Transcription = require("../model/transcriptionModel");
const { Translate } = require("@google-cloud/translate").v2;

// Initialize Google Translate API
const translateWithGoogle = new Translate({
    projectId: process.env.GOOGLE_TRANSLATE_PROJECT_ID,
    key: process.env.GOOGLE_TRANSLATE_API_KEY
});

/**
 * Translates text from the source language to the target language.
 * @param {string} text - The text to be translated.
 * @param {string} from - The source language.
 * @param {string} to - The target language.
 * @returns {Promise<string>} - The translated text.
 */
async function translateText(text, from, to) {
    const [translation] = await translateWithGoogle.translate(text, { from, to });
    console.log("Translated Text:", translation);
    return translation;
}

/**
 * Handles transcript translation and stores the translated text.
 */
exports.translateTranscript = catchAsync(async (req, res, next) => {
    const { transcriptionId, sourceLanguage } = req.params;
    const targetLanguage = req.body.targetLang;

    // Validate input parameters
    if (!transcriptionId || !sourceLanguage || !targetLanguage) {
        return next(new AppError("Missing required fields: transcription ID, source language, or target language.", 400));
    }

    // Fetch transcription from the database
    const transcript = await Transcription.findById(transcriptionId);
    if (!transcript) {
        return next(new AppError("No transcription found with the provided ID.", 404));
    }

    // Prevent translation if it's unavailable or the same language is requested
    if (!transcript.translationAvailable && sourceLanguage === targetLanguage) {
        return next(new AppError("Translation is currently unavailable for this transcript. Please try another one.", 403));
    }

    // Perform translation
    const translatedText = await translateText(transcript.transcript, sourceLanguage, targetLanguage);

    // Save translation to database
    const newTranslation = await Translation.create({
        transcriptionId,
        translatedText,
        sourceLanguage,
        targetLanguage
    });

    // Handle potential failure in updating translation status
    if (!newTranslation) {
        return next(new AppError("Translation failed due to an internal error.", 500));
    }

    await newTranslation.updateTranslationStatus("Completed");

    // Return successful response
    res.status(201).json({
        status: "success",
        data: {
            translatedText
        }
    });
});
