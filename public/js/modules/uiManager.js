/**
 * Módulo para gerenciamento da interface do usuário
 */
export class UIManager {
    constructor() {
        this.toastContainer = null;
        this.sidebarVisible = true;
    }

    enableEditorTabs() {
        // Habilitar abas Visual e Markdown quando um arquivo for selecionado
        const visualTab = document.querySelector('[data-bs-target="#visual-tab"]');
        const markdownTab = document.querySelector('[data-bs-target="#editor-tab"]');
        
        if (visualTab) {
            visualTab.disabled = false;
            visualTab.classList.remove('disabled');
            visualTab.style.pointerEvents = 'auto';
            visualTab.style.opacity = '1';
        }
        
        if (markdownTab) {
            markdownTab.disabled = false;
            markdownTab.classList.remove('disabled');
            markdownTab.style.pointerEvents = 'auto';
            markdownTab.style.opacity = '1';
        }
    }

    disableEditorTabs() {
        // Desabilitar abas Visual e Markdown quando não há arquivo selecionado
        const visualTab = document.querySelector('[data-bs-target="#visual-tab"]');
        const markdownTab = document.querySelector('[data-bs-target="#editor-tab"]');
        
        if (visualTab) {
            visualTab.disabled = true;
            visualTab.classList.add('disabled');
            visualTab.style.pointerEvents = 'none';
            visualTab.style.opacity = '0.5';
        }
        
        if (markdownTab) {
            markdownTab.disabled = true;
            markdownTab.classList.add('disabled');
            markdownTab.style.pointerEvents = 'none';
            markdownTab.style.opacity = '0.5';
        }
        
        // Voltar para a aba Preview se estiver em uma aba desabilitada
        if (window.manatiEditor.activeEditor === 'visual' || window.manatiEditor.activeEditor === 'markdown') {
            const previewTab = document.querySelector('[data-bs-target="#preview-tab"]');
            if (previewTab) {
                previewTab.click();
            }
        }
    }

