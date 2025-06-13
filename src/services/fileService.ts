/**
 * Serviço para operações com arquivos
 */
import fs from 'fs/promises';
import path from 'path';
import config from '../config/environment.js';
import logger from '../utils/logger.js';

export class FileService {
    private markdownDir: string;

    constructor() {
        this.markdownDir = config.markdownDir;
    }

    async ensureDirectoryExists(dir: string): Promise<void> {
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async getFiles(relativePath: string = ''): Promise<any[]> {
        const fullPath = path.join(this.markdownDir, relativePath);
        logger.debug(`Listando arquivos em: ${fullPath}`);
        
        try {
            await this.ensureDirectoryExists(fullPath);
            const items = await fs.readdir(fullPath, { withFileTypes: true });
            
            const filteredItems = items.filter(item => {
                // Mostrar apenas pastas e arquivos .md
                return item.isDirectory() || 
                       (item.isFile() && path.extname(item.name).toLowerCase() === '.md');
            });
            
            const results = [];
            for (const item of filteredItems) {
                const itemData = {
                    name: item.name,
                    path: relativePath ? `${relativePath}/${item.name}` : item.name,
                    isDirectory: item.isDirectory(),
                    extension: item.isFile() ? path.extname(item.name) : null,
                    title: null as string | null
                };
                
                if (item.isFile()) {
                    itemData.title = await this.extractTitle(path.join(fullPath, item.name));
                }
                
                results.push(itemData);
            }
            
            return results.sort((a, b) => {
                // Pastas primeiro, depois arquivos
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });
        } catch (error) {
            console.error('Erro ao listar arquivos:', error);
            throw new Error('Erro ao acessar diretório');
        }
    }

    async readFile(relativePath: string): Promise<string> {
        const fullPath = path.join(this.markdownDir, relativePath);
        
        // Verificar se o arquivo está dentro do diretório permitido
        if (!fullPath.startsWith(this.markdownDir)) {
            throw new Error('Acesso negado ao arquivo');
        }

        try {
            const content = await fs.readFile(fullPath, 'utf-8');
            return content;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new Error('Arquivo não encontrado');
            }
            throw new Error('Erro ao ler arquivo');
        }
    }

    async writeFile(relativePath: string, content: string): Promise<void> {
        const fullPath = path.join(this.markdownDir, relativePath);
        
        // Verificar se o arquivo está dentro do diretório permitido
        if (!fullPath.startsWith(this.markdownDir)) {
            throw new Error('Acesso negado ao arquivo');
        }

        try {
            // Garantir que o diretório pai existe
            const dirPath = path.dirname(fullPath);
            await this.ensureDirectoryExists(dirPath);
            
            await fs.writeFile(fullPath, content, 'utf-8');
        } catch (error) {
            throw new Error('Erro ao salvar arquivo');
        }
    }

    async deleteFile(relativePath: string): Promise<void> {
        const fullPath = path.join(this.markdownDir, relativePath);
        
        // Verificar se o arquivo está dentro do diretório permitido
        if (!fullPath.startsWith(this.markdownDir)) {
            throw new Error('Acesso negado ao arquivo');
        }

        try {
            await fs.unlink(fullPath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new Error('Arquivo não encontrado');
            }
            throw new Error('Erro ao excluir arquivo');
        }
    }

    async createDirectory(relativePath: string): Promise<void> {
        const fullPath = path.join(this.markdownDir, relativePath);
        
        // Verificar se o caminho está dentro do diretório permitido
        if (!fullPath.startsWith(this.markdownDir)) {
            throw new Error('Acesso negado ao diretório');
        }

        try {
            await this.ensureDirectoryExists(fullPath);
        } catch (error) {
            throw new Error('Erro ao criar pasta');
        }
    }

