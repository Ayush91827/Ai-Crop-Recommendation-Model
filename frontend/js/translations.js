/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   TRANSLATIONS: English ↔ Hindi (हिंदी)                          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * WHAT THIS FILE DOES:
 *   Provides complete bilingual support for the application.
 *   Contains all UI text in both English and Hindi (Devanagari script).
 *
 * HOW IT WORKS:
 *   1. t('key') returns the text in current language
 *   2. Calling setLanguage('hi') switches all UI text to Hindi
 *   3. DOM elements with data-key="key" are auto-updated
 *
 * INTERVIEW: "How is this different from i18n libraries like i18next?"
 *   → i18next: Heavy, handles plurals, interpolation, namespaces, fallbacks
 *   → Our approach: Lightweight, zero dependencies, easy to extend
 *   → For production: Use i18next with JSON translation files per language
 *   → Also: Browser's Intl API handles number/date formatting per locale
 *
 * ADDING A NEW LANGUAGE (e.g., Marathi):
 *   1. Add 'mr' key to TRANSLATIONS object
 *   2. Copy all keys from 'en' and translate values
 *   3. Add the language button in HTML
 */

const TRANSLATIONS = {

  // ─────────────── ENGLISH ───────────────
  en: {
    // Page title & branding
    appTitle:         'AI Crop Advisor',
    appSubtitle:      'Smart Crop Recommendation using Machine Learning',
    tagline:          'Enter your soil data to get the best crop recommendation',

    // Navigation
    navHome:          'Home',
    navAbout:         'About',
    navPrices:        'Market Prices',
    navContact:       'Contact',

    // Language toggle button
    toggleLang:       'हिंदी में देखें',

    // Location section
    locationTitle:    '📍 Location',
    useMyLocation:    'Use My Location',
    searchLocation:   'Search Location',
    searchPlaceholder:'Search city, village, district...',
    searchBtn:        'Search',
    locationDetecting:'Detecting location...',
    locationFound:    'Location detected',
    locationNotFound: 'Could not detect location',
    or:               'OR',

    // Soil parameters form
    formTitle:        '🌱 Soil & Climate Parameters',
    formSubtitle:     'Fill in your soil test report values or use weather data',
    labelN:           'Nitrogen (N)',
    labelP:           'Phosphorus (P)',
    labelK:           'Potassium (K)',
    labelTemp:        'Temperature',
    labelHumidity:    'Humidity',
    labelPh:          'Soil pH',
    labelRainfall:    'Rainfall',
    unitKgHa:         'kg/ha',
    unitCelsius:      '°C',
    unitPercent:      '%',
    unitMm:           'mm',
    phRange:          '(0–14, 7 = neutral)',
    autoFromWeather:  '(auto from weather)',
    predictBtn:       '🔍 Get Crop Recommendation',
    resetBtn:         'Reset',

    // Results section
    resultsTitle:     '🌾 Recommended Crops',
    topRecommendation:'Best Crop for Your Soil',
    confidence:       'Confidence',
    alternativeCrops: 'Alternative Crops',
    moreOptions:      'More Options',

    // Crop info labels
    season:           'Season',
    category:         'Category',
    waterReq:         'Water Required',
    duration:         'Crop Duration',
    difficulty:       'Difficulty',
    expectedProfit:   'Expected Profit/Ha',

    // Price section
    priceTitle:       '💰 Market Prices',
    mspLabel:         'MSP (Govt. Minimum)',
    marketRange:      'Market Range',
    priceTrend:       'Price Trend',
    priceUnit:        'per Quintal (100 kg)',
    trendRising:      '📈 Rising',
    trendStable:      '➡️  Stable',
    trendFalling:     '📉 Falling',
    trendSeasonal:    '🌀 Seasonal',
    priceNote:        'Prices are indicative. Contact your local Mandi (APMC) for current rates.',

    // Weather card
    weatherTitle:     '🌤️ Current Weather',
    tempLabel:        'Temperature',
    humidLabel:       'Humidity',
    rainfallLabel:    'Rainfall (monthly est.)',
    weatherFrom:      'Weather data from OpenWeatherMap',

    // Map
    mapTitle:         '🗺️ Select Location on Map',
    mapInstruction:   'Click on the map to select a location, or drag the marker',
    mapConfirm:       'Use This Location',

    // Confidence chart
    chartTitle:       'Crop Suitability Analysis',
    suitability:      'Suitability Score',

    // Status messages
    loading:          'Analyzing soil data...',
    errorGeneral:     'Something went wrong. Please try again.',
    errorNoInternet:  'No internet connection.',
    errorMLDown:      'AI service is starting up. Please wait...',
    noLocationPerm:   'Location permission denied. Please search manually.',
    successPredicted: 'Recommendation ready!',

    // Tips section
    tipsTitle:        '💡 Soil Improvement Tips',
    tipLowN:          'Low Nitrogen: Apply urea (46-0-0) or organic compost',
    tipLowP:          'Low Phosphorus: Apply DAP (18-46-0) fertilizer',
    tipLowK:          'Low Potassium: Apply Muriate of Potash (MOP)',
    tipHighPh:        'High pH (alkaline): Add sulfur or gypsum',
    tipLowPh:         'Low pH (acidic): Add agricultural lime (calcium carbonate)',

    // Footer
    footerNote:       'Predictions are based on ML model trained on agricultural data.',
    footerContact:    'For accurate soil testing, contact your local KVK (Krishi Vigyan Kendra)',
    poweredBy:        'Powered by Random Forest ML · Node.js · Python Flask',
  },


  // ─────────────── हिंदी ───────────────
  hi: {
    // Page title & branding
    appTitle:         'AI फसल सलाहकार',
    appSubtitle:      'मशीन लर्निंग द्वारा स्मार्ट फसल सिफारिश',
    tagline:          'सबसे उचित फसल जानने के लिए अपनी मिट्टी की जानकारी दर्ज करें',

    // Navigation
    navHome:          'होम',
    navAbout:         'जानकारी',
    navPrices:        'बाज़ार भाव',
    navContact:       'संपर्क',

    // Language toggle
    toggleLang:       'View in English',

    // Location section
    locationTitle:    '📍 स्थान',
    useMyLocation:    'मेरा स्थान उपयोग करें',
    searchLocation:   'स्थान खोजें',
    searchPlaceholder:'शहर, गाँव, जिला खोजें...',
    searchBtn:        'खोजें',
    locationDetecting:'स्थान पहचाना जा रहा है...',
    locationFound:    'स्थान मिल गया',
    locationNotFound: 'स्थान नहीं मिला',
    or:               'या',

    // Soil parameters form
    formTitle:        '🌱 मिट्टी एवं मौसम की जानकारी',
    formSubtitle:     'अपनी मिट्टी परीक्षण रिपोर्ट के अनुसार जानकारी भरें',
    labelN:           'नाइट्रोजन (N)',
    labelP:           'फॉस्फोरस (P)',
    labelK:           'पोटेशियम (K)',
    labelTemp:        'तापमान',
    labelHumidity:    'नमी (आर्द्रता)',
    labelPh:          'मिट्टी pH',
    labelRainfall:    'वर्षा',
    unitKgHa:         'किग्रा/हेक्टेयर',
    unitCelsius:      '°सेल्सियस',
    unitPercent:      '%',
    unitMm:           'मिमी',
    phRange:          '(0–14, 7 = उदासीन)',
    autoFromWeather:  '(मौसम से स्वतः)',
    predictBtn:       '🔍 फसल की सिफारिश पाएं',
    resetBtn:         'रीसेट करें',

    // Results section
    resultsTitle:     '🌾 अनुशंसित फसलें',
    topRecommendation:'आपकी मिट्टी के लिए सर्वोत्तम फसल',
    confidence:       'विश्वसनीयता',
    alternativeCrops: 'वैकल्पिक फसलें',
    moreOptions:      'और विकल्प',

    // Crop info labels
    season:           'मौसम',
    category:         'श्रेणी',
    waterReq:         'पानी की जरूरत',
    duration:         'फसल अवधि',
    difficulty:       'कठिनाई',
    expectedProfit:   'अनुमानित लाभ/हेक्टेयर',

    // Price section
    priceTitle:       '💰 बाज़ार भाव',
    mspLabel:         'MSP (सरकारी न्यूनतम मूल्य)',
    marketRange:      'बाज़ार मूल्य सीमा',
    priceTrend:       'मूल्य प्रवृत्ति',
    priceUnit:        'प्रति क्विंटल (100 किग्रा)',
    trendRising:      '📈 बढ़ रहा है',
    trendStable:      '➡️  स्थिर है',
    trendFalling:     '📉 घट रहा है',
    trendSeasonal:    '🌀 मौसमी',
    priceNote:        'भाव सांकेतिक हैं। वर्तमान दर के लिए अपनी स्थानीय मंडी (APMC) से संपर्क करें।',

    // Weather card
    weatherTitle:     '🌤️ वर्तमान मौसम',
    tempLabel:        'तापमान',
    humidLabel:       'आर्द्रता',
    rainfallLabel:    'वर्षा (मासिक अनुमान)',
    weatherFrom:      'मौसम डेटा: OpenWeatherMap',

    // Map
    mapTitle:         '🗺️ मानचित्र पर स्थान चुनें',
    mapInstruction:   'स्थान चुनने के लिए मानचित्र पर क्लिक करें',
    mapConfirm:       'यह स्थान उपयोग करें',

    // Confidence chart
    chartTitle:       'फसल उपयुक्तता विश्लेषण',
    suitability:      'उपयुक्तता स्कोर',

    // Status messages
    loading:          'मिट्टी डेटा का विश्लेषण हो रहा है...',
    errorGeneral:     'कुछ गड़बड़ हुई। कृपया पुनः प्रयास करें।',
    errorNoInternet:  'इंटरनेट कनेक्शन नहीं है।',
    errorMLDown:      'AI सेवा शुरू हो रही है। कृपया प्रतीक्षा करें...',
    noLocationPerm:   'स्थान अनुमति नहीं मिली। कृपया मैन्युअल खोजें।',
    successPredicted: 'सिफारिश तैयार है!',

    // Tips section
    tipsTitle:        '💡 मिट्टी सुधार के सुझाव',
    tipLowN:          'नाइट्रोजन कम: यूरिया (46-0-0) या जैविक खाद डालें',
    tipLowP:          'फॉस्फोरस कम: DAP (18-46-0) उर्वरक डालें',
    tipLowK:          'पोटेशियम कम: MOP (Muriate of Potash) डालें',
    tipHighPh:        'pH अधिक (क्षारीय): गंधक या जिप्सम मिलाएं',
    tipLowPh:         'pH कम (अम्लीय): कृषि चूना (कैल्शियम कार्बोनेट) मिलाएं',

    // Footer
    footerNote:       'पूर्वानुमान कृषि डेटा पर प्रशिक्षित ML मॉडल पर आधारित है।',
    footerContact:    'सटीक मिट्टी परीक्षण के लिए अपने KVK (कृषि विज्ञान केंद्र) से संपर्क करें',
    poweredBy:        'Random Forest ML · Node.js · Python Flask द्वारा संचालित',
  }
};

