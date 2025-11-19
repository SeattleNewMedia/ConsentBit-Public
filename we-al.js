// Webflow Analytics tracking functions - loaded dynamically when consent is given
// This file contains tracking functions that run AFTER consent is granted

(function() {
  'use strict';

  // Configuration for Webflow Analytics integration
  const WEBFLOW_ANALYTICS_CONFIG = {
    enabled: true,
    trackPageViews: true,
    trackForms: true,
    trackClicks: true,
    trackEvents: true,
    debugMode: false,
    scriptUrl: "https://cdn.webflow.com/analyze.js"
  };

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
        // Silent error handling
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
        // Silent error handling
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
        if (window.scriptBlocking && window.scriptBlocking.enableWebflowAnalytics) {
          window.scriptBlocking.enableWebflowAnalytics();
        }
      }
    } else {
      // If consent is revoked or analytics consent is false, ensure script is removed
      if (consentGiven === "true" && analyticsConsent === "false") {
        if (window.scriptBlocking && window.scriptBlocking.disableWebflowAnalytics) {
          window.scriptBlocking.disableWebflowAnalytics();
        }
      }
    }
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
          if (window.scriptBlocking && window.scriptBlocking.disableWebflowAnalytics) {
            window.scriptBlocking.disableWebflowAnalytics();
          }
        }
        
        lastConsentState = currentConsentState;
      }
    }, 2000);
  }

  // Export functions to window object so they're accessible from main script
  window.webflowAnalytics = {
    config: WEBFLOW_ANALYTICS_CONFIG,
    trackPageView: trackWebflowPageView,
    trackEvent: trackWebflowEvent,
    initialize: initializeWebflowAnalytics,
    monitorConsentChanges: monitorConsentChanges,
    getAnalyticsConsent: getConsentBitAnalyticsConsent,
    getActiveConsentCategories: getActiveConsentCategories,
    enableDebugMode: function() {
      WEBFLOW_ANALYTICS_CONFIG.debugMode = true;
    },
    disableTracking: function() {
      WEBFLOW_ANALYTICS_CONFIG.enabled = false;
    },
    enableTracking: function() {
      WEBFLOW_ANALYTICS_CONFIG.enabled = true;
    },
    isWebflowAnalyticsAvailable: function() {
      return typeof window.WebflowAnalytics !== 'undefined';
    }
  };

  // Make initializeWebflowAnalytics globally accessible for script-blocking.js
  window.initializeWebflowAnalytics = initializeWebflowAnalytics;

  // Public API for external use
  window.ConsentBitWebflowIntegration = {
    // Configuration
    get config() {
      return WEBFLOW_ANALYTICS_CONFIG;
    },
    
    // Core functions
    trackEvent: trackWebflowEvent,
    trackPageView: trackWebflowPageView,
    initialize: initializeWebflowAnalytics,
    
    // Script management - delegate to script-blocking.js
    enableAnalytics: function() {
      if (window.scriptBlocking && window.scriptBlocking.enableWebflowAnalytics) {
        window.scriptBlocking.enableWebflowAnalytics();
      }
    },
    disableAnalytics: function() {
      if (window.scriptBlocking && window.scriptBlocking.disableWebflowAnalytics) {
        window.scriptBlocking.disableWebflowAnalytics();
      }
    },
    
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
      if (window.scriptBlocking && window.scriptBlocking.enableWebflowAnalytics) {
        window.scriptBlocking.enableWebflowAnalytics();
      }
    } else if (event.detail && event.detail.analytics === false) {
      if (window.scriptBlocking && window.scriptBlocking.disableWebflowAnalytics) {
        window.scriptBlocking.disableWebflowAnalytics();
      }
    }
  });

  // Also listen for the legacy consent event format
  document.addEventListener('consentUpdated', function(event) {
    if (window.userConsent && window.userConsent.analytics === true) {
      if (window.scriptBlocking && window.scriptBlocking.enableWebflowAnalytics) {
        window.scriptBlocking.enableWebflowAnalytics();
      }
    } else if (window.userConsent && window.userConsent.analytics === false) {
      if (window.scriptBlocking && window.scriptBlocking.disableWebflowAnalytics) {
        window.scriptBlocking.disableWebflowAnalytics();
      }
    }
  });

})();

