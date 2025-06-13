/**
 * Utilidades de logging controladas por variável de ambiente
 */
import { config } from '../config/environment.js';

export const logger = {
    debug: (...args: any[]) => {
        if (config.logDebug) {
            console.log('[DEBUG]', ...args);
        }
    },
    
    info: (...args: any[]) => {
        console.log('[INFO]', ...args);
    },
    
    warn: (...args: any[]) => {
        console.warn('[WARN]', ...args);
    },
    
    error: (...args: any[]) => {
        console.error('[ERROR]', ...args);
    }
};

export default logger;
