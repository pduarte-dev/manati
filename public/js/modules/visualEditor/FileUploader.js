/**
 * FileUploader - Gerencia upload de arquivos e imagens
 */
class FileUploader {
    constructor(editor) {
        this.editor = editor;
    }

    async handleImageUpload(event) {
        const files = Array.from(event.target.files);
        
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                this.editor.showToast('Apenas arquivos de imagem são permitidos.', 'warning');
                continue;
            }

            try {
                this.showUploadProgress(`Enviando ${file.name}...`);
                
                const result = await this.uploadFileToServer(file);
                
                if (result.success) {
                    this.insertImage(result.url, file.name);
                    this.editor.showToast(`Imagem ${file.name} enviada com sucesso!`, 'success');
                } else {
                    throw new Error(result.error || 'Erro no upload');
                }
            } catch (error) {
                console.error('Erro no upload da imagem:', error);
                this.editor.showToast(`Erro ao enviar ${file.name}: ${error.message}`, 'error');
            } finally {
                this.hideUploadProgress();
            }
        }
        
        // Limpar input
        event.target.value = '';
    }

    async handleFileUpload(event) {
        const files = Array.from(event.target.files);
        
        for (const file of files) {
            try {
                this.showUploadProgress(`Enviando ${file.name}...`);
                
                const result = await this.uploadFileToServer(file);
                
                if (result.success) {
                    this.insertFileLink(result.url, file.name);
                    this.editor.showToast(`Arquivo ${file.name} enviado com sucesso!`, 'success');
                } else {
                    throw new Error(result.error || 'Erro no upload');
                }
            } catch (error) {
                console.error('Erro no upload do arquivo:', error);
                this.editor.showToast(`Erro ao enviar ${file.name}: ${error.message}`, 'error');
            } finally {
                this.hideUploadProgress();
            }
        }
        
        // Limpar input
        event.target.value = '';
    }

    async uploadFileToServer(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        return await response.json();
    }

    showUploadProgress(message) {
        // Criar ou atualizar indicador de progresso
        let progress = document.getElementById('uploadProgress');
        if (!progress) {
            progress = document.createElement('div');
            progress.id = 'uploadProgress';
            progress.style.position = 'fixed';
            progress.style.top = '20px';
            progress.style.right = '20px';
            progress.style.zIndex = '9999';
            progress.style.maxWidth = '300px';
            document.body.appendChild(progress);
        }
        
        progress.innerHTML = `
            <div class="alert alert-info d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                ${message}
            </div>
        `;
    }

    hideUploadProgress() {
        const progress = document.getElementById('uploadProgress');
        if (progress) {
            setTimeout(() => {
                progress.remove();
            }, 1000);
        }
    }

    insertImage(url, alt = '') {
        const img = document.createElement('img');
        img.src = url;
        img.alt = alt;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        
        this.insertElementAtCursor(img);
        this.editor.onContentChange();
    }

    insertFileLink(url, fileName) {
        const link = document.createElement('a');
        link.href = url;
        link.textContent = `📎 ${fileName}`;
        link.download = fileName;
        link.target = '_blank';
        
        this.insertElementAtCursor(link);
        this.editor.onContentChange();
    }

    insertElementAtCursor(element) {
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(element);
            
            // Posicionar cursor após o elemento
            range.setStartAfter(element);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // Se não há seleção, inserir no final do editor
            this.editor.editorElement.appendChild(element);
        }
        
        this.editor.editorElement.focus();
    }
}

export { FileUploader };
