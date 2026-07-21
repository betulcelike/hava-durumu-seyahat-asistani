// LocalStorage geçmiş anahtarı
const HISTORY_KEY = 'weather_advisor_history';

// 81 Türkiye Şehri
const TR_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
  "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
  "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane",
  "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli",
  "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş",
  "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
  "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
  "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

// DOM Elemanları
const advisorForm = document.getElementById('advisorForm');
const cityInput = document.getElementById('cityInput');
const planInput = document.getElementById('planInput');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const placeholder = document.getElementById('placeholder');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('errorBox');
const weatherBox = document.getElementById('weatherBox');
const aiBox = document.getElementById('aiBox');
const historyContainer = document.getElementById('historyContainer');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const cityNameDisplay = document.getElementById('cityNameDisplay');
const weatherGrid = document.getElementById('weatherGrid');
const aiResponseText = document.getElementById('aiResponseText');
const demoLink = document.getElementById('demoLink');
const autocompleteDropdown = document.getElementById('autocompleteDropdown');
const ttsBtn = document.getElementById('ttsBtn');

// Yeni DOM Elemanları
const micCityBtn = document.getElementById('micCityBtn');
const micPlanBtn = document.getElementById('micPlanBtn');
const ttsModal = document.getElementById('ttsModal');
const ttsOptSummaryBtn = document.getElementById('ttsOptSummaryBtn');
const ttsOptFullBtn = document.getElementById('ttsOptFullBtn');
const ttsOptCancelBtn = document.getElementById('ttsOptCancelBtn');

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
let isFollowUpMode = false;

// Sayfa yüklendiğinde geçmişi yükle
document.addEventListener('DOMContentLoaded', loadHistory);

// Rastgele Örnek Doldurucu
const demoPlans = [
  { city: "Muğla", plan: "Öğleden sonra 3-4 saatlik tekne turuna çıkacağız ve akşam sahilde akşam yemeği yiyeceğiz. Yanıma ne almalıyım ve ne giymeliyim?" },
  { city: "Sakarya", plan: "Hafta sonu öğleden sonra doğa yürüyüşü ve fotoğraf çekimi yapacağım. Ne giymeliyim ve saat kaçta çıkmam daha uygun olur?" },
  { city: "Kars", plan: "Yarın sabah Doğu Ekspresi ile varacağım. Çıldır Gölü üzerinde kızakla gezip fotoğraflar çekeceğiz. Yanıma ne tür kıyafetler almalıyım?" },
  { city: "İzmir", plan: "Yarın sabah Efes Antik Kenti'ni gezeceğim, öğleden sonra ise Çeşme'de sahilde yürüyeceğim. Kıyafet ve zamanlama önerisi verir misin?" },
  { city: "Rize", plan: "Yarın sabah erkenden Pokut Yaylası'na çıkıp sis bulutunu izlemek ve yürüyüş yapmak istiyorum. Yanıma almam gereken en önemli şeyler nelerdir?" }
];

demoLink.addEventListener('click', () => {
  const randomPlan = demoPlans[Math.floor(Math.random() * demoPlans.length)];
  cityInput.value = randomPlan.city;
  planInput.value = randomPlan.plan;
  
  // Efektli bir odaklanma sağla
  cityInput.focus();
  autocompleteDropdown.style.display = 'none';
});

// --- ŞEHİR OTOMATİK TAMAMLAMA (AUTOCOMPLETE) MANTIĞI ---

function getCleanString(str) {
  return str.toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/i̇/g, 'i');
}

function showSuggestions(query) {
  const queryClean = getCleanString(query);
  if (!queryClean) {
    autocompleteDropdown.style.display = 'none';
    return;
  }

  const startsWithMatches = [];
  const containsMatches = [];

  TR_CITIES.forEach(city => {
    const cityClean = getCleanString(city);
    if (cityClean.startsWith(queryClean)) {
      startsWithMatches.push(city);
    } else if (cityClean.includes(queryClean)) {
      containsMatches.push(city);
    }
  });

  const matches = [...startsWithMatches.sort(), ...containsMatches.sort()];

  autocompleteDropdown.innerHTML = '';
  if (matches.length > 0) {
    matches.forEach(match => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerText = match;
      item.addEventListener('click', () => {
        cityInput.value = match;
        autocompleteDropdown.style.display = 'none';
      });
      autocompleteDropdown.appendChild(item);
    });
    autocompleteDropdown.style.display = 'block';
  } else {
    autocompleteDropdown.style.display = 'none';
  }
}

