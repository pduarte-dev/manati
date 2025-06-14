/**
 * Módulo para gerenciamento do preview de markdown
 */
export class PreviewManager {
    constructor() {
        this.container = document.getElementById('previewContainer');
    }

    async updatePreview() {
        try {
            let markdown;
            if (window.manatiEditor.activeEditor === 'visual' && window.visualEditor) {
                markdown = window.visualEditor.getMarkdownContent();
            } else {
                markdown = document.getElementById('markdownEditor').value;
            }
            
            if (!markdown?.trim()) {
                this.showEmptyState();
                return;
            }

            // Usar marked.js se disponível
            if (typeof marked !== 'undefined') {
                const html = marked.parse(markdown, {
                    breaks: true,
                    gfm: true,
                    mangle: false,
                    headerIds: false
                });
                this.container.innerHTML = html;
            } else {
                // Fallback simples para conversão markdown
                const html = this.simpleMarkdownToHtml(markdown);
                this.container.innerHTML = html;
            }
        } catch (error) {
            window.logger.error('Erro ao atualizar preview:', error);
            this.container.innerHTML = `
                <div class="alert alert-danger">
                    <h5>Erro no Preview</h5>
                    <p>Não foi possível processar o markdown. Verifique a sintaxe.</p>
                </div>
            `;
        }
    }

    showEmptyState() {
        this.container.innerHTML = `
            <div class="text-muted text-center">
                <i class="bi bi-eye-slash" style="font-size: 3rem;"></i>
                <p class="mt-3">Preview aparecerá aqui quando você começar a editar</p>
            </div>
        `;
    }

    simpleMarkdownToHtml(markdown) {
        // Conversão simples de markdown para HTML como fallback
        return markdown
            // Títulos
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            
            // Formatação inline
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            
            // Imagens
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%;">')
            
            // Quebras de linha
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            
            // Envolver em parágrafos
            .replace(/^(.+)$/, '<p>$1</p>');
    }

    clear() {
        this.showEmptyState();
    }
}
