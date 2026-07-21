# Akıllı Hava Durumu ve Sesli Seyahat Danışmanı

Bu proje, canlı hava durumu tahminlerini Google Gemini yapay zeka modeliyle harmanlayarak kullanıcılara kişiselleştirilmiş seyahat, kıyafet ve aktivite önerileri sunan, gelişmiş sesli asistan desteğine sahip premium bir Web Dashboard uygulamasıdır.

## Proje Klasör ve Kod Yapısı

Projenizdeki ana kod dosyaları ve üstlendikleri görevler şu şekildedir:

### 1. Backend Sunucusu (index.js)
Bu dosya, uygulamanızın arka plan sunucusudur (Express.js). Statik web sayfalarını tarayıcıya sunar ve yapay zeka analiz isteklerini yönetir.
* **Express.js Kurulumu**: Uygulamanın tarayıcıda çalışabilmesi için `http://localhost:3000` portunu açar.
* **runWeatherAgent() Fonksiyonu**: Yapay zekaya (Gemini) hava durumu verilerini ve kullanıcı planını gönderir. Gemini 3.5 Flash hata verirse otomatik olarak Gemini 3.1 Flash-Lite modeline geçerek yedekli (fallback) çalışır.
* **Takip Sorusu (isFollowUp) Yönetimi**: Eğer kullanıcı ardışık sorular soruyorsa, yapay zekaya önceki cevabı da göndererek sadece soruya odaklı kısa yanıtlar almasını sağlar.
* **IPv4 DNS Ayarı**: Gemini API bağlantılarında oluşabilecek ağ gecikmelerini ve bağlantı hatalarını (fetch failed) önler.

### 2. Hava Durumu Servisi (weatherService.js)
Bu dosya, OpenWeatherMap API'si ile iletişim kuran bağımsız modüldür.
* **getWeatherData() Fonksiyonu**: Şehir ismini alıp 3 saatlik hava durumu tahminlerini çeker.
* **Türkiye İl Filtresi**: Girilen şehir Türkiye'nin 81 ilinden biriyse, yabancı ülkelerdeki adaş şehirlerle karışmaması için sorguya otomatik olarak `,TR` (örneğin: `Mardin,TR`) takısını ekler.
* **Veri Sadeleştirme**: API'den gelen karmaşık JSON verisini yapay zekanın en iyi anlayacağı formatta (sıcaklık, rüzgar hızı, yağış olasılığı) sadeleştirip özetler.

### 3. İstemci Arayüz Mantığı (public/app.js)
Bu dosya, tarayıcıda çalışan ve kullanıcının gördüğü tüm dinamik etkileşimleri, sesli asistanı yöneten dosyadır.
* **Sesli Asistan Dinleme Mantığı (SpeechRecognition)**: Kullanıcı mikrofona konuştuğunda veya asistana yanıt verdiğinde ses verisini metne dönüştürür. "Evet", "Hayır" ve "Plan Girişi" kararlarını yönetir.
* **Dinamik Ses Seçici (getBestFemaleVoiceConfig)**: Sisteminizdeki Türkçe sesleri tarayarak Seda, Yelda veya Google Türkçe seslerini sırasıyla önceliklendirir. Eğer sistemde sadece erkek sesi varsa, sesin tizliğini (pitch) kadın tonuna yükseltir.
* **Yapay Zeka Otomasyonu**: Asistan yeni planı dinledikten sonra sayfadaki butona basmanıza gerek kalmadan analizi kendiliğinden başlatır. Analiz bittiğinde ise sonucu otomatik olarak okumaya başlar.
* **Arama Geçmişi**: localStorage kullanarak son 10 aramanızı tarayıcı hafızasında saklar. Geçmişten bir şey silindiğinde sağ taraftaki aktif analizi bozmaz.

---

## Kurulum ve Çalıştırma

1. **Bağımlılıkları Yükleyin**:
   ```bash
   npm install
   ```

2. **Çevre Değişkenlerini Ayarlayın**:
   Proje ana dizininde .env dosyası oluşturup aşağıdaki anahtarları girin:
   ```env
   PORT=3000
   OPENWEATHER_API_KEY=your_openweathermap_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Uygulamayı Başlatın**:
   ```bash
   npm start
   ```
   Uygulama otomatik olarak tarayıcınızda açılacaktır: http://localhost:3000
