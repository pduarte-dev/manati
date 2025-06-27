/**
 * Visual Editor - Editor WYSIWYG para Markdown
 * Sistema modular refatorado para melhor manutenção
 */

// Importar e inicializar o editor visual modular
import { VisualEditorCore } from './modules/visualEditor/VisualEditorCore.js';

/**
 * Classe de compatibilidade com a interface antiga
 */
class VisualEditor {
    constructor() {
        this.core = null;
        this.isInitialized = false;
        this.pendingActions = [];
        this.init();
    }

    async init() {
        try {
            this.core = new VisualEditorCore();
            await this.core.init();
            this.isInitialized = true;
            
            // Processar ações pendentes
            this.processPendingActions();
            
            console.log('Visual Editor inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar Visual Editor:', error);
        }
    }
    
    processPendingActions() {
        if (this.pendingActions.length > 0) {
            console.log(`Processando ${this.pendingActions.length} ações pendentes do Visual Editor`);
            
            for (const action of this.pendingActions) {
                if (action.type === 'show') {
                    this.show(action.content, action.fileName);
                } else if (action.type === 'hide') {
                    this.hide();
                } else if (action.type === 'clear') {
                    this.clear();
                }
            }
            
            // Limpar ações pendentes
            this.pendingActions = [];
        }
    }

    // Métodos de compatibilidade com a interface antiga
    show(content = '', fileName = '') {
        if (!this.isInitialized) {
            console.log('Visual Editor ainda não inicializado. Adicionando show à fila.');
            this.pendingActions.push({
                type: 'show',
                content,
                fileName
            });
            return;
        }
        
        if (this.core) {
            this.core.show(content, fileName);
        }
    }

    hide() {
        if (!this.isInitialized) {
            console.log('Visual Editor ainda não inicializado. Adicionando hide à fila.');
            this.pendingActions.push({
                type: 'hide'
            });
            return;
        }
        
        if (this.core) {
            this.core.hide();
        }
    }

    getMarkdownContent() {
        if (!this.isInitialized) {
            console.log('Visual Editor ainda não inicializado ao tentar obter conteúdo.');
            return '';
        }
        
        return this.core ? this.core.getMarkdownContent() : '';
    }

    clear() {
        if (!this.isInitialized) {
            console.log('Visual Editor ainda não inicializado. Adicionando clear à fila.');
            this.pendingActions.push({
                type: 'clear'
            });
            return;
        }
        
        if (this.core) {
            this.core.clear();
        }
    }

    showToast(message, type = 'info') {
        if (this.core) {
            this.core.showToast(message, type);
        }
    }

    // Getters para acessar propriedades do core
    get isActive() {
        return this.core ? this.core.isActive : false;
    }

    get editor() {
        return this.core ? this.core.editor : null;
    }

    get formatter() {
        return this.core ? this.core.formatter : null;
    }

    get converter() {
        return this.core ? this.core.converter : null;
    }

    get uploader() {
        return this.core ? this.core.uploader : null;
    }

    get history() {
        return this.core ? this.core.history : null;
    }
}

// Tornar VisualEditor disponível globalmente para compatibilidade
window.VisualEditor = VisualEditor;

// Criar instância global se não existir
if (!window.visualEditor) {
    window.visualEditor = new VisualEditor();
}

export { VisualEditor };