cityInput.addEventListener('input', (e) => {
  showSuggestions(e.target.value.trim());
});

cityInput.addEventListener('focus', () => {
  showSuggestions(cityInput.value.trim());
});

document.addEventListener('click', (e) => {
  if (e.target !== cityInput && e.target !== autocompleteDropdown && !autocompleteDropdown.contains(e.target)) {
    autocompleteDropdown.style.display = 'none';
  }
});


// --- SESLİ GİRİŞ (SPEECH-TO-TEXT) MANTIĞI ---

function startSpeechRecognition(targetInput, micButton) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Tarayıcınız sesli giriş özelliğini desteklemiyor. Lütfen Google Chrome veya Microsoft Edge kullanın.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'tr-TR';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    micButton.classList.add('recording');
    micButton.innerText = '🔴';
    targetInput.placeholder = "Dinleniyor, lütfen konuşun...";
  };

  recognition.onerror = (event) => {
    console.error("Ses tanıma hatası:", event.error);
    stopRecognition();
  };

  recognition.onend = () => {
    stopRecognition();
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    targetInput.value = transcript;
    targetInput.dispatchEvent(new Event('input')); // Otomatik tamamlama tetiklensin
    
    // Eğer plan kutusundan konuşulduysa, formu otomatik olarak gönder!
    if (targetInput.id === 'planInput') {
      setTimeout(() => {
        advisorForm.dispatchEvent(new Event('submit'));
      }, 300);
    }
  };

  function stopRecognition() {
    micButton.classList.remove('recording');
    micButton.innerText = '🎙️';
    if (targetInput.id === 'cityInput') {
      targetInput.placeholder = "Örn: Sakarya, İstanbul, İzmir...";
    } else {
      targetInput.placeholder = "Örn: Yarın öğleden sonra arkadaşlarımla doğa yürüyüşü yapacağım. Ne giymeliyim?";
    }
  }

  recognition.start();
}

micCityBtn.addEventListener('click', () => startSpeechRecognition(cityInput, micCityBtn));
micPlanBtn.addEventListener('click', () => startSpeechRecognition(planInput, micPlanBtn));


// --- ANLAMSIZ PLAN DOĞRULAMA (GIBBERISH VALIDATION) MANTIĞI ---

function validatePlan(plan) {
  const trimmed = plan.trim();

  if (trimmed.length < 10) {
    return "Plan açıklamanız çok kısa. Lütfen ne yapmak istediğinizi en az 10 karakterle daha detaylı açıklayın.";
  }

  if (!trimmed.includes(' ')) {
    return "Seyahat planınızı en az 2 kelimeyle açıklamalısınız (örn: 'doğa yürüyüşü yapacağım', 'tekne turu').";
  }

  const totalLetters = trimmed.match(/[a-zA-ZçgöşüıÇĞÖŞÜİ]/g);
  if (!totalLetters) {
    return "Lütfen geçerli kelimeler içeren anlamlı bir plan yazın.";
  }

  const vowels = trimmed.match(/[aeıioöuüAEIİOÖUÜ]/g);
  const vowelRatio = (vowels ? vowels.length : 0) / totalLetters.length;
  if (vowelRatio < 0.18 || vowelRatio > 0.60) {
    return "Girdiğiniz plan anlamsız tuş vuruşları (keysmash) içeriyor gibi görünüyor. Lütfen gerçek kelimelerle bir plan yazın.";
  }

  if (/(.)\1\1\1/.test(trimmed.toLowerCase())) {
    return "Planınızda tekrarlayan anlamsız harfler var. Lütfen düzgün bir cümle yazın.";
  }

  return null;
}


// --- SESLİ OKUMA (TEXT TO SPEECH) MANTIĞI ---

let speechUtterance = null;
let currentVoiceConfig = null;

