/**
 * Configurações do ambiente e variáveis
 */
import 'dotenv/config';
import path from 'path';

export const config = {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    markdownDir: path.resolve(process.env.MARKDOWN_ROOT_DIR || path.join(__dirname, '../../markdown-files')),
    uploadsDir: path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads')),
    logDebug: process.env.LOG_DEBUG === 'true',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    isDevelopment: process.env.NODE_ENV !== 'production',
    
    // Configurações de autenticação
    authEnabled: process.env.AUTH_ENABLED !== 'false', // true por padrão
    githubClientId: process.env.GITHUB_CLIENT_ID || '',
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    sessionSecret: process.env.SESSION_SECRET || 'manati-secret-key-change-in-production',
    allowedEmailDomain: process.env.ALLOWED_EMAIL_DOMAIN || '@waproject.com.br',
    
    allowedMimeTypes: [
        // Imagens
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
        'image/svg+xml', 'image/bmp', 'image/tiff',
        // Documentos
        'application/pdf', 'text/plain', 'text/markdown',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Arquivos compactados
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ]
};

export default config;
