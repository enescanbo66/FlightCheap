# FantastiLig — A/B Lig Yükselme Hesaplayıcı

FantastiLig için A ve B ligleri arası yükselme-düşme kararını hesaplayan web arayüzü.

## Ne yapar?

- Yahoo Fantasy lig linkinden takım sıralaması ve kategori galibiyet/mağlubiyet/beraberlik verilerini çeker (OAuth token ile)
- Manuel veri girişi desteği (token olmadan da kullanılabilir)
- Pick-trade puanlarını (Kural Kitabı Tablo 4) hesaplar
- B lig 1. ile A lig sonuncusunun toplam puanını karşılaştırır

### Puan formülü

```
Toplam = Kategori Galibiyetleri + (Beraberlik × 0.5) + Net Pick-Trade Puanı
```

- **B lig 1.:** Verilen pick hakları eksi değerdedir
- **A lig sonuncusu:** Alınan pick hakları artı değerdedir

B lig şampiyonunun toplamı > A lig sonuncusunun toplamı ise yükselme gerçekleşir.

## Kurulum

```bash
npm install
npm run dev
```

Uygulama varsayılan olarak `http://localhost:4317` adresinde çalışır.

## Yahoo API (isteğe bağlı)

Özel ligler için Yahoo Fantasy OAuth access token gerekir. Token'ı:

1. Arayüzdeki "Yahoo API token" alanına yapıştırabilirsiniz, veya
2. Sunucu ortam değişkeni olarak `YAHOO_ACCESS_TOKEN` tanımlayabilirsiniz

Token olmadan da tüm değerleri manuel girebilirsiniz.

## Kullanım

1. A Lig ve B Lig panellerine Yahoo lig linkini yapıştırın
2. Verileri çekin veya manuel girin
3. Pick-trade puanlarını ekleyin
4. Üstteki kart yükselme kararını gösterir
