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
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();
