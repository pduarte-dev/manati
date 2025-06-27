/**
 * VisualEditorCore - Classe principal do editor WYSIWYG para Markdown
 * Renderiza formatação ao vivo sem mostrar sintaxe Markdown crua
 */
class VisualEditorCore {
    constructor() {
        this.editor = document.getElementById('visualEditor');
        this.toolbarElement = document.getElementById('visualToolbar');
        this.placeholder = document.getElementById('visualEditorPlaceholder');
        this.fileInfo = document.getElementById('visualFileInfo');
        this.fileName = document.getElementById('visualCurrentFileName');
        this.isActive = false;
        
        // Módulos especializados
        this.formatter = null;
        this.converter = null;
        this.toolbarManager = null;
        this.uploader = null;
        this.history = null;
        
        // Estado interno
        this.currentMarkdown = '';
        this.isInitialized = false;
        this.pendingActions = [];
        
        this.init();
    }

    async init() {
        try {
            // Aguardar carregamento dos módulos
            await this.loadModules();
            
            // Configurar editor como contentEditable
            this.setupEditor();
            
            // Configurar eventos básicos
            this.bindCoreEvents();
            
            // Marcar como inicializado
            this.isInitialized = true;
            
            // Processar ações pendentes
            this.processPendingActions();
            
            console.log('Visual Editor Core inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar Visual Editor Core:', error);
        }
    }
    
    processPendingActions() {
        if (this.pendingActions.length > 0) {
            console.log(`Processando ${this.pendingActions.length} ações pendentes`);
            
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

    async loadModules() {
        // Carregar módulos especializados
        const [
            { MarkdownFormatter },
            { MarkdownConverter }, 
            { EditorToolbar },
            { FileUploader },
            { EditorHistory }
        ] = await Promise.all([
            import('./MarkdownFormatter.js'),
            import('./MarkdownConverter.js'),
            import('./EditorToolbar.js'),
            import('./FileUploader.js'),
            import('./EditorHistory.js')
        ]);

        this.formatter = new MarkdownFormatter(this);
        this.converter = new MarkdownConverter(this);
        this.toolbarManager = new EditorToolbar(this);
        this.uploader = new FileUploader(this);
        this.history = new EditorHistory(this);
    }

    setupEditor() {
        // Configurar editor para WYSIWYG
        this.editor.contentEditable = true;
        this.editor.spellcheck = true;  // Ativar verificação ortográfica
        
        // Estilo básico do editor
        this.editor.style.outline = 'none';
        this.editor.style.minHeight = '400px';
        this.editor.style.padding = '20px';
        this.editor.style.lineHeight = '1.6';
        this.editor.style.fontSize = '16px';
        
        // Adicionar coletor de erros para debug
        window.addEventListener('error', (event) => {
            console.error('Erro capturado pelo VisualEditor:', event.error);
            if (event.error && event.error.stack) {
                console.error('Stack trace:', event.error.stack);
            }
        });
        
        // Injetar estilos para visualização WYSIWYG
        this.injectWysiwygStyles();
    }

    injectWysiwygStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #visualEditor {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: var(--bs-body-color);
                background-color: var(--bs-body-bg);
                padding: 20px;
                border-radius: 4px;
                min-height: 400px;
                line-height: 1.6;
            }
            
            #visualEditor:focus {
                outline: none;
            }
            
