/**
 * Ponto de entrada da aplicação Manati - Versão Modular
 */
import { createApp } from './app.js';
import config from './config/environment.js';
import { logger } from './utils/logger.js';

async function startServer() {
    try {
        const app = createApp();
        
        app.listen(config.port, () => {
            logger.info(`🚀 Servidor Manati rodando em http://localhost:${config.port}`);
            logger.info(`📁 Arquivos markdown em: ${config.markdownDir}`);
            logger.info(`📎 Upload de arquivos em: ${config.uploadsDir}`);
            logger.info(`🔧 Configuração via: .env`);
            logger.info(`📦 Versão modular ativa`);
        });
    } catch (error) {
        logger.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    logger.error('❌ Erro não capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Promise rejeitada não tratada:', reason);
    process.exit(1);
});

// Iniciar servidor
startServer();