// HTML etiketlerini ve markdown işaretlerini konuşma motoru için temizleyen fonksiyon
function cleanTextForSpeech(html) {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;

  const blockElements = tmp.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, hr');
  blockElements.forEach(el => {
    el.innerHTML += '. ';
  });

  let plainText = tmp.textContent || tmp.innerText || "";

  plainText = plainText
    .replace(/\.\./g, '.')
    .replace(/\.\s*\./g, '.')
    .replace(/\*/g, '')
    .replace(/#/g, '')
    .replace(/m\/s/g, ' metre bölü saniye')
    .replace(/°C/g, ' derece')
    .replace(/%/g, ' yüzde ')
    .replace(/\s+/g, ' ');

  return plainText.trim();
}

// Cümleleri bölerek ilk 3 anlamlı cümleden özet oluşturan fonksiyon
function getSummaryText(plainText) {
  // Nokta, soru işareti ve ünleme göre böl, boşlukları temizle
  const rawSentences = plainText.split(/[.!?]/);
  const cleanSentences = [];
  
  for (let i = 0; i < rawSentences.length; i++) {
    const s = rawSentences[i].trim();
    if (!s) continue;
    
    // Çok kısa olanlar (başlıklar, rakamlar, liste işaretleri) elenir
    if (s.length < 25) continue;
    
    // Belirli başlık kalıplarını içeren cümleler elenir
    const sLower = s.toLowerCase();
    if (
      sLower.includes("hava durumu yorumu") ||
      sLower.includes("kıyafet") && sLower.includes("öneri") ||
      sLower.includes("ideal saat") ||
      sLower.includes("pratik tavsiye")
    ) {
      continue;
    }
    
    cleanSentences.push(s);
  }
  
  // İlk 3 anlamlı cümleyi seç
  const summarySentences = cleanSentences.slice(0, 3);
  
  if (summarySentences.length > 0) {
    return summarySentences.join('. ') + '.';
  }
  
  // Fallback: Eğer filtreleme sonucu hiçbir şey kalmazsa, ham metnin ilk 3 cümlesini ver
  const fallback = rawSentences.map(x => x.trim()).filter(x => x.length > 0).slice(0, 3);
  return fallback.join('. ') + '.';
}

// En iyi Türkçe kadın sesini (veya ses tınısı tizleştirilmiş Tolga'yı) seçen fonksiyon
function getBestFemaleVoiceConfig() {
  if (!window.speechSynthesis) return { voice: null, pitch: 1.0 };
  
  const voices = window.speechSynthesis.getVoices();
  
  // Türkçe dil tanımlamalarını büyük/küçük harfe duyarsız süz
  const trVoices = voices.filter(voice => {
    const lang = voice.lang.toLowerCase();
    return lang.startsWith('tr') || lang.includes('tr-tr') || lang.includes('tr_tr');
  });

  console.log("Sistemdeki Türkçe Sesler:", trVoices.map(v => v.name));

  // Öncelik sırasına göre kadın ses haritası (Yelda, Seda, Google Türkçe vb.)
  const voicePriorityPatterns = [
    // 1. Öncelik: Microsoft Seda Online (Natural)
    /seda.*(natural|online|neural)/i,
    // 2. Öncelik: Microsoft Dilara / Emel Online (Natural)
    /(dilara|emel).*(natural|online|neural)/i,
    // 3. Öncelik: Google Türkçe (Chrome yerleşik kadın sesi)
    /google.*türkçe/i,
    /google.*tr/i,
    // 4. Öncelik: Yelda (macOS yerleşik kadın sesi)
    /yelda/i,
    // 5. Öncelik: Microsoft Seda (Windows offline yerel kadın sesi)
    /seda/i,
    // 6. Öncelik: Diğer kadın isimleri veya Siri
    /(siri|zeynep|yasmin|hilal|female|woman|girl)/i
  ];

  // Öncelik listesine göre sesleri eşleştir
  for (const pattern of voicePriorityPatterns) {
    const matchedVoice = trVoices.find(voice => pattern.test(voice.name));
    if (matchedVoice) {
      console.log("Öncelikli Kadın Sesi Eşleşti:", matchedVoice.name);
      return { voice: matchedVoice, pitch: 1.0 };
    }
  }

  // Fallback 1: Listede Tolga veya erkek sesi olmayan herhangi bir Türkçe ses varsa onu seç
  const otherVoice = trVoices.find(voice => !voice.name.toLowerCase().includes('tolga') && !voice.name.toLowerCase().includes('male'));
  if (otherVoice) {
    console.log("Kadın Sesi Filtresi Dışı Türkçe Ses:", otherVoice.name);
    return { voice: otherVoice, pitch: 1.25 };
  }

  // Fallback 2: Sistemde sadece erkek sesi (Tolga) kaldıysa, tınısını tizleştirip kadın sesi yap
  if (trVoices.length > 0) {
    const defaultVoice = trVoices[0];
    console.log("Fallback Erkek Sesi (Kadınsılaştırıldı):", defaultVoice.name);
    return { voice: defaultVoice, pitch: 1.28 };
  }

  return { voice: null, pitch: 1.0 };
}

// Sesli okuma başlatan ana fonksiyon
function startSpeaking(textToSpeak) {
  if (!window.speechSynthesis) return;

  // Önceki sesleri tamamen temizle
  window.speechSynthesis.cancel();

  speechUtterance = new SpeechSynthesisUtterance(textToSpeak);
  speechUtterance.lang = 'tr-TR';
  speechUtterance.rate = 1.04; // Dengeli, net hız
  speechUtterance.volume = 1.0;

  const voiceConfig = getBestFemaleVoiceConfig();
  if (voiceConfig.voice) {
    speechUtterance.voice = voiceConfig.voice;
  }
  speechUtterance.pitch = voiceConfig.pitch;

  // Konuşma bittiğinde kapanış sorusunu sor
  speechUtterance.onend = () => {
    playClosingQuestion();
  };

  speechUtterance.onerror = () => {
    resetTTSButton();
  };

  window.speechSynthesis.speak(speechUtterance);

  // Arayüz buton durumunu durdur olarak güncelle
  ttsBtn.classList.add('playing');
  ttsBtn.querySelector('.tts-icon').innerText = '⏹️';
  ttsBtn.querySelector('.tts-text').innerText = 'Durdur';
}

// En sonda başka konuda yardım isteyip istemediğini soran fonksiyon
function playClosingQuestion() {
  const closingText = "Seyahat planınızla ilgili başka bir konuda yardımcı olabilir miyim?";
  const closingUtterance = new SpeechSynthesisUtterance(closingText);
  closingUtterance.lang = 'tr-TR';
  closingUtterance.rate = 1.04;
  
  const voiceConfig = getBestFemaleVoiceConfig();
  if (voiceConfig && voiceConfig.voice) {
    closingUtterance.voice = voiceConfig.voice;
  }
  closingUtterance.pitch = voiceConfig ? voiceConfig.pitch : 1.0;

  closingUtterance.onend = () => {
    resetTTSButton();
    // Kapanış sorusundan sonra sesli asistan dinleme panelini aç
    startAssistantListening();
  };
  closingUtterance.onerror = () => {
    resetTTSButton();
  };

  window.speechSynthesis.speak(closingUtterance);
}

// Sesli Asistan Dinleme ve Karar Ağacı Mantığı
function startAssistantListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  const recognition = new SpeechRecognition();
  recognition.lang = 'tr-TR';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const assistantPanel = document.getElementById('voiceAssistantPanel');
  let hasHandledResult = false;
  let timeoutId = null;

  recognition.onstart = () => {
    assistantPanel.style.display = 'flex';
    
    // 6 saniyelik zaman aşımı koruması (konuşulmazsa otomatik kapat)
    timeoutId = setTimeout(() => {
      recognition.stop();
    }, 6000);
  };

  recognition.onerror = (event) => {
    console.error("Asistan dinleme hatası:", event.error);
    stopAssistantListeningUI();
  };

  recognition.onend = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (!hasHandledResult) {
      stopAssistantListeningUI();
    }
  };

  recognition.onresult = (event) => {
    hasHandledResult = true;
    if (timeoutId) clearTimeout(timeoutId);

    const reply = event.results[0][0].transcript.toLowerCase().trim();
    console.log("Kullanıcı yanıtı:", reply);

    // Karar Ağacı Kontrolü
    const isYes = reply.includes("evet") || reply.includes("olur") || reply.includes("yardımcı ol") || reply.includes("yeni plan");
    const isNo = reply.includes("hayır") || reply.includes("yok") || reply.includes("teşekkür") || reply.includes("kapat") || reply.includes("sağol") || reply.includes("bitir");

    if (isYes) {
      const responseText = "Sizi dinliyorum, lütfen yeni planınızı söyleyin.";
      const utterance = new SpeechSynthesisUtterance(responseText);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.04;
      
      const voiceConfig = getBestFemaleVoiceConfig();
      if (voiceConfig && voiceConfig.voice) utterance.voice = voiceConfig.voice;
      utterance.pitch = voiceConfig ? voiceConfig.pitch : 1.0;

      utterance.onend = () => {
        startSpeechRecognition(planInput, micPlanBtn);
      };
      
      window.speechSynthesis.speak(utterance);
      stopAssistantListeningUI();
    } 
    else if (isNo) {
      const responseText = "Rica ederim, keyifli günler dilerim!";
      const utterance = new SpeechSynthesisUtterance(responseText);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.04;
      
      const voiceConfig = getBestFemaleVoiceConfig();
      if (voiceConfig && voiceConfig.voice) utterance.voice = voiceConfig.voice;
      utterance.pitch = voiceConfig ? voiceConfig.pitch : 1.0;
      
      window.speechSynthesis.speak(utterance);
      stopAssistantListeningUI();
    } 
    else if (reply.length > 3) {
      planInput.value = event.results[0][0].transcript;
      planInput.dispatchEvent(new Event('input'));

      const responseText = "Planınızı kaydettim, analizi tekrar başlatıyorum.";
      const utterance = new SpeechSynthesisUtterance(responseText);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.04;
      
      const voiceConfig = getBestFemaleVoiceConfig();
      if (voiceConfig && voiceConfig.voice) utterance.voice = voiceConfig.voice;
      utterance.pitch = voiceConfig ? voiceConfig.pitch : 1.0;

      utterance.onend = () => {
        setTimeout(() => {
          advisorForm.dispatchEvent(new Event('submit'));
        }, 300);
      };

      window.speechSynthesis.speak(utterance);
      stopAssistantListeningUI();
    } 
    else {
      stopAssistantListeningUI();
    }
  };

  function stopAssistantListeningUI() {
    assistantPanel.style.display = 'none';
  }

  recognition.start();
}

