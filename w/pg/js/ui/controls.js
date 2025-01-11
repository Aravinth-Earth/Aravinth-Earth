export class Controls {
    constructor() {
        this.initializeElements();
        this.initializeState();
    }

    initializeElements() {
        this.lengthSlider = document.getElementById('lengthSlider');
        this.lengthInput = document.getElementById('length');
        this.wordLengthSlider = document.getElementById('wordLengthSlider');
        this.wordLengthInput = document.getElementById('wordLength');
        this.symbolsCheckbox = document.getElementById('symbols');
        this.symbolLevels = document.getElementById('symbolLevels');
        this.customSymbolsSection = document.getElementById('customSymbolsSection');
    }

    initializeState() {
        this.updateSymbolLevelsVisibility();
        this.updateCustomSymbolsVisibility();
    }

    getCharacterSettings() {
        return {
            length: parseInt(this.lengthInput.value) || 12,
            hasUpper: document.getElementById('uppercase').checked,
            hasLower: document.getElementById('lowercase').checked,
            hasNumbers: document.getElementById('numbers').checked,
            hasSymbols: this.symbolsCheckbox.checked,
            symbolLevel: document.querySelector('input[name="symbolLevel"]:checked')?.value
        };
    }

    getWordSettings() {
        return {
            wordCount: parseInt(document.getElementById('wordCount').value),
            wordLength: parseInt(this.wordLengthInput.value),
            wordCase: document.querySelector('input[name="wordCase"]:checked')?.value,
            separator: this.getSeparator(),
            appendNumber: document.getElementById('appendNumber').checked,
            numberLength: parseInt(document.getElementById('numberLength').value),
            patternType: document.querySelector('input[name="patternType"]:checked')?.value
        };
    }

    getSeparator() {
        const separatorInput = document.querySelector('input[name="separator"]:checked');
        return separatorInput?.value === 'custom' 
            ? document.getElementById('customSeparator').value 
            : separatorInput?.value;
    }

    updateSymbolLevelsVisibility() {
        this.symbolLevels.style.display = 
            this.symbolsCheckbox.checked ? 'block' : 'none';
    }

    updateCustomSymbolsVisibility() {
        const isCustom = document.querySelector('input[name="symbolLevel"]:checked')?.value === 'custom';
        this.customSymbolsSection.style.display = isCustom ? 'block' : 'none';
    }

    getCustomSymbols() {
        return {
            include: document.getElementById('includeSymbols').value,
            exclude: document.getElementById('excludeSymbols').value
        };
    }

    setMode(mode) {
        document.querySelectorAll('.mode-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        document.getElementById('wordControls').style.display = 
            mode === 'words' ? 'block' : 'none';
        document.querySelector('.controls-section:not(#wordControls)').style.display = 
            mode === 'chars' ? 'block' : 'none';
    }

    validateSettings(settings) {
        if (settings.length < 1) return false;
        if (!settings.hasUpper && !settings.hasLower && 
            !settings.hasNumbers && !settings.hasSymbols) return false;
        return true;
    }
}
