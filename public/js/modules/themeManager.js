/**
 * Módulo para gerenciamento de temas
 */
export class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        const savedTheme = localStorage.getItem('manati-theme') || 'dark';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        // Aplicar tema ao documento
        document.documentElement.setAttribute('data-bs-theme', theme);
        
        // Aplicar tema ao body também para garantir compatibilidade
        document.body.setAttribute('data-bs-theme', theme);
        
        // Atualizar ícone do botão
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = theme === 'light' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
        }
        
        // Salvar preferência
        localStorage.setItem('manati-theme', theme);
        
        // Forçar re-renderização dos estilos
        this.forceStyleUpdate();
    }

    forceStyleUpdate() {
        // Forçar atualização de estilos para elementos que podem não atualizar automaticamente
        const elementsToUpdate = [
            '.editor-textarea',
            '.form-control'
        ];
        
        elementsToUpdate.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Força recalculo do estilo
                element.style.display = 'none';
                element.offsetHeight; // Trigger reflow
                element.style.display = '';
            });
        });
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-bs-theme') || 'light';
    }
}
