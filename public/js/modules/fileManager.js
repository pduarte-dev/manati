/**
 * Módulo para gerenciamento de arquivos e pastas
 */
export class FileManager {
    constructor() {
        this.currentPath = '';
        
        // Inicializar busca quando os componentes estiverem carregados
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeSearch();
        });
        
        // Se já estiver carregado, inicializar imediatamente
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(() => this.initializeSearch(), 100);
        }
    }

    async loadFileTree(path = '') {
        try {
            this.currentPath = path;
            const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
            const files = await response.json();
            
            const container = document.getElementById('fileTree');
            container.innerHTML = '';
            
            if (path) {
                // Adicionar botão "voltar"
                const backItem = document.createElement('div');
                backItem.className = 'file-item';
                backItem.innerHTML = '<i class="bi bi-arrow-left"></i> Voltar';
                backItem.addEventListener('click', () => {
                    const parentPath = path.split('/').slice(0, -1).join('/');
                    this.loadFileTree(parentPath);
                });
                container.appendChild(backItem);
            }

            files.forEach(file => {
                const item = document.createElement('div');
                item.className = `file-item ${file.isDirectory ? 'folder' : ''}`;
                
                // Determinar ícone baseado no tipo e status de lock
                let icon = file.isDirectory ? 'bi-folder' : 'bi-file-text';
                let lockClass = '';
                let lockTitle = '';
                
                // Se for arquivo e tiver informações de lock
                if (!file.isDirectory && file.locked && file.lock) {
                    const userInfo = window.manatiEditor.auth ? window.manatiEditor.auth.getUserInfo() : { id: null };
                    const isMyLock = file.lock.userId === userInfo.id;
                    
                    if (isMyLock) {
                        icon = 'bi-pencil-fill';
                        lockClass = 'text-success';
                        lockTitle = 'Você está editando este arquivo';
                        item.classList.add('file-locked', 'my-lock');
                    } else {
                        icon = 'bi-pencil-fill';
                        lockClass = 'text-warning';
                        lockTitle = `Sendo editado por: ${file.lock.userName}`;
                        item.classList.add('file-locked', 'other-lock');
                    }
                }
                
                const actions = `
                    <div class="file-actions">
                        <div class="file-dropdown">
                            <button class="file-menu-btn" onclick="window.manatiEditor.fileManager.toggleFileMenu(event, '${file.path}', '${file.name}', ${file.isDirectory})">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <div class="file-dropdown-content">
                                <button class="file-dropdown-item" onclick="window.manatiEditor.fileManager.${file.isDirectory ? 'renameFolder' : 'renameFile'}('${file.path}', '${file.name}')">
                                    <i class="bi bi-pencil"></i>
                                    Renomear
                                </button>
                                <button class="file-dropdown-item" onclick="window.manatiEditor.fileManager.${file.isDirectory ? 'moveFolder' : 'moveFile'}('${file.path}', '${file.name}', ${file.isDirectory})">
                                    <i class="bi bi-arrow-right"></i>
                                    Mover
                                </button>
                                <button class="file-dropdown-item danger" onclick="window.manatiEditor.fileManager.${file.isDirectory ? 'deleteFolder' : 'deleteFile'}('${file.path}')">
                                    <i class="bi bi-trash"></i>
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Para arquivos, mostrar título (se houver) e nome do arquivo
                let displayName;
                if (file.isDirectory) {
                    displayName = `<span class="file-name">${file.name}</span>`;
                } else {
                    if (file.title) {
                        displayName = `
                            <div class="file-display">
                                <span class="file-title">${file.title}</span>
                                <small class="file-filename text-muted">${file.name}</small>
                            </div>
                        `;
                    } else {
                        displayName = `<span class="file-name">${file.name}</span>`;
                    }
                }
                
                item.innerHTML = `
                    <i class="bi ${icon} ${lockClass}"></i>
                    ${displayName}
                    ${actions}
                `;
                
                // Adicionar título se houver informação de lock
                if (lockTitle) {
                    item.title = lockTitle;
                }
                
                // Adicionar data attributes para facilitar identificação
                if (!file.isDirectory) {
                    item.dataset.filePath = file.path;
                }
                item.dataset.fileName = file.name;
                item.dataset.isDirectory = file.isDirectory.toString();
                
                // Detectar se o nome é muito longo ou causa overflow
                setTimeout(() => {
                    const fileName = item.querySelector('.file-name');
                    if (fileName) {
                        // Verificar se o texto está fazendo overflow
                        const isOverflowing = fileName.scrollWidth > fileName.clientWidth;
                        const isLongName = file.name.length > 25;
                        
                        if (isOverflowing || isLongName) {
                            item.classList.add('long-name');
                        }
                    }
                }, 10);
                
                item.addEventListener('click', (e) => {
                    // Não executar se clicou nas ações
                    if (e.target.closest('.file-actions')) return;
                    
                    if (file.isDirectory) {
                        this.loadFileTree(file.path);
                    } else {
                        window.manatiEditor.loadFile(file.path);
                    }
                });
                
                container.appendChild(item);
            });
            
            // Atualizar ícones de lock após carregar a árvore
            if (window.manatiEditor.fileLock) {
                setTimeout(() => {
                    window.manatiEditor.fileLock.updateFileTreeIcons();
                }, 100);
            }
        } catch (error) {
            window.logger.error('Erro ao carregar árvore de arquivos:', error);
            window.manatiEditor.ui.showToast('Erro ao carregar arquivos', 'error');
        }
    }

    async loadFile(filePath) {
        try {
            // Liberar lock do arquivo anterior se existir
            if (window.manatiEditor.currentFile && window.manatiEditor.currentFile !== filePath) {
                await window.manatiEditor.fileLock.releaseLock(window.manatiEditor.currentFile);
            }
            
            const response = await fetch(`/api/file/${encodeURIComponent(filePath)}`);
            const data = await response.json();
            
            if (response.ok) {
                window.logger.debug('🔍 Definindo currentFile como:', filePath);
                window.manatiEditor.currentFile = filePath;
                document.getElementById('markdownEditor').value = data.content;
                document.getElementById('currentFileName').textContent = filePath;
                document.getElementById('fileInfo').style.display = 'block';
                
                // Verificar status de lock do arquivo (servidor + cache local)
                let canEdit = true;
                let lockMessage = '';
                let lockInfo = null;
                
                // Verificar lock no servidor
                if (data.locked && data.lock) {
                    lockInfo = data.lock;
                }
                
                // Verificar também no cache local (para simulações e casos edge)
                const localLock = window.manatiEditor.fileLock?.currentLocks?.get(filePath);
                if (localLock) {
                    lockInfo = localLock;
                }
                
                if (lockInfo) {
                    const userInfo = window.manatiEditor.auth.getUserInfo();
                    const isMyLock = lockInfo.userId === userInfo.id;
                    
                    if (!isMyLock) {
                        canEdit = false;
                        lockMessage = `Arquivo sendo editado por: ${lockInfo.userName}`;
                        window.manatiEditor.ui.showToast(lockMessage, 'warning');
                    }
                }
                
                if (canEdit) {
                    // Tentar adquirir lock para edição
                    const lockResult = await window.manatiEditor.fileLock.acquireLock(filePath);
                    
                    if (lockResult.success) {
                        // Habilitar edição
                        document.getElementById('markdownEditor').disabled = false;
                        
                        // Atualizar editor visual se estiver ativo
                        if (window.manatiEditor.activeEditor === 'visual' && window.visualEditor && typeof window.visualEditor.show === 'function') {
                            window.visualEditor.show(data.content, filePath);
                        } else if (window.visualEditor && typeof window.visualEditor.hide === 'function') {
                            window.visualEditor.hide();
                        }
                        
                        // Habilitar abas de edição
                        window.manatiEditor.ui.enableEditorTabs();
                    } else {
                        // Não foi possível adquirir lock - modo preview apenas
                        canEdit = false;
                        lockMessage = lockResult.error || 'Arquivo sendo editado por outro usuário';
                        window.manatiEditor.ui.showToast(lockMessage, 'warning');
                    }
                }
                
                if (!canEdit) {
                    // Modo preview apenas
                    document.getElementById('markdownEditor').disabled = true;
                    
                    // Ocultar editor visual
                    if (window.visualEditor && typeof window.visualEditor.hide === 'function') {
                        window.visualEditor.hide();
                    }
                    
                    // Desabilitar abas de edição e forçar preview
                    window.manatiEditor.ui.disableEditorTabs();
                    
                    // Forçar aba preview
                    const previewTab = document.querySelector('[data-bs-target="#preview"]');
                    if (previewTab) {
                        previewTab.click();
                    }
                }
                
                // Atualizar preview automaticamente
                window.manatiEditor.preview.updatePreview();
                
                window.manatiEditor.hasUnsavedChanges = false;
                window.manatiEditor.ui.updateSaveButton();
                this.highlightCurrentFile();
                
                // Mostrar controles do documento
                window.manatiEditor.ui.showDocumentControls();
                
                // Atualizar ícones da árvore de arquivos
                if (window.manatiEditor.fileLock) {
                    window.manatiEditor.fileLock.updateFileTreeIcons();
                }
            } else {
                window.manatiEditor.ui.showToast(data.error, 'error');
            }
        } catch (error) {
            window.logger.error('Erro ao carregar arquivo:', error);
            window.manatiEditor.ui.showToast('Erro ao carregar arquivo', 'error');
        }
    }

    async saveFile() {
        if (!window.manatiEditor.currentFile) return;

        try {
            let content;
            if (window.manatiEditor.activeEditor === 'visual' && window.visualEditor && typeof window.visualEditor.getMarkdownContent === 'function') {
                content = window.visualEditor.getMarkdownContent();
            } else {
                content = document.getElementById('markdownEditor').value;
            }

            const response = await fetch(`/api/file/${encodeURIComponent(window.manatiEditor.currentFile)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            const data = await response.json();
            
            if (response.ok) {
                window.manatiEditor.hasUnsavedChanges = false;
                window.manatiEditor.ui.updateSaveButton();
                window.manatiEditor.ui.showToast('Arquivo salvo com sucesso!', 'success');
                
                window.logger.debug('🔄 Arquivo salvo, chamando GitManager...');
                window.logger.debug('📁 Arquivo:', window.manatiEditor.currentFile);
                window.logger.debug('🔧 GitManager existe:', !!window.manatiEditor.git);
                
                // Marcar arquivo como modificado no GitManager
                if (window.manatiEditor.git) {
                    window.logger.debug('✅ Chamando markFileAsModified...');
                    window.manatiEditor.git.markFileAsModified(window.manatiEditor.currentFile);
                } else {
                    window.logger.error('❌ GitManager não encontrado!');
                }
                
                // Atualizar ícones de lock após salvar
                if (window.manatiEditor.fileLock) {
                    window.manatiEditor.fileLock.updateFileTreeIcons();
                }
            } else {
                window.manatiEditor.ui.showToast(data.error, 'error');
            }
        } catch (error) {
            window.logger.error('Erro ao salvar arquivo:', error);
            window.manatiEditor.ui.showToast('Erro ao salvar arquivo', 'error');
        }
    }

    async deleteFile(filePath) {
        // Fechar menu dropdown
        document.querySelectorAll('.file-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
        const confirmed = await window.manatiEditor.ui.showConfirm(
            'Excluir Arquivo',
            `Tem certeza que deseja excluir "${filePath}"?`,
            'Excluir',
            'Cancelar'
        );
        
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/file/${encodeURIComponent(filePath)}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (response.ok) {
                window.logger.debug('✅ Arquivo excluído com sucesso do filesystem:', filePath);
                this.loadFileTree(this.currentPath);
                
                // Se o arquivo excluído era o atual, limpar todos os editores
                if (window.manatiEditor.currentFile === filePath) {
                    this.clearAllEditors();
                }
                
                // 🗑️ Marcar arquivo como excluído no Git se for um arquivo .md
                window.logger.debug('🔍 Verificando se deve marcar no Git...');
                window.logger.debug('🔍 Arquivo termina com .md:', filePath.endsWith('.md'));
                window.logger.debug('🔍 window.manatiEditor existe:', !!window.manatiEditor);
                window.logger.debug('🔍 window.manatiEditor.git existe:', !!window.manatiEditor.git);
                
                if (filePath.endsWith('.md') && window.manatiEditor.git) {
                    window.logger.debug('🗑️ Marcando arquivo como excluído no Git:', filePath);
                    window.logger.debug('🗑️ GitManager disponível:', !!window.manatiEditor.git);
                    window.logger.debug('🗑️ Git disponível:', window.manatiEditor.git.isGitAvailable);
                    window.manatiEditor.git.markFileAsDeleted(filePath);
                } else {
                    window.logger.debug('⚠️ Não marcando no Git. Condições:', {
                        isMarkdown: filePath.endsWith('.md'),
                        hasManatiEditor: !!window.manatiEditor,
                        hasGitManager: !!window.manatiEditor?.git
                    });
                }
                
                window.manatiEditor.ui.showToast('Arquivo excluído com sucesso!', 'success');
            } else {
                window.manatiEditor.ui.showToast(data.error, 'error');
            }
        } catch (error) {
            window.logger.error('Erro ao excluir arquivo:', error);
            window.manatiEditor.ui.showToast('Erro ao excluir arquivo', 'error');
        }
    }

    async createNewFile(fileName) {
        if (!fileName) return;

        // Remover .md se o usuário digitou, para evitar .md.md
        const cleanFileName = fileName.replace(/\.md$/i, '');
        
        // Criar caminho completo baseado no diretório atual
        const fullPath = this.currentPath ? `${this.currentPath}/${cleanFileName}` : cleanFileName;
        const finalPath = `${fullPath}.md`;
        
        try {
            const response = await fetch(`/api/file/${encodeURIComponent(finalPath)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: `# ${cleanFileName}\n\nComece a escrever aqui...` })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.loadFileTree(this.currentPath);
                this.loadFile(finalPath);
                window.manatiEditor.ui.showToast('Arquivo criado com sucesso!', 'success');
            } else {
                window.manatiEditor.ui.showToast(data.error, 'error');
            }
        } catch (error) {
            window.logger.error('Erro ao criar arquivo:', error);
            window.manatiEditor.ui.showToast('Erro ao criar arquivo', 'error');
        }
    }

    async createNewFolder(folderName) {
        if (!folderName) return;

        // Criar caminho completo baseado no diretório atual  
        const fullPath = this.currentPath ? `${this.currentPath}/${folderName}` : folderName;
        
        try {
            const response = await fetch(`/api/folder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: fullPath })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.loadFileTree(this.currentPath);
                window.manatiEditor.ui.showToast('Pasta criada com sucesso!', 'success');
            } else {
                window.manatiEditor.ui.showToast(data.error, 'error');
            }
        } catch (error) {
            window.logger.error('Erro ao criar pasta:', error);
            window.manatiEditor.ui.showToast('Erro ao criar pasta', 'error');
        }
    }

    async deleteFolder(folderPath) {
        // Fechar menu dropdown
        document.querySelectorAll('.file-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
        const confirmed = await window.manatiEditor.ui.showConfirm(
            'Excluir Pasta',
            `Tem certeza que deseja excluir a pasta "${folderPath}" e todo seu conteúdo?`,
            'Excluir',
            'Cancelar'
        );
        
        if (!confirmed) return;

        try {
            // 🗑️ PRIMEIRO: Marcar todos os arquivos .md da pasta como excluídos no Git
            // (Deve ser feito ANTES de excluir a pasta do filesystem)
            if (window.manatiEditor.git) {
                window.logger.debug('🗑️ Processando exclusão da pasta no Git:', folderPath);
                await this.markFolderFilesAsDeleted(folderPath);
            }
            
            // DEPOIS: Excluir a pasta do filesystem
            const response = await fetch(`/api/folder/${encodeURIComponent(folderPath)}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (response.ok) {
                window.logger.debug('✅ Pasta excluída com sucesso do filesystem:', folderPath);
                
                // Recarregar a árvore de arquivos
                this.loadFileTree(this.currentPath);
                
                // Se a pasta excluída continha o arquivo atual, limpar todos os editores
                if (window.manatiEditor.currentFile && window.manatiEditor.currentFile.startsWith(folderPath)) {
                    this.clearAllEditors();
                }
                
                window.manatiEditor.ui.showToast('Pasta excluída com sucesso!', 'success');
            } else {
                window.manatiEditor.ui.showToast(data.error, 'error');
            }
        } catch (error) {
            window.logger.error('Erro ao excluir pasta:', error);
            window.manatiEditor.ui.showToast('Erro ao excluir pasta', 'error');
        }
    }

    async renameFile(filePath, currentName) {
        // Fechar menu dropdown
        document.querySelectorAll('.file-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
        try {
            // Extrair nome sem extensão para o input
            const nameWithoutExt = currentName.replace(/\.md$/, '');
            
            // Criar validador snake_case
            const snakeCaseValidator = (value) => {
                if (!value.trim()) {
                    return { isValid: false, message: 'Nome não pode estar vazio' };
                }
                
                if (!window.manatiEditor.validateSnakeCase(value)) {
                    const suggestion = window.manatiEditor.toSnakeCase(value);
                    return { 
                        isValid: false, 
                        message: `Nome deve estar em snake_case.<br>Sugestão: <strong>${suggestion}</strong>` 
                    };
                }
                
                return { isValid: true };
            };
            
            const newName = await window.manatiEditor.ui.showInput(
                'Renomear Arquivo',
                'Novo nome do arquivo:',
                nameWithoutExt,
                'Digite o novo nome...',
                snakeCaseValidator
            );
            
            if (!newName || newName === nameWithoutExt) {
                return;
            }

            // Validar nome do arquivo
            if (newName.includes('/') || newName.includes('\\')) {
                window.manatiEditor.ui.showToast('Nome do arquivo não pode conter / ou \\', 'error');
                return;
            }

            // Sempre manter a extensão .md
            const finalNewName = newName.trim() + '.md';

            const response = await fetch(`/api/file/${encodeURIComponent(filePath)}/rename`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newName: finalNewName })
            });

            const result = await response.json();

            if (response.ok) {
                window.manatiEditor.ui.showToast('Arquivo renomeado com sucesso!', 'success');
                
                // Se o arquivo renomeado é o arquivo atual, atualizar referência
                if (window.manatiEditor.currentFile === filePath) {
                    const directory = filePath.substring(0, filePath.lastIndexOf('/') + 1);
                    window.manatiEditor.currentFile = directory + finalNewName;
                    document.getElementById('currentFileName').textContent = window.manatiEditor.currentFile;
                }
                
                // Recarregar árvore de arquivos
                this.loadFileTree(this.currentPath);
            } else {
                window.manatiEditor.ui.showToast(result.error || 'Erro ao renomear arquivo', 'error');
            }
        } catch (error) {
            window.logger.error('Erro ao renomear arquivo:', error);
            window.manatiEditor.ui.showToast('Erro ao renomear arquivo', 'error');
        }
    }

    async renameFolder(folderPath, currentName) {
        // Fechar menu dropdown
        document.querySelectorAll('.file-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
        try {
            // Criar validador snake_case
            const snakeCaseValidator = (value) => {
                if (!value.trim()) {
                    return { isValid: false, message: 'Nome não pode estar vazio' };
                }
                
                if (!window.manatiEditor.validateSnakeCase(value)) {
                    const suggestion = window.manatiEditor.toSnakeCase(value);
                    return { 
                        isValid: false, 
                        message: `Nome deve estar em snake_case.<br>Sugestão: <strong>${suggestion}</strong>` 
                    };
                }
                
                return { isValid: true };
            };
            
            const newName = await window.manatiEditor.ui.showInput(
                'Renomear Pasta',
                'Novo nome da pasta (snake_case):',
                currentName,
                'Digite o novo nome...',
                snakeCaseValidator
            );
            
            if (!newName || newName === currentName) {
                return;
            }

            // Validar nome da pasta
            if (newName.includes('/') || newName.includes('\\')) {
                window.manatiEditor.ui.showToast('Nome da pasta não pode conter / ou \\', 'error');
                return;
            }

            const response = await fetch(`/api/folder/${encodeURIComponent(folderPath)}/rename`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newName })
            });

            const result = await response.json();

            if (response.ok) {
                window.manatiEditor.ui.showToast('Pasta renomeada com sucesso!', 'success');
                
                // Se o arquivo atual está dentro da pasta renomeada, atualizar referência
                if (window.manatiEditor.currentFile && window.manatiEditor.currentFile.startsWith(folderPath + '/')) {
                    const relativePath = window.manatiEditor.currentFile.substring(folderPath.length + 1);
                    const parentDir = folderPath.substring(0, folderPath.lastIndexOf('/') + 1);
                    window.manatiEditor.currentFile = parentDir + newName + '/' + relativePath;
                    document.getElementById('currentFileName').textContent = window.manatiEditor.currentFile;
                }
                
                // Recarregar árvore de arquivos
                this.loadFileTree(this.currentPath);
            } else {
                window.manatiEditor.ui.showToast(result.error || 'Erro ao renomear pasta', 'error');
            }
        } catch (error) {
            window.logger.error('Erro ao renomear pasta:', error);
            window.manatiEditor.ui.showToast('Erro ao renomear pasta', 'error');
        }
    }

    toggleFileMenu(event, filePath, fileName, isDirectory) {
        event.stopPropagation();
        
        // Fechar todos os outros menus abertos
        document.querySelectorAll('.file-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
        // Encontrar o dropdown atual
        const button = event.currentTarget;
        const dropdown = button.closest('.file-dropdown');
        
        // Toggle do menu atual
        dropdown.classList.toggle('show');
        
        // Fechar menu quando clicar fora
        if (dropdown.classList.contains('show')) {
            const closeMenu = (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', closeMenu);
                }
            };
            
            // Aguardar um frame para evitar fechar imediatamente
            setTimeout(() => {
                document.addEventListener('click', closeMenu);
            }, 0);
        }
    }

    clearAllEditors() {
        // Liberar lock do arquivo atual se houver
        if (window.manatiEditor.currentFile && window.manatiEditor.fileLock) {
            window.manatiEditor.fileLock.releaseLock(window.manatiEditor.currentFile);
        }
        
        // Limpar arquivo atual
        window.manatiEditor.currentFile = null;
        
        // Limpar editor Markdown
        const markdownEditor = document.getElementById('markdownEditor');
        if (markdownEditor) {
            markdownEditor.value = '';
            markdownEditor.disabled = true;
        }
        
        // Limpar editor Visual
        if (window.visualEditor && typeof window.visualEditor.clear === 'function') {
            window.visualEditor.clear();
            if (typeof window.visualEditor.hide === 'function') {
                window.visualEditor.hide();
            }
        }
        
        // Limpar Preview
        const previewContainer = document.getElementById('previewContainer');
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="text-muted text-center">
                    <i class="bi bi-eye-slash" style="font-size: 3rem;"></i>
                    <p class="mt-3">Selecione um arquivo para visualizar o preview</p>
                </div>
            `;
        }
        
        // Ocultar informações do arquivo
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.style.display = 'none';
        }
        
        // Desabilitar abas do editor
        if (window.manatiEditor && window.manatiEditor.ui && typeof window.manatiEditor.ui.disableEditorTabs === 'function') {
            window.manatiEditor.ui.disableEditorTabs();
        }
        
        // Resetar status de mudanças não salvas
        window.manatiEditor.hasUnsavedChanges = false;
        if (window.manatiEditor.ui && typeof window.manatiEditor.ui.updateSaveButton === 'function') {
            window.manatiEditor.ui.updateSaveButton();
        }
        
        // Atualizar ícones da árvore de arquivos
        if (window.manatiEditor.fileLock) {
            window.manatiEditor.fileLock.updateFileTreeIcons();
        }
    }

    highlightCurrentFile() {
        // Remover highlight de todos os itens
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Adicionar highlight ao arquivo atual
        const currentItem = Array.from(document.querySelectorAll('.file-item')).find(item => {
            const fileName = item.querySelector('.file-name')?.textContent;
            return fileName && window.manatiEditor.currentFile?.endsWith(fileName);
        });
        
        if (currentItem) {
            currentItem.classList.add('active');
        }
    }

    getCurrentPath() {
        return this.currentPath;
    }

    async moveFile(filePath, fileName, isDirectory = false) {
        // Fechar menu dropdown
        document.querySelectorAll('.file-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
        try {
            // Carregar lista de pastas disponíveis
            await this.loadFoldersForMove(filePath, isDirectory);
            
            // Configurar modal
            document.getElementById('moveItemModalTitle').textContent = 'Mover Arquivo';
            document.getElementById('moveItemName').textContent = fileName;
            
            // Armazenar dados para uso posterior
            window.manatiEditor.tempMoveData = {
                itemPath: filePath,
                itemName: fileName,
                isDirectory: false
            };
            
            // Mostrar modal
            window.manatiEditor.ui.showModal('moveItemModal');
        } catch (error) {
            window.logger.error('Erro ao preparar movimentação de arquivo:', error);
            window.manatiEditor.ui.showToast('Erro ao preparar movimentação', 'error');
        }
    }

    async moveFolder(folderPath, folderName, isDirectory = true) {
        // Fechar menu dropdown
        document.querySelectorAll('.file-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
        try {
            // Carregar lista de pastas disponíveis
            await this.loadFoldersForMove(folderPath, isDirectory);
            
            // Configurar modal
            document.getElementById('moveItemModalTitle').textContent = 'Mover Pasta';
            document.getElementById('moveItemName').textContent = folderName;
            
            // Armazenar dados para uso posterior
            window.manatiEditor.tempMoveData = {
                itemPath: folderPath,
                itemName: folderName,
                isDirectory: true
            };
            
            // Mostrar modal
            window.manatiEditor.ui.showModal('moveItemModal');
        } catch (error) {
            window.logger.error('Erro ao preparar movimentação de pasta:', error);
            window.manatiEditor.ui.showToast('Erro ao preparar movimentação', 'error');
        }
    }

    async loadFoldersForMove(currentPath, isDirectory) {
        try {
            // Obter todas as pastas do projeto
            const allFolders = await this.getAllFolders();
            const select = document.getElementById('moveDestination');
            
            // Limpar opções existentes
            select.innerHTML = '<option value="">Raiz (pasta principal)</option>';
            
            // Filtrar pastas (não pode mover para si mesmo ou para subpastas suas)
            const filteredFolders = allFolders.filter(folder => {
                if (isDirectory) {
                    // Para pastas: não pode mover para si mesma ou para suas subpastas
                    return folder !== currentPath && !folder.startsWith(currentPath + '/');
                } else {
                    // Para arquivos: não pode mover para a pasta atual
                    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
                    return folder !== currentDir;
                }
            });
            
            // Adicionar opções de pastas
            filteredFolders.forEach(folder => {
                const option = document.createElement('option');
                option.value = folder;
                option.textContent = folder;
                select.appendChild(option);
            });
        } catch (error) {
            window.logger.error('Erro ao carregar pastas:', error);
            throw error;
        }
    }

    async getAllFolders(path = '') {
        try {
            const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
            const files = await response.json();
            
            let folders = [];
            
            for (const file of files) {
                if (file.isDirectory) {
                    folders.push(file.path);
                    // Recursivamente obter subpastas
                    const subfolders = await this.getAllFolders(file.path);
                    folders = folders.concat(subfolders);
                }
            }
            
            return folders;
        } catch (error) {
            window.logger.error('Erro ao obter todas as pastas:', error);
            return [];
        }
    }

    async confirmMove() {
        try {
            const moveData = window.manatiEditor.tempMoveData;
            if (!moveData) {
                throw new Error('Dados de movimentação não encontrados');
            }
            
            const destination = document.getElementById('moveDestination').value;
            const newPath = destination ? `${destination}/${moveData.itemName}` : moveData.itemName;
            
            const endpoint = moveData.isDirectory ? 
                `/api/folder/${encodeURIComponent(moveData.itemPath)}/move` : 
                `/api/file/${encodeURIComponent(moveData.itemPath)}/move`;
            
            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newPath })
            });

            const result = await response.json();

            if (response.ok) {
                window.manatiEditor.ui.showToast(
                    `${moveData.isDirectory ? 'Pasta' : 'Arquivo'} movido com sucesso!`, 
                    'success'
                );
                
                // Se o item movido é o arquivo atual, atualizar referência
                if (!moveData.isDirectory && window.manatiEditor.currentFile === moveData.itemPath) {
                    window.manatiEditor.currentFile = newPath;
                    document.getElementById('currentFileName').textContent = newPath;
                } else if (moveData.isDirectory && window.manatiEditor.currentFile && 
                          window.manatiEditor.currentFile.startsWith(moveData.itemPath + '/')) {
                    // Se o arquivo atual está dentro da pasta movida
                    const relativePath = window.manatiEditor.currentFile.substring(moveData.itemPath.length + 1);
                    window.manatiEditor.currentFile = newPath + '/' + relativePath;
                    document.getElementById('currentFileName').textContent = window.manatiEditor.currentFile;
                }
                
                // Fechar modal e recarregar árvore
                window.manatiEditor.ui.hideModal('moveItemModal');
                this.loadFileTree(this.currentPath);
                
                // Limpar dados temporários
                delete window.manatiEditor.tempMoveData;
            } else {
                window.manatiEditor.ui.showToast(result.error || 'Erro ao mover item', 'error');
            }
        } catch (error) {
            window.logger.error('Erro ao mover item:', error);
            window.manatiEditor.ui.showToast('Erro ao mover item', 'error');
        }
    }

    initializeSearch() {
        const searchInput = document.getElementById('fileSearchInput');
        const clearBtn = document.getElementById('clearSearchBtn');
        
        if (!searchInput || !clearBtn) return;
        
        let searchTimeout;
        
        // Event listener para o botão de limpar busca
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            this.clearSearch();
        });
        
        // Event listener para busca em tempo real
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            searchTimeout = setTimeout(() => {
                this.filterFiles(query);
            }, 300);
        });
        
        // Fechar busca com ESC
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                this.clearSearch();
            }
        });
    }

    // Método para limpar busca
    clearSearch() {
        const searchInput = document.getElementById('fileSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        // Voltar para a visualização normal
        this.loadFileTree(this.currentPath);
    }

    async performSearch(query) {
        try {
            const sanitizedQuery = this.sanitizeSearchQuery(query);
            const results = await this.searchFiles(sanitizedQuery);
            this.displaySearchResults(results, query);
        } catch (error) {
            window.logger.error('Erro na busca:', error);
            window.manatiEditor.ui.showToast('Erro ao realizar busca', 'error');
        }
    }

    sanitizeSearchQuery(query) {
        // Remover caracteres perigosos e limitações de segurança
        return query
            .replace(/[<>\"'&]/g, '') // Remove caracteres HTML perigosos
            .replace(/[\/\\]/g, '') // Remove barras
            .trim()
            .substring(0, 100); // Limitar tamanho
    }

    async searchFiles(query) {
        if (!query) return [];
        
        try {
            // Obter todos os arquivos recursivamente
            const allFiles = await this.getAllFilesRecursive();
            
            // Filtrar por título e nome do arquivo
            return allFiles.filter(file => {
                if (file.isDirectory) return false;
                
                const nameMatch = file.name.toLowerCase().includes(query.toLowerCase());
                const titleMatch = file.title && file.title.toLowerCase().includes(query.toLowerCase());
                
                return nameMatch || titleMatch;
            });
        } catch (error) {
            window.logger.error('Erro ao buscar arquivos:', error);
            return [];
        }
    }

    async getAllFilesRecursive(path = '') {
        try {
            const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
            const files = await response.json();
            
            let allFiles = [];
            
            for (const file of files) {
                if (file.isDirectory) {
                    // Recursivamente obter arquivos de subpastas
                    const subFiles = await this.getAllFilesRecursive(file.path);
                    allFiles = allFiles.concat(subFiles);
                } else {
                    allFiles.push(file);
                }
            }
            
            return allFiles;
        } catch (error) {
            window.logger.error('Erro ao obter arquivos recursivos:', error);
            return [];
        }
    }

    displaySearchResults(results, query) {
        const container = document.getElementById('fileTree');
        container.innerHTML = '';
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="text-muted text-center p-3">
                    <i class="bi bi-search" style="font-size: 2rem;"></i>
                    <p class="mt-2 mb-0">Nenhum resultado encontrado para "${query}"</p>
                </div>
            `;
            return;
        }
        
        // Cabeçalho dos resultados
        const header = document.createElement('div');
        header.className = 'search-results-header p-2 border-bottom';
        header.innerHTML = `
            <small class="text-muted">
                <i class="bi bi-search"></i> 
                ${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query}"
            </small>
        `;
        container.appendChild(header);
        
        // Exibir resultados
        results.forEach(file => {
            const item = document.createElement('div');
            item.className = 'file-item';
            
            const actions = `
                <div class="file-actions">
                    <div class="file-dropdown">
                        <button class="file-menu-btn" onclick="window.manatiEditor.fileManager.toggleFileMenu(event, '${file.path}', '${file.name}', false)">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <div class="file-dropdown-content">
                            <button class="file-dropdown-item" onclick="window.manatiEditor.fileManager.renameFile('${file.path}', '${file.name}')">
                                <i class="bi bi-pencil"></i>
                                Renomear
                            </button>
                            <button class="file-dropdown-item" onclick="window.manatiEditor.fileManager.moveFile('${file.path}', '${file.name}', false)">
                                <i class="bi bi-arrow-right"></i>
                                Mover
                            </button>
                            <button class="file-dropdown-item danger" onclick="window.manatiEditor.fileManager.deleteFile('${file.path}')">
                                <i class="bi bi-trash"></i>
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            let displayName;
            if (file.title) {
                displayName = `
                    <div class="file-display">
                        <span class="file-title">${this.highlightSearchTerm(file.title, query)}</span>
                        <small class="file-filename text-muted">${this.highlightSearchTerm(file.name, query)}</small>
                        <small class="file-path text-muted"><i class="bi bi-folder"></i> ${file.path.substring(0, file.path.lastIndexOf('/')) || '/'}</small>
                    </div>
                `;
            } else {
                displayName = `
                    <div class="file-display">
                        <span class="file-name">${this.highlightSearchTerm(file.name, query)}</span>
                        <small class="file-path text-muted"><i class="bi bi-folder"></i> ${file.path.substring(0, file.path.lastIndexOf('/')) || '/'}</small>
                    </div>
                `;
            }
            
            item.innerHTML = `
                <i class="bi bi-file-text"></i>
                ${displayName}
                ${actions}
            `;
            
            item.addEventListener('click', (e) => {
                if (e.target.closest('.file-actions')) return;
                window.manatiEditor.loadFile(file.path);
            });
            
            container.appendChild(item);
        });
    }

    highlightSearchTerm(text, term) {
        if (!term) return text;
        
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Marca todos os arquivos .md de uma pasta como excluídos no Git
     */
    async markFolderFilesAsDeleted(folderPath) {
        try {
            window.logger.debug('🔍 Obtendo lista de arquivos da pasta antes de excluir:', folderPath);
            
            // Buscar todos os arquivos da pasta antes de excluí-la
            const response = await fetch(`/api/files?path=${encodeURIComponent(folderPath)}`);
            
            if (!response.ok) {
                window.logger.error('❌ Erro ao listar arquivos da pasta:', response.status, response.statusText);
                return;
            }
            
            const files = await response.json();
            window.logger.debug('📁 Arquivos encontrados na pasta:', files);
            
            if (Array.isArray(files) && files.length > 0) {
                let markedCount = 0;
                
                for (const file of files) {
                    if (!file.isDirectory && file.path.endsWith('.md')) {
                        window.logger.debug('🗑️ Marcando arquivo como excluído no Git:', file.path);
                        window.manatiEditor.git.markFileAsDeleted(file.path);
                        markedCount++;
                    } else if (file.isDirectory) {
                        // Recursivamente processar subpastas
                        window.logger.debug('📁 Processando subpasta:', file.path);
                        await this.markFolderFilesAsDeleted(file.path);
                    }
                }
                
                window.logger.debug(`✅ ${markedCount} arquivo(s) .md marcado(s) como excluído(s) no Git`);
            } else {
                window.logger.debug('ℹ️ Nenhum arquivo encontrado na pasta ou pasta vazia');
            }
        } catch (error) {
            window.logger.error('❌ Erro ao marcar arquivos da pasta como excluídos:', error);
        }
    }

    // Método para filtrar arquivos em tempo real
    filterFiles(query) {
        if (!query) {
            this.loadFileTree(this.currentPath);
            return;
        }
        this.performSearch(query);
    }
}
