// Utility for formatting multi-language conversation transcripts

const speakerKeywords = {
    af: "Spreker",   // Afrikaans
    am: "አንደኛ",     // Amharic
    ar: "المتحدث",  // Arabic
    az: "Danışan",  // Azerbaijani
    be: "Дакладчык", // Belarusian
    bg: "Говорител", // Bulgarian
    bn: "স্পিকার",  // Bengali
    bs: "Govornik",  // Bosnian
    ca: "Orador",    // Catalan
    ceb: "Tigsulti", // Cebuano
    cs: "Mluvčí",    // Czech
    cy: "Siaradwr",  // Welsh
    da: "Højttaler", // Danish
    de: "Sprecher",  // German
    el: "Ομιλητής",  // Greek
    en: "Speaker",   // English
    eo: "Parolanto", // Esperanto
    es: "Orador",    // Spanish
    et: "Kõneleja",  // Estonian
    eu: "Hizlaria",  // Basque
    fa: "بلندگو",    // Persian
    fi: "Puhuja",    // Finnish
    fr: "Locuteur",  // French
    fy: "Sprekker",  // Frisian
    ga: "Cainteoir", // Irish
    gd: "Neach-labhairt", // Scottish Gaelic
    gl: "Falante",   // Galician
    gu: "વક્તા",    // Gujarati
    ha: "Mai magana", // Hausa
    haw: "Mea kamaʻilio", // Hawaiian
    he: "דובר",      // Hebrew
    hi: "वक्ता",     // Hindi
    hmn: "Tus hais lus", // Hmong
    hr: "Govornik",  // Croatian
    ht: "Oratè",     // Haitian Creole
    hu: "Beszélő",   // Hungarian
    hy: "Խոսնակ",    // Armenian
    id: "Pembicara", // Indonesian
    ig: "Onye na-ekwu", // Igbo
    is: "Talsmaður", // Icelandic
    it: "Parlante",  // Italian
    ja: "話者",       // Japanese
    jw: "Pambicara", // Javanese
    ka: "მომხსენებელი", // Georgian
    kk: "Спикер",    // Kazakh
    km: "អ្នកនិយាយ", // Khmer
    kn: "ಪ್ರಭಾಷಕ",  // Kannada
    ko: "연설자",    // Korean
    ku: "Bêşdar",   // Kurdish
    ky: "Спикер",    // Kyrgyz
    la: "Orator",    // Latin
    lb: "Spriecher", // Luxembourgish
    lo: "ຜູ້ຂຽນ",  // Lao
    lt: "Garsiakalbis", // Lithuanian
    lv: "Runātājs",  // Latvian
    mg: "Mpiteny",   // Malagasy
    mi: "Kaikorero", // Maori
    mk: "Говорник",  // Macedonian
    ml: "വക്താവ്",  // Malayalam
    mn: "Яригч",    // Mongolian
    mr: "वक्ता",     // Marathi
    ms: "Penceramah", // Malay
    mt: "Kelliem",   // Maltese
    my: "စကားပြောသူ", // Burmese
    ne: "वक्ता",     // Nepali
    nl: "Spreker",   // Dutch
    no: "Høyttaler", // Norwegian
    ny: "Wolankhula", // Chichewa
    or: "ଉଚ୍ଚାରଣକାରୀ", // Odia (Oriya)
    pa: "ਵਕਤਾ",     // Punjabi
    pl: "Mówca",    // Polish
    ps: "ويناوال",  // Pashto
    pt: "Orador",   // Portuguese
    ro: "Vorbitor", // Romanian
    ru: "Говорящий", // Russian
    sd: "اسپيڪر",   // Sindhi
    si: "කථානායක", // Sinhala
    sk: "Rečník",   // Slovak
    sl: "Govornik", // Slovenian
    sm: "Failauga", // Samoan
    sn: "Mutauri",  // Shona
    so: "Qudbadeeyaha", // Somali
    sq: "Folës",    // Albanian
    sr: "Говорник", // Serbian
    st: "Sebui",    // Sesotho
    su: "Panyatur", // Sundanese
    sv: "Talare",   // Swedish
    sw: "Mzungumzaji", // Swahili
    ta: "பேச்சாளர்", // Tamil
    te: "ప్రసంగికుడు", // Telugu
    tg: "Гуфтушунид", // Tajik
    th: "ผู้พูด",    // Thai
    tk: "Gürleýji", // Turkmen
    tl: "Tagapagsalita", // Filipino
    tr: "Konuşmacı", // Turkish
    ug: "سۆزلىگۈچى", // Uyghur
    uk: "Доповідач", // Ukrainian
    ur: "مقرر",     // Urdu
    uz: "Nutq so‘zlovchi", // Uzbek
    vi: "Diễn giả", // Vietnamese
    xh: "Umtetho",  // Xhosa
    yi: "רעדנער",   // Yiddish
    yo: "Onísọ̀rọ̀", // Yoruba
    zh: "发言者",   // Chinese (Simplified)
    zu: "Ukhulumayo" // Zulu
};

/**
 * Parses a raw transcription text and extracts structured utterances
 * @param {string} text - Raw transcription text
 * @returns {Array} - Array of utterance objects with speaker and transcript
 */
exports.parseTranscriptionText = (text) => {
    const utterances = [];
    const lines = text.split("\n"); // Split by new lines

    // Create a dynamic regex to match speaker labels in multiple languages
    const speakerRegex = new RegExp(
        `^(${Object.values(speakerKeywords).join("|")}):(\\d+)\\s(.+)`,
        "i"
    );

    lines.forEach((line) => {
        const match = line.match(speakerRegex);
        if (match) {
            const speaker = parseInt(match[2], 10);
            const transcript = match[3].trim();

            // If the last utterance has the same speaker, merge the transcript
            if (utterances.length > 0 && utterances[utterances.length - 1].speaker === speaker) {
                utterances[utterances.length - 1].transcript += " " + transcript;
            } else {
                utterances.push({ speaker, transcript });
            }
        }
    });

    return utterances;
};

/**
 * Formats an array of utterances into structured conversation objects
 * @param {Array} utterances - Array of speaker utterances
 * @param {string} lang - Detected language code (e.g., 'de' for German)
 * @returns {Array} - Formatted conversation objects
 */
exports.formatConversation = (utterances, lang = "en") => {

    // Default to English "Speaker" if the language is unknown
    const speakerLabel = speakerKeywords[lang] || speakerKeywords["en"];

    const formattedConversations = [];
    let currentConversation = {};

    utterances.forEach(({ speaker, transcript }) => {
        const speakerKey = `${speakerLabel} ${speaker}`;

        // If the current conversation already has a different speaker, push it and start a new one
        if (currentConversation[speakerKey]) {
            formattedConversations.push(currentConversation);
            currentConversation = {};
        }

        // Add transcript to the conversation object
        currentConversation[speakerKey] = transcript;
    });

    // Push the last conversation if not empty
    if (Object.keys(currentConversation).length > 0) {
        formattedConversations.push(currentConversation);
    }

    return formattedConversations;
};
