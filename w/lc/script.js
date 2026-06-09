document.addEventListener('DOMContentLoaded', () => {
    const clock = document.getElementById('clock');
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const toggleFormatButton = document.getElementById('toggle-format');
    const colorModeSelect = document.getElementById('color-mode');
    const fontSizeSlider = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    const toggleFullscreenButton = document.getElementById('toggle-fullscreen');
    const footer = document.querySelector('footer');

    let is24HourFormat = true;
    let colorMode = 'pitch-dark';
    let dynamicColorInterval;
    let prevPanelDisplay = '';

    const updateClock = () => {
        const now = new Date();
        const hours = is24HourFormat ? now.getHours() : now.getHours() % 12 || 12;
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const ampm = !is24HourFormat ? now.getHours() >= 12 ? ' PM' : ' AM' : '';

        clock.innerHTML = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}${ampm}`;
    };

    const toggleFormat = () => {
        is24HourFormat = !is24HourFormat;
        toggleFormatButton.textContent = is24HourFormat ? 'Switch to 12-Hour Format' : 'Switch to 24-Hour Format';
        localStorage.setItem('is24HourFormat', is24HourFormat);
        updateClock();
    };

    const changeColorMode = (e) => {
        colorMode = e.target.value;
        localStorage.setItem('colorMode', colorMode);
        document.body.className = colorMode;
        if (colorMode === 'dynamic-color') {
            startDynamicColorChange();
        } else {
            stopDynamicColorChange();
        }
    };

    const startDynamicColorChange = () => {
        let hue = 0;
        dynamicColorInterval = setInterval(() => {
            const backgroundColor = `hsl(${hue}, 100%, 50%)`;
            document.body.style.backgroundColor = backgroundColor;

            const textColor = hue >= 180 && hue < 360 ? '#000' : '#fff';
            document.body.style.color = textColor;
            hue = (hue + 1) % 360;
        }, 50);
    };

    const stopDynamicColorChange = () => {
        clearInterval(dynamicColorInterval);
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
    };

    const adjustFontSize = (e) => {
        const fontSize = e.target.value;
        fontSizeValue.textContent = `${fontSize}px`;
        clock.style.fontSize = `${fontSize}px`;
        localStorage.setItem('fontSize', fontSize);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            prevPanelDisplay = settingsPanel.style.display;
            settingsPanel.style.display = 'none';
            document.documentElement.requestFullscreen().then(() => {
                document.body.classList.add('fullscreen');
                footer.style.display = 'none';
            }).catch((err) => {
                settingsPanel.style.display = prevPanelDisplay;
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen().then(() => {
                document.body.classList.remove('fullscreen');
                footer.style.display = '';
                if (prevPanelDisplay === 'block') {
                    settingsPanel.style.display = 'block';
                }
            }).catch((err) => {
                console.error(`Error attempting to disable full-screen mode: ${err.message} (${err.name})`);
            });
        }
    };

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            prevPanelDisplay = settingsPanel.style.display;
            settingsPanel.style.display = 'none';
            document.body.classList.add('fullscreen');
            footer.style.display = 'none';
        } else {
            document.body.classList.remove('fullscreen');
            footer.style.display = '';
            if (prevPanelDisplay === 'block') {
                settingsPanel.style.display = 'block';
            }
        }
    });

    settingsButton.addEventListener('click', () => {
        settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
    });

    toggleFormatButton.addEventListener('click', toggleFormat);
    colorModeSelect.addEventListener('change', changeColorMode);
    fontSizeSlider.addEventListener('input', adjustFontSize);
    toggleFullscreenButton.addEventListener('click', toggleFullscreen);

    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        fontSizeSlider.value = savedFontSize;
        fontSizeValue.textContent = `${savedFontSize}px`;
        clock.style.fontSize = `${savedFontSize}px`;
    } else {
        fontSizeSlider.value = '80';
        fontSizeValue.textContent = '80px';
        clock.style.fontSize = '80px';
    }

    const savedFormat = localStorage.getItem('is24HourFormat');
    if (savedFormat !== null) {
        is24HourFormat = savedFormat === 'true';
        toggleFormatButton.textContent = is24HourFormat ? 'Switch to 12-Hour Format' : 'Switch to 24-Hour Format';
    }

    const savedColorMode = localStorage.getItem('colorMode');
    if (savedColorMode && savedColorMode !== colorMode) {
        colorModeSelect.value = savedColorMode;
        colorMode = savedColorMode;
        document.body.className = colorMode;
        if (colorMode === 'dynamic-color') {
            startDynamicColorChange();
        }
    }

    updateClock();
    setInterval(updateClock, 1000);
});
