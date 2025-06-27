/**
 * MarkdownFormatter - Gerencia formatação direta para Markdown
 * Aplica delimitadores de markdown diretamente no texto seguindo
 * as especificações padrão do Markdown (CommonMark e GitHub Flavored Markdown)
 */
class MarkdownFormatter {
    constructor(editor) {
        this.editor = editor;
        this.editorElement = editor.editor;
    }

    // Formatação em negrito - Markdown padrão: **texto** ou __texto__
    toggleBold() {
        this.applyMarkdownFormat('**', '**');
    }

    // Formatação em itálico - Markdown padrão: *texto* ou _texto_
    toggleItalic() {
        this.applyMarkdownFormat('*', '*');
    }

    // Formatação sublinhada - Não é padrão Markdown, usando tag HTML
    // Nota: Isso funcionará apenas em processadores Markdown que permitem HTML
    toggleUnderline() {
        this.applyMarkdownFormat('<u>', '</u>');
    }

    // Formatação riscada - GitHub Flavored Markdown: ~~texto~~
    toggleStrikethrough() {
        this.applyMarkdownFormat('~~', '~~');
    }

    // Código inline - Markdown padrão: `texto`
    toggleInlineCode() {
        this.applyMarkdownFormat('`', '`');
    }

    // Método principal para aplicar formatação Markdown
    applyMarkdownFormat(openTag, closeTag) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;

        // Focar no editor
        this.editorElement.focus();

        // Verificar se há seleção
        if (selection.toString().length === 0) {
            // Se não há seleção, expandir para a palavra atual
            this.selectCurrentWord();
        }

        // Verificar novamente se há seleção
        if (selection.toString().length === 0) {
            // Se ainda não há seleção, inserir tags vazias e posicionar cursor entre elas
            this.insertEmptyTags(openTag, closeTag);
            return;
        }

        // Obter o texto selecionado
        const selectedText = selection.toString();
        
        // Verificar se o texto já tem esta formatação
        if (this.hasMarkdownFormat(selectedText, openTag, closeTag)) {
            // Remover formatação
            const unformattedText = this.removeMarkdownFormat(selectedText, openTag, closeTag);
            this.replaceSelectedText(unformattedText);
        } else {
            // Aplicar formatação Markdown ao texto (não ao DOM)
            const formattedText = openTag + selectedText + closeTag;
            this.replaceSelectedText(formattedText);
        }
        
        // Salvar estado
        this.editor.history.saveState();

