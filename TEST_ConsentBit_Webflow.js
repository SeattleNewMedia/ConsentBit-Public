(function () {
  // --- Initialize Google Consent v2 FIRST (before any Google scripts load) ---
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  
  // Set default consent to 'denied' for all Google services
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_personalization': 'denied',
    'ad_user_data': 'denied',
    'personalization_storage': 'denied',
    'functionality_storage': 'granted',
    'security_storage': 'granted'
  });

  // --- Hardcoded Encryption Keys (matching server) ---
  const ENCRYPTION_KEY = "t95w6oAeL1hr0rrtCGKok/3GFNwxzfLxiWTETfZurpI="; // Base64 encoded 256-bit key
  const ENCRYPTION_IV = "yVSYDuWajEid8kDz"; // Base64 encoded 128-bit IV

  // --- Helper functions ---
  function setConsentCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = "; expires=" + date.toUTCString();
    }
    let cookieString = name + "=" + value + expires + "; path=/; SameSite=Lax";
    if (location.protocol === 'https:') {
      cookieString += "; Secure";
    }
    document.cookie = cookieString;
  }
  function getConsentCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
  
  // Helper function to detect Google scripts (by src or inline content)
  function isGoogleScript(script) {
    if (!script) return false;
    
    // Check src attribute
    if (script.src) {
      var src = script.src.toLowerCase();
      if (src.includes('googletagmanager.com') ||
          src.includes('google-analytics.com') ||
          src.includes('googleapis.com') ||
          src.includes('gstatic.com') ||
          src.includes('gtag') ||
          src.includes('analytics.js') ||
          src.includes('ga.js') ||
          src.includes('google.com/recaptcha') ||
          src.includes('maps.googleapis.com')) {
        return true;
      }
    }
    
    // Check inline content for Google scripts
    if (script.innerHTML) {
      var content = script.innerHTML.toLowerCase();
      if (content.includes('googletagmanager') ||
          content.includes('google-analytics') ||
          content.includes('gtag') ||
          content.includes('dataLayer') ||
          content.includes('googleapis') ||
          content.includes('grecaptcha')) {
        return true;
      }
    }
    
    // Check id attribute
    if (script.id) {
      var id = script.id.toLowerCase();
      if (id.includes('google') || id.includes('gtag') || id.includes('ga')) {
        return true;
      }
    }
    
    return false;
  }
  
  // Function to unblock Google scripts and remove blocking attributes
  function unblockGoogleScripts() {
    var allScripts = document.head.querySelectorAll('script');
    allScripts.forEach(function(script) {
      if (isGoogleScript(script)) {
        // Remove type attribute completely (don't set to text/javascript)
        script.removeAttribute('type');
        // Remove data-category attribute
        if (script.hasAttribute('data-category')) {
          script.removeAttribute('data-category');
        }
        // Remove blocking attributes
        script.removeAttribute('data-blocked-by-consent');
        script.removeAttribute('data-blocked-by-ccpa');
      }
    });
  }
  
  function blockScriptsByCategory() {
    // First, unblock all Google scripts and remove their blocking attributes
    unblockGoogleScripts();
    
    // Only block scripts with data-category attribute (except Google scripts and essential/necessary)
    var scripts = document.head.querySelectorAll('script[data-category]');
    scripts.forEach(function(script) {
      // CRITICAL: Never block Google scripts - skip them completely
      if (isGoogleScript(script)) {
        // Ensure Google scripts are unblocked and have no data-category
        // Remove type attribute completely (don't set to text/javascript)
        script.removeAttribute('type');
        if (script.hasAttribute('data-category')) {
          script.removeAttribute('data-category');
        }
        script.removeAttribute('data-blocked-by-consent');
        script.removeAttribute('data-blocked-by-ccpa');
        return; // Exit early for Google scripts
      }
      
      var category = script.getAttribute('data-category');
      if (category && script.type !== 'text/plain') {
        // Handle comma-separated categories
        var categories = category.split(',').map(function(cat) { return cat.trim(); });
        
        // Check if ANY category is necessary or essential (these should never be blocked)
        var hasEssentialCategory = categories.some(function(cat) { 
          var lowercaseCat = cat.toLowerCase();
          return lowercaseCat === 'necessary' || lowercaseCat === 'essential'; 
        });
        
        // Only block if NO categories are essential/necessary
        if (!hasEssentialCategory) {
          // Block non-essential scripts with data-category by changing type
          script.type = 'text/plain';
          script.setAttribute('data-blocked-by-consent', 'true');
        }
      }
    });
    
    // DO NOT block scripts without data-category - they are functionality scripts (YouTube, Maps, etc.)
    // Scripts without data-category are always allowed to run
  }
  function enableAllScriptsWithDataCategory() {
    // First, unblock all Google scripts (they should never be blocked)
    unblockGoogleScripts();
    
    // Enable ALL scripts with data-category attribute (regardless of category value) only in head section
    var scripts = document.head.querySelectorAll('script[type="text/plain"][data-category]');
    scripts.forEach(function(oldScript) {
      // Skip Google scripts - they're already unblocked above
      if (isGoogleScript(oldScript)) {
        return;
      }
      
      var newScript = document.createElement('script');
      for (var i = 0; i < oldScript.attributes.length; i++) {
        var attr = oldScript.attributes[i];
        if (attr.name === 'type') {
          newScript.type = 'text/javascript';
        } else if (attr.name !== 'data-blocked-by-consent' && attr.name !== 'data-blocked-by-ccpa') {
          newScript.setAttribute(attr.name, attr.value);
        }
      }
      if (oldScript.innerHTML) {
        newScript.innerHTML = oldScript.innerHTML;
      }
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }
  function enableScriptsByCategories(allowedCategories) {
    // Enable scripts based on categories (including Google scripts) only in head section
    var scripts = document.head.querySelectorAll('script[type="text/plain"][data-category]');
    scripts.forEach(function(oldScript) {
      var category = oldScript.getAttribute('data-category');
      if (category) {
        var categories = category.split(',').map(function(cat) { return cat.trim(); });
        var shouldEnable = categories.some(function(cat) { 
          return allowedCategories.includes(cat); 
        });
        if (shouldEnable) {
          var newScript = document.createElement('script');
          for (var i = 0; i < oldScript.attributes.length; i++) {
            var attr = oldScript.attributes[i];
            if (attr.name === 'type') {
              newScript.type = 'text/javascript';
            } else if (attr.name !== 'data-blocked-by-consent' && attr.name !== 'data-blocked-by-ccpa') {
              newScript.setAttribute(attr.name, attr.value);
            }
          }
          if (oldScript.innerHTML) {
            newScript.innerHTML = oldScript.innerHTML;
          }
          oldScript.parentNode.replaceChild(newScript, oldScript);
        }
      }
    });
  }
  function updateGtagConsent(preferences) {
    if (typeof gtag === "function") {
      gtag('consent', 'update', {
        'analytics_storage': preferences.Analytics ? 'granted' : 'denied',
        'functionality_storage': 'granted',
        'ad_storage': preferences.Marketing ? 'granted' : 'denied',
        'ad_personalization': preferences.Marketing ? 'granted' : 'denied',
        'ad_user_data': preferences.Marketing ? 'granted' : 'denied',
        'personalization_storage': preferences.Personalization ? 'granted' : 'denied',
        'security_storage': 'granted'
      });
    }
    
    // Push consent update event to dataLayer
    if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push({
        'event': 'consent_update',
        'consent_analytics': preferences.Analytics,
        'consent_marketing': preferences.Marketing,
        'consent_personalization': preferences.Personalization
      });
    }
  }
  function setConsentState(preferences, cookieDays) {
    ['Analytics', 'Marketing', 'Personalization'].forEach(function(category) {
      setConsentCookie(
        'cb-consent-' + category.toLowerCase() + '_storage',
        preferences[category] ? 'true' : 'false',
        cookieDays || 365
      );
    });
    
    // Save CCPA "do-not-share" preference if it exists
    if (preferences.hasOwnProperty('donotshare')) {
      setConsentCookie(
        'cb-consent-donotshare',
        preferences.donotshare ? 'true' : 'false',
        cookieDays || 365
      );
    }
    
    updateGtagConsent(preferences);
    const expiresAt = Date.now() + (cookieDays * 24 * 60 * 60 * 1000);
    localStorage.setItem('_cb_cea_', expiresAt.toString());
    localStorage.setItem('_cb_ced_', cookieDays.toString());
  }
  function getConsentPreferences() {
    return {
      Analytics: getConsentCookie('cb-consent-analytics_storage') === 'true',
      Marketing: getConsentCookie('cb-consent-marketing_storage') === 'true',
      Personalization: getConsentCookie('cb-consent-personalization_storage') === 'true',
      donotshare: getConsentCookie('cb-consent-donotshare') === 'true'
    };
  }
  function showBanner(banner) {
    if (banner) {
      banner.style.setProperty("display", "block", "important");
      banner.style.setProperty("visibility", "visible", "important");
      banner.style.setProperty("opacity", "1", "important");
      banner.classList.add("show-banner");
      banner.classList.remove("hidden");
    }
  }
  function hideBanner(banner) {
    if (banner) {
      banner.style.setProperty("display", "none", "important");
      banner.style.setProperty("visibility", "hidden", "important");
      banner.style.setProperty("opacity", "0", "important");
      banner.classList.remove("show-banner");
      banner.classList.add("hidden");
    }
  }
async  function hideAllBanners(){
    hideBanner(document.getElementById("consent-banner"));
    hideBanner(document.getElementById("initial-consent-banner"));
    hideBanner(document.getElementById("main-banner"));
    hideBanner(document.getElementById("main-consent-banner"));
    hideBanner(document.getElementById("simple-consent-banner"));
  }
  function showAllBanners(){
    showBanner(document.getElementById("consent-banner"));
    showBanner(document.getElementById("initial-consent-banner"));
    showBanner(document.getElementById("main-banner"));
    showBanner(document.getElementById("main-consent-banner"));
    showBanner(document.getElementById("simple-consent-banner"));
  }

  // --- Encryption Helper Functions ---
  function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function uint8ArrayToBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
  }

  async function importHardcodedKey() {
    const keyBytes = base64ToUint8Array(ENCRYPTION_KEY);
    return crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptWithHardcodedKey(data) {
    try {
      const key = await importHardcodedKey();
      const iv = base64ToUint8Array(ENCRYPTION_IV);
      const encoder = new TextEncoder();
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(data)
      );
      return uint8ArrayToBase64(new Uint8Array(encryptedBuffer));
    } catch (error) {
      throw error;
    }
  }

  // --- Advanced: Visitor session token generation ---
  function isTokenExpired(token) {
    if (!token) return true;
    const [payloadBase64] = token.split('.');
    if (!payloadBase64) return true;
    try {
      const payload = JSON.parse(atob(payloadBase64));
      if (!payload.exp) return true;
      return payload.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }
  async function getOrCreateVisitorId() {
    let visitorId = localStorage.getItem('_cb_vid_');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('_cb_vid_', visitorId);
    }
    return visitorId;
  }
  async function cleanHostname(hostname) {
    let cleaned = hostname.replace(/^www\./, '');
    cleaned = cleaned.split('.')[0];
    return cleaned;
  }
  
  // Add session cleanup function
  function clearVisitorSession() {
    localStorage.removeItem('_cb_vid_');
    localStorage.removeItem('_cb_vst_');
    localStorage.removeItem('_cb_cg_');
    localStorage.removeItem('_cb_cea_');
    localStorage.removeItem('_cb_ced_');
    localStorage.removeItem('_cb_rtc_');
  }
  
  // Add flag to prevent concurrent token requests
  let tokenRequestInProgress = false;
  
  async function getVisitorSessionToken() {
    try {
      const retryCount = parseInt(localStorage.getItem('_cb_rtc_') || '0', 10);
      if (retryCount >= 5) {
        return null;
      }

      if (tokenRequestInProgress) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const existingToken = localStorage.getItem('_cb_vst_');
        if (existingToken && !isTokenExpired(existingToken)) {
          localStorage.removeItem('_cb_rtc_');
          return existingToken;
        }
      }
      
      const existingToken = localStorage.getItem('_cb_vst_');
      if (existingToken && !isTokenExpired(existingToken)) {
        localStorage.removeItem('_cb_rtc_');
        return existingToken;
      }
      
      // Set flag to prevent concurrent requests
      tokenRequestInProgress = true;
      
      localStorage.setItem('_cb_rtc_', (retryCount + 1).toString());
    
      const visitorId = await getOrCreateVisitorId();
      const siteName = await cleanHostname(window.location.hostname);
      const response = await fetch('https://consentbit-test-server.web-8fb.workers.dev/api/visitor-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visitorId: visitorId,
          // userAgent: navigator.userAgent, // Removed to fix fingerprinting warnings
          siteName: siteName
        })
      });
      
      if (!response.ok) {
        // Handle 500 errors by clearing stale data and retrying
        if (response.status === 500) {
          clearVisitorSession();
          
          // Generate new visitor ID and retry once
          const newVisitorId = await getOrCreateVisitorId();
          const retryResponse = await fetch('https://consentbit-test-server.web-8fb.workers.dev/api/visitor-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              visitorId: newVisitorId,
              // userAgent: navigator.userAgent, // Removed to fix fingerprinting warnings
              siteName: siteName
            })
          });
          
          if (!retryResponse.ok) {
            throw new Error(`Retry failed after clearing session: ${retryResponse.status}`);
          }
          
          const retryData = await retryResponse.json();
          // Store token immediately
          localStorage.setItem('_cb_vst_', retryData.token);
          localStorage.removeItem('_cb_rtc_');
          return retryData.token;
        }
        
        throw new Error(`Failed to get visitor session token: ${response.status}`);
      }
      
      const data = await response.json();
      // Store token immediately to prevent timing issues
      localStorage.setItem('_cb_vst_', data.token);
      localStorage.removeItem('_cb_rtc_');
      return data.token;
    } catch (error) {
      return null;
    } finally {
      // Always reset the flag regardless of success or failure
      tokenRequestInProgress = false;
    }
  }

  // --- Advanced: Fetch cookie expiration days from localStorage ---
  // Gets cookieExpiration from subscription-status response (stored in localStorage)
  async function fetchCookieExpirationDays() {
    const storedExpiration = localStorage.getItem('_cb_ced_');
    if (storedExpiration) {
      const expiration = parseInt(storedExpiration, 10);
      if (!isNaN(expiration) && expiration > 0) {
        return expiration;
      }
    }
    return 180;
  }

  // --- Manual override for testing purposes ---
  function getTestLocationOverride() {
    // Check if there's a manual override in localStorage for testing
    const override = localStorage.getItem('test_location_override');
    if (override) {
      try {
        return JSON.parse(override);
      } catch {
        return null;
      }
    }
    return null;
  }

  // --- Advanced: Detect location and banner type ---
  let country = null;
  async function detectLocationAndGetBannerType() {
    try {
      const sessionToken = localStorage.getItem('_cb_vst_');
      
      if (!sessionToken) {
        return null;
      }
      
      const siteName = window.location.hostname.replace(/^www\./, '').split('.')[0];
      
      const apiUrl = `https://consentbit-test-server.web-8fb.workers.dev/api/v2/cmp/detect-location?siteName=${encodeURIComponent(siteName)}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (!data.bannerType) {
        return null;
      }
      
      country = data.country;
      const locationData = {
        country: data.country || 'UNKNOWN',
        continent: data.continent || 'UNKNOWN',
        state: data.state || null,
        bannerType:data.bannerType
        };
      currentLocation = locationData;
      country = locationData.country;
      return data;
    } catch (error) {
      return null;
    }
  }

  // --- Advanced: Encrypt and save consent preferences to server ---
  async function saveConsentStateToServer(preferences, cookieDays, includeUserAgent) {
    try {
      const clientId = window.location.hostname;
      const visitorId = localStorage.getItem("_cb_vid_");
      const policyVersion = "1.2";
      const timestamp = new Date().toISOString();
      const sessionToken = localStorage.getItem("_cb_vst_");
      
      if (!sessionToken) {
        return;
      }

      // Prepare the complete payload first
      const fullPayload = {
        clientId,
        visitorId,
        preferences, // Raw preferences object, not encrypted individually
        policyVersion,
        timestamp,
        country: country || "IN",
        bannerType: preferences.bannerType || "GDPR",
        expiresAtTimestamp: Date.now() + ((cookieDays || 365) * 24 * 60 * 60 * 1000),
        expirationDurationDays: cookieDays || 365,
        metadata: {
          ...(includeUserAgent && { userAgent: navigator.userAgent }), // Only include userAgent if allowed
          language: navigator.language,
          platform: navigator.userAgentData?.platform || "unknown",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      // Encrypt the entire payload as one encrypted string
      const encryptedPayload = await encryptWithHardcodedKey(JSON.stringify(fullPayload));

      // Send only the encrypted payload
      const requestBody = {
        encryptedData: encryptedPayload
      };

      const response = await fetch("https://consentbit-test-server.web-8fb.workers.dev/api/v2/cmp/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
    } catch (error) {
      // Silent error handling
    }
  }

  // --- Advanced: Show saved preferences in preferences panel ---
  function updatePreferenceForm(preferences) {
    const necessaryCheckbox = document.querySelector('[data-consent-id="necessary-checkbox"]');
    const marketingCheckbox = document.querySelector('[data-consent-id="marketing-checkbox"]');
    const personalizationCheckbox = document.querySelector('[data-consent-id="personalization-checkbox"]');
    const analyticsCheckbox = document.querySelector('[data-consent-id="analytics-checkbox"]');
    if (necessaryCheckbox) {
      necessaryCheckbox.checked = true;
      necessaryCheckbox.disabled = true;
    }
    if (marketingCheckbox) {
      marketingCheckbox.checked = Boolean(preferences.Marketing);
    }
    if (personalizationCheckbox) {
      personalizationCheckbox.checked = Boolean(preferences.Personalization);
    }
    if (analyticsCheckbox) {
      analyticsCheckbox.checked = Boolean(preferences.Analytics);
    }
  }

  // --- CCPA: Update CCPA preference form checkboxes ---
  function updateCCPAPreferenceForm(preferences) {
    // Update main "Do Not Share" checkbox based on saved preference
    const doNotShareCheckbox = document.querySelector('[data-consent-id="do-not-share-checkbox"]');
    if (doNotShareCheckbox) {
      // Use saved donotshare preference if available, otherwise check if any category is false
      if (preferences.hasOwnProperty('donotshare')) {
        doNotShareCheckbox.checked = preferences.donotshare;
      } else {
        // Fallback: If any category is false (blocked), then "Do Not Share" should be checked
        const shouldCheck = !preferences.Analytics || !preferences.Marketing || !preferences.Personalization;
        doNotShareCheckbox.checked = shouldCheck;
      }
    }
    
    // Update individual CCPA category checkboxes (if they exist)
    const ccpaToggleCheckboxes = document.querySelectorAll('.consentbit-ccpa-prefrence-toggle input[type="checkbox"]');
    ccpaToggleCheckboxes.forEach(checkbox => {
      const checkboxName = checkbox.name || checkbox.getAttribute('data-category') || '';
      // In CCPA, checked means "Do Not Share" (block/false)
      if (checkboxName.toLowerCase().includes('analytics')) {
        checkbox.checked = !Boolean(preferences.Analytics);
      } else if (checkboxName.toLowerCase().includes('marketing') || checkboxName.toLowerCase().includes('advertising')) {
        checkbox.checked = !Boolean(preferences.Marketing);
      } else if (checkboxName.toLowerCase().includes('personalization') || checkboxName.toLowerCase().includes('functional')) {
        checkbox.checked = !Boolean(preferences.Personalization);
      }
    });
  }

  // --- Publishing status and removal helpers ---
  async function checkPublishingStatus() {
    try {
      const sessionToken = localStorage.getItem('_cb_vst_');
      if (!sessionToken) {
        return { canPublish: false, cookieExpiration: null };
      }
      const siteDomain = window.location.hostname;
      
      // Check for siteId in custom data attribute
      let siteId = null;
      const siteInfoElement = document.querySelector('[data-site-info]');
      if (siteInfoElement) {
        const siteInfo = siteInfoElement.getAttribute('data-site-info');
        if (siteInfo) {
          try {
            const parsed = JSON.parse(siteInfo);
            siteId = parsed.siteId || parsed.id || siteInfo;
          } catch (e) {
            siteId = siteInfo;
          }
        }
      }
      
      let apiUrl = `https://consentbit-test-server.web-8fb.workers.dev/api/site/subscription-status?siteDomain=${encodeURIComponent(siteDomain)}`;
      if (siteId) {
        apiUrl += `&siteId=${encodeURIComponent(siteId)}`;
      }
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${sessionToken}`,
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        return { canPublish: false, cookieExpiration: null };
      }
      const data = await response.json();
      
      const canPublish = data.canPublishToCustomDomain === true || data.canPub === true;
      
      let cookieExpiration = null;
      if (data.cookieExpiration !== null && data.cookieExpiration !== undefined) {
        cookieExpiration = parseInt(data.cookieExpiration, 10);
      } else if (data.ce !== null && data.ce !== undefined) {
        cookieExpiration = parseInt(data.ce, 10);
      }
      
      if (cookieExpiration !== null && cookieExpiration !== undefined && !isNaN(cookieExpiration)) {
        localStorage.setItem('_cb_ced_', cookieExpiration.toString());
      }
      
      return { canPublish, cookieExpiration };
    } catch (error) {
      return { canPublish: false, cookieExpiration: null };
    }
  }
  function removeConsentElements() {
    const selectors = [
      '.consentbit-gdpr-banner-div',
      '.consentbit-preference-div',
      '.consentbit-change-preference',
      '.consentbit-ccpa-banner-div',
      '.consentbit-ccpa_preference',
    ];
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
  }
  function isStagingHostname() {
    const hostname = window.location.hostname;
    return hostname.includes('.webflow.io') || hostname.includes('localhost') || hostname.includes('127.0.0.1');
  }

  // --- Load Consent Styles ---
  function loadConsentStyles() {
    try {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/gh/snm62/consentbit@d6b0288/consentbitstyle.css";
      link.type = "text/css";
      const link2 = document.createElement("link");
      link2.rel = "stylesheet";
      link2.href = "https://cdn.jsdelivr.net/gh/snm62/consentbit@8c69a0b/consentbit.css";
      document.head.appendChild(link2);
      link.onerror = function () {};
      link.onload = function () {};
      document.head.appendChild(link);
    } catch (error) {
      // Silent error handling
    }
  }
    // --- Monitor for dynamically added non-Google scripts ---
  function monitorDynamicScripts() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && node.tagName === 'SCRIPT') {
            // CRITICAL: Never block Google scripts - unblock them immediately
            if (isGoogleScript(node)) {
              // Unblock Google scripts and remove blocking attributes
              // Remove type attribute completely (don't set to text/javascript)
              node.removeAttribute('type');
              if (node.hasAttribute('data-category')) {
                node.removeAttribute('data-category');
              }
              node.removeAttribute('data-blocked-by-consent');
              node.removeAttribute('data-blocked-by-ccpa');
              return; // Exit early for Google scripts
            }
            
            // Only block scripts with data-category attribute
            // Scripts without data-category are functionality scripts and should always be allowed
            if (!node.hasAttribute('data-category')) {
              return; // Skip blocking scripts without data-category (functionality scripts)
            }
            
            // Only process scripts with data-category attribute
            var category = node.getAttribute('data-category');
            if (category) {
              var categories = category.split(',').map(function(cat) { return cat.trim(); });
              
              // Check if ANY category is necessary or essential (these should never be blocked)
              var hasEssentialCategory = categories.some(function(cat) {
                var lowercaseCat = cat.toLowerCase();
                return lowercaseCat === 'necessary' || lowercaseCat === 'essential';
              });
              
              if (!hasEssentialCategory) {
                // Check current consent state
                const analyticsConsent = localStorage.getItem("_cb_cas_");
                const marketingConsent = localStorage.getItem("_cb_cms_");
                const personalizationConsent = localStorage.getItem("_cb_cps_");
                const consentGiven = localStorage.getItem("_cb_cg_");
                
                // Only block if consent is denied for the specific category
                var shouldBlock = false;
                categories.forEach(function(cat) {
                  var lowercaseCat = cat.toLowerCase();
                  if (lowercaseCat === 'analytics' && analyticsConsent === "false") {
                    shouldBlock = true;
                  } else if ((lowercaseCat === 'marketing' || lowercaseCat === 'advertising') && marketingConsent === "false") {
                    shouldBlock = true;
                  } else if ((lowercaseCat === 'personalization' || lowercaseCat === 'functional') && personalizationConsent === "false") {
                    shouldBlock = true;
                  }
                });
                
                if (shouldBlock && consentGiven === "true") {
                  node.type = 'text/plain';
                  node.setAttribute('data-blocked-by-consent', 'true');
                }
              }
            }
          }
        });
      });
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
  
  // Start monitoring when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monitorDynamicScripts);
  } else {
    monitorDynamicScripts();
  }


  // --- Helper Functions (must be declared before DOMContentLoaded) ---
  async function checkConsentExpiration() {
    const expiresAt = localStorage.getItem('_cb_cea_');
    if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
      // Consent expired: clear consent state
      localStorage.removeItem('_cb_cg_');
      localStorage.removeItem('_cb_cp_');
      localStorage.removeItem('_cb_cea_');
      localStorage.removeItem('_cb_ced_');
      // Optionally, clear consent cookies as well
      ['analytics', 'marketing', 'personalization'].forEach(category => {
        setConsentCookie('cb-consent-' + category + '_storage', '', -1);
      });
    }
  }

  async function disableScrollOnSite(){
    const scrollControl = document.querySelector('[scroll-control="true"]');
    function toggleScrolling() {
      const banner = document.querySelector('[data-cookie-banner="true"]');
      if (!banner) return;
      const observer = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(banner).display !== "none";
        document.body.style.overflow = isVisible ? "hidden" : "";
      });
      // Initial check on load
      const isVisible = window.getComputedStyle(banner).display !== "none";
      document.body.style.overflow = isVisible ? "hidden" : "";
      observer.observe(banner, { attributes: true, attributeFilter: ["style", "class"] });
    }
    if (scrollControl) {
      toggleScrolling();
    }
  }

 
  document.addEventListener('DOMContentLoaded', async function() {
    await hideAllBanners();
    await checkConsentExpiration();
    await disableScrollOnSite();

    let canPublish = false;
    let isStaging = false;
    let locationData = null;
    
    try {
      const token = await getVisitorSessionToken();
      if (!token) {
        // Instead of immediate reload, try clearing session and retry once
        clearVisitorSession();
        const retryToken = await getVisitorSessionToken();
        if (!retryToken) {
          // Only reload if we absolutely can't get a token after retry
          console.warn('Failed to get visitor token after retry, reloading page');
          setTimeout(() => location.reload(), 3000);
          return;
        }
        localStorage.setItem('_cb_vst_', retryToken);
        await scanAndSendHeadScriptsIfChanged(retryToken);
      } else {
        // Store token immediately if not already stored
        if (!localStorage.getItem('_cb_vst_')) {
          localStorage.setItem('_cb_vst_', token);
        }
        await scanAndSendHeadScriptsIfChanged(token);
      }
      const publishingStatus = await checkPublishingStatus();
      canPublish = publishingStatus.canPublish;
      isStaging = isStagingHostname();
      
      if (publishingStatus.cookieExpiration !== null && publishingStatus.cookieExpiration !== undefined && !isNaN(publishingStatus.cookieExpiration)) {
        localStorage.setItem('consentExpirationDays', publishingStatus.cookieExpiration.toString());
      }
      
      if (!canPublish && !isStaging) {
        removeConsentElements();
        return;
      }
    } catch (error) {
      console.error('Error in token/status check:', error);
      // Don't immediately reload on error, try to continue
      clearVisitorSession();
      // Only reload if critical functionality fails
      setTimeout(() => location.reload(), 5000);
      return;
    }

    // Set up toggle consent button AFTER canPublish/isStaging check
    // Toggle button visibility controlled by staging/publishing status only
    const toggleConsentBtn = document.getElementById('toggle-consent-btn');
    
    if (toggleConsentBtn) {
      // Control visibility based on staging/publishing status
      if (isStaging || canPublish) {
        toggleConsentBtn.style.display = 'block';
      } else {
        toggleConsentBtn.style.display = 'none';
      }
      
      toggleConsentBtn.onclick = async function(e) {
        e.preventDefault();
        
        // Find banner elements
        const consentBanner = document.getElementById("consent-banner");
        const ccpaBanner = document.getElementById("initial-consent-banner");
        const mainBanner = document.getElementById("main-banner");
        
        // If locationData not available yet, detect it now
        if (!locationData) {
          const testOverride = getTestLocationOverride();
          if (testOverride) {
            locationData = testOverride;
            country = testOverride.country;
          } else {
            locationData = await detectLocationAndGetBannerType();
          }
        }
        
        // Show appropriate banner based on location (if available) or default to GDPR
        if (locationData && (["CCPA", "VCDPA", "CPA", "CTDPA", "UCPA"].includes(locationData.bannerType) || locationData.country === "US") && ccpaBanner) {
          hideAllBanners();
          showBanner(ccpaBanner);
          // Update CCPA preference form with saved preferences
          updateCCPAPreferenceForm(getConsentPreferences());
        } else if (consentBanner) {
          hideAllBanners();
          showBanner(consentBanner);
        }
        
        // Update preferences if function exists
        if (typeof updatePreferenceForm === 'function') {
          updatePreferenceForm(getConsentPreferences());
        }
      };
    }

    // Detect location in background (non-blocking for toggle button)
    // Location detection happens here but toggle button works without it
    const testOverride = getTestLocationOverride();
    if (testOverride) {
      locationData = testOverride;
      country = testOverride.country;
    } else {
      detectLocationAndGetBannerType().then(data => {
        if (data) {
          locationData = data;
          country = data.country;
        }
      }).catch(() => {
        // Silent error handling - location detection not critical for toggle button
      });
    }

    const consentGiven = localStorage.getItem("_cb_cg_");
    let cookieDays = await fetchCookieExpirationDays();
    const prefs = getConsentPreferences();
    updatePreferenceForm(prefs);

    // Set up ALL button handlers BEFORE checking consent state
    // This ensures buttons work even after consent is given and page reloads
    
    // Accept all
    const acceptBtn = document.getElementById('accept-btn');
    if (acceptBtn) {
      acceptBtn.onclick = async function(e) {
        e.preventDefault();
        const preferences = { Analytics: true, Marketing: true, Personalization: true, donotshare: false, bannerType: locationData ? locationData.bannerType : undefined };
        setConsentState(preferences, cookieDays);
        
        // Enable ALL scripts with data-category (regardless of category value)
        enableAllScriptsWithDataCategory();
        
        hideBanner(document.getElementById("consent-banner"));
        hideBanner(document.getElementById("initial-consent-banner"));
        hideBanner(document.getElementById("main-banner"));
        localStorage.setItem("_cb_cg_", "true");
        await saveConsentStateToServer(preferences, cookieDays, true); // Pass true to include userAgent
        updatePreferenceForm(preferences);
      };
    }
    
    // Reject all
    const declineBtn = document.getElementById('decline-btn');
    if (declineBtn) {
      declineBtn.onclick = async function(e) {
        e.preventDefault();
        const preferences = { Analytics: false, Marketing: false, Personalization: false, donotshare: true, bannerType: locationData ? locationData.bannerType : undefined };
        
        // Update Google Consent v2 to deny tracking (let Google handle privacy-preserving mode)
        if (typeof gtag === "function") {
          gtag('consent', 'update', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_personalization': 'denied',
            'ad_user_data': 'denied',
            'personalization_storage': 'denied',
            'functionality_storage': 'granted',
            'security_storage': 'granted'
          });
        }
        
        // Set consent state and block ALL scripts (including Google scripts)
        setConsentState(preferences, cookieDays);
        blockScriptsByCategory();
        hideBanner(document.getElementById("consent-banner"));
        hideBanner(document.getElementById("initial-consent-banner"));
        hideBanner(document.getElementById("main-banner"));
        localStorage.setItem("_cb_cg_", "true");
        await saveConsentStateToServer(preferences, cookieDays, false);
        updatePreferenceForm(preferences);
      };
    }
    
    // Do Not Share (CCPA)
    const doNotShareBtn = document.getElementById('do-not-share-link');
    if (doNotShareBtn) {
      doNotShareBtn.onclick = function(e) {
        e.preventDefault();
        
        // Hide initial CCPA banner with FORCE
        const initialBanner = document.getElementById('initial-consent-banner');
        if (initialBanner) {
          hideBanner(initialBanner);
        }
        
        // Show main consent banner with force
        const mainBanner = document.getElementById('main-consent-banner');
        if (mainBanner) {
          showBanner(mainBanner);
          
          // Update CCPA preference form with saved preferences
          updateCCPAPreferenceForm(getConsentPreferences());
        }
      };
    }
    
    // CCPA Preference Accept button
    const ccpaPreferenceAcceptBtn = document.getElementById('consebit-ccpa-prefrence-accept');
    if (ccpaPreferenceAcceptBtn) {
      ccpaPreferenceAcceptBtn.onclick = async function(e) {
        e.preventDefault();
        
        // Read the do-not-share checkbox value
        const doNotShareCheckbox = document.querySelector('[data-consent-id="do-not-share-checkbox"]');
        let preferences;
        
        if (doNotShareCheckbox && doNotShareCheckbox.checked) {
          // Checkbox checked means "Do Not Share" - block based on US law type
          preferences = { 
            Analytics: false, 
            Marketing: false, 
            Personalization: false,
            donotshare: true,
            bannerType: locationData ? locationData.bannerType : undefined 
          };
          
          // Apply law-specific blocking based on banner type
          if (locationData && ["VCDPA", "CPA", "CTDPA", "UCPA"].includes(locationData.bannerType)) {
            // Enhanced privacy laws with granular opt-out requirements
            console.log(`[CONSENT-FLOW] Applying granular blocking for ${locationData.bannerType}`);
            blockTargetedAdvertisingScripts();
            blockSaleScripts();
            blockProfilingScripts();
            blockCrossContextBehavioralAdvertising();
            blockAutomatedDecisionScripts();
          } else {
            // CCPA - block all scripts  
            console.log('[CONSENT-FLOW] Applying CCPA script blocking');
            blockScriptsWithDataCategory();
            blockNonGoogleScripts();
          }
        } else {
          // Checkbox unchecked means "Allow" - unblock all scripts
          preferences = { 
            Analytics: true, 
            Marketing: true, 
            Personalization: true,
            donotshare: false,
            bannerType: locationData ? locationData.bannerType : undefined 
          };
          // Unblock all scripts
          unblockScriptsWithDataCategory();
        }
        
        // Save consent state
        setConsentState(preferences, cookieDays);
        
        // Hide banners
        hideBanner(document.getElementById("initial-consent-banner"));
        const ccpaPreferencePanel = document.querySelector('.consentbit-ccpa_preference');
        hideBanner(ccpaPreferencePanel);
        const ccpaBannerDiv = document.querySelector('.consentbit-ccpa-banner-div');
        hideBanner(ccpaBannerDiv);
        
        // Set consent as given
        localStorage.setItem("_cb_cg_", "true");
        
        // Save to server
        await saveConsentStateToServer(preferences, cookieDays, true);
        updatePreferenceForm(preferences);
      };
    }
    
    // CCPA Preference Decline button
    const ccpaPreferenceDeclineBtn = document.getElementById('consebit-ccpa-prefrence-decline');
    if (ccpaPreferenceDeclineBtn) {
      ccpaPreferenceDeclineBtn.onclick = async function(e) {
        e.preventDefault();
        
        // Decline means block all scripts (all false)
        const preferences = { 
          Analytics: false, 
          Marketing: false, 
          Personalization: false, 
          donotshare: true, // CCPA Decline means do not share = true
          bannerType: locationData ? locationData.bannerType : undefined 
        };
        
        // Save consent state
        setConsentState(preferences, cookieDays);
        
        // Block all scripts (including Google scripts)
        blockScriptsByCategory();
        
        // Hide both CCPA banners using hideBanner function
        hideBanner(document.getElementById("initial-consent-banner"));
        const ccpaPreferencePanel = document.querySelector('.consentbit-ccpa_preference');
        hideBanner(ccpaPreferencePanel);
        const ccpaBannerDiv = document.querySelector('.consentbit-ccpa-banner-div');
        hideBanner(ccpaBannerDiv);
        
        // Set consent as given
        localStorage.setItem("_cb_cg_", "true");
        
        // Save to server (original CCPA logic - always include userAgent)
        await saveConsentStateToServer(preferences, cookieDays, true);
        updatePreferenceForm(preferences);
      };
    }
    
    // Save button (CCPA)
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.onclick = async function(e) {
        e.preventDefault();
        
        // Read the do-not-share checkbox value
        const doNotShareCheckbox = document.querySelector('[data-consent-id="do-not-share-checkbox"]');
        let preferences;
        let includeUserAgent;
        
        if (doNotShareCheckbox && doNotShareCheckbox.checked) {
          // Checkbox checked means "Do Not Share" - block all scripts and restrict userAgent
          preferences = { 
            Analytics: false, 
            Marketing: false, 
            Personalization: false,
            donotshare: true,
            bannerType: locationData ? locationData.bannerType : undefined 
          };
          includeUserAgent = false; // Restrict userAgent
        } else {
          // Checkbox unchecked means "Allow" - unblock all scripts and allow userAgent
          preferences = { 
            Analytics: true, 
            Marketing: true, 
            Personalization: true,
            donotshare: false,
            bannerType: locationData ? locationData.bannerType : undefined 
          };
          includeUserAgent = true; // Allow userAgent
        }
        
        // Save consent state
        setConsentState(preferences, cookieDays);
        
        // Handle script blocking/unblocking based on checkbox state (including Google scripts)
        if (doNotShareCheckbox && doNotShareCheckbox.checked) {
          // CCPA: Block all scripts with data-category attribute (including Google scripts)
          blockScriptsWithDataCategory();
        } else {
          // CCPA: Unblock all scripts with data-category attribute (including Google scripts)
          unblockScriptsWithDataCategory();
        }
        
        // Hide both CCPA banners - close everything
        const mainConsentBanner = document.getElementById('main-consent-banner');
        const initialConsentBanner = document.getElementById('initial-consent-banner');
        
        if (mainConsentBanner) {
          hideBanner(mainConsentBanner);
        }
        if (initialConsentBanner) {
          hideBanner(initialConsentBanner);
        }
        
        // Set consent as given
        localStorage.setItem("_cb_cg_", "true");
        
        // Save to server with appropriate userAgent setting based on checkbox
        await saveConsentStateToServer(preferences, cookieDays, includeUserAgent);
        updatePreferenceForm(preferences);
      };
    }
    
    // Preferences button (show preferences panel)
    const preferencesBtn = document.getElementById('preferences-btn');
    if (preferencesBtn) {
      preferencesBtn.onclick = function(e) {
        e.preventDefault();
        hideBanner(document.getElementById("consent-banner"));
        showBanner(document.getElementById("main-banner"));
        updatePreferenceForm(getConsentPreferences());
      };
    }
    
    // Save Preferences button
    const savePreferencesBtn = document.getElementById('save-preferences-btn');
    if (savePreferencesBtn) {
      savePreferencesBtn.onclick = async function(e) {
        e.preventDefault();
        // Read checkboxes
        const analytics = !!document.querySelector('[data-consent-id="analytics-checkbox"]:checked');
        const marketing = !!document.querySelector('[data-consent-id="marketing-checkbox"]:checked');
        const personalization = !!document.querySelector('[data-consent-id="personalization-checkbox"]:checked');
        const preferences = {
          Analytics: analytics,
          Marketing: marketing,
          Personalization: personalization,
          bannerType: locationData ? locationData.bannerType : undefined
        };
        setConsentState(preferences, cookieDays);
        // First block ALL scripts except necessary/essential (including Google scripts)
        blockScriptsByCategory();
        // Then enable only scripts for selected categories (including Google scripts)
        const selectedCategories = Object.keys(preferences).filter(k => preferences[k] && k !== 'bannerType');
        if (selectedCategories.length > 0) {
          enableScriptsByCategories(selectedCategories);
        }
        hideBanner(document.getElementById("main-banner"));
        hideBanner(document.getElementById("consent-banner"));
        hideBanner(document.getElementById("initial-consent-banner"));
        localStorage.setItem("_cb_cg_", "true");
        await saveConsentStateToServer(preferences, cookieDays, true); // Include userAgent for preferences
        updatePreferenceForm(preferences);
      };
    }

    // Cancel button (go back to main banner)
    const cancelGDPRBtn = document.getElementById('cancel-btn');
    if (cancelGDPRBtn) {
      cancelGDPRBtn.onclick = async function(e) {
        e.preventDefault();
        
        // STEP 1: Block all scripts except necessary/essential
        blockScriptsByCategory();
        
        // STEP 2: Also block any scripts that are already running by disabling them
        // Disable Google Analytics if present
        if (typeof gtag !== 'undefined') {
          gtag('consent', 'update', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_personalization': 'denied',
            'ad_user_data': 'denied',
            'personalization_storage': 'denied'
          });
        }
        
        // Disable Google Tag Manager if present
        if (typeof window.dataLayer !== 'undefined') {
          window.dataLayer.push({
            'event': 'consent_denied',
            'analytics_storage': 'denied',
            'ad_storage': 'denied'
          });
        }
        
        // STEP 3: Uncheck all preference checkboxes
        const analyticsCheckbox = document.querySelector('[data-consent-id="analytics-checkbox"]');
        const marketingCheckbox = document.querySelector('[data-consent-id="marketing-checkbox"]');
        const personalizationCheckbox = document.querySelector('[data-consent-id="personalization-checkbox"]');
        
        if (analyticsCheckbox) {
          analyticsCheckbox.checked = false;
        }
        if (marketingCheckbox) {
          marketingCheckbox.checked = false;
        }
        if (personalizationCheckbox) {
          personalizationCheckbox.checked = false;
        }
        
        // STEP 4: Save consent state with all preferences as false (like decline behavior)
        const preferences = { 
          Analytics: false, 
          Marketing: false, 
          Personalization: false, 
          bannerType: locationData ? locationData.bannerType : undefined 
        };
        
        setConsentState(preferences, cookieDays);
        updateGtagConsent(preferences);
        
        // STEP 5: Set consent as given and save to server
        localStorage.setItem("_cb_cg_", "true");
        
        try {
          await saveConsentStateToServer(preferences, cookieDays, false); // Exclude userAgent like decline
        } catch (error) {
          // Silent error handling
        }
        
        // STEP 6: Hide banners
        hideBanner(document.getElementById("main-banner"));
        hideBanner(document.getElementById("consent-banner"));
      };
    }

    // Cancel button (go back to main banner)
    const cancelBtn = document.getElementById('close-consent-banner');
    if (cancelBtn) {
      cancelBtn.onclick = async function(e) {
        e.preventDefault();
        
        // Always hide main-consent-banner when cancel is clicked
        const mainConsentBanner = document.getElementById('main-consent-banner');
        if (mainConsentBanner) {
          hideBanner(mainConsentBanner);
        }
        
        // Show initial banner if it exists
        const initialConsentBanner = document.getElementById('initial-consent-banner');
        if (initialConsentBanner) {
          showBanner(initialConsentBanner);
        }
      };
    }
    
    // CCPA Link Block - Show CCPA Banner
    const ccpaLinkBlock = document.getElementById('consentbit-ccpa-linkblock');
    if (ccpaLinkBlock) {
      ccpaLinkBlock.onclick = function(e) {
        e.preventDefault();
        
        // Show CCPA banner using showBanner function
        const ccpaBannerDiv = document.querySelector('.consentbit-ccpa-banner-div');
        showBanner(ccpaBannerDiv);
        
        // Also show the CCPA banner if it exists
        showBanner(document.getElementById("initial-consent-banner"));
      };
    }

    // If consent is already given, hide all banners and do not show any
    if (consentGiven === "true") {
      await hideAllBanners();
      // Do not show any banner unless user clicks the icon
      return;
    }

    // Only show banners if consent not given AND location data is available
    if (!consentGiven && locationData) {
      if (["CCPA", "VCDPA", "CPA", "CTDPA", "UCPA"].includes(locationData.bannerType)) {
        // US Privacy Laws: Unblock all scripts initially (opt-out model)
        unblockScriptsWithDataCategory();
        showBanner(document.getElementById("initial-consent-banner"));
        hideBanner(document.getElementById("consent-banner"));
        
      
      } else {
        // Show GDPR banner (default for EU and other locations)
        showBanner(document.getElementById("consent-banner"));
        hideBanner(document.getElementById("initial-consent-banner"));
        blockScriptsByCategory();
      }
    }
    

      
      // Close Consent Banner functionality (CCPA only)
    
      
      // Load consent styles after banners are shown
      loadConsentStyles();
  });
  
 // End DOMContentLoaded event listener

    // --- CCPA-specific script handling functions ---
    function unblockScriptsWithDataCategory() {
      // First, unblock all Google scripts (they should never be blocked)
      unblockGoogleScripts();
      
      // CCPA: Unblock ALL scripts with data-category attribute (except Google scripts) only in head section
      var scripts = document.head.querySelectorAll('script[type="text/plain"][data-category]');
      scripts.forEach(function(oldScript) {
        // Skip Google scripts - they're already unblocked above
        if (isGoogleScript(oldScript)) {
          return;
        }
        
        var newScript = document.createElement('script');
        for (var i = 0; i < oldScript.attributes.length; i++) {
          var attr = oldScript.attributes[i];
          if (attr.name === 'type') {
            newScript.type = 'text/javascript';
          } else if (attr.name !== 'data-blocked-by-ccpa') {
            newScript.setAttribute(attr.name, attr.value);
          }
        }
        if (oldScript.innerHTML) {
          newScript.innerHTML = oldScript.innerHTML;
        }
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
    }
   
    function blockScriptsWithDataCategory() {
      // First, unblock all Google scripts (they should never be blocked)
      unblockGoogleScripts();
      
      // CCPA: Block ALL scripts with data-category attribute (except Google scripts) only in head section
      var scripts = document.head.querySelectorAll('script[data-category]');
      scripts.forEach(function(script) {
        // CRITICAL: Never block Google scripts
        if (isGoogleScript(script)) {
          // Ensure Google scripts are unblocked and have no data-category
          // Remove type attribute completely (don't set to text/javascript)
          script.removeAttribute('type');
          if (script.hasAttribute('data-category')) {
            script.removeAttribute('data-category');
          }
          script.removeAttribute('data-blocked-by-ccpa');
          return; // Exit early for Google scripts
        }
        
        if (script.type !== 'text/plain') {
          script.type = 'text/plain';
          script.setAttribute('data-blocked-by-ccpa', 'true');
        }
      });
    }
  
async function hashStringSHA256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function scanAndSendHeadScriptsIfChanged(sessionToken) {
  const headScripts = document.head.querySelectorAll('script');
  const scriptData = Array.from(headScripts).map(script => ({
    src: script.src || null,
    content: script.src ? null : script.innerHTML,
    dataCategory: script.getAttribute('data-category') || null
  }));
  const scriptDataString = JSON.stringify(scriptData);
  const scriptDataHash = await hashStringSHA256(scriptDataString);

  const cachedHash = localStorage.getItem('_cb_hsh_');
  console.log('Current scriptDataHash:', scriptDataHash);
console.log('Cached hash:', cachedHash);
if (cachedHash !== scriptDataHash) {
  console.log('Hash changed, sending POST to /api/cmp/head-scripts');
}
  if (cachedHash === scriptDataHash) {
    return; // No change, do nothing
  }

  try {
    const encryptedScriptData = await encryptWithHardcodedKey(scriptDataString);
    
    // Get siteName from hostname
    const siteName = window.location.hostname.replace(/^www\./, '').split('.')[0];
    
    // Build API URL with siteName parameter
    const apiUrl = `https://consentbit-test-server.web-8fb.workers.dev/api/v2/cmp/head-scripts?siteName=${encodeURIComponent(siteName)}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ encryptedData: encryptedScriptData }),
    });
    
    if (response.ok) {
      localStorage.setItem('_cb_hsh_', scriptDataHash);
      console.log('Head scripts processed and cached successfully');
    } else {
      console.error('Failed to send head scripts to API:', response.status);
    }
  } catch (e) {
    console.error('Error sending head scripts to API:', e);
  }
}

