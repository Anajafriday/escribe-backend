const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { getAudioDurationInSeconds } = require("get-audio-duration");
const { createClient } = require("@deepgram/sdk");
const Audio = require("../model/audioModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { formatConversation, parseTranscriptionText } = require("../utils/helper");
// ✅ Configure Deepgram sdk for audio transcription
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// ✅ Configure Cloudinary for file uploads
cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRETE,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

// ✅ Set up Multer storage and file filtering for audio uploads
const multerStorage = multer.memoryStorage();
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
// const allowedMimeTypes = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/webm"];
const allowedMimeTypes = ["audio/mpeg", "audio/wav", "audio/wave", "audio/x-m4a", "audio/mp4", "audio/mp3"];

const multerFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new AppError("Only MP3, WAV, MP4, and WebM files allowed", 400), false);
  }
  cb(null, true);
};

// ✅ Multer instance for handling audio file uploads
exports.uploadAudioFile = multer({
  fileFilter: multerFilter,
  storage: multerStorage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// ✅ Function to get the duration of an audio file
const getAudioDuration = async (buffer) => {
  const tempFilePath = path.join(__dirname, "temp_audio.flac");

  return new Promise((resolve, reject) => {
    fs.writeFile(tempFilePath, buffer, async (err) => {
      if (err) return reject("Failed to write audio file");

      try {
        const duration = await getAudioDurationInSeconds(tempFilePath);
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error("Failed to delete temp file:", err);
        });
        resolve(duration);
      } catch (error) {
        fs.unlinkSync(tempFilePath);
        reject(error);
      }
    });
  });
};

// ✅ Format the transcription output to improve readability
const formatTranscription = (utterances, lang) => {
  let formattedText = "";
  let groupedSpeakers = {};
  let currentSpeaker = "";
  let buffer = "";

  utterances.forEach(({ speaker, transcript }) => {
    const speakerKey = `Speaker:${speaker}`;

    // Grouping text by speaker
    if (!groupedSpeakers[speakerKey]) {
      groupedSpeakers[speakerKey] = [];
    }
    groupedSpeakers[speakerKey].push(transcript);

    // Formatting output
    if (speakerKey === currentSpeaker) {
      buffer += " " + transcript;
    } else {
      if (buffer) formattedText += `${buffer}\n`;
      currentSpeaker = speakerKey;
      buffer = `${speakerKey} ${transcript}`;
    }
  });

  if (buffer) formattedText += `${buffer}\n`;
  const formattedTextObj = formatConversation(parseTranscriptionText(formattedText), lang)
  /*
{
    "Speaker 0": "What type of websites do you often search for?",
    "Speaker 1": "I prefer entertainment and education websites such as Facebook.com, Wikipedia Org, and VOA Special English.",
    "Speaker 2": "I also like visiting news websites like CNN and BBC."
  },
]*/
  return {
    formattedText,
    formattedTextObj
  };
};

// ✅ Transcribe the uploaded audio using Deepgram
exports.transcribeAudio = async (fileUrl) => {
  try {
    // Sending audio file URL to Deepgram for transcription
    const { result: transcription, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: fileUrl },
      {
        model: "nova-3",
        smart_format: true, // Enables automatic punctuation and formatting
        utterances: true, // Enables utterance segmentation
        diarize: true, // Enables speaker identification
        detect_language: true, // Auto-detect language
      }
    );

    if (error) throw new Error(error);

    // Extracting detected language
    const language = transcription.results.channels[0].detected_language;

    // Check if multiple speakers are detected
    const hasMultipleSpeakers = transcription.results.utterances.some((u) => u.speaker > 0);
    // Format conversation if multiple speakers exist
    const formattedConversation = formatTranscription(transcription.results.utterances, transcription.results.channels[0].detected_language);
    const transcript = hasMultipleSpeakers
      ? formattedConversation
      : transcription.results.channels[0].alternatives[0].transcript;
    return { transcript, language };
  } catch (error) {
    console.error("Error during transcription:", error);
    throw error;
  }
};

// ✅ Upload audio file to Cloudinary and save metadata in the database
exports.uploadAudio = catchAsync(async (req, res, next) => {
  if (!req.file)
    return next(new AppError("No audio file provided. Please upload a valid file (max: 25MB).", 400));

  try {
    const audioFile = req.file;

    // Upload to Cloudinary using a stream
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: `${audioFile.originalname}-${Date.now()}`,
          folder: "audioFiles",
          resource_type: "raw",
        },
        (err, response) => (err ? reject(err) : resolve(response))
      ).end(audioFile.buffer);
    });

    if (!uploadResponse)
      return next(new AppError("Failed to upload audio file. Please try again.", 500));

    // Retrieve audio duration
    const duration = await getAudioDuration(audioFile.buffer);
    if (!duration) return next(new AppError("Failed to get audio duration.", 500));

    // Save metadata in the database
    const newAudio = await Audio.create({
      fileName: uploadResponse.display_name,
      fileSize: Math.round(uploadResponse.bytes / (1024 * 1024)), // Convert bytes to MB
      fileUrl: uploadResponse.secure_url,
      duration: Math.round(duration),
    });

    if (!newAudio) return next(new AppError("Failed to save audio. Try again.", 500));

    // Attach audio metadata to request object for next middleware
    req.finalAudio = newAudio;
    next();
  } catch (error) {
    console.error("Upload Error:", error);
    return next(new AppError("An error occurred while uploading.", 500));
  }
});
