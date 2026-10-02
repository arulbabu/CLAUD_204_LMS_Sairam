// Construction Safety Quiz — 5 questions, multilingual (English / Tamil / Hindi)
var QUIZ_QUESTIONS = [
  {
    category: "PPE",
    question: {
      en: "What is the primary purpose of a hard hat on a construction site?",
      ta: "கட்டுமான தளத்தில் ஹார்ட் ஹேட் (பாதுகாப்பு தலைக்கவசம்) அணிவதன் முதன்மை நோக்கம் என்ன?",
      hi: "निर्माण स्थल पर हार्ड हैट (सुरक्षा हेलमेट) पहनने का मुख्य उद्देश्य क्या है?"
    },
    image: "assets/images/q1.png",
    imageCaption: "",
    optionImages: {
      A: "assets/images/options/q1-A.jpg",
      B: "assets/images/options/q1-B.jpg",
      C: "assets/images/options/q1-C.jpg",
      D: "assets/images/options/q1-D.jpg"
    },
    options: {
      A: {
        en: "To protect the head from falling or flying objects",
        ta: "விழும் அல்லது பறக்கும் பொருட்களிலிருந்து தலையைப் பாதுகாத்தல்",
        hi: "सिर को गिरने वाली या उड़ने वाली वस्तुओं से बचाना"
      },
      B: {
        en: "To keep the sun off the worker's face",
        ta: "வெயிலிலிருந்து முகத்தைப் பாதுகாத்தல்",
        hi: "धूप से चेहरे को बचाना"
      },
      C: {
        en: "To identify the worker's department",
        ta: "தொழிலாளியின் துறையை அடையாளம் காண்பதற்கு",
        hi: "कर्मचारी के विभाग की पहचान करना"
      },
      D: {
        en: "To improve ventilation while working",
        ta: "வேலை செய்யும்போது காற்றோட்டத்தை மேம்படுத்துவதற்கு",
        hi: "काम करते समय हवा का आना-जाना बेहतर बनाना"
      }
    },
    correct: "A"
  },
  {
    category: "Work at Height",
    question: {
      en: "When placing an extension ladder against a wall, what is the safe angle (the 4:1 rule)?",
      ta: "ஒரு நீட்டு ஏணியை சுவரில் சாய்த்து வைக்கும்போது, பாதுகாப்பான கோணம் (4:1 விதி) என்ன?",
      hi: "दीवार के सहारे एक्सटेंशन सीढ़ी लगाते समय, सुरक्षित कोण (4:1 नियम) क्या है?"
    },
    image: "assets/images/q10.png",
    imageCaption: "",
    options: {
      A: {
        en: "About 45 degrees",
        ta: "சுமார் 45 டிகிரி",
        hi: "लगभग 45 डिग्री"
      },
      B: {
        en: "About 75 degrees (1 foot out for every 4 feet of height)",
        ta: "சுமார் 75 டிகிரி (ஒவ்வொரு 4 அடி உயரத்திற்கும் 1 அடி வெளியே)",
        hi: "लगभग 75 डिग्री (हर 4 फीट ऊँचाई पर 1 फीट बाहर)"
      },
      C: {
        en: "Completely vertical (90 degrees)",
        ta: "முற்றிலும் நேராக (90 டிகிரி)",
        hi: "पूरी तरह सीधी (90 डिग्री)"
      },
      D: {
        en: "Any angle is fine as long as it touches the wall",
        ta: "சுவரைத் தொடும் வரை எந்த கோணமும் சரி",
        hi: "कोई भी कोण ठीक है जब तक वह दीवार को छूती है"
      }
    },
    correct: "B"
  },
  {
    category: "Work at Height",
    question: {
      en: "How many points of contact should a worker maintain while climbing a ladder?",
      ta: "ஏணியில் ஏறும்போது ஒரு தொழிலாளி எத்தனை தொடர்பு புள்ளிகளை பராமரிக்க வேண்டும்?",
      hi: "सीढ़ी पर चढ़ते समय एक कर्मचारी को कितने संपर्क बिंदु बनाए रखने चाहिए?"
    },
    image: "assets/images/q13.png",
    imageCaption: "",
    optionImages: {
      A: "assets/images/options/q13-A.jpg",
      B: "assets/images/options/q13-B.jpg",
      C: "assets/images/options/q13-C.jpg",
      D: "assets/images/options/q13-D.jpg"
    },
    options: {
      A: {
        en: "One hand, one foot",
        ta: "ஒரு கை, ஒரு கால்",
        hi: "एक हाथ, एक पैर"
      },
      B: {
        en: "Three points of contact at all times (two hands + one foot, or two feet + one hand)",
        ta: "எப்போதும் மூன்று தொடர்பு புள்ளிகள் (இரு கைகள் + ஒரு கால், அல்லது இரு கால்கள் + ஒரு கை)",
        hi: "हर समय तीन संपर्क बिंदु (दो हाथ + एक पैर, या दो पैर + एक हाथ)"
      },
      C: {
        en: "It doesn't matter as long as you climb fast",
        ta: "வேகமாக ஏறினால் போதும், எதுவும் கவலை இல்லை",
        hi: "इससे कोई फर्क नहीं पड़ता, बस तेज़ी से चढ़ें"
      },
      D: {
        en: "Zero — you can carry tools in both hands while climbing",
        ta: "பூஜ்ஜியம் — ஏறும்போது இரு கைகளிலும் கருவிகளை எடுத்துச் செல்லலாம்",
        hi: "शून्य — चढ़ते समय दोनों हाथों में औज़ार ले जा सकते हैं"
      }
    },
    correct: "B"
  },
  {
    category: "Scaffolding",
    question: {
      en: "What must a scaffold's base rest on?",
      ta: "ஸ்கஃபோல்டின் (மேடையின்) அடித்தளம் எதன் மீது இருக்க வேண்டும்?",
      hi: "स्कैफोल्ड (मचान) का आधार किस पर टिका होना चाहिए?"
    },
    image: "assets/images/q33.png",
    imageCaption: "",
    options: {
      A: {
        en: "Loose soil with no support",
        ta: "எந்த ஆதரவும் இல்லாத தளர்வான மண்",
        hi: "बिना किसी सहारे की ढीली मिट्टी"
      },
      B: {
        en: "A level, sound footing such as base plates or mud sills",
        ta: "பேஸ் பிளேட் அல்லது மட் சில் போன்ற சமமான, உறுதியான அடித்தளம்",
        hi: "बेस प्लेट या मड सिल जैसी समतल, मजबूत नींव"
      },
      C: {
        en: "Stacked bricks that are not fixed",
        ta: "பொருத்தப்படாத அடுக்கு செங்கற்கள்",
        hi: "बिना बंधी हुई ईंटों का ढेर"
      },
      D: {
        en: "Anything available, stability doesn't matter",
        ta: "கிடைப்பது எதுவானாலும் பரவாயில்லை, உறுதித்தன்மை முக்கியமல்ல",
        hi: "जो भी उपलब्ध हो, स्थिरता मायने नहीं रखती"
      }
    },
    correct: "B"
  },
  {
    category: "Electrical",
    question: {
      en: "What is the minimum safe clearance distance for equipment working near overhead power lines (up to 50kV)?",
      ta: "மேல்நிலை மின் கம்பிகளுக்கு (50kV வரை) அருகில் பணிபுரியும் உபகரணங்களுக்கான குறைந்தபட்ச பாதுகாப்பான தூரம் என்ன?",
      hi: "ओवरहेड पावर लाइनों (50kV तक) के पास काम करने वाले उपकरण के लिए न्यूनतम सुरक्षित दूरी क्या है?"
    },
    image: "assets/images/q26.png",
    imageCaption: "",
    options: {
      A: {
        en: "About 3 m / 10 feet",
        ta: "சுமார் 3 மீட்டர் / 10 அடி",
        hi: "लगभग 3 मीटर / 10 फीट"
      },
      B: {
        en: "30 cm / 1 foot",
        ta: "30 செமீ / 1 அடி",
        hi: "30 सेमी / 1 फीट"
      },
      C: {
        en: "No clearance is required if the operator is careful",
        ta: "இயக்குபவர் கவனமாக இருந்தால் தூரம் தேவையில்லை",
        hi: "यदि ऑपरेटर सावधान है तो कोई दूरी आवश्यक नहीं"
      },
      D: {
        en: "Only 1 m is enough for any voltage",
        ta: "எந்த மின்னழுத்தத்திற்கும் 1 மீட்டர் மட்டும் போதும்",
        hi: "किसी भी वोल्टेज के लिए केवल 1 मीटर पर्याप्त है"
      }
    },
    correct: "A"
  }
];

var TIME_PER_QUESTION = 30;
