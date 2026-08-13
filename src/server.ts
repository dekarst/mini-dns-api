import { buildApp } from "./app";
import { env } from "./config/env";

async function start() {
  const app = buildApp();

  try {
    await app.listen({
      port: env.port,
      host: "0.0.0.0"
    });

    console.log(`Mini DNS API listening on http://localhost:${env.port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