// Current active language
let currentLang = 'en';

/**
 * Get translation for a key.
 * Falls back to English if key not found in selected language.
 *
 * Usage: t('predictBtn') → "🔍 Get Crop Recommendation" (en)
 *                        → "🔍 फसल की सिफारिश पाएं" (hi)
 */
function t(key) {
    return TRANSLATIONS[currentLang]?.[key]
        ?? TRANSLATIONS['en']?.[key]
        ?? key;  // Last resort: return the key itself
}

/**
 * Set the active language and update all translated DOM elements.
 *
 * Elements with data-key="someKey" are automatically updated.
 * Elements with data-placeholder-key="someKey" have placeholder updated.
 *
 * HOW TO USE IN HTML:
 *   <h1 data-key="appTitle">AI Crop Advisor</h1>
 *   <input data-placeholder-key="searchPlaceholder" />
 *   <button data-key="predictBtn">Get Recommendation</button>
 */
function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) {
        console.warn(`Language '${lang}' not found. Available: ${Object.keys(TRANSLATIONS)}`);
        return;
    }

    currentLang = lang;

    // Update all elements with data-key attribute
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        const value = t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = value;
        } else {
            el.textContent = value;
        }
    });

    // Update placeholder attributes
    document.querySelectorAll('[data-placeholder-key]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-placeholder-key'));
    });

    // Update document language for accessibility
    document.documentElement.lang = lang;

    // Update font for better Hindi rendering
    if (lang === 'hi') {
        document.body.style.fontFamily = "'Noto Sans Devanagari', 'Hind', sans-serif";
    } else {
        document.body.style.fontFamily = "'Poppins', 'Segoe UI', sans-serif";
    }

    // Store preference in localStorage
    localStorage.setItem('cropAdvisor_lang', lang);

    // Emit custom event (other modules can listen)
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