    updateSaveButton() {
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.disabled = !window.manatiEditor.hasUnsavedChanges;
        }
    }

    toggleSidebar() {
        // Sidebar sempre visível - funcionalidade desabilitada
        window.logger.debug('Sidebar sempre visível - toggle desabilitado');
    }

    showToast(message, type = 'info') {
        if (!this.toastContainer) {
            this.createToastContainer();
        }

        // Definir ícones para cada tipo
        const icons = {
            success: 'bi-check-circle-fill',
            error: 'bi-exclamation-triangle-fill',
            warning: 'bi-exclamation-circle-fill',
            info: 'bi-info-circle-fill'
        };

        // Definir cores para cada tipo
        const colors = {
            success: 'text-bg-success',
            error: 'text-bg-danger',
            warning: 'text-bg-warning',
            info: 'text-bg-info'
        };

        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center ${colors[type] || colors.info} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi ${icons[type] || icons.info} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        this.toastContainer.appendChild(toast);

        // Mostrar toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: type === 'error' ? 5000 : 3000
        });
        bsToast.show();

        // Remover do DOM após ser ocultado
        toast.addEventListener('hidden.bs.toast', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        this.toastContainer.style.zIndex = '9999';
        document.body.appendChild(this.toastContainer);
    }

    showModal(modalId) {
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
    }

    hideModal(modalId) {
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById(modalId));
        if (modalInstance) {
            modalInstance.hide();
        }
   }

    showConfirm(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
        return new Promise((resolve) => {
            // Configurar modal
            document.getElementById('confirmModalTitle').textContent = title;
            document.getElementById('confirmModalMessage').textContent = message;
            
            const confirmBtn = document.getElementById('confirmModalConfirm');
            confirmBtn.textContent = confirmText;
            
            // Limpar eventos anteriores
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            
            // Adicionar evento de confirmação
            newConfirmBtn.addEventListener('click', () => {
                this.hideModal('confirmModal');
                resolve(true);
            });
            
            // Adicionar evento de cancelamento
            const modal = document.getElementById('confirmModal');
            const handleCancel = () => {
                resolve(false);
                modal.removeEventListener('hidden.bs.modal', handleCancel);
            };
            
            modal.addEventListener('hidden.bs.modal', handleCancel, { once: true });
            
            // Mostrar modal
            this.showModal('confirmModal');
        });
    }

    showInput(title, label, defaultValue = '', placeholder = '', validator = null) {
        return new Promise((resolve) => {
            // Configurar modal
            document.getElementById('inputModalTitle').textContent = title;
            document.getElementById('inputModalLabel').textContent = label;
            
            const inputField = document.getElementById('inputModalField');
            inputField.value = defaultValue;
            inputField.placeholder = placeholder;
            
            // Limpar classes de validação
            inputField.classList.remove('is-invalid');
            const validationDiv = document.getElementById('inputModalValidation');
            if (validationDiv) {
                validationDiv.style.display = 'none';
                validationDiv.innerHTML = '';
            }
            
            const confirmBtn = document.getElementById('inputModalConfirm');
            
            // Limpar eventos anteriores
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            
            // Função de validação em tempo real
            let currentValue = defaultValue;
            const validateInput = () => {
                const value = inputField.value.trim();
                currentValue = value;
                const validationDiv = document.getElementById('inputModalValidation');
                
                if (validator && value) {
                    const validation = validator(value);
                    if (!validation.isValid) {
                        inputField.classList.add('is-invalid');
                        if (validationDiv) {
                            validationDiv.innerHTML = validation.message;
                            validationDiv.style.display = 'block';
                            validationDiv.style.color = '#dc3545'; // Cor vermelha
                        }
                        newConfirmBtn.disabled = true;
                        return false;
                    }
                }
                
                inputField.classList.remove('is-invalid');
                if (validationDiv) {
                    validationDiv.style.display = 'none';
                    validationDiv.innerHTML = '';
                }
                newConfirmBtn.disabled = false;
                return true;
            };
            
            // Adicionar validação em tempo real se validator fornecido
            if (validator) {
                inputField.addEventListener('input', validateInput);
                // Validar valor inicial
                setTimeout(validateInput, 100);
            }
            
            // Adicionar evento de confirmação
            const handleConfirm = () => {
                const value = inputField.value.trim();
                if (validator && !validator(value).isValid) {
                    return; // Não confirmar se inválido
                }
                this.hideModal('inputModal');
                resolve(value || null);
            };
            
            newConfirmBtn.addEventListener('click', handleConfirm);
            
            // Adicionar evento de Enter no input
            const handleEnter = (e) => {
                if (e.key === 'Enter') {
                    const value = inputField.value.trim();
                    if (validator && !validator(value).isValid) {
                        return; // Não confirmar se inválido
                    }
                    this.hideModal('inputModal');
                    resolve(value || null);
                }
            };
            
            inputField.addEventListener('keydown', handleEnter);
            
            // Adicionar evento de cancelamento
            const modal = document.getElementById('inputModal');
            const handleCancel = () => {
                resolve(null);
                inputField.removeEventListener('keydown', handleEnter);
                if (validator) {
                    inputField.removeEventListener('input', validateInput);
                }
                modal.removeEventListener('hidden.bs.modal', handleCancel);
            };
            
            modal.addEventListener('hidden.bs.modal', handleCancel, { once: true });
            
            // Mostrar modal e focar no input
            this.showModal('inputModal');
            setTimeout(() => {
                inputField.focus();
                inputField.select();
            }, 300);
        });
    }

    /**
     * Mostra os controles do documento quando um arquivo está aberto
     */
    showDocumentControls() {
        const documentActions = document.getElementById('documentActions');
        if (documentActions) {
            documentActions.style.display = 'block';
        }
        
        // Habilitar abas do editor
        this.enableEditorTabs();
    }

    /**
     * Oculta os controles do documento quando nenhum arquivo está aberto
     */
    hideDocumentControls() {
        const documentActions = document.getElementById('documentActions');
        if (documentActions) {
            documentActions.style.display = 'none';
        }
        
        // Desabilitar abas do editor
        this.disableEditorTabs();
    }

    /**
     * Alterna entre busca e botões normais da sidebar
     */
    toggleSearch(show = null) {
        const normalActions = document.getElementById('normalActions');
        const searchContainer = document.getElementById('searchContainer');
        const searchInput = document.getElementById('fileSearchInput');
        
        if (show === null) {
            // Auto-detectar baseado no estado atual
            show = searchContainer && searchContainer.style.display === 'none';
        }
        
        if (show) {
            // Mostrar busca
            if (normalActions) normalActions.style.display = 'none';
            if (searchContainer) searchContainer.style.display = 'block';
            if (searchInput) {
                searchInput.focus();
                searchInput.value = '';
            }
        } else {
            // Mostrar botões normais
            if (normalActions) normalActions.style.display = 'flex';
            if (searchContainer) searchContainer.style.display = 'none';
            if (searchInput) searchInput.value = '';
            
            // Limpar busca se necessário
            if (window.manatiEditor && window.manatiEditor.fileManager) {
                window.manatiEditor.fileManager.clearSearch();
            }
        }
    }
}
