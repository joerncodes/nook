export type Greeting = {
  language: string;
  text: string;
  // Plain-English meaning of the greeting (literal where interesting,
  // generic ("Hello") otherwise).
  meaning: string;
};

export const GREETINGS: Greeting[] = [
  // English & close cousins
  { language: "English", text: "Hello", meaning: "Hello" },
  { language: "English", text: "Howdy", meaning: "How do you do" },
  { language: "Scots", text: "Awrite", meaning: "Are you alright" },

  // Germanic
  { language: "German", text: "Hallo", meaning: "Hello" },
  { language: "German", text: "Guten Morgen", meaning: "Good morning" },
  { language: "German", text: "Guten Tag", meaning: "Good day" },
  { language: "German", text: "Guten Abend", meaning: "Good evening" },
  { language: "Bavarian", text: "Servus", meaning: "At your service" },
  { language: "Swiss German", text: "Grüezi", meaning: "I greet you" },
  { language: "Austrian German", text: "Grüß Gott", meaning: "God greet you" },
  { language: "Dutch", text: "Hallo", meaning: "Hello" },
  { language: "Dutch", text: "Goedendag", meaning: "Good day" },
  { language: "Frisian", text: "Goeie", meaning: "Good (one)" },
  { language: "Afrikaans", text: "Goeie môre", meaning: "Good morning" },
  { language: "Luxembourgish", text: "Moien", meaning: "Morning" },
  { language: "Yiddish", text: "שלום־עליכם", meaning: "Peace be upon you" },

  // Nordic
  { language: "Danish", text: "Hej", meaning: "Hi" },
  { language: "Danish", text: "Goddag", meaning: "Good day" },
  { language: "Norwegian", text: "God morgen", meaning: "Good morning" },
  { language: "Swedish", text: "Hej", meaning: "Hi" },
  { language: "Icelandic", text: "Góðan daginn", meaning: "Good day" },
  { language: "Faroese", text: "Hey", meaning: "Hi" },

  // Uralic
  { language: "Finnish", text: "Hyvää päivää", meaning: "Good day" },
  { language: "Estonian", text: "Tere", meaning: "Hello" },
  { language: "Hungarian", text: "Szia", meaning: "Hi" },
  { language: "Sámi", text: "Bures", meaning: "Hello" },

  // Baltic
  { language: "Latvian", text: "Sveiki", meaning: "Be well" },
  { language: "Lithuanian", text: "Labas", meaning: "Good" },

  // Romance
  { language: "French", text: "Bonjour", meaning: "Good day" },
  { language: "French", text: "Salut", meaning: "Hi" },
  { language: "Walloon", text: "Bondjoû", meaning: "Good day" },
  { language: "Spanish", text: "Hola", meaning: "Hello" },
  { language: "Spanish", text: "Buenos días", meaning: "Good morning" },
  { language: "Catalan", text: "Bon dia", meaning: "Good day" },
  { language: "Galician", text: "Bo día", meaning: "Good day" },
  { language: "Portuguese", text: "Bom dia", meaning: "Good morning" },
  { language: "Brazilian Portuguese", text: "Oi", meaning: "Hi" },
  { language: "Italian", text: "Ciao", meaning: "Hi" },
  { language: "Italian", text: "Buongiorno", meaning: "Good day" },
  { language: "Sardinian", text: "Salude", meaning: "Health" },
  { language: "Sicilian", text: "Ciau", meaning: "Hi" },
  { language: "Romanian", text: "Bună ziua", meaning: "Good day" },
  { language: "Romansh", text: "Allegra", meaning: "Be merry" },
  { language: "Esperanto", text: "Saluton", meaning: "Greetings" },
  { language: "Latin", text: "Salve", meaning: "Be well" },
  { language: "Latin", text: "Ave", meaning: "Hail" },

  // Hellenic & other Indo-European
  { language: "Greek", text: "Γεια σου", meaning: "Health to you" },
  { language: "Greek", text: "Καλημέρα", meaning: "Good morning" },
  { language: "Albanian", text: "Mirëdita", meaning: "Good day" },
  { language: "Armenian", text: "Բարև", meaning: "Good thing" },

  // Slavic
  { language: "Russian", text: "Здравствуйте", meaning: "Be healthy" },
  { language: "Russian", text: "Доброе утро", meaning: "Good morning" },
  { language: "Ukrainian", text: "Доброго дня", meaning: "Good day" },
  { language: "Belarusian", text: "Прывітанне", meaning: "Greetings" },
  { language: "Polish", text: "Dzień dobry", meaning: "Good day" },
  { language: "Czech", text: "Dobrý den", meaning: "Good day" },
  { language: "Slovak", text: "Dobrý deň", meaning: "Good day" },
  { language: "Slovenian", text: "Dober dan", meaning: "Good day" },
  { language: "Croatian", text: "Dobar dan", meaning: "Good day" },
  { language: "Serbian", text: "Здраво", meaning: "Be healthy" },
  { language: "Bosnian", text: "Dobar dan", meaning: "Good day" },
  { language: "Macedonian", text: "Добар ден", meaning: "Good day" },
  { language: "Bulgarian", text: "Добър ден", meaning: "Good day" },

  // Celtic
  { language: "Welsh", text: "Bore da", meaning: "Good morning" },
  { language: "Welsh", text: "Shwmae", meaning: "How are you" },
  { language: "Irish", text: "Dia dhuit", meaning: "God be with you" },
  { language: "Scottish Gaelic", text: "Madainn mhath", meaning: "Good morning" },
  { language: "Manx", text: "Moghrey mie", meaning: "Good morning" },
  { language: "Cornish", text: "Dydh da", meaning: "Good day" },
  { language: "Breton", text: "Demat", meaning: "Good day" },

  // Turkic
  { language: "Turkish", text: "Merhaba", meaning: "Welcome" },
  { language: "Turkish", text: "Günaydın", meaning: "Good morning" },
  { language: "Azerbaijani", text: "Salam", meaning: "Peace" },
  { language: "Kazakh", text: "Сәлем", meaning: "Peace" },
  { language: "Uzbek", text: "Assalomu alaykum", meaning: "Peace be upon you" },
  { language: "Kyrgyz", text: "Салам", meaning: "Peace" },

  // Iranian
  { language: "Persian", text: "سلام", meaning: "Peace" },
  { language: "Persian", text: "درود", meaning: "Salutations" },
  { language: "Pashto", text: "ستړی مه شې", meaning: "May you not be tired" },
  { language: "Kurdish", text: "Silav", meaning: "Greetings" },
  { language: "Tajik", text: "Салом", meaning: "Peace" },

  // Mongolian
  { language: "Mongolian", text: "Сайн байна уу", meaning: "Are you well" },

  // Semitic
  { language: "Arabic", text: "السلام عليكم", meaning: "Peace be upon you" },
  { language: "Arabic", text: "مرحبا", meaning: "Welcome" },
  { language: "Arabic", text: "صباح الخير", meaning: "Morning of goodness" },
  { language: "Egyptian Arabic", text: "أهلاً", meaning: "Welcome" },
  { language: "Hebrew", text: "שלום", meaning: "Peace" },
  { language: "Hebrew", text: "בוקר טוב", meaning: "Good morning" },
  { language: "Amharic", text: "ሰላም", meaning: "Peace" },
  { language: "Maltese", text: "Bonġu", meaning: "Good day" },

  // Indic
  { language: "Hindi", text: "नमस्ते", meaning: "I bow to the divine in you" },
  { language: "Urdu", text: "السلام علیکم", meaning: "Peace be upon you" },
  { language: "Bengali", text: "নমস্কার", meaning: "Salutations" },
  { language: "Punjabi", text: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", meaning: "God is the eternal truth" },
  { language: "Gujarati", text: "નમસ્તે", meaning: "I bow to you" },
  { language: "Marathi", text: "नमस्कार", meaning: "Salutations" },
  { language: "Nepali", text: "नमस्ते", meaning: "I bow to you" },
  { language: "Sinhala", text: "ආයුබෝවන්", meaning: "May you live long" },

  // Dravidian
  { language: "Tamil", text: "வணக்கம்", meaning: "Salutations" },
  { language: "Telugu", text: "నమస్కారం", meaning: "Salutations" },
  { language: "Kannada", text: "ನಮಸ್ಕಾರ", meaning: "Salutations" },
  { language: "Malayalam", text: "നമസ്കാരം", meaning: "Salutations" },

  // Tibeto-Burman
  { language: "Tibetan", text: "བཀྲ་ཤིས་བདེ་ལེགས", meaning: "Good fortune and well-being" },
  { language: "Burmese", text: "မင်္ဂလာပါ", meaning: "May it be auspicious" },

  // Tai-Kadai & Mon-Khmer
  { language: "Thai", text: "สวัสดี", meaning: "Auspiciousness" },
  { language: "Lao", text: "ສະບາຍດີ", meaning: "Are you well" },
  { language: "Khmer", text: "សួស្ដី", meaning: "Hello" },

  // Austroasiatic & Austronesian
  { language: "Vietnamese", text: "Xin chào", meaning: "Please greetings" },
  { language: "Malay", text: "Selamat pagi", meaning: "A safe morning" },
  { language: "Indonesian", text: "Selamat pagi", meaning: "A safe morning" },
  { language: "Javanese", text: "Sugeng enjing", meaning: "Good morning" },
  { language: "Sundanese", text: "Wilujeng énjing", meaning: "Good morning" },
  { language: "Tagalog", text: "Kamusta", meaning: "How are you" },
  { language: "Cebuano", text: "Kumusta", meaning: "How are you" },

  // East Asian
  { language: "Chinese (Mandarin)", text: "你好", meaning: "You good" },
  { language: "Chinese (Mandarin)", text: "早安", meaning: "Morning peace" },
  { language: "Chinese (Cantonese)", text: "你好", meaning: "You good" },
  { language: "Taiwanese Hokkien", text: "你好", meaning: "You good" },
  { language: "Japanese", text: "こんにちは", meaning: "Good afternoon" },
  { language: "Japanese", text: "おはよう", meaning: "Good morning" },
  { language: "Japanese", text: "こんばんは", meaning: "Good evening" },
  { language: "Korean", text: "안녕하세요", meaning: "Are you at peace" },

  // Polynesian / Pacific
  { language: "Hawaiian", text: "Aloha", meaning: "Love, hello, goodbye" },
  { language: "Maori", text: "Kia ora", meaning: "Be well" },
  { language: "Samoan", text: "Talofa", meaning: "Love to you" },
  { language: "Tongan", text: "Mālō e lelei", meaning: "Thanks for the good" },
  { language: "Fijian", text: "Bula", meaning: "Life" },

  // African
  { language: "Swahili", text: "Jambo", meaning: "Things" },
  { language: "Swahili", text: "Habari", meaning: "News" },
  { language: "Zulu", text: "Sawubona", meaning: "I see you" },
  { language: "Xhosa", text: "Molo", meaning: "Hello" },
  { language: "Yoruba", text: "Bawo ni", meaning: "How are you" },
  { language: "Igbo", text: "Ndewo", meaning: "Respectful greetings" },
  { language: "Hausa", text: "Sannu", meaning: "Hello" },
  { language: "Somali", text: "Subax wanaagsan", meaning: "Good morning" },
  { language: "Malagasy", text: "Salama", meaning: "Peace" },
  { language: "Wolof", text: "Nanga def", meaning: "How are you doing" },

  // Indigenous Americas
  { language: "Quechua", text: "Allianchu", meaning: "Are you well" },
  { language: "Aymara", text: "Kamisaraki", meaning: "How are you" },
  { language: "Guaraní", text: "Mba'éichapa", meaning: "How is it" },
  { language: "Nahuatl", text: "Niltze", meaning: "Hello" },
  { language: "Inuktitut", text: "Ai", meaning: "Hi" },
  { language: "Greenlandic", text: "Aluu", meaning: "Hi" },
  { language: "Cherokee", text: "ᎣᏏᏲ", meaning: "It is good" },
  { language: "Navajo", text: "Yáʼátʼééh", meaning: "It is good" },
  { language: "Lakota", text: "Háu", meaning: "Hello" },
];
