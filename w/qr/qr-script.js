document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const generateBtn = document.getElementById('generate-qr');
    const resetBtn = document.getElementById('reset-form');
    const qrContainer = document.getElementById('qrcode');
    const downloadPngBtn = document.getElementById('download-png');
    const downloadSvgBtn = document.getElementById('download-svg');
    const printQrBtn = document.getElementById('print-qr');
    const sizeSlider = document.getElementById('qr-size');
    const sizeDisplay = document.getElementById('size-display');
    const qrColor = document.getElementById('qr-color');
    const qrBgColor = document.getElementById('qr-bg-color');
    const errorCorrectionSelect = document.getElementById('qr-error-correction');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const wifiPasswordInput = document.getElementById('wifi-password');
    
    let qrCodeInstance = null;
    
    // Add invert colors checkbox after the background color
    const colorGroup = document.querySelector('.form-group:has(#qr-bg-color)');
    if (colorGroup) {
        const invertCheckboxContainer = document.createElement('div');
        invertCheckboxContainer.className = 'invert-option';
        
        const invertCheckboxLabel = document.createElement('label');
        invertCheckboxLabel.htmlFor = 'invert-colors';
        invertCheckboxLabel.textContent = 'Invert Colors (Better for scanning)';
        
        const invertCheckbox = document.createElement('input');
        invertCheckbox.type = 'checkbox';
        invertCheckbox.id = 'invert-colors';
        
        invertCheckboxContainer.appendChild(invertCheckbox);
        invertCheckboxContainer.appendChild(invertCheckboxLabel);
        colorGroup.appendChild(invertCheckboxContainer);
        
        invertCheckbox.addEventListener('change', () => {
            if (invertCheckbox.checked) {
                // Save original colors
                invertCheckbox.setAttribute('data-original-fg', qrColor.value);
                invertCheckbox.setAttribute('data-original-bg', qrBgColor.value);
                
                // Set to white on black
                qrColor.value = '#FFFFFF';
                qrBgColor.value = '#000000';
            } else {
                // Restore original colors if available
                const originalFg = invertCheckbox.getAttribute('data-original-fg');
                const originalBg = invertCheckbox.getAttribute('data-original-bg');
                
                if (originalFg) qrColor.value = originalFg;
                if (originalBg) qrBgColor.value = originalBg;
            }
            
            // If a QR code is already displayed, regenerate it
            if (qrCodeInstance) {
                const activeTabId = document.querySelector('.tab-btn.active').getAttribute('data-tab');
                const content = getContentForQR(activeTabId);
                if (content) {
                    generateQRCode(content);
                }
            }
        });
    }
    
    // Add fallback for browsers that don't support :has()
    if (!colorGroup) {
        const colorGroups = document.querySelectorAll('.form-group');
        let bgColorGroup = null;
        
        // Find the group containing the background color input
        colorGroups.forEach(group => {
            if (group.querySelector('#qr-bg-color')) {
                bgColorGroup = group;
            }
        });
        
        if (bgColorGroup) {
            const invertCheckboxContainer = document.createElement('div');
            invertCheckboxContainer.className = 'invert-option';
            
            const invertCheckboxLabel = document.createElement('label');
            invertCheckboxLabel.htmlFor = 'invert-colors';
            invertCheckboxLabel.textContent = 'Invert Colors (Better for scanning)';
            
            const invertCheckbox = document.createElement('input');
            invertCheckbox.type = 'checkbox';
            invertCheckbox.id = 'invert-colors';
            
            invertCheckboxContainer.appendChild(invertCheckbox);
            invertCheckboxContainer.appendChild(invertCheckboxLabel);
            bgColorGroup.appendChild(invertCheckboxContainer);
            
            invertCheckbox.addEventListener('change', () => {
                if (invertCheckbox.checked) {
                    invertCheckbox.setAttribute('data-original-fg', qrColor.value);
                    invertCheckbox.setAttribute('data-original-bg', qrBgColor.value);
                    qrColor.value = '#FFFFFF';
                    qrBgColor.value = '#000000';
                } else {
                    const originalFg = invertCheckbox.getAttribute('data-original-fg');
                    const originalBg = invertCheckbox.getAttribute('data-original-bg');
                    if (originalFg) qrColor.value = originalFg;
                    if (originalBg) qrBgColor.value = originalBg;
                }
                
                if (qrCodeInstance) {
                    const activeTabId = document.querySelector('.tab-btn.active').getAttribute('data-tab');
                    const content = getContentForQR(activeTabId);
                    if (content) {
                        generateQRCode(content);
                    }
                }
            });
        }
    }
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deactivate all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Activate clicked tab
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Update size display
    sizeSlider.addEventListener('input', () => {
        const size = sizeSlider.value;
        sizeDisplay.textContent = `${size}×${size}`;
    });
    
    // Toggle password visibility
    if (togglePasswordBtn && wifiPasswordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            if (wifiPasswordInput.type === 'password') {
                wifiPasswordInput.type = 'text';
                togglePasswordBtn.textContent = 'Hide';
            } else {
                wifiPasswordInput.type = 'password';
                togglePasswordBtn.textContent = 'Show';
            }
        });
    }
    
    // Generate QR Code
    generateBtn.addEventListener('click', () => {
        const activeTabId = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        const content = getContentForQR(activeTabId);
        
        if (!content) {
            alert('Please fill in required fields');
            return;
        }
        
        generateQRCode(content);
    });
    
    // Reset form
    resetBtn.addEventListener('click', () => {
        const forms = document.querySelectorAll('input, textarea, select');
        forms.forEach(form => {
            if (form.type === 'checkbox') {
                form.checked = false;
            } else if (form.type === 'range') {
                form.value = form.defaultValue;
            } else if (form.type === 'color') {
                form.value = form.defaultValue;
            } else if (form.tagName === 'SELECT') {
                form.selectedIndex = 0;
            } else {
                form.value = '';
            }
        });
        
        // Reset size display
        sizeDisplay.textContent = `${sizeSlider.value}×${sizeSlider.value}`;
        
        // Clear QR code
        if (qrCodeInstance) {
            qrCodeInstance.clear();
            disableActionButtons();
        }
    });
    
    // Download QR code as PNG
    downloadPngBtn.addEventListener('click', () => {
        if (!qrCodeInstance) return;
        
        const canvas = qrContainer.querySelector('canvas');
        if (canvas) {
            const activeTabId = document.querySelector('.tab-btn.active').getAttribute('data-tab');
            const link = document.createElement('a');
            link.download = `qrcode-${activeTabId}-${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
    
    // Download QR code as SVG
    downloadSvgBtn.addEventListener('click', () => {
        if (!qrCodeInstance) return;
        
        const svgElement = createSvgFromQRCode(qrCodeInstance);
        if (svgElement) {
            const activeTabId = document.querySelector('.tab-btn.active').getAttribute('data-tab');
            const svgData = new XMLSerializer().serializeToString(svgElement);
            
            // Safari/iOS workaround
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
                             /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            if (isSafari) {
                // For Safari: Use data URL approach
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const reader = new FileReader();
                reader.onload = function(e) {
                    const link = document.createElement('a');
                    link.download = `qrcode-${activeTabId}-${new Date().getTime()}.svg`;
                    link.href = e.target.result;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                };
                reader.readAsDataURL(svgBlob);
            } else {
                // For other browsers: Use blob URL approach
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);
                const link = document.createElement('a');
                link.download = `qrcode-${activeTabId}-${new Date().getTime()}.svg`;
                link.href = svgUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(svgUrl);
            }
        }
    });
    
    // Print QR code
    printQrBtn.addEventListener('click', () => {
        if (!qrCodeInstance) return;
        
        const canvas = qrContainer.querySelector('canvas');
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            const activeTabId = document.querySelector('.tab-btn.active').getAttribute('data-tab');
            const printWindow = window.open('', '_blank');
            
            printWindow.document.write(`
                <html>
                <head>
                    <title>Print QR Code - ${activeTabId}</title>
                    <style>
                        body {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            padding: 20px;
                            box-sizing: border-box;
                            font-family: sans-serif;
                        }
                        img {
                            max-width: 100%;
                            max-height: 80vh;
                        }
                        h1 {
                            margin-bottom: 20px;
                        }
                        .info {
                            margin-top: 20px;
                            text-align: center;
                            color: #666;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    <h1>QR Code - ${activeTabId.charAt(0).toUpperCase() + activeTabId.slice(1)}</h1>
                    <img src="${dataUrl}" alt="QR Code">
                    <div class="info">Generated on ${new Date().toLocaleString()}</div>
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                window.close();
                            }, 100);
                        };
                    </script>
                </body>
                </html>
            `);
            
            printWindow.document.close();
        }
    });
    
    // Get content for QR code based on active tab
    function getContentForQR(tabId) {
        switch (tabId) {
            case 'text':
                const textInput = document.getElementById('text-input');
                return textInput.value.trim() || null;
                
            case 'url':
                const urlInput = document.getElementById('url-input');
                let url = urlInput.value.trim();
                if (!url) return null;
                
                // Add https:// if no protocol specified
                if (!/^https?:\/\//i.test(url)) {
                    url = 'https://' + url;
                }
                return url;
                
            case 'contact':
                const name = document.getElementById('contact-name').value.trim();
                const phone = document.getElementById('contact-phone').value.trim();
                const email = document.getElementById('contact-email').value.trim();
                const address = document.getElementById('contact-address').value.trim();
                
                if (!name && !phone && !email && !address) return null;
                
                // Create vCard format
                let vCard = 'BEGIN:VCARD\nVERSION:3.0\n';
                if (name) vCard += `FN:${name}\n`;
                if (phone) vCard += `TEL:${phone}\n`;
                if (email) vCard += `EMAIL:${email}\n`;
                if (address) vCard += `ADR:;;${address};;;\n`;
                vCard += 'END:VCARD';
                return vCard;
                
            case 'email':
                const emailAddress = document.getElementById('email-address').value.trim();
                const subject = document.getElementById('email-subject').value.trim();
                const body = document.getElementById('email-body').value.trim();
                
                if (!emailAddress) return null;
                
                let mailtoLink = `mailto:${emailAddress}`;
                const params = [];
                if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
                if (body) params.push(`body=${encodeURIComponent(body)}`);
                
                if (params.length > 0) {
                    mailtoLink += '?' + params.join('&');
                }
                
                return mailtoLink;
                
            case 'sms':
                const phoneNumber = document.getElementById('sms-number').value.trim();
                const message = document.getElementById('sms-message').value.trim();
                
                if (!phoneNumber) return null;
                
                let smsLink = `sms:${phoneNumber}`;
                if (message) {
                    smsLink += `?body=${encodeURIComponent(message)}`;
                }
                
                return smsLink;
                
            case 'wifi':
                const ssid = document.getElementById('wifi-ssid').value.trim();
                const password = document.getElementById('wifi-password').value.trim();
                const security = document.getElementById('wifi-security').value;
                const hidden = document.getElementById('wifi-hidden').checked;
                
                if (!ssid) return null;
                
                // Format according to WiFi Network config format
                let wifiString = 'WIFI:';
                wifiString += `S:${ssid};`;
                wifiString += `T:${security};`;
                
                if (password && security !== 'nopass') {
                    wifiString += `P:${password};`;
                }
                
                if (hidden) {
                    wifiString += 'H:true;';
                }
                
                wifiString += ';';
                return wifiString;
        }
    }
    
    // Generate QR Code function
    function generateQRCode(content) {
        if (!content) return;
        
        // Clear previous QR code
        qrContainer.innerHTML = '';
        
        // Check if QRCode library is loaded
        if (typeof QRCode === 'undefined') {
            qrContainer.innerHTML = '<div class="error-message">QR Code library failed to load. Please check your internet connection and refresh the page.</div>';
            return;
        }
        
        // Get QR settings
        const size = parseInt(sizeSlider.value) || 200;
        const colorDark = qrColor.value || '#000000';
        const colorLight = qrBgColor.value || '#ffffff';
        const errorCorrectionLevel = errorCorrectionSelect ? errorCorrectionSelect.value : 'M';
        
        try {
            // Generate QR code
            qrCodeInstance = new QRCode(qrContainer, {
                text: content,
                width: size,
                height: size,
                colorDark: colorDark,
                colorLight: colorLight,
                correctLevel: QRCode.CorrectLevel[errorCorrectionLevel]
            });
            
            // Enable download/print buttons
            enableActionButtons();
        } catch (error) {
            console.error('Failed to generate QR code:', error);
            qrContainer.innerHTML = '<div class="error-message">Failed to generate QR code. Please try again.</div>';
            disableActionButtons();
        }
    }
    
    // Enable download and print buttons
    function enableActionButtons() {
        downloadPngBtn.disabled = false;
        downloadSvgBtn.disabled = false;
        printQrBtn.disabled = false;
    }
    
    // Disable download and print buttons
    function disableActionButtons() {
        downloadPngBtn.disabled = true;
        downloadSvgBtn.disabled = true;
        printQrBtn.disabled = true;
    }
    
    // Create SVG from QR Code
    function createSvgFromQRCode(qrCodeInstance) {
        if (!qrCodeInstance || !qrCodeInstance._oDrawing || !qrCodeInstance._oDrawing._elCanvas) {
            return null;
        }
        
        const canvas = qrCodeInstance._oDrawing._elCanvas;
        const size = canvas.width;
        
        // Create SVG element
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        svg.setAttribute('xmlns', svgNS);
        
        // Get QR code data
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, size, size).data;
        
        // QR code module size
        const moduleSize = size / qrCodeInstance._htOption.width;
        
        // Add background
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('width', size);
        rect.setAttribute('height', size);
        rect.setAttribute('fill', qrBgColor.value);
        svg.appendChild(rect);
        
        // Create modules
        for (let y = 0; y < size; y += moduleSize) {
            for (let x = 0; x < size; x += moduleSize) {
                // Check if this pixel is dark
                const pixelIndex = ((Math.floor(y) * size + Math.floor(x)) * 4);
                const r = imgData[pixelIndex];
                const g = imgData[pixelIndex + 1];
                const b = imgData[pixelIndex + 2];
                
                // If pixel is dark (not white)
                if (r < 128 && g < 128 && b < 128) {
                    const module = document.createElementNS(svgNS, 'rect');
                    module.setAttribute('x', x);
                    module.setAttribute('y', y);
                    module.setAttribute('width', moduleSize);
                    module.setAttribute('height', moduleSize);
                    module.setAttribute('fill', qrColor.value);
                    svg.appendChild(module);
                }
            }
        }
        
        return svg;
    }
    
    // Initialize the default generation on page load
    if (document.getElementById('text-input').value.trim()) {
        generateBtn.click();
    }
});