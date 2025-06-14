/**
 * Módulo para gerenciamento dos editores (Markdown e Visual)
 */
export class EditorManager {
    constructor() {
        this.debounceTimer = null;
    }

    switchToVisualEditor() {
        if (window.manatiEditor.activeEditor === 'visual') return;
        
        const markdownContent = document.getElementById('markdownEditor').value;
        
        // Verificar se o visual editor está disponível e tem o método show
        if (window.visualEditor && typeof window.visualEditor.show === 'function') {
            window.visualEditor.show(markdownContent, window.manatiEditor.currentFile);
        } else {
            window.logger.warn('Visual editor não disponível ou método show não encontrado');
            // Não tentar inicializar aqui - deve ser feito no app-modular.js
        }
        
        window.manatiEditor.activeEditor = 'visual';
    }

    switchToMarkdownEditor() {
        if (window.manatiEditor.activeEditor === 'markdown') return;
        
        // Sincronizar conteúdo do editor visual para markdown
        if (window.manatiEditor.activeEditor === 'visual' && window.visualEditor) {
            const markdownContent = window.visualEditor.getMarkdownContent();
            document.getElementById('markdownEditor').value = markdownContent;
        }
        
        window.manatiEditor.activeEditor = 'markdown';
    }

    switchToPreviewEditor() {
        window.manatiEditor.preview.updatePreview();
        window.manatiEditor.activeEditor = 'preview';
    }

    onEditorChange() {
        window.manatiEditor.hasUnsavedChanges = true;
        window.manatiEditor.ui.updateSaveButton();

        // Debounce para atualizar preview
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            if (window.manatiEditor.activeEditor === 'preview') {
                window.manatiEditor.preview.updatePreview();
            }
        }, 500);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                window.manatiEditor.fileManager.saveFile();
            }
            
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                window.manatiEditor.ui.showModal('newFileModal');
            }
            
            if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                window.manatiEditor.ui.showModal('newFolderModal');
            }
        });
    }

    clearEditor() {
        document.getElementById('markdownEditor').value = '';
        document.getElementById('markdownEditor').disabled = true;
        document.getElementById('fileInfo').style.display = 'none';
        
        if (window.visualEditor) {
            window.visualEditor.hide();
        }
        
        window.manatiEditor.preview.clear();
        window.manatiEditor.ui.disableEditorTabs();
        
        window.manatiEditor.currentFile = null;
        window.manatiEditor.hasUnsavedChanges = false;
        window.manatiEditor.ui.updateSaveButton();
    }
}
