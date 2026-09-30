# FlightCheap

Esnek tarih aralığında ucuz uçuş ara — şehir, ülke, bölge veya **Anywhere** destinasyonlarıyla.

FlightCheap; Kiwi/FlightList tarzı fiyat taraması, yakın havalimanı araması, gidiş/dönüş fiyat kırılımı ve rezervasyon deep link’leri sunar.

## Gereksinimler

- **Node.js** 20+ (npm ile)
- **Python** 3.10+ (`fast-flights` Google Flights yedek yolu için)

## Kurulum

```bash
git clone https://github.com/enescanbo66/FlightCheap.git
cd FlightCheap

# Node bağımlılıkları
npm install

# Python yardımcısı (Google Flights fallback)
pip install -r requirements.txt
# veya: pip install fast-flights httpx
```

### Opsiyonel API anahtarı

Daha stabil Kiwi/Tequila sonuçları ve deep link için:

```bash
export TEQUILA_API_KEY=your_tequila_key
# veya
export KIWI_API_KEY=your_kiwi_key
```

Anahtar yoksa uygulama önce genel FlightList proxy’sini dener, olmazsa Google Flights’a düşer.

## Çalıştırma

```bash
npm run dev
```

Tarayıcıda aç: [http://localhost:4321](http://localhost:4321)

Üretim derlemesi:

```bash
npm run build
npm start
```

## Nasıl kullanılır?

1. **From / To** seç — havalimanı, şehir, ülke, bölge veya Anywhere
2. **One-way** veya **Round-trip** seç; gidiş (ve dönüş) tarih aralığını ayarla
3. İstersen filtreleri aç: aktarma, max budget, kabin, airline
4. **Nearby airports** (kalkış ve varış için ayrı):
   - Açınca ~250 km yarıçapındaki havalimanları listelenir
   - Yarıçapı 50–500 km arasıleyebilirsin
   - İstemediğin havalimanlarını listeden çıkar (ör. sadece SAW, OGU kapalı)
5. **Search**’e bas — sonuçlar fiyata göre sıralanır
6. Bir satırı aç:
   - Round-trip’te **Outbound / Return** fiyatları ayrı görünür
   - Yakın havalimanı veya open-jaw (ör. BRU→MAD→AMS) satırlarında uyarı ikonu çıkar
   - **View deal** Kiwi deep link’i (veya Google Flights) açar

## Öne çıkan özellikler

| Özellik | Açıklama |
|--------|----------|
| Esnek tarih | Tarih aralığında en ucuz uçuşları tara |
| Ülke / bölge | Örn. MAD → Polonya (PL) |
| Yakın havalimanı | Kalkış/varış için ayrı toggle + checklist |
| Open-jaw | Gidiş BRU, dönüş AMS gibi karışık dönüşler |
| Fiyat kırılımı | Round-trip’te gidiş ve dönüş fiyatı ayrı |
| Deep link | View deal ile rezervasyona git |

## Teknik yığın

- Next.js + TypeScript + Tailwind + shadcn/ui
- Yer autocomplete: Travelpayouts Places
- Birincil fiyat: Kiwi Tequila / FlightList proxy (`deep_link`)
- Yedek: Google Flights (`scripts/search_flights.py` + `fast-flights`)

## Proje yapısı (özet)

```
src/
  app/                 # Next.js App Router (sayfa + API)
  components/          # Arama UI, sonuçlar, nearby kontrolü
  lib/                 # Kiwi, bölgeler, havalimanı mesafeleri
scripts/
  search_flights.py    # Google Flights fallback
```

## Notlar

- Geniş tarih aralıklarında Google yolu her günü değil, örnek günleri tarar
- Nearby airports yalnızca **şehir / havalimanı** seçiminde görünür (ülke/bölge/Anywhere’de yok)
- FlightList proxy bazı sunuculardan Cloudflare ile engellenebilir; üretim için `TEQUILA_API_KEY` önerilir
- Bu proje eğitim / kişisel kullanım amaçlı bir uçuş arama arayüzüdür; ticari affiliate kullanımı için Kiwi/Tequila koşullarına uyun

## Lisans

Özel kullanım — repo sahibi belirler.
