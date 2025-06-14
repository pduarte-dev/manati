/**
 * Serviço de autenticação GitHub OAuth
 */
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import config from '../config/environment.js';
import { logger } from '../utils/logger.js';

export interface User {
    id: string;
    username: string;
    displayName: string;
    email: string;
    avatar: string;
    profileUrl: string;
}

export class AuthService {
    constructor() {
        // Só configurar Passport se autenticação estiver habilitada e credenciais disponíveis
        if (this.isAuthenticationRequired()) {
            this.setupPassport();
        }
    }

    private setupPassport(): void {
        // Verificar se as credenciais estão disponíveis
        if (!config.githubClientId || !config.githubClientSecret) {
            logger.warn('Credenciais GitHub não configuradas. Autenticação desabilitada.');
            return;
        }

        // Configurar estratégia GitHub
        passport.use(new GitHubStrategy({
            clientID: config.githubClientId,
            clientSecret: config.githubClientSecret,
            callbackURL: '/auth/github/callback',
            scope: ['user:email']
        }, async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
            try {
                logger.debug('GitHub profile received:', profile);
                
                // Verificar se o usuário tem email válido
                const email = this.getValidEmail(profile);
                if (!email) {
                    return done(null, false, { message: 'Email não encontrado no perfil GitHub' });
                }

                // Verificar domínio do email
                if (!this.isEmailDomainAllowed(email)) {
                    logger.warn(`Acesso negado para email: ${email}`);
                    return done(null, false, { 
                        message: `Acesso restrito. Email deve ser do domínio ${config.allowedEmailDomain}` 
                    });
                }

                const user: User = {
                    id: profile.id,
                    username: profile.username,
                    displayName: profile.displayName || profile.username,
                    email: email,
                    avatar: profile.photos?.[0]?.value || '',
                    profileUrl: profile.profileUrl || ''
                };

                logger.info(`Usuário autenticado: ${user.username} (${user.email})`);
                return done(null, user);
            } catch (error) {
                logger.error('Erro na autenticação GitHub:', error);
                return done(error);
            }
        }));

        // Serialização do usuário
        passport.serializeUser((user: User, done) => {
            done(null, user);
        });

        passport.deserializeUser((user: User, done) => {
            done(null, user);
        });
    }

    private getValidEmail(profile: any): string | null {
        // Tentar pegar email do perfil
        if (profile.emails && profile.emails.length > 0) {
            // Procurar email primário primeiro
            const primaryEmail = profile.emails.find((email: any) => email.primary);
            if (primaryEmail) return primaryEmail.value;
            
            // Se não houver primário, pegar o primeiro
            return profile.emails[0].value;
        }

        // Fallback para email construído
        if (profile.username) {
            return `${profile.username}@users.noreply.github.com`;
        }

        return null;
    }

    private isEmailDomainAllowed(email: string): boolean {
        if (!config.allowedEmailDomain) return true;
        
        return email.toLowerCase().endsWith(config.allowedEmailDomain.toLowerCase());
    }

    isAuthenticationRequired(): boolean {
        return config.authEnabled === true && 
               !!config.githubClientId && 
               !!config.githubClientSecret;
    }

    requireAuth(req: any, res: any, next: any): void {
        if (!this.isAuthenticationRequired()) {
            return next();
        }

        if (!req.isAuthenticated || !req.isAuthenticated()) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(401).json({ 
                    error: 'Autenticação necessária',
                    redirectTo: '/login'
                });
            }
            return res.redirect('/login');
        }

        next();
    }
}

export const authService = new AuthService();
