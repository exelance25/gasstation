# GASSTATION — Sistem Durumu (ORTAK)

Son güncelleme: Haziran 2026

## Kısa cevap

**Testnet MVP hazır; production tamamlanmadı.** API matrisi ve mod testleri geçiyor. Canlı para ile uçtan uca her kombinasyon henüz doğrulanmadı.

| Alan | Durum |
|------|--------|
| Web UI (`/yakit-al`) | Çalışıyor |
| Manuel mod (USDC → gas) | Kod hazır, canlı test gerekli |
| Otomatik mod (native → gas) | Aktif, yerel settlement yedeği var |
| Quote / sponsor API | 29/29 matris geçti |
| Operatör teslimatı | Anahtar + kasa bakiyesi gerekli |
| GAS MARKET tam mimari | Kısmen — marketplace/quote/settlement var, adapter/registry tam değil |
| Mainnet | Hazır değil |

## Geçen testler

- `npm run test:matrix` → 29/29 (quote + sponsor proxy)
- `npm run test:modes` → manuel precheck + otomatik quote/sponsor

## Eksikler (production öncesi)

1. **Canlı E2E** — Her ödeme varlığı × teslim ağı kombinasyonu cüzdanla doğrulanmalı
2. **Docker stack** — Marketplace + Postgres + Redis (makinede Docker yoksa tam stack çalışmaz)
3. **İmzalı quote** — Mainnet için Quote Engine + Settlement ayrı servis olarak ayakta olmalı
4. **GAS MARKET v2** — Miktar-first quote, chain adapter registry, order başına unique deposit adresi
5. **Monitoring** — Treasury alert, audit log, rate limit gözlemi

## Çalıştırma

```powershell
cd C:\Users\omerr\.cursor\projects\empty-window
.\dev.cmd
```

```powershell
npm.cmd run test:matrix
npm.cmd run test:modes
```

Tam stack (Docker): `.\START_FULL_STACK.cmd`  
Docker'siz quote+settlement: `.\START_QUOTE_LITE.cmd`