    async deleteDirectory(relativePath: string): Promise<void> {
        const fullPath = path.join(this.markdownDir, relativePath);
        
        // Verificar se o caminho está dentro do diretório permitido
        if (!fullPath.startsWith(this.markdownDir)) {
            throw new Error('Acesso negado ao diretório');
        }

        try {
            // Verificar se a pasta existe
            const stats = await fs.stat(fullPath);
            if (!stats.isDirectory()) {
                throw new Error('Caminho não é uma pasta');
            }

            // Excluir pasta recursivamente
            await fs.rm(fullPath, { recursive: true, force: true });
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new Error('Pasta não encontrada');
            }
            throw new Error('Erro ao excluir pasta');
        }
    }

    async fileExists(relativePath: string): Promise<boolean> {
        const fullPath = path.join(this.markdownDir, relativePath);
        
        try {
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    getFullPath(relativePath: string): string {
        return path.join(this.markdownDir, relativePath);
    }

    async renameFile(oldRelativePath: string, newName: string): Promise<void> {
        const oldFullPath = path.join(this.markdownDir, oldRelativePath);
        const directory = path.dirname(oldFullPath);
        const newFullPath = path.join(directory, newName);
        
        // Verificar se os caminhos estão dentro do diretório permitido
        if (!oldFullPath.startsWith(this.markdownDir) || !newFullPath.startsWith(this.markdownDir)) {
            throw new Error('Acesso negado ao diretório');
        }

        try {
            // Verificar se o arquivo original existe
            const stats = await fs.stat(oldFullPath);
            if (!stats.isFile()) {
                throw new Error('Caminho não é um arquivo');
            }

            // Verificar se o novo nome já existe
            const newExists = await this.fileExists(path.relative(this.markdownDir, newFullPath));
            if (newExists) {
                throw new Error('Já existe um arquivo com este nome');
            }

            // Validar o novo nome
            if (!newName.trim() || newName.includes('/') || newName.includes('\\')) {
                throw new Error('Nome de arquivo inválido');
            }

            // Renomear arquivo
            await fs.rename(oldFullPath, newFullPath);
            logger.info(`Arquivo renomeado: ${oldRelativePath} -> ${path.relative(this.markdownDir, newFullPath)}`);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new Error('Arquivo não encontrado');
            }
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao renomear arquivo');
        }
    }

    async renameDirectory(oldRelativePath: string, newName: string): Promise<void> {
        const oldFullPath = path.join(this.markdownDir, oldRelativePath);
        const parentDirectory = path.dirname(oldFullPath);
        const newFullPath = path.join(parentDirectory, newName);
        
        // Verificar se os caminhos estão dentro do diretório permitido
        if (!oldFullPath.startsWith(this.markdownDir) || !newFullPath.startsWith(this.markdownDir)) {
            throw new Error('Acesso negado ao diretório');
        }

        try {
            // Verificar se a pasta original existe
            const stats = await fs.stat(oldFullPath);
            if (!stats.isDirectory()) {
                throw new Error('Caminho não é uma pasta');
            }

            // Verificar se o novo nome já existe
            const newExists = await this.fileExists(path.relative(this.markdownDir, newFullPath));
            if (newExists) {
                throw new Error('Já existe uma pasta com este nome');
            }

            // Validar o novo nome
            if (!newName.trim() || newName.includes('/') || newName.includes('\\')) {
                throw new Error('Nome de pasta inválido');
            }

            // Renomear pasta
            await fs.rename(oldFullPath, newFullPath);
            logger.info(`Pasta renomeada: ${oldRelativePath} -> ${path.relative(this.markdownDir, newFullPath)}`);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new Error('Pasta não encontrada');
            }
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao renomear pasta');
        }
    }

    async moveFile(oldRelativePath: string, newRelativePath: string): Promise<void> {
        const oldFullPath = path.join(this.markdownDir, oldRelativePath);
        const newFullPath = path.join(this.markdownDir, newRelativePath);
        
        // Verificar se os caminhos estão dentro do diretório permitido
        if (!oldFullPath.startsWith(this.markdownDir) || !newFullPath.startsWith(this.markdownDir)) {
            throw new Error('Acesso negado ao diretório');
        }

        try {
            // Verificar se o arquivo original existe
            const stats = await fs.stat(oldFullPath);
            if (!stats.isFile()) {
                throw new Error('Caminho não é um arquivo');
            }

            // Criar diretório de destino se não existir
            const newDir = path.dirname(newFullPath);
            await this.ensureDirectoryExists(newDir);

            // Verificar se o arquivo de destino já existe
            const newExists = await this.fileExists(newRelativePath);
            if (newExists) {
                throw new Error('Já existe um arquivo no destino');
            }

            // Mover arquivo
            await fs.rename(oldFullPath, newFullPath);
            logger.info(`Arquivo movido: ${oldRelativePath} -> ${newRelativePath}`);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new Error('Arquivo não encontrado');
            }
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao mover arquivo');
        }
    }

    async moveDirectory(oldRelativePath: string, newRelativePath: string): Promise<void> {
        const oldFullPath = path.join(this.markdownDir, oldRelativePath);
        const newFullPath = path.join(this.markdownDir, newRelativePath);
        
        // Verificar se os caminhos estão dentro do diretório permitido
        if (!oldFullPath.startsWith(this.markdownDir) || !newFullPath.startsWith(this.markdownDir)) {
            throw new Error('Acesso negado ao diretório');
        }

        try {
            // Verificar se a pasta original existe
            const stats = await fs.stat(oldFullPath);
            if (!stats.isDirectory()) {
                throw new Error('Caminho não é uma pasta');
            }

            // Criar diretório pai de destino se não existir
            const newParentDir = path.dirname(newFullPath);
            await this.ensureDirectoryExists(newParentDir);

            // Verificar se a pasta de destino já existe
            const newExists = await this.fileExists(newRelativePath);
            if (newExists) {
                throw new Error('Já existe uma pasta no destino');
            }

            // Mover pasta
            await fs.rename(oldFullPath, newFullPath);
            logger.info(`Pasta movida: ${oldRelativePath} -> ${newRelativePath}`);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new Error('Pasta não encontrada');
            }
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao mover pasta');
        }
    }

    async searchFiles(query: string): Promise<any[]> {
        const sanitizedQuery = this.sanitizeSearchQuery(query);
        if (!sanitizedQuery) return [];

        try {
            const results: any[] = [];
            await this.searchInDirectory('', sanitizedQuery, results);
            
            // Ordenar por relevância (título primeiro, depois nome)
            return results.sort((a, b) => {
                const aTitle = a.title?.toLowerCase() || '';
                const bTitle = b.title?.toLowerCase() || '';
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                const queryLower = sanitizedQuery.toLowerCase();
                
                // Títulos têm prioridade
                const aTitleMatch = aTitle.includes(queryLower);
                const bTitleMatch = bTitle.includes(queryLower);
                
                if (aTitleMatch && !bTitleMatch) return -1;
                if (!aTitleMatch && bTitleMatch) return 1;
                
                // Se ambos ou nenhum tem match no título, comparar nomes
                return aName.localeCompare(bName);
            });
        } catch (error) {
            logger.error('Erro na busca de arquivos:', error);
            return [];
        }
    }

    private async searchInDirectory(relativePath: string, query: string, results: any[]): Promise<void> {
        const fullPath = path.join(this.markdownDir, relativePath);
        
        try {
            const items = await fs.readdir(fullPath, { withFileTypes: true });
            
            for (const item of items) {
                const itemPath = relativePath ? `${relativePath}/${item.name}` : item.name;
                
                if (item.isDirectory()) {
                    // Buscar recursivamente em subdiretórios
                    await this.searchInDirectory(itemPath, query, results);
                } else if (item.isFile() && path.extname(item.name).toLowerCase() === '.md') {
                    // Verificar se arquivo markdown corresponde à busca
                    const title = await this.extractTitle(path.join(fullPath, item.name));
                    const matchesTitle = title?.toLowerCase().includes(query.toLowerCase());
                    const matchesName = item.name.toLowerCase().includes(query.toLowerCase());
                    
                    if (matchesTitle || matchesName) {
                        results.push({
                            name: item.name,
                            path: itemPath,
                            isDirectory: false,
                            title: title,
                            extension: path.extname(item.name)
                        });
                    }
                }
            }
        } catch (error) {
            logger.error(`Erro ao buscar em ${fullPath}:`, error);
        }
    }

    private sanitizeSearchQuery(query: string): string {
        if (typeof query !== 'string') return '';
        
        return query
            .replace(/[<>\"'&]/g, '') // Remove caracteres HTML perigosos
            .replace(/[\/\\]/g, '') // Remove barras
            .trim()
            .substring(0, 100); // Limitar tamanho
    }

    private async extractTitle(filePath: string): Promise<string | null> {
        try {
            // Ler apenas as primeiras linhas do arquivo para encontrar o título
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n').slice(0, 10); // Apenas primeiras 10 linhas
            
            // Procurar por cabeçalho H1 (# Título)
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('# ') && trimmed.length > 2) {
                    return trimmed.substring(2).trim();
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }
}
