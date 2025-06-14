/**
 * Manati Editor - Aplicação Principal Modular
 * Editor de Markdown com preview em tempo real
 */

import { FileManager } from './modules/fileManager.js';
import { ThemeManager } from './modules/themeManager.js';
import { PreviewManager } from './modules/previewManager.js';
import { UIManager } from './modules/uiManager.js';
import { EditorManager } from './modules/editorManager.js';
import { AuthManager } from './modules/authManager.js';
import { FileLockManager } from './modules/fileLockManager.js';
import { GitManager } from './modules/gitManager.js';

class ManatiEditor {
    constructor() {
        this.currentFile = null;
        this.hasUnsavedChanges = false;
        this.activeEditor = 'preview'; // 'markdown', 'visual', 'preview'
        
        // Usar logger global (já inicializado via script tag)
        this.logger = window.logger;
        
        // Definir a instância globalmente antes de inicializar módulos
        window.manatiEditor = this;
        
        // Inicializar módulos
        this.authManager = new AuthManager();
        this.auth = this.authManager; // Alias para compatibilidade
        this.fileManager = new FileManager();
        this.themeManager = new ThemeManager();
        this.preview = new PreviewManager();
        this.ui = new UIManager();
        this.editorManager = new EditorManager();
        this.fileLock = new FileLockManager();
        this.git = new GitManager();
        
        this.init();
    }

    async init() {
        // Inicializar autenticação primeiro
        try {
            await this.authManager.init();
        } catch (error) {
            this.logger.error('❌ Erro ao inicializar autenticação:', error);
            return; // Parar inicialização se autenticação falhar
        }

        // Inicializar o editor visual se ainda não foi inicializado
        if (typeof VisualEditor !== 'undefined') {
            // Verificar se window.visualEditor é uma instância válida
            const isValidInstance = window.visualEditor && 
                                  typeof window.visualEditor.show === 'function' && 
                                  typeof window.visualEditor.hide === 'function' && 
                                  typeof window.visualEditor.getMarkdownContent === 'function';
            
            if (!isValidInstance) {
                try {
                    window.visualEditor = new VisualEditor();
                    this.logger.debug('✅ VisualEditor inicializado com sucesso!');
                } catch (error) {
                    this.logger.error('❌ Erro ao inicializar VisualEditor:', error);
                }
            }
        } else {
            this.logger.warn('⚠️ VisualEditor não disponível');
        }
        
        this.bindEvents();
        this.editorManager.setupKeyboardShortcuts();
        this.fileManager.loadFileTree();
        this.ui.disableEditorTabs(); // Iniciar com abas desabilitadas
        
        // Inicializar sistema de travamento de arquivos
        this.fileLock.init();
        
        // Inicializar sistema de Git
        this.git.init();
    }

    bindEvents() {
        // Botões principais
        document.getElementById('saveBtn').addEventListener('click', () => this.fileManager.saveFile());
        document.getElementById('newFileBtn').addEventListener('click', () => this.showNewFileModal());
        document.getElementById('newFolderBtn').addEventListener('click', () => this.showNewFolderModal());
        document.getElementById('themeToggle').addEventListener('click', () => this.themeManager.toggleTheme());
        
        // Botões de documento
        document.getElementById('closeDocumentBtn').addEventListener('click', () => this.closeCurrentDocument());

        // Modais
        document.getElementById('createFileBtn').addEventListener('click', () => this.createNewFile());
        document.getElementById('createFolderBtn').addEventListener('click', () => this.createNewFolder());
        document.getElementById('confirmMoveBtn').addEventListener('click', () => this.fileManager.confirmMove());

        // Editor de markdown
        const editor = document.getElementById('markdownEditor');
        editor.addEventListener('input', () => this.editorManager.onEditorChange());

        // Eventos das abas
        document.querySelector('[data-bs-target="#visual-tab"]').addEventListener('click', () => {
            this.editorManager.switchToVisualEditor();
        });

        document.querySelector('[data-bs-target="#editor-tab"]').addEventListener('click', () => {
            this.editorManager.switchToMarkdownEditor();
        });

        document.querySelector('[data-bs-target="#preview-tab"]').addEventListener('click', () => {
            this.editorManager.switchToPreviewEditor();
        });
    }

    // Métodos para modais e criação de arquivos/pastas
    showNewFileModal() {
        document.getElementById('newFileName').value = '';
        this.ui.showModal('newFileModal');
    }

    showNewFolderModal() {
        document.getElementById('newFolderName').value = '';
        this.ui.showModal('newFolderModal');
    }

    createNewFile() {
        const fileName = document.getElementById('newFileName').value.trim();
        if (!fileName) return;

        this.fileManager.createNewFile(fileName);
        this.ui.hideModal('newFileModal');
        
        // Se estiver no modo visual, mudar para ele após carregar
        if (this.activeEditor === 'visual') {
            setTimeout(() => this.editorManager.switchToVisualEditor(), 100);
        }
    }

    createNewFolder() {
        const folderName = document.getElementById('newFolderName').value.trim();
        if (!folderName) return;

        this.fileManager.createNewFolder(folderName);
        this.ui.hideModal('newFolderModal');
    }

    // 🎭 FUNÇÃO TEMPORÁRIA PARA DEMONSTRAÇÃO
    // Método de conveniência para carregar arquivo (chamado pelos módulos)
    loadFile(filePath) {
        this.fileManager.loadFile(filePath);
    }

    // Fechar documento atual e voltar para o estado sem documento selecionado
    async closeCurrentDocument() {
        this.logger.debug('🗂️ Fechando documento atual...');
        
        // Liberar lock do arquivo atual se existir
        if (this.currentFile && this.fileLock) {
            this.logger.debug('🔓 Liberando lock do arquivo:', this.currentFile);
            await this.fileLock.releaseLock(this.currentFile);
        }
        
        // Limpar estado do documento atual
        this.currentFile = null;
        
        // Limpar editores
        this.fileManager.clearAllEditors();
        
        // Ocultar controles do documento
        this.ui.hideDocumentControls();
        
        // Esconder informações do arquivo
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.style.display = 'none';
        }
        
        // Voltar para a aba de Preview
        const previewTab = document.querySelector('[data-bs-target="#preview-tab"]');
        if (previewTab) {
            previewTab.click();
        }
        
        this.logger.debug('✅ Documento fechado com sucesso');
        //this.ui.showToast('Documento fechado', 'info');
    }
}

// Exportar a classe para uso modular
export default ManatiEditor;