            #visualEditor h1, #visualEditor h2, #visualEditor h3, 
            #visualEditor h4, #visualEditor h5, #visualEditor h6 {
                font-weight: bold;
                margin: 20px 0 10px 0;
                line-height: 1.2;
                color: var(--bs-heading-color, inherit);
            }
            #visualEditor h1 { font-size: 2em; border-bottom: 2px solid var(--bs-border-color); padding-bottom: 10px; }
            #visualEditor h2 { font-size: 1.5em; border-bottom: 1px solid var(--bs-border-color); padding-bottom: 8px; }
            #visualEditor h3 { font-size: 1.25em; }
            #visualEditor h4 { font-size: 1.1em; }
            #visualEditor h5 { font-size: 1em; }
            #visualEditor h6 { font-size: 0.9em; color: var(--bs-secondary-color); }

            #visualEditor blockquote {
                border-left: 4px solid var(--bs-border-color);
                padding: 0 16px;
                margin: 16px 0;
                color: var(--bs-secondary-color);
            }

            #visualEditor code {
                font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
                background-color: var(--bs-tertiary-bg);
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 0.9em;
            }

            #visualEditor pre {
                background-color: var(--bs-tertiary-bg);
                padding: 16px;
                border-radius: 6px;
                overflow: auto;
                margin: 16px 0;
            }

            #visualEditor pre code {
                background-color: transparent;
                padding: 0;
                border-radius: 0;
                font-size: 0.9em;
                display: block;
                overflow-x: auto;
            }

            #visualEditor ul, #visualEditor ol {
                padding-left: 2em;
                margin: 8px 0;
            }

            #visualEditor li {
                margin: 4px 0;
            }

            #visualEditor .task-list-item {
                list-style: none;
                margin-left: -20px;
                display: flex;
                align-items: center;
            }

            #visualEditor .task-list-item input[type="checkbox"] {
                margin-right: 8px;
            }

            #visualEditor a {
                color: var(--bs-link-color);
                text-decoration: none;
            }

            #visualEditor a:hover {
                text-decoration: underline;
            }

            #visualEditor img {
                max-width: 100%;
                height: auto;
                margin: 16px 0;
                border-radius: 6px;
            }

            #visualEditor hr {
                border: none;
                border-top: 2px solid var(--bs-border-color);
                margin: 24px 0;
            }

            #visualEditor strong {
                font-weight: bold;
            }

            #visualEditor em {
                font-style: italic;
            }

            #visualEditor del {
                text-decoration: line-through;
            }
            
            #visualEditor table {
                border-collapse: collapse;
                width: 100%;
                margin: 16px 0;
            }
            
            #visualEditor th, #visualEditor td {
                border: 1px solid var(--bs-border-color);
                padding: 8px;
                text-align: left;
            }
            
            #visualEditor th {
                background-color: var(--bs-tertiary-bg);
                font-weight: bold;
            }
            
            /* Estilos para placeholder quando o editor está vazio */
            #visualEditor:empty:before {
                content: attr(data-placeholder);
                color: var(--bs-secondary-color);
                font-style: italic;
                opacity: 0.6;
            }
        `;
        document.head.appendChild(style);
    }

    bindCoreEvents() {
        // Event listeners do editor
        this.editor.addEventListener('input', () => this.handleContentChange());
        this.editor.addEventListener('keydown', (event) => this.handleKeyDown(event));
        this.editor.addEventListener('paste', (event) => this.handlePaste(event));
        this.editor.addEventListener('focus', () => this.onFocus());
        this.editor.addEventListener('blur', () => this.onBlur());
    }

    handleContentChange() {
        // Sempre que o conteúdo muda, notificar e salvar estado
        if (this.isActive) {
            this.history.saveState();
            this.onContentChange();
        }
    }

    handleKeyDown(event) {
        // No modo texto, não precisamos de tratamento especial para Enter
        // pois queremos que a quebra de linha seja processada normalmente
        
        // Salvamos o estado no histórico após alterações
        if (this.history && event.key.length === 1 || event.key === 'Enter' || event.key === 'Backspace' || event.key === 'Delete') {
            setTimeout(() => {
                this.history.saveState();
            }, 300);
        }
        
        // Atalhos de teclado
        if (event.ctrlKey || event.metaKey) {
            const shortcuts = {
                'KeyB': () => this.formatter.toggleBold(),
                'KeyI': () => this.formatter.toggleItalic(),
                'KeyU': () => this.formatter.toggleUnderline(),
                'KeyK': () => this.toolbarManager.showLinkModal(),
                'Digit1': () => this.formatter.setHeading(1),
                'Digit2': () => this.formatter.setHeading(2),
                'Digit3': () => this.formatter.setHeading(3),
                'Digit4': () => this.formatter.setHeading(4),
                'Digit5': () => this.formatter.setHeading(5),
                'Digit6': () => this.formatter.setHeading(6),
                'KeyZ': () => this.history.undo(),
                'KeyY': () => this.history.redo(),
                'Backquote': () => this.formatter.toggleInlineCode()
            };

            if (shortcuts[event.code]) {
                event.preventDefault();
                shortcuts[event.code]();
            }
        }
    }

    handlePaste(event) {
        event.preventDefault();
        
        const clipboardData = event.clipboardData || window.clipboardData;
        
        // Verificar se há HTML ou texto
        const htmlData = clipboardData.getData('text/html');
        const textData = clipboardData.getData('text/plain');
        
        if (htmlData) {
            // Tentar converter HTML para Markdown e depois voltar para HTML visual
            try {
                // Sanitizar HTML antes de processar
                let sanitizedHtml = htmlData;
                if (window.DOMPurify) {
                    sanitizedHtml = window.DOMPurify.sanitize(htmlData);
                }
                
                // Converter HTML para Markdown
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = sanitizedHtml;
                const markdown = this.converter.visualHTMLToMarkdown(sanitizedHtml);
                
                // Converter Markdown de volta para HTML visual formatado
                const visualHtml = this.converter.markdownToVisualHTML(markdown);
                
                // Inserir HTML visual
                document.execCommand('insertHTML', false, visualHtml);
            } catch (error) {
                console.error('Erro ao processar HTML colado:', error);
                // Fallback: inserir como texto plano
                this.insertTextAtCursor(textData);
            }
        } else if (textData) {
            // Verificar se o texto parece ser Markdown
            if (this.looksLikeMarkdown(textData)) {
                // Converter para HTML visual e inserir
                const visualHtml = this.converter.markdownToVisualHTML(textData);
                document.execCommand('insertHTML', false, visualHtml);
            } else {
                // Inserir como texto plano
                this.insertTextAtCursor(textData);
            }
        }
    }
    
    // Verificar se o texto parece ser Markdown
    looksLikeMarkdown(text) {
        // Padrões comuns de Markdown
        const markdownPatterns = [
            /#{1,6}\s+.+/,          // Cabeçalhos
            /\*\*.+\*\*/,            // Negrito
            /\*.+\*/,                // Itálico
            /!\[.+\]\(.+\)/,         // Imagens
            /\[.+\]\(.+\)/,          // Links
            /^>\s+.+/m,              // Citações
            /^-\s+.+/m,              // Listas não ordenadas
            /^[0-9]+\.\s+.+/m,       // Listas ordenadas
            /^```[\s\S]*?```/m,      // Blocos de código
            /~~.+~~/                 // Tachado
        ];
        
        // Se qualquer padrão for encontrado, considerar como Markdown
        return markdownPatterns.some(pattern => pattern.test(text));
    }

    insertTextAtCursor(text) {
        // Substituir seleção ou inserir no cursor
        if (!document.execCommand('insertText', false, text)) {
            // Fallback para navegadores que não suportam execCommand
            const selection = window.getSelection();
            if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
                
                // Posicionar o cursor após o texto inserido
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    show(content = '', fileName = '') {
        // Se o editor ainda não estiver inicializado, adicionar à lista de ações pendentes
        if (!this.isInitialized) {
            console.log('Editor ainda não inicializado. Adicionando show à fila.');
            this.pendingActions.push({
                type: 'show',
                content,
                fileName
            });
            return;
        }
        
        this.isActive = true;
        this.placeholder.style.display = 'none';
        this.editor.style.display = 'block';
        this.toolbarElement.style.display = 'block';
        this.fileInfo.style.display = 'block';
        
        if (fileName) {
            this.fileName.textContent = fileName;
        }
        
        // Armazenar o markdown original
        this.currentMarkdown = content;
        
        // Converter markdown para visualização WYSIWYG
        if (content) {
            this.setContentFromMarkdown(content);
        } else {
            this.editor.innerHTML = '';
        }
        
        this.editor.focus();
        this.history.saveState(); // Estado inicial
    }

    hide() {
        // Se o editor ainda não estiver inicializado, adicionar à lista de ações pendentes
        if (!this.isInitialized) {
            console.log('Editor ainda não inicializado. Adicionando hide à fila.');
            this.pendingActions.push({
                type: 'hide'
            });
            return;
        }
        
        this.isActive = false;
        this.placeholder.style.display = 'flex';
        this.editor.style.display = 'none';
        this.toolbarElement.style.display = 'none';
        this.fileInfo.style.display = 'none';
        
        // Limpar conteúdo
        this.editor.innerHTML = '';
        this.currentMarkdown = '';
    }

    setContentFromMarkdown(markdown) {
        if (markdown === undefined || markdown === null) {
            markdown = '';
        }
        
        // Verificar se o conversor já foi inicializado
        if (!this.converter) {
            console.error('Conversor ainda não inicializado');
            this.editor.innerHTML = '<p>Erro ao carregar conteúdo: conversor não disponível.</p>';
            return;
        }
        
        // Armazenar markdown atual
        this.currentMarkdown = markdown;
        
        // Converter markdown para HTML visual usando o conversor
        try {
            // No modo Visual Editor estamos mantendo o Markdown, só precisamos garantir
            // que ele está em parágrafos adequados para visualização
            this.editor.innerText = markdown;
        } catch (error) {
            console.error('Erro ao definir conteúdo do editor:', error);
            this.editor.innerHTML = '<p>Erro ao converter conteúdo.</p>';
        }
    }

    getMarkdownContent() {
        if (!this.isActive) return '';
        
        // Simplesmente retornar o texto do editor, já que estamos editando Markdown diretamente
        return this.editor.textContent || this.currentMarkdown || '';
    }

    onFocus() {
        // Atualizar estado da barra de ferramentas quando o editor receber foco
        if (this.toolbarManager) {
            this.toolbarManager.updateState();
        }
    }

    onBlur() {
        // Salvar estado quando perder foco
        if (this.isActive) {
            this.history.saveState();
        }
    }

    onContentChange() {
        // Esta função pode ser estendida para notificar mudanças
        if (window.manatiEditor && typeof window.manatiEditor.onVisualEditorChange === 'function') {
            window.manatiEditor.onVisualEditorChange();
        }
    }

    clear() {
        // Se o editor ainda não estiver inicializado, adicionar à lista de ações pendentes
        if (!this.isInitialized) {
            console.log('Editor ainda não inicializado. Adicionando clear à fila.');
            this.pendingActions.push({
                type: 'clear'
            });
            return;
        }
        
        this.editor.innerHTML = '';
        this.currentMarkdown = '';
        this.history.clear();
    }

    showToast(message, type = 'info') {
        // Função para exibir notificações ao usuário
        // Esta é apenas uma implementação básica que pode ser estendida
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Se o projeto tiver um sistema de toast, podemos usá-lo aqui
        if (window.manatiEditor && typeof window.manatiEditor.showToast === 'function') {
            window.manatiEditor.showToast(message, type);
        }
    }
}

export { VisualEditorCore };
