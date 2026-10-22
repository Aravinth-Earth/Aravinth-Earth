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

    // The colour modes are the values of the select below. They are read
    // from the markup rather than hardcoded, so the stored value can be
    // checked against the options the page actually offers.
    const colorModeValues = Array.from(colorModeSelect.options).map((option) => option.value);

    // "pitch-dark" is the body class the page starts with (see
    // clock.html) and it is what paints the page's background, so it stays
    // on the body through every colour change -- only the other mode
    // classes are swapped. Dropping it left the body with no background
    // at all, so in a dark site theme the clock's digits (which are drawn
    // in the theme's light text colour) vanished into the page.
    const BASE_COLOR_MODE = colorModeValues.includes('pitch-dark') ? 'pitch-dark' : colorModeValues[0];

    let is24HourFormat = true;
    let colorMode = BASE_COLOR_MODE;
    let dynamicColorInterval;
    let prevPanelDisplay = '';

    // The colour mode is a class on <body>, and the body's class list is
    // shared with the site chrome: the About & Privacy modal adds
    // "about-modal-open" to it to lock the page's scrolling behind the
    // dialog. So the mode is swapped with classList and never by
    // assigning className, which would wipe every other class on the
    // body (the scroll lock, the "fullscreen" class, ...).
    const applyColorMode = (mode) => {
        colorModeValues.forEach((value) => {
            if (value !== BASE_COLOR_MODE) {
                document.body.classList.remove(value);
            }
        });
        document.body.classList.add(mode);
    };

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
        // Namespaced: the bare key "is24HourFormat" was shared with every
        // other script on this origin.
        localStorage.setItem('clock.is24HourFormat', is24HourFormat);
        updateClock();
    };

    const changeColorMode = (e) => {
        const mode = e.target.value;
        // Only a value the select actually offers is applied.
        if (!colorModeValues.includes(mode)) return;

        colorMode = mode;
        localStorage.setItem('clock.colorMode', colorMode);
        applyColorMode(colorMode);
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
        localStorage.setItem('clock.fontSize', fontSize);
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

    const savedFontSize = localStorage.getItem('clock.fontSize');
    if (savedFontSize) {
        fontSizeSlider.value = savedFontSize;
        fontSizeValue.textContent = `${savedFontSize}px`;
        clock.style.fontSize = `${savedFontSize}px`;
    } else {
        fontSizeSlider.value = '80';
        fontSizeValue.textContent = '80px';
        clock.style.fontSize = '80px';
    }

    const savedFormat = localStorage.getItem('clock.is24HourFormat');
    if (savedFormat !== null) {
        is24HourFormat = savedFormat === 'true';
        toggleFormatButton.textContent = is24HourFormat ? 'Switch to 12-Hour Format' : 'Switch to 24-Hour Format';
    }

    const savedColorMode = localStorage.getItem('clock.colorMode');
    // Only a value the select actually offers is applied. An unknown value
    // -- a stale key, or one written by another script on this origin --
    // is ignored, so the clock keeps its own default instead of losing
    // all of its styling.
    if (savedColorMode && colorModeValues.includes(savedColorMode)) {
        colorMode = savedColorMode;
        colorModeSelect.value = savedColorMode;
        applyColorMode(colorMode);
        if (colorMode === 'dynamic-color') {
            startDynamicColorChange();
        }
    }

    updateClock();
    setInterval(updateClock, 1000);
});
