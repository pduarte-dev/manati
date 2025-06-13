import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const router = Router();

// Diretório base do projeto (onde está o .git)
const PROJECT_ROOT = path.resolve(process.cwd());

// Mapa para rastrear quais arquivos cada usuário modificou
// Estrutura: Map<userId, Set<filePath>>
const userModifiedFiles = new Map<string, Set<string>>();

/**
 * Registra que um usuário modificou um arquivo
 */
function trackUserModification(userId: string, filePath: string) {
    if (!userModifiedFiles.has(userId)) {
        userModifiedFiles.set(userId, new Set());
    }
    userModifiedFiles.get(userId)!.add(filePath);
    console.log(`📝 Usuário ${userId} modificou arquivo: ${filePath}`);
}

/**
 * Obtém arquivos modificados por um usuário específico
 */
function getUserModifiedFiles(userId: string): string[] {
    const userFiles = userModifiedFiles.get(userId);
    return userFiles ? Array.from(userFiles) : [];
}

/**
 * Remove arquivo da lista de modificados do usuário
 */
function untrackUserModification(userId: string, filePath: string) {
    const userFiles = userModifiedFiles.get(userId);
    if (userFiles) {
        userFiles.delete(filePath);
        if (userFiles.size === 0) {
            userModifiedFiles.delete(userId);
        }
    }
}

/**
 * Registra que um usuário modificou um arquivo
 */
