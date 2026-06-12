const LANG_CODES = {
  english: 'en-IN',
  tamil: 'ta-IN',
  malayalam: 'ml-IN',
  hindi: 'hi-IN',
};

const MESSAGES = {
  scan_correct: {
    english: 'Correct. {product} confirmed.',
    tamil: 'சரி. {product} உறுதிப்படுத்தப்பட்டது.',
    malayalam: 'ശരി. {product} സ്ഥിരീകരിച്ചു.',
    hindi: 'सही है। {product} पुष्टि हुई।',
  },
  scan_wrong: {
    english: 'Wrong product. Please scan {product}.',
    tamil: 'தவறான பொருள். {product} ஸ்கேன் செய்யவும்.',
    malayalam: 'തെറ്റായ ഉൽപ്പന്നം. {product} സ്കാൻ ചെയ്യുക.',
    hindi: 'गलत उत्पाद। कृपया {product} स्कैन करें।',
  },
  order_complete: {
    english: 'Order complete. Well done.',
    tamil: 'ஆர்டர் முடிந்தது. நன்றாக செய்தீர்கள்.',
    malayalam: 'ഓർഡർ പൂർത്തിയായി. നന്നായി ചെയ്തു.',
    hindi: 'ऑर्डर पूरा हुआ। शाबाश।',
  },
  feedback_error: {
    english: 'You have a feedback message from your supervisor.',
    tamil: 'உங்கள் மேற்பார்வையாளரிடமிருந்து ஒரு கருத்து உள்ளது.',
    malayalam: 'നിങ്ങളുടെ സൂപ്പർവൈസറിൽ നിന്ന് ഒരു ഫീഡ്ബാക്ക് ഉണ്ട്.',
    hindi: 'आपके सुपरवाइज़र का एक फ़ीडबैक संदेश है।',
  },
  error_wrong_product: {
    english: 'Wrong product was packed',
    tamil: 'தவறான பொருள் பேக் செய்யப்பட்டது',
    malayalam: 'തെറ്റായ ഉൽപ്പന്നം പാക്ക് ചെയ്തു',
    hindi: 'गलत उत्पाद पैक किया गया',
  },
  error_wrong_qty: {
    english: 'Wrong quantity packed',
    tamil: 'தவறான அளவு பேக் செய்யப்பட்டது',
    malayalam: 'തെറ്റായ അളവ് പാക്ക് ചെയ്തു',
    hindi: 'गलत मात्रा पैक की गई',
  },
  error_damaged: {
    english: 'Damaged item was packed',
    tamil: 'கெட்டுப்போன பொருள் பேக் செய்யப்பட்டது',
    malayalam: 'കേടായ ഇനം പാക്ക് ചെയ്തു',
    hindi: 'क्षतिग्रस्त वस्तु पैक की गई',
  },
  error_missing_item: {
    english: 'Item was missing',
    tamil: 'பொருள் காணவில்லை',
    malayalam: 'ഇനം കാണാതായിരുന്നു',
    hindi: 'वस्तु गायब थी',
  },
  error_wrong_label: {
    english: 'Wrong label used',
    tamil: 'தவறான லேபிள் பயன்படுத்தப்பட்டது',
    malayalam: 'തെറ്റായ ലേബൽ ഉപയോഗിച്ചു',
    hindi: 'गलत लेबल का उपयोग किया गया',
  },
  error_packaging: {
    english: 'Packaging issue',
    tamil: 'பேக்கிங் பிரச்சனை',
    malayalam: 'പാക്കേജിംഗ് പ്രശ്നം',
    hindi: 'पैकेजिंग समस्या',
  },
  order_complete_title: {
    english: 'Order Complete!',
    tamil: 'ஆர்டர் முடிந்தது!',
    malayalam: 'ഓർഡർ പൂർത്തിയായി!',
    hindi: 'ऑर्डर पूरा!',
  },
  i_understand: {
    english: 'I understand',
    tamil: 'புரிந்தது',
    malayalam: 'മനസ്സിലായി',
    hindi: 'समझ गया',
  },
  feedback_header: {
    english: 'Feedback from supervisor',
    tamil: 'மேற்பார்வையாளரிடமிருந்து கருத்து',
    malayalam: 'സൂപ്പർവൈസറിൽ നിന്നുള്ള ഫീഡ്ബാക്ക്',
    hindi: 'सुपरवाइज़र से फ़ीडबैक',
  },
  login: {
    english: 'Login',
    tamil: 'உள்நுழை',
    malayalam: 'ലോഗിൻ',
    hindi: 'लॉगिन',
  },
  manual_entry_hint: {
    english: 'Type the product code if scan fails',
    tamil: 'ஸ்கேன் தோல்வியடைந்தால் பொருள் குறியீட்டை தட்டச்சு செய்யவும்',
    malayalam: 'സ്കാൻ പരാജയപ്പെട്ടാൽ ഉൽപ്പന്ന കോഡ് ടൈപ്പ് ചെയ്യുക',
    hindi: 'स्कैन विफल होने पर उत्पाद कोड टाइप करें',
  },
};

