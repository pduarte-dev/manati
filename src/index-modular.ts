/**
 * Ponto de entrada da aplicação Manati - Versão Modular
 */
import { createApp } from './app.js';
import config from './config/environment.js';

async function startServer() {
    try {
        const app = createApp();
        
        app.listen(config.port, () => {
            console.log(`🚀 Servidor Manati rodando em http://localhost:${config.port}`);
            console.log(`📁 Arquivos markdown em: ${config.markdownDir}`);
            console.log(`📎 Upload de arquivos em: ${config.uploadsDir}`);
            console.log(`🔧 Configuração via: .env`);
            console.log(`📦 Versão modular ativa`);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    process.exit(1);
});

// Iniciar servidor
startServer();
