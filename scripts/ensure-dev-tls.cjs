/**
 * Lokal geliştirmede kurumsal proxy / SSL inspect ortamlarında
 * Pyth, CoinGecko ve Google Fonts TLS hatalarını aşmak için.
 * Üretimde ASLA devreye girmez.
 */
function applyDevTlsBypass() {
  if (process.env.NODE_ENV === "production") return;
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "1") return;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

module.exports = { applyDevTlsBypass };

if (require.main === module) {
  applyDevTlsBypass();
}