function blockNonGoogleScripts() {
  // DEPRECATED: This function should not be used anymore
  // Only block scripts with data-category attribute (handled by blockScriptsByCategory)
  // Scripts without data-category are functionality scripts and should always be allowed
  // This function is kept for backward compatibility but does nothing
  return;
}
 

function blockTargetedAdvertisingScripts() {
  // First, unblock all Google scripts (they should never be blocked)
  unblockGoogleScripts();
  
  const targetedAdvertisingPatterns = /facebook|meta|fbevents|linkedin|twitter|pinterest|tiktok|snap|reddit|quora|outbrain|taboola|sharethrough|doubleclick|adwords|adsense|adservice|pixel|quantserve|scorecardresearch|moat|integral-marketing|comscore|nielsen|quantcast|adobe/i;
  
  const scripts = document.head.querySelectorAll('script[src]');
  scripts.forEach(script => {
    // CRITICAL: Never block Google scripts
    if (isGoogleScript(script)) {
      return; // Skip Google scripts
    }
    
    if (targetedAdvertisingPatterns.test(script.src)) {
      if (script.type !== 'text/plain') {
        script.type = 'text/plain';
        script.setAttribute('data-blocked-by-targeted-advertising', 'true');
      }
    }
  });
}

function blockSaleScripts() {
  // First, unblock all Google scripts (they should never be blocked)
  unblockGoogleScripts();
  
  const salePatterns = /facebook|meta|fbevents|linkedin|twitter|pinterest|tiktok|snap|reddit|quora|outbrain|taboola|sharethrough|doubleclick|adwords|adsense|adservice|pixel|quantserve|scorecardresearch|moat|integral-marketing|comscore|nielsen|quantcast|adobe|marketo|hubspot|salesforce|pardot|eloqua|act-on|mailchimp|constantcontact|sendgrid|klaviyo|braze|iterable/i;
  
  const scripts = document.head.querySelectorAll('script[src]');
  scripts.forEach(script => {
    // CRITICAL: Never block Google scripts
    if (isGoogleScript(script)) {
      return; // Skip Google scripts
    }
    
    if (salePatterns.test(script.src)) {
      if (script.type !== 'text/plain') {
        script.type = 'text/plain';
        script.setAttribute('data-blocked-by-sale', 'true');
      }
    }
  });
}

