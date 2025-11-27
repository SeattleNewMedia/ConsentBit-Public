(function() {
  'use strict';
  
  // Script data object
  const scriptData = {
    scriptName: 'console-script-data.js',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    protocol: window.location.protocol,
    localStorage: {
      available: typeof(Storage) !== "undefined",
      itemCount: Object.keys(localStorage).length
    },
    sessionStorage: {
      available: typeof(Storage) !== "undefined",
      itemCount: Object.keys(sessionStorage).length
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight
    },
    window: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight
    }
  };
  
  // Console log the script data
  console.log('=== Script Data ===');
  console.log(scriptData);
  console.log('=== Formatted Script Data ===');
  console.log(JSON.stringify(scriptData, null, 2));
  
  // Return script data for potential use
  return scriptData;
})();

