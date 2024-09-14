document.addEventListener('DOMContentLoaded', () => {
    const clock = document.getElementById('clock');
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const toggleFormatButton = document.getElementById('toggle-format');
    const colorModeSelect = document.getElementById('color-mode');
    const fontSizeSlider = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    const toggleFullscreenButton = document.getElementById('toggle-fullscreen');
    const container = document.querySelector('.container');
    const footer = document.querySelector('footer');

    let is24HourFormat = true;
    let colorMode = 'pitch-dark';
    let dynamicColorInterval;

    const updateClock = () => {
        const now = new Date();
        const hours = is24HourFormat ? now.getHours() : now.getHours() % 12 || 12;
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const ampm = !is24HourFormat && now.getHours() >= 12 ? ' PM' : ' AM';

        clock.innerHTML = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}${!is24HourFormat ? ampm : ''}`;
    };

    const toggleFormat = () => {
        is24HourFormat = !is24HourFormat;
        toggleFormatButton.textContent = is24HourFormat ? 'Switch to 12-Hour Format' : 'Switch to 24-Hour Format';
        updateClock();
    };

    const changeColorMode = (e) => {
        colorMode = e.target.value;
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
        fontSize = e.target.value;
        fontSizeValue.textContent = `${fontSize}px`;
        clock.style.fontSize = `${fontSize}px`;
        localStorage.setItem('fontSize', fontSize);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                document.body.classList.add('fullscreen');
                footer.style.display = 'none'; // Hide footer in fullscreen mode
            }).catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen().then(() => {
                document.body.classList.remove('fullscreen');
                footer.style.display = ''; // Show footer in normal mode
            }).catch((err) => {
                console.error(`Error attempting to disable full-screen mode: ${err.message} (${err.name})`);
            });
        }
    };

    // Add fullscreenchange event listener
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            document.body.classList.add('fullscreen');
            footer.style.display = 'none'; // Hide footer in fullscreen mode
        } else {
            document.body.classList.remove('fullscreen');
            footer.style.display = ''; // Show footer in normal mode
        }
    });

    settingsButton.addEventListener('click', () => {
        settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
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
        fontSizeSlider.value = 80;
        fontSizeValue.textContent = '100px';
        clock.style.fontSize = '100px';
    }

    updateClock();
    setInterval(updateClock, 1000);

    // Intersection Observer Example
    const target = document.querySelector('#target-element');
    if (target) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    console.log('Element is in view!');
                }
            });
        }, { threshold: 0.5 });
        observer.observe(target);
    }
});
