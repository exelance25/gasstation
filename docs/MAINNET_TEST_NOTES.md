# Mainnet Test Notes (ORTAK)

## Açık Riskler

- **Gas çıkış garantisi:** Kullanıcıdan ödeme almadan önce kasadan çıkış uygunluk kontrolü yapılmalı.
  - Durum: `POST /api/gas/precheck` eklendi, `useGasPump` ödeme öncesi çağırıyor.
- **UI takılı kalma:** "İşleniyor" mesajı işlem sonrası ekranda kalabiliyordu.
  - Durum: durum toast yönetimi düzeltildi + `dispense` timeout eklendi.
- **Ağ/bakiye algısı:** Kullanıcı Base seçse de ETH bakiyesi görünüyor sanrısı oluşuyordu.
  - Durum: seçili ağ için anlık bakiye satırı eklendi (`Seçili bakiye: X USDC`).

## Mainnet Öncesi Zorunlu Kontrol

1. `EVM_OPERATOR_PRIVATE_KEY` ve `SOLANA_PRIVATE_KEY` dolu.
2. `COLLECTOR_ADDRESS` uygulamadaki kasa adresi ile birebir aynı.
3. `npm run preflight:stack` yeşil.
4. Manuel + otomatik matris testleri en az birer gerçek transferle doğrulandı.

## Not

Test ağında servis altyapısı kapalıysa (`docker` yok vb.) matris testleri toplu `fetch failed` döner; bu iş akışı hatası değil, ortam eksikliği belirtisidir.
