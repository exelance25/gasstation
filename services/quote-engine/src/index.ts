import { createApp } from "./api/app.js";
import { getEnv } from "./config/env.js";

const env = getEnv();
const app = createApp();

app.listen(env.QUOTE_ENGINE_PORT, () => {
  console.log(`[PUMPSTATION] Quote Engine :${env.QUOTE_ENGINE_PORT}`);
});
