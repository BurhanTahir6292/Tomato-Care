/* ==========================================================================
   Tomato Care — Frontend Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // Theme Switcher (Dark / Light Mode)
    // ==========================================================================
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeToggleLabel = document.getElementById('theme-toggle-label');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('tomato_care_theme', theme);
        if (themeToggleLabel) {
            themeToggleLabel.textContent = theme === 'light' ? 'Light' : 'Dark';
        }
    }

    // Initialize toggle button label matching current state
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (themeToggleLabel) {
        themeToggleLabel.textContent = currentTheme === 'light' ? 'Light' : 'Dark';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const nextTheme = activeTheme === 'light' ? 'dark' : 'light';
            applyTheme(nextTheme);
        });
    }

    // State
    let currentFile = null;
    let diseaseDatabase = {};

    // Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const dropPlaceholder = document.getElementById('drop-zone-placeholder');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const btnClearImage = document.getElementById('btn-clear-image');
    const btnDiagnose = document.getElementById('btn-diagnose');
    const btnSpinner = document.getElementById('btn-spinner');
    
    // Result elements
    const emptyState = document.getElementById('result-empty-state');
    const resultCard = document.getElementById('result-card');
    const resBadge = document.getElementById('res-badge');
    const resDiseaseName = document.getElementById('res-disease-name');
    const resScientific = document.getElementById('res-scientific');
    const resConfidence = document.getElementById('res-confidence');
    const resAffectedVal = document.getElementById('res-affected-val');
    const resProgressFill = document.getElementById('res-progress-fill');
    const resRiskLevel = document.getElementById('res-risk-level');
    const resTreatmentText = document.getElementById('res-treatment-text');
    const resSymptomsText = document.getElementById('res-symptoms-text');
    const resPreventionText = document.getElementById('res-prevention-text');
    const resJsonRaw = document.getElementById('res-json-raw');

    // Navigation Tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabViews = document.querySelectorAll('.tab-view');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetViewId = tab.getAttribute('data-tab');
            navTabs.forEach(t => t.classList.remove('active'));
            tabViews.forEach(v => v.classList.remove('active'));

            tab.classList.add('active');
            const targetView = document.getElementById(targetViewId);
            if (targetView) targetView.classList.add('active');

            if (targetViewId === 'diseases-view') {
                loadDiseases();
            } else if (targetViewId === 'admin-view' && isAdminLoggedIn) {
                loadAdminData();
            }
        });
    });

    // Result Internal Tabs
    const resTabs = document.querySelectorAll('.res-tab');
    resTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-res-view');
            resTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            ['res-treatment', 'res-symptoms', 'res-prevention', 'res-raw'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    if (id === targetId) {
                        el.classList.remove('hidden');
                    } else {
                        el.classList.add('hidden');
                    }
                }
            });
        });
    });

    // Drag & Drop
    ['dragenter', 'dragover'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            handleSelectedFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleSelectedFile(e.target.files[0]);
        }
    });

    btnClearImage.addEventListener('click', (e) => {
        e.stopPropagation();
        resetFileInput();
    });

    function handleSelectedFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file (JPG, PNG, WebP).');
            return;
        }

        currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            dropPlaceholder.classList.add('hidden');
            previewContainer.classList.remove('hidden');
            btnDiagnose.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    function resetFileInput() {
        currentFile = null;
        fileInput.value = '';
        imagePreview.src = '';
        dropPlaceholder.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        btnDiagnose.disabled = true;
    }

    // Sample Leaf Chips
    const sampleChips = document.querySelectorAll('.chip');
    sampleChips.forEach(chip => {
        chip.addEventListener('click', async () => {
            const sampleFileName = chip.getAttribute('data-sample');
            try {
                const response = await fetch(`/static/samples/${sampleFileName}`);
                if (!response.ok) throw new Error('Sample not found');
                const blob = await response.blob();
                const file = new File([blob], sampleFileName, { type: 'image/jpeg' });
                handleSelectedFile(file);
                
                // Automatically run diagnosis for instant WOW effect
                runDiagnosis();
            } catch (err) {
                console.error('Failed to load sample:', err);
                alert('Could not load sample image: ' + err.message);
            }
        });
    });

    // Run Diagnosis
    btnDiagnose.addEventListener('click', runDiagnosis);

    async function runDiagnosis() {
        if (!currentFile) return;

        btnDiagnose.disabled = true;
        btnSpinner.classList.remove('hidden');

        const formData = new FormData();
        formData.append('file', currentFile);

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to analyze leaf.');
            }

            renderDiagnosisResult(data);
        } catch (err) {
            console.error('Diagnosis error:', err);
            alert('Error during diagnosis: ' + err.message);
        } finally {
            btnDiagnose.disabled = false;
            btnSpinner.classList.add('hidden');
        }
    }

    function renderDiagnosisResult(data) {
        emptyState.classList.add('hidden');
        resultCard.classList.remove('hidden');

        const isHealthy = (data.Disease === 'Healthy');
        const affectedPct = data.affected_percentage ?? (isHealthy ? 0 : 50);

        // Badge
        if (isHealthy) {
            resBadge.className = 'disease-badge badge-healthy';
            resBadge.textContent = 'Healthy';
        } else {
            resBadge.className = 'disease-badge badge-infected';
            resBadge.textContent = 'Infected';
        }

        // Title and details
        resDiseaseName.textContent = data.Disease || 'Unknown';
        resScientific.textContent = data.details?.scientific_name || '';
        
        const confPct = Math.round((data.confidence || 0.90) * 100);
        resConfidence.textContent = `${confPct}%`;

        resAffectedVal.textContent = data.Affected || `${affectedPct}%`;
        resProgressFill.style.width = `${Math.min(100, Math.max(5, affectedPct))}%`;
        resRiskLevel.textContent = data.details?.risk_level || (isHealthy ? 'None' : 'Moderate');

        // Content tabs
        resTreatmentText.textContent = data.details?.treatment || 'No specific treatment provided.';
        resSymptomsText.textContent = data.details?.symptoms || 'No symptoms detected.';
        resPreventionText.textContent = data.details?.prevention || 'Maintain regular irrigation and monitoring.';

        // Raw JSON view
        resJsonRaw.textContent = JSON.stringify(data, null, 2);
    }

    // Load Disease Database
    async function loadDiseases() {
        const container = document.getElementById('disease-cards-container');
        if (container.children.length > 0) return; // already loaded

        try {
            const res = await fetch('/api/diseases');
            const data = await res.json();
            diseaseDatabase = data.diseases || {};

            container.innerHTML = '';
            for (const [name, info] of Object.entries(diseaseDatabase)) {
                const card = document.createElement('div');
                card.className = 'glass-card disease-card';
                const isHealthy = (name === 'Healthy');

                card.innerHTML = `
                    <div>
                        <div class="disease-card-header">
                            <h4>${name}</h4>
                            <span class="disease-badge ${isHealthy ? 'badge-healthy' : 'badge-infected'}">
                                ${isHealthy ? 'Healthy' : info.risk_level + ' Risk'}
                            </span>
                        </div>
                        <div class="disease-card-sci">${info.scientific_name}</div>
                        <p>${info.description}</p>
                    </div>
                    <div class="disease-card-footer">
                        <strong>Treatment:</strong> ${info.treatment}
                    </div>
                `;
                container.appendChild(card);
            }
        } catch (err) {
            console.error('Failed to load diseases:', err);
        }
    }

    // ==========================================================================
    // Administrator Portal & Enterprise Security Logic
    // ==========================================================================
    const btnAdminAuth = document.getElementById('btn-admin-auth');
    const adminBtnIconWrap = document.getElementById('admin-btn-icon-wrap');
    const adminBtnText = document.getElementById('admin-btn-text');
    const navAdminBtn = document.getElementById('nav-admin-btn');
    const navAdminLock = document.getElementById('nav-admin-lock');
    const adminModal = document.getElementById('admin-modal');
    const btnModalClose = document.getElementById('btn-modal-close');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminUserInput = document.getElementById('admin-user-input');
    const adminPassInput = document.getElementById('admin-pass-input');
    const btnTogglePassword = document.getElementById('btn-toggle-password');
    const togglePassText = document.getElementById('toggle-pass-text');
    const adminErrorMsg = document.getElementById('admin-error-msg');
    const adminErrorText = document.getElementById('admin-error-text');
    const btnSubmitAdmin = document.getElementById('btn-submit-admin');
    const adminBtnSpinner = document.getElementById('admin-btn-spinner');
    const adminSubmitText = document.getElementById('admin-submit-text');
    const adminLockedCard = document.getElementById('admin-locked-card');
    const adminUnlockedArea = document.getElementById('admin-unlocked-area');
    const btnUnlockTrigger = document.getElementById('btn-unlock-trigger');
    const btnConsoleLogout = document.getElementById('btn-console-logout');
    const footerAdminStatus = document.getElementById('footer-admin-status');
    const btnDemoAutofill = document.getElementById('btn-demo-autofill');
    const btnQuickFillLock = document.getElementById('btn-quick-fill-lock');

    // Admin Console Data Elements
    const statUsersVal = document.getElementById('stat-users-val');
    const statAlertsVal = document.getElementById('stat-alerts-val');
    const statDiseasesVal = document.getElementById('stat-diseases-val');
    const statInferenceVal = document.getElementById('stat-inference-val');
    const adminAlertsContainer = document.getElementById('admin-alerts-container');
    const adminUsersTableBody = document.getElementById('admin-users-table-body');
    const broadcastAlertModal = document.getElementById('broadcast-alert-modal');
    const btnOpenAlertModal = document.getElementById('btn-open-alert-modal');
    const btnCloseAlertModal = document.getElementById('btn-close-alert-modal');
    const broadcastAlertForm = document.getElementById('broadcast-alert-form');

    let isAdminLoggedIn = false;

    // SVG Icons for button states
    const lockIconSvg = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>`;

    const shieldCheckSvg = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
        </svg>`;

    function updateAdminUI(isAuth) {
        isAdminLoggedIn = isAuth;
        if (isAuth) {
            btnAdminAuth.classList.add('admin-logged-in');
            if (adminBtnIconWrap) adminBtnIconWrap.innerHTML = shieldCheckSvg;
            if (adminBtnText) adminBtnText.textContent = 'Admin Active (Logout)';
            if (navAdminLock) navAdminLock.classList.add('hidden');
            if (adminLockedCard) adminLockedCard.classList.add('hidden');
            if (adminUnlockedArea) adminUnlockedArea.classList.remove('hidden');
            if (footerAdminStatus) {
                footerAdminStatus.innerHTML = '<strong style="color: #34d399;">Executive Admin Session (Active)</strong>';
            }
            loadAdminData();
        } else {
            btnAdminAuth.classList.remove('admin-logged-in');
            if (adminBtnIconWrap) adminBtnIconWrap.innerHTML = lockIconSvg;
            if (adminBtnText) adminBtnText.textContent = 'Admin Login';
            if (navAdminLock) navAdminLock.classList.remove('hidden');
            if (adminLockedCard) adminLockedCard.classList.remove('hidden');
            if (adminUnlockedArea) adminUnlockedArea.classList.add('hidden');
            if (footerAdminStatus) {
                footerAdminStatus.textContent = 'User Mode (Restricted)';
            }
        }
    }

    // Check existing stored session
    const savedToken = sessionStorage.getItem('tomato_admin_token') || localStorage.getItem('tomato_admin_token');
    if (savedToken) {
        updateAdminUI(true);
    } else {
        updateAdminUI(false);
    }

    // Modal Control Functions
    function openAdminModal() {
        if (adminErrorMsg) adminErrorMsg.classList.add('hidden');
        if (adminErrorText) adminErrorText.textContent = '';
        if (adminPassInput) adminPassInput.value = '';
        if (adminModal) adminModal.classList.remove('hidden');
        if (adminUserInput) adminUserInput.focus();
    }

    function closeAdminModal() {
        if (adminModal) adminModal.classList.add('hidden');
    }

    // Fast Demo Auto-Fill
    function fillDemoCredentials() {
        if (adminUserInput && adminPassInput) {
            adminUserInput.value = 'admin';
            adminPassInput.value = 'admin123';
            adminUserInput.style.borderColor = '#38bdf8';
            adminPassInput.style.borderColor = '#38bdf8';
            setTimeout(() => {
                adminUserInput.style.borderColor = '';
                adminPassInput.style.borderColor = '';
            }, 1000);
            if (btnSubmitAdmin) btnSubmitAdmin.focus();
        }
    }

    if (btnDemoAutofill) {
        btnDemoAutofill.addEventListener('click', fillDemoCredentials);
    }

    if (btnQuickFillLock) {
        btnQuickFillLock.addEventListener('click', () => {
            openAdminModal();
            fillDemoCredentials();
        });
    }

    // Toggle Password Visibility
    if (btnTogglePassword && adminPassInput) {
        btnTogglePassword.addEventListener('click', () => {
            const isPassword = adminPassInput.type === 'password';
            adminPassInput.type = isPassword ? 'text' : 'password';
            if (togglePassText) {
                togglePassText.textContent = isPassword ? 'Hide' : 'Show';
            }
        });
    }

    // Header Admin Button Click
    btnAdminAuth.addEventListener('click', () => {
        if (isAdminLoggedIn) {
            if (confirm('Do you want to end your administrator session? The Admin Console will be locked.')) {
                logoutAdmin();
            }
        } else {
            openAdminModal();
        }
    });

    if (btnConsoleLogout) {
        btnConsoleLogout.addEventListener('click', () => {
            if (confirm('Sign out from Tomato Care Admin Console?')) {
                logoutAdmin();
            }
        });
    }

    function logoutAdmin() {
        sessionStorage.removeItem('tomato_admin_token');
        localStorage.removeItem('tomato_admin_token');
        updateAdminUI(false);
    }

    if (btnUnlockTrigger) {
        btnUnlockTrigger.addEventListener('click', openAdminModal);
    }

    if (btnModalClose) {
        btnModalClose.addEventListener('click', closeAdminModal);
    }

    if (adminModal) {
        adminModal.addEventListener('click', (e) => {
            if (e.target === adminModal) closeAdminModal();
        });
    }

    // Handle Admin Authentication
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = adminUserInput.value.trim();
            const password = adminPassInput.value.trim();
            const rememberMe = document.getElementById('remember-admin-session')?.checked;

            if (!username || !password) return;

            btnSubmitAdmin.disabled = true;
            if (adminBtnSpinner) adminBtnSpinner.classList.remove('hidden');
            if (adminSubmitText) adminSubmitText.textContent = 'Authenticating...';
            if (adminErrorMsg) adminErrorMsg.classList.add('hidden');

            try {
                const resp = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await resp.json();

                if (resp.ok && data.status === 'success') {
                    if (rememberMe) {
                        localStorage.setItem('tomato_admin_token', data.token);
                    } else {
                        sessionStorage.setItem('tomato_admin_token', data.token);
                    }
                    updateAdminUI(true);
                    closeAdminModal();

                    // Switch immediately to Admin Console tab
                    if (navAdminBtn) {
                        navAdminBtn.click();
                    }
                } else {
                    if (adminErrorText) {
                        adminErrorText.textContent = data.message || 'Access Denied: Invalid credentials.';
                    }
                    if (adminErrorMsg) adminErrorMsg.classList.remove('hidden');
                }
            } catch (err) {
                if (adminErrorText) {
                    adminErrorText.textContent = 'Server connection error: ' + err.message;
                }
                if (adminErrorMsg) adminErrorMsg.classList.remove('hidden');
            } finally {
                btnSubmitAdmin.disabled = false;
                if (adminBtnSpinner) adminBtnSpinner.classList.add('hidden');
                if (adminSubmitText) adminSubmitText.textContent = 'Verify Credentials & Open Console';
            }
        });
    }

    // ==========================================================================
    // Fetch and Populate Admin Console Modules
    // ==========================================================================
    async function loadAdminData() {
        try {
            // Load stats overview
            const overviewResp = await fetch('/api/admin/overview');
            if (overviewResp.ok) {
                const overviewData = await overviewResp.json();
                const stats = overviewData.stats || {};
                if (statUsersVal) statUsersVal.textContent = (stats.registered_users || 1420).toLocaleString();
                if (statAlertsVal) statAlertsVal.textContent = stats.active_alerts || 3;
                if (statInferenceVal) statInferenceVal.textContent = stats.system_health || 'Online';
            }

            // Load disease count
            if (statDiseasesVal && Object.keys(diseaseDatabase).length > 0) {
                statDiseasesVal.textContent = Object.keys(diseaseDatabase).length;
            }

            // Load alerts
            loadAdminAlerts();

            // Load users
            loadAdminUsers();
        } catch (err) {
            console.error('Error loading admin console metrics:', err);
        }
    }

    async function loadAdminAlerts() {
        if (!adminAlertsContainer) return;
        try {
            const resp = await fetch('/api/admin/alerts');
            if (!resp.ok) return;
            const data = await resp.json();
            const alerts = data.alerts || [];

            adminAlertsContainer.innerHTML = '';
            alerts.forEach(alt => {
                const severityClass = alt.severity === 'High' ? 'severity-high' : alt.severity === 'Info' ? 'severity-info' : 'severity-warning';
                const card = document.createElement('div');
                card.className = 'alert-item-card';
                card.innerHTML = `
                    <div class="alert-item-top">
                        <span class="alert-item-title">${alt.title}</span>
                        <span class="alert-severity-badge ${severityClass}">${alt.severity}</span>
                    </div>
                    <p class="alert-item-body">${alt.message}</p>
                    <div class="alert-item-meta">
                        <span>📍 ${alt.region}</span>
                        <span>🕒 ${alt.timestamp}</span>
                    </div>
                `;
                adminAlertsContainer.appendChild(card);
            });
        } catch (err) {
            console.error('Failed to load field alerts:', err);
        }
    }

    async function loadAdminUsers() {
        if (!adminUsersTableBody) return;
        try {
            const resp = await fetch('/api/admin/users');
            if (!resp.ok) return;
            const data = await resp.json();
            const users = data.users || [];

            adminUsersTableBody.innerHTML = '';
            users.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="user-cell-name">${u.name}</div>
                        <div class="user-cell-email">${u.email}</div>
                    </td>
                    <td><span class="user-role-badge">${u.role}</span></td>
                    <td>${u.phone || 'N/A'}</td>
                    <td><span class="status-active-badge">${u.status || 'Active'}</span></td>
                `;
                adminUsersTableBody.appendChild(tr);
            });
        } catch (err) {
            console.error('Failed to load users table:', err);
        }
    }

    // Broadcast Alert Modal Controls
    if (btnOpenAlertModal && broadcastAlertModal) {
        btnOpenAlertModal.addEventListener('click', () => {
            broadcastAlertModal.classList.remove('hidden');
        });
    }

    if (btnCloseAlertModal && broadcastAlertModal) {
        btnCloseAlertModal.addEventListener('click', () => {
            broadcastAlertModal.classList.add('hidden');
        });
    }

    if (broadcastAlertModal) {
        broadcastAlertModal.addEventListener('click', (e) => {
            if (e.target === broadcastAlertModal) {
                broadcastAlertModal.classList.add('hidden');
            }
        });
    }

    if (broadcastAlertForm) {
        broadcastAlertForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('alert-title-input')?.value.trim();
            const severity = document.getElementById('alert-severity-input')?.value;
            const region = document.getElementById('alert-region-input')?.value.trim();
            const message = document.getElementById('alert-msg-input')?.value.trim();

            if (!title || !message) return;

            try {
                const resp = await fetch('/api/admin/alerts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, severity, region, message })
                });

                if (resp.ok) {
                    broadcastAlertModal.classList.add('hidden');
                    broadcastAlertForm.reset();
                    loadAdminAlerts();
                    if (statAlertsVal) {
                        const currentVal = parseInt(statAlertsVal.textContent) || 0;
                        statAlertsVal.textContent = currentVal + 1;
                    }
                    alert('✓ Field disease alert successfully broadcasted to mobile users.');
                }
            } catch (err) {
                alert('Failed to broadcast alert: ' + err.message);
            }
        });
    }

    // Auto-load diseases in background
    loadDiseases();
});
