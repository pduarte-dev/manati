# 🎯 Guia do Editor Manati - Dicas e Truques

Este guia contém dicas específicas para usar o Editor Manati de forma mais eficiente e produtiva.

## 📋 Índice

1. [Interface do Editor](#interface-do-editor)
2. [Atalhos de Teclado](#atalhos-de-teclado)
3. [Editor Visual](#editor-visual)
4. [Gerenciamento de Arquivos](#gerenciamento-de-arquivos)
5. [Upload de Arquivos](#upload-de-arquivos)
6. [Temas e Personalização](#temas-e-personalização)
7. [Dicas de Produtividade](#dicas-de-produtividade)
8. [Solução de Problemas](#solução-de-problemas)

---

## 🖥️ Interface do Editor

### Área Principal
O Editor Manati possui três abas principais:

#### 📖 **Preview**
- Visualização em tempo real do markdown
- Atualização automática conforme você digita
- Ideal para verificar a formatação final

#### 🎨 **Visual**
- Editor WYSIWYG (What You See Is What You Get)
- Toolbar com botões de formatação
- Ideal para usuários menos familiarizados com markdown

#### ✏️ **Markdown**
- Editor de texto puro com sintaxe markdown
- Font monospace para melhor legibilidade
- Ideal para usuários avançados

### Sidebar - Explorador de Arquivos
- **Nova Pasta**: Criar pastas para organização
- **Navegação**: Clique duplo para abrir arquivos
- **Menu de Contexto**: Clique direito para ações rápidas
- **Exclusão**: Botão aparece ao passar o mouse

---

## ⌨️ Atalhos de Teclado

### Editor Visual
| Atalho | Função |
|--------|--------|
| `Ctrl + B` | **Negrito** |
| `Ctrl + I` | *Itálico* |
| `Ctrl + U` | <u>Sublinhado</u> |
| `Ctrl + Z` | Desfazer |
| `Ctrl + Y` | Refazer |
| `Ctrl + Shift + Z` | Refazer (alternativo) |

### Editor Markdown
| Atalho | Função |
|--------|--------|
| `Ctrl + S` | Salvar arquivo |
| `Ctrl + Z` | Desfazer |
| `Ctrl + Y` | Refazer |
| `Tab` | Indentação |
| `Shift + Tab` | Remover indentação |

### Navegação Geral
| Atalho | Função |
|--------|--------|
| `Ctrl + N` | Novo arquivo |
| `F5` | Atualizar preview |

---

## 🎨 Editor Visual

### Toolbar Explicada

#### Formatação de Texto
- **B**: Negrito (`**texto**`)
- **I**: Itálico (`*texto*`)
- **U**: Sublinhado (`<u>texto</u>`)

#### Cabeçalhos
- **H1**: Título principal (`# Título`)
- **H2**: Subtítulo (`## Subtítulo`)
- **H3**: Sub-subtítulo (`### Sub-subtítulo`)

#### Listas
- **🔢**: Lista numerada (`1. Item`)
- **•**: Lista não ordenada (`- Item`)

#### Elementos Especiais
- **💬**: Citação (`> Texto`)
- **🔗**: Inserir link
- **🖼️**: Inserir imagem
- **📎**: Anexar arquivo
- **📋**: Inserir tabela

#### Código
- **`<>`**: Código inline (`` `código` ``)
- **📄**: Bloco de código (````código````)

### Dicas do Editor Visual

#### ✅ **Conversão Automática**
- Digite `# ` no início da linha para H1
- Digite `## ` no início da linha para H2
- Digite `- ` no início da linha para lista
- Digite `> ` no início da linha para citação

#### ✅ **Seleção e Formatação**
- Selecione texto e clique nos botões da toolbar
- Clique novamente para remover formatação (toggle)
- Use Ctrl+click para aplicar múltiplas formatações

#### ✅ **Navegação**
- Use setas para navegar
- Ctrl+A para selecionar tudo
- Duplo clique para selecionar palavra

---

## 📁 Gerenciamento de Arquivos

### Criar Arquivos
1. Clique em **"Nova Pasta"** para criar estrutura
2. Digite o nome (extensão `.md` é adicionada automaticamente)
3. Arquivo é criado com template básico

### Organizar Estrutura
```
projeto/
├── docs/
│   ├── guias/
│   │   ├── inicio.md
│   │   └── avancado.md
│   └── referencia.md
├── recursos/
│   ├── imagens/
│   └── downloads/
└── readme.md
```

### Boas Práticas de Nomenclatura
- Use nomes descritivos: `guia-instalacao.md`
- Evite espaços: `meu arquivo.md` → `meu-arquivo.md`
- Use minúsculas para consistência
- Organize em pastas temáticas

### Navegação Rápida
- **Busca**: Use Ctrl+F no navegador para buscar arquivos
- **Breadcrumb**: Acompanhe sua localização atual
- **Histórico**: O editor lembra o último arquivo aberto

---

## 📤 Upload de Arquivos

### Imagens Suportadas
- **Formatos**: JPG, PNG, GIF, WebP, SVG, BMP, TIFF
- **Tamanho máximo**: 10MB por arquivo
- **Otimização**: Imagens são armazenadas na pasta `uploads/`

### Como Inserir Imagens
1. **Via Editor Visual**: Clique no ícone 🖼️
2. **Via Drag & Drop**: Arraste a imagem para o editor
3. **Via Markdown**: `![alt text](caminho/imagem.jpg)`

### Documentos Suportados
- **Documentos**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Texto**: TXT, MD
- **Compactados**: ZIP, RAR, 7Z

### Dicas de Upload
- **Organize por pastas**: Crie estrutura lógica
- **Use nomes descritivos**: `diagrama-arquitetura.png`
- **Otimize tamanhos**: Comprima imagens grandes
- **Verifique links**: Teste após inserir

---

## 🎨 Temas e Personalização

### Temas Disponíveis
- **Claro**: Tema padrão, ideal para uso diurno
- **Escuro**: Reduz cansaço visual, ideal para uso noturno
- **Auto**: Segue configuração do sistema

### Personalização de Interface
- **Fonte do Editor**: Consolas, Monaco, Courier New
- **Tamanho da Sidebar**: Redimensionável
- **Zoom**: Use Ctrl+Plus/Minus no navegador

### Configuração de Debug
- **Console**: Pressione F12 para ver logs
- **Debug Mode**: Configure `LOG_DEBUG=true` no localStorage
- **Performance**: Monitore uso de memória em documentos grandes

---

## 🚀 Dicas de Produtividade

### Fluxo de Trabalho Eficiente

#### 📝 **Planejamento**
1. Crie estrutura de pastas primeiro
2. Use arquivo `README.md` como índice
3. Defina templates para documentos recorrentes

#### ✍️ **Escrita**
1. **Comece no Editor Visual** se não conhece markdown
2. **Mude para Markdown** conforme ganha experiência
3. **Use Preview** para verificar resultado final

#### 🔄 **Revisão**
1. Use as três abas para diferentes perspectivas
2. Verifique formatação no Preview
3. Teste links e imagens antes de finalizar

### Templates Úteis

#### 📄 **Template de Documento**
```markdown
# Título do Documento

## Visão Geral
Breve descrição do documento.

## Índice
1. [Seção 1](#seção-1)
2. [Seção 2](#seção-2)

## Seção 1
Conteúdo da seção.

## Seção 2
Conteúdo da seção.

## Conclusão
Resumo e próximos passos.

---
*Criado em: [Data]*
*Autor: [Nome]*
```

#### 📋 **Template de Meeting Notes**
```markdown
# Meeting Notes - [Data]

## 👥 Participantes
- [ ] Pessoa 1
- [ ] Pessoa 2

## 📋 Agenda
1. Item 1
2. Item 2

## 📝 Discussões

### Tópico 1
- Ponto importante
- Decisão tomada

## ✅ Action Items
- [ ] Tarefa 1 - Responsável: @pessoa
- [ ] Tarefa 2 - Responsável: @pessoa

## 📅 Próximos Passos
- [ ] Agendar follow-up
- [ ] Compartilhar documento
```

### Atalhos de Markdown Rápido

| Você quer | Digite | Resultado |
|-----------|--------|-----------|
| Título grande | `# Título` | # Título |
| Lista rápida | `- item` + Enter | Lista automática |
| Código inline | `` `código` `` | `código` |
| Link rápido | `[texto](url)` | [texto](url) |
| Negrito rápido | `**texto**` | **texto** |
| Itálico rápido | `*texto*` | *texto* |

---

## 🔧 Solução de Problemas

### Problemas Comuns

#### ❌ **Editor não carrega**
- **Verifique conexão**: Teste se o servidor está rodando
- **Limpe cache**: Ctrl+F5 para recarregar
- **Console**: F12 para ver erros JavaScript

#### ❌ **Arquivo não salva**
- **Permissões**: Verifique se tem acesso à pasta
- **Espaço em disco**: Verifique espaço disponível
- **Conexão**: Teste conectividade com servidor

#### ❌ **Preview não atualiza**
- **Recarregue página**: F5 ou Ctrl+R
- **Troque de aba**: Clique em outra aba e volte
- **Verifique sintaxe**: Erro de markdown pode quebrar preview

#### ❌ **Upload falha**
- **Tamanho**: Verifique se arquivo é menor que 10MB
- **Formato**: Confirme se formato é suportado
- **Nome**: Evite caracteres especiais no nome

### Debugging

#### 🔍 **Ativar Logs de Debug**
```javascript
// No console do navegador (F12)
localStorage.setItem('LOG_DEBUG', 'true');
// Recarregue a página
```

#### 🔍 **Verificar Estado do Editor**
```javascript
// No console do navegador
console.log(window.manatiEditor);
console.log(window.visualEditor);
```

#### 🔍 **Limpar Cache Local**
```javascript
// No console do navegador
localStorage.clear();
// Recarregue a página
```

### Performance

#### ⚡ **Otimização para Documentos Grandes**
- **Divida documentos**: Prefira múltiplos arquivos menores
- **Use links internos**: Para navegação entre seções
- **Otimize imagens**: Comprima antes de fazer upload
- **Limite de caracteres**: Considere ~50k caracteres por documento

#### ⚡ **Uso de Memória**
- **Feche abas não utilizadas**: No navegador
- **Recarregue periodicamente**: Para limpar memória
- **Monitore console**: F12 → Console para warnings

---

## 📞 Suporte e Recursos

### Documentação
- **Guia de Markdown**: `instrucoes/GUIA_MARKDOWN.md`
- **Este guia**: `instrucoes/GUIA_EDITOR_MANATI.md`
- **README principal**: `README.md`

### Configuração Técnica
- **Porta padrão**: 3000
- **Pasta de arquivos**: `markdown-files/`
- **Pasta de uploads**: `uploads/`
- **Configuração**: `.env`

### Logs e Debugging
- **Backend logs**: Terminais onde o servidor está rodando
- **Frontend logs**: Console do navegador (F12)
- **Configuração debug**: `LOG_DEBUG=true` no `.env`

---

## 🎉 Dicas Finais

### ✅ **Para Iniciantes**
1. Comece com o **Editor Visual**
2. Use os **botões da toolbar** até se familiarizar
3. Observe o **markdown gerado** para aprender
4. Pratique com documentos simples primeiro

### ✅ **Para Usuários Avançados**
1. Use principalmente o **Editor Markdown**
2. Aproveite os **atalhos de teclado**
3. Crie **templates personalizados**
4. Use **HTML inline** quando necessário

### ✅ **Para Equipes**
1. Definam **convenções de nomenclatura**
2. Usem **estrutura de pastas consistente**
3. Criem **templates compartilhados**
4. Documentem **processos específicos**

---

*Aproveite o Editor Manati e seja produtivo! 🚀*

---

*Última atualização: 12 de junho de 2025*
*Versão do Editor: 1.0.0*
