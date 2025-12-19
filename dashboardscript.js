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
        const maxAttempts = 60; // Increased to 30 seconds (60 * 500ms)
        
        console.log('[Dashboard] Waiting for Memberstack SDK to load...');
        
        while (attempts < maxAttempts) {
            const memberstack = getMemberstackSDK();
            
            // Check if SDK is ready
            if (window.$memberstackReady === true && memberstack) {
                console.log('[Dashboard] ✅ SDK is ready!');
                return memberstack;
            }
            
            // Also check if SDK exists even if ready flag isn't set yet
            if (memberstack) {
                console.log('[Dashboard] SDK found, checking if ready...');
                // Try to access a method to see if it's actually ready
                if (memberstack.getCurrentMember || memberstack.onReady) {
                    console.log('[Dashboard] SDK appears ready');
                    return memberstack;
                }
            }
            
            if (attempts % 10 === 0) {
                console.log(`[Dashboard] Still waiting for SDK... (${attempts * 0.5}s)`);
                console.log('[Dashboard] $memberstackReady:', window.$memberstackReady);
                console.log('[Dashboard] SDK available:', !!memberstack);
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        console.error('[Dashboard] ⚠️ SDK not loaded after 30 seconds');
        return null;
    }
    
    // Check if user is logged in
    async function checkMemberstackSession() {
        try {
            console.log('[Dashboard] ========================================');
            console.log('[Dashboard] Checking Memberstack session...');
            console.log('[Dashboard] ========================================');
            
            // Debug: Check what's available in window
            console.log('[Dashboard] 🔍 Window state check:');
            console.log('[Dashboard] - $memberstackReady:', window.$memberstackReady);
            console.log('[Dashboard] - window.memberstack:', typeof window.memberstack, window.memberstack ? 'EXISTS' : 'undefined');
            console.log('[Dashboard] - window.$memberstack:', typeof window.$memberstack, window.$memberstack ? 'EXISTS' : 'undefined');
            console.log('[Dashboard] - window.Memberstack:', typeof window.Memberstack, window.Memberstack ? 'EXISTS' : 'undefined');
            console.log('[Dashboard] - window.$memberstackDom:', typeof window.$memberstackDom, window.$memberstackDom ? 'EXISTS' : 'undefined');
            
            // First wait for SDK to be available
            console.log('[Dashboard] ⏳ Waiting for SDK...');
            const memberstack = await waitForSDK();
            
            if (!memberstack) {
                console.error('[Dashboard] ❌ Memberstack SDK not loaded after waiting');
                console.error('[Dashboard] Please ensure Memberstack SDK script is in HEAD section');
                return null;
            }
            
            console.log('[Dashboard] ✅ SDK found:', memberstack);
            console.log('[Dashboard] SDK type:', typeof memberstack);
            console.log('[Dashboard] SDK methods:', Object.keys(memberstack || {}));
            
            console.log('[Dashboard] ⏳ Waiting for SDK ready state...');
            
            // Wait for SDK to be ready (with timeout)
            if (memberstack.onReady && typeof memberstack.onReady.then === 'function') {
                try {
                    console.log('[Dashboard] SDK has onReady promise, waiting...');
                    await Promise.race([
                        memberstack.onReady,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
                    ]);
                    console.log('[Dashboard] ✅ SDK ready promise resolved');
                } catch (error) {
                    console.warn('[Dashboard] ⚠️ SDK ready promise timeout or error:', error);
                    // Continue anyway - SDK might still work
                }
            } else {
                console.log('[Dashboard] ℹ️ SDK does not have onReady promise, continuing...');
            }
            
            // Additional wait to ensure SDK is fully initialized
            console.log('[Dashboard] ⏳ Additional wait for SDK initialization...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Try multiple ways to get the member
            let member = null;
            
            // Method 1: memberstack.getCurrentMember
            if (memberstack.getCurrentMember && typeof memberstack.getCurrentMember === 'function') {
                console.log('[Dashboard] 🔍 Method 1: Trying getCurrentMember()...');
                try {
                    member = await memberstack.getCurrentMember();
                    console.log('[Dashboard] ✅ Member data from getCurrentMember:', member);
                    if (member) {
                        // Check both direct and nested structure
                        const hasDirectId = !!(member.id || member._id);
                        const hasNestedId = !!(member.data && (member.data.id || member.data._id));
                        const hasDirectEmail = !!(member.email || member._email);
                        const hasNestedEmail = !!(member.data && (member.data.email || member.data._email));
                        
                        console.log('[Dashboard] Member structure analysis:');
                        console.log('[Dashboard] - Has direct ID?', hasDirectId);
                        console.log('[Dashboard] - Has nested ID (in .data)?', hasNestedId);
                        console.log('[Dashboard] - Has direct email?', hasDirectEmail);
                        console.log('[Dashboard] - Has nested email (in .data)?', hasNestedEmail);
                        console.log('[Dashboard] - Member keys:', Object.keys(member));
                        if (member.data) {
                            console.log('[Dashboard] - Member.data keys:', Object.keys(member.data));
                            console.log('[Dashboard] - Member.data content:', member.data);
                        }
                    }
                } catch (error) {
                    console.error('[Dashboard] ❌ Error calling getCurrentMember:', error);
                    console.error('[Dashboard] Error details:', error.message, error.stack);
                }
            } else {
                console.log('[Dashboard] ⚠️ Method 1: getCurrentMember not available');
            }
            
            // Method 2: window.memberstack.getCurrentMember
            if ((!member || !member.id) && window.memberstack && window.memberstack.getCurrentMember) {
                console.log('[Dashboard] 🔍 Method 2: Trying window.memberstack.getCurrentMember()...');
                try {
                    member = await window.memberstack.getCurrentMember();
                    console.log('[Dashboard] ✅ Member from window.memberstack:', member);
                } catch (error) {
                    console.error('[Dashboard] ❌ Error with window.memberstack:', error);
                }
            }
            
            // Method 3: $memberstackDom.memberstack.getCurrentMember
            if ((!member || !member.id) && window.$memberstackDom) {
                if (window.$memberstackDom.memberstack && window.$memberstackDom.memberstack.getCurrentMember) {
                    console.log('[Dashboard] 🔍 Method 3: Trying $memberstackDom.memberstack.getCurrentMember()...');
                    try {
                        member = await window.$memberstackDom.memberstack.getCurrentMember();
                        console.log('[Dashboard] ✅ Member from $memberstackDom.memberstack:', member);
                    } catch (error) {
                        console.error('[Dashboard] ❌ Error with $memberstackDom.memberstack:', error);
                    }
                }
            }
            
            // Method 4: Try $memberstackDom directly
            if ((!member || !member.id) && window.$memberstackDom && typeof window.$memberstackDom.getCurrentMember === 'function') {
                console.log('[Dashboard] 🔍 Method 4: Trying $memberstackDom.getCurrentMember()...');
                try {
                    member = await window.$memberstackDom.getCurrentMember();
                    console.log('[Dashboard] ✅ Member from $memberstackDom:', member);
                } catch (error) {
                    console.error('[Dashboard] ❌ Error with $memberstackDom:', error);
                }
            }
            
            // Handle Memberstack v2 SDK response structure: {data: {...}}
            // The actual member data might be nested in a 'data' property
            let actualMember = member;
            
            if (member && member.data) {
                console.log('[Dashboard] ℹ️ Member data is nested in .data property');
                actualMember = member.data;
                console.log('[Dashboard] Extracted member from .data:', actualMember);
            }
            
            // Check for member ID in multiple possible locations
            const memberId = actualMember?.id || actualMember?._id || member?.id || member?._id;
            const hasId = !!memberId;
            
            console.log('[Dashboard] Member ID check:');
            console.log('[Dashboard] - actualMember.id:', actualMember?.id);
            console.log('[Dashboard] - actualMember._id:', actualMember?._id);
            console.log('[Dashboard] - member.id:', member?.id);
            console.log('[Dashboard] - member._id:', member?._id);
            console.log('[Dashboard] - Final memberId:', memberId);
            console.log('[Dashboard] - Has ID?', hasId);
            
            if (hasId) {
                // Get email from member object (try multiple possible fields and locations)
                let email = actualMember?.email || actualMember?._email || 
                           member?.email || member?._email || 
                           actualMember?.Email || actualMember?.EMAIL ||
                           member?.Email || member?.EMAIL;
                
                console.log('[Dashboard] Email extraction:');
                console.log('[Dashboard] - actualMember.email:', actualMember?.email);
                console.log('[Dashboard] - actualMember._email:', actualMember?._email);
                console.log('[Dashboard] - member.email:', member?.email);
                console.log('[Dashboard] - Final email:', email);
                
                // Validate and normalize email
                if (!email) {
                    console.error('[Dashboard] ❌ Member has no email field!');
                    console.error('[Dashboard] Available actualMember fields:', Object.keys(actualMember || {}));
                    console.error('[Dashboard] Available member fields:', Object.keys(member || {}));
                    console.error('[Dashboard] Full member object:', JSON.stringify(member, null, 2));
                    return null;
                }
                
                // Normalize email (lowercase, trim)
                email = email.toString().toLowerCase().trim();
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    console.error('[Dashboard] ❌ Invalid email format:', email);
                    return null;
                }
                
                console.log('[Dashboard] ========================================');
                console.log('[Dashboard] ✅✅✅ USER LOGGED IN ✅✅✅');
                console.log('[Dashboard] ========================================');
                console.log('[Dashboard] 📧 Email (normalized):', email);
                console.log('[Dashboard] 👤 Member ID:', memberId);
                console.log('[Dashboard] 📋 Email source:', actualMember?.email ? 'actualMember.email' : 
                           (actualMember?._email ? 'actualMember._email' : 
                           (member?.email ? 'member.email' : 'other')));
                console.log('[Dashboard] Full member object:', JSON.stringify(member, null, 2));
                console.log('[Dashboard] ========================================');
                
                // Store normalized email and member ID in member object for later use
                // Use the original member object but add normalized data
                const returnMember = {
                    ...member,
                    id: memberId,
                    _id: memberId,
                    email: email,
                    _email: email,
                    normalizedEmail: email,
                    data: actualMember // Keep the nested data structure
                };
                
                return returnMember;
            } else {
                console.log('[Dashboard] ========================================');
                console.log('[Dashboard] ❌ No member found or member has no ID');
                console.log('[Dashboard] Member object received:', member);
                console.log('[Dashboard] Actual member (from .data):', actualMember);
                if (member) {
                    console.log('[Dashboard] Member keys:', Object.keys(member));
                    if (member.data) {
                        console.log('[Dashboard] Member.data keys:', Object.keys(member.data));
                        console.log('[Dashboard] Member.data.id:', member.data.id);
                        console.log('[Dashboard] Member.data._id:', member.data._id);
                    }
                    console.log('[Dashboard] Member ID value:', memberId || 'NONE');
                }
                console.log('[Dashboard] ========================================');
                return null;
            }
        } catch (error) {
            console.error('[Dashboard] Error checking session:', error);
            console.error('[Dashboard] Error details:', error.message);
            if (error.stack) {
                console.error('[Dashboard] Stack trace:', error.stack);
            }
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
        
        // Validate email before making API call
        if (!userEmail || !userEmail.includes('@')) {
            console.error('[Dashboard] ❌ Invalid email for API call:', userEmail);
            sitesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">Invalid email address. Please log out and log in again.</div>';
            return;
        }
        
        sitesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading sites...</div>';
        
        console.log('[Dashboard] 📤 Sending API request with email:', userEmail);
        console.log('[Dashboard] 🔗 Request URL:', `${API_BASE}/dashboard?email=${encodeURIComponent(userEmail)}`);
        
        try {
            // Try email-based endpoint first
            let response = await fetch(`${API_BASE}/dashboard?email=${encodeURIComponent(userEmail)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            console.log('[Dashboard] 📥 API Response status:', response.status);
            
            // If email endpoint doesn't work, try with session cookie
            if (!response.ok && response.status === 401) {
                console.log('[Dashboard] Email endpoint returned 401, trying session-based endpoint...');
                response = await fetch(`${API_BASE}/dashboard`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
                console.log('[Dashboard] 📥 Session-based API Response status:', response.status);
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Dashboard] ❌ API Error:', response.status, errorText);
                
                if (response.status === 401) {
                    throw new Error('Not authenticated');
                } else if (response.status === 404) {
                    throw new Error('User data not found for this email');
                }
                throw new Error(`Failed to load dashboard: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('[Dashboard] ✅ Dashboard data received:', data);
            console.log('[Dashboard] 📊 Sites count:', Object.keys(data.sites || {}).length);
            displaySites(data.sites || {});
        } catch (error) {
            console.error('[Dashboard] ❌ Error loading dashboard:', error);
            console.error('[Dashboard] Error details:', error.message);
            const sitesContainer = document.getElementById('sites-container');
            if (sitesContainer) {
                sitesContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #f44336;">
                    <p>Failed to load dashboard data.</p>
                    <p style="font-size: 12px; margin-top: 10px;">Error: ${error.message}</p>
                    <p style="font-size: 12px;">Email used: ${userEmail}</p>
                    <p style="font-size: 12px;">Please refresh the page or contact support.</p>
                </div>`;
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
        
        // Validate email before making API call
        if (!userEmail || !userEmail.includes('@')) {
            console.error('[Dashboard] ❌ Invalid email for licenses API call:', userEmail);
            licensesContainer.innerHTML = '<div style="color: #f44336; padding: 20px;">Invalid email address</div>';
            return;
        }
        
        licensesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading licenses...</div>';
        
        console.log('[Dashboard] 📤 Sending licenses API request with email:', userEmail);
        console.log('[Dashboard] 🔗 Request URL:', `${API_BASE}/licenses?email=${encodeURIComponent(userEmail)}`);
        
        try {
            // Try email-based endpoint first
            let response = await fetch(`${API_BASE}/licenses?email=${encodeURIComponent(userEmail)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            console.log('[Dashboard] 📥 Licenses API Response status:', response.status);
            
            // If email endpoint doesn't work, try with session cookie
            if (!response.ok && response.status === 401) {
                console.log('[Dashboard] Licenses email endpoint returned 401, trying session-based endpoint...');
                response = await fetch(`${API_BASE}/licenses`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
                console.log('[Dashboard] 📥 Session-based Licenses API Response status:', response.status);
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Dashboard] ❌ Licenses API Error:', response.status, errorText);
                throw new Error(`Failed to load licenses: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('[Dashboard] ✅ Licenses data received:', data);
            console.log('[Dashboard] 🔑 Licenses count:', (data.licenses || []).length);
            displayLicenses(data.licenses || []);
        } catch (error) {
            console.error('[Dashboard] ❌ Error loading licenses:', error);
            console.error('[Dashboard] Error details:', error.message);
            const licensesContainer = document.getElementById('licenses-container');
            if (licensesContainer) {
                licensesContainer.innerHTML = `<div style="color: #f44336; padding: 20px;">
                    Failed to load licenses.<br>
                    <small>Email: ${userEmail}</small><br>
                    <small>Error: ${error.message}</small>
                </div>`;
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
        
        console.log('[Dashboard] Toggle visibility - isLoggedIn:', isLoggedIn);
        
        if (dashboardContainer) {
            dashboardContainer.style.display = isLoggedIn ? 'block' : 'none';
            console.log('[Dashboard] Dashboard container display:', dashboardContainer.style.display);
        }
        
        if (loginPrompt) {
            loginPrompt.style.display = isLoggedIn ? 'none' : 'block';
            console.log('[Dashboard] Login prompt display:', loginPrompt.style.display);
        }
    }
    
    // Wait for Memberstack to be fully ready
    async function waitForMemberstackReady() {
        console.log('[Dashboard] ⏳ Waiting for Memberstack to be fully ready...');
        
        // Method 1: Wait for $memberstackReady flag
        let attempts = 0;
        const maxAttempts = 60; // 30 seconds
        
        while (attempts < maxAttempts) {
            if (window.$memberstackReady === true) {
                console.log('[Dashboard] ✅ $memberstackReady is true');
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
            
            if (attempts % 10 === 0) {
                console.log(`[Dashboard] Still waiting for $memberstackReady... (${attempts * 0.5}s)`);
            }
        }
        
        // Method 2: Wait for SDK object to be available
        const memberstack = await waitForSDK();
        if (!memberstack) {
            console.error('[Dashboard] ❌ SDK not available after waiting');
            return false;
        }
        
        // Method 3: Wait for onReady promise if available
        if (memberstack.onReady && typeof memberstack.onReady.then === 'function') {
            try {
                console.log('[Dashboard] ⏳ Waiting for SDK onReady promise...');
                await Promise.race([
                    memberstack.onReady,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
                ]);
                console.log('[Dashboard] ✅ SDK onReady promise resolved');
            } catch (error) {
                console.warn('[Dashboard] ⚠️ SDK onReady timeout, but continuing...');
            }
        }
        
        // Additional wait to ensure everything is initialized
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('[Dashboard] ✅ Memberstack should be ready now');
        return true;
    }
    
    // Initialize dashboard
    async function initializeDashboard() {
        console.log('[Dashboard] ========================================');
        console.log('[Dashboard] 🚀 INITIALIZING DASHBOARD');
        console.log('[Dashboard] ========================================');
        
        // Create dashboard HTML structure first (always show it)
        createDashboardHTML();
        
        // Show dashboard by default (will hide if not logged in)
        toggleDashboardVisibility(true);
        
        // Check if Memberstack SDK script tag exists
        const scriptTag = document.querySelector('script[data-memberstack-app]');
        if (!scriptTag) {
            console.error('[Dashboard] ❌ Memberstack script tag not found!');
            console.error('[Dashboard] Waiting 5 seconds and checking again...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check again
            const retryScriptTag = document.querySelector('script[data-memberstack-app]');
            if (!retryScriptTag) {
                console.error('[Dashboard] ❌ Memberstack script tag still not found after waiting');
                showError('Authentication system not configured. Please add Memberstack SDK to HEAD section.');
                toggleDashboardVisibility(false);
                return;
            }
            console.log('[Dashboard] ✅ Memberstack script tag found on retry');
        } else {
            console.log('[Dashboard] ✅ Memberstack script tag found');
            const appId = scriptTag.getAttribute('data-memberstack-app');
            console.log('[Dashboard] Memberstack App ID:', appId);
        }
        
        // Wait for Memberstack to be fully ready
        const isReady = await waitForMemberstackReady();
        if (!isReady) {
            console.error('[Dashboard] ❌ Memberstack not ready after waiting');
            showError('Memberstack SDK is taking too long to load. Please refresh the page.');
            toggleDashboardVisibility(false);
            return;
        }
        
        // Try checking session multiple times (retry logic)
        let member = null;
        let retryCount = 0;
        const maxRetries = 8; // Increased retries
        
        console.log('[Dashboard] 🔍 Starting session check with retry logic...');
        
        while (!member && retryCount < maxRetries) {
            console.log(`[Dashboard] ========================================`);
            console.log(`[Dashboard] 🔄 Session check attempt ${retryCount + 1}/${maxRetries}`);
            console.log(`[Dashboard] ========================================`);
            
            member = await checkMemberstackSession();
            
            if (!member) {
                retryCount++;
                if (retryCount < maxRetries) {
                    const waitTime = 3000; // 3 seconds between retries
                    console.log(`[Dashboard] ⏳ No member found, waiting ${waitTime/1000} seconds before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            } else {
                console.log(`[Dashboard] ✅ Member found on attempt ${retryCount + 1}!`);
            }
        }
        
        if (!member) {
            console.log('[Dashboard] ========================================');
            console.log('[Dashboard] ❌❌❌ USER NOT LOGGED IN AFTER ALL RETRIES ❌❌❌');
            console.log('[Dashboard] ========================================');
            console.log('[Dashboard] 🔍 Final Debug Info:');
            console.log('[Dashboard] - window.$memberstackReady:', window.$memberstackReady);
            console.log('[Dashboard] - window.memberstack:', typeof window.memberstack, window.memberstack ? 'EXISTS ✅' : 'undefined ❌');
            console.log('[Dashboard] - window.$memberstack:', typeof window.$memberstack, window.$memberstack ? 'EXISTS ✅' : 'undefined ❌');
            console.log('[Dashboard] - window.Memberstack:', typeof window.Memberstack, window.Memberstack ? 'EXISTS ✅' : 'undefined ❌');
            console.log('[Dashboard] - window.$memberstackDom:', typeof window.$memberstackDom, window.$memberstackDom ? 'EXISTS ✅' : 'undefined ❌');
            
            // Try one more direct check
            if (window.$memberstackDom && window.$memberstackDom.memberstack) {
                console.log('[Dashboard] 🔍 Trying direct access to $memberstackDom.memberstack...');
                try {
                    const directMember = await window.$memberstackDom.memberstack.getCurrentMember();
                    console.log('[Dashboard] Direct member check result:', directMember);
                } catch (e) {
                    console.error('[Dashboard] Direct member check error:', e);
                }
            }
            
            console.log('[Dashboard] ========================================');
            console.log('[Dashboard] 💡 TROUBLESHOOTING:');
            console.log('[Dashboard] 1. Make sure you are logged in via Memberstack');
            console.log('[Dashboard] 2. Check if Memberstack SDK loaded correctly');
            console.log('[Dashboard] 3. Try refreshing the page');
            console.log('[Dashboard] 4. Check browser console for Memberstack errors');
            console.log('[Dashboard] ========================================');
            
            toggleDashboardVisibility(false);
            return;
        }
        
        // User is logged in - use normalized email
        const userEmail = member.normalizedEmail || (member.email || member._email || '').toLowerCase().trim();
        
        if (!userEmail) {
            console.error('[Dashboard] ❌ No email found in member object!');
            showError('Unable to retrieve user email. Please log out and log in again.');
            toggleDashboardVisibility(false);
            return;
        }
        
        // Validate email format one more time
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            console.error('[Dashboard] ❌ Invalid email format:', userEmail);
            showError('Invalid email format. Please contact support.');
            toggleDashboardVisibility(false);
            return;
        }
        
        console.log('[Dashboard] ✅ User logged in');
        console.log('[Dashboard] 📧 Logged in email (verified):', userEmail);
        console.log('[Dashboard] 👤 Member ID:', member.id || member._id);
        console.log('[Dashboard] 🔍 Email will be used to fetch data from database/Stripe');
        toggleDashboardVisibility(true);
        
        // Load dashboard data
        console.log('[Dashboard] 🔄 Loading dashboard data for email:', userEmail);
        console.log('[Dashboard] 🔗 API endpoint:', `${API_BASE}/dashboard?email=${encodeURIComponent(userEmail)}`);
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
