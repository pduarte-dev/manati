# 📝 Guia Completo de Markdown - Editor Manati

Este guia apresenta todas as tags e funcionalidades do Markdown suportadas pelo editor Manati, incluindo exemplos práticos e boas práticas.

## 📋 Índice

1. [Cabeçalhos](#cabeçalhos)
2. [Formatação de Texto](#formatação-de-texto)
3. [Listas](#listas)
4. [Links](#links)
5. [Imagens](#imagens)
6. [Código](#código)
7. [Tabelas](#tabelas)
8. [Citações](#citações)
9. [Linhas Horizontais](#linhas-horizontais)
10. [Quebras de Linha](#quebras-de-linha)
11. [Escape de Caracteres](#escape-de-caracteres)
12. [HTML Inline](#html-inline)
13. [Extensões Avançadas](#extensões-avançadas)
14. [Boas Práticas](#boas-práticas)

---

## 📝 Cabeçalhos

Use `#` para criar cabeçalhos. Quanto mais `#`, menor o nível do cabeçalho.

### Sintaxe:
```markdown
# Cabeçalho 1 (H1)
## Cabeçalho 2 (H2)
### Cabeçalho 3 (H3)
#### Cabeçalho 4 (H4)
##### Cabeçalho 5 (H5)
###### Cabeçalho 6 (H6)
```

### Resultado:
# Cabeçalho 1 (H1)
## Cabeçalho 2 (H2)
### Cabeçalho 3 (H3)
#### Cabeçalho 4 (H4)
##### Cabeçalho 5 (H5)
###### Cabeçalho 6 (H6)

### ✅ Boas Práticas:
- Use apenas um H1 por documento
- Mantenha hierarquia sequencial (não pule níveis)
- Deixe uma linha em branco antes e depois dos cabeçalhos
- Use cabeçalhos descritivos e concisos

---

## 🎨 Formatação de Texto

### Negrito
```markdown
**texto em negrito**
__texto em negrito__
```
**Resultado:** **texto em negrito**

### Itálico
```markdown
*texto em itálico*
_texto em itálico_
```
**Resultado:** *texto em itálico*

### Negrito + Itálico
```markdown
***texto em negrito e itálico***
___texto em negrito e itálico___
**_combinação_**
*__combinação__*
```
**Resultado:** ***texto em negrito e itálico***

### Riscado (Strikethrough)
```markdown
~~texto riscado~~
```
**Resultado:** ~~texto riscado~~

### Sublinhado
```markdown
<u>texto sublinhado</u>
```
**Resultado:** <u>texto sublinhado</u>

### Destaque/Mark
```markdown
==texto destacado==
<mark>texto destacado</mark>
```
**Resultado:** <mark>texto destacado</mark>

### ✅ Boas Práticas:
- Use `**` para negrito (mais comum que `__`)
- Use `*` para itálico (mais comum que `_`)
- Não abuse da formatação - use com moderação
- Seja consistente na escolha dos marcadores

---

## 📃 Listas

### Lista Não Ordenada
```markdown
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2
    - Sub-subitem 2.2.1
- Item 3

* Alternativa com asterisco
+ Alternativa com mais
```

**Resultado:**
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2
    - Sub-subitem 2.2.1
- Item 3

### Lista Ordenada
```markdown
1. Primeiro item
2. Segundo item
   1. Subitem 2.1
   2. Subitem 2.2
3. Terceiro item
```

**Resultado:**
1. Primeiro item
2. Segundo item
   1. Subitem 2.1
   2. Subitem 2.2
3. Terceiro item

### Lista de Tarefas (Checkbox)
```markdown
- [x] Tarefa concluída
- [ ] Tarefa pendente
- [x] Outra tarefa concluída
- [ ] Tarefa em aberto
```

**Resultado:**
- [x] Tarefa concluída
- [ ] Tarefa pendente
- [x] Outra tarefa concluída
- [ ] Tarefa em aberto

### ✅ Boas Práticas:
- Use 2 espaços para indentação de subitens
- Seja consistente com o marcador (`-`, `*`, ou `+`)
- Use listas ordenadas quando a sequência importa
- Use listas de tarefas para checklists

---

## 🔗 Links

### Link Simples
```markdown
[Texto do link](https://exemplo.com)
[Link com título](https://exemplo.com "Título que aparece no hover")
```

### Link de Referência
```markdown
[Texto do link][referencia]
[Outro link][1]

[referencia]: https://exemplo.com
[1]: https://google.com "Google"
```

### Link Automático
```markdown
<https://exemplo.com>
<email@exemplo.com>
```

### Link para Seções
```markdown
[Ir para Cabeçalhos](#cabeçalhos)
[Ir para Boas Práticas](#boas-práticas)
```

### ✅ Boas Práticas:
- Use textos descritivos para links (evite "clique aqui")
- Use links de referência para múltiplas ocorrências do mesmo link
- Teste sempre os links antes de publicar
- Use títulos em links quando necessário para contexto adicional

---

## 🖼️ Imagens

### Imagem Simples
```markdown
![Texto alternativo](caminho/para/imagem.jpg)
![Alt text](imagem.png "Título opcional")
```

### Imagem com Link
```markdown
[![Alt text](imagem.png)](https://link-destino.com)
```

### Imagem de Referência
```markdown
![Alt text][logo]

[logo]: imagem.png "Logo da empresa"
```

### Imagem HTML (para controle de tamanho)
```markdown
<img src="imagem.png" alt="Descrição" width="300" height="200">
```

### ✅ Boas Práticas:
- Sempre inclua texto alternativo descritivo
- Use imagens em formatos web (JPG, PNG, WebP, SVG)
- Otimize o tamanho das imagens
- Use caminhos relativos quando possível
- Considere a acessibilidade no texto alternativo

---

## 💻 Código

### Código Inline
```markdown
Use `código inline` para comandos ou variáveis.
```
**Resultado:** Use `código inline` para comandos ou variáveis.

### Bloco de Código Simples
```markdown
    Código com 4 espaços de indentação
    Segunda linha
```

### Bloco de Código com Sintaxe
````markdown
```javascript
function exemplo() {
    console.log("Olá mundo!");
    return true;
}
```

```python
def exemplo():
    print("Olá mundo!")
    return True
```

```html
<div class="container">
    <h1>Título</h1>
    <p>Parágrafo de exemplo</p>
</div>
```

```css
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}
```

```sql
SELECT u.nome, p.titulo 
FROM usuarios u 
INNER JOIN posts p ON u.id = p.usuario_id 
WHERE u.ativo = true;
```

```bash
#!/bin/bash
echo "Script de exemplo"
npm install
npm run build
```
````

### Linguagens Suportadas
- `javascript` / `js`
- `typescript` / `ts`
- `python` / `py`
- `html`
- `css`
- `scss` / `sass`
- `json`
- `xml`
- `sql`
- `bash` / `sh`
- `php`
- `java`
- `c` / `cpp`
- `csharp` / `cs`
- `ruby` / `rb`
- `go`
- `rust`
- `kotlin`
- `swift`
- `dart`
- `yaml` / `yml`
- `toml`
- `ini`
- `dockerfile`
- `markdown` / `md`

### ✅ Boas Práticas:
- Sempre especifique a linguagem para syntax highlighting
- Use código inline para elementos pequenos
- Use blocos para códigos de múltiplas linhas
- Inclua comentários explicativos quando necessário
- Mantenha o código bem formatado e legível

---

## 📊 Tabelas

### Tabela Básica
```markdown
| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Linha 1  | Dados 1  | Info 1   |
| Linha 2  | Dados 2  | Info 2   |
| Linha 3  | Dados 3  | Info 3   |
```

### Tabela com Alinhamento
```markdown
| Esquerda | Centro | Direita |
|:---------|:------:|--------:|
| Texto    | Texto  | Texto   |
| Longo    | Médio  | Curto   |
```

**Resultado:**
| Esquerda | Centro | Direita |
|:---------|:------:|--------:|
| Texto    | Texto  | Texto   |
| Longo    | Médio  | Curto   |

### Tabela com Formatação
```markdown
| Nome | **Função** | Status |
|------|------------|---------|
| João | *Designer* | ✅ Ativo |
| Maria | **Dev**    | ❌ Inativo |
| Pedro | `Admin`    | ⚠️ Pendente |
```

### ✅ Boas Práticas:
- Use `|` para separar colunas claramente
- Alinhe as colunas visualmente no código (opcional)
- Use alinhamento adequado (`:---`, `:---:`, `---:`)
- Mantenha cabeçalhos descritivos
- Evite tabelas muito largas (considere dividir)

---

## 💬 Citações

### Citação Simples
```markdown
> Esta é uma citação.
> Pode ter múltiplas linhas.
```

**Resultado:**
> Esta é uma citação.
> Pode ter múltiplas linhas.

### Citação Aninhada
```markdown
> Citação principal
> 
> > Citação aninhada
> > Segunda linha da citação aninhada
> 
> Voltando à citação principal
```

**Resultado:**
> Citação principal
> 
> > Citação aninhada
> > Segunda linha da citação aninhada
> 
> Voltando à citação principal

### Citação com Formatação
```markdown
> ## Título na Citação
> 
> Texto com **formatação** e *ênfase*.
> 
> - Lista dentro da citação
> - Segundo item
> 
> `Código` também funciona.
```

### ✅ Boas Práticas:
- Use citações para destacar trechos importantes
- Deixe linha em branco entre citação e texto normal
- Mantenha citações concisas e relevantes
- Use citações aninhadas com moderação

---

## ➖ Linhas Horizontais

```markdown
---
***
___
```

**Resultado:**
---

### ✅ Boas Práticas:
- Use `---` (mais comum)
- Deixe linhas em branco antes e depois
- Use com moderação para separar seções

---

## 📄 Quebras de Linha

### Quebra Simples
```markdown
Primeira linha  
Segunda linha (dois espaços no final da primeira)
```

### Parágrafo Novo
```markdown
Primeiro parágrafo.

Segundo parágrafo (linha em branco entre eles).
```

### Quebra HTML
```markdown
Primeira linha<br>
Segunda linha
```

---

## 🔤 Escape de Caracteres

Para exibir caracteres especiais literalmente, use `\`:

```markdown
\* Não é uma lista
\# Não é um cabeçalho
\` Não é código
\[Não é um link\]
\\ Mostra uma barra invertida
```

**Caracteres que precisam de escape:**
```
\ ` * _ { } [ ] ( ) # + - . !
```

---

## 🌐 HTML Inline

O Markdown suporta HTML quando necessário:

```markdown
<div class="destaque">
Conteúdo em HTML
</div>

<span style="color: red;">Texto colorido</span>

<details>
<summary>Clique para expandir</summary>
Conteúdo oculto que aparece ao clicar.
</details>

<kbd>Ctrl</kbd> + <kbd>C</kbd>

<sub>subscrito</sub> e <sup>sobrescrito</sup>
```

### ✅ Boas Práticas:
- Use HTML apenas quando o Markdown não for suficiente
- Mantenha HTML simples e semântico
- Teste a compatibilidade com diferentes renderizadores

---

## 🚀 Extensões Avançadas

### Emojis
```markdown
:smile: :heart: :thumbsup: :rocket: :fire:
😀 ❤️ 👍 🚀 🔥
```

### Notas de Rodapé
```markdown
Texto com nota[^1] e outra nota[^nota-importante].

[^1]: Esta é a primeira nota de rodapé.
[^nota-importante]: Esta é uma nota mais descritiva.
```

### Definições
```markdown
Termo 1
: Definição do termo 1

Termo 2
: Definição do termo 2
: Segunda definição do termo 2
```

### Abreviações
```markdown
HTML e CSS são linguagens fundamentais.

*[HTML]: HyperText Markup Language
*[CSS]: Cascading Style Sheets
```

### Matemática (LaTeX)
```markdown
Inline: $E = mc^2$

Bloco:
$$
\sum_{i=1}^{n} x_i = x_1 + x_2 + \ldots + x_n
$$
```

---

## ✅ Boas Práticas Gerais

### 📐 Estrutura e Organização
- **Use hierarquia lógica**: H1 para título principal, H2 para seções, etc.
- **Inclua um índice** em documentos longos
- **Mantenha consistência** na formatação
- **Use espaçamento adequado** entre seções

### 📝 Escrita
- **Seja claro e conciso** nos textos
- **Use listas** para organizar informações
- **Destaque informações importantes** com formatação
- **Inclua exemplos práticos** quando apropriado

### 🎯 Acessibilidade
- **Use texto alternativo descritivo** em imagens
- **Mantenha hierarquia de cabeçalhos**
- **Use listas para dados estruturados**
- **Evite depender apenas de cores** para informação

### 🔧 Técnicas
- **Use links de referência** para múltiplas ocorrências
- **Teste o markdown** em diferentes renderizadores
- **Mantenha linha de 80-100 caracteres** quando possível
- **Use quebras de linha consistentes**

### 📱 Responsividade
- **Evite tabelas muito largas**
- **Use imagens responsivas** quando necessário
- **Teste em diferentes tamanhos de tela**
- **Considere leitura em dispositivos móveis**

---

## 🔍 Ferramentas Úteis

### Editores Recomendados
- **Manati Editor** (este editor!)
- Typora
- Mark Text
- Obsidian
- Notion

### Validadores Online
- Dillinger.io
- StackEdit
- Markdown Editor
- HackMD

### Geradores
- Table Generator
- Emoji Cheat Sheet
- Markdown Tables Generator
- ASCII Art Generator

---

## 📚 Recursos Adicionais

### Especificações
- [CommonMark Spec](https://commonmark.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [Markdown Guide](https://www.markdownguide.org/)

### Cheat Sheets
- [Markdown Cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
- [GitHub Markdown](https://guides.github.com/features/mastering-markdown/)

---

## 🎉 Conclusão

Este guia cobre todas as funcionalidades principais do Markdown suportadas pelo Editor Manati. Use este documento como referência rápida e lembre-se das boas práticas para criar documentos bem estruturados e legíveis.

**Dica:** O Editor Manati suporta preview em tempo real - use-o para ver como seu markdown será renderizado enquanto escreve!

---

*Criado com ❤️ para o Editor Manati*
*Última atualização: 12 de junho de 2025*
