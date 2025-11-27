(function() {
  'use strict';
  try {
    // Try document.write for true synchronous loading (only works during page load)
    if (document.readyState === 'loading' || document.readyState === 'interactive') {
      // Page is still loading - use document.write for synchronous script injection
      // This is the only way to truly load a script synchronously like a static tag
      document.write('<link rel="preconnect" href="${scriptDomain}" crossorigin="anonymous">');
      document.write('<link rel="dns-prefetch" href="${scriptDomain}">');
      document.write('<script src="${scriptUrl}" type="text/javascript" charset="utf-8" crossorigin="anonymous"><\\/script>');
      return; // Exit early if document.write succeeded
    }
    
    // Fallback: Page already loaded or document.write not available - use dynamic injection
    // Get head element - use multiple fallbacks for maximum compatibility
    var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
    
    // Add preconnect link for faster script loading
    var preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = '${scriptDomain}';
    preconnect.crossOrigin = 'anonymous';
    
    // Add dns-prefetch as fallback
    var dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = '${scriptDomain}';
    
    // Insert preconnect links FIRST at the very beginning of head
    if (head) {
      var firstChild = head.firstChild;
      if (firstChild) {
        head.insertBefore(preconnect, firstChild);
        head.insertBefore(dnsPrefetch, firstChild);
      } else {
        head.appendChild(preconnect);
        head.appendChild(dnsPrefetch);
      }
    }
    
    // Create and inject script tag IMMEDIATELY after preconnect links
    var script = document.createElement('script');
    script.src = '${scriptUrl}';
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.crossOrigin = 'anonymous';
    // Note: async/defer don't work the same way for dynamically created scripts
    // The script will load as soon as it's appended to the DOM
    
    // Insert script synchronously right after preconnect links
    if (head) {
      var preconnectLink = head.querySelector('link[rel="preconnect"][href="${scriptDomain}"]');
      if (preconnectLink) {
        // Insert right after preconnect link
        if (preconnectLink.nextSibling) {
          head.insertBefore(script, preconnectLink.nextSibling);
        } else {
          // If no next sibling, insert after dns-prefetch
          var dnsLink = head.querySelector('link[rel="dns-prefetch"][href="${scriptDomain}"]');
          if (dnsLink && dnsLink.nextSibling) {
            head.insertBefore(script, dnsLink.nextSibling);
          } else {
            head.appendChild(script);
          }
        }
      } else {
        // Fallback: insert at beginning of head
        head.insertBefore(script, head.firstChild);
      }
    } else {
      // Last resort fallback
      (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(script);
    }
    
    // Add error handling
    script.onerror = function(error) {
      // Script failed to load
    };
    
    script.onload = function() {
      // Script loaded successfully
    };
  } catch (error) {
    // Fallback: try to inject script anyway
    try {
      var fallbackScript = document.createElement('script');
      fallbackScript.src = '${scriptUrl}';
      fallbackScript.type = 'text/javascript';
      fallbackScript.crossOrigin = 'anonymous';
      (document.head || document.getElementsByTagName('head')[0] || document.documentElement).appendChild(fallbackScript);
    } catch (e) {
      // Fallback script injection also failed
    }
  }
})();
