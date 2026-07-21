import 'dotenv/config';

export async function getWeatherData(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  let queryCity = city.trim();
  const trCitiesLower = [
    "adana", "adiyaman", "afyonkarahisar", "agri", "amasya", "ankara", "antalya", "artvin", "aydin", "balikesir",
    "bilecik", "bingol", "bitlis", "bolu", "burdur", "bursa", "canakkale", "cankiri", "corum", "denizli",
    "diyarbakir", "edirne", "elazig", "erzincan", "erzurum", "eskisehir", "gaziantep", "giresun", "gumushane",
    "hakkari", "hatay", "isparta", "mersin", "istanbul", "izmir", "kars", "kastamonu", "kayseri", "kirklareli",
    "kirsehir", "kocaeli", "konya", "kutahya", "malatya", "manisa", "kahramanmaras", "mardin", "mus",
    "nevsehir", "nigde", "ordu", "rize", "sakarya", "samsun", "siirt", "sinop", "sivas", "tekirdag", "tokat",
    "trabzon", "tunceli", "sanliurfa", "usak", "van", "yozgat", "zonguldak", "aksaray", "bayburt", "karaman",
    "kirikkale", "batman", "sirnak", "bartin", "ardahan", "igdir", "yalova", "karabuk", "kilis", "osmaniye", "duzce"
  ];
  
  const cleanCity = queryCity.toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/i̇/g, 'i');

  if (trCitiesLower.includes(cleanCity) && !queryCity.toLowerCase().includes(',tr')) {
    queryCity += ',TR';
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(queryCity)}&appid=${apiKey}&units=metric&lang=tr`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("OpenWeatherMap API anahtarı henüz aktif değil veya hatalı. (Yeni alınan anahtarların aktifleşmesi 10-20 dk sürebilir)");
      }
      throw new Error(`Hava durumu verisi alınamadı (Hata kodu: ${response.status})`);
    }
    const data = await response.json();

    // Yapay zekaya göndermek için veriyi sadeleştirip özetliyoruz
    const forecastSummary = data.list.slice(0, 8).map(item => ({
      tarih_saat: item.dt_txt,
      sicaklik: `${Math.round(item.main.temp)}°C`,
      hissedilen: `${Math.round(item.main.feels_like)}°C`,
      durum: item.weather[0].description,
      nem: `%${item.main.humidity}`,
      ruzgar_hizi: `${item.wind.speed} m/s`,
      yagis_ihtimali: `%${Math.round(item.pop * 100)}`
    }));

    return {
      sehir: data.city.name,
      tahminler: forecastSummary
    };
  } catch (error) {
    console.error("❌ Hava Durumu Hatası:", error.message);
    return null;
  }
}