function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  resetTTSButton();
}

function resetTTSButton() {
  ttsBtn.classList.remove('playing');
  ttsBtn.querySelector('.tts-icon').innerText = '🔊';
  ttsBtn.querySelector('.tts-text').innerText = 'Sesli Oku';
}

// "Sesli Oku" ana butonuna basıldığında tetiklenecek olay
function handleTTSClick() {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    stopSpeaking();
    return;
  }

  // Modalı göster
  ttsModal.style.display = 'flex';

  // Soruyu sesli olarak sor
  const questionText = "Seyahat analizinizin özetini mi yoksa tamamını mı dinlemek istersiniz?";
  const questionUtterance = new SpeechSynthesisUtterance(questionText);
  questionUtterance.lang = 'tr-TR';
  questionUtterance.rate = 1.04;
  
  const voiceConfig = getBestFemaleVoiceConfig();
  if (voiceConfig.voice) {
    questionUtterance.voice = voiceConfig.voice;
  }
  questionUtterance.pitch = voiceConfig.pitch;

  window.speechSynthesis.speak(questionUtterance);
}

// Modal buton tıklama olayları
ttsOptSummaryBtn.addEventListener('click', () => {
  ttsModal.style.display = 'none';
  if (window.speechSynthesis) window.speechSynthesis.cancel();

  const aiText = aiResponseText.innerHTML;
  if (!aiText) return;

  const plainText = cleanTextForSpeech(aiText);
  const summaryText = getSummaryText(plainText);

  // Özet metni okumaya başla
  startSpeaking(summaryText);
});

