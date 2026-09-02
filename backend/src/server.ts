import { buildApp } from './app';
import { config } from './config';

async function start() {
  try {
    const app = await buildApp();

    await app.listen({
      port: config.port,
      host: config.host,
    });

    app.log.info(`Server is running at http://${config.host}:${config.port}`);

    // Graceful shutdown handling
    const signals = ['SIGTERM', 'SIGINT'] as const;
    for (const signal of signals) {
      process.on(signal, async () => {
        app.log.info(`Received ${signal}, gracefully shutting down...`);
        try {
          await app.close();
          app.log.info('Server closed gracefully');
          process.exit(0);
        } catch (error) {
          app.log.error(`Error during graceful shutdown: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });
    }
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();