        // Salvar estado
        this.editor.history.saveState();
    }
    
    // Insere tags vazias e posiciona o cursor entre elas
    insertEmptyTags(openTag, closeTag) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        
        // Inserir os delimitadores com um espaço entre eles
        const emptyContent = openTag + ' ' + closeTag;
        
        // Deletar qualquer seleção existente
        range.deleteContents();
        
        // Inserir o texto
        const textNode = document.createTextNode(emptyContent);
        range.insertNode(textNode);
        
        // Posicionar o cursor entre as tags
        range.setStart(textNode, openTag.length + 1);
        range.setEnd(textNode, openTag.length + 1);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    // Aplica formatação preservando outras formatações existentes
    applyFormatPreservingExisting(text, openTag, closeTag) {
        // Esta função tenta preservar formatações existentes
        // Por exemplo, se já temos **texto** e queremos adicionar *texto*,
        // devemos obter ***texto*** em vez de **texto** com * no meio
        
        // Verificar formatações comuns
        const isBold = text.startsWith('**') && text.endsWith('**');
        const isItalic = (text.startsWith('*') && text.endsWith('*')) && 
                        !(text.startsWith('**') || text.endsWith('**'));
        const isCode = text.startsWith('`') && text.endsWith('`');
        const isStrike = text.startsWith('~~') && text.endsWith('~~');
        
        // Combinar formatações apropriadas
        // Não aplicamos formato de código junto com outras formatações
        if (openTag === '`' && (isBold || isItalic || isStrike)) {
            return openTag + text + closeTag;
        }
        
        // Para outras combinações, aplicar normalmente
        return openTag + text + closeTag;
    }

    // Verifica se o texto já possui a formatação específica
    hasMarkdownFormat(text, openTag, closeTag) {
        if (!text) return false;
        
        // Verificação básica: texto começa com openTag e termina com closeTag
        return text.startsWith(openTag) && text.endsWith(closeTag);
    }

    // Remove a formatação markdown do texto
    removeMarkdownFormat(text, openTag, closeTag) {
        if (!text) return text;
        
        if (text.startsWith(openTag) && text.endsWith(closeTag)) {
            return text.substring(openTag.length, text.length - closeTag.length);
        }
        
        return text;
    }

    // Substitui o texto selecionado pelo novo texto
    replaceSelectedText(newText) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        
        // Deletar conteúdo atual e inserir novo texto
        range.deleteContents();
        const textNode = document.createTextNode(newText);
        range.insertNode(textNode);
        
        // Reselecionar o texto inserido
        range.selectNodeContents(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    // Verifica se estamos dentro de um elemento com formatação específica
    isInsideFormattedElement(element, format) {
        if (!element || element === this.editorElement) return false;
        
        // Mapear formatos Markdown para elementos HTML
        const formatMap = {
            '**': ['B', 'STRONG'],
            '*': ['I', 'EM'],
            '~~': ['DEL', 'S'],
            '`': ['CODE'],
            '<u>': ['U']
        };
        
        const tagNames = formatMap[format] || [];
        if (tagNames.includes(element.tagName)) return true;
        
        // Recursivamente verificar elementos pais
        return this.isInsideFormattedElement(element.parentNode, format);
    }
    
    // Remove uma formatação do elemento HTML
    unwrapFormatting(range, element) {
        if (element === this.editorElement) return;
        
        // Certifique-se de que estamos trabalhando com o elemento formatado mais próximo
        const formattedElement = this.getFormattedParent(element);
        if (!formattedElement) return;
        
        // Criar um fragmento de documento para manter o conteúdo interno
        const fragment = document.createDocumentFragment();
        while (formattedElement.firstChild) {
            fragment.appendChild(formattedElement.firstChild);
        }
        
        // Substitua o elemento formatado por seu conteúdo interno
        const parent = formattedElement.parentNode;
        parent.replaceChild(fragment, formattedElement);
        
        // Notificar que houve alteração para histórico
        this.editor.history.saveState();
    }
    
    // Obtém o elemento pai formatado mais próximo
    getFormattedParent(element) {
        if (!element || element === this.editorElement) return null;
        
        const formattedTags = ['B', 'STRONG', 'I', 'EM', 'DEL', 'S', 'CODE', 'U'];
        if (formattedTags.includes(element.tagName)) return element;
        
        return this.getFormattedParent(element.parentNode);
    }
    
    // Envolve a seleção com elementos HTML de formatação - NÃO USADO
    // Este método está sendo substituído por manipulação de texto diretamente
    // É mantido para referência futura
    wrapSelectionWithFormat(range, openTag, closeTag) {
        // Obter texto selecionado
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        // Obter o texto selecionado
        const selectedText = selection.toString();
        
        // Aplicar formatação Markdown
        const formattedText = openTag + selectedText + closeTag;
        
        // Substituir texto original pelo texto formatado
        this.replaceSelectedText(formattedText);
        
        // Notificar que houve alteração para histórico
        this.editor.history.saveState();
    }
    
    // Selecionar palavra atual se cursor estiver em uma palavra
    selectCurrentWord() {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        if (range.startContainer.nodeType === Node.TEXT_NODE) {
            const text = range.startContainer.textContent;
            const offset = range.startOffset;
            
            // Encontrar limites da palavra
            let start = offset;
            let end = offset;
            
            // Expandir para trás
            while (start > 0 && /\w/.test(text[start - 1])) {
                start--;
            }
            
            // Expandir para frente
            while (end < text.length && /\w/.test(text[end])) {
                end++;
            }
            
            if (start < end) {
                range.setStart(range.startContainer, start);
                range.setEnd(range.startContainer, end);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    // Formatação de cabeçalhos (ATX style) - Markdown padrão: # Título (1-6 #)
    setHeading(level) {
        if (level < 1 || level > 6) return;
        
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // Criar elemento heading
        const headingTag = `h${level}`;
        const headingElement = document.createElement(headingTag);
        
        // Determinar se já estamos em um cabeçalho
        let currentHeading = this.findParentHeading(container);
        
        // Selecionar toda a linha/parágrafo
        this.selectLineOrParagraph();
        
        // Capturar o texto selecionado
        const selectedText = window.getSelection().toString().trim();
        
        if (currentHeading) {
            // Se já estamos em um cabeçalho e é do mesmo nível, remover formatação
            if (currentHeading.tagName.toLowerCase() === headingTag) {
                // Remover formatação de cabeçalho (transformar em parágrafo)
                const p = document.createElement('p');
                p.textContent = selectedText;
                currentHeading.parentNode.replaceChild(p, currentHeading);
                
                // Selecionar o novo parágrafo
                range.selectNodeContents(p);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // Alterar o nível de cabeçalho
                headingElement.textContent = selectedText;
                currentHeading.parentNode.replaceChild(headingElement, currentHeading);
                
                // Selecionar o novo cabeçalho
                range.selectNodeContents(headingElement);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } else {
            // Criar novo cabeçalho
            headingElement.textContent = selectedText;
            
            // Substituir o conteúdo selecionado pelo novo cabeçalho
            range.deleteContents();
            range.insertNode(headingElement);
            
            // Selecionar o novo cabeçalho
            range.selectNodeContents(headingElement);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        // Salvar estado para histórico
        this.editor.history.saveState();
    }
    
    // Encontra o cabeçalho ancestral mais próximo
    findParentHeading(element) {
        if (!element || element === this.editorElement) return null;
        
        // Se o elemento é um nó de texto, verificar seu pai
        const node = element.nodeType === Node.TEXT_NODE ? element.parentNode : element;
        
        // Verificar se o elemento é um cabeçalho
        if (node.tagName && /^h[1-6]$/i.test(node.tagName)) {
            return node;
        }
        
        // Verificar recursivamente os pais
        return this.findParentHeading(node.parentNode);
    }
    
    // Seleciona toda a linha ou parágrafo atual
    selectLineOrParagraph() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // Determinar o elemento base (parágrafo, div, etc.)
        let block = container;
        
        // Se estamos em um nó de texto, encontrar o elemento pai mais próximo
        if (container.nodeType === Node.TEXT_NODE) {
            block = container.parentNode;
        }
        
        // Procurar pelo elemento de bloco mais próximo
        while (block !== this.editorElement && !/^(p|div|h[1-6]|li|blockquote)$/i.test(block.tagName)) {
            block = block.parentNode;
            if (!block) break;
        }
        
        // Se encontrarmos um bloco, selecionar todo seu conteúdo
        if (block && block !== this.editorElement) {
            range.selectNodeContents(block);
            selection.removeAllRanges();
            selection.addRange(range);
            return;
        }
        
        // Se não encontramos um bloco, selecionar até as quebras de linha
        if (container.nodeType === Node.TEXT_NODE) {
            const text = container.textContent;
            const offset = range.startOffset;
            
            // Encontrar início da linha (ou início do texto)
            let lineStart = 0;
            for (let i = offset - 1; i >= 0; i--) {
                if (text[i] === '\n') {
                    lineStart = i + 1;
                    break;
                }
            }
            
            // Encontrar fim da linha (ou fim do texto)
            let lineEnd = text.length;
            for (let i = offset; i < text.length; i++) {
                if (text[i] === '\n') {
                    lineEnd = i;
                    break;
                }
            }
            
            // Selecionar a linha inteira
            range.setStart(container, lineStart);
            range.setEnd(container, lineEnd);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    
    // Lista não ordenada - Markdown padrão: - item (também pode ser * item ou + item)
    toggleUnorderedList() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        // Obter o texto selecionado
        const selectedText = selection.toString();
        
        // Verificar se o texto já está formatado como lista
        const lines = selectedText.split('\n');
        let isAlreadyList = lines.every(line => line.trim().startsWith('- '));
        
        if (isAlreadyList) {
            // Remover formatação de lista
            const newText = lines
                .map(line => line.trim().replace(/^- /, ''))
                .join('\n');
            
            this.replaceSelectedText(newText);
        } else {
            // Adicionar formatação de lista
            const newText = lines
                .filter(line => line.trim() !== '')
                .map(line => `- ${line.trim()}`)
                .join('\n');
            
            this.replaceSelectedText(newText);
        }
        
        // Salvar estado para histórico
        this.editor.history.saveState();
    }
    
    // Lista ordenada - Markdown padrão: 1. item
    toggleOrderedList() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        // Selecionar texto da linha atual ou texto selecionado
        this.selectLineOrParagraph();
        
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();
        
        // Verificar se o texto já está formatado como lista numerada
        const lines = selectedText.split('\n');
        let isAlreadyList = lines.every(line => /^\d+\.\s/.test(line.trim()));
        
        if (isAlreadyList) {
            // Remover formatação de lista
            const newText = lines
                .map(line => line.trim().replace(/^\d+\.\s/, ''))
                .join('\n');
            
            this.replaceSelectedText(newText);
        } else {
            // Adicionar formatação de lista numerada
            const newText = lines
                .filter(line => line.trim() !== '')
                .map((line, index) => `${index + 1}. ${line.trim()}`)
                .join('\n');
            
            this.replaceSelectedText(newText);
        }
        
        // Salvar estado para histórico
        this.editor.history.saveState();
    }
    
    // Lista de tarefas - GitHub Flavored Markdown: - [ ] tarefa ou - [x] tarefa concluída
    toggleTodoList() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        // Selecionar texto da linha atual ou texto selecionado
        this.selectLineOrParagraph();
        
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();
        
        // Verificar se o texto já está formatado como lista de tarefas
        const lines = selectedText.split('\n');
        let isAlreadyList = lines.every(line => line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]'));
        
        if (isAlreadyList) {
            // Remover formatação de lista de tarefas
            const newText = lines
                .map(line => line.trim().replace(/^- \[[ x]\]\s/, ''))
                .join('\n');
            
            this.replaceSelectedText(newText);
        } else {
            // Adicionar formatação de lista de tarefas
            const newText = lines
                .filter(line => line.trim() !== '')
                .map(line => `- [ ] ${line.trim()}`)
                .join('\n');
            
            this.replaceSelectedText(newText);
        }
        
        // Salvar estado para histórico
        this.editor.history.saveState();
    }
    
    // Citação (blockquote) - Markdown padrão: > texto
    toggleBlockquote() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        // Selecionar texto da linha atual ou texto selecionado
        this.selectLineOrParagraph();
        
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();
        
        // Verificar se o texto já está formatado como citação
        const lines = selectedText.split('\n');
        let isAlreadyQuote = lines.every(line => line.trim().startsWith('> '));
        
        if (isAlreadyQuote) {
            // Remover formatação de citação
            const newText = lines
                .map(line => line.trim().replace(/^> /, ''))
                .join('\n');
            
            this.replaceSelectedText(newText);
        } else {
            // Adicionar formatação de citação
            const newText = lines
                .filter(line => line.trim() !== '')
                .map(line => `> ${line.trim()}`)
                .join('\n');
            
            this.replaceSelectedText(newText);
        }
        
        // Salvar estado para histórico
        this.editor.history.saveState();
    }
    
    // Inserir linha horizontal - Markdown padrão: --- ou *** ou ___
    insertHorizontalRule() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        // Inserir texto para regra horizontal em markdown (---)
        const range = selection.getRangeAt(0);
        range.deleteContents(); // Limpar seleção atual
        
        // Inserir a regra horizontal em markdown
        const hrText = '\n---\n';
        const textNode = document.createTextNode(hrText);
        range.insertNode(textNode);
        
        // Mover o cursor para depois da regra horizontal
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Salvar estado para histórico
        this.editor.history.saveState();
    }
    
    // Bloco de código - Markdown padrão: ```linguagem
    insertCodeBlock() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        
        // Verificar se há texto selecionado
        const selectedText = selection.toString().trim();
        
        let codeBlockText;
        if (selectedText) {
            // Se há texto selecionado, envolvê-lo em backticks triplos
            codeBlockText = '\n```\n' + selectedText + '\n```\n';
        } else {
            // Se não há texto selecionado, criar um bloco vazio
            codeBlockText = '\n```\n\n```\n';
        }
        
        // Substituir seleção pelo bloco de código
        range.deleteContents();
        const textNode = document.createTextNode(codeBlockText);
        range.insertNode(textNode);
        
        // Se não há texto selecionado, posicionar o cursor dentro do bloco
        if (!selectedText) {
            // Encontrar a posição entre os backticks
            range.setStart(textNode, codeBlockText.indexOf('\n', 5) + 1);
            range.setEnd(textNode, codeBlockText.indexOf('\n', 5) + 1);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // Posicionar após o bloco de código
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        // Salvar estado para histórico
        this.editor.history.saveState();
    }
    
    // Inserir texto na posição atual do cursor
    insertText(text) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        
        // Mover o cursor para o final do texto inserido
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Salvar estado
        this.editor.history.saveState();
    }
    
    // Inserir link - Markdown padrão: [texto](url)
    insertLink(text, url) {
        if (!text || !url) return;
        this.insertText(`[${text}](${url})`);
    }
    
    // Inserir imagem - Markdown padrão: ![alt text](url)
    insertImage(altText, url) {
        if (!url) return;
        const alt = altText || 'Imagem';
        this.insertText(`![${alt}](${url})`);
    }
    
    // Inserir tabela simples - GitHub Flavored Markdown
    // Formato: | Cabeçalho 1 | Cabeçalho 2 |
    //          | ----------- | ----------- |
    //          | Conteúdo 1  | Conteúdo 2  |
    insertTable(rows = 2, cols = 3) {
        // Verificar se já há seleção para não duplicar conteúdo
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        if (rows < 1 || cols < 1) return;
        
        // Limpar seleção atual para evitar duplicação
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        let tableText = '\n';
        
        // Linha de cabeçalho
        tableText += '|';
        for (let i = 0; i < cols; i++) {
            tableText += ` Coluna ${i+1} |`;
        }
        tableText += '\n';
        
        // Linha de separação
        tableText += '|';
        for (let i = 0; i < cols; i++) {
            tableText += ' --- |';
        }
        tableText += '\n';
        
        // Linhas de dados
        for (let i = 0; i < rows; i++) {
            tableText += '|';
            for (let j = 0; j < cols; j++) {
                tableText += ` Dados |`;
            }
            tableText += '\n';
        }
        
        // Inserir texto da tabela
        const textNode = document.createTextNode(tableText);
        range.insertNode(textNode);
        
        // Atualizar seleção
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Salvar estado no histórico
        this.editor.history.saveState();
    }
    
    // Adicionar ênfase - útil para aplicar formatações aninhadas
    // Por exemplo: **texto *em itálico* dentro do negrito**
    addEmphasis(text, emphasisType) {
        if (!text) return text;
        
        switch (emphasisType) {
            case 'bold':
                return `**${text}**`;
            case 'italic':
                return `*${text}*`;
            case 'code':
                return `\`${text}\``;
            case 'strikethrough':
                return `~~${text}~~`;
            default:
                return text;
        }
    }
    
    // Escapar caracteres especiais do Markdown
    // Útil quando queremos mostrar caracteres literais como * ou #
    escapeMarkdown(text) {
        if (!text) return text;
        
        // Escapar caracteres especiais do Markdown
        return text.replace(/([\\`*_{}[\]()#+-.!])/g, '\\$1');
    }
}

export { MarkdownFormatter };
