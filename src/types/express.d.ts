/**
 * Extensões de tipos para autenticação
 */
import { User } from '../services/authService.js';

declare global {
    namespace Express {
        interface User {
            id: string;
            username: string;
            displayName: string;
            email: string;
            avatar: string;
            profileUrl: string;
        }
    }
}

export {};