export const LANG_LABELS = {
  english: { button: 'EN', native: 'English' },
  tamil: { button: 'தமிழ்', native: 'Tamil' },
  malayalam: { button: 'മലയ', native: 'Malayalam' },
  hindi: { button: 'हिं', native: 'Hindi' },
};

let voicesLoaded = false;

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (voicesLoaded) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    voicesLoaded = true;
  };
}

function pickVoice(lang) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  const code = LANG_CODES[lang] || LANG_CODES.english;
  const prefix = code.split('-')[0];

  return (
    voices.find((v) => v.lang === code) ||
    voices.find((v) => v.lang?.startsWith(prefix)) ||
    voices.find((v) => v.lang?.startsWith('en')) ||
    voices[0] ||
    null
  );
}

function applyReplacements(text, replacements = {}) {
  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    text
  );
}

export function getMessage(key, lang = 'english', replacements = {}) {
  const message = MESSAGES[key]?.[lang] || MESSAGES[key]?.english || key;
  return applyReplacements(message, replacements);
}

export function speak(text, lang = 'english', rate = 0.8) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return null;

  loadVoices();
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_CODES[lang] || LANG_CODES.english;
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function speakMessage(key, lang = 'english', replacements = {}) {
  const text = getMessage(key, lang, replacements);
  return speak(text, lang);
}

export function speakProductName(product, lang = 'english') {
  const name = getProductName(product, lang);
  return speak(name, lang, 0.75);
}

export function getWorkerLang() {
  if (typeof window === 'undefined') return 'english';
  return localStorage.getItem('farmscan_lang') || 'english';
}

export function setWorkerLang(lang) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('farmscan_lang', lang);
  }
}

export function getProductName(product, lang = 'english') {
  const fieldMap = {
    english: 'name_english',
    tamil: 'name_tamil',
    malayalam: 'name_malayalam',
    hindi: 'name_hindi',
  };
  const field = fieldMap[lang] || 'name_english';
  return product?.[field] || product?.name_english || product?.product_id || '';
}

export function getErrorMessageKey(errorCode) {
  const map = {
    'ERR-001': 'error_wrong_product',
    'ERR-002': 'error_wrong_qty',
    'ERR-003': 'error_damaged',
    'ERR-004': 'error_missing_item',
    'ERR-005': 'error_wrong_label',
    'ERR-006': 'error_packaging',
  };
  return map[errorCode] || 'error_packaging';
}

export function extractProductIdFromScan(value) {
  if (!value) return '';
  const trimmed = value.trim().toUpperCase();
  if (trimmed.includes('/p/')) {
    return trimmed.split('/p/')[1]?.split(/[?#]/)[0]?.trim() || '';
  }
  return trimmed;
}
