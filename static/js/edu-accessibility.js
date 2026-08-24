// AuraMeet Edu - Inclusion & Accessibility Suite (SDG 10)
class EduAccessibility {
    constructor() {
        this.fontSize = 'medium';
        this.themeMode = 'default';
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const modal = document.getElementById('edu-accessibility-modal');
        const openBtns = [
            document.getElementById('toggle-accessibility-btn'),
            document.getElementById('edu-accessibility-dropdown-btn')
        ];

        openBtns.forEach(btn => {
            if (btn && modal) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    modal.style.display = 'flex';
                });
            }
        });
    }

    setFontSize(size) {
        this.fontSize = size;
        document.body.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
        document.body.classList.add(`font-${size}`);
    }

    setThemeMode(mode) {
        this.themeMode = mode;
        document.body.classList.remove('theme-oled', 'theme-yellow');
        if (mode === 'oled') {
            document.body.classList.add('theme-oled');
        } else if (mode === 'yellow') {
            document.body.classList.add('theme-yellow');
        }
    }
}

window.eduAccessibility = new EduAccessibility();
