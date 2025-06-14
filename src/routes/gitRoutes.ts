import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import config from '../config/environment.js';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);
const router = Router();

// Diretório base do projeto (onde está o .git)
const PROJECT_ROOT = path.resolve(process.cwd());

// Calcular o caminho relativo do diretório markdown em relação ao PROJECT_ROOT
const MARKDOWN_RELATIVE_PATH = path.relative(PROJECT_ROOT, config.markdownDir);

/**
 * Normaliza um caminho de arquivo para garantir que tenha o prefixo correto do diretório markdown
 */
function normalizeFilePath(filePath: string): string {
    // Se já tem o prefixo correto, retornar como está
    if (filePath.startsWith(MARKDOWN_RELATIVE_PATH + '/')) {
        return filePath;
    }
    
    // Se não tem o prefixo, adicionar
    return path.join(MARKDOWN_RELATIVE_PATH, filePath).replace(/\\/g, '/');
}

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
    logger.debug(`📝 Usuário ${userId} modificou arquivo: ${filePath}`);
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
        
        // Normalizar e validar o caminho do arquivo
        const normalizedFilePath = normalizeFilePath(filePath);
        
        // Validar que o arquivo é .md
        if (!normalizedFilePath.endsWith('.md')) {
            return res.status(400).json({
                success: false,
                error: 'Apenas arquivos .md são permitidos'
            });
        }
        
        trackUserModification(userId, normalizedFilePath);
        
        return res.json({
            success: true,
            message: 'Modificação registrada com sucesso'
        });
        
    } catch (error) {
        logger.error('Erro ao registrar modificação:', error);
        return res.status(500).json({
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
        
        return res.json({
            success: true,
            files: userFiles,
            count: userFiles.length
        });
        
    } catch (error) {
        logger.error('Erro ao obter arquivos modificados do usuário:', error);
        return res.status(500).json({
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
        logger.debug('🔍 GitRoutes: Recebendo requisição /status');
        logger.debug('👤 Usuário autenticado:', req.user);
        logger.debug('🍪 Session ID:', req.sessionID);
        
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
        logger.error('Erro ao verificar status do Git:', error);
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
            
            // Filtrar apenas arquivos markdown na pasta configurada
            if (filePath.startsWith(MARKDOWN_RELATIVE_PATH + '/') && filePath.endsWith('.md')) {
                modifiedFiles.push(filePath);
            }
        }
        
        return res.json({
            success: true,
            files: modifiedFiles,
            count: modifiedFiles.length
        });
        
    } catch (error) {
        logger.error('Erro ao listar arquivos modificados:', error);
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
        const { files, deletedFiles, message, author, userId } = req.body;
        
        // Validar se há arquivos para modificar ou excluir
        const modifiedFiles = files || [];
        const filesToDelete = deletedFiles || [];
        const totalFiles = modifiedFiles.length + filesToDelete.length;
        
        if (totalFiles === 0) {
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
        
        // 🔄 TEMPORÁRIO: Validação desabilitada - confiando no frontend
        // Como o frontend já controla quais arquivos o usuário modificou,
        // vamos confiar nessa informação por enquanto
        /*
        // ✅ VALIDAÇÃO: Verificar se o usuário pode commitar apenas arquivos que ELE modificou
        const userFiles = getUserModifiedFiles(userId);
        const unauthorizedFiles = files.filter(file => !userFiles.includes(file));
        
        if (unauthorizedFiles.length > 0) {
            return res.status(403).json({
                success: false,
                error: `Você não pode commitar arquivos que não modificou: ${unauthorizedFiles.join(', ')}`
            });
        }
        */
        
        logger.debug(`✅ Iniciando commit de ${modifiedFiles.length} arquivo(s) modificado(s) e ${filesToDelete.length} arquivo(s) excluído(s) pelo usuário ${userId}`);
        logger.debug('📂 Arquivos modificados recebidos:', modifiedFiles);
        logger.debug('🗑️ Arquivos excluídos recebidos:', filesToDelete);
        
        // Configurar autor do commit se fornecido
        if (author && author.name && author.email) {
            await execAsync(`git config user.name "${author.name}"`, { cwd: PROJECT_ROOT });
            await execAsync(`git config user.email "${author.email}"`, { cwd: PROJECT_ROOT });
        }
        
        // Processar arquivos modificados (git add)
        let filesActuallyStaged = 0;
        for (const file of modifiedFiles) {
            logger.debug(`🔍 Processando arquivo modificado: ${file}`);
            
            // Normalizar e validar o caminho
            const normalizedFile = normalizeFilePath(file);
            
            // Validar que o arquivo é .md
            if (!normalizedFile.endsWith('.md')) {
                logger.debug(`⚠️ Arquivo ignorado (não é markdown): ${normalizedFile}`);
                continue;
            }
            
            const fullPath = path.join(PROJECT_ROOT, normalizedFile);
            logger.debug(`📁 Caminho completo: ${fullPath}`);
            
            if (fs.existsSync(fullPath)) {
                try {
                    logger.debug(`✅ Arquivo existe, adicionando ao stage: ${normalizedFile}`);
                    await execAsync(`git add "${normalizedFile}"`, { cwd: PROJECT_ROOT });
                    logger.debug(`✅ Arquivo adicionado ao stage: ${normalizedFile}`);
                    filesActuallyStaged++;
                } catch (addError) {
                    logger.error(`❌ Erro ao adicionar arquivo ao stage: ${normalizedFile}`, addError);
                }
            } else {
                logger.debug(`❌ Arquivo não encontrado: ${fullPath}`);
            }
        }
        
        // Processar arquivos excluídos (git rm)
        let filesActuallyDeleted = 0;
        for (const file of filesToDelete) {
            logger.debug(`🗑️ Processando arquivo excluído: ${file}`);
            
            // Normalizar e validar o caminho
            const normalizedFile = normalizeFilePath(file);
            
            // Validar que o arquivo é .md
            if (!normalizedFile.endsWith('.md')) {
                logger.debug(`⚠️ Arquivo ignorado (não é markdown): ${normalizedFile}`);
                continue;
            }
            
            try {
                // Usar git rm para remover o arquivo do índice e working tree
                logger.debug(`🗑️ Tentando git rm para: ${normalizedFile}`);
                await execAsync(`git rm "${normalizedFile}"`, { cwd: PROJECT_ROOT });
                logger.debug(`✅ Arquivo removido do Git: ${normalizedFile}`);
                filesActuallyDeleted++;
            } catch (rmError) {
                // Se git rm falhar, pode ser que o arquivo já foi removido do filesystem
                // Neste caso, usar git add para registrar a remoção
                logger.debug(`⚠️ git rm falhou para ${normalizedFile}, tentando git add...`);
                logger.debug('Erro do git rm:', rmError);
                try {
                    await execAsync(`git add "${normalizedFile}"`, { cwd: PROJECT_ROOT });
                    logger.debug(`✅ Remoção do arquivo registrada: ${normalizedFile}`);
                    filesActuallyDeleted++;
                } catch (addError) {
                    logger.error(`❌ Não foi possível processar remoção de: ${normalizedFile}`, addError);
                }
            }
        }
        
        logger.debug(`📊 Resumo do processamento: ${filesActuallyStaged} arquivos modificados staged, ${filesActuallyDeleted} arquivos excluídos processados`);
        
        // Verificar se há algo no stage antes de tentar commit
        logger.debug('🔍 Verificando status do Git antes do commit...');
        const { stdout: statusOutput } = await execAsync('git status --porcelain', { cwd: PROJECT_ROOT });
        logger.debug('📋 Status do Git:', statusOutput);
        
        // Verificar se há arquivos no stage
        const { stdout: stagedOutput } = await execAsync('git diff --cached --name-only', { cwd: PROJECT_ROOT });
        const stagedFiles = stagedOutput.trim().split('\n').filter(f => f.length > 0);
        logger.debug('📝 Arquivos no stage:', stagedFiles);
        
        if (stagedFiles.length === 0) {
            logger.error('❌ Nenhum arquivo no stage para commit');
            
            // Dar uma mensagem mais específica baseada no que foi processado
            let errorMessage = 'Nenhuma alteração encontrada para commit.';
            
            if (filesActuallyStaged === 0 && filesActuallyDeleted === 0) {
                errorMessage += ' Os arquivos selecionados não possuem mudanças reais ou já foram commitados anteriormente.';
            } else if (filesActuallyStaged === 0) {
                errorMessage += ' Os arquivos modificados selecionados não possuem mudanças reais.';
            } else if (filesActuallyDeleted === 0) {
                errorMessage += ' Os arquivos excluídos selecionados já foram removidos anteriormente.';
            }
            
            return res.status(400).json({
                success: false,
                error: errorMessage
            });
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
            // Push para a branch configurada (ou atual se não especificada)
            const targetBranch = process.env.GIT_TARGET_BRANCH || 'HEAD';
            const { stdout: pushOutput } = await execAsync(`git push origin ${targetBranch}`, { cwd: PROJECT_ROOT });
            pushResult = pushOutput;
        } catch (pushError) {
            logger.warn('Aviso: Não foi possível fazer push automático:', pushError instanceof Error ? pushError.message : 'Erro desconhecido');
            // Não falhar o commit por causa do push
        }
        
        // Rastrear modificação dos arquivos pelo usuário
        for (const file of modifiedFiles) {
            trackUserModification(userId, file);
        }
        
        return res.json({
            success: true,
            message: 'Commit realizado com sucesso',
            commitHash,
            commitMessage,
            filesCommitted: modifiedFiles,
            filesDeleted: filesToDelete,
            pushResult
        });
        
    } catch (error) {
        logger.error('Erro ao fazer commit:', error);
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
        logger.error('Erro ao obter log do Git:', error);
        return res.json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            commits: []
        });
    }
});

/**
 * Endpoint para fornecer configurações do cliente
 */
router.get('/config', async (req, res) => {
    try {
        // Calcular caminho relativo do diretório markdown
        const markdownRelativePath = path.relative(PROJECT_ROOT, config.markdownDir);
        
        return res.json({
            success: true,
            config: {
                markdownPath: markdownRelativePath
            }
        });
    } catch (error) {
        logger.error('Erro ao obter configurações:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

export default router;
