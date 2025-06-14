/**
 * Utilidades de logging para o frontend
 * Controlada pela variável global window.LOG_DEBUG (definida no HTML ou via localStorage)
 */
class Logger {
    constructor() {
        // Verificar LOG_DEBUG no localStorage ou window
        this.debugEnabled = window.localStorage.getItem('LOG_DEBUG') === 'true' || 
                           window.LOG_DEBUG === true;
    }

    debug(...args) {
        if (this.debugEnabled) {
            console.log('[DEBUG]', ...args);
        }
    }
    
    info(...args) {
        console.log('[INFO]', ...args);
    }
    
    warn(...args) {
        console.warn('[WARN]', ...args);
    }
    
    error(...args) {
        console.error('[ERROR]', ...args);
    }

    setDebug(enabled) {
        this.debugEnabled = enabled;
        window.localStorage.setItem('LOG_DEBUG', enabled.toString());
    }

    getDebug() {
        return this.debugEnabled;
    }
}

// Criar instância global
const logger = new Logger();
window.logger = logger;
