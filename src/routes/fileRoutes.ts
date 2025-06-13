/**
 * Rotas para gerenciamento de arquivos
 */
import { Router, Request, Response } from 'express';
import { FileService } from '../services/fileService.js';
import { fileLockService } from '../services/fileLockService.js';
import logger from '../utils/logger.js';

const router = Router();
const fileService = new FileService();

// ================ ROTAS DE TRAVAMENTO DE ARQUIVOS (DEVEM VIR PRIMEIRO) ================

// Verificar status de lock de arquivo
router.get('/file/:filename(*)/lock', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { locked, lock } = fileLockService.isLocked(filename);
        
        res.json({ locked, lock });
    } catch (error: any) {
        logger.error('Erro ao verificar lock:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Adquirir lock de arquivo
router.post('/file/:filename(*)/lock', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { userId, userName } = req.body;
        
        if (!userId || !userName) {
            return res.status(400).json({ error: 'ID do usuário e nome são obrigatórios' });
        }
        
        const result = fileLockService.acquireLock(filename, userId, userName);
        
        if (result.success) {
            return res.json({ success: true, message: 'Lock adquirido com sucesso' });
        } else {
            return res.status(409).json({ 
                success: false, 
                error: `Arquivo está sendo editado por ${result.currentLock?.userName}`,
                currentLock: result.currentLock 
            });
        }
    } catch (error: any) {
        logger.error('Erro ao adquirir lock:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Liberar lock de arquivo
router.delete('/file/:filename(*)/lock', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'ID do usuário é obrigatório' });
        }
        
        const success = fileLockService.releaseLock(filename, userId);
        
        if (success) {
            return res.json({ success: true, message: 'Lock liberado com sucesso' });
        } else {
            return res.status(403).json({ success: false, error: 'Não é possível liberar este lock' });
        }
    } catch (error: any) {
        logger.error('Erro ao liberar lock:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar atividade do lock
router.patch('/file/:filename(*)/lock/activity', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'ID do usuário é obrigatório' });
        }
        
        const success = fileLockService.updateActivity(filename, userId);
        
        if (success) {
            return res.json({ success: true });
        } else {
            return res.status(404).json({ success: false, error: 'Lock não encontrado' });
        }
    } catch (error: any) {
        logger.error('Erro ao atualizar atividade do lock:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Renomear arquivo (ANTES da rota genérica)
router.patch('/file/:filename(*)/rename', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { newName } = req.body;
        
        if (!newName || typeof newName !== 'string') {
            return res.status(400).json({ error: 'Novo nome é obrigatório' });
        }
        
        await fileService.renameFile(filename, newName);
        return res.json({ message: 'Arquivo renomeado com sucesso' });
    } catch (error: any) {
        logger.error('Erro ao renomear arquivo:', error);
        const statusCode = error.message.includes('não encontrado') ? 404 : 
                          error.message.includes('já existe') ? 409 : 500;
        return res.status(statusCode).json({ error: error.message });
    }
});

// Mover arquivo (ANTES da rota genérica)
router.patch('/file/:filename(*)/move', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { newPath } = req.body;
        
        if (!newPath || typeof newPath !== 'string') {
            return res.status(400).json({ error: 'Novo caminho é obrigatório' });
        }
        
        await fileService.moveFile(filename, newPath);
        return res.json({ message: 'Arquivo movido com sucesso' });
    } catch (error: any) {
        logger.error('Erro ao mover arquivo:', error);
        const statusCode = error.message.includes('não encontrado') ? 404 : 
                          error.message.includes('já existe') ? 409 : 500;
        return res.status(statusCode).json({ error: error.message });
    }
});

// ================ ROTAS BÁSICAS DE ARQUIVO ================

// Listar arquivos
router.get('/files', async (req: Request, res: Response) => {
    try {
        const path = (req.query.path as string) || '';
        const files = await fileService.getFiles(path);
        
        // Adicionar informações de lock para cada arquivo
        const filesWithLocks = files.map(file => {
            if (!file.isDirectory) {
                const { locked, lock } = fileLockService.isLocked(file.path);
                return {
                    ...file,
                    locked,
                    lock: locked ? lock : undefined
                };
            }
            return file;
        });
        
        res.json(filesWithLocks);
    } catch (error) {
        logger.error('Erro ao listar arquivos:', error);
        res.status(500).json({ error: 'Erro ao listar arquivos' });
    }
});