function blockProfilingScripts() {
  // First, unblock all Google scripts (they should never be blocked)
  unblockGoogleScripts();
  
  const profilingPatterns = /optimizely|hubspot|marketo|pardot|salesforce|intercom|drift|zendesk|freshchat|tawk|livechat|clarity|hotjar|mouseflow|fullstory|logrocket|mixpanel|segment|amplitude|heap|kissmetrics|matomo|piwik|plausible|woopra|crazyegg|clicktale|chartbeat|parse\.ly/i;
  
  const scripts = document.head.querySelectorAll('script[src]');
  scripts.forEach(script => {
    // CRITICAL: Never block Google scripts
    if (isGoogleScript(script)) {
      return; // Skip Google scripts
    }
    
    if (profilingPatterns.test(script.src)) {
      if (script.type !== 'text/plain') {
        script.type = 'text/plain';
        script.setAttribute('data-blocked-by-profiling', 'true');
      }
    }
  });
}

function blockCrossContextBehavioralAdvertising() {
  const crossContextPatterns = /facebook|meta|fbevents|linkedin|twitter|pinterest|tiktok|snap|reddit|quora|outbrain|taboola|sharethrough|doubleclick|adwords|adsense|adservice|pixel|quantserve|scorecardresearch|moat|integral-marketing|comscore|nielsen|quantcast|adobe/i;
  
  const scripts = document.head.querySelectorAll('script[src]');
  scripts.forEach(script => {
    if (crossContextPatterns.test(script.src)) {
      if (script.type !== 'text/plain') {
        script.type = 'text/plain';
        script.setAttribute('data-blocked-by-cross-context', 'true');
      }
    }
  });
}

function blockAutomatedDecisionScripts() {
  const automatedDecisionPatterns = /optimizely|hubspot|marketo|pardot|salesforce|intercom|drift|zendesk|freshchat|tawk|livechat|clarity|hotjar|mouseflow|fullstory|logrocket|mixpanel|segment|amplitude|heap|kissmetrics|matomo|piwik|plausible|woopra|crazyegg|clicktale|chartbeat|parse\.ly/i;
  
  const scripts = document.head.querySelectorAll('script[src]');
  scripts.forEach(script => {
    if (automatedDecisionPatterns.test(script.src)) {
      if (script.type !== 'text/plain') {
        script.type = 'text/plain';
        script.setAttribute('data-blocked-by-automated-decision', 'true');
      }
    }
  });
}
})(); 
