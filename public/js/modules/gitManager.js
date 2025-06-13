/**
 * Módulo para gerenciamento de Git - Controle de Versão
 */
export class GitManager {
    constructor() {
        this.modifiedFiles = new Set(); // Arquivos modificados pelo usuário atual
        this.userCommits = new Map(); // Mapa de arquivo -> último commit do usuário
        this.isGitAvailable = false;
        this.currentUser = null;
    }

    /**
     * Inicializa o gerenciador de Git
     */
    async init() {
        console.log('🔄 Inicializando GitManager...');
        
        try {
            // Configurar botão de Git primeiro
            this.setupGitButton();
            
            // Verificar se Git está disponível
            const gitStatus = await this.checkGitStatus();
            this.isGitAvailable = gitStatus.available;
            
            console.log('🔍 Status do Git:', gitStatus);
            
            if (this.isGitAvailable) {
                console.log('✅ Git disponível - repositório detectado');
                await this.loadModifiedFiles();
                this.updateGitButton();
            } else {
                console.log('ℹ️ Git não disponível ou não é um repositório');
                this.disableGitFeatures();
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar Git:', error);
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
            const response = await fetch('/api/git/status', {
                credentials: 'include'
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao verificar status do Git:', error);
            return { available: false };
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
        console.log('📁 Arquivos modificados pelo usuário atual:', Array.from(this.modifiedFiles));
    }

    /**
     * Marca um arquivo como modificado
     */
    markFileAsModified(filePath) {
        console.log('🔍 GitManager.markFileAsModified chamado para:', filePath);
        console.log('🔍 Git disponível:', this.isGitAvailable);
        
        if (!this.isGitAvailable) {
            console.log('⚠️ Git não está disponível, não marcando arquivo como modificado');
            return;
        }
        
        this.modifiedFiles.add(filePath);
        this.updateFileIcons();
        this.updateGitButton();
        
        // ✅ Registrar no backend que este usuário modificou este arquivo
        this.trackModificationOnServer(filePath);
        
        console.log(`📝 Arquivo marcado como modificado: ${filePath}`);
        console.log(`📝 Total de arquivos modificados: ${this.modifiedFiles.size}`);
    }

    /**
     * Registra no servidor que o usuário modificou um arquivo
     */
    async trackModificationOnServer(filePath) {
        try {
            const userInfo = window.manatiEditor.auth.getUserInfo();
            
            await fetch('/api/git/track-modification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    userId: userInfo.id,
                    filePath: filePath
                })
            });
            
            console.log(`📤 Modificação registrada no servidor: ${filePath} por ${userInfo.id}`);
        } catch (error) {
            console.error('Erro ao registrar modificação no servidor:', error);
        }
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
        console.log('🔍 Atualizando botão Git. Arquivos modificados:', this.modifiedFiles.size);
        
        const gitBtn = document.getElementById('gitCommitBtn');
        const countBadge = document.getElementById('modifiedFilesCount');
        const btnText = document.getElementById('gitBtnText');
        
        if (!gitBtn) {
            console.log('❌ Botão gitCommitBtn não encontrado');
            return;
        }
        
        const modifiedCount = this.modifiedFiles.size;
        
        if (modifiedCount > 0) {
            gitBtn.disabled = false;
            gitBtn.title = `Publicar ${modifiedCount} arquivo(s) modificado(s)`;
            countBadge.textContent = modifiedCount;
            countBadge.style.display = 'inline';
            btnText.textContent = 'Publicar';
            console.log('✅ Botão Git habilitado com', modifiedCount, 'arquivos');
        } else {
            gitBtn.disabled = true;
            gitBtn.title = 'Nenhum arquivo modificado para publicar';
            countBadge.style.display = 'none';
            btnText.textContent = 'Publicar';
            console.log('⚠️ Botão Git desabilitado - nenhum arquivo modificado');
        }
    }

    /**
     * Executa commit dos arquivos modificados
     */
    async commitModifiedFiles() {
        if (this.modifiedFiles.size === 0) {
            window.manatiEditor.ui.showToast('Nenhum arquivo modificado para publicar', 'info');
            return;
        }

        try {
            // Mostrar modal de confirmação com lista de arquivos
            const confirmed = await this.showCommitModal();
            if (!confirmed.confirmed) return;

            // Mostrar loading
            this.setGitButtonLoading(true);

            // Obter informações do usuário autenticado
            const userInfo = window.manatiEditor.auth.getUserInfo();
            
            // Fazer commit
            const response = await fetch('/api/git/commit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    files: Array.from(this.modifiedFiles),
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
                // Limpar arquivos modificados
                this.modifiedFiles.clear();
                this.updateFileIcons();
                this.updateGitButton();
                
                window.manatiEditor.ui.showToast(
                    `✅ Commit realizado com sucesso! Hash: ${data.commitHash?.substring(0, 7)}`, 
                    'success'
                );
            } else {
                window.manatiEditor.ui.showToast(
                    `❌ Erro ao fazer commit: ${data.error}`, 
                    'error'
                );
            }
        } catch (error) {
            console.error('Erro ao fazer commit:', error);
            window.manatiEditor.ui.showToast('❌ Erro ao publicar alterações', 'error');
        } finally {
            this.setGitButtonLoading(false);
        }
    }

    /**
     * Mostra modal de confirmação de commit
     */
    async showCommitModal() {
        const filesList = Array.from(this.modifiedFiles).map(file => `• ${file}`).join('\n');
        
        return new Promise((resolve) => {
            // Criar modal dinamicamente
            const modalHtml = `
                <div class="modal fade" id="gitCommitModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="bi bi-git"></i> Publicar Alterações
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label fw-bold">Arquivos que serão publicados:</label>
                                    <div class="border rounded p-2 bg-light" style="max-height: 150px; overflow-y: auto;">
                                        <pre class="mb-0 small">${filesList}</pre>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="commitMessage" class="form-label fw-bold">Mensagem do commit:</label>
                                    <textarea 
                                        class="form-control" 
                                        id="commitMessage" 
                                        rows="3" 
                                        placeholder="Descreva as alterações realizadas..."
                                        required
                                    >Atualizações via Manati Editor</textarea>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-info" id="confirmCommitBtn">
                                    <i class="bi bi-git"></i> Publicar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Adicionar modal ao DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const modal = new bootstrap.Modal(document.getElementById('gitCommitModal'));
            const confirmBtn = document.getElementById('confirmCommitBtn');
            const messageInput = document.getElementById('commitMessage');
            
            confirmBtn.addEventListener('click', () => {
                const message = messageInput.value.trim();
                if (!message) {
                    window.manatiEditor.ui.showToast('Por favor, insira uma mensagem para o commit', 'warning');
                    return;
                }
                
                modal.hide();
                resolve({ confirmed: true, message });
            });
            
            // Cleanup quando modal for fechado
            document.getElementById('gitCommitModal').addEventListener('hidden.bs.modal', () => {
                document.getElementById('gitCommitModal').remove();
                resolve({ confirmed: false });
            });
            
            modal.show();
            messageInput.focus();
        });
    }

    /**
     * Define estado de loading do botão Git
     */
    setGitButtonLoading(loading) {
        const gitBtn = document.getElementById('gitCommitBtn');
        const btnText = document.getElementById('gitBtnText');
        const icon = gitBtn.querySelector('i');
        
        if (loading) {
            gitBtn.disabled = true;
            btnText.textContent = 'Publicando...';
            icon.className = 'bi bi-hourglass-split';
        } else {
            this.updateGitButton(); // Restaurar estado normal
            icon.className = 'bi bi-git';
        }
    }

    /**
     * Desabilita funcionalidades Git
     */
    disableGitFeatures() {
        const gitBtn = document.getElementById('gitCommitBtn');
        if (gitBtn) {
            gitBtn.style.display = 'none';
        }
    }

    /**
     * Hook chamado quando um arquivo é salvo
     */
    onFileSaved(filePath) {
        this.markFileAsModified(filePath);
    }

    /**
     * Obtém status dos arquivos modificados
     */
    getModifiedFilesStatus() {
        return {
            count: this.modifiedFiles.size,
            files: Array.from(this.modifiedFiles),
            gitAvailable: this.isGitAvailable
        };
    }
}