// Ler arquivo
router.get('/file/:filename(*)', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const content = await fileService.readFile(filename);
        
        // Verificar se arquivo está travado
        const { locked, lock } = fileLockService.isLocked(filename);
        
        res.json({ 
            content, 
            locked, 
            lock: locked ? lock : undefined 
        });
    } catch (error: any) {
        logger.error('Erro ao ler arquivo:', error);
        const statusCode = error.message === 'Arquivo não encontrado' ? 404 : 500;
        res.status(statusCode).json({ error: error.message });
    }
});

// Salvar arquivo
router.put('/file/:filename(*)', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { content } = req.body;
        
        if (typeof content !== 'string') {
            return res.status(400).json({ error: 'Conteúdo inválido' });
        }
        
        await fileService.writeFile(filename, content);
        return res.json({ message: 'Arquivo salvo com sucesso' });
    } catch (error: any) {
        logger.error('Erro ao salvar arquivo:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Criar novo arquivo
router.post('/file/:filename(*)', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { content = '' } = req.body;
        
        // Verificar se arquivo já existe
        const exists = await fileService.fileExists(filename);
        if (exists) {
            return res.status(409).json({ error: 'Arquivo já existe' });
        }
        
        await fileService.writeFile(filename, content);
        return res.json({ message: 'Arquivo criado com sucesso' });
    } catch (error: any) {
        logger.error('Erro ao criar arquivo:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Excluir arquivo
router.delete('/file/:filename(*)', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        await fileService.deleteFile(filename);
        res.json({ message: 'Arquivo excluído com sucesso' });
    } catch (error: any) {
        logger.error('Erro ao excluir arquivo:', error);
        const statusCode = error.message === 'Arquivo não encontrado' ? 404 : 500;
        res.status(statusCode).json({ error: error.message });
    }
});

// Criar pasta
router.post('/folder', async (req: Request, res: Response) => {
    try {
        const { path } = req.body;
        
        if (!path || typeof path !== 'string') {
            return res.status(400).json({ error: 'Caminho da pasta é obrigatório' });
        }
        
        await fileService.createDirectory(path);
        return res.json({ message: 'Pasta criada com sucesso' });
    } catch (error: any) {
        logger.error('Erro ao criar pasta:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Excluir pasta
router.delete('/folder/:folderPath(*)', async (req: Request, res: Response) => {
    try {
        const folderPath = req.params.folderPath;
        
        if (!folderPath) {
            return res.status(400).json({ error: 'Caminho da pasta é obrigatório' });
        }
        
        await fileService.deleteDirectory(folderPath);
        return res.json({ message: 'Pasta excluída com sucesso' });
    } catch (error: any) {
        logger.error('Erro ao excluir pasta:', error);
        const statusCode = error.message.includes('não encontrada') ? 404 : 500;
        return res.status(statusCode).json({ error: error.message });
    }
});

// Renomear arquivo
router.patch('/file/:filename(*)/rename', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { newName } = req.body;
        
        if (!newName || typeof newName !== 'string') {
            return res.status(400).json({ error: 'Novo nome é obrigatório' });
        }
        
        await fileService.renameFile(filename, newName);
        return res.json({ message: 'Arquivo renomeado com sucesso' });
    } catch (error: any) {
        logger.error('Erro ao renomear arquivo:', error);
        const statusCode = error.message.includes('não encontrado') ? 404 : 
                          error.message.includes('já existe') ? 409 : 500;
        return res.status(statusCode).json({ error: error.message });
    }
});

// Renomear pasta
router.patch('/folder/:folderPath(*)/rename', async (req: Request, res: Response) => {
    try {
        const folderPath = req.params.folderPath;
        const { newName } = req.body;
        
        if (!folderPath) {
            return res.status(400).json({ error: 'Caminho da pasta é obrigatório' });
        }
        
        if (!newName || typeof newName !== 'string') {
            return res.status(400).json({ error: 'Novo nome é obrigatório' });
        }
        
        await fileService.renameDirectory(folderPath, newName);
        return res.json({ message: 'Pasta renomeada com sucesso' });
    } catch (error: any) {
        logger.error('Erro ao renomear pasta:', error);
        const statusCode = error.message.includes('não encontrada') ? 404 : 
                          error.message.includes('já existe') ? 409 : 500;
        return res.status(statusCode).json({ error: error.message });
    }
});

// Mover arquivo
router.patch('/file/:filename(*)/move', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { newPath } = req.body;
        
        if (!newPath || typeof newPath !== 'string') {
            return res.status(400).json({ error: 'Novo caminho é obrigatório' });
        }
        
        await fileService.moveFile(filename, newPath);
        return res.json({ message: 'Arquivo movido com sucesso' });
    } catch (error: any) {
        logger.error('Erro ao mover arquivo:', error);
        const statusCode = error.message.includes('não encontrado') ? 404 : 
                          error.message.includes('já existe') ? 409 : 500;
        return res.status(statusCode).json({ error: error.message });
    }
});

// Mover pasta
router.patch('/folder/:folderPath(*)/move', async (req: Request, res: Response) => {
    try {
        const folderPath = req.params.folderPath;
        const { newPath } = req.body;
        
        if (!folderPath) {
            return res.status(400).json({ error: 'Caminho da pasta é obrigatório' });
        }
        
        if (!newPath || typeof newPath !== 'string') {
            return res.status(400).json({ error: 'Novo caminho é obrigatório' });
        }
        
        await fileService.moveDirectory(folderPath, newPath);
        return res.json({ message: 'Pasta movida com sucesso' });
    } catch (error: any) {
        logger.error('Erro ao mover pasta:', error);
        const statusCode = error.message.includes('não encontrada') ? 404 : 
                          error.message.includes('já existe') ? 409 : 500;
        return res.status(statusCode).json({ error: error.message });
    }
});

// Buscar arquivos
router.get('/search', async (req: Request, res: Response) => {
    try {
        const query = (req.query.q as string) || '';
        
        if (!query.trim()) {
            res.json([]);
            return;
        }
        
        const results = await fileService.searchFiles(query);
        res.json(results);
    } catch (error: any) {
        logger.error('Erro ao buscar arquivos:', error);
        res.status(500).json({ error: 'Erro ao buscar arquivos' });
    }
});

// ================ ROTAS DE TRAVAMENTO DE ARQUIVOS ================

// Adquirir lock de arquivo
router.post('/file/:filename(*)/lock', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { userId, userName } = req.body;
        
        if (!userId || !userName) {
            return res.status(400).json({ error: 'ID do usuário e nome são obrigatórios' });
        }
        
        const result = fileLockService.acquireLock(filename, userId, userName);
        
        if (result.success) {
            return res.json({ success: true, message: 'Lock adquirido com sucesso' });
        } else {
            return res.status(409).json({ 
                success: false, 
                error: `Arquivo está sendo editado por ${result.currentLock?.userName}`,
                currentLock: result.currentLock 
            });
        }
    } catch (error: any) {
        logger.error('Erro ao adquirir lock:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Liberar lock de arquivo
router.delete('/file/:filename(*)/lock', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'ID do usuário é obrigatório' });
        }
        
        const success = fileLockService.releaseLock(filename, userId);
        
        if (success) {
            return res.json({ success: true, message: 'Lock liberado com sucesso' });
        } else {
            return res.status(403).json({ success: false, error: 'Não é possível liberar este lock' });
        }
    } catch (error: any) {
        logger.error('Erro ao liberar lock:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar atividade do lock
router.patch('/file/:filename(*)/lock/activity', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'ID do usuário é obrigatório' });
        }
        
        const success = fileLockService.updateActivity(filename, userId);
        
        if (success) {
            return res.json({ success: true });
        } else {
            return res.status(404).json({ success: false, error: 'Lock não encontrado' });
        }
    } catch (error: any) {
        logger.error('Erro ao atualizar atividade do lock:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Verificar status de lock de arquivo
router.get('/file/:filename(*)/lock', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const { locked, lock } = fileLockService.isLocked(filename);
        
        res.json({ locked, lock });
    } catch (error: any) {
        logger.error('Erro ao verificar lock:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar todos os locks ativos
router.get('/locks', async (req: Request, res: Response) => {
    try {
        const locks = fileLockService.getAllLocks();
        res.json(locks);
    } catch (error: any) {
        logger.error('Erro ao listar locks:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Liberar todos os locks de um usuário (logout/desconexão)
router.delete('/locks/user/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const releasedFiles = fileLockService.releaseAllUserLocks(userId);
        
        res.json({ 
            success: true, 
            message: `${releasedFiles.length} locks liberados`,
            releasedFiles 
        });
    } catch (error: any) {
        logger.error('Erro ao liberar locks do usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
