/**
 * Configuração principal da aplicação Express
 */
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import config from './config/environment.js';
import { logger } from './utils/logger.js';
import fileRoutes from './routes/fileRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import authRoutes from './routes/authRoutes.js';
import gitRoutes from './routes/gitRoutes.js';
import { authService } from './services/authService.js';

// Equivalente ao __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): express.Application {
    const app = express();

    // Headers de segurança
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        if (req.secure) {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        next();
    });

    // Middlewares básicos
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Configurar sessões
    app.use(session({
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // Desabilitar secure para desenvolvimento local
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        }
    }));

    // Configurar Passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Middleware de logging
    app.use((req, res, next) => {
        const user = req.user ? `${(req.user as any).username}` : 'anonymous';
        logger.debug(`${req.method} ${req.path} - User: ${user}`);
        next();
    });

    // Servir arquivos estáticos
    app.use(express.static(path.join(__dirname, '../public')));
    app.use('/uploads', express.static(config.uploadsDir));

    // Rotas de autenticação (sempre disponíveis)
    app.use('/', authRoutes);

    // Rotas Git com middleware de autenticação específico
    app.use('/api/git', authService.requireAuth.bind(authService), gitRoutes);

    // Middleware de autenticação para outras rotas protegidas
    app.use('/api', authService.requireAuth.bind(authService));

    // Configurar marked para preview
    marked.setOptions({
        breaks: true,
        gfm: true
    });

    // Rotas da API (protegidas)
    app.use('/api', fileRoutes);
    app.use('/api', uploadRoutes);

    // Rota para preview de markdown
    app.post('/api/preview', (req, res) => {
        try {
            const { markdown } = req.body;
            
            if (typeof markdown !== 'string') {
                return res.status(400).json({ error: 'Markdown inválido' });
            }
            
            const html = marked.parse(markdown);
            return res.json({ html });
        } catch (error) {
            logger.error('Erro ao processar markdown:', error);
            return res.status(500).json({ error: 'Erro ao processar markdown' });
        }
    });

    // Rota para informações do sistema
    app.get('/api/info', (req, res) => {
        res.json({
            name: 'Manati Editor',
            version: '1.0.0',
            description: 'Editor de Markdown com preview em tempo real',
            markdownDir: config.markdownDir,
            uploadsDir: config.uploadsDir,
            maxFileSize: config.maxFileSize,
            allowedFileTypes: config.allowedMimeTypes.length
        });
    });

    // Servir o frontend em todas as rotas não API (protegido por autenticação)
    app.get('*', authService.requireAuth.bind(authService), (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    return app;
}
