// CRITICAL: Initialize consent mode IMMEDIATELY (before IIFE) to prevent blocking
// This ensures consent mode is set even if script loads asynchronously
(function() {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === 'undefined') {
    window.gtag = function() { window.dataLayer.push(arguments); };
  }
  window.gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_personalization': 'denied',
    'ad_user_data': 'denied',
    'personalization_storage': 'denied',
    'functionality_storage': 'granted',
    'security_storage': 'granted'
  });
})();

// Main consent management script (can load asynchronously)
(function () {
  // Ensure dataLayer and gtag are available (already initialized above, but ensure for safety)
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === 'undefined') {
    window.gtag = function() { window.dataLayer.push(arguments); };
  }
  
  // Create local gtag function for backward compatibility (used by updateGtagConsent)
  function gtag() { 
    window.dataLayer.push(arguments); 
  }

  const ENCRYPTION_KEY = "t95w6oAeL1hr0rrtCGKok/3GFNwxzfLxiWTETfZurpI=";
  const ENCRYPTION_IV = "yVSYDuWajEid8kDz";
  
  // Global location data storage (can be accessed from anywhere)
  window.locationData = null;
  let locationDetectionPromise = null; // Promise to prevent multiple simultaneous detections


  function setConsentCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
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
  function removeDuplicateScripts() {
    const scripts = document.head.querySelectorAll('script[data-category]');
    const scriptMap = new Map();
    
    scripts.forEach(function(script) {
      const src = script.src;
      const dataCategory = script.getAttribute('data-category');
      const key = src + '|' + dataCategory;
      
              if (scriptMap.has(key)) {
          script.remove();
      } else {
        scriptMap.set(key, script);
      }
    });
  }

  // Global function to check if a script is a Google script
  function isGoogleScript(script) {
    if (!script) return false;
    
    // Check external scripts by src
    if (script.src) {
      return (
        script.src.includes('googletagmanager.com') ||
        script.src.includes('google-analytics.com') ||
        script.src.includes('googleapis.com') ||
        script.src.includes('gstatic.com') ||
        script.src.includes('gtag') ||
        script.src.includes('analytics.js') ||
        script.src.includes('ga.js') ||
        script.src.includes('google.com/recaptcha') ||
        script.src.includes('maps.googleapis.com')
      );
    }
    
    // Check inline scripts by content
    if (script.innerHTML) {
      return (
        script.innerHTML.includes('googletagmanager') ||
        script.innerHTML.includes('google-analytics') ||
        script.innerHTML.includes('gtag') ||
        script.innerHTML.includes('dataLayer') ||
        script.innerHTML.includes('GoogleAnalytics')
      );
    }
    
    return false;
  }

  // CRITICAL: Ensure Google scripts are always unblocked
  // Google scripts use Consent Mode, not category-based blocking
  // Keep data-category attribute on Google scripts (don't remove it, just ignore it for blocking)
  function unblockGoogleScripts() {
    // Find all Google scripts in head section
    const headScripts = document.head.querySelectorAll('script');
    headScripts.forEach(function(script) {
      if (isGoogleScript(script)) {
        // If Google script has type="text/plain", unblock it
        if (script.type === 'text/plain') {
          // Remove type="text/plain" attribute to allow script to execute
          script.removeAttribute('type');
        }
        
        // Remove blocking attributes (regardless of type)
        script.removeAttribute('data-blocked-by-consent');
        script.removeAttribute('data-blocked-by-ccpa');
        script.removeAttribute('data-blocked-by-targeted-advertising');
        script.removeAttribute('data-blocked-by-sale');
        
        // DO NOT remove data-category attribute from Google scripts
        // Keep it as is - we just ignore it for blocking/unblocking purposes
        // Google scripts are controlled by Consent Mode, not by data-category blocking
      }
    });
  }

  function ensureGtagInitialization() {
    window.dataLayer = window.dataLayer || [];
    
    if (typeof window.gtag === 'undefined') {
      window.gtag = function() { 
        window.dataLayer.push(arguments); 
      };
    }
    
    const gtmScripts = document.querySelectorAll('script[src*="googletagmanager"]');
    if (gtmScripts.length > 0) {
      if (typeof window.gtag === 'function') {
        try {
          window.gtag('event', 'consent_scripts_enabled', {
            'event_category': 'consent',
            'event_label': 'scripts_re_enabled'
          });
          
          setTimeout(function() {
            try {
              window.gtag('config', 'GA_MEASUREMENT_ID', {
                'page_title': document.title,
                'page_location': window.location.href
              });
            } catch (e) {
            }
          }, 500);
        } catch (e) {
        }
      }
    }
    
    const analyticsScripts = document.querySelectorAll('script[src*="analytics"], script[src*="gtag"], script[src*="googletagmanager"]');
    if (analyticsScripts.length > 0) {
    }
  }

  function forceReloadAnalyticsScripts() {
    const analyticsScripts = document.querySelectorAll('script[src*="analytics"], script[src*="gtag"], script[src*="googletagmanager"], script[src*="google-analytics"]');
    
    analyticsScripts.forEach(function(script) {
      if (script.type === 'text/javascript' && script.src) {
        try {
          const newScript = document.createElement('script');
          
          for (let attr of script.attributes) {
            newScript.setAttribute(attr.name, attr.value);
          }
          
          newScript.type = 'text/javascript';
          
          newScript.onerror = function() {
          };
          newScript.onload = function() {
          };
          
          script.parentNode.insertBefore(newScript, script);
          script.remove();
        } catch (error) {
        }
      }
    });
  }

  function blockScriptsByCategory() {
    removeDuplicateScripts();
    
    // CRITICAL: First, ensure all Google scripts are unblocked
    unblockGoogleScripts();
    
    var scripts = document.head.querySelectorAll('script[data-category]');
    scripts.forEach(function (script) {
      // CRITICAL: Never block Google Tag Manager/Google Analytics scripts
      // Even if they have data-category attribute, they use Consent Mode
      // Skip Google scripts - they're controlled by Consent Mode, not script blocking
      if (isGoogleScript(script)) {
        return; // Exit early for Google scripts - don't process them
      }
      
      // For NON-Google scripts: Check their category and block if needed
      var category = script.getAttribute('data-category');
      if (category) {

        var categories = category.split(',').map(function (cat) { return cat.trim(); });

        // Check if script has "necessary" or "essential" category (these should never be blocked)
        var hasEssentialCategory = categories.some(function (cat) {
          var lowercaseCat = cat.toLowerCase();
          return lowercaseCat === 'necessary' || lowercaseCat === 'essential';
        });

        // Block non-essential scripts by changing type to 'text/plain' (browser won't execute)
        if (!hasEssentialCategory) {
          script.type = 'text/plain';
          script.setAttribute('data-blocked-by-consent', 'true');
        }
        // If hasEssentialCategory is true, script remains as 'text/javascript' and will execute
      }
    });
  }
  function enableAllScriptsWithDataCategory() {
    // CRITICAL: First, ensure all Google scripts are unblocked
    unblockGoogleScripts();
    
    // Enable all scripts with data-category attribute (including Google scripts)
    var scripts = document.head.querySelectorAll('script[data-category]');
    var blockedScripts = [];
    
    scripts.forEach(function (script) {
      // Skip Google scripts - they're already handled by unblockGoogleScripts()
      if (isGoogleScript(script)) {
        return; // Skip Google scripts
      }
      
      var isBlocked = script.type === 'text/plain' || 
                     script.hasAttribute('data-blocked-by-consent') || 
                     script.hasAttribute('data-blocked-by-ccpa');
      
      if (isBlocked) {
        blockedScripts.push(script);
      }
    });
    
    blockedScripts.forEach(function (script) {
      if (script.src) {
        try {
          const existingScript = document.querySelector(`script[src="${script.src}"][type="text/javascript"]`);
          if (existingScript) {
            script.remove();
            return;
          }
          
          const newScript = document.createElement('script');
          
          for (let attr of script.attributes) {
            if (attr.name !== 'type' && 
                attr.name !== 'data-blocked-by-consent' && 
                attr.name !== 'data-blocked-by-ccpa') {
              newScript.setAttribute(attr.name, attr.value);
            }
          }
          
          newScript.type = 'text/javascript';
          
          newScript.onerror = function() {
          };
          newScript.onload = function() {
            ensureGtagInitialization();
          };
          
          script.parentNode.insertBefore(newScript, script);
          script.remove();
        } catch (error) {
        }
      } else {
        script.type = 'text/javascript';
        script.removeAttribute('data-blocked-by-consent');
        script.removeAttribute('data-blocked-by-ccpa');
        
        if (script.innerHTML) {
          try {
            eval(script.innerHTML);
          } catch (e) {
          }
        }
      }
    });
    
    // Unblock ALL scripts that were blocked (including those without data-category)
    // Change type from text/plain to text/javascript and remove blocking attributes
    var allBlockedScripts = document.head.querySelectorAll('script[type="text/plain"]');
    allBlockedScripts.forEach(function (script) {
      // Google scripts are already handled by unblockGoogleScripts(), but unblock them here too for safety
      // Check if this is a Google script (should not have been blocked, but just in case)
      if (isGoogleScript(script)) {
        // Google scripts are already unblocked, but ensure they're not in the blocking list
        return;
      }
      // Unblock all scripts (including Google scripts)
      if (script.src) {
        // For external scripts, create new script element to force reload
        try {
          const existingScript = document.querySelector(`script[src="${script.src}"][type="text/javascript"]`);
          if (existingScript) {
            script.remove();
            return;
          }
          
          const newScript = document.createElement('script');
          for (let attr of script.attributes) {
            if (attr.name !== 'type' && 
                attr.name !== 'data-blocked-by-consent' && 
                attr.name !== 'data-blocked-by-ccpa' &&
                attr.name !== 'data-blocked-by-targeted-advertising' &&
                attr.name !== 'data-blocked-by-sale') {
              newScript.setAttribute(attr.name, attr.value);
            }
          }
          newScript.type = 'text/javascript';
          newScript.onload = function() {
            ensureGtagInitialization();
          };
          script.parentNode.insertBefore(newScript, script);
          script.remove();
        } catch (error) {
          // Fallback: just change type if creating new script fails
          script.type = 'text/javascript';
          script.removeAttribute('data-blocked-by-consent');
          script.removeAttribute('data-blocked-by-ccpa');
        }
      } else {
        // For inline scripts, just change type and remove attributes
        script.type = 'text/javascript';
        script.removeAttribute('data-blocked-by-consent');
        script.removeAttribute('data-blocked-by-ccpa');
        script.removeAttribute('data-blocked-by-targeted-advertising');
        script.removeAttribute('data-blocked-by-sale');
        
        if (script.innerHTML) {
          try {
            eval(script.innerHTML);
          } catch (e) {
          }
        }
      }
    });
    
    removeDuplicateScripts();
    
    setTimeout(ensureGtagInitialization, 100);
  }
  function enableScriptsByCategories(allowedCategories) {
    // CRITICAL: First, ensure all Google scripts are unblocked
    unblockGoogleScripts();
    
    // Enable scripts based on categories (including Google scripts) in head section only
    var scripts = document.head.querySelectorAll('script[data-category]');
    var scriptsToEnable = [];
    
    scripts.forEach(function (script) {
      // Skip Google scripts - they're already handled by unblockGoogleScripts()
      if (isGoogleScript(script)) {
        return; // Skip Google scripts
      }
      var category = script.getAttribute('data-category');
      if (category) {
        var categories = category.split(',').map(function (cat) { return cat.trim().toLowerCase(); });
        var shouldEnable = categories.some(function (cat) {
          // Check for exact match or partial match (e.g., 'analytics' matches 'analytics_storage')
          return allowedCategories.some(function (allowedCat) {
            var allowedCatLower = allowedCat.toLowerCase();
            return cat === allowedCatLower || cat.includes(allowedCatLower) || allowedCatLower.includes(cat);
          });
        });
        
        if (shouldEnable) {
          // Check if script is blocked (either by type or attribute)
          var isBlocked = script.type === 'text/plain' || 
                         script.hasAttribute('data-blocked-by-consent') || 
                         script.hasAttribute('data-blocked-by-ccpa');
          
          if (isBlocked) {
            scriptsToEnable.push(script);
          }
        }
      }
    });
    
    scriptsToEnable.forEach(function (script) {
      // Re-execute the script if it has a src attribute
      if (script.src) {
        try {
          // Check if a script with this src already exists and is enabled
          const existingScript = document.querySelector(`script[src="${script.src}"][type="text/javascript"]`);
          if (existingScript) {
            // Just remove the blocked version
            script.remove();
            return;
          }
          
          // Create a new script element to force re-execution
          const newScript = document.createElement('script');
          
          // Copy all attributes except blocking ones
          for (let attr of script.attributes) {
            if (attr.name !== 'type' && 
                attr.name !== 'data-blocked-by-consent' && 
                attr.name !== 'data-blocked-by-ccpa') {
              newScript.setAttribute(attr.name, attr.value);
            }
          }
          
          // Ensure proper type
          newScript.type = 'text/javascript';
          
          // Add error handling for script loading
          newScript.onerror = function() {
            // Script failed to load
          };
          newScript.onload = function() {
            // Script loaded successfully - ensure gtag is available
            ensureGtagInitialization();
          };
          
          // Insert the new script before the old one, then remove the old one
          script.parentNode.insertBefore(newScript, script);
          script.remove();
        } catch (error) {
          // Error re-executing script
        }
      } else {
        // For inline scripts, just change the type
        script.type = 'text/javascript';
        script.removeAttribute('data-blocked-by-consent');
        script.removeAttribute('data-blocked-by-ccpa');
        script.removeAttribute('data-blocked-by-targeted-advertising');
        script.removeAttribute('data-blocked-by-sale');
        
        // Execute the script if it has inline content
        if (script.innerHTML) {
          try {
            eval(script.innerHTML);
          } catch (e) {
            // Error executing re-enabled script
          }
        }
      }
    });
    
    // Remove any duplicates that might have been created
    removeDuplicateScripts();
    
    // Ensure gtag is properly initialized after all scripts are loaded
    setTimeout(ensureGtagInitialization, 100);
  }
  function updateGtagConsent(preferences) {
    // Use window.gtag to ensure we're calling the actual Google gtag function
    if (typeof window.gtag === "function") {
      // Handle CCPA preferences (doNotShare/doNotSell) vs GDPR preferences (analytics/marketing/personalization)
      let analyticsStorage = 'denied';
      let adStorage = 'denied';
      let adPersonalization = 'denied';
      let adUserData = 'denied';
      let personalizationStorage = 'denied';
      
      if (preferences.hasOwnProperty('doNotShare') || preferences.hasOwnProperty('doNotSell')) {
        // CCPA mode: If doNotShare is false, grant all consent
        // If doNotShare is true, deny all consent
        const allowTracking = !preferences.doNotShare;
        analyticsStorage = allowTracking ? 'granted' : 'denied';
        adStorage = allowTracking ? 'granted' : 'denied';
        adPersonalization = allowTracking ? 'granted' : 'denied';
        adUserData = allowTracking ? 'granted' : 'denied';
        personalizationStorage = allowTracking ? 'granted' : 'denied';
      } else {
        // GDPR mode: Use individual category preferences
        analyticsStorage = preferences.analytics ? 'granted' : 'denied';
        adStorage = preferences.marketing ? 'granted' : 'denied';
        adPersonalization = preferences.marketing ? 'granted' : 'denied';
        adUserData = preferences.marketing ? 'granted' : 'denied';
        personalizationStorage = preferences.personalization ? 'granted' : 'denied';
      }
      
      window.gtag('consent', 'update', {
        'analytics_storage': analyticsStorage,
        'functionality_storage': 'granted',
        'ad_storage': adStorage,
        'ad_personalization': adPersonalization,
        'ad_user_data': adUserData,
        'personalization_storage': personalizationStorage,
        'security_storage': 'granted'
      });
    }

    // Push consent update event to dataLayer
    if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push({
        'event': 'consent_update',
        'consent_analytics': preferences.analytics !== undefined ? preferences.analytics : (!preferences.doNotShare),
        'consent_marketing': preferences.marketing !== undefined ? preferences.marketing : (!preferences.doNotShare),
        'consent_personalization': preferences.personalization !== undefined ? preferences.personalization : (!preferences.doNotShare),
        'do_not_share': preferences.doNotShare !== undefined ? preferences.doNotShare : false
      });
    }
  }
  async function setConsentState(preferences, cookieDays) {
    ['analytics', 'marketing', 'personalization'].forEach(function (category) {
      setConsentCookie(
        'cb-consent-' + category + '_storage',
        preferences[category] ? 'true' : 'false',
        cookieDays || 365
      );
    });

    // Save CCPA "do-not-share" preference if it exists
    if (preferences.hasOwnProperty('doNotShare')) {
      setConsentCookie(
        'cb-consent-donotshare',
        preferences.doNotShare ? 'true' : 'false',
        cookieDays || 365
      );
    }

    // Store encrypted preferences in localStorage
    await storeEncryptedPreferences(preferences);

    updateGtagConsent(preferences);
    const expiresAt = Date.now() + (cookieDays * 24 * 60 * 60 * 1000);
    localStorage.setItem('_cb_cea_', expiresAt.toString());
    localStorage.setItem('_cb_ced_', cookieDays.toString());
  }
  // Encrypt and store preferences in localStorage
  async function storeEncryptedPreferences(preferences) {
    try {
      const preferencesString = JSON.stringify(preferences);
      const encryptedData = await encryptWithHardcodedKey(preferencesString);
      localStorage.setItem('_cb_ecp_', encryptedData);
    } catch (error) {
      // Silent error handling
    }
  }

  // Decrypt and retrieve preferences from localStorage
  async function getDecryptedPreferences() {
    try {
      const encryptedData = localStorage.getItem('_cb_ecp_');
      if (!encryptedData) {
        return null;
      }

      // Decrypt the data
      const key = await importHardcodedKey();
      const iv = base64ToUint8Array(ENCRYPTION_IV);
      const encryptedBytes = base64ToUint8Array(encryptedData);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedBytes
      );

      const decryptedString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decryptedString);
    } catch (error) {
      // Silent error handling
      return null;
    }
  }

  async function getConsentPreferences() {
    // Try to get from encrypted localStorage first
    const encryptedPrefs = await getDecryptedPreferences();
    if (encryptedPrefs) {
      return encryptedPrefs;
    }

    // Fallback to cookies for backward compatibility
    return {
      analytics: getConsentCookie('_cb_cas_') === 'true',
      marketing: getConsentCookie('_cb_cms_') === 'true',
      personalization: getConsentCookie('_cb_cps_') === 'true',
      doNotShare: getConsentCookie('cb-consent-donotshare') === 'true'  // Convert to camelCase for consistency
    };
  }
  function showBanner(banner) {
    if (banner) {
      banner.style.setProperty("display", "block", "important");
      banner.style.setProperty("visibility", "visible", "important");
      banner.style.setProperty("opacity", "1", "important");
      banner.classList.add("show-banner");
      banner.classList.remove("hidden");
      
      // Disable scroll only if banner has data-cookie-banner="true" and scroll-control is enabled
      const scrollControl = document.querySelector('[scroll-control="true"]');
      if (scrollControl) {
        // Check the banner element directly - if it has an ID, re-query from DOM to ensure latest state
        let bannerToCheck = banner;
        if (banner.id) {
          const domBanner = document.getElementById(banner.id);
          if (domBanner) {
            bannerToCheck = domBanner;
          }
        }
        
        // Check if banner has data-cookie-banner="true" attribute
        if (bannerToCheck.hasAttribute('data-cookie-banner') && 
            bannerToCheck.getAttribute('data-cookie-banner') === 'true') {
          document.body.style.overflow = "hidden";
        }
      }
    }
  }
  function hideBanner(banner) {
    if (banner) {
      banner.style.setProperty("display", "none", "important");
      banner.style.setProperty("visibility", "hidden", "important");
      banner.style.setProperty("opacity", "0", "important");
      banner.classList.remove("show-banner");
      banner.classList.add("hidden");
      
      // Re-enable scroll only if banner with data-cookie-banner="true" is hidden
      const scrollControl = document.querySelector('[scroll-control="true"]');
      if (scrollControl) {
        // Check the banner element directly - if it has an ID, re-query from DOM to ensure latest state
        let bannerToCheck = banner;
        if (banner.id) {
          const domBanner = document.getElementById(banner.id);
          if (domBanner) {
            bannerToCheck = domBanner;
          }
        }
        
        if (bannerToCheck.hasAttribute('data-cookie-banner') && bannerToCheck.getAttribute('data-cookie-banner') === 'true') {
          // Check if any banner with data-cookie-banner="true" is still visible
          const cookieBanners = document.querySelectorAll('[data-cookie-banner="true"]');
          let anyVisible = false;
          
          cookieBanners.forEach(function(cookieBanner) {
            const style = window.getComputedStyle(cookieBanner);
            if (style.display !== "none" && 
                style.visibility !== "hidden" &&
                style.opacity !== "0") {
              anyVisible = true;
            }
          });
          
          if (!anyVisible) {
            document.body.style.overflow = "";
          }
        }
      }
    }
  }
  async function hideAllBanners() {
    hideBanner(document.getElementById("consent-banner"));
    hideBanner(document.getElementById("initial-consent-banner"));
    hideBanner(document.getElementById("main-banner"));
    hideBanner(document.getElementById("main-consent-banner"));
    hideBanner(document.getElementById("simple-consent-banner"));
    
    
  }



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


  function clearVisitorSession() {
    localStorage.removeItem('_cb_vid_');
    localStorage.removeItem('_cb_vst_');
    localStorage.removeItem('_cb_cg_');
    localStorage.removeItem('_cb_cea_');
    localStorage.removeItem('_cb_ced_');
    localStorage.removeItem('_cb_rtc_');
  }


  let tokenRequestInProgress = false;
  async function getVisitorSessionToken() {
    try {
      // Check retry count - maximum 5 requests
      const retryCount = parseInt(localStorage.getItem('_cb_rtc_') || '0', 10);
      if (retryCount >= 5) {
        return null; // Stop after 5 attempts
      }

      if (tokenRequestInProgress) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const existingToken = localStorage.getItem('_cb_vst_');
        if (existingToken && !isTokenExpired(existingToken)) {
          // Reset retry count on successful token retrieval
          localStorage.removeItem('_cb_rtc_');
          return existingToken;
        }
      }
  
      const existingToken = localStorage.getItem('_cb_vst_');
      if (existingToken && !isTokenExpired(existingToken)) {
        // Reset retry count on successful token retrieval
        localStorage.removeItem('_cb_rtc_');
        return existingToken;
      }
  
      tokenRequestInProgress = true;
      
      // Increment retry count before making request
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
          siteName: siteName
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If response has retry: false, don't retry
        if (errorData.retry === false) {
          return null; // Stop here, don't retry
        }
  
        // Only retry on 500 errors if retry is not false and retry count is less than 5
        if (response.status === 500 && errorData.retry !== false && retryCount < 4) {
          clearVisitorSession();
          const newVisitorId = await getOrCreateVisitorId();
          const retryResponse = await fetch('https://consentbit-test-server.web-8fb.workers.dev/api/visitor-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              visitorId: newVisitorId,
              siteName: siteName
            })
          });
  
          if (!retryResponse.ok) {
            const retryErrorData = await retryResponse.json().catch(() => ({}));
            
            // Check retry response too
            if (retryErrorData.retry === false) {
              return null; // Stop retrying
            }
            
            throw new Error(`Retry failed after clearing session: ${retryResponse.status}`);
          }
  
          const retryData = await retryResponse.json();
          localStorage.setItem('_cb_vst_', retryData.token);
          // Reset retry count on success
          localStorage.removeItem('_cb_rtc_');
          return retryData.token;
        }
  
        throw new Error(`Failed to get visitor session token: ${response.status}`);
      }
  
      const data = await response.json();
      localStorage.setItem('_cb_vst_', data.token);
      // Reset retry count on success
      localStorage.removeItem('_cb_rtc_');
      return data.token;
  
    } catch (error) {
      return null;
    } finally {
      tokenRequestInProgress = false;
    }
  }


  async function fetchCookieExpirationDays() {
    const sessionToken = localStorage.getItem("_cb_vst_");
    if (!sessionToken) return 180;
    try {
      const siteName = window.location.hostname.replace(/^www\./, '').split('.')[0];
      const apiUrl = `https://consentbit-test-server.web-8fb.workers.dev/api/app-data?siteName=${encodeURIComponent(siteName)}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${sessionToken}`,
          "Accept": "application/json"
        }
      });
      if (!response.ok) return 180;
      const data = await response.json();
      if (data && data.cookieExpiration !== null && data.cookieExpiration !== undefined) {
        return parseInt(data.cookieExpiration, 10);
      }
      return 180;
    } catch {
      return 180;
    }
  }




    let country = null;
  
  // CLIENT-SIDE DETECTION REMOVED - Using server-side only
  
  // Show CCPA banner
  function showCCPABanner() {
    hideBanner(document.getElementById("consent-banner"));
    showBanner(document.getElementById("initial-consent-banner"));
  }
  
  // Show GDPR banner  
  function showGDPRBanner() {
    hideBanner(document.getElementById("initial-consent-banner"));
    showBanner(document.getElementById("consent-banner"));
  }
  
  // Consolidated function to show appropriate banner based on data-all-banners and location
  // Works for both consent-given and consent-not-given cases
  async function showAppropriateBanner() {
    hideAllBanners();
    
    const allBannersElement = document.querySelector('[data-all-banners]');
    const hasAllBannersAttribute = allBannersElement && allBannersElement.hasAttribute('data-all-banners');
    const allBannersValue = hasAllBannersAttribute ? allBannersElement.getAttribute('data-all-banners') : null;
    const locationData = await window.getLocationData();
    
    if (hasAllBannersAttribute && allBannersValue === 'false') {
        showGDPRBanner();
        return;
    }
    else{
      
      if (locationData && locationData.bannerType) {
        if (["CCPA", "VCDPA", "CPA", "CTDPA", "UCPA"].includes(locationData.bannerType) || locationData.country === "US") {
          if (initialCCPABanner) {
            showBanner(initialCCPABanner);
          }
        } else {
          showGDPRBanner();
        }
      }
    }
    
 
  }
  
  // Server-side location detection functions removed - using direct server detection only
  
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
        bannerType: data.bannerType
      };
      currentLocation = locationData;
      country = locationData.country;
      return data;
    } catch (error) {
      return null;
    }
  }
  
  // Global function to get location data (cached, can be called from anywhere)
  window.getLocationData = async function(forceRefresh = false) {
    // Return cached data if available and not forcing refresh
    if (window.locationData && !forceRefresh) {
      return window.locationData;
    }
    
    // If detection is already in progress, wait for it
    if (locationDetectionPromise) {
      return await locationDetectionPromise;
    }
    
    // Start new detection
    locationDetectionPromise = (async () => {
      try {
        const data = await detectLocationAndGetBannerType();
        if (data) {
          // Store globally for reuse
          window.locationData = {
            country: data.country || 'UNKNOWN',
            continent: data.continent || 'UNKNOWN',
            state: data.state || null,
            bannerType: data.bannerType
          };
          return window.locationData;
        }
        return null;
      } catch (error) {
        return null;
      } finally {
        locationDetectionPromise = null; // Clear promise when done
      }
    })();
    
    return await locationDetectionPromise;
  };


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




      const fullPayload = {
        clientId,
        visitorId,
        preferences,
        policyVersion,
        timestamp,
        country: country || "IN",
        bannerType: preferences.bannerType || "GDPR",
        expiresAtTimestamp: Date.now() + ((cookieDays || 365) * 24 * 60 * 60 * 1000),
        expirationDurationDays: cookieDays || 365,
        metadata: {
          ...(includeUserAgent && { userAgent: navigator.userAgent }),
          language: navigator.language,
          platform: navigator.userAgentData?.platform || "unknown",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };


      const encryptedPayload = await encryptWithHardcodedKey(JSON.stringify(fullPayload));


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
      marketingCheckbox.checked = Boolean(preferences.marketing);
    }
    if (personalizationCheckbox) {
      personalizationCheckbox.checked = Boolean(preferences.personalization);
    }
    if (analyticsCheckbox) {
      analyticsCheckbox.checked = Boolean(preferences.analytics);
    }
  }


  function updateCCPAPreferenceForm(preferences) {

    const doNotShareCheckbox = document.querySelector('[data-consent-id="do-not-share-checkbox"]');



    if (doNotShareCheckbox) {

      if (preferences.hasOwnProperty('doNotShare')) {
        doNotShareCheckbox.checked = preferences.doNotShare;
      } else if (preferences.hasOwnProperty('donotshare')) {
        doNotShareCheckbox.checked = preferences.donotshare;
      } else {

        const shouldCheck = !preferences.analytics || !preferences.marketing || !preferences.personalization;
        doNotShareCheckbox.checked = shouldCheck;
      }
    }


    const ccpaToggleCheckboxes = document.querySelectorAll('.consentbit-ccpa-prefrence-toggle input[type="checkbox"]');
    ccpaToggleCheckboxes.forEach(checkbox => {
      const checkboxName = checkbox.name || checkbox.getAttribute('data-category') || '';

      if (checkboxName.toLowerCase().includes('analytics')) {
        checkbox.checked = !Boolean(preferences.analytics);
      } else if (checkboxName.toLowerCase().includes('marketing') || checkboxName.toLowerCase().includes('advertising')) {
        checkbox.checked = !Boolean(preferences.marketing);
      } else if (checkboxName.toLowerCase().includes('personalization') || checkboxName.toLowerCase().includes('functional')) {
        checkbox.checked = !Boolean(preferences.personalization);
      }
    });
  }

  async function checkPublishingStatus() {
    try {
      const sessionToken = localStorage.getItem('_cb_vst_');
      if (!sessionToken) {
        return { canPublish: false, data: null };
      }
      const siteDomain = window.location.hostname;
      
      // Get siteId from data-site-info attribute if available
      let siteId = null;
      const siteInfoElement = document.querySelector('[data-site-info]');
      if (siteInfoElement) {
        const siteInfo = siteInfoElement.getAttribute('data-site-info');
        if (siteInfo) {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(siteInfo);
            siteId = parsed.siteId || parsed.id || siteInfo;
          } catch (e) {
            // If not JSON, use the value directly
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
        return { canPublish: false, data: null };
      }
      const data = await response.json();
      return { 
        canPublish: data.canPublishToCustomDomain === true,
        data: data // Return full response data (includes location if available)
      };
    } catch (error) {
      return { canPublish: false, data: null };
    }
  }
  function removeConsentElements() {    const selectors = [
      '.consentbit-gdpr-banner-div',
      '.consentbit-preference_div',
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


  // --- Load Consent Styles (Non-blocking) ---
  function loadConsentStyles() {
    try {
      // Load CSS asynchronously to avoid blocking render
      // Use media="print" trick to load CSS without blocking, then switch to "all"
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://consentbit-test-server.web-8fb.workers.dev/consentbitstyle.css";
      link.type = "text/css";
      link.media = "print"; // Load without blocking
      link.onload = function() { 
        this.media = "all"; // Switch to all media after load
      };
      link.onerror = function () {};
      
      const link2 = document.createElement("link");
      link2.rel = "stylesheet";
      link2.href = "https://consentbit-test-server.web-8fb.workers.dev/consentbit.css";
      link2.type = "text/css";
      link2.media = "print"; // Load without blocking
      link2.onload = function() { 
        this.media = "all"; // Switch to all media after load
      };
      link2.onerror = function () {};
      
      // Append both links (non-blocking)
      document.head.appendChild(link2);
      document.head.appendChild(link);
    } catch (error) {
      // Silent error handling
    }
  }
  function monitorDynamicScripts() {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1 && node.tagName === 'SCRIPT') {

            // Only block scripts with data-category attribute
            // Scripts without data-category are allowed (functionality scripts)
            if (!node.hasAttribute('data-category')) {
              return; // Skip blocking scripts without data-category (functionality scripts)
            }

            // CRITICAL: Never block Google Tag Manager/Google Analytics scripts
            // Even if they have data-category attribute, they use Consent Mode
            // If it's a Google script, ensure it's unblocked immediately
            if (isGoogleScript(node)) {
              if (node.type === 'text/plain') {
                node.type = 'text/javascript';
              }
              node.removeAttribute('data-blocked-by-consent');
              node.removeAttribute('data-blocked-by-ccpa');
              node.removeAttribute('data-category');
              return; // Exit early for Google scripts - don't block them
            }

            const analyticsConsent = localStorage.getItem("_cb_cas_");
            const marketingConsent = localStorage.getItem("_cb_cms_");
            const personalizationConsent = localStorage.getItem("_cb_cps_");
            const consentGiven = localStorage.getItem("_cb_cg_");


            if (node.hasAttribute('data-category')) {
              const category = node.getAttribute('data-category');
              const categories = category.split(',').map(function (cat) { return cat.trim(); });

              // Check if ANY category is necessary or essential (these should never be blocked)
              var hasEssentialCategory = categories.some(function (cat) {
                var lowercaseCat = cat.toLowerCase();
                return lowercaseCat === 'necessary' || lowercaseCat === 'essential';
              });


              if (!hasEssentialCategory && consentGiven === "true") {
                var shouldBlock = false;


                categories.forEach(function (cat) {
                  var lowercaseCat = cat.toLowerCase();
                  if (lowercaseCat === 'analytics' && analyticsConsent === "false") {
                    shouldBlock = true;
                  } else if ((lowercaseCat === 'marketing' || lowercaseCat === 'advertising') && marketingConsent === "false") {
                    shouldBlock = true;
                  } else if ((lowercaseCat === 'personalization' || lowercaseCat === 'functional') && personalizationConsent === "false") {
                    shouldBlock = true;
                  }
                });

                if (shouldBlock) {
                  node.type = 'text/plain';
                  node.setAttribute('data-blocked-by-consent', 'true');
                }
              }
            } else {

              if (node.src && (
                node.src.includes('facebook.net') ||
                node.src.includes('fbcdn.net') ||
                node.src.includes('hotjar.com') ||
                node.src.includes('mixpanel.com') ||
                node.src.includes('intercom.io') ||
                node.src.includes('klaviyo.com') ||
                node.src.includes('tiktok.com') ||
                node.src.includes('linkedin.com') ||
                node.src.includes('twitter.com') ||
                node.src.includes('adobe.com')
              )) {

                if (analyticsConsent === "false" && marketingConsent === "false") {
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


  // CRITICAL: Unblock Google scripts immediately when script loads (before DOMContentLoaded)
  // This ensures Google scripts with type="text/plain" are unblocked as soon as possible
  unblockGoogleScripts();
  
  // Load styles and monitor scripts after initial render to avoid blocking
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Unblock Google scripts again during DOMContentLoaded to catch any scripts added dynamically
      unblockGoogleScripts();
      
      // Defer CSS loading slightly to avoid blocking initial render
      requestAnimationFrame(function() {
        loadConsentStyles();
      });
      monitorDynamicScripts();
    });
  } else {
    // DOM already loaded, unblock Google scripts immediately
    unblockGoogleScripts();
    
    // Defer CSS loading slightly to avoid blocking initial render
    requestAnimationFrame(function() {
      loadConsentStyles();
    });
    monitorDynamicScripts();
  }



  async function checkConsentExpiration() {
    const expiresAt = localStorage.getItem('_cb_cea_');
    if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {

      localStorage.removeItem('_cb_cg_');
      localStorage.removeItem('_cb_cp_');
      localStorage.removeItem('_cb_cea_');
      localStorage.removeItem('_cb_ced_');

      ['analytics', 'marketing', 'personalization'].forEach(category => {
        setConsentCookie('cb-consent-' + category + '_storage', '', -1);
      });
    }
  }

 
  async function disableScrollOnSite(){
    const scrollControl = document.querySelector('[scroll-control="true"]');
    if (!scrollControl) return;
    
    function checkAndUpdateScroll() {
      // Check all banners with data-cookie-banner="true"
      const cookieBanners = document.querySelectorAll('[data-cookie-banner="true"]');
      let anyVisible = false;
      
      cookieBanners.forEach(function(banner) {
        const style = window.getComputedStyle(banner);
        if (style.display !== "none" && 
            style.visibility !== "hidden" &&
            style.opacity !== "0") {
          anyVisible = true;
        }
      });
      
      // If any banner with data-cookie-banner="true" is visible, disable scroll
      // If no banners are visible, enable scroll
      document.body.style.overflow = anyVisible ? "hidden" : "";
    }
    
    // Set up MutationObserver for all banners with data-cookie-banner="true"
    const cookieBanners = document.querySelectorAll('[data-cookie-banner="true"]');
    cookieBanners.forEach(function(banner) {
      const observer = new MutationObserver(() => {
        checkAndUpdateScroll();
      });
      observer.observe(banner, { attributes: true, attributeFilter: ["style", "class"] });
    });
    
    // Initial check on load
    checkAndUpdateScroll();
  }

  document.addEventListener('DOMContentLoaded', async function () {
    
    unblockGoogleScripts();
    
    // STEP 1: Check if consent is already given - if yes, don't do banner/location logic
    const consentGiven = localStorage.getItem("_cb_cg_");
    console.log('[ConsentBit Debug] STEP 1 - Consent Check:', {
      consentGiven: consentGiven,
      timestamp: new Date().toISOString()
    });
    
    // STEP 2: Check staging status synchronously (needed for toggle button visibility)
    const isStaging = isStagingHostname();
    console.log('[ConsentBit Debug] STEP 2 - Staging Check:', {
      isStaging: isStaging,
      hostname: window.location.hostname
    });
    
    let token = localStorage.getItem('_cb_vst_');
    console.log('[ConsentBit Debug] Token Check:', {
      hasToken: !!token,
      tokenExists: !!localStorage.getItem('_cb_vst_')
    });
    
    if (!token && !consentGiven) {
      // Generate token if not available
      console.log('[ConsentBit Debug] Generating new token...');
      try {
        token = await getVisitorSessionToken();
        if (token && !localStorage.getItem('_cb_vst_')) {
          localStorage.setItem('_cb_vst_', token);
          console.log('[ConsentBit Debug] Token generated and stored:', !!token);
        }
      } catch (error) {
        console.error('[ConsentBit Debug] Token generation error:', error);
      }
    }
    
    let canPublish = false;
    
    // Check publishing status for ALL sites (staging and non-staging) to get location data
    let publishingStatusResult = null;
    let detectedLocation = null;
    
    // ALWAYS check publishing status to get location data from response
    console.log('[ConsentBit Debug] STEP 3 - Checking publishing status...');
    publishingStatusResult = await checkPublishingStatus();
    canPublish = publishingStatusResult ? publishingStatusResult.canPublish : false;
    
    console.log('[ConsentBit Debug] Publishing Status Result:', {
      canPublish: canPublish,
      hasData: !!publishingStatusResult?.data,
      hasLocation: !!(publishingStatusResult?.data?.location),
      locationData: publishingStatusResult?.data?.location || null
    });
    
    // For non-staging sites, check if canPublish and exit if false
    if (!isStaging && !canPublish) {
      console.log('[ConsentBit Debug] Non-staging site - canPublish is false, removing consent elements');
      removeConsentElements();
      return;
    }
   
    // OPTIMIZATION: Extract and store location data to window if available in response
    if (publishingStatusResult && publishingStatusResult.data && publishingStatusResult.data.location) {
      const locationData = publishingStatusResult.data.location;
      console.log('[ConsentBit Debug] STEP 4 - Extracting location from publishing status response:', locationData);
      
      detectedLocation = {
        country: locationData.country || 'UNKNOWN',
        continent: locationData.continent || 'UNKNOWN',
        state: locationData.state || null,
        city: locationData.city || null,
        region: locationData.region || null,
        timezone: locationData.timezone || null,
        bannerType: locationData.bannerType || 'GDPR',
        isEU: locationData.isEU || false
      };
      // Store in global window.locationData for reuse throughout the application
      window.locationData = detectedLocation;
      console.log('[ConsentBit Debug] Location stored in window.locationData:', window.locationData);
    } else {
      console.log('[ConsentBit Debug] No location data in publishing status response, will use fallback');
    }
   
    // Update preference forms if consent already given
    if (consentGiven) {
      console.log('[ConsentBit Debug] STEP 5 - Consent already given, updating preference forms...');
      if (typeof updatePreferenceForm === 'function') {
        setTimeout(async () => {
          const preferences = await getConsentPreferences();
          console.log('[ConsentBit Debug] Preference form updated with:', preferences);
          updatePreferenceForm(preferences);
        }, 100);
      } else {
        console.warn('[ConsentBit Debug] updatePreferenceForm function not found');
      }
    }
    
    // STEP 3: Show toggle button immediately if staging (don't wait for canPublish check)
    const toggleConsentBtn = document.getElementById('toggle-consent-btn');
    if (toggleConsentBtn) {
      // Show toggle button immediately if staging or canPublish is true
      if (isStaging || canPublish) {
        toggleConsentBtn.style.display = 'block';
        console.log('[ConsentBit Debug] Toggle button shown:', { isStaging, canPublish });
      } else {
        console.log('[ConsentBit Debug] Toggle button hidden:', { isStaging, canPublish });
      }
      
      // Set up click handler immediately - consolidated banner display logic
      toggleConsentBtn.onclick = async function (e) {
        e.preventDefault();
        console.log('[ConsentBit Debug] Toggle button clicked');
        await showAppropriateBanner();
      };
    } else {
      console.log('[ConsentBit Debug] Toggle button not found in DOM');
    }

    // STEP 4: Show banner if consent not given
    if (!consentGiven) {
      console.log('[ConsentBit Debug] STEP 6 - Consent not given, showing banner...');
      // Hide all banners first (before showing appropriate one)
      hideAllBanners();
      
      // If location was already detected from publishing status, use it
      // Otherwise, detect location (for staging sites or if location not in response)
      if (!detectedLocation) {
        console.log('[ConsentBit Debug] Location not in publishing status, calling getLocationData()...');
        detectedLocation = await window.getLocationData();
        console.log('[ConsentBit Debug] Location from getLocationData():', detectedLocation);
      } else {
        console.log('[ConsentBit Debug] Using location from publishing status response');
      }
    
      await showAppropriateBanner();
      console.log('[ConsentBit Debug] Banner shown');
    } else {
      console.log('[ConsentBit Debug] Consent already given, skipping banner display');
    }
    
   
    // Set up GDPR banner buttons IMMEDIATELY (before async operations)
    // Preferences button (show preferences panel)
    const preferencesBtn = document.getElementById('preferences-btn');
    if (preferencesBtn) {
      preferencesBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        // IMMEDIATE UI RESPONSE - synchronous
        const consentBanner = document.getElementById("consent-banner");
        const mainBanner = document.getElementById("main-banner");
        if (consentBanner) hideBanner(consentBanner);
        if (mainBanner) showBanner(mainBanner);
        
        // Background operations (non-blocking)
        setTimeout(function() {
          getConsentPreferences().then(preferences => {
            updatePreferenceForm(preferences);
          }).catch(error => {
            // Silent error handling
          });
        }, 0);
      };
    }

    // Cancel button (go back to main banner)
    const cancelGDPRBtn = document.getElementById('cancel-btn');
    if (cancelGDPRBtn) {
      cancelGDPRBtn.onclick = async function (e) {
        e.preventDefault();
        // STEP 6: Hide banners
        hideBanner(document.getElementById("main-banner"));
        hideBanner(document.getElementById("consent-banner"));
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
          analytics: false,
          marketing: false,
          personalization: false,
          bannerType: window.locationData ? window.locationData.bannerType : undefined
        };

        await setConsentState(preferences, cookieDays);
        updateGtagConsent(preferences);

        // STEP 5: Set consent as given and save to server
        localStorage.setItem("_cb_cg_", "true");

        try {
          await saveConsentStateToServer(preferences, cookieDays, false); // Exclude userAgent like decline
        } catch (error) {
          // Silent error handling
        }
      };
    }
    // Accept all
    const acceptBtn = document.getElementById('accept-btn');
    if (acceptBtn) {
      acceptBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        // IMMEDIATE UI RESPONSE: Hide banners synchronously
        hideBanner(document.getElementById("consent-banner"));
        hideBanner(document.getElementById("initial-consent-banner"));
        hideBanner(document.getElementById("main-banner"));
        hideBanner(document.getElementById("main-consent-banner"));
        hideBanner(document.getElementById("simple-consent-banner"));
        localStorage.setItem("_cb_cg_", "true");
        
        // CRITICAL: Update Google Consent Mode IMMEDIATELY and SYNCHRONOUSLY
        const preferences = { 
          analytics: true, 
          marketing: true, 
          personalization: true, 
          doNotShare: false, 
          action: 'acceptance', 
          bannerType: window.locationData ? window.locationData.bannerType : undefined 
        };
        updateGtagConsent(preferences);
        
        // Background operations (non-blocking)
        setTimeout(function() {
          // Enable scripts immediately for better UX
          enableAllScriptsWithDataCategory();
          
          // Do heavy operations in background
          Promise.all([
            setConsentState(preferences, cookieDays),
            saveConsentStateToServer(preferences, cookieDays, true)
          ]).catch(error => {
          });
        }, 0);
      };
    }

    // Reject all
    const declineBtn = document.getElementById('decline-btn');
    if (declineBtn) {
      declineBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        // IMMEDIATE UI RESPONSE: Hide banners synchronously
        hideBanner(document.getElementById("consent-banner"));
        hideBanner(document.getElementById("initial-consent-banner"));
        hideBanner(document.getElementById("main-banner"));
        hideBanner(document.getElementById("main-consent-banner"));
        hideBanner(document.getElementById("simple-consent-banner"));
        localStorage.setItem("_cb_cg_", "true");
        
        // CRITICAL: Update Consent Mode IMMEDIATELY and SYNCHRONOUSLY so GTM can respond
        const preferences = { 
          analytics: false, 
          marketing: false, 
          personalization: false, 
          doNotShare: true, 
          action: 'rejection', 
          bannerType: window.locationData ? window.locationData.bannerType : undefined 
        };
        updateGtagConsent(preferences);
        
        // Background operations (non-blocking)
        setTimeout(function() {
          // Block scripts with data-category immediately
          blockScriptsByCategory();
          
          // Only block scripts with data-category attribute (except Google scripts)
          // Scripts without data-category are allowed to run (functionality scripts)
          var allScripts = document.head.querySelectorAll('script[src]');
          allScripts.forEach(function (script) {
            // Skip Google scripts (they use Consent Mode)
            if (isGoogleScript(script)) {
              return;
            }
            
            // Only block scripts with data-category attribute (already handled by blockScriptsByCategory)
            // Scripts without data-category are allowed (functionality scripts)
            // No need to block them here - blockScriptsByCategory handles data-category scripts
          });
          
          // Block inline scripts in head section (only if they have data-category)
          var inlineScripts = document.head.querySelectorAll('script:not([src])');
          inlineScripts.forEach(function (script) {
            if (!script.innerHTML) return;
            
            // Don't block dataLayer initialization or gtag consent commands
            var isGoogleConsentScript = script.innerHTML && (
              script.innerHTML.includes('dataLayer') ||
              script.innerHTML.includes('gtag') ||
              script.innerHTML.includes('googletagmanager')
            );
            
            if (isGoogleConsentScript) {
              return; // Skip Google consent scripts
            }
            
            // Only block if script has data-category attribute (handled by blockScriptsByCategory)
            // Scripts without data-category are allowed (functionality scripts)
          });
          
          // Background operations (saving cookies, server calls, etc.)
          Promise.all([
            setConsentState(preferences, cookieDays),
            saveConsentStateToServer(preferences, cookieDays, false)
          ]).catch(error => {
          });
        }, 0);
      };
    }

    // Set up close buttons IMMEDIATELY
    setupConsentbitCloseButtons();
  
 
    
   
    // POST-BANNER OPERATIONS (after banner is visible)
    
    // 1. Enable scroll control
    await disableScrollOnSite();
    
    // 2. Check consent expiration
    checkConsentExpiration();
    
    // 3. Scan and send scripts (in background - deferred to avoid blocking)
    // Use requestIdleCallback if available, otherwise setTimeout to defer execution
    const currentToken = localStorage.getItem('_cb_vst_');
    if (currentToken) {
      const deferredExecution = () => {
        // Defer even more to ensure it doesn't block critical rendering
        setTimeout(() => {
          scanAndSendHeadScriptsIfChanged(currentToken)
            .catch(error => {
              // Silent error handling
            });
        }, 2000); // Wait 2 seconds after page load to avoid blocking
      };
      
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(deferredExecution, { timeout: 5000 });
      } else {
        // Fallback: defer by 2 seconds
        setTimeout(deferredExecution, 2000);
      }
    }
    
    let cookieDays = await fetchCookieExpirationDays();
    const prefs = await getConsentPreferences();
    updatePreferenceForm(prefs);



    
    // Do Not Share (CCPA)
    const doNotShareBtn = document.getElementById('do-not-share-link');
    if (doNotShareBtn) {
      doNotShareBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();

        // IMMEDIATE UI RESPONSE - synchronous
        hideBanner(document.getElementById("initial-consent-banner"));
        const mainBanner = document.getElementById('main-consent-banner');
        if (mainBanner) {
          showBanner(mainBanner);
          
          // Background operations (non-blocking)
          setTimeout(function() {
            getConsentPreferences().then(preferences => {
              updateCCPAPreferenceForm(preferences);
            }).catch(error => {
              // Silent error handling
            });
          }, 0);
        }
      };
    }

          // CCPA Preference Accept button
      const ccpaPreferenceAcceptBtn = document.getElementById('consebit-ccpa-prefrence-accept');
      if (ccpaPreferenceAcceptBtn) {
        ccpaPreferenceAcceptBtn.onclick = async function (e) {
          e.preventDefault();

          // IMMEDIATE UI RESPONSE: Hide banners first
          hideBanner(document.getElementById("initial-consent-banner"));
          const ccpaPreferencePanel = document.querySelector('.consentbit-ccpa_preference');
          hideBanner(ccpaPreferencePanel);
          const ccpaBannerDiv = document.querySelector('.consentbit-ccpa-banner-div');
          hideBanner(ccpaBannerDiv);
          localStorage.setItem("_cb_cg_", "true");

          // Read the do-not-share checkbox value
          const doNotShareCheckbox = document.querySelector('[data-consent-id="do-not-share-checkbox"]');
          let preferences;
          
          // CRITICAL: Update Google Consent Mode IMMEDIATELY based on checkbox state

          if (doNotShareCheckbox && doNotShareCheckbox.checked) {
            // Checkbox checked means "Do Not Share" - block based on US law type
            preferences = {
             
              doNotShare: true,  // Changed to camelCase to match server expectation
              doNotSell: true,   // Added to match server expectation
              action: 'rejection',
              bannerType: window.locationData ? window.locationData.bannerType : undefined
            };
            
            // CRITICAL: Update Google Consent Mode IMMEDIATELY
            updateGtagConsent(preferences);

            // For CCPA: Disable Webflow Analytics when "Do Not Share" is checked
            localStorage.setItem("_cb_cas_", "false");
            disableWebflowAnalytics();

            // Apply law-specific blocking based on banner type
            if (window.locationData && ["VCDPA", "CPA", "CTDPA", "UCPA"].includes(window.locationData.bannerType)) {
              // Enhanced privacy laws with granular opt-out requirements
              blockTargetedAdvertisingScripts();
              blockSaleScripts();
              blockProfilingScripts();
              blockCrossContextBehavioralAdvertising();
              blockAutomatedDecisionScripts();
            } else {
              // CCPA - block all scripts with data-category attribute
              blockScriptsWithDataCategory();
            }
          } else {
            // Checkbox unchecked means "Allow" - unblock all scripts
            preferences = {
             
              doNotShare: false,  // Changed to camelCase to match server expectation
              doNotSell: false,   // Added to match server expectation
              action: 'acceptance',
              bannerType: window.locationData ? window.locationData.bannerType : undefined
            };
            
            // CRITICAL: Update Google Consent Mode IMMEDIATELY
            updateGtagConsent(preferences);
            
            // For CCPA: Enable Webflow Analytics when "Do Not Share" is unchecked
            localStorage.setItem("_cb_cas_", "true");
            enableWebflowAnalytics();
            
            // Unblock all scripts
            unblockScriptsWithDataCategory();

            // Also unblock any scripts that might have been blocked by the initial blocking
            var allBlockedScripts = document.head.querySelectorAll('script[type="text/plain"][data-category]');
            allBlockedScripts.forEach(function (oldScript) {
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

          // Background operations - don't block UI
          Promise.all([
            setConsentState(preferences, cookieDays),
            saveConsentStateToServer(preferences, cookieDays, true)
          ]).catch(error => {
            // Silent error handling
          });
        };
      }

          // CCPA Preference Decline button
      const ccpaPreferenceDeclineBtn = document.getElementById('consebit-ccpa-prefrence-decline');
      if (ccpaPreferenceDeclineBtn) {
        ccpaPreferenceDeclineBtn.onclick = async function (e) {
          e.preventDefault();

          // IMMEDIATE UI RESPONSE: Hide banners and block scripts
          hideBanner(document.getElementById("initial-consent-banner"));
          const ccpaPreferencePanel = document.querySelector('.consentbit-ccpa_preference');
          hideBanner(ccpaPreferencePanel);
          const ccpaBannerDiv = document.querySelector('.consentbit-ccpa-banner-div');
          hideBanner(ccpaBannerDiv);
          localStorage.setItem("_cb_cg_", "true");
          localStorage.setItem("_cb_cas_", "false");
          
          // CRITICAL: Update Google Consent Mode IMMEDIATELY
          const preferences = {
            doNotShare: true,
            doNotSell: true,
            action: 'rejection',
            bannerType: window.locationData ? window.locationData.bannerType : undefined
          };
          updateGtagConsent(preferences);
          
          // Block scripts immediately
          blockScriptsByCategory();
          disableWebflowAnalytics();

          Promise.all([
            setConsentState(preferences, cookieDays),
            saveConsentStateToServer(preferences, cookieDays, true)
          ]).catch(error => {
            // Silent error handling
          });
        };
      }

          // Save button (CCPA)
      const saveBtn = document.getElementById('save-btn');
      if (saveBtn) {
        saveBtn.onclick = async function (e) {
          e.preventDefault();

          // IMMEDIATE UI RESPONSE: Hide banners first
          const mainConsentBanner = document.getElementById('main-consent-banner');
          const initialConsentBanner = document.getElementById('initial-consent-banner');
          if (mainConsentBanner) hideBanner(mainConsentBanner);
          if (initialConsentBanner) hideBanner(initialConsentBanner);
          localStorage.setItem("_cb_cg_", "true");

          // Read the do-not-share checkbox value
          const doNotShareCheckbox = document.querySelector('[data-consent-id="do-not-share-checkbox"]');
          let preferences;
          let includeUserAgent;

          if (doNotShareCheckbox && doNotShareCheckbox.checked) {
            // Checkbox checked means "Do Not Share" - block all scripts and restrict userAgent
            preferences = {
             
              doNotShare: true,  // Changed to camelCase to match server expectation
              doNotSell: true,   // Added to match server expectation
              action: 'rejection',
              bannerType: window.locationData ? window.locationData.bannerType : undefined
            };
            includeUserAgent = false; // Restrict userAgent
            
            // CRITICAL: Update Google Consent Mode IMMEDIATELY
            updateGtagConsent(preferences);
            
            // For CCPA: Disable Webflow Analytics when "Do Not Share" is checked
            localStorage.setItem("_cb_cas_", "false");
            disableWebflowAnalytics();
          } else {
            // Checkbox unchecked means "Allow" - unblock all scripts and allow userAgent
            preferences = {
              
              doNotShare: false,  // Changed to camelCase to match server expectation
              doNotSell: false,   // Added to match server expectation
              action: 'acceptance',
              bannerType: window.locationData ? window.locationData.bannerType : undefined
            };
            includeUserAgent = true; // Allow userAgent
            
            // CRITICAL: Update Google Consent Mode IMMEDIATELY
            updateGtagConsent(preferences);
            
            // For CCPA: Enable Webflow Analytics when "Do Not Share" is unchecked
            localStorage.setItem("_cb_cas_", "true");
            enableWebflowAnalytics();
          }

          // Handle script blocking/unblocking immediately
          if (doNotShareCheckbox && doNotShareCheckbox.checked) {
            blockScriptsWithDataCategory();
          } else {
            unblockScriptsWithDataCategory();
          }

          // Background operations
          Promise.all([
            setConsentState(preferences, cookieDays),
            saveConsentStateToServer(preferences, cookieDays, includeUserAgent)
          ]).catch(error => {
            // Silent error handling
          });
        };
      }

    // Save Preferences button
    const savePreferencesBtn = document.getElementById('save-preferences-btn');
    if (savePreferencesBtn) {
      savePreferencesBtn.onclick = async function (e) {
        e.preventDefault();
        
        // IMMEDIATE UI RESPONSE: Hide banners first
        hideBanner(document.getElementById("main-banner"));
        hideBanner(document.getElementById("consent-banner"));
        hideBanner(document.getElementById("initial-consent-banner"));
        localStorage.setItem("_cb_cg_", "true");
        
        // Read checkboxes and handle scripts immediately
        const analytics = !!document.querySelector('[data-consent-id="analytics-checkbox"]:checked');
        const marketing = !!document.querySelector('[data-consent-id="marketing-checkbox"]:checked');
        const personalization = !!document.querySelector('[data-consent-id="personalization-checkbox"]:checked');
        
        // CRITICAL: Update Consent Mode IMMEDIATELY and SYNCHRONOUSLY so GTM can respond
        const preferences = {
          analytics: analytics,
          marketing: marketing,
          personalization: personalization,
          action: (analytics || marketing || personalization) ? 'acceptance' : 'rejection',
          bannerType: window.locationData ? window.locationData.bannerType : undefined
        };
        updateGtagConsent(preferences);
        
        // Block ALL scripts first, then enable selected categories
        blockScriptsByCategory();
        const selectedCategories = [];
        if (analytics) selectedCategories.push('analytics');
        if (marketing) selectedCategories.push('marketing');
        if (personalization) selectedCategories.push('personalization');
        
        if (selectedCategories.length > 0) {
          enableScriptsByCategories(selectedCategories);
          
          // Also unblock ALL other scripts that were blocked (including those without data-category)
          // Change type from text/plain to text/javascript and remove blocking attributes
          var allBlockedScripts = document.head.querySelectorAll('script[type="text/plain"]');
          allBlockedScripts.forEach(function (script) {
            // Unblock all scripts (they were blocked before consent)
            if (script.src) {
              try {
                const existingScript = document.querySelector(`script[src="${script.src}"][type="text/javascript"]`);
                if (existingScript) {
                  script.remove();
                  return;
                }
                
                const newScript = document.createElement('script');
                for (let attr of script.attributes) {
                  if (attr.name !== 'type' && 
                      attr.name !== 'data-blocked-by-consent' && 
                      attr.name !== 'data-blocked-by-ccpa' &&
                      attr.name !== 'data-blocked-by-targeted-advertising' &&
                      attr.name !== 'data-blocked-by-sale') {
                    newScript.setAttribute(attr.name, attr.value);
                  }
                }
                newScript.type = 'text/javascript';
                newScript.onload = function() {
                  ensureGtagInitialization();
                };
                script.parentNode.insertBefore(newScript, script);
                script.remove();
              } catch (error) {
                // Fallback: just change type if creating new script fails
                script.type = 'text/javascript';
                script.removeAttribute('data-blocked-by-consent');
                script.removeAttribute('data-blocked-by-ccpa');
              }
            } else {
              // For inline scripts, just change type and remove attributes
              script.type = 'text/javascript';
              script.removeAttribute('data-blocked-by-consent');
              script.removeAttribute('data-blocked-by-ccpa');
              script.removeAttribute('data-blocked-by-targeted-advertising');
              script.removeAttribute('data-blocked-by-sale');
              
              if (script.innerHTML) {
                try {
                  eval(script.innerHTML);
                } catch (e) {
                }
              }
            }
          });
        }

        // Background operations (saving cookies, server calls, etc.)
        Promise.all([
          setConsentState(preferences, cookieDays),
          saveConsentStateToServer(preferences, cookieDays, true)
        ]).catch(error => {
          // Silent error handling
        });
      };
    }

    // Cancel button handler is already set up earlier (before async operations)

    // Universal close button handler - handles both consentbit="close" and id="close-consent-banner"
    function setupConsentbitCloseButtons() {
      // Handle elements with consentbit="close" attribute
      const closeButtons = document.querySelectorAll('[consentbit="close"]');
      closeButtons.forEach(function (closeBtn) {
        // Check if handler already attached (to avoid duplicates)
        if (closeBtn.hasAttribute('data-close-handler-attached')) {
          return;
        }
        
        // Mark as handled
        closeBtn.setAttribute('data-close-handler-attached', 'true');
        
        closeBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();

          // IMMEDIATE RESPONSE: Find and hide the currently visible banner synchronously
          // Check banners in order of likelihood for faster response
          const bannerIds = [
            "consent-banner",
            "initial-consent-banner", 
            "main-banner",
            "main-consent-banner",
            "simple-consent-banner"
          ];
          
          let activeBanner = null;
          
          // First check by ID (faster)
          for (let i = 0; i < bannerIds.length; i++) {
            const banner = document.getElementById(bannerIds[i]);
            if (banner) {
              const style = window.getComputedStyle(banner);
              if (style.display !== 'none' && 
                  style.visibility !== 'hidden' && 
                  style.opacity !== '0') {
                activeBanner = banner;
                break;
              }
            }
          }
          
          // If not found by ID, check by class (slower, but needed for some banners)
          if (!activeBanner) {
            const classSelectors = [
              '.consentbit-ccpa-banner-div',
              '.consentbit-ccpa_preference',
              '.consentbit-gdpr-banner-div',
              '.consentbit-preference_div'
            ];
            
            for (let i = 0; i < classSelectors.length; i++) {
              const banner = document.querySelector(classSelectors[i]);
              if (banner) {
                const style = window.getComputedStyle(banner);
                if (style.display !== 'none' && 
                    style.visibility !== 'hidden' && 
                    style.opacity !== '0') {
                  
                  // Special case: If consentbit-preference_div is visible, prioritize its parent main-banner
                  if (banner.classList.contains('consentbit-preference_div')) {
                    const mainBanner = document.getElementById('main-banner');
                    if (mainBanner) {
                      const mainStyle = window.getComputedStyle(mainBanner);
                      if (mainStyle.display !== 'none' &&
                          mainStyle.visibility !== 'hidden' &&
                          mainStyle.opacity !== '0') {
                        activeBanner = mainBanner;
                        break;
                      }
                    }
                  }
                  
                  activeBanner = banner;
                  break;
                }
              }
            }
          }
          
          // Hide the banner immediately (synchronous)
          if (activeBanner) {
            hideBanner(activeBanner);
          }
        }, true);
      });
      
      // Also handle elements with id="close-consent-banner" (handles duplicate IDs)
      const cancelBtns = document.querySelectorAll('#close-consent-banner');
      cancelBtns.forEach(function(cancelBtn) {
        // Skip if already handled above (has consentbit="close")
        if (cancelBtn.hasAttribute('data-close-handler-attached')) {
          return;
        }
        
        // Mark as handled
        cancelBtn.setAttribute('data-close-handler-attached', 'true');
        
        cancelBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();

          // Find the currently visible banner by checking all possible banner elements
          const banners = [
            document.getElementById("consent-banner"),
            document.getElementById("initial-consent-banner"),
            document.getElementById("main-banner"),
            document.getElementById("main-consent-banner"),
            document.getElementById("simple-consent-banner"),
            document.querySelector('.consentbit-ccpa-banner-div'),
            document.querySelector('.consentbit-ccpa_preference'),
            document.querySelector('.consentbit-gdpr-banner-div'),
            document.querySelector('.consentbit-preference_div'),
          ];

          // Find the currently visible banner
          let activeBanner = null;
          banners.forEach(function (banner) {
            if (banner && window.getComputedStyle(banner).display !== 'none' &&
              window.getComputedStyle(banner).visibility !== 'hidden' &&
              window.getComputedStyle(banner).opacity !== '0') {
              
              // Special case: If consentbit-preference_div is visible, prioritize its parent main-banner
              if (banner.classList.contains('consentbit-preference_div')) {
                const mainBanner = document.getElementById('main-banner');
                if (mainBanner && window.getComputedStyle(mainBanner).display !== 'none' &&
                  window.getComputedStyle(mainBanner).visibility !== 'hidden' &&
                  window.getComputedStyle(mainBanner).opacity !== '0') {
                  activeBanner = mainBanner; // Use parent main-banner instead
                  return;
                }
              }
              
              activeBanner = banner;
            }
          });
          
          // Hide the currently active banner
          if (activeBanner) {
            hideBanner(activeBanner);
          }
        }, true);
      });
    }

    // Universal "Do Not Share" link with consentbit-data-donotshare="consentbit-link-donotshare" attribute
    function setupDoNotShareLinks() {
      const doNotShareLinks = document.querySelectorAll('[consentbit-data-donotshare="consentbit-link-donotshare"]');
      doNotShareLinks.forEach(function (link) {
        link.onclick = async function (e) {
          e.preventDefault();

          // Hide all other banners first
          hideAllBanners();

          // Check for data-all-banners attribute first
          const allBannersElement = document.querySelector('[data-all-banners]');
          const allBannersValue = allBannersElement ? allBannersElement.getAttribute('data-all-banners') : null;
          
          if (allBannersValue === 'false') {
            // Force GDPR banner when data-all-banners=false (display immediately, no location detection needed)
            showGDPRBanner();
          } else {
            // When data-all-banners="true" or missing, ALWAYS wait for location detection before displaying banner
            const currentLocationData = await window.getLocationData();
            
            if (currentLocationData && currentLocationData.bannerType) {
              // Display appropriate banner based on detected location
              if (["CCPA", "VCDPA", "CPA", "CTDPA", "UCPA"].includes(currentLocationData.bannerType) || currentLocationData.country === "US") {
                // Show the CCPA banner with ID "main-consent-banner"
                const ccpaBanner = document.getElementById("main-consent-banner");
                if (ccpaBanner) {
                  showBanner(ccpaBanner);
                  const preferences = await getConsentPreferences();
                  updateCCPAPreferenceForm(preferences);
                }
              } else {
                // Show GDPR banner for other locations
                showGDPRBanner();
              }
            }
            // If location detection fails, don't show any banner
          }
        };
      });
    }


    // Set up close buttons and do not share links when DOM is ready
    setupConsentbitCloseButtons();
    setupDoNotShareLinks();

    // Monitor for dynamically added close buttons and do not share links
    const closeButtonObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            // Check if the added node is a close button (consentbit="close" or id="close-consent-banner")
            if (node.hasAttribute && node.hasAttribute('consentbit') && node.getAttribute('consentbit') === 'close') {
              setupConsentbitCloseButtons();
            }
            // Check if the added node has id="close-consent-banner"
            if (node.id === 'close-consent-banner') {
              setupConsentbitCloseButtons();
            }
            // Check if any child elements are close buttons
            const closeButtons = node.querySelectorAll && node.querySelectorAll('[consentbit="close"], #close-consent-banner');
            if (closeButtons && closeButtons.length > 0) {
              setupConsentbitCloseButtons();
            }

            // Check if the added node is a do not share link
            if (node.hasAttribute && node.hasAttribute('consentbit-data-donotshare') && node.getAttribute('consentbit-data-donotshare') === 'consentbit-link-donotshare') {
              setupDoNotShareLinks();
            }
            

          }
        });
      });
    });

    // Start observing for dynamically added close buttons and do not share links
    closeButtonObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // CCPA Link Block - Show CCPA Banner (only if data-all-banners is not "false")
    const ccpaLinkBlock = document.getElementById('consentbit-ccpa-linkblock');
    if (ccpaLinkBlock) {
      ccpaLinkBlock.onclick = function (e) {
        e.preventDefault();

        // Check data-all-banners attribute - if "false", show GDPR banner instead
        const allBannersElement = document.querySelector('[data-all-banners]');
        const hasAllBannersAttribute = allBannersElement && allBannersElement.hasAttribute('data-all-banners');
        const allBannersValue = hasAllBannersAttribute ? allBannersElement.getAttribute('data-all-banners') : null;
        
        if (hasAllBannersAttribute && allBannersValue === 'false') {
          // Show GDPR banner when data-all-banners="false"
          showGDPRBanner();
        } else {
          // Show CCPA banner only when data-all-banners is not "false"
          const ccpaBannerDiv = document.querySelector('.consentbit-ccpa-banner-div');
          showBanner(ccpaBannerDiv);
          
          // Also show the CCPA banner if it exists
          showBanner(document.getElementById("initial-consent-banner"));
        }
      };
    }

    // If consent is already given, hide all banners and do not show any
    if (consentGiven === "true") {
      await hideAllBanners();

      // Unblock scripts based on saved consent preferences
      const savedPreferences = await getConsentPreferences();
      
      // CRITICAL FIX: Update Google consent state with saved preferences
      updateGtagConsent(savedPreferences);
      
      // CRITICAL FIX: Initialize Webflow Analytics based on saved consent
      if (savedPreferences.analytics) {
        enableWebflowAnalytics();
      } else {
        disableWebflowAnalytics();
      }
      
      // CRITICAL FIX: Handle case where no consent is given (all denied)
      if (!savedPreferences.analytics && !savedPreferences.marketing && !savedPreferences.personalization) {
        // Block all scripts if no consent is given
        blockScriptsByCategory();
      } else if (savedPreferences.analytics || savedPreferences.marketing || savedPreferences.personalization) {
        // If any consent is given, unblock appropriate scripts
        const selectedCategories = Object.keys(savedPreferences).filter(k => savedPreferences[k] && k !== 'doNotShare');
        if (selectedCategories.length > 0) {
          enableScriptsByCategories(selectedCategories);

          // Also unblock any scripts that might have been blocked
          var allBlockedScripts = document.head.querySelectorAll('script[type="text/plain"][data-category]');
          allBlockedScripts.forEach(function (oldScript) {
            var category = oldScript.getAttribute('data-category');
            if (category) {
              var categories = category.split(',').map(function (cat) { return cat.trim(); });
              var shouldEnable = categories.some(function (cat) {
                return selectedCategories.includes(cat);
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
      }

      // Do not show any banner unless user clicks the icon
      return;
    }

    // Banner already shown earlier - just handle server location data if available
    if (!consentGiven) {
      // Check data-all-banners attribute first
      const allBannersElement = document.querySelector('[data-all-banners]');
      const hasAllBannersAttribute = allBannersElement && allBannersElement.hasAttribute('data-all-banners');
      const allBannersValue = hasAllBannersAttribute ? allBannersElement.getAttribute('data-all-banners') : null;
      
      // If data-all-banners="false", skip location-based banner display (GDPR already shown)
      if (hasAllBannersAttribute && allBannersValue === 'false') {
        // GDPR banner already shown, skip CCPA banner display
        return;
      }
      
      // Also handle server-detected location data  
      if (window.locationData && window.locationData.bannerType) {
        if (["CCPA", "VCDPA", "CPA", "CTDPA", "UCPA"].includes(window.locationData.bannerType)) {
          // US Privacy Laws: Ensure all scripts are unblocked initially (opt-out model)
          // For CCPA, scripts should start as text/javascript, not text/plain
          
          // CRITICAL: First, ensure all Google scripts are unblocked
          unblockGoogleScripts();
          
          // First remove any duplicate scripts
          removeDuplicateScripts();
          
          var allBlockedScripts = document.head.querySelectorAll('script[type="text/plain"][data-category]');
        
        allBlockedScripts.forEach(function (script) {
          // Skip Google scripts - they're already handled by unblockGoogleScripts()
          if (isGoogleScript(script)) {
            return; // Skip Google scripts
          }
          // Re-execute the script if it has a src attribute
          if (script.src) {
            try {
              // Check if a script with this src already exists and is enabled
              const existingScript = document.querySelector(`script[src="${script.src}"][type="text/javascript"]`);
              if (existingScript) {
                // Just remove the blocked version
                script.remove();
                return;
              }
              
              // Create a new script element to force re-execution
              const newScript = document.createElement('script');
              
              // Copy all attributes except blocking ones
              for (let attr of script.attributes) {
                if (attr.name !== 'type' && 
                    attr.name !== 'data-blocked-by-consent' && 
                    attr.name !== 'data-blocked-by-ccpa') {
                  newScript.setAttribute(attr.name, attr.value);
                }
              }
              
              // Ensure proper type
              newScript.type = 'text/javascript';
              
              // Insert the new script before the old one, then remove the old one
              script.parentNode.insertBefore(newScript, script);
              script.remove();
            } catch (error) {
              // Error re-executing script
            }
          } else {
            // For inline scripts, just change the type
            script.type = 'text/javascript';
            script.removeAttribute('data-blocked-by-consent');
            script.removeAttribute('data-blocked-by-ccpa');
          }
        });

        // Also unblock any scripts that might have been blocked by initial blocking
        var allBlockedScripts2 = document.head.querySelectorAll('script[type="text/plain"]');
        allBlockedScripts2.forEach(function (script) {
          // Skip Google scripts - they're already handled by unblockGoogleScripts()
          if (isGoogleScript(script)) {
            return; // Skip Google scripts
          }
          // Re-execute the script if it has a src attribute
          if (script.src) {
            try {
              // Check if a script with this src already exists and is enabled
              const existingScript = document.querySelector(`script[src="${script.src}"][type="text/javascript"]`);
              if (existingScript) {
                // Just remove the blocked version
                script.remove();
                return;
              }
              
              // Create a new script element to force re-execution
              const newScript = document.createElement('script');
              
              // Copy all attributes except blocking ones
              for (let attr of script.attributes) {
                if (attr.name !== 'type' && 
                    attr.name !== 'data-blocked-by-consent' && 
                    attr.name !== 'data-blocked-by-ccpa') {
                  newScript.setAttribute(attr.name, attr.value);
                }
              }
              
              // Ensure proper type
              newScript.type = 'text/javascript';
              
              // Insert the new script before the old one, then remove the old one
              script.parentNode.insertBefore(newScript, script);
                script.remove();
            } catch (error) {
              // Error re-executing script
            }
          } else {
            // For inline scripts, just change the type
            script.type = 'text/javascript';
            script.removeAttribute('data-blocked-by-consent');
            script.removeAttribute('data-blocked-by-ccpa');
          }
        });

                  // For CCPA/US Privacy Laws: Scripts start enabled but banner must be shown
          // User must explicitly accept or decline through banner interaction
          // BUT: If data-all-banners="false", show GDPR banner instead of CCPA

        // Check data-all-banners attribute - if "false", show GDPR banner instead
        const allBannersElementCheck = document.querySelector('[data-all-banners]');
        const hasAllBannersAttributeCheck = allBannersElementCheck && allBannersElementCheck.hasAttribute('data-all-banners');
        const allBannersValueCheck = hasAllBannersAttributeCheck ? allBannersElementCheck.getAttribute('data-all-banners') : null;
        
        if (hasAllBannersAttributeCheck && allBannersValueCheck === 'false') {
          // Show GDPR banner when data-all-banners="false" (even if location is CCPA)
          showBanner(document.getElementById("consent-banner"));
          hideBanner(document.getElementById("initial-consent-banner"));
        } else {
          // Show CCPA banner only when data-all-banners is not "false"
          showBanner(document.getElementById("initial-consent-banner"));
          hideBanner(document.getElementById("consent-banner"));
        }


              } else {
          // Show GDPR banner (default for EU and other locations)
          showBanner(document.getElementById("consent-banner"));
          hideBanner(document.getElementById("initial-consent-banner"));
          blockScriptsByCategory();
        }
      }
    }



    
    // Styles are already loaded when DOM is ready
    
    // Initialize Webflow Analytics integration
    initializeWebflowAnalytics();
    
    // Start monitoring for consent changes
    monitorConsentChanges();
  });

  // End DOMContentLoaded event listener

  // --- CCPA-specific script handling functions ---
  function unblockScriptsWithDataCategory() {
    // CRITICAL: First, ensure all Google scripts are unblocked
    unblockGoogleScripts();
    
    // CCPA: Unblock ALL scripts with data-category attribute (including Google scripts) in head section only
    var scripts = document.head.querySelectorAll('script[type="text/plain"][data-category]');
    scripts.forEach(function (script) {
      // Skip Google scripts - they're already handled by unblockGoogleScripts()
      if (isGoogleScript(script)) {
        return; // Skip Google scripts
      }
      
      // Re-execute the script if it has a src attribute
      if (script.src) {
        try {
          // Check if a script with this src already exists and is enabled
          const existingScript = document.querySelector(`script[src="${script.src}"][type="text/javascript"]`);
          if (existingScript) {
            // Just remove the blocked version
            script.remove();
            return;
          }
          
          // Create a new script element to force re-execution
          const newScript = document.createElement('script');
          
          // Copy all attributes except blocking ones
          for (let attr of script.attributes) {
            if (attr.name !== 'type' && 
                attr.name !== 'data-blocked-by-consent' && 
                attr.name !== 'data-blocked-by-ccpa') {
              newScript.setAttribute(attr.name, attr.value);
            }
          }
          
          // Ensure proper type
          newScript.type = 'text/javascript';
          
          // Insert the new script before the old one, then remove the old one
          script.parentNode.insertBefore(newScript, script);
          script.remove();
        } catch (error) {
          // Silent error handling
        }
      } else {
        // For inline scripts, just change the type
        script.type = 'text/javascript';
        script.removeAttribute('data-blocked-by-ccpa');
        
        // Execute the script if it has inline content
        if (script.innerHTML) {
          try {
            eval(script.innerHTML);
          } catch (e) {
            // Silent error handling
          }
        }
      }
    });
    
    // Ensure gtag is properly initialized after all scripts are loaded
    setTimeout(ensureGtagInitialization, 100);
  }

  function blockScriptsWithDataCategory() {
    // CRITICAL: First, ensure all Google scripts are unblocked
    unblockGoogleScripts();
    
    // CCPA: Block ALL scripts with data-category attribute (except Google scripts) in head section only
    var scripts = document.head.querySelectorAll('script[data-category]');
    scripts.forEach(function (script) {
      // CRITICAL: Never block Google Tag Manager/Google Analytics scripts
      // Even if they have data-category attribute, they use Consent Mode
      // Skip Google scripts - they're controlled by Consent Mode, not script blocking
      if (isGoogleScript(script)) {
        return; // Exit early for Google scripts - don't block them
      }
      
      // Block non-Google scripts with data-category
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
    // Early return if no token
    if (!sessionToken) {
      return;
    }

    const headScripts = document.head.querySelectorAll('script');
    const scriptData = Array.from(headScripts).map(script => ({
      src: script.src || null,
      content: script.src ? null : script.innerHTML,
      dataCategory: script.getAttribute('data-category') || null
    }));
    const scriptDataString = JSON.stringify(scriptData);
    const scriptDataHash = await hashStringSHA256(scriptDataString);

    const cachedHash = localStorage.getItem('_cb_hsh_');
    if (cachedHash === scriptDataHash) {
      return; // No change, do nothing
    }

    try {
      const encryptedScriptData = await encryptWithHardcodedKey(scriptDataString);

      // Get siteName from hostname
      const siteName = window.location.hostname.replace(/^www\./, '').split('.')[0];

      // Build API URL with siteName parameter
      const apiUrl = `https://consentbit-test-server.web-8fb.workers.dev/api/v2/cmp/head-scripts?siteName=${encodeURIComponent(siteName)}`;

      // Add timeout to prevent blocking (5 second max wait)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ encryptedData: encryptedScriptData }),
          signal: controller.signal, // Add abort signal for timeout
          // Use keepalive to prevent blocking page unload
          keepalive: true
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          localStorage.setItem('_cb_hsh_', scriptDataHash);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // If timeout or network error, fail silently (non-critical operation)
        if (fetchError.name !== 'AbortError') {
          // Only log non-timeout errors if needed
        }
      }
    } catch (e) {
      // Silent error handling for encryption/other errors
    }
  }

  function blockTargetedAdvertisingScripts() {
    // Only block scripts with data-category attribute
    const targetedAdvertisingPatterns = /facebook|meta|fbevents|linkedin|twitter|pinterest|tiktok|snap|reddit|quora|outbrain|taboola|sharethrough|doubleclick|adwords|adsense|adservice|pixel|quantserve|scorecardresearch|moat|integral-marketing|comscore|nielsen|quantcast|adobe/i;

    const scripts = document.head.querySelectorAll('script[src][data-category]');
    scripts.forEach(script => {
      // CRITICAL: Never block Google scripts even if they match pattern
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
    // Only block scripts with data-category attribute
    const salePatterns = /facebook|meta|fbevents|linkedin|twitter|pinterest|tiktok|snap|reddit|quora|outbrain|taboola|sharethrough|doubleclick|adwords|adsense|adservice|pixel|quantserve|scorecardresearch|moat|integral-marketing|comscore|nielsen|quantcast|adobe|marketo|hubspot|salesforce|pardot|eloqua|act-on|mailchimp|constantcontact|sendgrid|klaviyo|braze|iterable/i;

    const scripts = document.head.querySelectorAll('script[src][data-category]');
    scripts.forEach(script => {
      // CRITICAL: Never block Google scripts even if they match pattern
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
    // Only block scripts with data-category attribute
    const profilingPatterns = /optimizely|hubspot|marketo|pardot|salesforce|intercom|drift|zendesk|freshchat|tawk|livechat|clarity|hotjar|mouseflow|fullstory|logrocket|mixpanel|segment|amplitude|heap|kissmetrics|matomo|piwik|plausible|woopra|crazyegg|clicktale|chartbeat|parse\.ly/i;

    const scripts = document.head.querySelectorAll('script[src][data-category]');
    scripts.forEach(script => {
      // CRITICAL: Never block Google scripts even if they match pattern
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
    // Only block scripts with data-category attribute
    const crossContextPatterns = /facebook|meta|fbevents|linkedin|twitter|pinterest|tiktok|snap|reddit|quora|outbrain|taboola|sharethrough|doubleclick|adwords|adsense|adservice|pixel|quantserve|scorecardresearch|moat|integral-marketing|comscore|nielsen|quantcast|adobe/i;

    const scripts = document.head.querySelectorAll('script[src][data-category]');
    scripts.forEach(script => {
      // CRITICAL: Never block Google scripts even if they match pattern
      if (isGoogleScript(script)) {
        return; // Skip Google scripts
      }
      
      if (crossContextPatterns.test(script.src)) {
        if (script.type !== 'text/plain') {
          script.type = 'text/plain';
          script.setAttribute('data-blocked-by-cross-context', 'true');
        }
      }
    });
  }

  function blockAutomatedDecisionScripts() {
    // Only block scripts with data-category attribute
    const automatedDecisionPatterns = /optimizely|hubspot|marketo|pardot|salesforce|intercom|drift|zendesk|freshchat|tawk|livechat|clarity|hotjar|mouseflow|fullstory|logrocket|mixpanel|segment|amplitude|heap|kissmetrics|matomo|piwik|plausible|woopra|crazyegg|clicktale|chartbeat|parse\.ly/i;
    
    const scripts = document.head.querySelectorAll('script[src][data-category]');
    scripts.forEach(script => {
      // CRITICAL: Never block Google scripts even if they match pattern
      if (isGoogleScript(script)) {
        return; // Skip Google scripts
      }
      
      if (automatedDecisionPatterns.test(script.src)) {
        if (script.type !== 'text/plain') {
          script.type = 'text/plain';
          script.setAttribute('data-blocked-by-automated-decision', 'true');
        }
      }
    });
  }

  // ========================================
  // WEBFLOW ANALYTICS INTEGRATION
  // ========================================

  // Configuration for Webflow Analytics integration
  const WEBFLOW_ANALYTICS_CONFIG = {
    enabled: true,
    trackPageViews: true,
    trackForms: true,
    trackClicks: true,
    trackEvents: true,
    debugMode: false,
    scriptUrl: "https://cdn.webflow.com/analyze.js" // Webflow Analytics script URL
  };

  // Dynamically load Webflow Analytics script based on consent
  function enableWebflowAnalytics() {
    if (typeof window.WebflowAnalytics === "undefined") {
      try {
        // Check if script is already being loaded
        if (document.querySelector('script[src*="analyze.js"]')) {
          return;
        }

        // Create and insert Webflow Analytics script
        var script = document.createElement("script");
        script.src = WEBFLOW_ANALYTICS_CONFIG.scriptUrl;
        script.async = true;
        script.onload = function() {
          // Initialize tracking after script loads
          setTimeout(initializeWebflowAnalytics, 100);
        };
        script.onerror = function() {
          // Silent error handling
        };
        
        document.head.appendChild(script);
        
       
      } catch (error) {
      }
    } else {
     
      // Initialize tracking immediately if already available
      initializeWebflowAnalytics();
    }
  }

  // Initialize Webflow Analytics when consent is given
  function initializeWebflowAnalytics() {
    if (!WEBFLOW_ANALYTICS_CONFIG.enabled) {
      return;
    }

    const consentGiven = localStorage.getItem("_cb_cg_");
    const analyticsConsent = localStorage.getItem("_cb_cas_");
    
    // Only proceed if consent is given AND analytics consent is specifically granted
    if (consentGiven === "true" && analyticsConsent === "true") {
      if (typeof window.WebflowAnalytics !== 'undefined') {
        
        // Track initial page view
        trackWebflowPageView();
        
        // Set up form tracking
        if (WEBFLOW_ANALYTICS_CONFIG.trackForms) {
          setupWebflowFormTracking();
        }
        
        // Set up click tracking
        if (WEBFLOW_ANALYTICS_CONFIG.trackClicks) {
          setupWebflowClickTracking();
        }
        
        // Track consent granted event
        trackWebflowEvent('consentbit_consent_granted', {
          category: 'consent',
          label: 'analytics_consent_granted',
          consent_categories: getActiveConsentCategories(),
          consentbit_integration: true
        });
      } else {
        // Try to load the Webflow Analytics script
        enableWebflowAnalytics();
      }
    } else {
      // If consent is revoked or analytics consent is false, ensure script is removed
      if (consentGiven === "true" && analyticsConsent === "false") {
        disableWebflowAnalytics();
      }
    }
  }

  // Track Webflow page view
  function trackWebflowPageView() {
    if (typeof window.WebflowAnalytics !== 'undefined' && getConsentBitAnalyticsConsent()) {
      try {
        window.WebflowAnalytics.track('page_view', {
          page_title: document.title,
          page_url: window.location.href,
          page_referrer: document.referrer,
          consentbit_integration: true,
          consentbit_timestamp: new Date().toISOString()
        });
      } catch (error) {
      }
    }
  }

  // Track custom events in Webflow Analytics
  function trackWebflowEvent(eventName, eventData = {}) {
    if (typeof window.WebflowAnalytics !== 'undefined' && getConsentBitAnalyticsConsent()) {
      try {
        const enhancedEventData = {
          ...eventData,
          consentbit_integration: true,
          consentbit_timestamp: new Date().toISOString()
        };
        
        window.WebflowAnalytics.track(eventName, enhancedEventData);
      } catch (error) {
      }
    }
  }

  // Set up Webflow form tracking
  function setupWebflowFormTracking() {
    if (!getConsentBitAnalyticsConsent()) return;

    document.addEventListener('submit', function(event) {
      const form = event.target;
      
      // Check if it's a Webflow form
      if (form.classList.contains('w-form') || form.hasAttribute('data-name')) {
        const formName = form.getAttribute('data-name') || 'Unknown Form';
        
        // Track form submission
        trackWebflowEvent('form_submit', {
          category: 'forms',
          label: formName,
          form_id: form.id || 'unknown',
          form_action: form.action || 'unknown',
          consentbit_form_tracking: true
        });
        
        // Track form success/failure
        setTimeout(function() {
          const successMessage = form.querySelector('.w-form-done');
          const errorMessage = form.querySelector('.w-form-fail');
          
          if (successMessage && successMessage.style.display !== 'none') {
            trackWebflowEvent('form_success', {
              category: 'forms',
              label: formName,
              form_id: form.id || 'unknown',
              consentbit_form_tracking: true
            });
          } else if (errorMessage && errorMessage.style.display !== 'none') {
            trackWebflowEvent('form_error', {
              category: 'forms',
              label: formName,
              form_id: form.id || 'unknown',
              consentbit_form_tracking: true
            });
          }
        }, 1000);
      }
    });
  }

  // Set up Webflow click tracking
  function setupWebflowClickTracking() {
    if (!getConsentBitAnalyticsConsent()) return;

    document.addEventListener('click', function(event) {
      const target = event.target;
      
      // Track button clicks
      if (target.tagName === 'BUTTON' || target.classList.contains('w-button')) {
        const buttonText = target.textContent.trim() || target.getAttribute('aria-label') || 'Unknown Button';
        const buttonId = target.id || 'unknown';
        
        trackWebflowEvent('button_click', {
          category: 'engagement',
          label: buttonText,
          button_id: buttonId,
          button_type: target.getAttribute('data-type') || 'general',
          consentbit_click_tracking: true
        });
      }
      
      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target : target.closest('a');
        const linkText = link.textContent.trim() || link.getAttribute('aria-label') || 'Unknown Link';
        const linkHref = link.href || 'unknown';
        
        trackWebflowEvent('link_click', {
          category: 'engagement',
          label: linkText,
          link_url: linkHref,
          link_type: link.getAttribute('data-type') || 'general',
          consentbit_click_tracking: true
        });
      }
    });
  }

  // Helper function to check if analytics consent is given
  function getConsentBitAnalyticsConsent() {
    const consentGiven = localStorage.getItem("_cb_cg_");
    const analyticsConsent = localStorage.getItem("_cb_cas_");
    return consentGiven === "true" && analyticsConsent === "true";
  }

  // Helper function to get active consent categories
  function getActiveConsentCategories() {
    const categories = [];
    if (localStorage.getItem("_cb_cas_") === "true") categories.push('analytics');
    if (localStorage.getItem("_cb_cms_") === "true") categories.push('marketing');
    if (localStorage.getItem("_cb_cps_") === "true") categories.push('personalization');
    return categories.join(',');
  }

  // Monitor consent changes and update Webflow Analytics
  function monitorConsentChanges() {
    let lastConsentState = getConsentBitAnalyticsConsent();
    
    setInterval(function() {
      const currentConsentState = getConsentBitAnalyticsConsent();
      
      if (currentConsentState !== lastConsentState) {
        
        if (currentConsentState) {
          // Consent granted - initialize Webflow Analytics
          initializeWebflowAnalytics();
        } else {
          // Consent revoked - track revocation event and disable
          if (typeof window.WebflowAnalytics !== 'undefined') {
            trackWebflowEvent('consentbit_consent_revoked', {
              category: 'consent',
              label: 'analytics_consent_revoked',
              consentbit_integration: true
            });
          }
          // Remove Webflow Analytics script when consent is revoked
          disableWebflowAnalytics();
        }
        
        lastConsentState = currentConsentState;
      }
    }, 2000);
  }

  // Remove Webflow Analytics script when consent is revoked
  function disableWebflowAnalytics() {
    try {
      // Remove the script tag
      const scriptTag = document.querySelector('script[src*="analyze.js"]');
      if (scriptTag) {
        scriptTag.remove();
        
      }
      
      // Clear the global object
      if (window.WebflowAnalytics) {
        delete window.WebflowAnalytics;
       
      }
    } catch (error) {
    }
  }

  // Public API for external use
  window.ConsentBitWebflowIntegration = {
    // Configuration
    config: WEBFLOW_ANALYTICS_CONFIG,
    
    // Core functions
    trackEvent: trackWebflowEvent,
    trackPageView: trackWebflowPageView,
    initialize: initializeWebflowAnalytics,
    
    // Script management
    enableAnalytics: enableWebflowAnalytics,
    disableAnalytics: disableWebflowAnalytics,
    
    // Consent functions
    getAnalyticsConsent: getConsentBitAnalyticsConsent,
    getActiveConsentCategories: getActiveConsentCategories,
    
    // Utility functions
    isWebflowAnalyticsAvailable: function() {
      return typeof window.WebflowAnalytics !== 'undefined';
    },
    
    // Configuration helpers
    enableDebugMode: function() {
      WEBFLOW_ANALYTICS_CONFIG.debugMode = true;
    },
    
    disableTracking: function() {
      WEBFLOW_ANALYTICS_CONFIG.enabled = false;
    },
    
    enableTracking: function() {
      WEBFLOW_ANALYTICS_CONFIG.enabled = true;
    }
  };

  // Set up consent event listener for external CMP integration
  document.addEventListener('consentUpdated', function(event) {
    if (event.detail && event.detail.analytics === true) {
      enableWebflowAnalytics();
    } else if (event.detail && event.detail.analytics === false) {
      disableWebflowAnalytics();
    }
  });

  // Also listen for the legacy consent event format
  document.addEventListener('consentUpdated', function(event) {
    if (window.userConsent && window.userConsent.analytics === true) {
      enableWebflowAnalytics();
    } else if (window.userConsent && window.userConsent.analytics === false) {
      disableWebflowAnalytics();
    }
  });

})();
