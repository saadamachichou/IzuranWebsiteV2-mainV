// Enhanced patch to improve bfcache compatibility
// This must run before any third-party widgets load
(function() {
  // Patch addEventListener to intercept deprecated 'unload' events
  const originalAddEventListener = Window.prototype.addEventListener;
  Window.prototype.addEventListener = function(type, listener, options) {
    // Replace unload with pagehide, which is bfcache-compatible
    if (type === 'unload' || type === 'beforeunload') {
      // For beforeunload, we still need it for some cases, but mark it as non-blocking
      if (type === 'beforeunload') {
        // Allow beforeunload but make it bfcache-friendly
        return originalAddEventListener.call(this, type, listener, options);
      }
      // Replace unload with pagehide
      type = 'pagehide';
      const wrappedListener = function(event) {
        if (typeof listener === 'function') {
          listener.call(this, event);
        } else if (listener && typeof listener.handleEvent === 'function') {
          listener.handleEvent(event);
        }
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };

  // Patch window.onunload to prevent bfcache issues
  // Redirect onunload assignments to pagehide for bfcache compatibility
  try {
    Object.defineProperty(Window.prototype, 'onunload', {
      get: function() {
        return this._onpagehide || null;
      },
      set: function(listener) {
        if (this._onpagehide) {
          this.removeEventListener('pagehide', this._onpagehide);
        }
        if (listener) {
          this._onpagehide = listener;
          this.addEventListener('pagehide', listener);
        } else {
          this._onpagehide = null;
        }
      },
      configurable: true,
      enumerable: true
    });
  } catch (e) {
    // Property might already be defined or non-configurable, continue silently
  }

  // Handle bfcache restoration
  window.addEventListener('pageshow', function(event) {
    // If the page was restored from bfcache, the persisted property will be true
    if (event.persisted) {
      // Force a reflow to ensure everything renders correctly
      document.body.offsetHeight;
      // Dispatch a custom event that React components can listen to
      window.dispatchEvent(new CustomEvent('bfcacheRestore'));
    }
  });

  // Store iframe data for restoration
  const iframeStorage = new Map();
  let isNavigating = false;
  
  // Function to remove iframes from DOM
  function removeIframesForBfcache() {
    if (isNavigating) return; // Already processing
    isNavigating = true;
    
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe, index) => {
      try {
        // Store complete iframe data for restoration
        const iframeId = 'bfcache-iframe-' + index + '-' + Date.now();
        const iframeData = {
          src: iframe.src,
          width: iframe.width || iframe.style.width || iframe.getAttribute('width') || '100%',
          height: iframe.height || iframe.style.height || iframe.getAttribute('height') || '300',
          className: iframe.className,
          style: iframe.getAttribute('style') || '',
          title: iframe.title || iframe.getAttribute('title') || '',
          allow: iframe.getAttribute('allow') || '',
          loading: iframe.getAttribute('loading') || '',
          referrerPolicy: iframe.getAttribute('referrerPolicy') || '',
          scrolling: iframe.getAttribute('scrolling') || '',
          frameBorder: iframe.getAttribute('frameBorder') || iframe.getAttribute('frameborder') || '',
          allowFullScreen: iframe.hasAttribute('allowFullScreen') || iframe.hasAttribute('allowfullscreen'),
          parentSelector: iframe.parentElement ? getSelector(iframe.parentElement) : null,
          nextSiblingSelector: iframe.nextSibling && iframe.nextSibling.nodeType === 1 ? getSelector(iframe.nextSibling) : null,
          outerHTML: iframe.outerHTML
        };
        
        iframe.setAttribute('data-bfcache-id', iframeId);
        iframeStorage.set(iframeId, iframeData);
        
        // Store parent reference using selector
        if (iframe.parentElement) {
          iframe.parentElement.setAttribute('data-bfcache-iframe-id', iframeId);
        }
        
        // Remove iframe from DOM completely
        iframe.remove();
      } catch (e) {
        // If removal fails, at least try to unload it
        try {
          if (iframe.src && !iframe.src.startsWith('about:blank')) {
            iframe.src = 'about:blank';
          }
        } catch (e2) {
          // Ignore
        }
      }
    });
  }
  
  // Helper to generate CSS selector for an element
  function getSelector(el) {
    if (el.id) return '#' + el.id;
    if (el.className) {
      const classes = el.className.split(' ').filter(c => c).join('.');
      if (classes) {
        const tag = el.tagName.toLowerCase();
        const selector = tag + '.' + classes;
        // Check if unique
        if (document.querySelectorAll(selector).length === 1) return selector;
      }
    }
    // Fallback: use path
    const path = [];
    while (el && el.nodeType === 1) {
      let selector = el.nodeName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
        path.unshift(selector);
        break;
      } else {
        let sibling = el;
        let nth = 1;
        while (sibling.previousElementSibling) {
          sibling = sibling.previousElementSibling;
          if (sibling.nodeName.toLowerCase() === selector) nth++;
        }
        if (nth !== 1) selector += ':nth-of-type(' + nth + ')';
      }
      path.unshift(selector);
      el = el.parentElement;
    }
    return path.join(' > ');
  }
  
  // Intercept navigation early - remove iframes before browser checks for unload handlers
  // Use visibilitychange to detect when page is about to be hidden
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      // Page is about to be hidden, remove iframes proactively
      removeIframesForBfcache();
    }
  });
  
  // Use Page Lifecycle API freeze event if available (better for bfcache)
  if ('onfreeze' in document) {
    document.addEventListener('freeze', function() {
      removeIframesForBfcache();
    });
  }
  
  // Also listen for popstate (back/forward navigation)
  window.addEventListener('popstate', function() {
    removeIframesForBfcache();
  });
  
  // Clean up on pagehide to help bfcache
  window.addEventListener('pagehide', function(event) {
    // Mark that we're navigating away (for cleanup if needed)
    window.dispatchEvent(new CustomEvent('bfcacheHide', { detail: { persisted: event.persisted } }));
    
    // Close any WebSocket connections to help bfcache
    if (window.WebSocket) {
      try {
        if (window._websockets && Array.isArray(window._websockets)) {
          window._websockets.forEach(function(ws) {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          });
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Remove iframes if not already done
    if (!event.persisted) {
      removeIframesForBfcache();
    }
  });

  // Restore iframes on pageshow if restored from bfcache
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      isNavigating = false;
      
      // Restore iframes that were removed
      iframeStorage.forEach(function(iframeData, iframeId) {
        try {
          // Find parent element that stored the iframe ID
          const parentWithId = document.querySelector('[data-bfcache-iframe-id="' + iframeId + '"]');
          if (parentWithId) {
            // Create new iframe element
            const newIframe = document.createElement('iframe');
            
            // Restore all attributes
            if (iframeData.src) newIframe.src = iframeData.src;
            if (iframeData.width) newIframe.width = iframeData.width;
            if (iframeData.height) newIframe.height = iframeData.height;
            if (iframeData.className) newIframe.className = iframeData.className;
            if (iframeData.style) newIframe.setAttribute('style', iframeData.style);
            if (iframeData.title) newIframe.title = iframeData.title;
            if (iframeData.allow) newIframe.setAttribute('allow', iframeData.allow);
            if (iframeData.loading) newIframe.setAttribute('loading', iframeData.loading);
            if (iframeData.referrerPolicy) newIframe.setAttribute('referrerPolicy', iframeData.referrerPolicy);
            if (iframeData.scrolling) newIframe.setAttribute('scrolling', iframeData.scrolling);
            if (iframeData.frameBorder) newIframe.setAttribute('frameBorder', iframeData.frameBorder);
            if (iframeData.allowFullScreen) newIframe.setAttribute('allowFullScreen', 'true');
            
            // Try to restore at original position
            if (iframeData.nextSiblingSelector) {
              const nextSibling = document.querySelector(iframeData.nextSiblingSelector);
              if (nextSibling && nextSibling.parentNode) {
                nextSibling.parentNode.insertBefore(newIframe, nextSibling);
              } else if (parentWithId) {
                parentWithId.appendChild(newIframe);
              }
            } else if (parentWithId) {
              parentWithId.appendChild(newIframe);
            }
            
            // Clean up
            parentWithId.removeAttribute('data-bfcache-iframe-id');
          }
        } catch (e) {
          // Ignore restoration errors
        }
      });
      
      // Also restore iframes that were just unloaded (fallback)
      const iframes = document.querySelectorAll('iframe[data-bfcache-src]');
      iframes.forEach((iframe) => {
        const originalSrc = iframe.getAttribute('data-bfcache-src');
        if (originalSrc) {
          iframe.src = originalSrc;
          iframe.removeAttribute('data-bfcache-src');
        }
      });
      
      // Clear storage after restoration
      iframeStorage.clear();
    } else {
      // Not from bfcache, reset flag
      isNavigating = false;
      iframeStorage.clear();
    }
  });
})();
