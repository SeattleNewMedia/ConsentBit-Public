// Script blocking/unblocking functions - loaded dynamically when consent actions occur
// This file contains functions needed only after user gives consent or when restoring saved consent

(function() {
  'use strict';

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

  // Function to ensure Google scripts are never blocked (remove type="text/plain" if present)
  function unblockGoogleScripts() {
    var allScripts = document.head.querySelectorAll('script');
    allScripts.forEach(function(script) {
      if (isGoogleScript(script)) {
        // CRITICAL: If Google script has type="text/plain", remove it so script can run
        if (script.type === 'text/plain') {
          script.removeAttribute('type');
        }
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

  // Unblocking functions
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

  // CCPA-specific blocking/unblocking functions
  function unblockScriptsWithDataCategory() {
    // First, unblock all Google scripts (they should never be blocked)
    unblockGoogleScripts();
    
    // CCPA: Unblock ALL scripts with data-category attribute (except Google scripts) in head section only
    var scripts = document.head.querySelectorAll('script[type="text/plain"][data-category]');
    scripts.forEach(function (script) {
      // Skip Google scripts - they're already unblocked above
      if (isGoogleScript(script)) {
        return;
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

  function blockScriptsByCategory() {
    // Google Consent Mode scripts should NOT be blocked
    // If they have type="text/plain", remove it so they can run
    // They handle consent internally via Consent Mode
    
    removeDuplicateScripts();
    
    var scripts = document.head.querySelectorAll('script[data-category]');
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
        return; // Exit early - don't block Google scripts
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
    
    // DO NOT block scripts without data-category - they are functionality scripts (YouTube, Maps, etc.)
    // Scripts without data-category are always allowed to run
  }

  function blockScriptsWithDataCategory() {
    // First, unblock all Google scripts (they should never be blocked)
    unblockGoogleScripts();
    
    // CCPA: Block ALL scripts with data-category attribute (except Google scripts) in head section only
    var scripts = document.head.querySelectorAll('script[data-category]');
    scripts.forEach(function (script) {
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

  // Webflow Analytics blocking/unblocking functions
  function enableWebflowAnalytics() {
    if (typeof window.WebflowAnalytics === "undefined") {
      try {
        // Check if script is already being loaded
        if (document.querySelector('script[src*="analyze.js"]')) {
          return;
        }

        // Create and insert Webflow Analytics script
        var script = document.createElement("script");
        script.src = "https://cdn.webflow.com/analyze.js";
        script.async = true;
        script.onload = function() {
          // Initialize tracking after script loads
          if (window.initializeWebflowAnalytics) {
            setTimeout(window.initializeWebflowAnalytics, 100);
          }
        };
        script.onerror = function() {
          // Silent error handling
        };
        
        document.head.appendChild(script);
      } catch (error) {
        // Silent error handling
      }
    } else {
      // Initialize tracking immediately if already available
      if (window.initializeWebflowAnalytics) {
        window.initializeWebflowAnalytics();
      }
    }
  }

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
      // Silent error handling
    }
  }

  // Export functions to window object so they're accessible from main script
  window.scriptBlocking = {
    blockScriptsByCategory: blockScriptsByCategory,
    enableAllScriptsWithDataCategory: enableAllScriptsWithDataCategory,
    enableScriptsByCategories: enableScriptsByCategories,
    unblockScriptsWithDataCategory: unblockScriptsWithDataCategory,
    blockScriptsWithDataCategory: blockScriptsWithDataCategory,
    blockTargetedAdvertisingScripts: blockTargetedAdvertisingScripts,
    blockSaleScripts: blockSaleScripts,
    blockProfilingScripts: blockProfilingScripts,
    blockCrossContextBehavioralAdvertising: blockCrossContextBehavioralAdvertising,
    blockAutomatedDecisionScripts: blockAutomatedDecisionScripts,
    enableWebflowAnalytics: enableWebflowAnalytics,
    disableWebflowAnalytics: disableWebflowAnalytics
  };

})();

