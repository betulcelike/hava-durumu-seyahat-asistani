import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { getWeatherData } from './weatherService.js';
import 'dotenv/config';
import { exec } from 'child_process';
import os from 'os';
import dns from 'dns';

// Force Node.js to resolve IPv4 addresses first (fixes fetch failed issues on networks with broken IPv6)
dns.setDefaultResultOrder('ipv4first');

// ES Modules için __dirname tanımlaması
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Google GenAI API Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Hava Durumu ve AI Danışmanı Analiz Fonksiyonu
async function runWeatherAgent(sehir, kullaniciPlani, isFollowUp = false, previousResponse = "") {
  const weatherData = await getWeatherData(sehir);
  if (!weatherData) {
    throw new Error(`${sehir} için hava durumu verisi OpenWeatherMap servisinden alınamadı.`);
  }

  let prompt;
  if (isFollowUp) {
    prompt = `
Sen uzman bir "Kişisel Seyahat, Stil ve Aktivite Danışmanı" yapay zekasın.

Canlı Hava Durumu Verisi:
${JSON.stringify(weatherData, null, 2)}

Bir önceki analiz raporun şuydu:
"${previousResponse}"

Kullanıcının takip sorusu: "${kullaniciPlani}"

Lütfen bir önceki şablonu (1, 2, 3, 4 bölümlerini) TEKRARLAMA!
Sadece ve sadece kullanıcının sorduğu soruya odaklanarak, hava durumu ve ilgili saatlerle bağlantılı olacak şekilde doğrudan, kısa ve net bir cevap ver.
`;
  } else {
    prompt = `
Sen uzman bir "Kişisel Seyahat, Stil ve Aktivite Danışmanı" yapay zekasın.

Canlı Hava Durumu Verisi:
${JSON.stringify(weatherData, null, 2)}

Kullanıcı Planı: "${kullaniciPlani}"

Lütfen şu formatta yanıt ver:
1. Hava Durumu Yorumu (Sıcaklığı plana göre değerlendir).
2. Kıyafet & Aksesuar Önerileri (Katmanlı giyim, ayakkabı, şemsiye vb.).
3. Etkinlik İçin En İdeal Saat Aralığı.
4. Pratik Tavsiyeler.
`;
  }

  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
  let response = null;
  let lastError = null;

  for (const modelName of models) {
    let retries = 2;
    let delay = 2000;
    let success = false;

    console.log(`🤖 Yapay zeka analizi başlatılıyor (${modelName})...`);

    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        success = true;
        break;
      } catch (error) {
        lastError = error;
        const isTransient = error.message && (
          error.message.includes("503") || 
          error.message.includes("429") || 
          error.message.includes("UNAVAILABLE") || 
          error.message.includes("quota") ||
          error.message.includes("demand")
        );

        if (isTransient && retries > 1) {
          console.warn(`⏳ [${modelName}] Geçici yoğunluk/limit hatası. ${delay / 1000}s sonra yeniden deneniyor...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries--;
          delay *= 2;
        } else {
          console.warn(`⚠️ [${modelName}] başarısız oldu: ${error.message || error}`);
          break;
        }
      }
    }

    if (success && response) {
      break;
    }
  }

  if (response) {
    return {
      weather: weatherData,
      aiResponse: response.text
    };
  } else {
    throw new Error(lastError ? lastError.message : "Tüm yapay zeka modelleri denendi ancak yanıt alınamadı.");
  }
}

// API Endpoint
app.post('/api/analyze', async (req, res) => {
  const { city, plan, isFollowUp, previousResponse } = req.body;
  
  if (!city || !plan) {
    return res.status(400).json({ error: "Şehir (city) ve plan alanları zorunludur." });
  }

  console.log(`🔍 Yeni İstek Alındı: Şehir: ${city}, Plan: ${plan}, Takip İstegi mi: ${!!isFollowUp}`);

  try {
    const result = await runWeatherAgent(city, plan, isFollowUp, previousResponse);
    res.json(result);
  } catch (error) {
    console.error("❌ Analiz Hatası:", error.message);
    res.status(500).json({ error: error.message || "Bilinmeyen bir hata oluştu." });
  }
});

// Sunucuyu Başlat
app.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`🚀 Sunucu ${url} adresinde çalışmaya başladı.`);
  
  // WSL (Windows Subsystem for Linux) ortamını tespit et
  const isWSL = process.env.WSL_DISTRO_NAME || os.release().toLowerCase().includes('microsoft');
  
  // Tarayıcıyı otomatik olarak aç
  const startCmd = isWSL ? `cmd.exe /c start "" "${url}"` :
                    process.platform === 'darwin' ? `open "${url}"` :
                    process.platform === 'win32' ? `start "" "${url}"` :
                    `xdg-open "${url}"`;
                    
  exec(startCmd, (err) => {
    if (err) {
      console.error("Tarayıcı otomatik açılamadı:", err.message);
    }
  });
});