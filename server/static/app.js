document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // Theme Switcher (Dark / Light)
    // --------------------------------------------------------------------------
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeToggleLabel = document.getElementById('theme-toggle-label');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('tomato_care_theme', theme);
        if (themeToggleLabel) {
            themeToggleLabel.textContent = theme === 'light' ? 'Light' : 'Dark';
        }
    }

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (themeToggleLabel) {
        themeToggleLabel.textContent = currentTheme === 'light' ? 'Light' : 'Dark';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            applyTheme(activeTheme === 'light' ? 'dark' : 'light');
        });
    }

    // --------------------------------------------------------------------------
    // State
    // --------------------------------------------------------------------------
    let currentFile = null;
    let diseaseDatabase = {};
    let activeFilter = 'all';
    let searchQuery = '';

    // File input & preview
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const dropPlaceholder = document.getElementById('drop-zone-placeholder');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const btnClearImage = document.getElementById('btn-clear-image');
    const btnReplaceImage = document.getElementById('btn-replace-image');
    const previewFileName = document.getElementById('preview-file-name');
    const previewFileSize = document.getElementById('preview-file-size');
    const btnDiagnose = document.getElementById('btn-diagnose');
    const btnSpinner = document.getElementById('btn-spinner');

    // Diagnosis Results
    const emptyState = document.getElementById('result-empty-state');
    const resultCard = document.getElementById('result-card');
    const resBadge = document.getElementById('res-badge');
    const resDiseaseName = document.getElementById('res-disease-name');
    const resScientific = document.getElementById('res-scientific');
    const resConfidence = document.getElementById('res-confidence');
    const resAffectedVal = document.getElementById('res-affected-val');
    const resProgressFill = document.getElementById('res-progress-fill');
    const resSeverityTag = document.getElementById('res-severity-tag');
    const resRiskLevel = document.getElementById('res-risk-level');
    const resRiskNote = document.getElementById('res-risk-note');
    const actionBannerText = document.getElementById('action-banner-text');

    // Result tabs content
    const resTreatmentText = document.getElementById('res-treatment-text');
    const resSymptomsText = document.getElementById('res-symptoms-text');
    const resPreventionText = document.getElementById('res-prevention-text');

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

    // Result Tabs (Treatment Protocol, Symptoms, Prevention)
    const resTabs = document.querySelectorAll('.res-tab');
    resTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-res-view');
            resTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            ['res-treatment', 'res-symptoms', 'res-prevention'].forEach(id => {
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

    // --------------------------------------------------------------------------
    // Drag and Drop
    // --------------------------------------------------------------------------
    if (dropZone) {
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

        dropZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (fileInput) fileInput.click();
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleSelectedFile(e.target.files[0]);
            }
        });
    }

    if (btnReplaceImage && fileInput) {
        btnReplaceImage.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

    if (btnClearImage) {
        btnClearImage.addEventListener('click', (e) => {
            e.stopPropagation();
            resetFileInput();
        });
    }

    function formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 KB';
        const k = 1024;
        const dm = 1;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function handleSelectedFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPG or PNG).');
            return;
        }

        currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;

            if (previewFileName) {
                previewFileName.textContent = file.name.length > 22 ? file.name.substring(0, 19) + '...' : file.name;
                previewFileName.title = file.name;
            }

            if (previewFileSize) {
                previewFileSize.textContent = formatFileSize(file.size);
            }

            if (dropPlaceholder) dropPlaceholder.classList.add('hidden');
            if (previewContainer) previewContainer.classList.remove('hidden');
            if (btnDiagnose) btnDiagnose.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    function resetFileInput() {
        currentFile = null;
        if (fileInput) fileInput.value = '';
        if (imagePreview) imagePreview.src = '';
        if (dropPlaceholder) dropPlaceholder.classList.remove('hidden');
        if (previewContainer) previewContainer.classList.add('hidden');
        if (btnDiagnose) btnDiagnose.disabled = true;

        if (emptyState) emptyState.classList.remove('hidden');
        if (resultCard) resultCard.classList.add('hidden');
    }

    // Sample Leaf Chips
    const sampleChips = document.querySelectorAll('.chip-sample');
    sampleChips.forEach(chip => {
        chip.addEventListener('click', async () => {
            const sampleFileName = chip.getAttribute('data-sample');
            try {
                sampleChips.forEach(c => c.classList.remove('active-sample'));
                chip.classList.add('active-sample');

                const response = await fetch(`/static/samples/${sampleFileName}`);
                if (!response.ok) throw new Error('Sample not found');
                const blob = await response.blob();
                const file = new File([blob], sampleFileName, { type: 'image/jpeg' });
                handleSelectedFile(file);
                runDiagnosis();
            } catch (err) {
                console.error('Failed to load sample:', err);
                alert('Could not load sample image: ' + err.message);
            }
        });
    });

    // --------------------------------------------------------------------------
    // Run Diagnosis
    // --------------------------------------------------------------------------
    if (btnDiagnose) {
        btnDiagnose.addEventListener('click', runDiagnosis);
    }

    async function runDiagnosis() {
        if (!currentFile) return;

        btnDiagnose.disabled = true;
        if (btnSpinner) btnSpinner.classList.remove('hidden');

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
            if (btnSpinner) btnSpinner.classList.add('hidden');
        }
    }

    function renderDiagnosisResult(data) {
        if (emptyState) emptyState.classList.add('hidden');
        if (resultCard) resultCard.classList.remove('hidden');

        const isHealthy = (data.Disease === 'Healthy');
        const affectedPct = data.affected_percentage ?? (isHealthy ? 0 : 50);

        // Badge & Title
        if (isHealthy) {
            resBadge.className = 'disease-badge badge-healthy';
            resBadge.textContent = 'Healthy';
        } else {
            resBadge.className = 'disease-badge badge-infected';
            resBadge.textContent = 'Infected';
        }

        resDiseaseName.textContent = data.Disease || 'Unknown';
        resScientific.textContent = data.details?.scientific_name || '';

        // Confidence
        const confPct = Math.round((data.confidence || 0.90) * 100);
        resConfidence.textContent = `${confPct}%`;

        // Affected Area
        resAffectedVal.textContent = data.Affected || `${affectedPct}%`;
        resProgressFill.style.width = `${Math.min(100, Math.max(isHealthy ? 0 : 5, affectedPct))}%`;

        if (resSeverityTag) {
            if (isHealthy) {
                resSeverityTag.textContent = 'None';
                resSeverityTag.className = 'metric-severity-tag severity-healthy';
            } else if (affectedPct > 50) {
                resSeverityTag.textContent = 'Severe';
                resSeverityTag.className = 'metric-severity-tag severity-high';
            } else if (affectedPct > 20) {
                resSeverityTag.textContent = 'Moderate';
                resSeverityTag.className = 'metric-severity-tag severity-warning';
            } else {
                resSeverityTag.textContent = 'Mild';
                resSeverityTag.className = 'metric-severity-tag severity-low';
            }
        }

        // Risk
        const riskLevel = data.details?.risk_level || (isHealthy ? 'None' : 'Moderate');
        resRiskLevel.textContent = riskLevel;
        if (resRiskNote) {
            resRiskNote.textContent = isHealthy ? 'Plant foliage in good condition' : 'Treatment recommended to prevent spread';
        }

        // Action Recommendation
        if (actionBannerText) {
            if (isHealthy) {
                actionBannerText.textContent = 'Plant foliage is healthy. Continue regular irrigation, balanced fertilization, and monitor weekly for pests.';
            } else {
                actionBannerText.textContent = data.details?.treatment || 'Apply recommended spray and remove infected leaves.';
            }
        }

        // Detailed Content
        if (resTreatmentText) resTreatmentText.textContent = data.details?.treatment || 'No chemical treatment needed.';
        if (resSymptomsText) resSymptomsText.textContent = data.details?.symptoms || 'No symptoms detected.';
        if (resPreventionText) resPreventionText.textContent = data.details?.prevention || 'Maintain good crop rotation and avoid wetting leaves when watering.';
    }

    // --------------------------------------------------------------------------
    // Disease Database
    // --------------------------------------------------------------------------
    const diseaseCardsContainer = document.getElementById('disease-cards-container');
    const diseaseSearchInput = document.getElementById('disease-search-input');
    const dbFilterChips = document.getElementById('db-filter-chips');

    async function loadDiseases() {
        if (!diseaseCardsContainer) return;

        try {
            if (Object.keys(diseaseDatabase).length === 0) {
                const res = await fetch('/api/diseases');
                const data = await res.json();
                diseaseDatabase = data.diseases || {};
            }
            renderDiseaseCards();
        } catch (err) {
            console.error('Failed to load diseases:', err);
        }
    }

    function renderDiseaseCards() {
        if (!diseaseCardsContainer) return;

        const entries = Object.entries(diseaseDatabase);
        const query = searchQuery.trim().toLowerCase();

        const filtered = entries.filter(([name, info]) => {
            if (activeFilter === 'Healthy' && name !== 'Healthy') return false;
            if (activeFilter === 'High' && info.risk_level !== 'High') return false;
            if (activeFilter === 'Moderate' && info.risk_level !== 'Moderate') return false;

            if (query) {
                const text = (name + ' ' + (info.scientific_name || '') + ' ' + (info.description || '') + ' ' + (info.symptoms || '')).toLowerCase();
                return text.includes(query);
            }
            return true;
        });

        diseaseCardsContainer.innerHTML = '';

        if (filtered.length === 0) {
            diseaseCardsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No matching diseases found.</div>`;
            return;
        }

        filtered.forEach(([name, info]) => {
            const card = document.createElement('div');
            card.className = 'glass-card disease-card';
            const isHealthy = (name === 'Healthy');
            const badgeClass = isHealthy ? 'badge-healthy' : info.risk_level === 'High' ? 'badge-infected' : 'badge-warning';

            card.innerHTML = `
                <div class="disease-card-header">
                    <div>
                        <h4>${name}</h4>
                        <div class="disease-card-sci">${info.scientific_name || ''}</div>
                    </div>
                    <span class="disease-badge ${badgeClass}">
                        ${isHealthy ? 'Healthy' : info.risk_level + ' Risk'}
                    </span>
                </div>
                <p class="disease-desc">${info.description}</p>
                <div class="disease-card-section">
                    <strong>Symptoms:</strong> ${info.symptoms}
                </div>
                <div class="disease-card-footer">
                    <strong>Treatment:</strong> ${info.treatment}
                </div>
            `;
            diseaseCardsContainer.appendChild(card);
        });
    }

    if (dbFilterChips) {
        dbFilterChips.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-pill');
            if (!btn) return;
            document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.getAttribute('data-filter') || 'all';
            renderDiseaseCards();
        });
    }

    if (diseaseSearchInput) {
        diseaseSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderDiseaseCards();
        });
    }

    // --------------------------------------------------------------------------
    // Admin Console (Unified Single Login Flow)
    // --------------------------------------------------------------------------
    const navAdminLock = document.getElementById('nav-admin-lock');
    const adminLoginCard = document.getElementById('admin-login-card');
    const adminUnlockedArea = document.getElementById('admin-unlocked-area');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminUserInput = document.getElementById('admin-user-input');
    const adminPassInput = document.getElementById('admin-pass-input');
    const btnTogglePassword = document.getElementById('btn-toggle-password');
    const adminErrorMsg = document.getElementById('admin-error-msg');
    const adminErrorText = document.getElementById('admin-error-text');
    const btnSubmitAdmin = document.getElementById('btn-submit-admin');
    const adminBtnSpinner = document.getElementById('admin-btn-spinner');
    const adminSubmitText = document.getElementById('admin-submit-text');
    const btnConsoleLogout = document.getElementById('btn-console-logout');
    const footerAdminStatus = document.getElementById('footer-admin-status');
    const adminActiveEmail = document.getElementById('admin-active-email');

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

    // Single unified UI updater
    function updateAdminUI(isAuth, userEmail) {
        isAdminLoggedIn = isAuth;
        if (isAuth) {
            if (navAdminLock) navAdminLock.classList.add('hidden');
            if (adminLoginCard) adminLoginCard.classList.add('hidden');
            if (adminUnlockedArea) adminUnlockedArea.classList.remove('hidden');
            if (adminActiveEmail) adminActiveEmail.textContent = userEmail || 'Administrator';
            if (footerAdminStatus) {
                footerAdminStatus.innerHTML = '<span style="color: #10b981; font-weight: 600;">Admin Mode (Signed In)</span>';
            }
            loadAdminData();
        } else {
            if (navAdminLock) navAdminLock.classList.remove('hidden');
            if (adminLoginCard) adminLoginCard.classList.remove('hidden');
            if (adminUnlockedArea) adminUnlockedArea.classList.add('hidden');
            if (footerAdminStatus) {
                footerAdminStatus.textContent = 'User Mode';
            }
        }
    }

    // Check stored session
    const savedToken = sessionStorage.getItem('tomato_admin_token') || localStorage.getItem('tomato_admin_token');
    const savedEmail = sessionStorage.getItem('tomato_admin_email') || localStorage.getItem('tomato_admin_email');
    if (savedToken) {
        updateAdminUI(true, savedEmail);
    } else {
        updateAdminUI(false);
    }

    if (btnTogglePassword && adminPassInput) {
        btnTogglePassword.addEventListener('click', () => {
            const isPassword = adminPassInput.type === 'password';
            adminPassInput.type = isPassword ? 'text' : 'password';
            btnTogglePassword.textContent = isPassword ? 'Hide' : 'Show';
        });
    }

    // Logout
    if (btnConsoleLogout) {
        btnConsoleLogout.addEventListener('click', () => {
            sessionStorage.removeItem('tomato_admin_token');
            localStorage.removeItem('tomato_admin_token');
            sessionStorage.removeItem('tomato_admin_email');
            localStorage.removeItem('tomato_admin_email');
            updateAdminUI(false);
        });
    }

    // Admin Login Form Handler
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = adminUserInput.value.trim();
            const password = adminPassInput.value.trim();
            const rememberMe = document.getElementById('remember-admin-session')?.checked;

            if (!username || !password) return;

            btnSubmitAdmin.disabled = true;
            if (adminBtnSpinner) adminBtnSpinner.classList.remove('hidden');
            if (adminSubmitText) adminSubmitText.textContent = 'Logging in...';
            if (adminErrorMsg) adminErrorMsg.classList.add('hidden');

            try {
                const resp = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await resp.json();

                if (resp.ok && data.status === 'success') {
                    const email = data.admin?.email || username;
                    if (rememberMe) {
                        localStorage.setItem('tomato_admin_token', data.token);
                        localStorage.setItem('tomato_admin_email', email);
                    } else {
                        sessionStorage.setItem('tomato_admin_token', data.token);
                        sessionStorage.setItem('tomato_admin_email', email);
                    }
                    updateAdminUI(true, email);
                } else {
                    if (adminErrorText) {
                        adminErrorText.textContent = data.message || 'Invalid email or password.';
                    }
                    if (adminErrorMsg) adminErrorMsg.classList.remove('hidden');
                }
            } catch (err) {
                if (adminErrorText) {
                    adminErrorText.textContent = 'Connection error: ' + err.message;
                }
                if (adminErrorMsg) adminErrorMsg.classList.remove('hidden');
            } finally {
                btnSubmitAdmin.disabled = false;
                if (adminBtnSpinner) adminBtnSpinner.classList.add('hidden');
                if (adminSubmitText) adminSubmitText.textContent = 'Log In as Admin';
            }
        });
    }

    async function loadAdminData() {
        try {
            const overviewResp = await fetch('/api/admin/overview');
            if (overviewResp.ok) {
                const overviewData = await overviewResp.json();
                const stats = overviewData.stats || {};
                if (statUsersVal) statUsersVal.textContent = (stats.registered_users || 1420).toLocaleString();
                if (statAlertsVal) statAlertsVal.textContent = stats.active_alerts || 3;
                if (statInferenceVal) statInferenceVal.textContent = stats.system_health || 'Online';
            }

            if (statDiseasesVal && Object.keys(diseaseDatabase).length > 0) {
                statDiseasesVal.textContent = Object.keys(diseaseDatabase).length;
            }

            loadAdminAlerts();
            loadAdminUsers();
        } catch (err) {
            console.error('Error loading admin stats:', err);
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
                const card = document.createElement('div');
                card.className = 'alert-item-card';
                card.innerHTML = `
                    <div class="alert-item-top">
                        <span class="alert-item-title">${alt.title}</span>
                        <span class="alert-severity-badge severity-${alt.severity.toLowerCase()}">${alt.severity}</span>
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
            console.error('Failed to load alerts:', err);
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
            console.error('Failed to load users:', err);
        }
    }

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
                    alert('Alert broadcasted successfully.');
                }
            } catch (err) {
                alert('Failed to send alert: ' + err.message);
            }
        });
    }

    loadDiseases();
});