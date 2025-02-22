const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Translation = require("../model/translationModel");
const Transcription = require("../model/transcriptionModel");
// const { Translate } = require("@google-cloud/translate").v2;
const { translate: translateWithBing } = require('bing-translate-api');
const { parseTranscriptionText, formatConversation } = require("../utils/helper");

// Initialize Google Translate API
// const translateWithGoogle = new Translate({
//     projectId: process.env.GOOGLE_TRANSLATE_PROJECT_ID,
//     key: process.env.GOOGLE_TRANSLATE_API_KEY
// });

/**
 * Translates text from one language to another using Bing Translate API.
 * 
 * @param {string | object} text - The text to translate. It can be a plain string or an object with a `formattedText` property.
 * @param {string} from - The source language code (e.g., 'en' for English).
 * @param {string} to - The target language code (e.g., 'de' for German).
 * @returns {Promise<string | object>} - The translated text, either as a plain string or formatted conversation.
 */
async function translateText(text, from, to) {
    // Check if the input text is an object with 'formattedText' property; if so, extract it; otherwise, use it as is
    const formatedText = text?.formattedText ? text.formattedText : text;

    // Call Bing Translate API to get the translated text and detected language
    const { translation, language } = await translateWithBing(formatedText, from, to);

    // If the original text was a formatted conversation, parse and reformat the translation accordingly
    const formatedTranslation = text?.formattedText
        ? formatConversation(parseTranscriptionText(translation), language)
        : translation;

    // Return the translated result
    return formatedTranslation;
}



/**
 * Handles transcript translation and stores the translated text.
 */
exports.translateTranscript = catchAsync(async (req, res, next) => {
    const { transcriptionId, targetLang: targetLanguage } = req.params;
    // const targetLanguage = req.body.targetLang;

    // Validate input parameters
    if (!transcriptionId || !targetLanguage) {
        return next(new AppError("Missing required fields: transcription ID, or target language.", 400));
    }

    // Fetch transcription from the database
    const transcript = await Transcription.findById(transcriptionId);
    if (!transcript) {
        return next(new AppError("No transcription found with the provided ID.", 404));
    }
    const sourceLanguage = transcript.language
    // Prevent translation if it's unavailable or the same language is requested
    if (!transcript.translationAvailable) {
        return next(new AppError("Translation is currently unavailable for this transcript. Please try another one.", 403));
    }
    if (sourceLanguage === targetLanguage)
        return next(new AppError(`You cant translate ${sourceLanguage} to ${targetLanguage} `, 400));

    // Perform translation
    const translatedText = await translateText(transcript.transcript, sourceLanguage, targetLanguage);

    // Save translation to database
    const newTranslation = await Translation.create({
        transcriptionId,
        translatedText,
        sourceLanguage,
        targetLanguage,
        translationTool: "BING"
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
            newTranslation
        }
    });
});
