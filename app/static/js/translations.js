const TRANSLATIONS = {
  en: {
    appTitle:         'AI Crop Advisor',
    appSubtitle:      'Smart Crop Recommendation using Machine Learning',
    brandSub:         'Random Forest ML · Live Prices',
    tagline:          'Enter your soil data to get the best crop recommendation',
    navPredict:       'Predict',
    navResults:       'Results',
    toggleLang:       'हिंदी में देखें',
    checkingAI:       'Checking AI...',
    heroBadge:        '🌱 Powered by Random Forest Machine Learning',
    heroSubtitle:     'Get accurate crop recommendations based on soil NPK, temperature, humidity, pH, and rainfall.<br>Estimated mandi prices & MSP · OpenWeatherMap · Full Hindi support.',
    statCrops:        'Crops',
    statAccuracy:     'Accuracy',
    statLive:         'Live',
    statPrices:       'Prices',
    statModel:        'Model',
    heroCta:          '🔍 Get Recommendation ↓',
    stepLocation:     'Location',
    stepSoil:         'Soil Data',
    stepResults:      'Results',
    locationTitle:    'Location',
    locationDesc:     'Auto-fills temperature, humidity & rainfall from OpenWeatherMap API',
    useMyLocation:    'Use My Location',
    or:               'OR',
    openMapBtn:       '🗺️ Open Map & Select Location',
    formTitle:        'Soil & Climate Parameters',
    formSubtitle:     'Values from your soil test card',
    demoValuesBtn:    '📝 Demo Values',
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
    guideN:           'Low <40 · Med 40–80 · High >80',
    autoFromWeather:  'auto from location',
    phRange:          '(0–14, 7 = neutral)',
    phAcid:           'Acidic (0)',
    phNeutral:        'Neutral (7)',
    phAlkaline:       'Alkaline (14)',
    resetBtn:         '🔄 Reset',
    predictBtn:       '🔍 Get Crop Recommendation',
    howItWorksTitle:  '⚙️ How It Works',
    howStep1:         'Select location → weather auto-fills',
    howStep2:         'Enter N, P, K, pH from soil card',
    howStep3:         'Click Get Crop Recommendation',
    howStep4:         'Get top-3 crops with confidence %',
    howStep5:         'See live mandi prices + MSP',
    npkGuideTitle:    '🧪 NPK Quick Guide',
    npkNTitle:        'Nitrogen',
    npkNDesc:         'Leaf & stem growth. Found in Urea, DAP',
    npkPTitle:        'Phosphorus',
    npkPDesc:         'Root development & flowering',
    npkKTitle:        'Potassium',
    npkKDesc:         'Disease resistance & fruit quality',
    npkNote:          '📋 Get free soil test at your local KVK',
    profilesTitle:    '🗂️ Regional Profiles',
    profilesDesc:     'Auto-fill with regional soil data',
    profilePunjab:    '🌾 Punjab (Rice-Wheat)',
    profileDeccan:    '🌱 Deccan (Cotton)',
    profileKerala:    '🥥 Kerala (Coconut)',
    profileMp:        '🌿 MP (Soybean)',
    livePricesCardTitle: '💰 Live Prices',
    pillEst:          '📊 Estimate when API key not set',
    resultsTitle:     '🌾 Results',
    shareBtn:         '📤 Share',
    chartTitle:       '📊 Suitability Analysis',
    priceDisclaimer1: '⚠️ Prices are indicative. Contact your local APMC Mandi for final rates.',
    predictAgainBtn:  '↑ Predict Again',
    footerBrand:      '🌾 AI Crop Advisor',
    footerSub:        'Random Forest Machine Learning + Live AGMARKNET Prices',
    poweredBy:        'Python · Flask · Leaflet.js · Open-Meteo',
    footerResources:  '📞 Resources',
    footerTech:       '🔬 Tech Stack',
    footerContact:    'For soil testing contact your local KVK',
    mapTitle:         '🗺️ Select Location on Map',
    mapInstruction:   'Click anywhere on the map to drop a pin · Drag the pin to fine-tune',
    noLocationSelected: 'No location selected yet',
    mapConfirm:       '✅ Use This Location',
    loading:          'Analysing your soil data...',
    loadingSub:       'Consulting 200 decision trees + live market data',
    searchPlaceholder: 'Search city, village, district...'
  },

  hi: {
    appTitle:         'AI फसल सलाहकार',
    appSubtitle:      'मशीन लर्निंग द्वारा स्मार्ट फसल सिफारिश',
    brandSub:         'रैंडम फ़ॉरेस्ट ML · लाइव भाव',
    tagline:          'सबसे उचित फसल जानने के लिए अपनी मिट्टी की जानकारी दर्ज करें',
    navPredict:       'अनुमान',
    navResults:       'परिणाम',
    toggleLang:       'View in English',
    checkingAI:       'AI जाँच हो रही है...',
    heroBadge:        '🌱 रैंडम फ़ॉरेस्ट मशीन लर्निंग द्वारा संचालित',
    heroSubtitle:     'मिट्टी के NPK, तापमान, आर्द्रता, pH और वर्षा के आधार पर सटीक फसल सिफारिश प्राप्त करें。<br>अनुमानित मंडी भाव एवं MSP · OpenWeatherMap · पूर्ण हिंदी समर्थन।',
    statCrops:        'फसलें',
    statAccuracy:     'सटीकता',
    statLive:         'लाइव',
    statPrices:       'भाव',
    statModel:        'मॉडल',
    heroCta:          '🔍 सिफारिश प्राप्त करें ↓',
    stepLocation:     'स्थान',
    stepSoil:         'मिट्टी डेटा',
    stepResults:      'परिणाम',
    locationTitle:    'स्थान',
    locationDesc:     'OpenWeatherMap API से तापमान, आर्द्रता और वर्षा स्वतः भरता है',
    useMyLocation:    'मेरा स्थान उपयोग करें',
    or:               'या',
    openMapBtn:       '🗺️ मानचित्र खोलें और स्थान चुनें',
    formTitle:        'मिट्टी एवं जलवायु पैरामीटर',
    formSubtitle:     'अपने सॉइल टेस्ट कार्ड से मान दर्ज करें',
    demoValuesBtn:    '📝 डेमो मान',
    labelN:           'नाइट्रोजन (N)',
    labelP:           'फॉस्फोरस (P)',
    labelK:           'पोटेशियम (K)',
    labelTemp:        'तापमान',
    labelHumidity:    'आर्द्रता',
    labelPh:          'मिट्टी pH',
    labelRainfall:    'वर्षा',
    unitKgHa:         'किग्रा/हेक्टेयर',
    unitCelsius:      '°से.',
    unitPercent:      '%',
    unitMm:           'मिमी',
    guideN:           'कम <40 · मध्यम 40–80 · अधिक >80',
    autoFromWeather:  'मौसम से स्वतः',
    phRange:          '(0–14, 7 = उदासीन)',
    phAcid:           'अम्लीय (0)',
    phNeutral:        'उदासीन (7)',
    phAlkaline:       'क्षारीय (14)',
    resetBtn:         '🔄 रीसेट',
    predictBtn:       '🔍 फसल सिफारिश प्राप्त करें',
    howItWorksTitle:  '⚙️ यह कैसे काम करता है',
    howStep1:         'स्थान चुनें → मौसम स्वतः भर जाता है',
    howStep2:         'सॉइल कार्ड से N, P, K, pH दर्ज करें',
    howStep3:         'फसल सिफारिश प्राप्त करें पर क्लिक करें',
    howStep4:         'विश्वास % के साथ शीर्ष 3 फसलें देखें',
    howStep5:         'लाइव मंडी भाव + MSP देखें',
    npkGuideTitle:    '🧪 NPK त्वरित गाइड',
    npkNTitle:        'नाइट्रोजन',
    npkNDesc:         'पत्ती और तने का विकास। यूरिया, DAP में पाया जाता है',
    npkPTitle:        'फॉस्फोरस',
    npkPDesc:         'जड़ विकास और फूल आना',
    npkKTitle:        'पोटेशियम',
    npkKDesc:         'रोग प्रतिरोधक क्षमता और फल की गुणवत्ता',
    npkNote:          '📋 अपने स्थानीय KVK से निःशुल्क मिट्टी परीक्षण करवाएं',
    profilesTitle:    '🗂️ क्षेत्रीय प्रोफ़ाइल',
    profilesDesc:     'क्षेत्रीय मिट्टी डेटा के साथ स्वतः भरें',
    profilePunjab:    '🌾 पंजाब (धान-गेहूं)',
    profileDeccan:    '🌱 दक्कन (कपास)',
    profileKerala:    '🥥 केरल (नारियल)',
    profileMp:        '🌿 म.प्र. (सोयाबीन)',
    livePricesCardTitle: '💰 लाइव भाव',
    pillEst:          '📊 API कुंजी न होने पर अनुमान',
    resultsTitle:     '🌾 परिणाम',
    shareBtn:         '📤 शेयर करें',
    chartTitle:       '📊 उपयुक्तता विश्लेषण',
    priceDisclaimer1: '⚠️ भाव सांकेतिक हैं। अंतिम दरों के लिए अपनी स्थानीय APMC मंडी से संपर्क करें।',
    predictAgainBtn:  '↑ पुनः अनुमान लगाएं',
    footerBrand:      '🌾 AI फसल सलाहकार',
    footerSub:        'रैंडम फ़ॉरेस्ट मशीन लर्निंग + लाइव AGMARKNET भाव',
    poweredBy:        'Python · Flask · Leaflet.js · Open-Meteo',
    footerResources:  '📞 संसाधन',
    footerTech:       '🔬 तकनीक स्टैक',
    footerContact:    'मिट्टी परीक्षण के लिए अपने स्थानीय KVK से संपर्क करें',
    mapTitle:         '🗺️ मानचित्र पर स्थान चुनें',
    mapInstruction:   'पिन गिराने के लिए मानचित्र पर कहीं भी क्लिक करें · सटीक करने के लिए पिन खींचें',
    noLocationSelected: 'कोई स्थान नहीं चुना गया',
    mapConfirm:       '✅ इस स्थान का उपयोग करें',
    loading:          'आपकी मिट्टी के डेटा का विश्लेषण हो रहा है...',
    loadingSub:       '200 निर्णय वृक्ष + लाइव बाज़ार डेटा की जाँच जारी है',
    searchPlaceholder: 'शहर, गाँव, जिला खोजें...'
  }
};

let currentLang = 'en';

function t(key) {
    return TRANSLATIONS[currentLang]?.[key]
        ?? TRANSLATIONS['en']?.[key]
        ?? key;
}

function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    currentLang = lang;

    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        const value = t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = value;
        } else {
            el.innerHTML = value;
        }
    });

    document.querySelectorAll('[data-placeholder-key]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-placeholder-key'));
    });

    document.documentElement.lang = lang;
    document.body.style.fontFamily = lang === 'hi' ? "'Noto Sans Devanagari', 'Hind', sans-serif" : "'Poppins', 'Segoe UI', sans-serif";
    localStorage.setItem('cropAdvisor_lang', lang);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

function toggleLanguage() {
    setLanguage(currentLang === 'en' ? 'hi' : 'en');
}

function initLanguage() {
    const saved = localStorage.getItem('cropAdvisor_lang') || 'en';
    setLanguage(saved);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguage);
} else {
    initLanguage();
}