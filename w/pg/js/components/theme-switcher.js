export class ThemeSwitcher {
    static init() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.applyTheme(savedTheme);
    }

    static toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }

    static applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeIcon = document.querySelector('.theme-switch i');
        themeIcon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        
        // Force redraw of colored elements
        document.querySelectorAll('[class*="char-"]').forEach(el => {
            el.style.display = 'none';
            el.offsetHeight; // Force reflow
            el.style.display = '';
        });
    }
}
