/**
 * Rotas de autenticação
 */
import { Router, Request, Response } from 'express';
import passport from 'passport';
import { authService } from '../services/authService.js';
import config from '../config/environment.js';
import logger from '../utils/logger.js';
import path from 'path';

const router = Router();

// Página de login
router.get('/login', (req: Request, res: Response) => {
    // Se autenticação não é necessária, redirecionar para app
    if (!authService.isAuthenticationRequired()) {
        return res.redirect('/');
    }

    // Se já está autenticado, redirecionar para app
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.redirect('/');
    }

    // Servir página de login
    res.sendFile(path.join(process.cwd(), 'public', 'login.html'));
});

// Iniciar autenticação GitHub
router.get('/auth/github', (req: Request, res: Response, next) => {
    if (!authService.isAuthenticationRequired()) {
        return res.redirect('/');
    }
    
    // Se estamos em desenvolvimento e as credenciais são placeholder, simular login
    if (config.isDevelopment && (config.githubClientId === 'your_github_client_id' || !config.githubClientId)) {
        logger.info('🚧 Modo desenvolvimento: simulando autenticação GitHub');
        
        // Simular usuário corporativo
        const mockUser = {
            id: 'dev-user-123',
            username: 'dev-user',
            displayName: 'Usuário Desenvolvimento',
            email: 'dev@waproject.com.br',
            avatar: '/assets/manati_logo_v2.png',
            profileUrl: 'https://github.com/dev-user'
        };
        
        // Simular login
        req.logIn(mockUser, (err) => {
            if (err) {
                logger.error('Erro ao simular login:', err);
                return res.redirect('/login?error=auth_failed');
            }
            logger.info('✅ Login simulado com sucesso');
            res.redirect('/');
        });
        
        return;
    }
    
    passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

// Callback do GitHub
router.get('/auth/github/callback', 
    passport.authenticate('github', { 
        failureRedirect: '/login?error=auth_failed',
        failureMessage: true
    }),
    (req: Request, res: Response) => {
        logger.info(`Login bem-sucedido para: ${(req.user as any)?.username}`);
        res.redirect('/');
    }
);

// Logout
router.post('/logout', (req: Request, res: Response, next) => {
    req.logout((err) => {
        if (err) {
            logger.error('Erro no logout:', err);
            return next(err);
        }
        
        req.session.destroy((err) => {
            if (err) {
                logger.error('Erro ao destruir sessão:', err);
                return res.status(500).json({ error: 'Erro no logout' });
            }
            
            res.clearCookie('connect.sid');
            return res.json({ message: 'Logout realizado com sucesso' });
        });
    });
});

// Informações do usuário
router.get('/user', (req: Request, res: Response) => {
    if (!authService.isAuthenticationRequired()) {
        return res.json({ 
            authenticated: false, 
            authRequired: false,
            user: null 
        });
    }

    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.json({ 
            authenticated: false, 
            authRequired: true,
            user: null 
        });
    }

    return res.json({ 
        authenticated: true, 
        authRequired: true,
        user: req.user 
    });
});

// Status da autenticação
router.get('/auth/status', (req: Request, res: Response) => {
    res.json({
        authRequired: authService.isAuthenticationRequired(),
        authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        user: req.user || null
    });
});

export default router;