router.post('/track-modification', async (req, res) => {
    try {
        const { userId, filePath } = req.body;
        
        if (!userId || !filePath) {
            return res.status(400).json({
                success: false,
                error: 'userId e filePath são obrigatórios'
            });
        }
        
        // Validar que o arquivo está na pasta permitida
        if (!filePath.startsWith('markdown-files/') || !filePath.endsWith('.md')) {
            return res.status(400).json({
                success: false,
                error: 'Apenas arquivos .md na pasta markdown-files são permitidos'
            });
        }
        
        trackUserModification(userId, filePath);
        
        res.json({
            success: true,
            message: 'Modificação registrada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao registrar modificação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * Obtém arquivos modificados por um usuário específico
 */
router.get('/user-modified/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId é obrigatório'
            });
        }
        
        const userFiles = getUserModifiedFiles(userId);
        
        res.json({
            success: true,
            files: userFiles,
            count: userFiles.length
        });
        
    } catch (error) {
        console.error('Erro ao obter arquivos modificados do usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * Verifica se Git está disponível e se é um repositório
 */
router.get('/status', async (req, res) => {
    try {
        // Verificar se é um repositório Git
        const gitDir = path.join(PROJECT_ROOT, '.git');
        const isGitRepo = fs.existsSync(gitDir);
        
        if (!isGitRepo) {
            return res.json({ 
                available: false, 
                error: 'Não é um repositório Git' 
            });
        }

        // Verificar se git está instalado
        await execAsync('git --version', { cwd: PROJECT_ROOT });
        
        // Obter informações do repositório
        const { stdout: branchOutput } = await execAsync('git branch --show-current', { cwd: PROJECT_ROOT });
        const currentBranch = branchOutput.trim();
        
        const { stdout: remoteOutput } = await execAsync('git remote -v', { cwd: PROJECT_ROOT });
        const hasRemote = remoteOutput.trim().length > 0;
        
        return res.json({
            available: true,
            isRepository: true,
            currentBranch,
            hasRemote,
            projectRoot: PROJECT_ROOT
        });
        
    } catch (error) {
        console.error('Erro ao verificar status do Git:', error);
        return res.json({ 
            available: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

/**
 * Lista arquivos modificados no repositório
 */
router.get('/modified', async (req, res) => {
    try {
        // Obter arquivos modificados (staged + unstaged)
        const { stdout: statusOutput } = await execAsync('git status --porcelain', { cwd: PROJECT_ROOT });
        
        const modifiedFiles = [];
        const lines = statusOutput.trim().split('\n').filter(line => line.length > 0);
        
        for (const line of lines) {
            const status = line.substring(0, 2);
            const filePath = line.substring(3);
            
            // Filtrar apenas arquivos markdown na pasta markdown-files
            if (filePath.startsWith('markdown-files/') && filePath.endsWith('.md')) {
                modifiedFiles.push(filePath);
            }
        }
        
        return res.json({
            success: true,
            files: modifiedFiles,
            count: modifiedFiles.length
        });
        
    } catch (error) {
        console.error('Erro ao listar arquivos modificados:', error);
        return res.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            files: []
        });
    }
});

/**
 * Faz commit dos arquivos especificados
 */
router.post('/commit', async (req, res) => {
    try {
        const { files, message, author, userId } = req.body;
        
        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum arquivo especificado para commit'
            });
        }
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Mensagem de commit é obrigatória'
            });
        }
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'ID do usuário é obrigatório'
            });
        }
        
        // ✅ VALIDAÇÃO: Verificar se o usuário pode commitar apenas arquivos que ELE modificou
        const userFiles = getUserModifiedFiles(userId);
        const unauthorizedFiles = files.filter(file => !userFiles.includes(file));
        
        if (unauthorizedFiles.length > 0) {
            return res.status(403).json({
                success: false,
                error: `Você não pode commitar arquivos que não modificou: ${unauthorizedFiles.join(', ')}`
            });
        }
        
        // Configurar autor do commit se fornecido
        if (author && author.name && author.email) {
            await execAsync(`git config user.name "${author.name}"`, { cwd: PROJECT_ROOT });
            await execAsync(`git config user.email "${author.email}"`, { cwd: PROJECT_ROOT });
        }
        
        // Adicionar arquivos ao staging
        for (const file of files) {
            // Validar que o arquivo está na pasta permitida
            if (!file.startsWith('markdown-files/') || !file.endsWith('.md')) {
                continue;
            }
            
            const fullPath = path.join(PROJECT_ROOT, file);
            if (fs.existsSync(fullPath)) {
                await execAsync(`git add "${file}"`, { cwd: PROJECT_ROOT });
            }
        }
        
        // Fazer commit
        const commitMessage = message.trim();
        const { stdout: commitOutput } = await execAsync(`git commit -m "${commitMessage}"`, { cwd: PROJECT_ROOT });
        
        // Obter hash do commit
        const { stdout: hashOutput } = await execAsync('git rev-parse HEAD', { cwd: PROJECT_ROOT });
        const commitHash = hashOutput.trim();
        
        // Tentar fazer push se houver remote configurado
        let pushResult = null;
        try {
            const { stdout: pushOutput } = await execAsync('git push', { cwd: PROJECT_ROOT });
            pushResult = pushOutput;
        } catch (pushError) {
            console.warn('Aviso: Não foi possível fazer push automático:', pushError instanceof Error ? pushError.message : 'Erro desconhecido');
            // Não falhar o commit por causa do push
        }
        
        // Rastrear modificação dos arquivos pelo usuário
        for (const file of files) {
            trackUserModification(userId, file);
        }
        
        return res.json({
            success: true,
            message: 'Commit realizado com sucesso',
            commitHash,
            commitMessage,
            filesCommitted: files,
            pushResult
        });
        
    } catch (error) {
        console.error('Erro ao fazer commit:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

/**
 * Obtém histórico de commits
 */
router.get('/log', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        
        const { stdout: logOutput } = await execAsync(
            `git log --oneline --max-count=${limit} --pretty=format:"%H|%an|%ae|%ad|%s" --date=iso`,
            { cwd: PROJECT_ROOT }
        );
        
        const commits = logOutput.trim().split('\n').map(line => {
            const [hash, author, email, date, message] = line.split('|');
            return {
                hash,
                author,
                email,
                date: new Date(date),
                message
            };
        });
        
        return res.json({
            success: true,
            commits
        });
        
    } catch (error) {
        console.error('Erro ao obter log do Git:', error);
        return res.json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            commits: []
        });
    }
});

export default router;
