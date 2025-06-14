/**
 * Módulo para gerenciamento de Git - Controle de Versão
 */
export class GitManager {
    constructor() {
        this.modifiedFiles = new Set(); // Arquivos modificados pelo usuário atual
        this.deletedFiles = new Set(); // Arquivos excluídos pelo usuário atual
        this.userCommits = new Map(); // Mapa de arquivo -> último commit do usuário
        this.isGitAvailable = false;
        this.currentUser = null;
        this.markdownPath = 'markdown-files'; // Default, será atualizado via configuração
        this.configLoaded = false;
    }

    /**
     * Carrega configurações do servidor
     */
    async loadConfiguration() {
        if (this.configLoaded) return;
        
        try {
            const response = await fetch('/api/git/config');
            if (response.ok) {
                const config = await response.json();
                if (config.markdownPath) {
                    this.markdownPath = config.markdownPath;
                    window.logger.debug('🔧 Configuração carregada - markdownPath:', this.markdownPath);
                }
                this.configLoaded = true;
            }
        } catch (error) {
            window.logger.error('❌ Erro ao carregar configuração:', error);
        }
    }

    /**
     * Inicializa o gerenciador de Git
     */
    async init() {
        window.logger.debug('🔄 Inicializando GitManager...');
        
        try {
            // Carregar configurações do servidor
            await this.loadConfiguration();
            
            // Configurar botão de Git primeiro
            this.setupGitButton();
            
            // Verificar se Git está disponível
            const gitStatus = await this.checkGitStatus();
            this.isGitAvailable = gitStatus.available;
            
            window.logger.debug('🔍 Status do Git:', gitStatus);
            
            if (this.isGitAvailable) {
                window.logger.debug('✅ Git disponível - repositório detectado');
                await this.loadModifiedFiles();
                this.loadModifiedFilesFromStorage(); // 💾 Carregar do localStorage
                this.updateGitButton();
            } else {
                window.logger.debug('ℹ️ Git não disponível ou não é um repositório');
                this.disableGitFeatures();
            }
        } catch (error) {
            window.logger.error('❌ Erro ao inicializar Git:', error);
            this.disableGitFeatures();
        }
    }

    /**
     * Configura o botão de Git
     */
    setupGitButton() {
        const gitBtn = document.getElementById('gitCommitBtn');
        if (gitBtn) {
            gitBtn.addEventListener('click', () => this.commitModifiedFiles());
        }
    }

