/**
 * Unified About/Privacy/Source Modal
 * Provides transparency info: source code, privacy policy, build info, licenses
 * 
 * Usage: Add to any page with <button class="about-btn" title="About this site">ℹ️</button>
 *        Include this script + about-privacy.css
 */

(function() {
    'use strict';

    function createModalHTML() {
        const repoUrl = 'https://github.com/Aravinth-Earth/Aravinth-Earth';
        const issueUrl = repoUrl + '/issues/new';
        const email = 'aravinth@332321.xyz';

        return `
<div id="about-privacy-modal" class="about-modal-overlay">
    <div class="about-modal">
        <div class="about-modal-header">
            <h2>ℹ️ About This Site</h2>
            <button class="about-modal-close" aria-label="Close modal">✕</button>
        </div>

        <div class="about-modal-content">

            <!-- Source Code Section -->
            <section class="about-section">
                <h3>📜 Source & Issues</h3>
                <div class="link-group">
                    <a href="${repoUrl}" target="_blank" rel="noopener noreferrer" class="about-link">
                        🔗 View Source on GitHub
                    </a>
                    <a href="${issueUrl}" target="_blank" rel="noopener noreferrer" class="about-link">
                        🐛 Report a Bug
                    </a>
                </div>
            </section>

            <!-- Privacy Contract Section -->
            <section class="about-section">
                <h3>🔒 Privacy</h3>
                <div class="about-privacy-policy">
                    <ul class="privacy-list">
                        <li>✅ No analytics</li>
                        <li>✅ No tracking</li>
                        <li>✅ Data stays local (your device only)</li>
                        <li>✅ No server requests (except icons/fonts)</li>
                    </ul>
                </div>
            </section>

            <!-- Contact Section -->
            <section class="about-section">
                <h3>📧 Contact</h3>
                <div class="link-group">
                    <a href="mailto:${email}" class="about-link">
                        ✉️ Email: ${email}
                    </a>
                </div>
            </section>

        </div>
    </div>
</div>
        `;
    }

    function initializeModal() {
        // Create modal if it doesn't exist
        if (document.getElementById('about-privacy-modal')) {
            return; // Already initialized
        }

        const modalHTML = createModalHTML();
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);

        // Get references
        const modal = document.getElementById('about-privacy-modal');
        const closeBtn = modal.querySelector('.about-modal-close');
        const overlay = modal;

        // Close modal function
        function closeModal() {
            modal.classList.remove('about-modal-open');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 200);
        }

        // Open modal function
        function openModal() {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('about-modal-open');
            }, 10);
        }

        // Event listeners
        closeBtn.addEventListener('click', closeModal);
        
        // Close when clicking outside modal
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('about-modal-open')) {
                closeModal();
            }
        });

        // Open modal when clicking about button
        const aboutBtn = document.querySelector('.about-btn');
        if (aboutBtn) {
            aboutBtn.addEventListener('click', openModal);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModal);
    } else {
        initializeModal();
    }

    // Make accessible globally for footer integration
    window.openAboutModal = function() {
        const modal = document.getElementById('about-privacy-modal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('about-modal-open');
            }, 10);
        }
    };

})();