ttsOptFullBtn.addEventListener('click', () => {
  ttsModal.style.display = 'none';
  if (window.speechSynthesis) window.speechSynthesis.cancel();

  const aiText = aiResponseText.innerHTML;
  if (!aiText) return;

  const plainText = cleanTextForSpeech(aiText);

  // Tamamını okumaya başla
  startSpeaking(plainText);
});

ttsOptCancelBtn.addEventListener('click', () => {
  ttsModal.style.display = 'none';
  stopSpeaking();
});

// Modala tıklayınca kapanmasın, sadece cancel tıklandığında kapansın
ttsBtn.addEventListener('click', handleTTSClick);

// Voices listesi yüklendiğinde tetiklenecek olay dinleyicisi (Chrome vb. tarayıcılar için)
if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = () => {};
}


// --- FORM SUBMIT İŞLEME ---

advisorForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  // Devam eden sesli okuma varsa durdur
  stopSpeaking();

  const city = cityInput.value.trim();
  const plan = planInput.value.trim();

  if (!city || !plan) return;

  // Plana yönelik anlamsız girdi kontrolü (gibberish validation)
  const validationError = validatePlan(plan);
  if (validationError) {
    placeholder.style.display = 'none';
    weatherBox.style.display = 'none';
    aiBox.style.display = 'none';
    loading.style.display = 'none';
    
    document.getElementById('errorMessage').innerText = validationError;
    errorBox.style.display = 'block';
    
    submitBtn.disabled = false;
    btnText.innerText = "🔮 Analiz Et & Öneri Al";
    
    errorBox.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Takip Sorusu Algılama: Sağda yüklü analiz var mı ve şehir aynı mı?
  const isFollowUp = (aiResponseText.innerHTML.trim() !== "" && cityNameDisplay.innerText.toLowerCase().trim() === city.toLowerCase().trim());

  // Arayüz sıfırlama (Yalnızca yeni aramalarda ekranı temizle, takip sorularında eski sonuçları ekranda tut)
  placeholder.style.display = 'none';
  if (!isFollowUp) {
    weatherBox.style.display = 'none';
    aiBox.style.display = 'none';
  }
  errorBox.style.display = 'none';
  document.getElementById('alertContainer').style.display = 'none';
  loading.style.display = 'flex';
  submitBtn.disabled = true;
  btnText.innerText = "Analiz Ediliyor...";

  // Adımları sıfırla
  step1.className = "loading-step active";
  step1.querySelector('.step-icon').innerText = "🔍";
  step2.className = "loading-step";
  step2.querySelector('.step-icon').innerText = "🤖";

  // Aktif olan geçmiş kartı vurgusunu temizle
  document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        city, 
        plan,
        isFollowUp: isFollowUp,
        previousResponse: aiResponseText.innerText.trim() // Token tasarrufu için düz metin olarak gönder
      })
    });

    // Adım 1 tamamlandı, Adım 2 başladı
    step1.className = "loading-step completed";
    step1.querySelector('.step-icon').innerText = "✅";
    step2.className = "loading-step active";

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Sunucu tarafında bir hata oluştu.");
    }

    // Sonuçları göster
    renderResult(data.weather, data.aiResponse);

    // Başarılı aramayı geçmişe kaydet (Takip soruları geçmiş listesini kirletmesin)
    if (!isFollowUp) {
      saveToHistory(city, plan, data.weather, data.aiResponse);
    } else {
      // Takip sorusu tamamlandığında yeni analizi sesli olarak otomatik okumaya başla!
      const plainText = cleanTextForSpeech(data.aiResponse);
      startSpeaking(plainText);
    }

    // Adım 2 tamamlandı
    step2.className = "loading-step completed";
    step2.querySelector('.step-icon').innerText = "✅";

  } catch (error) {
    console.error(error);
    document.getElementById('errorMessage').innerText = error.message;
    errorBox.style.display = 'block';
  } finally {
    loading.style.display = 'none';
    submitBtn.disabled = false;
    btnText.innerText = "🔮 Analiz Et & Öneri Al";
  }
});