    /**
     * Verifica status do Git
     */
    async checkGitStatus() {
        try {
            window.logger.debug('🔍 Fazendo requisição para /api/git/status...');
            const response = await fetch('/api/git/status', {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            window.logger.debug('📡 Response status:', response.status);
            window.logger.debug('📡 Response ok:', response.ok);
            
            if (!response.ok) {
                window.logger.error('❌ Resposta não OK:', response.status, response.statusText);
                const text = await response.text();
                window.logger.error('❌ Response body:', text.substring(0, 200));
                return { available: false, error: `HTTP ${response.status}` };
            }
            
            const text = await response.text();
            window.logger.debug('📄 Response text (primeiros 200 chars):', text.substring(0, 200));
            
            try {
                const data = JSON.parse(text);
                window.logger.debug('✅ Data recebida:', data);
                return data;
            } catch (jsonError) {
                window.logger.error('❌ Erro ao fazer parse JSON:', jsonError);
                window.logger.error('❌ Texto completo:', text);
                return { available: false, error: 'Resposta inválida do servidor' };
            }
        } catch (error) {
            window.logger.error('❌ Erro ao verificar status do Git:', error);
            return { available: false, error: error.message };
        }
    }

    /**
     * Carrega arquivos modificados APENAS deste usuário
     * Não carrega arquivos do Git status - apenas os marcados localmente
     */
    async loadModifiedFiles() {
        // Não fazer nada aqui - os arquivos modificados são rastreados
        // localmente quando o usuário salva arquivos
        // Isso garante que cada usuário só veja seus próprios arquivos modificados
        window.logger.debug('📁 Arquivos modificados pelo usuário atual:', Array.from(this.modifiedFiles));
    }

    /**
     * Marca um arquivo como modificado
     */
    markFileAsModified(filePath) {
        window.logger.debug('🔍 GitManager.markFileAsModified chamado para:', filePath);
        window.logger.debug('🔍 Git disponível:', this.isGitAvailable);
        
        if (!this.isGitAvailable) {
            window.logger.debug('⚠️ Git não está disponível, não marcando arquivo como modificado');
            return;
        }
        
        // 🔧 CORREÇÃO: Garantir que o caminho está correto
        let fullPath = filePath;
        if (!fullPath.includes('/') && fullPath.endsWith('.md')) {
            // Se é apenas um nome de arquivo .md, assumir que está no diretório markdown
            fullPath = `${this.markdownPath}/${filePath}`;
            window.logger.debug('🔧 Corrigindo caminho de:', filePath, 'para:', fullPath);
        }
        
        this.modifiedFiles.add(fullPath);
        this.updateFileIcons();
        this.updateGitButton();
        
        // 💾 Salvar no localStorage para persistir entre sessões
        this.saveModifiedFilesToStorage();
        
        window.logger.debug(`📝 Arquivo marcado como modificado: ${fullPath}`);
        window.logger.debug(`📝 Total de arquivos modificados: ${this.modifiedFiles.size}`);
    }

    /**
     * Remove um arquivo da lista de modificados
     */
    unmarkFileAsModified(filePath) {
        this.modifiedFiles.delete(filePath);
        this.updateFileIcons();
        this.updateGitButton();
    }

    /**
     * Marca um arquivo como excluído
     */
    markFileAsDeleted(filePath) {
        window.logger.debug('🗑️ GitManager.markFileAsDeleted chamado para:', filePath);
        window.logger.debug('🔍 Git disponível:', this.isGitAvailable);
        
        if (!this.isGitAvailable) {
            window.logger.debug('⚠️ Git não está disponível, não marcando arquivo como excluído');
            return;
        }
        
        // 🔧 CORREÇÃO: Garantir que o caminho está correto
        let fullPath = filePath;
        if (!fullPath.includes('/') && fullPath.endsWith('.md')) {
            // Se é apenas um nome de arquivo .md, assumir que está no diretório markdown
            fullPath = `${this.markdownPath}/${filePath}`;
            window.logger.debug('🔧 Corrigindo caminho de:', filePath, 'para:', fullPath);
        }
        
        // Remover da lista de modificados se estiver lá
        this.modifiedFiles.delete(fullPath);
        
        // Adicionar à lista de excluídos
        this.deletedFiles.add(fullPath);
        this.updateFileIcons();
        this.updateGitButton();
        
        // 💾 Salvar no localStorage para persistir entre sessões
        this.saveModifiedFilesToStorage();
        
        window.logger.debug(`🗑️ Arquivo marcado como excluído: ${fullPath}`);
        window.logger.debug(`📝 Total de arquivos modificados: ${this.modifiedFiles.size}`);
        window.logger.debug(`🗑️ Total de arquivos excluídos: ${this.deletedFiles.size}`);
    }

    /**
     * Atualiza os ícones na árvore de arquivos
     */
    updateFileIcons() {
        const fileItems = document.querySelectorAll('.file-item:not(.folder)');
        
        fileItems.forEach(item => {
            const filePath = item.dataset?.filePath;
            if (!filePath) return;
            
            const icon = item.querySelector('i.bi');
            if (!icon) return;
            
            // Remover classes git anteriores
            item.classList.remove('file-modified');
            icon.classList.remove('text-info');
            
            if (this.modifiedFiles.has(filePath)) {
                // Arquivo modificado - ícone azul
                item.classList.add('file-modified');
                
                // Verificar se não tem lock ativo (lock tem prioridade)
                if (!item.classList.contains('file-locked')) {
                    icon.classList.add('text-info');
                }
            }
        });
    }

    /**
     * Atualiza o botão de Git
     */
    updateGitButton() {
        const modifiedCount = this.modifiedFiles.size;
        const deletedCount = this.deletedFiles.size;
        const totalChanges = modifiedCount + deletedCount;
        
        window.logger.debug('🔍 Atualizando botão Git. Modificados:', modifiedCount, 'excluídos:', deletedCount, 'total:', totalChanges);
        
        const gitBtn = document.getElementById('gitCommitBtn');
        const countBadge = document.getElementById('modifiedFilesCount');
        const btnText = document.getElementById('gitBtnText');
        
        if (!gitBtn) {
            window.logger.debug('❌ Botão gitCommitBtn não encontrado');
            return;
        }
        
        if (totalChanges > 0) {
            gitBtn.disabled = false;
            gitBtn.title = `Publicar ${modifiedCount} modificado(s) e ${deletedCount} excluído(s)`;
            countBadge.textContent = totalChanges;
            countBadge.style.display = 'inline';
            btnText.textContent = 'Publicar';
            window.logger.debug('✅ Botão Git habilitado com', totalChanges, 'alterações');
        } else {
            gitBtn.disabled = true;
            gitBtn.title = 'Nenhuma alteração para publicar';
            countBadge.style.display = 'none';
            btnText.textContent = 'Publicar';
            window.logger.debug('⚠️ Botão Git desabilitado - nenhum arquivo modificado');
        }
    }

    /**
     * Executa commit dos arquivos modificados
     */
    async commitModifiedFiles() {
        const totalChanges = this.modifiedFiles.size + this.deletedFiles.size;
        
        if (totalChanges === 0) {
            window.manatiEditor.ui.showToast('Nenhuma alteração para publicar', 'info');
            return;
        }

        try {
            // Mostrar modal de confirmação com lista de arquivos
            const confirmed = await this.showCommitModal();
            if (!confirmed.confirmed) return;

            // Obter arquivos selecionados
            const selectedFiles = this.getSelectedFiles();
            
            if (selectedFiles.modified.length === 0 && selectedFiles.deleted.length === 0) {
                window.manatiEditor.ui.showToast('Nenhum arquivo selecionado para publicar', 'warning');
                return;
            }

            // Mostrar loading
            this.setGitButtonLoading(true);

            // Obter informações do usuário autenticado
            const userInfo = window.manatiEditor.auth.getUserInfo();
            let filesToCommit = selectedFiles.modified;
            let filesToDelete = selectedFiles.deleted;
            
            // 🔧 CORREÇÃO FINAL: Garantir que todos os arquivos tenham o caminho completo
            filesToCommit = filesToCommit.map(file => {
                if (!file.includes('/') && file.endsWith('.md')) {
                    const correctedPath = `${this.markdownPath}/${file}`;
                    window.logger.debug('🔧 Corrigindo caminho no commit:', file, '→', correctedPath);
                    return correctedPath;
                }
                return file;
            });
            
            filesToDelete = filesToDelete.map(file => {
                if (!file.includes('/') && file.endsWith('.md')) {
                    const correctedPath = `${this.markdownPath}/${file}`;
                    window.logger.debug('🔧 Corrigindo caminho no commit (exclusão):', file, '→', correctedPath);
                    return correctedPath;
                }
                return file;
            });
            
            window.logger.debug('🔍 Arquivos selecionados que serão commitados (modificados):', filesToCommit);
            window.logger.debug('🔍 Arquivos selecionados que serão excluídos:', filesToDelete);
            window.logger.debug('🔍 Usuário:', userInfo);
            
            // Fazer commit
            const response = await fetch('/api/git/commit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    files: filesToCommit, // Arquivos modificados selecionados
                    deletedFiles: filesToDelete, // Arquivos excluídos selecionados
                    message: confirmed.message,
                    userId: userInfo.id, // ✅ Adicionar userId para validação
                    author: {
                        name: userInfo.name,
                        email: userInfo.email
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                // Remover apenas os arquivos que foram commitados das listas
                filesToCommit.forEach(file => {
                    // Remover tanto pelo caminho completo quanto pelo nome simples
                    this.modifiedFiles.delete(file);
                    const fileName = file.replace(`${this.markdownPath}/`, '');
                    this.modifiedFiles.delete(fileName);
                });
                
                filesToDelete.forEach(file => {
                    // Remover tanto pelo caminho completo quanto pelo nome simples
                    this.deletedFiles.delete(file);
                    const fileName = file.replace(`${this.markdownPath}/`, '');
                    this.deletedFiles.delete(fileName);
                });
                
                this.saveModifiedFilesToStorage(); // 💾 Atualizar localStorage com arquivos restantes
                this.updateFileIcons();
                this.updateGitButton();
                
                const selectedCount = selectedFiles.modified.length + selectedFiles.deleted.length;
                window.manatiEditor.ui.showToast(
                    `Commit realizado com sucesso!<br>${selectedCount} arquivo(s) publicado(s)<br>Hash: ${data.commitHash?.substring(0, 7)}`, 
                    'success'
                );
            } else {
                window.manatiEditor.ui.showToast(
                    `❌ Erro ao fazer commit: ${data.error}`, 
                    'error'
                );
            }
        } catch (error) {
            window.logger.error('Erro ao fazer commit:', error);
            window.manatiEditor.ui.showToast('❌ Erro ao publicar alterações', 'error');
        } finally {
            this.setGitButtonLoading(false);
        }
    }

    /**
     * Mostra o modal de confirmação de commit
     */
    async showCommitModal() {
        return new Promise((resolve) => {
            const modal = document.getElementById('commitModal');
            if (!modal) {
                window.logger.error('❌ Modal de commit não encontrado');
                resolve({ confirmed: false });
                return;
            }

            // Atualizar lista de arquivos no modal
            this.updateCommitModalFileList();

            // Configurar handlers
            const confirmBtn = modal.querySelector('#confirmCommitBtn');
            const cancelBtn = modal.querySelector('#cancelCommitBtn');
            const messageInput = modal.querySelector('#commitMessage');
            const bootstrapModal = new bootstrap.Modal(modal);

            // Reset do input
            if (messageInput) {
                messageInput.value = '';
            }

            const cleanup = () => {
                confirmBtn?.removeEventListener('click', onConfirm);
                cancelBtn?.removeEventListener('click', onCancel);
                modal.removeEventListener('hidden.bs.modal', onCancel);
            };

            const onConfirm = () => {
                const message = messageInput?.value?.trim() || 'Atualizações via Manati Editor';
                cleanup();
                bootstrapModal.hide();
                resolve({ confirmed: true, message });
            };

            const onCancel = () => {
                cleanup();
                resolve({ confirmed: false });
            };

            confirmBtn?.addEventListener('click', onConfirm);
            cancelBtn?.addEventListener('click', onCancel);
            modal.addEventListener('hidden.bs.modal', onCancel);

            bootstrapModal.show();
            
            // Focar no input de mensagem
            setTimeout(() => {
                messageInput?.focus();
            }, 500);
        });
    }

    /**
     * Atualiza a lista de arquivos no modal de commit
     */
    updateCommitModalFileList() {
        const unifiedList = document.getElementById('unifiedFilesList');
        const totalCountSpan = document.getElementById('totalFilesCountModal');
        
        if (unifiedList) {
            unifiedList.innerHTML = '';
            
            // Combinar arquivos modificados e excluídos em uma lista
            const allFiles = [];
            
            // Adicionar arquivos modificados
            this.modifiedFiles.forEach(file => {
                allFiles.push({
                    name: file,
                    type: 'modified',
                    icon: 'bi-file-earmark-text',
                    iconColor: 'text-success'
                });
            });
            
            // Adicionar arquivos excluídos
            this.deletedFiles.forEach(file => {
                allFiles.push({
                    name: file,
                    type: 'deleted',
                    icon: 'bi-file-earmark-x',
                    iconColor: 'text-danger'
                });
            });
            
            // Ordenar alfabeticamente
            allFiles.sort((a, b) => a.name.localeCompare(b.name));
            
            // Criar itens da lista com alternância sutil de cores
            allFiles.forEach((file, index) => {
                const li = document.createElement('li');
                const isEven = index % 2 === 0;
                const backgroundClass = isEven ? '' : 'bg-body-secondary';
                
                li.className = `d-flex align-items-center py-2 px-3 rounded mb-1 ${backgroundClass}`;
                li.style.transition = 'background-color 0.2s ease';
                
                // Adicionar hover effect
                li.addEventListener('mouseenter', () => {
                    li.classList.add('bg-body-tertiary');
                });
                li.addEventListener('mouseleave', () => {
                    li.classList.remove('bg-body-tertiary');
                });
                
                // Criar checkbox único para cada arquivo
                const checkboxId = `file-${index}-${file.type}`;
                
                // Limpar nome do arquivo removendo o prefixo markdown-files/
                const displayName = file.name.replace(/^markdown-files\//, '');
                
                li.innerHTML = `
                    <div class="form-check me-2">
                        <input class="form-check-input" type="checkbox" id="${checkboxId}" 
                               data-file="${file.name}" data-type="${file.type}" checked>
                    </div>
                    <i class="bi ${file.icon} ${file.iconColor} me-2"></i>
                    <span class="text-truncate flex-grow-1" title="${displayName}">${displayName}</span>
                    <small class="text-muted ms-2">${file.type === 'modified' ? 'Modificado' : 'Excluído'}</small>
                `;
                
                // Adicionar event listener para o checkbox
                const checkbox = li.querySelector('.form-check-input');
                checkbox.addEventListener('change', () => {
                    this.updateSelectedFilesCount();
                });
                
                unifiedList.appendChild(li);
            });
            
            // Atualizar contador total
            if (totalCountSpan) {
                totalCountSpan.textContent = allFiles.length;
            }
            
            // Adicionar controles de seleção
            this.addSelectionControls(unifiedList);
            this.updateSelectedFilesCount();
        }
    }

    /**
     * Adiciona controles de seleção (Selecionar todos/Nenhum)
     */
    addSelectionControls(container) {
        // Verificar se já existem controles e removê-los
        const existingControls = container.parentNode.querySelector('.selection-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'mb-2 pb-2 border-bottom selection-controls';
        controlsDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">
                    <span id="selectedFilesCount">0</span> de <span id="totalFilesCount">0</span> arquivos selecionados
                </small>
                <div>
                    <button type="button" class="btn btn-sm btn-outline-primary me-1" id="selectAllFiles">
                        <i class="bi bi-check-all"></i> Todos
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="selectNoneFiles">
                        <i class="bi bi-square"></i> Nenhum
                    </button>
                </div>
            </div>
        `;
        
        container.parentNode.insertBefore(controlsDiv, container);
        
        // Event listeners para os botões
        document.getElementById('selectAllFiles').addEventListener('click', () => {
            this.selectAllFiles(true);
        });
        
        document.getElementById('selectNoneFiles').addEventListener('click', () => {
            this.selectAllFiles(false);
        });
    }

    /**
     * Seleciona ou deseleciona todos os arquivos
     */
    selectAllFiles(select) {
        const checkboxes = document.querySelectorAll('#unifiedFilesList .form-check-input');
        checkboxes.forEach(checkbox => {
            checkbox.checked = select;
        });
        this.updateSelectedFilesCount();
    }

    /**
     * Atualiza o contador de arquivos selecionados
     */
    updateSelectedFilesCount() {
        const checkboxes = document.querySelectorAll('#unifiedFilesList .form-check-input');
        const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        const totalCount = checkboxes.length;
        
        const selectedSpan = document.getElementById('selectedFilesCount');
        const totalSpan = document.getElementById('totalFilesCount');
        const commitBtn = document.getElementById('confirmCommitBtn');
        
        if (selectedSpan) selectedSpan.textContent = selectedCount;
        if (totalSpan) totalSpan.textContent = totalCount;
        
        // Desabilitar botão se nenhum arquivo selecionado
        if (commitBtn) {
            commitBtn.disabled = selectedCount === 0;
            if (selectedCount === 0) {
                commitBtn.innerHTML = '<i class="bi bi-exclamation-circle"></i> Selecione arquivos para publicar';
            } else {
                commitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Publicar Alterações';
            }
        }
    }

    /**
     * Obtém lista de arquivos selecionados
     */
    getSelectedFiles() {
        const checkboxes = document.querySelectorAll('#unifiedFilesList .form-check-input:checked');
        const selectedFiles = {
            modified: [],
            deleted: []
        };
        
        checkboxes.forEach(checkbox => {
            const fileName = checkbox.dataset.file;
            const fileType = checkbox.dataset.type;
            
            if (fileType === 'modified') {
                selectedFiles.modified.push(fileName);
            } else if (fileType === 'deleted') {
                selectedFiles.deleted.push(fileName);
            }
        });
        
        return selectedFiles;
    }

    /**
     * Define estado de loading do botão Git
     */
    setGitButtonLoading(loading) {
        const gitBtn = document.getElementById('gitCommitBtn');
        const btnText = document.getElementById('gitBtnText');
        
        if (gitBtn && btnText) {
            if (loading) {
                gitBtn.disabled = true;
                btnText.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Publicando...';
            } else {
                gitBtn.disabled = this.modifiedFiles.size === 0 && this.deletedFiles.size === 0;
                btnText.textContent = 'Publicar';
            }
        }
    }

    /**
     * Desabilita recursos Git quando não disponível
     */
    disableGitFeatures() {
        const gitBtn = document.getElementById('gitCommitBtn');
        if (gitBtn) {
            gitBtn.disabled = true;
            gitBtn.title = 'Git não disponível neste repositório';
            gitBtn.querySelector('#gitBtnText').textContent = 'Git Indisponível';
        }
        
        // Limpar indicadores visuais
        this.modifiedFiles.clear();
        this.deletedFiles.clear();
        this.updateFileIcons();
    }

    /**
     * Salva arquivos modificados no localStorage
     */
    saveModifiedFilesToStorage() {
        try {
            const data = {
                modifiedFiles: Array.from(this.modifiedFiles),
                deletedFiles: Array.from(this.deletedFiles),
                timestamp: Date.now()
            };
            localStorage.setItem('manati_git_changes', JSON.stringify(data));
        } catch (error) {
            window.logger.error('❌ Erro ao salvar alterações no localStorage:', error);
        }
    }

    /**
     * Carrega arquivos modificados do localStorage
     */
    loadModifiedFilesFromStorage() {
        try {
            const data = localStorage.getItem('manati_git_changes');
            if (data) {
                const parsed = JSON.parse(data);
                
                // Verificar se não é muito antigo (mais de 24h)
                const ageInHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
                if (ageInHours < 24) {
                    this.modifiedFiles = new Set(parsed.modifiedFiles || []);
                    this.deletedFiles = new Set(parsed.deletedFiles || []);
                    
                    window.logger.debug('💾 Arquivos modificados carregados do localStorage:', this.modifiedFiles.size);
                    window.logger.debug('💾 Arquivos excluídos carregados do localStorage:', this.deletedFiles.size);
                } else {
                    // Dados muito antigos, limpar
                    this.clearModifiedFilesFromStorage();
                }
            }
        } catch (error) {
            window.logger.error('❌ Erro ao carregar alterações do localStorage:', error);
            this.clearModifiedFilesFromStorage();
        }
    }

    /**
     * Limpa arquivos modificados do localStorage
     */
    clearModifiedFilesFromStorage() {
        try {
            localStorage.removeItem('manati_git_changes');
        } catch (error) {
            window.logger.error('❌ Erro ao limpar localStorage:', error);
        }
    }
}
