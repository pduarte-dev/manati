/**
 * Módulo para gerenciamento de travamento de arquivos (File Lock)
 */
export class FileLockManager {
    constructor() {
        this.current    /**
     * Inicia as atualizações de atividade
     */
    startActivityUpdates(filePath) {
        this.stopActivityUpdates(); // Parar qualquer atualização anterior
        
        this.activityInterval = setInterval(async () => {
            // Só atualizar se ainda estivermos com o arquivo atual
            if (this.currentFile === filePath) {
                await this.updateActivity(filePath);
            } else {
                this.stopActivityUpdates();
            }
        }, this.ACTIVITY_UPDATE_INTERVAL);
    }w Map(); // Armazena locks ativos
        this.currentFile = null;
        this.lockCheckInterval = null;
        this.activityInterval = null;
        this.ACTIVITY_UPDATE_INTERVAL = 30000; // 30 segundos
        this.LOCK_CHECK_INTERVAL = 60000; // 1 minuto
    }

    /**
     * Inicializa o gerenciador de locks
     */
    init() {
        this.startPeriodicChecks();
        this.setupWindowEvents();
    }

    /**
     * Tenta adquirir um lock para um arquivo
     */
    async acquireLock(filePath) {
        try {
            const userInfo = window.manatiEditor.auth.getUserInfo();
            
            const response = await fetch(`/api/file/${encodeURIComponent(filePath)}/lock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userInfo.id,
                    userName: userInfo.name
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentFile = filePath;
                this.startActivityUpdates(filePath);
                
                // Atualizar cache local do lock
                this.currentLocks.set(filePath, {
                    userId: userInfo.id,
                    userName: userInfo.name,
                    timestamp: Date.now()
                });
                
                // Atualizar ícones imediatamente
                this.updateFileTreeIcons();
                
                console.log(`Lock adquirido para: ${filePath}`);
                return { success: true };
            } else {
                console.log(`Lock negado para: ${filePath} - ${data.error}`);
                return { success: false, error: data.error, currentLock: data.currentLock };
            }
        } catch (error) {
            console.error('Erro ao adquirir lock:', error);
            return { success: false, error: 'Erro de comunicação com o servidor' };
        }
    }

    /**
     * Libera o lock de um arquivo
     */
    async releaseLock(filePath) {
        try {
            const userInfo = window.manatiEditor.auth.getUserInfo();
            
            const response = await fetch(`/api/file/${encodeURIComponent(filePath)}/lock`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userInfo.id
                })
            });

            const data = await response.json();

            if (data.success) {
                if (this.currentFile === filePath) {
                    this.currentFile = null;
                    this.stopActivityUpdates();
                }
                
                // Remover do cache local
                this.currentLocks.delete(filePath);
                
                // Atualizar ícones imediatamente
                this.updateFileTreeIcons();
                
                console.log(`Lock liberado para: ${filePath}`);
                return true;
            } else {
                console.warn(`Erro ao liberar lock: ${data.error}`);
                return false;
            }
        } catch (error) {
            console.error('Erro ao liberar lock:', error);
            return false;
        }
    }

    /**
     * Verifica se um arquivo está travado
     */
    async checkLock(filePath) {
        try {
            const response = await fetch(`/api/file/${encodeURIComponent(filePath)}/lock`);
            const data = await response.json();
            
            return data;
        } catch (error) {
            console.error('Erro ao verificar lock:', error);
            return { locked: false };
        }
    }

    /**
     * Obtém todos os locks ativos
     */
    async getAllLocks() {
        try {
            const response = await fetch('/api/locks');
            const locks = await response.json();
            
            // Atualizar cache local
            this.currentLocks.clear();
            locks.forEach(lock => {
                this.currentLocks.set(lock.filePath, lock);
            });
            
            return locks;
        } catch (error) {
            console.error('Erro ao obter locks:', error);
            return [];
        }
    }

    /**
     * Inicia atualizações periódicas de atividade
     */
    startActivityUpdates(filePath) {
        this.stopActivityUpdates(); // Parar qualquer atualização anterior
        
        this.activityInterval = setInterval(async () => {
            await this.updateActivity(filePath);
        }, this.ACTIVITY_UPDATE_INTERVAL);
    }

    /**
     * Para as atualizações de atividade
     */
    stopActivityUpdates() {
        if (this.activityInterval) {
            clearInterval(this.activityInterval);
            this.activityInterval = null;
        }
    }

    /**
     * Atualiza a atividade do lock atual
     */
    async updateActivity(filePath) {
        if (!filePath) return;
        
        try {
            const userInfo = window.manatiEditor.auth.getUserInfo();
            
            const response = await fetch(`/api/file/${encodeURIComponent(filePath)}/lock/activity`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userInfo.id
                })
            });

            const data = await response.json();
            
            if (!response.ok || !data.success) {
                console.warn('Perdeu o lock do arquivo:', filePath);
                
                // Verificar o status atual do lock
                const currentLockInfo = await this.checkLock(filePath);
                
                if (currentLockInfo.locked && currentLockInfo.lock.userId !== userInfo.id) {
                    // Outro usuário tem o lock agora
                    this.handleLockLost(filePath, currentLockInfo.lock);
                } else if (!currentLockInfo.locked) {
                    // Arquivo não está mais travado, tentar readquirir
                    const lockResult = await this.acquireLock(filePath);
                    if (!lockResult.success) {
                        this.handleLockLost(filePath, lockResult.currentLock);
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar atividade:', error);
            // Em caso de erro de rede, ainda tentar verificar o lock
            try {
                const currentLockInfo = await this.checkLock(filePath);
                if (currentLockInfo.locked) {
                    const userInfo = window.manatiEditor.auth.getUserInfo();
                    if (currentLockInfo.lock.userId !== userInfo.id) {
                        this.handleLockLost(filePath, currentLockInfo.lock);
                    }
                }
            } catch (secondaryError) {
                console.error('Erro secundário ao verificar lock:', secondaryError);
            }
        }
    }

    /**
     * Inicia verificações periódicas de locks
     */
    startPeriodicChecks() {
        this.lockCheckInterval = setInterval(async () => {
            await this.getAllLocks();
            this.updateFileTreeIcons();
        }, this.LOCK_CHECK_INTERVAL);
    }

    /**
     * Para as verificações periódicas
     */
    stopPeriodicChecks() {
        if (this.lockCheckInterval) {
            clearInterval(this.lockCheckInterval);
            this.lockCheckInterval = null;
        }
    }

    /**
     * Atualiza os ícones na árvore de arquivos
     */
    updateFileTreeIcons() {
        const fileItems = document.querySelectorAll('.file-item:not(.folder)');
        
        fileItems.forEach(item => {
            const fileName = this.extractFileNameFromItem(item);
            if (!fileName) return;
            
            const lock = this.currentLocks.get(fileName);
            const icon = item.querySelector('i.bi');
            
            if (lock) {
                // Arquivo está sendo editado
                const userInfo = window.manatiEditor.auth.getUserInfo();
                const isMyLock = lock.userId === userInfo.id;
                
                if (isMyLock) {
                    // Meu lock - ícone de lápis verde
                    icon.className = 'bi bi-pencil-fill text-success';
                    item.title = `Você está editando este arquivo`;
                } else {
                    // Lock de outro usuário - ícone de lápis laranja
                    icon.className = 'bi bi-pencil-fill text-warning';
                    item.title = `Sendo editado por: ${lock.userName}`;
                }
                
                // Adicionar classe para styling
                item.classList.add('file-locked');
                if (isMyLock) {
                    item.classList.add('my-lock');
                } else {
                    item.classList.add('other-lock');
                }
            } else {
                // Arquivo livre - ícone normal
                icon.className = 'bi bi-file-text';
                item.title = '';
                item.classList.remove('file-locked', 'my-lock', 'other-lock');
            }
        });
    }

    /**
     * Extrai o nome do arquivo de um item da árvore
     */
    extractFileNameFromItem(item) {
        // Verificar se o item tem o event listener de click
        const clickHandler = item.onclick;
        if (clickHandler) {
            const handlerStr = clickHandler.toString();
            const pathMatch = handlerStr.match(/loadFile\(['"]([^'"]+)['"]\)/);
            if (pathMatch) {
                return pathMatch[1];
            }
        }
        
        // Alternativa: procurar por data attributes ou outros métodos
        const filePath = item.dataset?.filePath;
        if (filePath) {
            return filePath;
        }
        
        // Como último recurso, tentar extrair do texto
        const fileNameSpan = item.querySelector('.file-name, .file-title');
        if (fileNameSpan && fileNameSpan.textContent) {
            // Este método é menos confiável, mas pode funcionar em alguns casos
            const fileName = fileNameSpan.textContent.trim();
            if (fileName && fileName.endsWith('.md')) {
                return fileName;
            }
        }
        
        return null;
    }

    /**
     * Manipula quando um lock é perdido
     */
    handleLockLost(filePath, lockInfo) {
        console.warn(`Lock perdido para: ${filePath}`);
        
        // Notificar usuário
        if (window.manatiEditor.ui) {
            const message = lockInfo.currentLock 
                ? `O arquivo está sendo editado por ${lockInfo.currentLock.userName}. Mudando para modo preview.`
                : 'Não foi possível manter o lock do arquivo. Mudando para modo preview.';
                
            window.manatiEditor.ui.showToast(message, 'warning');
        }
        
        // Colocar editores em modo preview
        this.setPreviewMode();
        
        // Parar atualizações
        this.stopActivityUpdates();
        this.currentFile = null;
    }

    /**
     * Trata quando perdemos o lock de um arquivo
     */
    handleLockLost(filePath, currentLock) {
        if (this.currentFile === filePath) {
            // Parar atualizações de atividade
            this.stopActivityUpdates();
            this.currentFile = null;
            
            // Forçar modo de visualização
            this.setPreviewMode();
            
            // Desabilitar editor
            const editor = document.getElementById('markdownEditor');
            if (editor) {
                editor.disabled = true;
            }
            
            // Mostrar aviso ao usuário
            const lockOwner = currentLock ? currentLock.userName : 'outro usuário';
            window.manatiEditor.ui.showToast(
                `O arquivo está sendo editado por ${lockOwner}. Modo de visualização ativado.`,
                'warning',
                5000
            );
            
            // Atualizar cache local
            if (currentLock) {
                this.currentLocks.set(filePath, currentLock);
            } else {
                this.currentLocks.delete(filePath);
            }
            
            // Atualizar ícones
            this.updateFileTreeIcons();
        }
    }

    /**
     * Coloca os editores em modo preview
     */
    setPreviewMode() {
        // Desabilitar abas de editor
        if (window.manatiEditor.ui) {
            window.manatiEditor.ui.disableEditorTabs();
        }
        
        // Forçar aba preview
        const previewTab = document.querySelector('[data-bs-target="#preview"]');
        if (previewTab) {
            previewTab.click();
        }
        
        // Ocultar editor visual se estiver ativo
        if (window.visualEditor && window.visualEditor.hide) {
            window.visualEditor.hide();
        }
    }

    /**
     * Configura eventos da janela
     */
    setupWindowEvents() {
        // Liberar locks ao fechar a janela/página
        window.addEventListener('beforeunload', () => {
            if (this.currentFile) {
                // Fazer requisição síncrona para liberar lock
                navigator.sendBeacon(
                    `/api/file/${encodeURIComponent(this.currentFile)}/lock`,
                    new Blob([JSON.stringify({
                        userId: window.manatiEditor.auth.getUserInfo().id
                    })], { type: 'application/json' })
                );
            }
        });
        
        // Liberar locks quando a página perde o foco por muito tempo
        let pageHiddenTime = 0;
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pageHiddenTime = Date.now();
            } else {
                if (pageHiddenTime && this.currentFile) {
                    const timeAway = Date.now() - pageHiddenTime;
                    // Se ficou ausente por mais de 10 minutos, liberar lock
                    if (timeAway > 10 * 60 * 1000) {
                        this.releaseLock(this.currentFile);
                    }
                }
                pageHiddenTime = 0;
            }
        });
        
        // Liberar locks quando a janela perde foco por muito tempo
        let windowBlurTime = 0;
        
        window.addEventListener('blur', () => {
            windowBlurTime = Date.now();
        });
        
        window.addEventListener('focus', () => {
            if (windowBlurTime && this.currentFile) {
                const timeAway = Date.now() - windowBlurTime;
                // Se ficou ausente por mais de 15 minutos, liberar lock
                if (timeAway > 15 * 60 * 1000) {
                    this.releaseLock(this.currentFile);
                }
            }
            windowBlurTime = 0;
        });
    }

    /**
     * Verifica se o usuário atual pode editar um arquivo
     */
    async canEdit(filePath) {
        const lockInfo = await this.checkLock(filePath);
        
        if (!lockInfo.locked) {
            return { canEdit: true };
        }
        
        const userInfo = window.manatiEditor.auth.getUserInfo();
        const isMyLock = lockInfo.lock.userId === userInfo.id;
        
        return {
            canEdit: isMyLock,
            lock: lockInfo.lock,
            isMyLock
        };
    }

    /**
     * Limpa todos os locks e para os intervalos
     */
    destroy() {
        this.stopPeriodicChecks();
        this.stopActivityUpdates();
        
        if (this.currentFile) {
            this.releaseLock(this.currentFile);
        }
        
        this.currentLocks.clear();
        this.currentFile = null;
    }
}
