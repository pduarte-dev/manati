/**
 * EditorToolbar - Gerencia a barra de ferramentas do editor visual
 */
class EditorToolbar {
    constructor(editor) {
        this.editor = editor;
        this.toolbar = document.getElementById('visualToolbar');
        this.editorElement = editor.editor;
        
        if (!this.toolbar) {
            console.error('Toolbar não encontrada');
            return;
        }
        
        this.bindEvents();
    }

    bindEvents() {
        // Event listener principal para todos os botões da toolbar
        this.toolbar.addEventListener('click', (e) => {
            e.preventDefault();
            
            const button = e.target.closest('[data-command]');
            if (button) {
                const command = button.dataset.command;
                this.executeCommand(command);
            }
        });

        // Event listeners específicos para botões do HTML existente
        const insertImageBtn = document.getElementById('insertImageBtn');
        const insertLinkBtn = document.getElementById('insertLinkBtn');
        const insertFileBtn = document.getElementById('insertFileBtn');

        if (insertImageBtn) {
            insertImageBtn.addEventListener('click', () => this.showImageUpload());
        }

        if (insertLinkBtn) {
            insertLinkBtn.addEventListener('click', () => this.showLinkModal());
        }

        if (insertFileBtn) {
            insertFileBtn.addEventListener('click', () => this.showFileUpload());
        }
    }

    executeCommand(command) {
        // Focar no editor antes de executar comando
        this.editorElement.focus();
        
        const formatter = this.editor.formatter;
        
        switch (command) {
            // Formatação inline
            case 'bold':
                formatter.toggleBold();
                break;
            case 'italic':
                formatter.toggleItalic();
                break;
            case 'underline':
                formatter.toggleUnderline();
                break;
            case 'strikethrough':
                formatter.toggleStrikethrough();
                break;
            case 'code':
                formatter.toggleInlineCode();
                break;

            // Cabeçalhos e parágrafos
            case 'p':
                // Remover formatação de cabeçalho
                formatter.insertText('\n');
                break;
            case 'h1':
                formatter.setHeading(1);
                break;
            case 'h2':
                formatter.setHeading(2);
                break;
            case 'h3':
                formatter.setHeading(3);
                break;
            case 'h4':
                formatter.setHeading(4);
                break;
            case 'h5':
                formatter.setHeading(5);
                break;
            case 'h6':
                formatter.setHeading(6);
                break;

            // Listas
            case 'insertUnorderedList':
                formatter.toggleUnorderedList();
                break;
            case 'insertOrderedList':
                formatter.toggleOrderedList();
                break;
            case 'todo':
                formatter.toggleTodoList();
                break;
            case 'blockquote':
                formatter.toggleBlockquote();
                break;

            // Inserções
            case 'hr':
                formatter.insertHorizontalRule();
                break;
            case 'codeblock':
                formatter.insertCodeBlock();
                break;
            case 'table':
                this.insertTable();
                break;

            // Histórico
            case 'undo':
                this.editor.history.undo();
                break;
            case 'redo':
                this.editor.history.redo();
                break;
        }
    }

    // Método para inserir uma tabela simples
    insertTable() {
        const formatter = this.editor.formatter;
        
        // Usar o novo método de tabela
        formatter.insertTable(2, 3);
    }

    // Método para mostrar a janela de upload de imagem
    showImageUpload() {
        const imageUpload = document.getElementById('imageUpload');
        if (imageUpload) {
            imageUpload.click();
        }
    }

    // Método para mostrar a janela de upload de arquivo
    showFileUpload() {
        const fileUpload = document.getElementById('fileUpload');
        if (fileUpload) {
            fileUpload.click();
        }
    }

    // Método para mostrar o modal de inserção de link
    showLinkModal() {
        const url = prompt('Digite a URL do link:');
        const text = window.getSelection().toString() || prompt('Digite o texto do link:');
        
        if (url && text) {
            // Usar o novo método de inserção de link
            this.editor.formatter.insertLink(text, url);
        }
    }
    
    // Processar a imagem após o upload
    processUploadedImage(file) {
        // Esta função seria chamada após o upload da imagem para o servidor
        // e receber a URL da imagem carregada
        
        if (!file || !file.url) return;
        
        const altText = prompt('Digite uma descrição para a imagem:') || 'Imagem';
        
        // Usar o novo método de inserção de imagem
        this.editor.formatter.insertImage(altText, file.url);
    }

    // Atualiza o estado visual dos botões com base no formato atual
    updateState() {
        // Método simplificado - pode ser expandido conforme necessário
    }
}

export { EditorToolbar };