// Arama sonuçlarını sayfaya çizme fonksiyonu
function renderResult(weather, aiResponse) {
  // Ekstrem Hava Uyarılarını Kontrol Et
  checkWeatherAlerts(weather);

  cityNameDisplay.innerText = weather.sehir;
  
  weatherGrid.innerHTML = '';
  weather.tahminler.forEach(item => {
    const emoji = getWeatherEmoji(item.durum);
    weatherGrid.innerHTML += `
      <div class="weather-card">
        <span class="card-time">${formatDateTime(item.tarih_saat)}</span>
        <div class="card-icon">${emoji}</div>
        <div class="card-temp">${item.sicaklik}</div>
        <div class="card-desc">${item.durum}</div>
        <div class="card-details">
          💧 ${item.nem} | 🌬️ ${item.ruzgar_hizi}<br>
          ☔ Yağış: ${item.yagis_ihtimali}
        </div>
      </div>
    `;
  });

  aiResponseText.innerHTML = formatMarkdown(aiResponse);
  
  weatherBox.style.display = 'block';
  aiBox.style.display = 'block';

  // Sesli oku butonunu göster ve sıfırla
  ttsBtn.style.display = 'flex';
  resetTTSButton();
}

// Ekstrem Hava Durumu Uyarı Kontrol Fonksiyonu
function checkWeatherAlerts(weather) {
  const alertContainer = document.getElementById('alertContainer');
  alertContainer.innerHTML = '';
  alertContainer.style.display = 'none';

  const alerts = [];
  const tahminler = weather.tahminler;

  let hasHeatAlert = false;
  let hasColdAlert = false;
  let hasWindAlert = false;
  let hasRainAlert = false;

  tahminler.forEach(item => {
    const temp = parseInt(item.sicaklik);
    const wind = parseFloat(item.ruzgar_hizi);
    const rainPop = parseInt(item.yagis_ihtimali.replace('%', ''));
    
    // 1. Sıcaklık Kontrolleri
    if (temp >= 35 && !hasHeatAlert) {
      alerts.push({
        type: 'heat',
        title: '🔥 Aşırı Sıcak Uyarısı',
        desc: `Tahmin edilen en yüksek sıcaklık ${temp}°C seviyesine ulaşıyor. Açık havada kalırken güneş koruyucu sürün ve bol sıvı tüketin.`
      });
      hasHeatAlert = true;
    } else if (temp <= 5 && !hasColdAlert) {
      alerts.push({
        type: 'cold',
        title: '❄️ Dondurucu Soğuk Uyarısı',
        desc: `Hava sıcaklığı sıfıra yakın seyrediyor (${temp}°C). Rüzgar kesici kalın katmanlı giysiler tercih etmeniz tavsiye edilir.`
      });
      hasColdAlert = true;
    }

    // 2. Rüzgar Kontrolü (7.5 m/s ve üzeri)
    if (wind >= 7.5 && !hasWindAlert) {
      alerts.push({
        type: 'wind',
        title: '💨 Kuvvetli Rüzgar Uyarısı',
        desc: `Rüzgar hızı ${wind} m/s seviyesine ulaşıyor. Açık alanlarda yürürken, saç ve kıyafet seçimi yaparken tedbirli olun.`
      });
      hasWindAlert = true;
    }

    // 3. Yağış Kontrolü (%60 olasılık ve üzeri)
    if (rainPop >= 60 && !hasRainAlert) {
      alerts.push({
        type: 'rain',
        title: '🌧️ Yüksek Yağış İhtimali',
        desc: `Açık hava planları için risk oluşturabilecek yoğun yağış ihtimali (%${rainPop}) var. Şemsiye veya yağmurluk almayı unutmayın.`
      });
      hasRainAlert = true;
    }
  });

  // Uyarılar varsa arayüze ekle ve göster
  if (alerts.length > 0) {
    alerts.forEach(alert => {
      const emoji = alert.type === 'heat' ? '🔥' : alert.type === 'cold' ? '❄️' : alert.type === 'wind' ? '💨' : '🌧️';
      alertContainer.innerHTML += `
        <div class="alert-card warning-${alert.type}">
          <div class="alert-icon">${emoji}</div>
          <div class="alert-info">
            <h4 class="alert-title">${alert.title}</h4>
            <p class="alert-desc">${alert.desc}</p>
          </div>
        </div>
      `;
    });
    alertContainer.style.display = 'flex';
  }
}

