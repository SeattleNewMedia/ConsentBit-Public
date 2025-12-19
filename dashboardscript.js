/**
 * Dashboard Script - Complete with HTML and Styles
 * Host this on GitHub/Cloudflare Pages and reference from Webflow
 * 
 * Usage in Webflow:
 * <script src="https://api.consentbit.com/dashboardscript.js"></script>
 * 
 * This script creates all HTML and styles automatically - no Webflow elements needed!
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
                    const email = member.email || member._email;
                    console.log('[Dashboard] ✅ User logged in');
                    console.log('[Dashboard] 📧 Email:', email);
                    console.log('[Dashboard] 👤 Member ID:', member.id || member._id);
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
    
    // Create dashboard HTML structure
    function createDashboardHTML() {
        // Check if dashboard already exists
        if (document.getElementById('dashboard-container')) {
            return;
        }
        
        const body = document.body;
        
        // Create main container
        const container = document.createElement('div');
        container.id = 'dashboard-container';
        container.style.cssText = `
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        `;
        
        // Header
        const header = document.createElement('div');
        header.className = 'header';
        header.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="color: #333; margin-bottom: 10px; font-size: 28px;">📋 License Dashboard</h1>
                    <p style="color: #666; margin: 0;">Manage your sites and license keys</p>
                </div>
                <button id="logout-button" style="
                    padding: 10px 20px;
                    background: #f44336;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    max-width: 120px;
                ">Logout</button>
            </div>
        `;
        
        // Error message
        const errorMessage = document.createElement('div');
        errorMessage.id = 'error-message';
        errorMessage.className = 'error';
        errorMessage.style.cssText = `
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        `;
        
        // Success message
        const successMessage = document.createElement('div');
        successMessage.id = 'success-message';
        successMessage.className = 'success';
        successMessage.style.cssText = `
            background: #e8f5e9;
            color: #2e7d32;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        `;
        
        // Sites Card
        const sitesCard = document.createElement('div');
        sitesCard.className = 'card';
        sitesCard.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        sitesCard.innerHTML = `
            <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">🌐 Your Sites</h2>
            <div id="sites-container" style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            "></div>
            <div style="margin-top: 30px; padding-top: 30px; border-top: 2px solid #e0e0e0;">
                <h3 style="margin-bottom: 15px; color: #333;">Add New Site</h3>
                <div id="add-site-form" style="display: flex; gap: 10px;">
                    <input 
                        type="text" 
                        id="new-site-input" 
                        placeholder="Enter site domain (e.g., example.com)"
                        style="
                            flex: 1;
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 6px;
                            font-size: 14px;
                        "
                    />
                    <input 
                        type="text" 
                        id="new-site-price" 
                        placeholder="Price ID (e.g., price_xxxxx)"
                        style="
                            flex: 1;
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 6px;
                            font-size: 14px;
                        "
                    />
                    <button id="add-site-button" style="
                        padding: 12px 24px;
                        background: #667eea;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                    ">Add Site</button>
                </div>
            </div>
        `;
        
        // Licenses Card
        const licensesCard = document.createElement('div');
        licensesCard.className = 'card';
        licensesCard.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        licensesCard.innerHTML = `
            <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">🔑 Your License Keys</h2>
            <div id="licenses-container"></div>
        `;
        
        // Login Prompt
        const loginPrompt = document.createElement('div');
        loginPrompt.id = 'login-prompt';
        loginPrompt.style.cssText = `
            display: none;
            text-align: center;
            padding: 100px 20px;
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        loginPrompt.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">🔐</div>
            <h2 style="margin-bottom: 15px; color: #333;">Please Log In</h2>
            <p style="color: #666; margin-bottom: 30px;">You need to be logged in to view your dashboard.</p>
            <a href="/" style="
                display: inline-block;
                padding: 12px 24px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
            ">Go to Login Page</a>
        `;
        
        // Assemble container
        container.appendChild(header);
        container.appendChild(errorMessage);
        container.appendChild(successMessage);
        container.appendChild(sitesCard);
        container.appendChild(licensesCard);
        container.appendChild(loginPrompt);
        
        // Add to body
        body.appendChild(container);
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
        
        sitesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading sites...</div>';
        
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
                sitesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">Failed to load dashboard data. Please refresh the page.</div>';
            }
        }
    }
    
    // Display sites
    function displaySites(sites) {
        const container = document.getElementById('sites-container');
        if (!container) return;
        
        if (Object.keys(sites).length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999; grid-column: 1 / -1;">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width: 64px; height: 64px; margin-bottom: 20px; opacity: 0.5;">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <p style="font-size: 18px; margin-bottom: 10px;">No sites yet</p>
                    <p style="font-size: 14px;">Add your first site above!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = Object.keys(sites).map(site => {
            const siteData = sites[site];
            const isActive = siteData.status === 'active';
            
            return `
                <div class="site-card ${isActive ? 'active' : 'inactive'}" style="
                    border: 2px solid ${isActive ? '#4caf50' : '#f44336'};
                    border-radius: 8px;
                    padding: 20px;
                    background: ${isActive ? '#f1f8f4' : '#fff5f5'};
                    opacity: ${isActive ? '1' : '0.7'};
                    transition: all 0.3s;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div style="font-weight: bold; font-size: 18px; color: #333;">${site}</div>
                        <span style="
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: bold;
                            text-transform: uppercase;
                            background: ${isActive ? '#4caf50' : '#f44336'};
                            color: white;
                        ">${siteData.status}</span>
                    </div>
                    <div style="color: #666; font-size: 14px; margin: 10px 0;">
                        <div>Item ID: ${siteData.item_id || 'N/A'}</div>
                        <div>Quantity: ${siteData.quantity || 1}</div>
                        ${siteData.created_at ? `<div>Created: ${new Date(siteData.created_at * 1000).toLocaleDateString()}</div>` : ''}
                    </div>
                    ${isActive ? `
                        <button class="remove-site-button" data-site="${site}" style="
                            padding: 10px 20px;
                            background: #f44336;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            margin-top: 10px;
                            width: 100%;
                            transition: background 0.3s;
                        " onmouseover="this.style.background='#d32f2f'" onmouseout="this.style.background='#f44336'">Remove Site</button>
                    ` : '<p style="color: #999; font-size: 12px; margin-top: 10px;">This site has been removed</p>'}
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
        
        licensesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading licenses...</div>';
        
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
                licensesContainer.innerHTML = '<div style="color: #f44336; padding: 20px;">Failed to load licenses</div>';
            }
        }
    }
    
    // Display licenses
    function displayLicenses(licenses) {
        const container = document.getElementById('licenses-container');
        if (!container) return;
        
        if (licenses.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <p>No license keys yet. Licenses will appear here after payment.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = licenses.map(license => `
            <div class="license-item" style="
                background: #f5f5f5;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <div class="license-key" style="
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        color: #333;
                        font-weight: bold;
                    ">${license.license_key}</div>
                    <div style="font-size: 12px; color: #999; margin-top: 5px;">
                        Status: ${license.status} | 
                        Created: ${new Date(license.created_at * 1000).toLocaleDateString()}
                    </div>
                </div>
                <button class="copy-license-button" data-key="${license.license_key}" style="
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background 0.3s;
                " onmouseover="this.style.background='#5568d3'" onmouseout="this.style.background='#667eea'">Copy</button>
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
        const dashboardContainer = document.getElementById('dashboard-container');
        const loginPrompt = document.getElementById('login-prompt');
        
        if (dashboardContainer) {
            dashboardContainer.style.display = isLoggedIn ? 'block' : 'none';
        }
        
        if (loginPrompt) {
            loginPrompt.style.display = isLoggedIn ? 'none' : 'block';
        }
    }
    
    // Initialize dashboard
    async function initializeDashboard() {
        console.log('[Dashboard] Initializing...');
        
        // Create dashboard HTML structure
        createDashboardHTML();
        
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
        const userEmail = member.email || member._email;
        console.log('[Dashboard] ✅ User logged in');
        console.log('[Dashboard] 📧 Logged in email:', userEmail);
        console.log('[Dashboard] 👤 Member ID:', member.id || member._id);
        toggleDashboardVisibility(true);
        
        // Load dashboard data
        console.log('[Dashboard] 🔄 Loading dashboard data for:', userEmail);
        await Promise.all([
            loadDashboard(userEmail),
            loadLicenses(userEmail)
        ]);
        console.log('[Dashboard] ✅ Dashboard data loaded successfully');
        
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
    
    // Expose functions to global scope (for inline onclick handlers if needed)
    window.addSite = async function() {
        const member = await checkMemberstackSession();
        if (!member) {
            showError('Not authenticated');
            return;
        }
        const userEmail = member.email || member._email;
        await addSite(userEmail);
    };
    
    window.removeSite = async function(site) {
        await removeSite(site);
    };
    
    window.copyLicense = function(key) {
        copyLicense(key);
    };
    
    window.logout = async function() {
        await logout();
    };
    
    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDashboard);
    } else {
        initializeDashboard();
    }
})();
