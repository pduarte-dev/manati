class VisualEditor {
    constructor() {
        this.editor = document.getElementById('visualEditor');
        this.toolbar = document.getElementById('visualToolbar');
        this.placeholder = document.getElementById('visualEditorPlaceholder');
        this.fileInfo = document.getElementById('visualFileInfo');
        this.fileName = document.getElementById('visualCurrentFileName');
        this.isActive = false;
        this.lastSelection = null;
        this.currentRange = null;
        
        // Histórico para undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupToolbar();
        this.setupSelectionTracking();
    }

    bindEvents() {
        // Eventos do editor
        this.editor.addEventListener('input', () => this.onContentChange());
        this.editor.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.editor.addEventListener('paste', (e) => this.handlePaste(e));
        
        // Eventos de seleção para atualizar toolbar
        this.editor.addEventListener('mouseup', () => {
            this.saveSelection();
            this.updateToolbarState();
        });
        this.editor.addEventListener('keyup', () => {
            this.saveSelection();
            this.updateToolbarState();
        });
        this.editor.addEventListener('focus', () => this.updateToolbarState());
        
        // Upload de arquivos
        document.getElementById('insertImageBtn').addEventListener('click', () => this.showImageUpload());
        document.getElementById('insertFileBtn').addEventListener('click', () => this.showFileUpload());
        document.getElementById('insertLinkBtn').addEventListener('click', () => this.showLinkModal());
        
        // Modais
        document.getElementById('insertLinkConfirm').addEventListener('click', () => this.insertLink());
        document.getElementById('insertTableConfirm').addEventListener('click', () => this.insertTable());
        
        // Upload handlers com upload real
        document.getElementById('imageUpload').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('fileUpload').addEventListener('change', (e) => this.handleFileUpload(e));
    }

    setupToolbar() {
        // Comandos da barra de ferramentas
        this.toolbar.addEventListener('click', (e) => {
            const button = e.target.closest('[data-command]');
            if (button) {
                e.preventDefault();
                const command = button.dataset.command;
                this.executeCommand(command);
                button.blur();
                // Aguardar um pouco antes de atualizar para o comando ser processado
                setTimeout(() => this.updateToolbarState(), 10);
            }
        });
    }

    setupSelectionTracking() {
        // Melhorar rastreamento de seleção para funcionar melhor
        document.addEventListener('selectionchange', () => {
            if (this.isActive && document.activeElement === this.editor) {
                this.saveSelection();
                // Debounce update toolbar
                clearTimeout(this.toolbarUpdateTimer);
                this.toolbarUpdateTimer = setTimeout(() => this.updateToolbarState(), 50);
            }
        });

        this.editor.addEventListener('input', () => {
            this.onContentChange();
            this.saveToHistory();
        });

        this.editor.addEventListener('keyup', () => this.updateToolbarState());
        this.editor.addEventListener('mouseup', () => this.updateToolbarState());
        this.editor.addEventListener('focus', () => this.updateToolbarState());
    }

    show(content = '', fileName = '') {
        this.isActive = true;
        this.placeholder.style.display = 'none';
        this.editor.style.display = 'block';
        this.toolbar.style.display = 'block';
        this.fileInfo.style.display = 'block';
        
        if (fileName) {
            this.fileName.textContent = fileName;
        }
        
        // Converter markdown para HTML se necessário
        if (content && typeof content === 'string') {
            this.setContentFromMarkdown(content);
        }
        
        this.editor.focus();
        this.updateToolbarState();
        this.saveToHistory(); // Salvar estado inicial
    }

    hide() {
        this.isActive = false;
        this.placeholder.style.display = 'flex';
        this.editor.style.display = 'none';
        this.toolbar.style.display = 'none';
        this.fileInfo.style.display = 'none';
    }

    setContentFromMarkdown(markdown = '') {
        // Conversão melhorada de markdown para HTML usando marked
        if (typeof marked !== 'undefined') {
            // Usar marked.js se disponível
            this.editor.innerHTML = marked.parse(markdown, {
                mangle: false,
                headerIds: false
            });
        } else {
            // Conversão manual melhorada
            let html = markdown;
            
            // Blocos de código com ``` primeiro (antes de código inline)
            html = html
                .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
                .replace(/```\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
            
            // Tabelas depois dos blocos de código
            html = this.convertMarkdownTables(html);
            
            // Títulos
            html = html
                .replace(/^#{6} (.*$)/gm, '<h6>$1</h6>')
                .replace(/^#{5} (.*$)/gm, '<h5>$1</h5>')
                .replace(/^#{4} (.*$)/gm, '<h4>$1</h4>')
                .replace(/^#{3} (.*$)/gm, '<h3>$1</h3>')
                .replace(/^#{2} (.*$)/gm, '<h2>$1</h2>')
                .replace(/^#{1} (.*$)/gm, '<h1>$1</h1>')
                
                // Formatação inline
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/__(.*?)__/g, '<strong>$1</strong>')
                .replace(/_(.*?)_/g, '<em>$1</em>')
                
                // Código inline (apenas uma linha, não pode ter quebras)
                .replace(/`([^`\n]+)`/g, '<code>$1</code>')
                
                // Links
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
                
                // Imagens
                .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">')
                
                // Citações
                .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
                
                // Listas não ordenadas
                .replace(/^\* (.+)$/gm, '<li>$1</li>')
                .replace(/(<li>.*?<\/li>)/gs, match => {
                    if (!match.includes('<ul>')) {
                        return '<ul>' + match + '</ul>';
                    }
                    return match;
                })
                
                // Listas ordenadas  
                .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
                .replace(/(<li>.*?<\/li>)/gs, match => {
                    if (!match.includes('<ol>') && !match.includes('<ul>')) {
                        return '<ol>' + match + '</ol>';
                    }
                    return match;
                });
                
            // Converter parágrafos
            html = this.convertParagraphs(html);
            
            this.editor.innerHTML = html;
        }
    }
    
    convertMarkdownTables(markdown) {
        // Regex para detectar tabelas markdown
        const tableRegex = /(\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)*)/g;
        
        return markdown.replace(tableRegex, (match) => {
            const lines = match.trim().split('\n');
            if (lines.length < 2) return match;
            
            const headerLine = lines[0];
            const separatorLine = lines[1];
            const dataLines = lines.slice(2);
            
            // Extrair cabeçalhos
            const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
            
            // Criar tabela HTML
            let html = '<table class="table table-bordered">\n<thead>\n<tr>\n';
            headers.forEach(header => {
                html += `<th>${header}</th>\n`;
            });
            html += '</tr>\n</thead>\n<tbody>\n';
            
            // Adicionar linhas de dados
            dataLines.forEach(line => {
                const cells = line.split('|').map(c => c.trim()).filter(c => c);
                if (cells.length > 0) {
                    html += '<tr>\n';
                    cells.forEach(cell => {
                        html += `<td>${cell}</td>\n`;
                    });
                    html += '</tr>\n';
                }
            });
            
            html += '</tbody>\n</table>\n';
            return html;
        });
    }
    
    convertParagraphs(html) {
        // Dividir em blocos e converter parágrafos
        const blocks = html.split(/\n\s*\n/);
        
        return blocks.map(block => {
            block = block.trim();
            if (!block) return '';
            
            // Não converter se já for um elemento HTML
            if (block.match(/^<(h[1-6]|ul|ol|blockquote|table|div|pre)/)) {
                return block;
            }
            
            return `<p>${block.replace(/\n/g, '<br>')}</p>`;
        }).join('\n\n');
    }

    async handleImageUpload(event) {
        const files = Array.from(event.target.files);
        
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                try {
                    this.showUploadProgress(`Enviando ${file.name}...`);
                    const result = await this.uploadFileToServer(file);
                    this.insertImage(result.url, result.originalName);
                    this.hideUploadProgress();
                    this.showToast(`Imagem ${file.name} enviada com sucesso!`, 'success');
                } catch (error) {
                    console.error('Erro ao fazer upload da imagem:', error);
                    this.hideUploadProgress();
                    this.showToast(`Erro ao enviar ${file.name}`, 'error');
                }
            }
        }
        
        // Limpar input
        event.target.value = '';
    }

    async handleFileUpload(event) {
        const files = Array.from(event.target.files);
        
        for (const file of files) {
            try {
                this.showUploadProgress(`Enviando ${file.name}...`);
                const result = await this.uploadFileToServer(file);
                this.insertFileLink(result.url, result.originalName);
                this.hideUploadProgress();
                this.showToast(`Arquivo ${file.name} enviado com sucesso!`, 'success');
            } catch (error) {
                console.error('Erro ao fazer upload do arquivo:', error);
                this.hideUploadProgress();
                this.showToast(`Erro ao enviar ${file.name}`, 'error');
            }
        }
        
        // Limpar input
        event.target.value = '';
    }

    async uploadFileToServer(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            
            // Criar mensagem de erro mais específica baseada no tipo
            let errorMessage = errorData.error || 'Erro desconhecido no upload';
            
            switch (errorData.type) {
                case 'unsupported_file_type':
                    // A mensagem já vem específica do backend
                    break;
                case 'file_too_large':
                    errorMessage = 'Arquivo muito grande! O tamanho máximo permitido é 10MB.';
                    break;
                case 'no_file':
                    errorMessage = 'Nenhum arquivo foi selecionado.';
                    break;
                case 'unexpected_file_field':
                    errorMessage = 'Erro no envio do arquivo. Tente novamente.';
                    break;
                default:
                    errorMessage = `Erro no upload: ${errorMessage}`;
                    break;
            }
            
            throw new Error(errorMessage);
        }
        
        return await response.json();
    }

    showUploadProgress(message) {
        // Criar ou atualizar indicador de progresso
        let progress = document.getElementById('uploadProgress');
        if (!progress) {
            progress = document.createElement('div');
            progress.id = 'uploadProgress';
            progress.className = 'upload-progress';
            document.body.appendChild(progress);
        }
        
        progress.innerHTML = `
            <div class="alert alert-info d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                ${message}
            </div>
        `;
    }

    hideUploadProgress() {
        const progress = document.getElementById('uploadProgress');
        if (progress) {
            progress.remove();
        }
    }

    insertImage(url, alt = '') {
        this.restoreSelection();
        
        const img = document.createElement('img');
        img.src = url;
        img.alt = alt;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        
        this.insertElementAtCursor(img);
        this.onContentChange();
    }

    insertFileLink(url, fileName) {
        this.restoreSelection();
        
        const link = document.createElement('a');
        link.href = url;
        link.textContent = `📎 ${fileName}`;
        link.download = fileName;
        link.target = '_blank';
        
        this.insertElementAtCursor(link);
        this.onContentChange();
    }

    insertElementAtCursor(element) {
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(element);
            
            // Mover cursor após o elemento inserido
            range.setStartAfter(element);
            range.setEndAfter(element);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // Se não há seleção, inserir no final
            this.editor.appendChild(element);
            
            // Posicionar cursor após o elemento
            const range = document.createRange();
            range.setStartAfter(element);
            range.setEndAfter(element);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        this.editor.focus();
    }

    getMarkdownContent() {
        if (!this.isActive) return '';
        
        // Criar uma cópia do editor para não modificar o original
        const clone = this.editor.cloneNode(true);
        
        // Converter elementos HTML para markdown
        this.convertHTMLElementsToMarkdown(clone);
        
        // Obter texto final
        let markdown = clone.textContent || clone.innerText || '';
        
        // Limpar espaços extras e normalizar quebras de linha
        markdown = markdown
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Remover quebras de linha excessivas
            .replace(/^\s+|\s+$/g, '') // Remover espaços no início e fim
            .trim();
            
        return markdown;
    }
    
    convertHTMLElementsToMarkdown(element) {
        // Converter tabelas primeiro
        const tables = element.querySelectorAll('table');
        tables.forEach(table => {
            const markdown = this.convertTableToMarkdown(table);
            const textNode = document.createTextNode('\n' + markdown + '\n');
            table.parentNode.replaceChild(textNode, table);
        });
        
        // Converter imagens para markdown (sem base64)
        const images = element.querySelectorAll('img');
        images.forEach(img => {
            let src = img.src;
            // Se for uma URL completa local, converter para relativa
            if (src.startsWith(window.location.origin)) {
                src = src.replace(window.location.origin, '');
            }
            const markdown = `![${img.alt || ''}](${src})`;
            const textNode = document.createTextNode(markdown);
            img.parentNode.replaceChild(textNode, img);
        });
        
        // Converter links
        const links = element.querySelectorAll('a');
        links.forEach(link => {
            const markdown = `[${link.textContent}](${link.href})`;
            const textNode = document.createTextNode(markdown);
            link.parentNode.replaceChild(textNode, link);
        });
        
        // Converter outros elementos
        this.convertStandardElementsToMarkdown(element);
    }
    
    convertTableToMarkdown(table) {
        let markdown = '';
        
        // Processar cabeçalho
        const headerRow = table.querySelector('thead tr, tr:first-child');
        if (headerRow) {
            const headers = Array.from(headerRow.querySelectorAll('th, td'));
            const headerTexts = headers.map(th => th.textContent.trim());
            
            markdown += '| ' + headerTexts.join(' | ') + ' |\n';
            markdown += '| ' + headerTexts.map(() => '---').join(' | ') + ' |\n';
        }
        
        // Processar linhas de dados
        const bodyRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
        bodyRows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            const cellTexts = cells.map(td => td.textContent.trim());
            markdown += '| ' + cellTexts.join(' | ') + ' |\n';
        });
        
        return markdown;
    }
    
    convertStandardElementsToMarkdown(element) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_ELEMENT,
            null,
            false
        );
        
        const elementsToConvert = [];
        let node;
        
        while (node = walker.nextNode()) {
            elementsToConvert.push(node);
        }
        
        // Converter em ordem reversa para não afetar a estrutura
        elementsToConvert.reverse().forEach(el => {
            const tagName = el.tagName.toLowerCase();
            let markdown = '';
            
            switch (tagName) {
                case 'h1':
                    markdown = `\n# ${el.textContent}\n\n`;
                    break;
                case 'h2':
                    markdown = `\n## ${el.textContent}\n\n`;
                    break;
                case 'h3':
                    markdown = `\n### ${el.textContent}\n\n`;
                    break;
                case 'h4':
                    markdown = `\n#### ${el.textContent}\n\n`;
                    break;
                case 'h5':
                    markdown = `\n##### ${el.textContent}\n\n`;
                    break;
                case 'h6':
                    markdown = `\n###### ${el.textContent}\n\n`;
                    break;
                case 'strong':
                case 'b':
                    markdown = `**${el.textContent}**`;
                    break;
                case 'em':
                case 'i':
                    markdown = `*${el.textContent}*`;
                    break;
                case 'code':
                    // Verificar se é código inline ou bloco de código
                    if (el.parentNode && el.parentNode.tagName === 'PRE') {
                        // É um bloco de código, será tratado pelo case 'pre'
                        return;
                    } else {
                        // É código inline
                        markdown = `\`${el.textContent}\``;
                    }
                    break;
                case 'pre':
                    // Bloco de código
                    const codeElement = el.querySelector('code');
                    if (codeElement) {
                        const codeContent = codeElement.textContent;
                        const language = codeElement.className.match(/language-(\w+)/);
                        if (language) {
                            markdown = `\n\`\`\`${language[1]}\n${codeContent}\n\`\`\`\n\n`;
                        } else {
                            markdown = `\n\`\`\`\n${codeContent}\n\`\`\`\n\n`;
                        }
                    } else {
                        markdown = `\n\`\`\`\n${el.textContent}\n\`\`\`\n\n`;
                    }
                    break;
                case 'blockquote':
                    markdown = `\n> ${el.textContent}\n\n`;
                    break;
                case 'ul':
                    const ulItems = Array.from(el.children);
                    markdown = '\n' + ulItems.map(li => `* ${li.textContent}`).join('\n') + '\n\n';
                    break;
                case 'ol':
                    const olItems = Array.from(el.children);
                    markdown = '\n' + olItems.map((li, index) => `${index + 1}. ${li.textContent}`).join('\n') + '\n\n';
                    break;
                case 'p':
                    markdown = `\n${el.textContent}\n\n`;
                    break;
                case 'br':
                    markdown = '\n';
                    break;
                default:
                    return; // Não converter este elemento
            }
            
            if (markdown) {
                const textNode = document.createTextNode(markdown);
                el.parentNode.replaceChild(textNode, el);
            }
        });
    }

    executeCommand(command) {
        this.restoreSelection();
        
        // Salvar estado antes da mudança
        this.saveToHistory();
        
        switch (command) {
            case 'bold':
                // Verificar se já está formatado para fazer toggle
                if (this.isFormatActive('bold')) {
                    this.removeFormatting('bold');
                } else {
                    document.execCommand('bold');
                }
                break;
            case 'italic':
                if (this.isFormatActive('italic')) {
                    this.removeFormatting('italic');
                } else {
                    document.execCommand('italic');
                }
                break;
            case 'underline':
                if (this.isFormatActive('underline')) {
                    this.removeFormatting('underline');
                } else {
                    document.execCommand('underline');
                }
                break;
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                // Se já é o mesmo tipo de heading, converter para parágrafo
                if (this.isFormatActive(command)) {
                    document.execCommand('formatBlock', false, 'p');
                } else {
                    document.execCommand('formatBlock', false, command);
                }
                break;
            case 'p':
                // Voltar para texto normal
                document.execCommand('formatBlock', false, 'p');
                break;
            case 'insertUnorderedList':
            case 'insertOrderedList':
                document.execCommand(command);
                break;
            case 'blockquote':
                // Toggle blockquote
                if (this.isFormatActive('blockquote')) {
                    document.execCommand('formatBlock', false, 'p');
                } else {
                    document.execCommand('formatBlock', false, 'blockquote');
                }
                break;
            case 'code':
                // Código inline - toggle
                if (this.isFormatActive('code')) {
                    this.removeInlineCode();
                } else {
                    this.wrapSelection('code');
                }
                break;
            case 'codeblock':
                // Bloco de código
                this.insertCodeBlock();
                break;
            case 'table':
                this.showTableModal();
                break;
        }
        
        this.onContentChange();
    }

    insertCodeBlock() {
        this.restoreSelection();
        
        const selection = window.getSelection();
        let selectedText = '';
        
        if (selection.rangeCount > 0) {
            selectedText = selection.toString();
        }
        
        // Criar elemento pre com code
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = selectedText || 'Digite seu código aqui...';
        code.contentEditable = true;
        pre.appendChild(code);
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(pre);
            
            // Posicionar cursor dentro do bloco de código
            const newRange = document.createRange();
            newRange.selectNodeContents(code);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
        } else {
            this.editor.appendChild(pre);
        }
        
        this.editor.focus();
    }

    saveToHistory() {
        if (!this.isActive) return;
        
        const currentContent = this.editor.innerHTML;
        
        // Não salvar se o conteúdo não mudou
        if (this.history.length > 0 && this.history[this.historyIndex] === currentContent) {
            return;
        }
        
        // Remover itens do histórico após o índice atual
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Adicionar novo estado
        this.history.push(currentContent);
        this.historyIndex = this.history.length - 1;
        
        // Limitar tamanho do histórico
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.editor.innerHTML = this.history[this.historyIndex];
            this.updateToolbarState();
            this.onContentChange();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.editor.innerHTML = this.history[this.historyIndex];
            this.updateToolbarState();
            this.onContentChange();
        }
    }

    wrapSelection(tag) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            
            if (selectedText) {
                const element = document.createElement(tag);
                element.textContent = selectedText;
                range.deleteContents();
                range.insertNode(element);
                
                // Limpar seleção
                selection.removeAllRanges();
            }
        }
    }

    showImageUpload() {
        document.getElementById('imageUpload').click();
    }

    showFileUpload() {
        document.getElementById('fileUpload').click();
    }

    showLinkModal() {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        document.getElementById('linkText').value = selectedText;
        document.getElementById('linkUrl').value = '';
        
        const modal = new bootstrap.Modal(document.getElementById('insertLinkModal'));
        modal.show();
    }

    showTableModal() {
        const modal = new bootstrap.Modal(document.getElementById('insertTableModal'));
        modal.show();
    }

    insertLink() {
        const text = document.getElementById('linkText').value;
        const url = document.getElementById('linkUrl').value;
        
        if (text && url) {
            this.restoreSelection();
            
            const link = document.createElement('a');
            link.href = url;
            link.textContent = text;
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(link);
            } else {
                this.editor.appendChild(link);
            }
            
            this.onContentChange();
        }
        
        bootstrap.Modal.getInstance(document.getElementById('insertLinkModal')).hide();
    }

    insertTable() {
        const rows = parseInt(document.getElementById('tableRows').value);
        const cols = parseInt(document.getElementById('tableCols').value);
        
        const table = document.createElement('table');
        table.className = 'table table-bordered';
        
        // Cabeçalho
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        for (let j = 0; j < cols; j++) {
            const th = document.createElement('th');
            th.textContent = `Coluna ${j + 1}`;
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Corpo
        const tbody = document.createElement('tbody');
        for (let i = 0; i < rows; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < cols; j++) {
                const td = document.createElement('td');
                td.textContent = `Linha ${i + 1}, Col ${j + 1}`;
                row.appendChild(td);
            }
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        
        this.restoreSelection();
        this.editor.appendChild(table);
        this.onContentChange();
        
        bootstrap.Modal.getInstance(document.getElementById('insertTableModal')).hide();
    }

    async uploadFileToServer(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            
            // Criar mensagem de erro mais específica baseada no tipo
            let errorMessage = errorData.error || 'Erro desconhecido no upload';
            
            switch (errorData.type) {
                case 'unsupported_file_type':
                    // A mensagem já vem específica do backend
                    break;
                case 'file_too_large':
                    errorMessage = 'Arquivo muito grande! O tamanho máximo permitido é 10MB.';
                    break;
                case 'no_file':
                    errorMessage = 'Nenhum arquivo foi selecionado.';
                    break;
                case 'unexpected_file_field':
                    errorMessage = 'Erro no envio do arquivo. Tente novamente.';
                    break;
                default:
                    errorMessage = `Erro no upload: ${errorMessage}`;
                    break;
            }
            
            throw new Error(errorMessage);
        }
        
        return await response.json();
    }

    saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            this.lastSelection = selection.getRangeAt(0).cloneRange();
        }
    }

    restoreSelection() {
        if (this.lastSelection) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(this.lastSelection);
        }
    }

    updateToolbarState() {
        if (!this.isActive || !this.toolbar) return;
        
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        // Resetar todos os botões
        this.toolbar.querySelectorAll('[data-command]').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const range = selection.getRangeAt(0);
        let element = range.commonAncestorContainer;
        
        // Se for um nó de texto, pegar o elemento pai
        if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
        }
        
        // Verificar se é um parágrafo ou texto normal
        let isNormalText = true;
        
        // Percorrer a árvore DOM para verificar formatação
        let currentElement = element;
        while (currentElement && currentElement !== this.editor && currentElement !== document.body) {
            const tagName = currentElement.tagName ? currentElement.tagName.toLowerCase() : '';
            const computedStyle = window.getComputedStyle(currentElement);
            
            // Verificar formatação inline
            if (tagName === 'strong' || tagName === 'b' || 
                computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700) {
                this.setButtonActive('bold');
            }
            
            if (tagName === 'em' || tagName === 'i' || computedStyle.fontStyle === 'italic') {
                this.setButtonActive('italic');
            }
            
            if (tagName === 'u' || computedStyle.textDecoration.includes('underline')) {
                this.setButtonActive('underline');
            }
            
            if (tagName === 'code') {
                this.setButtonActive('code');
            }
            
            // Verificar elementos de bloco
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                this.setButtonActive(tagName);
                isNormalText = false;
            }
            
            if (tagName === 'blockquote') {
                this.setButtonActive('blockquote');
                isNormalText = false;
            }
            
            if (tagName === 'pre') {
                // Bloco de código
                isNormalText = false;
            }
            
            // Verificar listas
            if (tagName === 'ul' || currentElement.closest('ul')) {
                this.setButtonActive('insertUnorderedList');
                isNormalText = false;
            }
            
            if (tagName === 'ol' || currentElement.closest('ol')) {
                this.setButtonActive('insertOrderedList');
                isNormalText = false;
            }
            
            currentElement = currentElement.parentElement;
        }
        
        // Se não é um elemento especial, ativar botão P
        if (isNormalText || element.tagName?.toLowerCase() === 'p') {
            this.setButtonActive('p');
        }
    }
    
    setButtonActive(command) {
        const button = this.toolbar.querySelector(`[data-command="${command}"]`);
        if (button) {
            button.classList.add('active');
        }
    }

    isFormatActive(command) {
        // Método alternativo para verificar formatação quando queryCommandState falha
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return false;
        
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        
        let currentElement = element;
        while (currentElement && currentElement !== this.editor) {
            const tagName = currentElement.tagName ? currentElement.tagName.toLowerCase() : '';
            const style = window.getComputedStyle(currentElement);
            
            switch (command) {
                case 'bold':
                    if (tagName === 'strong' || tagName === 'b' || 
                        style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700) {
                        return true;
                    }
                    break;
                case 'italic':
                    if (tagName === 'em' || tagName === 'i' || 
                        style.fontStyle === 'italic') {
                        return true;
                    }
                    break;
                case 'underline':
                    if (tagName === 'u' || 
                        style.textDecoration.includes('underline')) {
                        return true;
                    }
                    break;
                case 'code':
                    if (tagName === 'code') {
                        return true;
                    }
                    break;
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                case 'h5':
                case 'h6':
                    if (tagName === command) {
                        return true;
                    }
                    break;
                case 'blockquote':
                    if (tagName === 'blockquote') {
                        return true;
                    }
                    break;
            }
            
            currentElement = currentElement.parentElement;
        }
        
        return false;
    }
    
    removeFormatting(type) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        let element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        
        // Encontrar o elemento de formatação específico
        while (element && element !== this.editor) {
            const tagName = element.tagName ? element.tagName.toLowerCase() : '';
            
            let shouldRemove = false;
            switch (type) {
                case 'bold':
                    shouldRemove = tagName === 'strong' || tagName === 'b';
                    break;
                case 'italic':
                    shouldRemove = tagName === 'em' || tagName === 'i';
                    break;
                case 'underline':
                    shouldRemove = tagName === 'u';
                    break;
            }
            
            if (shouldRemove) {
                // Substituir o elemento pela sua própria conteúdo
                const parent = element.parentElement;
                while (element.firstChild) {
                    parent.insertBefore(element.firstChild, element);
                }
                parent.removeChild(element);
                break;
            }
            
            element = element.parentElement;
        }
    }
    
    removeInlineCode() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        let element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        
        // Encontrar o elemento code
        while (element && element !== this.editor) {
            if (element.tagName && element.tagName.toLowerCase() === 'code') {
                // Verificar se não é um bloco de código (dentro de pre)
                if (!element.closest('pre')) {
                    const parent = element.parentElement;
                    while (element.firstChild) {
                        parent.insertBefore(element.firstChild, element);
                    }
                    parent.removeChild(element);
                    break;
                }
            }
            element = element.parentElement;
        }
    }

    handleKeydown(event) {
        // Atalhos de teclado
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'b':
                    event.preventDefault();
                    this.executeCommand('bold');
                    break;
                case 'i':
                    event.preventDefault();
                    this.executeCommand('italic');
                    break;
                case 'u':
                    event.preventDefault();
                    this.executeCommand('underline');
                    break;
                case 'z':
                    event.preventDefault();
                    if (event.shiftKey) {
                        this.redo(); // Ctrl+Shift+Z = Redo
                    } else {
                        this.undo(); // Ctrl+Z = Undo
                    }
                    break;
                case 'y':
                    event.preventDefault();
                    this.redo(); // Ctrl+Y = Redo
                    break;
            }
        }
    }

    handlePaste(event) {
        // Permitir apenas texto simples no paste
        event.preventDefault();
        const text = (event.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
    }

    onContentChange() {
        if (window.manatiEditor && this.isActive) {
            window.manatiEditor.hasUnsavedChanges = true;
            // Na versão modular, updateSaveButton está no módulo ui
            if (window.manatiEditor.ui && typeof window.manatiEditor.ui.updateSaveButton === 'function') {
                window.manatiEditor.ui.updateSaveButton();
            }
        }
    }

    showToast(message, type = 'info') {
        if (window.manatiEditor) {
            // Na versão modular, showToast está no módulo ui
            if (window.manatiEditor.ui && typeof window.manatiEditor.ui.showToast === 'function') {
                window.manatiEditor.ui.showToast(message, type);
            }
        }
    }

    clear() {
        this.editor.innerHTML = '';
    }
}

// Tornar VisualEditor disponível globalmente para compatibilidade com a aplicação modular
window.VisualEditor = VisualEditor;

// Não auto-inicializar - será inicializado pela aplicação modular quando necessário