// Tarih Formatlayıcı Yardımcı Fonksiyon
function formatDateTime(dateTimeStr) {
  try {
    // OpenWeatherMap'ten gelen UTC zamanını sonuna Z ekleyerek UTC olarak parse et
    const dateObj = new Date(dateTimeStr.replace(' ', 'T') + 'Z');
    
    // Tarayıcının yerel saat dilimine (Örn: Türkiye için UTC+3) dönüştürerek saat ve dakikayı al
    const hourMin = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (dateObj.toDateString() === today.toDateString()) {
      return `Bugün ${hourMin}`;
    } else if (dateObj.toDateString() === tomorrow.toDateString()) {
      return `Yarın ${hourMin}`;
    } else {
      const gunler = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
      return `${gunler[dateObj.getDay()]} ${hourMin}`;
    }
  } catch (e) {
    return dateTimeStr;
  }
}

// Hava Durumu Açıklamasına Göre Emoji Seçici
function getWeatherEmoji(desc) {
  const text = desc.toLowerCase();
  if (text.includes("yağm") || text.includes("sağanak") || text.includes("çise")) return "🌧️";
  if (text.includes("kar") || text.includes("dolu")) return "❄️";
  if (text.includes("açık") || text.includes("güneş")) return "☀️";
  if (text.includes("bulut") && (text.includes("parçalı") || text.includes("az"))) return "⛅";
  if (text.includes("bulut")) return "☁️";
  if (text.includes("fırtına") || text.includes("şimşek") || text.includes("gök gür")) return "⛈️";
  if (text.includes("sis") || text.includes("pus") || text.includes("duman")) return "🌫️";
  return "🌤️";
}

