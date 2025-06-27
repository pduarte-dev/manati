/**
 * MarkdownConverter - Converte entre Markdown e HTML visual
 * Suporta GitHub Flavored Markdown (GFM) e extensões comuns
 * Utiliza a mesma lógica do PreviewManager para garantir consistência
 */
class MarkdownConverter {
    constructor(editor) {
        this.editor = editor;
        
        // Obter referência ao PreviewManager se disponível
        this.previewManager = window.manatiEditor?.previewManager;
        
        // Configurar marked.js se disponível
        if (window.marked && typeof window.marked === 'function') {
            // Configurar opções personalizadas para o marked
            window.marked.setOptions({
                breaks: true,                // Respeitar quebras de linha
                gfm: true,                   // Usar GitHub Flavored Markdown
                headerIds: false,            // Não adicionar IDs aos cabeçalhos
                mangle: false,               // Não codificar caracteres em emails
                sanitize: false,             // Não sanitizar (usaremos DOMPurify)
                smartLists: true,            // Detectar listas automaticamente
                smartypants: false           // Não usar tipografia elegante
            });
        }
    }

    /**
     * Converte Markdown para HTML visual (WYSIWYG)
     * Usa a mesma lógica do PreviewManager para garantir consistência
     */
    markdownToVisualHTML(markdown) {
        if (!markdown || typeof markdown !== 'string') return '';
        
        try {
            // Se tivermos acesso ao PreviewManager, usar sua lógica de conversão
            if (this.previewManager) {
                // Vamos obter o HTML diretamente do método do PreviewManager
                // mas sem atualizar o container de preview
                if (typeof marked !== 'undefined') {
                    const html = marked.parse(markdown, {
                        breaks: true,
                        gfm: true,
                        mangle: false,
                        headerIds: false
                    });
                    return this.processVisualElements(html);
                } else {
                    return this.processVisualElements(this.simpleMarkdownToHtml(markdown));
                }
            }
            
            // Fallback: usar a biblioteca marked.js disponível globalmente
            if (window.marked && typeof window.marked === 'function') {
                let html = window.marked(markdown);
                
                // Sanitizar HTML para evitar scripts maliciosos
                if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
                    html = window.DOMPurify.sanitize(html);
                }
                
                // Processar classes especiais e atributos
                html = this.processVisualElements(html);
                
                return html;
            }
            
            // Segundo fallback: usar método simplificado interno
            return this.simpleMarkdownToHtml(markdown);
        } catch (error) {
            console.error('Erro ao converter Markdown para HTML:', error);
            // Em caso de erro, retornar texto original para evitar perda de dados
            return this.escapeHtml(markdown);
        }
    }

    /**
     * Converte HTML visual de volta para Markdown
     */
    visualHTMLToMarkdown(html) {
        if (!html || typeof html !== 'string') return '';

        try {
            // Criar elemento temporário para manipulação
            const temp = document.createElement('div');
            temp.innerHTML = html;

            // Processar elementos comuns de HTML para Markdown
            this.processHeadings(temp);
            this.processParagraphs(temp);
            this.processLists(temp);
            this.processLinks(temp);
            this.processImages(temp);
            this.processFormatting(temp);
            this.processBlockquotes(temp);
            this.processCodeBlocks(temp);
            this.processTables(temp);
            
            // Obter texto final e limpar
            let markdown = temp.innerHTML
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/?[^>]+(>|$)/g, ''); // Remover tags HTML restantes
            
            // Normalizar espaços e quebras de linha
            markdown = this.decodeHtmlEntities(markdown)
                .replace(/\n\s*\n\s*\n+/g, '\n\n')  // Múltiplas quebras -> dupla
                .replace(/^\s+|\s+$/g, '')          // Espaços no início/fim
                .trim();

            return markdown;
        } catch (error) {
            console.error('Erro ao converter HTML para Markdown:', error);
            // Em caso de erro, tentar extrair texto puro para evitar perda de dados
            return this.extractTextContent(html);
        }
    }

    /**
     * Adiciona classes e atributos específicos para melhorar a visualização
     */
    processVisualElements(html) {
        // Adicionar classes para controle visual
        return html
            // Adicionar classes às listas de tarefas
            .replace(/<li>\s*<input type="checkbox"/g, '<li class="task-list-item"><input type="checkbox"')
            
            // Adicionar classes aos blocos de código
            .replace(/<pre><code class="language-([^"]+)">/g, '<pre class="code-block"><code class="language-$1">')
            .replace(/<pre><code>/g, '<pre class="code-block"><code>')
            
            // Adicionar classes às tabelas
            .replace(/<table>/g, '<table class="markdown-table">');
    }

    /**
     * Método de segurança para escapar HTML
     */
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Método de segurança para extrair texto puro do HTML
     */
    extractTextContent(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    /**
     * Conversão básica de Markdown para HTML
     * Usado como fallback se marked.js não estiver disponível
     */
    basicMarkdownToHTML(markdown) {
        if (!markdown) return '';
        
        let html = this.escapeHtml(markdown)
            
            // Headers
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
            .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
            .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
            
            // Formatação de texto
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            
            // Imagens
            .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
            
            // Listas
            .replace(/^\s*\*\s(.*$)/gm, '<li>$1</li>')
            .replace(/^\s*-\s(.*$)/gm, '<li>$1</li>')
            .replace(/^\s*\d+\.\s(.*$)/gm, '<li>$1</li>')
            
            // Citações
            .replace(/^\>\s(.*$)/gm, '<blockquote>$1</blockquote>')
            
            // Quebras de linha
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
            
        // Embrulhar em parágrafos
        html = '<p>' + html + '</p>';
        
        // Limpar parágrafos vazios e outros ajustes
        html = html
            .replace(/<p><\/p>/g, '')
            .replace(/<p><(h[1-6]|ul|ol|blockquote)/g, '<$1')
            .replace(/<\/(h[1-6]|ul|ol|blockquote)><\/p>/g, '</$1>');
            
        return html;
    }

    /**
     * Conversão simples de markdown para HTML (copiado do PreviewManager)
     * Usado como fallback quando marked.js não está disponível
     */
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
            .replace(/~~(.*?)~~/g, '<del>$1</del>') // Adicional: Tachado
            
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            
            // Imagens
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%;">')
            
            // Listas não ordenadas (Adicional)
            .replace(/^\s*[\*\-\+]\s+(.*)/gm, '<ul><li>$1</li></ul>')
            .replace(/<\/ul>\s*<ul>/g, '')
            
            // Listas ordenadas (Adicional)
            .replace(/^\s*\d+\.\s+(.*)/gm, '<ol><li>$1</li></ol>')
            .replace(/<\/ol>\s*<ol>/g, '')
            
            // Quebras de linha
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            
            // Envolver em parágrafos
            .replace(/^(.+)$/, '<p>$1</p>');
    }

    /**
     * Processa cabeçalhos (h1-h6) no DOM para voltar para Markdown
     */
    processHeadings(element) {
        const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            const level = parseInt(heading.tagName.substring(1));
            const hashes = '#'.repeat(level);
            const text = heading.textContent;
            const p = document.createElement('p');
            p.textContent = `${hashes} ${text}`;
            heading.parentNode.replaceChild(p, heading);
        });
    }

    /**
     * Processa parágrafos no DOM para voltar para Markdown
     */
    processParagraphs(element) {
        const paragraphs = element.querySelectorAll('p');
        paragraphs.forEach(p => {
            // Substituir cada parágrafo por seu conteúdo seguido de duas quebras de linha
            const textNode = document.createTextNode(p.innerHTML + '\n\n');
            p.parentNode.replaceChild(textNode, p);
        });
    }

    /**
     * Processa listas no DOM para voltar para Markdown
     */
    processLists(element) {
        // Processar listas não ordenadas
        const uls = element.querySelectorAll('ul');
        uls.forEach(ul => {
            const items = ul.querySelectorAll('li');
            const fragment = document.createDocumentFragment();
            
            items.forEach(item => {
                const isTaskItem = item.classList.contains('task-list-item');
                const checkbox = item.querySelector('input[type="checkbox"]');
                
                let prefix = '- ';
                if (isTaskItem) {
                    const isChecked = checkbox && checkbox.checked;
                    prefix = isChecked ? '- [x] ' : '- [ ] ';
                    
                    // Remover o checkbox
                    if (checkbox) {
                        item.removeChild(checkbox);
                    }
                }
                
                const text = item.innerHTML;
                const p = document.createElement('p');
                p.textContent = prefix + text + '\n';
                fragment.appendChild(p);
            });
            
            ul.parentNode.replaceChild(fragment, ul);
        });
        
        // Processar listas ordenadas
        const ols = element.querySelectorAll('ol');
        ols.forEach(ol => {
            const items = ol.querySelectorAll('li');
            const fragment = document.createDocumentFragment();
            
            items.forEach((item, index) => {
                const text = item.innerHTML;
                const p = document.createElement('p');
                p.textContent = `${index + 1}. ${text}\n`;
                fragment.appendChild(p);
            });
            
            ol.parentNode.replaceChild(fragment, ol);
        });
    }

    /**
     * Processa links no DOM para voltar para Markdown
     */
    processLinks(element) {
        const links = element.querySelectorAll('a');
        links.forEach(link => {
            const text = link.textContent;
            const href = link.getAttribute('href');
            const markdown = `[${text}](${href})`;
            const textNode = document.createTextNode(markdown);
            link.parentNode.replaceChild(textNode, link);
        });
    }

    /**
     * Processa imagens no DOM para voltar para Markdown
     */
    processImages(element) {
        const images = element.querySelectorAll('img');
        images.forEach(img => {
            const alt = img.getAttribute('alt') || '';
            const src = img.getAttribute('src') || '';
            const markdown = `![${alt}](${src})`;
            const textNode = document.createTextNode(markdown);
            img.parentNode.replaceChild(textNode, img);
        });
    }

    /**
     * Processa formatação de texto no DOM para voltar para Markdown
     */
    processFormatting(element) {
        // Negrito
        const bolds = element.querySelectorAll('strong, b');
        bolds.forEach(bold => {
            const text = bold.textContent;
            const markdown = `**${text}**`;
            const textNode = document.createTextNode(markdown);
            bold.parentNode.replaceChild(textNode, bold);
        });
        
        // Itálico
        const italics = element.querySelectorAll('em, i');
        italics.forEach(italic => {
            const text = italic.textContent;
            const markdown = `*${text}*`;
            const textNode = document.createTextNode(markdown);
            italic.parentNode.replaceChild(textNode, italic);
        });
        
        // Tachado
        const strokes = element.querySelectorAll('del, s');
        strokes.forEach(stroke => {
            const text = stroke.textContent;
            const markdown = `~~${text}~~`;
            const textNode = document.createTextNode(markdown);
            stroke.parentNode.replaceChild(textNode, stroke);
        });
        
        // Código inline
        const codes = element.querySelectorAll('code:not(pre code)');
        codes.forEach(code => {
            const text = code.textContent;
            const markdown = `\`${text}\``;
            const textNode = document.createTextNode(markdown);
            code.parentNode.replaceChild(textNode, code);
        });
    }

    /**
     * Processa citações no DOM para voltar para Markdown
     */
    processBlockquotes(element) {
        const quotes = element.querySelectorAll('blockquote');
        quotes.forEach(quote => {
            const text = quote.innerHTML;
            const lines = text.split('<br>');
            const markdown = lines.map(line => `> ${line}`).join('\n');
            const p = document.createElement('p');
            p.textContent = markdown + '\n\n';
            quote.parentNode.replaceChild(p, quote);
        });
    }

    /**
     * Processa blocos de código no DOM para voltar para Markdown
     */
    processCodeBlocks(element) {
        const pres = element.querySelectorAll('pre');
        pres.forEach(pre => {
            const code = pre.querySelector('code');
            if (code) {
                const text = code.textContent;
                let lang = '';
                
                // Verificar se há classe de linguagem
                const langClass = Array.from(code.classList).find(cls => cls.startsWith('language-'));
                if (langClass) {
                    lang = langClass.substring(9); // Remover 'language-'
                }
                
                const markdown = `\`\`\`${lang}\n${text}\n\`\`\`\n\n`;
                const p = document.createElement('p');
                p.textContent = markdown;
                pre.parentNode.replaceChild(p, pre);
            }
        });
    }

    /**
     * Processa tabelas no DOM para voltar para Markdown
     */
    processTables(element) {
        const tables = element.querySelectorAll('table');
        tables.forEach(table => {
            let markdown = '\n';
            
            // Processar cabeçalhos
            const headers = table.querySelectorAll('th');
            if (headers.length > 0) {
                markdown += '|';
                headers.forEach(header => {
                    markdown += ` ${header.textContent} |`;
                });
                markdown += '\n|';
                
                // Linha de separação
                headers.forEach(() => {
                    markdown += ' --- |';
                });
                markdown += '\n';
            }
            
            // Processar linhas de dados
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                // Pular linha de cabeçalho se já processada
                if (row.querySelector('th')) return;
                
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    markdown += '|';
                    cells.forEach(cell => {
                        markdown += ` ${cell.textContent} |`;
                    });
                    markdown += '\n';
                }
            });
            
            markdown += '\n';
            
            const p = document.createElement('p');
            p.textContent = markdown;
            table.parentNode.replaceChild(p, table);
        });
    }

    /**
     * Decodifica entidades HTML
     */
    decodeHtmlEntities(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }
}

export { MarkdownConverter };
