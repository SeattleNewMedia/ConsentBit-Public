// Consent-related functions - loaded dynamically after user gives consent
// This file contains functions needed only after consent is given

(function() {
  'use strict';

  // Constants (must match main file)
  const ENCRYPTION_KEY = "t95w6oAeL1hr0rrtCGKok/3GFNwxzfLxiWTETfZurpI=";
  const ENCRYPTION_IV = "yVSYDuWajEid8kDz";

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

  // Cookie helper functions (must be available)
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
  }

  // Encryption helper functions
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
      return null;
    }
  }

  // Main consent functions
  function updateGtagConsent(preferences) {
    // Create local gtag function if not available
    if (typeof window.gtag === 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() { 
        window.dataLayer.push(arguments); 
      };
    }

    if (typeof window.gtag === "function") {
      window.gtag('consent', 'update', {
        'analytics_storage': preferences.analytics ? 'granted' : 'denied',
        'functionality_storage': 'granted',
        'ad_storage': preferences.marketing ? 'granted' : 'denied',
        'ad_personalization': preferences.marketing ? 'granted' : 'denied',
        'ad_user_data': preferences.marketing ? 'granted' : 'denied',
        'personalization_storage': preferences.personalization ? 'granted' : 'denied',
        'security_storage': 'granted'
      });
    }

    // Push consent update event to dataLayer
    if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push({
        'event': 'consent_update',
        'consent_analytics': preferences.analytics,
        'consent_marketing': preferences.marketing,
        'consent_personalization': preferences.personalization
      });
    }
  }

  async function storeEncryptedPreferences(preferences) {
    try {
      const preferencesString = JSON.stringify(preferences);
      const encryptedData = await encryptWithHardcodedKey(preferencesString);
      localStorage.setItem('_cb_ecp_', encryptedData);
    } catch (error) {
      // Silent error handling
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
      doNotShare: getConsentCookie('cb-consent-donotshare') === 'true'
    };
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

  function enableAllScriptsWithDataCategory() {
    // Google Consent Mode scripts should NOT be blocked or unblocked
    // They always run and handle consent internally via Consent Mode
    // Just skip them - don't modify them at all
    
    // Enable all scripts with data-category attribute (except Google scripts)
    var scripts = document.head.querySelectorAll('script[data-category]');
    var blockedScripts = [];
    
    scripts.forEach(function (script) {
      // Skip Google scripts - don't modify them at all
      if (isGoogleScript(script)) {
        return;
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
      // Check if this is a Google script (should not have been blocked, but just in case)
      var isGoogleScriptCheck = script.src && (
        script.src.includes('googletagmanager.com') ||
        script.src.includes('google-analytics.com') ||
        script.src.includes('gtag') ||
        script.src.includes('analytics.js') ||
        script.src.includes('ga.js')
      );
      
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
    // Enable scripts based on categories (except Google scripts) in head section only
    var scripts = document.head.querySelectorAll('script[data-category]');
    var scriptsToEnable = [];
    
    scripts.forEach(function (script) {
      // CRITICAL: Never block Google scripts - if type="text/plain", remove it
      // Google Consent Mode scripts handle consent internally, don't interfere
      if (isGoogleScript(script)) {
        // If Google script has type="text/plain", remove it so script can run
        if (script.type === 'text/plain') {
          script.removeAttribute('type');
        }
        // Remove blocking attributes
        script.removeAttribute('data-blocked-by-consent');
        script.removeAttribute('data-blocked-by-ccpa');
        return; // Skip Google scripts - they're always enabled
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

  async function saveConsentStateToServer(preferences, cookieDays, includeUserAgent, country) {
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
        // Silent error handling
      }
    } catch (error) {
      // Silent error handling
    }
  }

  // Export functions to window object so they're accessible from main script
  window.consentFunctions = {
    updateGtagConsent: updateGtagConsent,
    setConsentState: setConsentState,
    storeEncryptedPreferences: storeEncryptedPreferences,
    getConsentPreferences: getConsentPreferences,
    enableAllScriptsWithDataCategory: enableAllScriptsWithDataCategory,
    enableScriptsByCategories: enableScriptsByCategories,
    saveConsentStateToServer: saveConsentStateToServer
  };

})();

