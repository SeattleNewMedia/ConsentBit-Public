/**
 * Dashboard Script - Data Fetching and Display Only
 * Host this on GitHub/Cloudflare Pages and reference from Webflow
 * 
 * Usage in Webflow:
 * <script src="https://your-domain.com/dashboard-script.js"></script>
 * 
 * Required Element IDs:
 * - error-message
 * - success-message
 * - sites-container
 * - new-site-input
 * - new-site-price
 * - add-site-button
 * - licenses-container
 * - logout-button
 */

(function() {
    'use strict';
    
    const API_BASE = 'https://consentbit-dashboard-test.web-8fb.workers.dev';
    
    // Function to get Memberstack SDK
    function getMemberstackSDK() {
        if (window.$memberstackReady === true) {
            if (window.memberstack) return window.memberstack;
            if (window.$memberstack) return window.$memberstack;
            if (window.Memberstack) return window.Memberstack;
            if (window.$memberstackDom && window.$memberstackDom.memberstack) return window.$memberstackDom.memberstack;
            if (window.$memberstackDom) return window.$memberstackDom;
        }
        return window.memberstack || 
               window.$memberstack || 
               window.Memberstack ||
               (window.$memberstackDom && window.$memberstackDom.memberstack) ||
               window.$memberstackDom ||
               null;
    }
    
    // Wait for Memberstack SDK
    async function waitForSDK() {
        let attempts = 0;
        const maxAttempts = 40;
        
        while (attempts < maxAttempts) {
            const memberstack = getMemberstackSDK();
            if (memberstack || window.$memberstackReady === true) {
                return getMemberstackSDK();
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        return null;
    }
    
    // Check if user is logged in
    async function checkMemberstackSession() {
        try {
            const memberstack = await waitForSDK();
            
            if (!memberstack) {
                console.error('[Dashboard] Memberstack SDK not loaded');
                return null;
            }
            
            if (memberstack.onReady && typeof memberstack.onReady.then === 'function') {
                await memberstack.onReady;
            }
            
            if (memberstack.getCurrentMember && typeof memberstack.getCurrentMember === 'function') {
                const member = await memberstack.getCurrentMember();
                if (member && member.id) {
                    console.log('[Dashboard] ✅ User logged in:', member.email || member._email);
                    return member;
                }
            }
            
            console.log('[Dashboard] User not logged in');
            return null;
        } catch (error) {
            console.error('[Dashboard] Error checking session:', error);
            return null;
        }
    }
    
    // Show error message
    function showError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
        console.error('[Dashboard] Error:', message);
    }
    
    // Show success message
    function showSuccess(message) {
        const successDiv = document.getElementById('success-message');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 3000);
        }
        console.log('[Dashboard] Success:', message);
    }
    
    // Load dashboard data
    async function loadDashboard(userEmail) {
        const sitesContainer = document.getElementById('sites-container');
        if (!sitesContainer) {
            console.error('[Dashboard] Sites container not found');
            return;
        }
        
        sitesContainer.innerHTML = '<div>Loading sites...</div>';
        
        try {
            // Try email-based endpoint first
            let response = await fetch(`${API_BASE}/dashboard?email=${encodeURIComponent(userEmail)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            // If email endpoint doesn't work, try with session cookie
            if (!response.ok && response.status === 401) {
                response = await fetch(`${API_BASE}/dashboard`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
            }
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Not authenticated');
                }
                throw new Error('Failed to load dashboard');
            }
            
            const data = await response.json();
            displaySites(data.sites || {});
        } catch (error) {
            console.error('[Dashboard] Error loading dashboard:', error);
            const sitesContainer = document.getElementById('sites-container');
            if (sitesContainer) {
                sitesContainer.innerHTML = '<div>Failed to load dashboard data. Please refresh the page.</div>';
            }
        }
    }
    
    // Display sites
    function displaySites(sites) {
        const container = document.getElementById('sites-container');
        if (!container) return;
        
        if (Object.keys(sites).length === 0) {
            container.innerHTML = '<div>No sites yet. Add your first site above!</div>';
            return;
        }
        
        container.innerHTML = Object.keys(sites).map(site => {
            const siteData = sites[site];
            const isActive = siteData.status === 'active';
            
            return `
                <div class="site-card ${isActive ? 'active' : 'inactive'}" data-site="${site}">
                    <div class="site-header">
                        <div class="site-name">${site}</div>
                        <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                            ${siteData.status}
                        </span>
                    </div>
                    <div class="site-info">
                        <div>Item ID: ${siteData.item_id || 'N/A'}</div>
                        <div>Quantity: ${siteData.quantity || 1}</div>
                        ${siteData.created_at ? `<div>Created: ${new Date(siteData.created_at * 1000).toLocaleDateString()}</div>` : ''}
                    </div>
                    ${isActive ? `
                        <button class="remove-site-button" data-site="${site}">
                            Remove Site
                        </button>
                    ` : '<p class="site-removed-message">This site has been removed</p>'}
                </div>
            `;
        }).join('');
        
        // Attach event listeners to remove buttons
        container.querySelectorAll('.remove-site-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const site = btn.getAttribute('data-site');
                removeSite(site);
            });
        });
    }
    
    // Add a new site
    async function addSite(userEmail) {
        const siteInput = document.getElementById('new-site-input');
        const priceInput = document.getElementById('new-site-price');
        
        if (!siteInput || !priceInput) {
            showError('Form elements not found');
            return;
        }
        
        const site = siteInput.value.trim();
        const price = priceInput.value.trim();
        
        if (!site || !price) {
            showError('Please enter both site domain and price ID');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/add-site`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    site, 
                    price,
                    email: userEmail 
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to add site');
            }
            
            showSuccess('Site added successfully! Billing will be updated on next invoice.');
            siteInput.value = '';
            priceInput.value = '';
            loadDashboard(userEmail);
        } catch (error) {
            console.error('[Dashboard] Error adding site:', error);
            showError('Failed to add site: ' + error.message);
        }
    }
    
    // Remove a site
    async function removeSite(site) {
        if (!confirm(`Are you sure you want to remove ${site}? Billing will be updated automatically.`)) {
            return;
        }
        
        const member = await checkMemberstackSession();
        if (!member) {
            showError('Not authenticated');
            return;
        }
        
        const userEmail = member.email || member._email;
        
        try {
            const response = await fetch(`${API_BASE}/remove-site`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    site,
                    email: userEmail 
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to remove site');
            }
            
            showSuccess('Site removed successfully! Billing updated.');
            loadDashboard(userEmail);
        } catch (error) {
            console.error('[Dashboard] Error removing site:', error);
            showError('Failed to remove site: ' + error.message);
        }
    }
    
    // Load licenses
    async function loadLicenses(userEmail) {
        const licensesContainer = document.getElementById('licenses-container');
        if (!licensesContainer) {
            console.error('[Dashboard] Licenses container not found');
            return;
        }
        
        licensesContainer.innerHTML = '<div>Loading licenses...</div>';
        
        try {
            // Try email-based endpoint first
            let response = await fetch(`${API_BASE}/licenses?email=${encodeURIComponent(userEmail)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            // If email endpoint doesn't work, try with session cookie
            if (!response.ok && response.status === 401) {
                response = await fetch(`${API_BASE}/licenses`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
            }
            
            if (!response.ok) {
                throw new Error('Failed to load licenses');
            }
            
            const data = await response.json();
            displayLicenses(data.licenses || []);
        } catch (error) {
            console.error('[Dashboard] Error loading licenses:', error);
            const licensesContainer = document.getElementById('licenses-container');
            if (licensesContainer) {
                licensesContainer.innerHTML = '<div>Failed to load licenses</div>';
            }
        }
    }
    
    // Display licenses
    function displayLicenses(licenses) {
        const container = document.getElementById('licenses-container');
        if (!container) return;
        
        if (licenses.length === 0) {
            container.innerHTML = '<div>No license keys yet. Licenses will appear here after payment.</div>';
            return;
        }
        
        container.innerHTML = licenses.map(license => `
            <div class="license-item">
                <div>
                    <div class="license-key">${license.license_key}</div>
                    <div class="license-meta">
                        Status: ${license.status} | 
                        Created: ${new Date(license.created_at * 1000).toLocaleDateString()}
                    </div>
                </div>
                <button class="copy-license-button" data-key="${license.license_key}">
                    Copy
                </button>
            </div>
        `).join('');
        
        // Attach event listeners to copy buttons
        container.querySelectorAll('.copy-license-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.getAttribute('data-key');
                copyLicense(key);
            });
        });
    }
    
    // Copy license key
    function copyLicense(key) {
        navigator.clipboard.writeText(key).then(() => {
            showSuccess('License key copied to clipboard!');
        }).catch(err => {
            showError('Failed to copy license key');
        });
    }
    
    // Logout function
    async function logout() {
        try {
            const memberstack = await waitForSDK();
            if (memberstack && memberstack.logout) {
                await memberstack.logout();
            }
            
            // Redirect to login page
            window.location.href = '/';
        } catch (error) {
            console.error('[Dashboard] Logout error:', error);
            // Still redirect even if logout fails
            window.location.href = '/';
        }
    }
    
    // Show/hide dashboard content based on login status
    function toggleDashboardVisibility(isLoggedIn) {
        const dashboardElements = document.querySelectorAll('[id^="sites"], [id^="licenses"], [id^="add-site"], #logout-button, #new-site-input, #new-site-price');
        const loginPrompt = document.getElementById('login-prompt');
        
        dashboardElements.forEach(el => {
            if (el) {
                el.style.display = isLoggedIn ? '' : 'none';
            }
        });
        
        if (loginPrompt) {
            loginPrompt.style.display = isLoggedIn ? 'none' : 'block';
        }
    }
    
    // Initialize dashboard
    async function initializeDashboard() {
        console.log('[Dashboard] Initializing...');
        
        // Check if Memberstack SDK is available
        const scriptTag = document.querySelector('script[data-memberstack-app]');
        if (!scriptTag) {
            console.error('[Dashboard] ❌ Memberstack script tag not found!');
            showError('Authentication system not configured. Please add Memberstack SDK.');
            toggleDashboardVisibility(false);
            return;
        }
        
        // Wait for SDK and check session
        const member = await checkMemberstackSession();
        
        if (!member) {
            console.log('[Dashboard] User not logged in - hiding dashboard');
            toggleDashboardVisibility(false);
            return;
        }
        
        // User is logged in
        console.log('[Dashboard] ✅ User logged in:', member.email || member._email);
        toggleDashboardVisibility(true);
        
        const userEmail = member.email || member._email;
        
        // Load dashboard data
        await Promise.all([
            loadDashboard(userEmail),
            loadLicenses(userEmail)
        ]);
        
        // Attach event listeners
        const addSiteButton = document.getElementById('add-site-button');
        if (addSiteButton) {
            addSiteButton.addEventListener('click', () => addSite(userEmail));
        }
        
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', logout);
        }
        
        // Allow Enter key in add site form
        const siteInput = document.getElementById('new-site-input');
        const priceInput = document.getElementById('new-site-price');
        if (siteInput && priceInput && addSiteButton) {
            [siteInput, priceInput].forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        addSiteButton.click();
                    }
                });
            });
        }
        
        console.log('[Dashboard] ✅ Dashboard initialized successfully');
    }
    
    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDashboard);
    } else {
        initializeDashboard();
    }
})();