/**
 * Toggle between English and Hindi.
 * Called by the language button click handler.
 */
function toggleLanguage() {
    setLanguage(currentLang === 'en' ? 'hi' : 'en');
}

/**
 * Initialize language from user's saved preference.
 * Called once when the page loads.
 */
function initLanguage() {
    const saved = localStorage.getItem('cropAdvisor_lang') || 'en';
    setLanguage(saved);
}

/**
 * Get Hindi name for a crop (for display in results).
 */
const CROP_HINDI_NAMES = {
    rice: 'चावल', maize: 'मक्का', chickpea: 'चना',
    kidneybeans: 'राजमा', pigeonpeas: 'अरहर दाल', mothbeans: 'मोठ',
    mungbean: 'मूंग', blackgram: 'उड़द दाल', lentil: 'मसूर',
    pomegranate: 'अनार', banana: 'केला', mango: 'आम',
    grapes: 'अंगूर', watermelon: 'तरबूज', muskmelon: 'खरबूज',
    apple: 'सेब', orange: 'संतरा', papaya: 'पपीता',
    coconut: 'नारियल', cotton: 'कपास', jute: 'जूट', coffee: 'कॉफ़ी'
};

function getCropHindiName(cropName) {
    return CROP_HINDI_NAMES[cropName.toLowerCase()] || cropName;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguage);
} else {
    initLanguage();
}
