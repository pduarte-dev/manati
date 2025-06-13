import { logger } from '../utils/logger.js';

export interface FileLock {
    filePath: string;
    userId: string;
    userName: string;
    timestamp: number;
    lastActivity: number;
}

export class FileLockService {
    private locks: Map<string, FileLock> = new Map();
    private readonly LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutos
    private readonly ACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos de inatividade
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Executar limpeza de locks expirados a cada minuto
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredLocks();
        }, 60 * 1000);
        
        logger.info('FileLockService inicializado');
    }

    /**
     * Tenta obter um lock para um arquivo
     */
    acquireLock(filePath: string, userId: string, userName: string): { success: boolean; currentLock?: FileLock } {
        const normalizedPath = this.normalizePath(filePath);
        const existingLock = this.locks.get(normalizedPath);
        
        // Se não há lock existente, criar novo
        if (!existingLock) {
            const newLock: FileLock = {
                filePath: normalizedPath,
                userId,
                userName,
                timestamp: Date.now(),
                lastActivity: Date.now()
            };
            
            this.locks.set(normalizedPath, newLock);
            logger.info(`Lock adquirido para ${filePath} por ${userName} (${userId})`);
            return { success: true };
        }
        
        // Se o lock é do mesmo usuário, renovar
        if (existingLock.userId === userId) {
            existingLock.lastActivity = Date.now();
            logger.debug(`Lock renovado para ${filePath} por ${userName} (${userId})`);
            return { success: true };
        }
        
        // Se o lock está expirado, assumir controle
        if (this.isLockExpired(existingLock)) {
            const newLock: FileLock = {
                filePath: normalizedPath,
                userId,
                userName,
                timestamp: Date.now(),
                lastActivity: Date.now()
            };
            
            this.locks.set(normalizedPath, newLock);
            logger.info(`Lock expirado substituído para ${filePath} por ${userName} (${userId})`);
            return { success: true };
        }
        
        // Lock está ativo por outro usuário
        logger.info(`Lock negado para ${filePath} - já editado por ${existingLock.userName}`);
        return { success: false, currentLock: existingLock };
    }

    /**
     * Libera o lock de um arquivo
     */
    releaseLock(filePath: string, userId: string): boolean {
        const normalizedPath = this.normalizePath(filePath);
        const existingLock = this.locks.get(normalizedPath);
        
        if (!existingLock) {
            return true; // Já não há lock
        }
        
        if (existingLock.userId === userId) {
            this.locks.delete(normalizedPath);
            logger.info(`Lock liberado para ${filePath} por ${existingLock.userName} (${userId})`);
            return true;
        }
        
        logger.warn(`Tentativa de liberar lock de outro usuário para ${filePath}`);
        return false;
    }

    /**
     * Atualiza a atividade do lock
     */
    updateActivity(filePath: string, userId: string): boolean {
        const normalizedPath = this.normalizePath(filePath);
        const existingLock = this.locks.get(normalizedPath);
        
        if (!existingLock || existingLock.userId !== userId) {
            return false;
        }
        
        existingLock.lastActivity = Date.now();
        return true;
    }

    /**
     * Verifica se um arquivo está travado
     */
    isLocked(filePath: string): { locked: boolean; lock?: FileLock } {
        const normalizedPath = this.normalizePath(filePath);
        const existingLock = this.locks.get(normalizedPath);
        
        if (!existingLock) {
            return { locked: false };
        }
        
        if (this.isLockExpired(existingLock)) {
            this.locks.delete(normalizedPath);
            return { locked: false };
        }
        
        return { locked: true, lock: existingLock };
    }

    /**
     * Obtém todos os arquivos travados
     */
    getAllLocks(): FileLock[] {
        // Limpar locks expirados antes de retornar
        this.cleanupExpiredLocks();
        return Array.from(this.locks.values());
    }

    /**
     * Obtém locks de um usuário específico
     */
    getUserLocks(userId: string): FileLock[] {
        return Array.from(this.locks.values()).filter(lock => lock.userId === userId);
    }

    /**
     * Remove todos os locks de um usuário (logout/desconexão)
     */
    releaseAllUserLocks(userId: string): string[] {
        const releasedFiles: string[] = [];
        
        for (const [filePath, lock] of this.locks.entries()) {
            if (lock.userId === userId) {
                this.locks.delete(filePath);
                releasedFiles.push(filePath);
            }
        }
        
        if (releasedFiles.length > 0) {
            logger.info(`Todos os locks liberados para usuário ${userId}: ${releasedFiles.join(', ')}`);
        }
        
        return releasedFiles;
    }

    /**
     * Força a liberação de um lock (admin)
     */
    forceReleaseLock(filePath: string): boolean {
        const normalizedPath = this.normalizePath(filePath);
        const existed = this.locks.has(normalizedPath);
        
        if (existed) {
            this.locks.delete(normalizedPath);
            logger.warn(`Lock forçadamente liberado para ${filePath}`);
        }
        
        return existed;
    }

    /**
     * Verifica se um lock está expirado
     */
    private isLockExpired(lock: FileLock): boolean {
        const now = Date.now();
        const timeSinceCreation = now - lock.timestamp;
        const timeSinceActivity = now - lock.lastActivity;
        
        return timeSinceCreation > this.LOCK_TIMEOUT || timeSinceActivity > this.ACTIVITY_TIMEOUT;
    }

    /**
     * Limpa locks expirados
     */
    private cleanupExpiredLocks(): void {
        const expiredPaths: string[] = [];
        
        for (const [filePath, lock] of this.locks.entries()) {
            if (this.isLockExpired(lock)) {
                expiredPaths.push(filePath);
            }
        }
        
        for (const filePath of expiredPaths) {
            const lock = this.locks.get(filePath);
            this.locks.delete(filePath);
            logger.info(`Lock expirado removido para ${filePath} (usuário: ${lock?.userName})`);
        }
        
        if (expiredPaths.length > 0) {
            logger.debug(`${expiredPaths.length} locks expirados removidos`);
        }
    }

    /**
     * Normaliza o caminho do arquivo
     */
    private normalizePath(filePath: string): string {
        return filePath.replace(/\\/g, '/').replace(/\/+/g, '/');
    }

    /**
     * Limpa recursos quando o serviço é destruído
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.locks.clear();
        logger.info('FileLockService destruído');
    }
}

// Instância singleton
export const fileLockService = new FileLockService();