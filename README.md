# 🦌 Manati - Editor de Markdown

Editor de markdown moderno e intuitivo com interface visual e modo escuro/claro.

## 🏗️ Arquitetura Modular

- Arquitetura modular com separação de responsabilidades
- Melhor manutenibilidade e escalabilidade  
- TypeScript + ES Modules
- Componentes HTML reutilizáveis
- **Versão limpa e organizada** (limpeza finalizada em 12/06/2025)

## ✨ Características

- **Editor Visual WYSIWYG** - Edite sem conhecer markdown
- **Editor de Código** - Para quem prefere markdown puro
- **Preview em Tempo Real** - Visualize suas alterações instantaneamente
- **Upload de Arquivos** - Suporte a imagens e anexos
- **Tema Escuro/Claro** - Interface adaptável
- **Explorador de Arquivos** - Navegue e organize seus documentos
- **Layout Responsivo** - Funciona em desktop e mobile

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd manati
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente (opcional):
```bash
cp .env.example .env
# Edite o arquivo .env conforme necessário
```

4. Execute em modo desenvolvimento:
```bash
npm run dev
```

5. Acesse: http://localhost:3000

## 📁 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Porta do servidor (padrão: 3000)
PORT=3000

# Diretório raiz para arquivos markdown (padrão: ./markdown-files)
MARKDOWN_ROOT_DIR=./markdown-files

# Diretório para uploads de arquivos e imagens (padrão: ./uploads)
UPLOADS_DIR=./uploads
```

## 🛠️ Scripts

### Versão Modular (Recomendada)
- `npm run dev:modular` - Executa versão modular em desenvolvimento
- `npm run build:modular` - Compila a versão modular
- `npm run start:modular` - Executa versão modular em produção

### Versão Monolítica (Legacy)
- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Compila o projeto
- `npm start` - Executa em modo produção

## 📂 Estrutura do Projeto

### Versão Modular
```
manati/
├── src/                    # Backend TypeScript modular
│   ├── config/            # Configurações
│   ├── services/          # Serviços de negócio
│   ├── routes/            # Rotas da API
│   ├── utils/             # Utilitários
│   ├── app.ts             # Configuração Express
│   └── index-modular.ts   # Ponto de entrada modular
├── public/                # Frontend
│   ├── components/        # Componentes HTML
│   ├── js/modules/        # Módulos JavaScript
│   ├── index-modular.html # HTML modular
│   └── css/               # Estilos
├── markdown-files/        # Arquivos markdown
└── uploads/               # Arquivos enviados
```

### Versão Monolítica (Legacy)
```
manati/
├── src/                    # Código TypeScript do servidor
│   └── index.ts           # Servidor Express monolítico
├── public/                # Arquivos estáticos
│   ├── js/                # JavaScript do cliente
│   ├── css/               # Estilos CSS
│   └── index.html         # Interface principal
├── public/                # Arquivos estáticos
│   ├── assets/           # Imagens e logos
│   ├── css/              # Estilos CSS
│   ├── js/               # Scripts JavaScript
│   └── index.html        # Página principal
├── markdown-files/        # Arquivos markdown (criado automaticamente)
├── uploads/              # Arquivos enviados (criado automaticamente)
├── dist/                 # Código compilado (criado automaticamente)
└── ...
```

## 🎯 Como Usar

1. **Criar Novo Arquivo**: Clique em "Novo" na barra superior
2. **Explorar Arquivos**: Use a sidebar esquerda para navegar
3. **Edição Visual**: Use a aba "Visual" para edição WYSIWYG
4. **Edição Markdown**: Use a aba "Markdown" para código puro
5. **Preview**: Use a aba "Preview" para visualizar o resultado
6. **Upload**: Use os botões da toolbar para inserir imagens e arquivos
7. **Salvar**: Ctrl+S ou botão "Salvar" na barra superior

## 🌐 API Endpoints

- `GET /api/files` - Lista arquivos e pastas
- `GET /api/file/:path` - Lê conteúdo de um arquivo
- `POST /api/file/:path` - Salva conteúdo de um arquivo
- `DELETE /api/file/:path` - Remove um arquivo
- `POST /api/folder` - Cria uma nova pasta
- `POST /api/upload` - Upload de arquivo único
- `POST /api/upload-multiple` - Upload de múltiplos arquivos
- `POST /api/preview` - Converte markdown para HTML

## 🎨 Temas

O editor suporta temas claro e escuro:

- **Tema Claro**: Interface padrão clara
- **Tema Escuro**: Interface escura para trabalho noturno

Altere clicando no ícone do sol/lua na barra superior.

## 📝 Atalhos de Teclado

- `Ctrl+S` - Salvar arquivo
- `Ctrl+B` - Negrito (editor visual)
- `Ctrl+I` - Itálico (editor visual)
- `Ctrl+U` - Sublinhado (editor visual)

## 🔧 Desenvolvimento

### Tecnologias Utilizadas

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Bootstrap 5
- **Icons**: Bootstrap Icons
- **File Upload**: Multer
- **Markdown**: Marked.js

### Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

## 🦌 Sobre o Nome

"Manati" é uma referência ao peixe-boi (manatee em inglês), um animal pacífico e amigável, assim como este editor pretende ser: simples, intuitivo e acessível para todos.