// Basit Markdown -> HTML Dönüştürücü
function formatMarkdown(text) {
  if (!text) return "";
  
  let html = text;

  html = html.replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*?)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/^---$/gm, '<hr>');

  const lines = html.split('\n');
  let insideList = false;
  let formattedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    const isListItem = line.startsWith('- ') || line.startsWith('* ');
    
    if (isListItem) {
      const content = line.substring(2);
      if (!insideList) {
        insideList = true;
        formattedLines.push('<ul>');
      }
      formattedLines.push(`<li>${content}</li>`);
    } else {
      if (insideList) {
        insideList = false;
        formattedLines.push('</ul>');
      }
      
      if (line !== "" && !line.startsWith('<h') && !line.startsWith('<hr') && !line.startsWith('<ul') && !line.startsWith('<li')) {
        formattedLines.push(`<p>${line}</p>`);
      } else {
        formattedLines.push(line);
      }
    }
  }

  if (insideList) {
    formattedLines.push('</ul>');
  }

  return formattedLines.join('\n');
}

// GEÇMİŞ YÖNETİMİ YARDIMCI FONKSİYONLARI

function loadHistory() {
  const history = getHistory();
  if (history.length === 0) {
    historyContainer.style.display = 'none';
    historyList.innerHTML = '';
    return;
  }

  historyContainer.style.display = 'block';
  historyList.innerHTML = '';

  history.forEach((item, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="history-item-info">
        <span class="history-item-city">${item.city}</span>
        <span class="history-item-plan" title="${item.plan}">${item.plan}</span>
      </div>
      <button class="history-item-delete" title="Sil" data-index="${index}">×</button>
    `;

    historyItem.addEventListener('click', (e) => {
      if (e.target.classList.contains('history-item-delete')) return;
      selectHistoryItem(index, historyItem);
    });

    historyItem.querySelector('.history-item-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteHistoryItem(index);
    });

    historyList.appendChild(historyItem);
  });
}

function getHistory() {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

function saveToHistory(city, plan, weather, aiResponse) {
  let history = getHistory();
  
  history = history.filter(item => !(item.city.toLowerCase() === city.toLowerCase() && item.plan.toLowerCase() === plan.toLowerCase()));

  history.unshift({ city, plan, weather, aiResponse });

  if (history.length > 10) {
    history.pop();
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  loadHistory();
}

function deleteHistoryItem(index) {
  let history = getHistory();
  
  // Hangi elemanın silineceğini kontrol et ve listedeki aktif vurguyu kaldır
  const historyItems = document.querySelectorAll('.history-item');
  const isDeletingActive = historyItems[index] && historyItems[index].classList.contains('active');

  history.splice(index, 1);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  
  // Sadece geçmiş listesini yeniden çiz, sağ taraftaki sonuçlara ve forma dokunma
  loadHistory();

  if (isDeletingActive) {
    document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
  }
}

clearHistoryBtn.addEventListener('click', () => {
  if (confirm("Tüm arama geçmişinizi silmek istediğinize emin misiniz?")) {
    localStorage.removeItem(HISTORY_KEY);
    
    // Sadece listeden geçmişi temizle, sağ taraftaki aktif analize dokunma
    loadHistory();
  }
});

function selectHistoryItem(index, element) {
  const history = getHistory();
  const item = history[index];
  if (!item) return;

  stopSpeaking();

  document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
  element.classList.add('active');

  cityInput.value = item.city;
  planInput.value = item.plan;

  placeholder.style.display = 'none';
  errorBox.style.display = 'none';
  renderResult(item.weather, item.aiResponse);
}
