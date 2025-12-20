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
           
            // First wait for SDK to be available
         
            const memberstack = await waitForSDK();
            
            if (!memberstack) {
               
                return null;
            }
            
            
            // Wait for SDK to be ready (with timeout)
            if (memberstack.onReady && typeof memberstack.onReady.then === 'function') {
                try {
                 
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
                        const hasNestedEmail = !!(member.data && (member.data.email || member.data._email || member.data.auth?.email));
                        
                        console.log('[Dashboard] Member structure analysis:');
                        console.log('[Dashboard] - Has direct ID?', hasDirectId);
                        console.log('[Dashboard] - Has nested ID (in .data)?', hasNestedId);
                        console.log('[Dashboard] - Has direct email?', hasDirectEmail);
                        console.log('[Dashboard] - Has nested email (in .data or .data.auth)?', hasNestedEmail);
                        console.log('[Dashboard] - Member keys:', Object.keys(member));
                        if (member.data) {
                            console.log('[Dashboard] - Member.data keys:', Object.keys(member.data));
                            console.log('[Dashboard] - Member.data.auth?.email:', member.data.auth?.email);
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
            
            // CRITICAL: Always check if member exists first
            if (!member) {
                console.log('[Dashboard] ❌ Member is null or undefined - cannot proceed');
                return null;
            }
            
          
            
            if (member && member.data) {
              
                actualMember = member.data;

            } else {
                console.log('[Dashboard] ℹ️ Member data is NOT nested - using member directly');
                console.log('[Dashboard] member.id:', member?.id);
                console.log('[Dashboard] member.email:', member?.email);
                console.log('[Dashboard] member.auth?.email:', member?.auth?.email);
            }
            console.log('[Dashboard] ========================================');
            
            // Check for member ID in multiple possible locations
            // Memberstack might return id, _id, or the ID might be in a different structure
            // IMPORTANT: Check actualMember first (after extraction), then fall back to member
            const memberId = actualMember?.id || 
                           actualMember?._id || 
                           actualMember?.memberId || 
                           actualMember?.member_id ||
                           member?.data?.id || 
                           member?.data?._id ||
                           member?.id || 
                           member?._id;
            const hasId = !!memberId;
            
            // Debug: Log what we found
         
           
            
            // If no ID found, check if member exists at all (maybe just having member.data means logged in)
            if (!hasId && actualMember && Object.keys(actualMember).length > 0) {
               
            }
            
            // Accept member if we have either ID OR email (some Memberstack responses might not have ID)
            // Check for email in multiple locations including auth.email
            const hasEmail = !!(actualMember?.email || 
                               actualMember?._email || 
                               actualMember?.auth?.email ||
                               actualMember?.auth?._email ||
                               member?.email || 
                               member?._email ||
                               member?.data?.auth?.email ||
                               member?.data?.auth?._email);
            
     
            
            // Accept if we have ID OR if we have actualMember with email
            // This handles cases where ID might be missing but email exists
            // CRITICAL: Also accept if actualMember exists and has either id or auth.email directly
            const hasActualMemberWithId = !!(actualMember && actualMember.id);
            const hasActualMemberWithEmail = !!(actualMember && actualMember.auth && actualMember.auth.email);
            const hasMemberDataWithId = !!(member && member.data && member.data.id);
            const hasMemberDataWithEmail = !!(member && member.data && member.data.auth && member.data.auth.email);
            
            console.log('[Dashboard] 🔍 Additional validation checks:');
            console.log('[Dashboard] - hasActualMemberWithId:', hasActualMemberWithId);
            console.log('[Dashboard] - hasActualMemberWithEmail:', hasActualMemberWithEmail);
            console.log('[Dashboard] - hasMemberDataWithId:', hasMemberDataWithId);
            console.log('[Dashboard] - hasMemberDataWithEmail:', hasMemberDataWithEmail);
            
            // Accept member if ANY of these conditions are true:
            // 1. We found an ID anywhere
            // 2. We found an email anywhere AND actualMember exists
            // 3. actualMember exists and has id directly
            // 4. actualMember exists and has auth.email directly
            // 5. member.data exists and has id directly
            // 6. member.data exists and has auth.email directly
            const isValidMember = hasId || 
                                 (actualMember && hasEmail) || 
                                 hasActualMemberWithId ||
                                 hasActualMemberWithEmail ||
                                 hasMemberDataWithId ||
                                 hasMemberDataWithEmail;
            
            console.log('[Dashboard] - Final isValidMember:', isValidMember);
            
            if (isValidMember) {
           
                // Get email from member object (try multiple possible fields and locations)
                // Email can be in multiple locations: direct property, auth.email, or nested in member.data.auth.email
                let email = actualMember?.email || 
                           actualMember?._email || 
                           actualMember?.auth?.email ||
                           actualMember?.auth?._email ||
                           member?.email || 
                           member?._email || 
                           member?.data?.auth?.email ||
                           member?.data?.auth?._email ||
                           actualMember?.Email || 
                           actualMember?.EMAIL ||
                           member?.Email || 
                           member?.EMAIL;
                
                console.log('[Dashboard] Email extraction:');
            
                // Validate and normalize email
                if (!email) {
                  
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
                // Even if no ID, check if we have email - might still be logged in
                // IMPORTANT: Check auth.email here too!
                const hasEmail = !!(actualMember?.email || 
                                   actualMember?._email || 
                                   actualMember?.auth?.email ||
                                   actualMember?.auth?._email ||
                                   member?.email || 
                                   member?._email ||
                                   member?.data?.auth?.email ||
                                   member?.data?.auth?._email);
                
            
                
                if (member) {
                    console.log('[Dashboard] Member keys:', Object.keys(member));
                    if (member.data) {
                        console.log('[Dashboard] Member.data keys:', Object.keys(member.data));
                        console.log('[Dashboard] Member.data.id:', member.data.id);
                        console.log('[Dashboard] Member.data._id:', member.data._id);
                        console.log('[Dashboard] Member.data.email:', member.data.email);
                        console.log('[Dashboard] Member.data.auth?.email:', member.data.auth?.email);
                        console.log('[Dashboard] Full member.data:', JSON.stringify(member.data, null, 2));
                    }
                    console.log('[Dashboard] Member ID value:', memberId || 'NONE');
                }
                
                // If we have email but no ID, still accept it (some Memberstack responses might work this way)
                if (hasEmail && actualMember) {
                    console.log('[Dashboard] ℹ️ No ID but has email - accepting member anyway');
                    // Extract email from all possible locations including auth.email
                    let email = actualMember?.email || 
                               actualMember?._email || 
                               actualMember?.auth?.email ||
                               actualMember?.auth?._email ||
                               member?.email || 
                               member?._email ||
                               member?.data?.auth?.email ||
                               member?.data?.auth?._email;
                    email = email.toString().toLowerCase().trim();
                    
                    const returnMember = {
                        ...member,
                        id: 'no-id',
                        _id: 'no-id',
                        email: email,
                        _email: email,
                        normalizedEmail: email,
                        data: actualMember
                    };
                    
                    console.log('[Dashboard] ✅ Returning member with email only (no ID)');
                    return returnMember;
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
    
    // Create dashboard HTML structure with sidebar
    function createDashboardHTML() {
        // Check if dashboard already exists
        if (document.getElementById('dashboard-container')) {
            console.log('[Dashboard] Dashboard HTML already exists, skipping creation');
            return;
        }
        
        console.log('[Dashboard] 🏗️ Creating dashboard HTML structure with sidebar...');
        const body = document.body;
        
        if (!body) {
            console.error('[Dashboard] ❌ Body element not found!');
            return;
        }
        
        // Create main container with flex layout
        const container = document.createElement('div');
        container.id = 'dashboard-container';
        container.style.cssText = `
            display: flex;
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
        `;
        
        // Sidebar
        const sidebar = document.createElement('div');
        sidebar.id = 'dashboard-sidebar';
        sidebar.style.cssText = `
            width: 250px;
            background: #2c3e50;
            color: white;
            padding: 20px 0;
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
            position: fixed;
            height: 100vh;
            overflow-y: auto;
        `;
        
        sidebar.innerHTML = `
            <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <h2 style="margin: 0; font-size: 20px; color: white;">📋 Dashboard</h2>
            </div>
            <nav style="padding: 10px 0;">
                <button class="sidebar-item active" data-section="domains" style="
                    width: 100%;
                    padding: 15px 20px;
                    background: transparent;
                    border: none;
                    color: white;
                    text-align: left;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.3s;
                    border-left: 3px solid transparent;
                ">
                    🌐 Domains/Sites
                </button>
                <button class="sidebar-item" data-section="subscriptions" style="
                    width: 100%;
                    padding: 15px 20px;
                    background: transparent;
                    border: none;
                    color: white;
                    text-align: left;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.3s;
                    border-left: 3px solid transparent;
                ">
                    💳 Subscriptions
                </button>
                <button class="sidebar-item" data-section="payment" style="
                    width: 100%;
                    padding: 15px 20px;
                    background: transparent;
                    border: none;
                    color: white;
                    text-align: left;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.3s;
                    border-left: 3px solid transparent;
                ">
                    💰 Payment
                </button>
            </nav>
            <div style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.1); margin-top: auto;">
                <button id="logout-button" style="
                    width: 100%;
                    padding: 12px;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                ">Logout</button>
            </div>
        `;
        
        // Main content area
        const mainContent = document.createElement('div');
        mainContent.id = 'dashboard-main-content';
        mainContent.style.cssText = `
            flex: 1;
            margin-left: 250px;
            padding: 30px;
            background: #f5f5f5;
        `;
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 25px 30px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        header.innerHTML = `
            <h1 style="margin: 0; color: #333; font-size: 28px;">License Dashboard</h1>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Manage your sites, subscriptions, and payments</p>
        `;
        
        // Error message
        const errorMessage = document.createElement('div');
        errorMessage.id = 'error-message';
        errorMessage.style.cssText = `
            background: #ffebee;
            color: #c62828;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
            border-left: 4px solid #c62828;
        `;
        
        // Success message
        const successMessage = document.createElement('div');
        successMessage.id = 'success-message';
        successMessage.style.cssText = `
            background: #e8f5e9;
            color: #2e7d32;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
            border-left: 4px solid #2e7d32;
        `;
        
        // Content sections (hidden by default, shown based on sidebar selection)
        const domainsSection = document.createElement('div');
        domainsSection.id = 'domains-section';
        domainsSection.className = 'content-section';
        domainsSection.style.cssText = 'display: block;';
        domainsSection.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">🌐 Your Domains/Sites</h2>
                <div id="domains-table-container"></div>
            </div>
        `;
        
        const subscriptionsSection = document.createElement('div');
        subscriptionsSection.id = 'subscriptions-section';
        subscriptionsSection.className = 'content-section';
        subscriptionsSection.style.cssText = 'display: none;';
        subscriptionsSection.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">💳 Your Subscriptions</h2>
                <div id="subscriptions-accordion-container"></div>
            </div>
        `;
        
        const paymentSection = document.createElement('div');
        paymentSection.id = 'payment-section';
        paymentSection.className = 'content-section';
        paymentSection.style.cssText = 'display: none;';
        paymentSection.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">💰 Payment History</h2>
                <div id="payment-container">
                    <p style="color: #666;">Payment history will be displayed here.</p>
                </div>
            </div>
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">🔑 Your License Keys</h2>
                <div id="licenses-container"></div>
            </div>
        `;
        
        // Legacy containers (for backward compatibility)
        const sitesContainer = document.createElement('div');
        sitesContainer.id = 'sites-container';
        sitesContainer.style.display = 'none';
        
        const licensesContainer = document.createElement('div');
        licensesContainer.id = 'licenses-container';
        licensesContainer.style.display = 'none';
        
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
        
        // Assemble main content
        mainContent.appendChild(header);
        mainContent.appendChild(errorMessage);
        mainContent.appendChild(successMessage);
        mainContent.appendChild(domainsSection);
        mainContent.appendChild(subscriptionsSection);
        mainContent.appendChild(paymentSection);
        mainContent.appendChild(sitesContainer);
        mainContent.appendChild(licensesContainer);
        mainContent.appendChild(loginPrompt);
        
        // Assemble container
        container.appendChild(sidebar);
        container.appendChild(mainContent);
        
        // Add to body
        body.appendChild(container);
        
        // Add sidebar navigation handlers
        sidebar.querySelectorAll('.sidebar-item').forEach(btn => {
            btn.addEventListener('click', function() {
                // Update active state
                sidebar.querySelectorAll('.sidebar-item').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.borderLeftColor = 'transparent';
                });
                this.classList.add('active');
                this.style.background = 'rgba(255,255,255,0.1)';
                this.style.borderLeftColor = '#3498db';
                
                // Show/hide sections
                const section = this.getAttribute('data-section');
                document.querySelectorAll('.content-section').forEach(s => {
                    s.style.display = 'none';
                });
                const targetSection = document.getElementById(`${section}-section`);
                if (targetSection) {
                    targetSection.style.display = 'block';
                }
            });
            
            // Hover effects
            btn.addEventListener('mouseenter', function() {
                if (!this.classList.contains('active')) {
                    this.style.background = 'rgba(255,255,255,0.05)';
                }
            });
            btn.addEventListener('mouseleave', function() {
                if (!this.classList.contains('active')) {
                    this.style.background = 'transparent';
                }
            });
        });
        
        // Initialize first sidebar item as active
        const firstSidebarItem = sidebar.querySelector('.sidebar-item');
        if (firstSidebarItem) {
            firstSidebarItem.style.background = 'rgba(255,255,255,0.1)';
            firstSidebarItem.style.borderLeftColor = '#3498db';
        }
        
        console.log('[Dashboard] ✅ Dashboard HTML structure with sidebar created successfully');
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
        // Try new container first, fallback to legacy
        const domainsContainer = document.getElementById('domains-table-container');
        const subscriptionsContainer = document.getElementById('subscriptions-accordion-container');
        const sitesContainer = document.getElementById('sites-container');
        
        const loadingContainer = domainsContainer || sitesContainer;
        if (!loadingContainer) {
            console.error('[Dashboard] Dashboard containers not found');
            return;
        }
        
        // Validate email before making API call
        if (!userEmail || !userEmail.includes('@')) {
            console.error('[Dashboard] ❌ Invalid email for API call:', userEmail);
            if (loadingContainer) {
                loadingContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">Invalid email address. Please log out and log in again.</div>';
            }
            return;
        }
        
        // Show loading state
        if (domainsContainer) {
            domainsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading domains...</div>';
        }
        if (subscriptionsContainer) {
            subscriptionsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading subscriptions...</div>';
        }
        if (sitesContainer) {
            sitesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading sites...</div>';
        }
        
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
            console.log('[Dashboard] 📊 Subscriptions count:', Object.keys(data.subscriptions || {}).length);
            console.log('[Dashboard] 📋 Sites object:', data.sites);
            console.log('[Dashboard] 📋 Subscriptions object:', data.subscriptions);
            
            // Check if sites exist but are empty
            if (data.sites && Object.keys(data.sites).length === 0) {
                console.warn('[Dashboard] ⚠️ Sites object exists but is empty!');
                console.warn('[Dashboard] ⚠️ This might mean sites were filtered out or not stored correctly');
            }
            
            // Display sites/domains
            displaySites(data.sites || {});
            
            // Display subscriptions
            displaySubscriptions(data.subscriptions || {}, data.sites || {});
        } catch (error) {
            console.error('[Dashboard] ❌ Error loading dashboard:', error);
            console.error('[Dashboard] Error details:', error.message);
            const errorMsg = `<div style="text-align: center; padding: 40px; color: #f44336;">
                <p>Failed to load dashboard data.</p>
                <p style="font-size: 12px; margin-top: 10px;">Error: ${error.message}</p>
                <p style="font-size: 12px;">Email used: ${userEmail}</p>
                <p style="font-size: 12px;">Please refresh the page or contact support.</p>
            </div>`;
            
            if (domainsContainer) domainsContainer.innerHTML = errorMsg;
            if (subscriptionsContainer) subscriptionsContainer.innerHTML = errorMsg;
            if (sitesContainer) sitesContainer.innerHTML = errorMsg;
        }
    }
    
    // Display sites in table format
    function displaySites(sites) {
        const container = document.getElementById('domains-table-container');
        if (!container) {
            // Fallback to legacy container
            const legacyContainer = document.getElementById('sites-container');
            if (legacyContainer) {
                container = legacyContainer;
            } else {
                return;
            }
        }
        
        if (Object.keys(sites).length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🌐</div>
                    <p style="font-size: 18px; margin-bottom: 10px; color: #666;">No domains/sites yet</p>
                    <p style="font-size: 14px; color: #999;">Add your first site from the Subscriptions section</p>
                </div>
            `;
            return;
        }
        
        // Create table
        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8f9fa; border-bottom: 2px solid #e0e0e0;">
                        <th style="padding: 15px; text-align: left; font-weight: 600; color: #333;">Domain/Site</th>
                        <th style="padding: 15px; text-align: left; font-weight: 600; color: #333;">Status</th>
                        <th style="padding: 15px; text-align: left; font-weight: 600; color: #333;">Item ID</th>
                        <th style="padding: 15px; text-align: left; font-weight: 600; color: #333;">Created</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600; color: #333;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(sites).map(site => {
                        const siteData = sites[site];
                        const isActive = siteData.status === 'active';
                        const statusColor = isActive ? '#4caf50' : '#f44336';
                        const statusBg = isActive ? '#e8f5e9' : '#ffebee';
                        
                        return `
                            <tr style="border-bottom: 1px solid #e0e0e0; transition: background 0.2s;" 
                                onmouseover="this.style.background='#f8f9fa'" 
                                onmouseout="this.style.background='white'">
                                <td style="padding: 15px; font-weight: 500; color: #333;">${site}</td>
                                <td style="padding: 15px;">
                                    <span style="
                                        padding: 6px 12px;
                                        border-radius: 20px;
                                        font-size: 12px;
                                        font-weight: 600;
                                        text-transform: uppercase;
                                        background: ${statusBg};
                                        color: ${statusColor};
                                        display: inline-block;
                                    ">${siteData.status || 'active'}</span>
                                </td>
                                <td style="padding: 15px; color: #666; font-size: 13px; font-family: monospace;">
                                    ${siteData.item_id ? siteData.item_id.substring(0, 20) + '...' : 'N/A'}
                                </td>
                                <td style="padding: 15px; color: #666; font-size: 13px;">
                                    ${siteData.created_at ? new Date(siteData.created_at * 1000).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style="padding: 15px; text-align: center;">
                                    ${isActive ? `
                                        <button class="remove-site-button" data-site="${site}" style="
                                            padding: 8px 16px;
                                            background: #f44336;
                                            color: white;
                                            border: none;
                                            border-radius: 6px;
                                            cursor: pointer;
                                            font-size: 13px;
                                            font-weight: 600;
                                            transition: all 0.3s;
                                        " onmouseover="this.style.background='#d32f2f'; this.style.transform='scale(1.05)'" 
                                           onmouseout="this.style.background='#f44336'; this.style.transform='scale(1)'">
                                            Delete
                                        </button>
                                    ` : '<span style="color: #999; font-size: 12px;">Removed</span>'}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        // Attach event listeners to remove buttons
        container.querySelectorAll('.remove-site-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const site = btn.getAttribute('data-site');
                removeSite(site);
            });
        });
    }
    
    // Display subscriptions in accordion format
    function displaySubscriptions(subscriptions, allSites) {
        const container = document.getElementById('subscriptions-accordion-container');
        if (!container) return;
        
        console.log('[Dashboard] displaySubscriptions called with:', {
            subscriptionsCount: subscriptions ? Object.keys(subscriptions).length : 0,
            subscriptions: subscriptions,
            allSitesCount: allSites ? Object.keys(allSites).length : 0,
            allSites: allSites
        });
        
        if (Object.keys(subscriptions).length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 20px;">💳</div>
                    <p style="font-size: 18px; margin-bottom: 10px; color: #666;">No subscriptions yet</p>
                    <p style="font-size: 14px; color: #999;">Create a subscription to get started</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = Object.keys(subscriptions).map((subId, index) => {
            const sub = subscriptions[subId];
            const isExpanded = index === 0; // First subscription expanded by default
            
            // Determine if monthly or yearly (check price interval)
            // This would need to be fetched from Stripe or stored in subscription data
            const billingPeriod = 'monthly'; // Placeholder - should be determined from price data
            
            // Get sites for this subscription
            const subscriptionSites = Object.keys(allSites).filter(site => 
                allSites[site].subscription_id === subId
            );
            
            return `
                <div class="subscription-accordion" data-subscription-id="${subId}" style="
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    overflow: hidden;
                    background: white;
                ">
                    <div class="subscription-header" style="
                        padding: 20px;
                        background: ${isExpanded ? '#f8f9fa' : 'white'};
                        cursor: pointer;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='${isExpanded ? '#f8f9fa' : 'white'}'">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 8px;">
                                <h3 style="margin: 0; color: #333; font-size: 18px;">Subscription ${index + 1}</h3>
                                <span style="
                                    padding: 4px 12px;
                                    border-radius: 20px;
                                    font-size: 11px;
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    background: ${sub.status === 'active' ? '#e8f5e9' : '#ffebee'};
                                    color: ${sub.status === 'active' ? '#4caf50' : '#f44336'};
                                ">${sub.status || 'active'}</span>
                                <span style="
                                    padding: 4px 12px;
                                    border-radius: 20px;
                                    font-size: 11px;
                                    font-weight: 600;
                                    background: #e3f2fd;
                                    color: #1976d2;
                                ">${billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'}</span>
                            </div>
                            <div style="font-size: 13px; color: #666;">
                                <div>Customer ID: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${sub.customerId || 'N/A'}</code></div>
                                <div style="margin-top: 5px;">Subscription ID: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${subId.substring(0, 20)}...</code></div>
                                <div style="margin-top: 5px;">Sites: ${sub.sitesCount || subscriptionSites.length}</div>
                            </div>
                        </div>
                        <div style="
                            font-size: 24px;
                            color: #666;
                            transition: transform 0.3s;
                            transform: ${isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
                        ">▼</div>
                    </div>
                    <div class="subscription-content" style="
                        display: ${isExpanded ? 'block' : 'none'};
                        padding: 0;
                        border-top: 1px solid #e0e0e0;
                    ">
                        <div style="padding: 20px;">
                            <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">Sites in this subscription:</h4>
                            <div id="subscription-sites-${subId}" style="margin-bottom: 20px;">
                                ${subscriptionSites.length > 0 ? `
                                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                                        <thead>
                                            <tr style="background: #f8f9fa; border-bottom: 1px solid #e0e0e0;">
                                                <th style="padding: 10px; text-align: left; font-size: 12px; color: #666;">Site</th>
                                                <th style="padding: 10px; text-align: left; font-size: 12px; color: #666;">Status</th>
                                                <th style="padding: 10px; text-align: left; font-size: 12px; color: #666;">License</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${subscriptionSites.map(site => {
                                                const siteData = allSites[site];
                                                const license = siteData.license;
                                                return `
                                                    <tr style="border-bottom: 1px solid #f0f0f0;">
                                                        <td style="padding: 10px; font-size: 13px;">${site}</td>
                                                        <td style="padding: 10px;">
                                                            <span style="
                                                                padding: 4px 8px;
                                                                border-radius: 12px;
                                                                font-size: 11px;
                                                                background: ${siteData.status === 'active' ? '#e8f5e9' : '#ffebee'};
                                                                color: ${siteData.status === 'active' ? '#4caf50' : '#f44336'};
                                                            ">${siteData.status}</span>
                                                        </td>
                                                        <td style="padding: 10px; font-size: 12px; font-family: monospace; color: #666;">
                                                            ${license ? license.license_key.substring(0, 20) + '...' : 'N/A'}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                ` : '<p style="color: #999; font-size: 14px; margin-bottom: 20px;">No sites in this subscription yet.</p>'}
                            </div>
                            
                            <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin-top: 20px;">
                                <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">Add Sites to This Subscription</h4>
                                
                                <!-- Pending Sites List -->
                                <div id="pending-sites-${subId}" style="margin-bottom: 20px;">
                                    <!-- Pending sites will be dynamically added here -->
                                </div>
                                
                                <!-- Add Site Input -->
                                <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                                    <input 
                                        type="text" 
                                        id="new-site-input-${subId}" 
                                        placeholder="Enter site domain (e.g., example.com)"
                                        style="
                                            flex: 1;
                                            min-width: 250px;
                                            padding: 12px;
                                            border: 2px solid #e0e0e0;
                                            border-radius: 6px;
                                            font-size: 14px;
                                        "
                                    />
                                    <button class="add-to-pending" data-subscription-id="${subId}" style="
                                        padding: 12px 24px;
                                        background: #667eea;
                                        color: white;
                                        border: none;
                                        border-radius: 6px;
                                        font-size: 14px;
                                        font-weight: 600;
                                        cursor: pointer;
                                        transition: background 0.3s;
                                    " onmouseover="this.style.background='#5568d3'" onmouseout="this.style.background='#667eea'">
                                        Add to List
                                    </button>
                                </div>
                                
                                <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">
                                    💡 Add multiple sites, then click "Pay Now" to checkout. Price will be automatically determined.
                                </p>
                                
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-top: 10px;">
                                    <input type="checkbox" id="one-time-payment-${subId}" style="cursor: pointer;">
                                    <span style="font-size: 14px; color: #666;">One-time payment (add sites immediately without subscription)</span>
                                </label>
                                
                                <!-- Pay Now Button (hidden until at least one site is added) -->
                                <div id="pay-now-container-${subId}" style="display: none; margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                                    <button class="pay-now-button" data-subscription-id="${subId}" style="
                                        width: 100%;
                                        padding: 14px 28px;
                                        background: #4caf50;
                                        color: white;
                                        border: none;
                                        border-radius: 6px;
                                        font-size: 16px;
                                        font-weight: 600;
                                        cursor: pointer;
                                        transition: background 0.3s;
                                    " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4caf50'">
                                        💳 Pay Now (<span id="pending-count-${subId}">0</span> site<span id="pending-plural-${subId}">s</span>)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add accordion toggle functionality
        container.querySelectorAll('.subscription-header').forEach(header => {
            header.addEventListener('click', function() {
                const accordion = this.closest('.subscription-accordion');
                const content = accordion.querySelector('.subscription-content');
                const arrow = this.querySelector('div:last-child');
                const isExpanded = content.style.display !== 'none';
                
                // Close all other accordions
                container.querySelectorAll('.subscription-content').forEach(c => {
                    if (c !== content) {
                        c.style.display = 'none';
                        c.previousElementSibling.style.background = 'white';
                        c.previousElementSibling.querySelector('div:last-child').style.transform = 'rotate(0deg)';
                    }
                });
                
                // Toggle current accordion
                if (isExpanded) {
                    content.style.display = 'none';
                    this.style.background = 'white';
                    arrow.style.transform = 'rotate(0deg)';
                } else {
                    content.style.display = 'block';
                    this.style.background = '#f8f9fa';
                    arrow.style.transform = 'rotate(180deg)';
                }
            });
        });
        
        // Initialize pending sites storage for each subscription
        const pendingSitesBySubscription = {};
        Object.keys(subscriptions).forEach(subId => {
            pendingSitesBySubscription[subId] = [];
        });
        
        // Function to update pending sites display
        function updatePendingSitesDisplay(subscriptionId) {
            const pendingContainer = document.getElementById(`pending-sites-${subscriptionId}`);
            const payNowContainer = document.getElementById(`pay-now-container-${subscriptionId}`);
            const pendingCount = document.getElementById(`pending-count-${subscriptionId}`);
            const pendingPlural = document.getElementById(`pending-plural-${subscriptionId}`);
            
            if (!pendingContainer) return;
            
            const pendingSites = pendingSitesBySubscription[subscriptionId] || [];
            
            if (pendingSites.length === 0) {
                pendingContainer.innerHTML = '';
                if (payNowContainer) payNowContainer.style.display = 'none';
            } else {
                pendingContainer.innerHTML = `
                    <div style="margin-bottom: 15px;">
                        <h5 style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: 600;">Pending Sites (${pendingSites.length}):</h5>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${pendingSites.map((site, idx) => `
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    justify-content: space-between;
                                    padding: 10px 15px;
                                    background: white;
                                    border: 1px solid #e0e0e0;
                                    border-radius: 6px;
                                ">
                                    <span style="font-size: 14px; color: #333;">${site}</span>
                                    <button 
                                        class="remove-pending-site" 
                                        data-subscription-id="${subscriptionId}" 
                                        data-site-index="${idx}"
                                        style="
                                            padding: 6px 12px;
                                            background: #f44336;
                                            color: white;
                                            border: none;
                                            border-radius: 4px;
                                            font-size: 12px;
                                            font-weight: 600;
                                            cursor: pointer;
                                            transition: background 0.3s;
                                        " 
                                        onmouseover="this.style.background='#d32f2f'" 
                                        onmouseout="this.style.background='#f44336'">
                                        Remove
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                
                if (payNowContainer) {
                    payNowContainer.style.display = 'block';
                    if (pendingCount) pendingCount.textContent = pendingSites.length;
                    if (pendingPlural) pendingPlural.textContent = pendingSites.length === 1 ? '' : 's';
                }
            }
        }
        
        // Add event listeners for "Add to List" buttons (adds to pending list)
        container.querySelectorAll('.add-to-pending').forEach(btn => {
            btn.addEventListener('click', function() {
                const subscriptionId = this.getAttribute('data-subscription-id');
                const siteInput = document.getElementById(`new-site-input-${subscriptionId}`);
                
                if (!siteInput) return;
                
                const site = siteInput.value.trim();
                
                if (!site) {
                    showError('Please enter a site domain');
                    return;
                }
                
                // Check if site already in pending list
                const pendingSites = pendingSitesBySubscription[subscriptionId] || [];
                if (pendingSites.includes(site)) {
                    showError('This site is already in the pending list');
                    return;
                }
                
                // Add to pending list
                pendingSites.push(site);
                pendingSitesBySubscription[subscriptionId] = pendingSites;
                
                // Clear input
                siteInput.value = '';
                
                // Update display
                updatePendingSitesDisplay(subscriptionId);
                
                // Add new input field
                const inputContainer = siteInput.parentElement;
                const newInput = siteInput.cloneNode(true);
                newInput.value = '';
                newInput.id = `new-site-input-${subscriptionId}`;
                siteInput.parentElement.insertBefore(newInput, siteInput);
                siteInput.remove();
                
                showSuccess(`Site "${site}" added to pending list`);
            });
        });
        
        // Add event listeners for remove pending site buttons
        container.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-pending-site')) {
                const subscriptionId = e.target.getAttribute('data-subscription-id');
                const siteIndex = parseInt(e.target.getAttribute('data-site-index'));
                const pendingSites = pendingSitesBySubscription[subscriptionId] || [];
                
                if (siteIndex >= 0 && siteIndex < pendingSites.length) {
                    const removedSite = pendingSites[siteIndex];
                    pendingSites.splice(siteIndex, 1);
                    pendingSitesBySubscription[subscriptionId] = pendingSites;
                    updatePendingSitesDisplay(subscriptionId);
                    showSuccess(`Site "${removedSite}" removed from pending list`);
                }
            }
        });
        
        // Add event listeners for "Pay Now" buttons
        container.querySelectorAll('.pay-now-button').forEach(btn => {
            btn.addEventListener('click', async function() {
                const subscriptionId = this.getAttribute('data-subscription-id');
                const pendingSites = pendingSitesBySubscription[subscriptionId] || [];
                const oneTimePaymentCheckbox = document.getElementById(`one-time-payment-${subscriptionId}`);
                const oneTimePayment = oneTimePaymentCheckbox ? oneTimePaymentCheckbox.checked : false;
                
                if (pendingSites.length === 0) {
                    showError('No sites to add. Please add at least one site.');
                    return;
                }
                
                const member = await checkMemberstackSession();
                if (!member) {
                    showError('Not authenticated');
                    return;
                }
                
                const userEmail = member.email || member._email;
                
                // Disable button during processing
                this.disabled = true;
                this.textContent = 'Processing...';
                
                try {
                    // Add all pending sites (batch)
                    const response = await fetch(`${API_BASE}/add-sites-batch`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({ 
                            sites: pendingSites,
                            email: userEmail,
                            subscriptionId: subscriptionId,
                            oneTimePayment: oneTimePayment
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.error || data.message || 'Failed to add sites');
                    }
                    
                    showSuccess(data.message || `Successfully added ${pendingSites.length} site(s)!`);
                    
                    // Clear pending list
                    pendingSitesBySubscription[subscriptionId] = [];
                    updatePendingSitesDisplay(subscriptionId);
                    
                    if (oneTimePaymentCheckbox) {
                        oneTimePaymentCheckbox.checked = false;
                    }
                    
                    // Reload dashboard
                    loadDashboard(userEmail);
                } catch (error) {
                    console.error('[Dashboard] Error adding sites:', error);
                    showError('Failed to add sites: ' + error.message);
                    this.disabled = false;
                    this.textContent = `💳 Pay Now (${pendingSites.length} site${pendingSites.length === 1 ? '' : 's'})`;
                }
            });
        });
        
        // Initialize pending sites display for all subscriptions
        Object.keys(subscriptions).forEach(subId => {
            updatePendingSitesDisplay(subId);
        });
    }
    
    // Add a new site
    async function addSite(userEmail) {
        const siteInput = document.getElementById('new-site-input');
        
        if (!siteInput) {
            showError('Form element not found');
            return;
        }
        
        const site = siteInput.value.trim();
        
        if (!site) {
            showError('Please enter a site domain');
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
                    email: userEmail 
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to add site');
            }
            
            showSuccess(data.message || 'Site added successfully! Billing will be updated on next invoice.');
            siteInput.value = '';
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
        
        console.log('[Dashboard] ========================================');
        console.log('[Dashboard] 🔄 Toggle visibility - isLoggedIn:', isLoggedIn);
        console.log('[Dashboard] ========================================');
        
        if (dashboardContainer) {
            dashboardContainer.style.display = isLoggedIn ? 'block' : 'none';
            console.log('[Dashboard] ✅ Dashboard container found');
            console.log('[Dashboard] Dashboard container display set to:', dashboardContainer.style.display);
            console.log('[Dashboard] Dashboard container computed display:', window.getComputedStyle(dashboardContainer).display);
        } else {
            console.error('[Dashboard] ❌ Dashboard container NOT found!');
            console.error('[Dashboard] This means createDashboardHTML() may have failed');
        }
        
        if (loginPrompt) {
            loginPrompt.style.display = isLoggedIn ? 'none' : 'block';
            console.log('[Dashboard] ✅ Login prompt found');
            console.log('[Dashboard] Login prompt display set to:', loginPrompt.style.display);
        } else {
            console.warn('[Dashboard] ⚠️ Login prompt NOT found (this is okay if not needed)');
        }
        
        console.log('[Dashboard] ========================================');
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
        try {
            createDashboardHTML();
            console.log('[Dashboard] ✅ Dashboard HTML created');
        } catch (error) {
            console.error('[Dashboard] ❌ Error creating dashboard HTML:', error);
            showError('Failed to create dashboard. Please refresh the page.');
            return;
        }
        
        // Show dashboard by default (will hide if not logged in)
        // Don't hide immediately - wait for session check
        const dashboardContainer = document.getElementById('dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.style.display = 'block';
            console.log('[Dashboard] ✅ Dashboard container set to visible (default)');
        } else {
            console.error('[Dashboard] ❌ Dashboard container not found after creation!');
        }
        
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
            
            // Only hide dashboard if we're sure user is not logged in
            toggleDashboardVisibility(false);
            
            // Show a message to user
            const dashboardContainerCheck = document.getElementById('dashboard-container');
            if (dashboardContainerCheck) {
                // Keep container visible but show login prompt
                const loginPrompt = document.getElementById('login-prompt');
                if (loginPrompt) {
                    loginPrompt.style.display = 'block';
                }
            }
            return;
        }
        
        // User is logged in - ensure dashboard is visible
        console.log('[Dashboard] ========================================');
        console.log('[Dashboard] ✅✅✅ USER IS LOGGED IN - SHOWING DASHBOARD ✅✅✅');
        console.log('[Dashboard] ========================================');
        
        // Extract email from member object (check multiple locations)
        let userEmail = member.normalizedEmail || 
                       member.email || 
                       member._email ||
                       (member.data && (member.data.email || member.data.auth?.email)) ||
                       '';
        
        // Normalize email
        if (userEmail) {
            userEmail = userEmail.toString().toLowerCase().trim();
        }
        
        if (!userEmail) {
            console.error('[Dashboard] ❌ No email found in member object!');
            console.error('[Dashboard] Member object structure:', JSON.stringify(member, null, 2));
            showError('Unable to retrieve user email. Please log out and log in again.');
            // Still show dashboard but with error
            const dashboardContainerError = document.getElementById('dashboard-container');
            if (dashboardContainerError) {
                dashboardContainerError.style.display = 'block';
                dashboardContainerError.style.visibility = 'visible';
            }
            return;
        }
        
        // Validate email format one more time
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            console.error('[Dashboard] ❌ Invalid email format:', userEmail);
            showError('Invalid email format. Please contact support.');
            // Still show dashboard but with error
            const dashboardContainerInvalid = document.getElementById('dashboard-container');
            if (dashboardContainerInvalid) {
                dashboardContainerInvalid.style.display = 'block';
                dashboardContainerInvalid.style.visibility = 'visible';
            }
            return;
        }
        
        console.log('[Dashboard] ✅ User logged in');
        console.log('[Dashboard] 📧 Logged in email (verified):', userEmail);
        console.log('[Dashboard] 👤 Member ID:', member.id || member._id || 'N/A (using email only)');
        console.log('[Dashboard] 🔍 Email will be used to fetch data from database/Stripe');
        console.log('[Dashboard] ========================================');
        
        // FIRST: Force dashboard to be visible immediately
        toggleDashboardVisibility(true);
        
        // Double-check and force visibility
        const dashboardContainerForce = document.getElementById('dashboard-container');
        if (dashboardContainerForce) {
            dashboardContainerForce.style.display = 'block';
            dashboardContainerForce.style.visibility = 'visible';
            dashboardContainerForce.style.opacity = '1';
            console.log('[Dashboard] ✅ Dashboard container forced to visible');
        } else {
            console.error('[Dashboard] ❌ Dashboard container not found after login!');
        }
        
        // Hide login prompt if it exists
        const loginPrompt = document.getElementById('login-prompt');
        if (loginPrompt) {
            loginPrompt.style.display = 'none';
            console.log('[Dashboard] ✅ Login prompt hidden');
        }
        
        // Load dashboard data
        console.log('[Dashboard] 🔄 Loading dashboard data for email:', userEmail);
        console.log('[Dashboard] 🔗 API endpoint:', `${API_BASE}/dashboard?email=${encodeURIComponent(userEmail)}`);
        
        try {
            await Promise.all([
                loadDashboard(userEmail),
                loadLicenses(userEmail)
            ]);
            console.log('[Dashboard] ✅ Dashboard data loaded successfully');
        } catch (error) {
            console.error('[Dashboard] ❌ Error loading dashboard data:', error);
            showError('Failed to load dashboard data. Please refresh the page.');
        }
        
        // Attach event listeners
        // Legacy add-site button (if exists - for backward compatibility)
        const addSiteButton = document.getElementById('add-site-button');
        if (addSiteButton) {
            addSiteButton.addEventListener('click', () => addSite(userEmail));
        }
        
        // Logout button
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', logout);
        }
        
        // Allow Enter key in legacy add site form (if exists)
        const siteInput = document.getElementById('new-site-input');
        if (siteInput && addSiteButton) {
            siteInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addSiteButton.click();
                }
            });
        }
        
        // Allow Enter key in subscription add-site forms (added dynamically)
        setTimeout(() => {
            document.querySelectorAll('[id^="new-site-input-"]').forEach(input => {
                input.addEventListener('keypress', async (e) => {
                    if (e.key === 'Enter') {
                        const subscriptionId = input.id.replace('new-site-input-', '');
                        const addButton = document.querySelector(`[data-subscription-id="${subscriptionId}"].add-site-to-subscription`);
                        if (addButton) {
                            addButton.click();
                        }
                    }
                });
            });
        }, 1000);
        
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
