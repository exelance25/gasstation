import { createApp } from "./api/app.js";
import { getEnv } from "./config/env.js";

const env = getEnv();
const app = createApp();

app.listen(env.SETTLEMENT_PORT, () => {
  console.log(`[PUMPSTATION] Settlement Engine :${env.SETTLEMENT_PORT}`);
});
