// Immediately invoked function to avoid global namespace pollution
(function() {
  // Your API key
  const API_KEY = 'AIzaSyAyeNqvGfvTv0o-x9MXIj_pwOxw3ULKuso';
  
  // Function to enhance text using Gemini API
  async function enhanceTextWithGemini(text, apiKey) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const requestData = {
      contents: [{
        parts: [{
          text: `Improve the following text to make it more professional, clear, and engaging. Only return the improved version without explanations: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
      }
    };
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the enhanced text from the response
      if (data.candidates && data.candidates[0] && data.candidates[0].content &&
          data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Unexpected API response format');
      }
    } catch (error) {
      console.error('Error enhancing text:', error);
      throw error;
    }
  }
  
  // Create UI elements
  const createElements = () => {
    // Create popup icon
    const popupIcon = document.createElement('div');
    popupIcon.id = 'text-enhancer-icon';
    popupIcon.innerHTML = '✨';
    popupIcon.style.cssText = `
      position: absolute;
      width: 36px;
      height: 36px;
      background-color: #8e44ad;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      cursor: pointer;
      z-index: 99999;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
      opacity: 0;
      pointer-events: none;
    `;
    
    // Create popup content container
    const popupContent = document.createElement('div');
    popupContent.id = 'text-enhancer-content';
    popupContent.style.cssText = `
      position: absolute;
      min-width: 250px;
      max-width: 450px;
      padding: 15px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 99998;
      font-size: 14px;
      line-height: 1.5;
      display: none;
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    `;
    
    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'text-enhancer-loading';
    loadingIndicator.innerHTML = 'Enhancing your text...';
    loadingIndicator.style.cssText = `
      font-style: italic;
      color: #666;
      display: none;
      margin-bottom: 10px;
      text-align: center;
    `;
    
    popupContent.appendChild(loadingIndicator);
    
    // Append elements to the body
    document.body.appendChild(popupIcon);
    document.body.appendChild(popupContent);
    
    return { popupIcon, popupContent, loadingIndicator };
  };
  
  // Function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show a temporary copied message
      const copyButton = document.getElementById('copy-enhanced-text');
      const originalText = copyButton.innerHTML;
      copyButton.innerHTML = 'Copied! ✓';
      copyButton.disabled = true;
      
      setTimeout(() => {
        copyButton.innerHTML = originalText;
        copyButton.disabled = false;
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };
  
  // Function to safely position elements on screen
  const getPositionInViewport = (x, y, elementWidth, elementHeight) => {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    
    // Keep the element within viewport boundaries
    const posX = Math.min(Math.max(0, x), viewportWidth - elementWidth);
    const posY = Math.min(Math.max(0, y), viewportHeight - elementHeight);
    
    return { x: posX, y: posY };
  };
  
  // Initialize the text enhancer
  const initTextEnhancer = () => {
    let currentSelection = '';
    let currentInputElement = null;
    let isEnhancing = false;
    let enhancedTextValue = '';
    let lastMousePosition = { x: 0, y: 0 };
    
    // Create the UI elements
    const { popupIcon, popupContent, loadingIndicator } = createElements();
    
    // Function to check if element is an input or textarea
    const isInputElement = (element) => {
      return element && (
        element.tagName === 'INPUT' && 
        (element.type === 'text' || element.type === 'search' || element.type === 'email' || element.type === 'url') || 
        element.tagName === 'TEXTAREA' || 
        element.getAttribute('contenteditable') === 'true'
      );
    };
    
    // Track mouse position
    document.addEventListener('mousemove', function(e) {
      lastMousePosition.x = e.clientX;
      lastMousePosition.y = e.clientY;
    });
    
    // Handle text selection and mouse up events
    document.addEventListener('mouseup', function(e) {
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        // Hide the icon if there's no selection
        if (!selectedText || selectedText.length < 3) {
          popupIcon.style.opacity = '0';
          popupIcon.style.pointerEvents = 'none';
          currentInputElement = null;
          return;
        }
        
        // Check if the selection is within an input element
        const activeElement = document.activeElement;
        
        if (!isInputElement(activeElement)) {
          // Not in an input element, don't show the icon
          popupIcon.style.opacity = '0';
          popupIcon.style.pointerEvents = 'none';
          currentInputElement = null;
          return;
        }
        
        currentInputElement = activeElement;
        
        // Store the current selection
        currentSelection = selectedText;
        
        // Get dimensions to position the icon safely
        const iconWidth = 36;
        const iconHeight = 36;
        
        // Position icon based on current mouse position (cursor)
        const safePos = getPositionInViewport(
          lastMousePosition.x + 10, // Offset to not cover exact cursor position
          lastMousePosition.y + 10, 
          iconWidth, 
          iconHeight
        );
        
        // Apply the safe position
        popupIcon.style.top = (window.scrollY + safePos.y) + 'px';
        popupIcon.style.left = (window.scrollX + safePos.x) + 'px';
        popupIcon.style.opacity = '1';
        popupIcon.style.pointerEvents = 'auto';
        
        // Hide the content popup
        popupContent.style.display = 'none';
      }, 10);
    });
    
    // Special handler for input elements and contenteditable
    document.addEventListener('click', function(e) {
      const clickedElement = e.target;
      
      // Check if we clicked on an input element
      if (isInputElement(clickedElement)) {
        // Check if there's a selection in this input
        setTimeout(() => {
          const selectedText = 
            clickedElement.tagName === 'TEXTAREA' || clickedElement.getAttribute('contenteditable') === 'true' 
              ? window.getSelection().toString().trim()
              : clickedElement.value.substring(clickedElement.selectionStart, clickedElement.selectionEnd).trim();
          
          if (selectedText && selectedText.length >= 3) {
            currentSelection = selectedText;
            currentInputElement = clickedElement;
            
            // Get dimensions to position the icon safely
            const iconWidth = 36;
            const iconHeight = 36;
            
            // Position icon based on current mouse position (cursor)
            const safePos = getPositionInViewport(
              lastMousePosition.x + 10, // Offset to not cover exact cursor position
              lastMousePosition.y + 10, 
              iconWidth, 
              iconHeight
            );
            
            // Apply the safe position
            popupIcon.style.top = (window.scrollY + safePos.y) + 'px';
            popupIcon.style.left = (window.scrollX + safePos.x) + 'px';
            popupIcon.style.opacity = '1';
            popupIcon.style.pointerEvents = 'auto';
          }
        }, 10);
      }
    });
    
    // Handle icon click
    popupIcon.addEventListener('click', async function(e) {
      e.stopPropagation();
      
      // Don't do anything if already enhancing
      if (isEnhancing) return;
      
      // Apply clicking animation
      popupIcon.style.transform = 'scale(0.9)';
      setTimeout(() => {
        popupIcon.style.transform = 'scale(1)';
      }, 100);
      
      // Get popup position based on icon position
      const iconRect = popupIcon.getBoundingClientRect();
      const popupWidth = 300; // Approximate width
      const popupHeight = 200; // Approximate height
      
      // Calculate best position for popup relative to icon
      const safePos = getPositionInViewport(
        iconRect.right + 5, 
        iconRect.top, 
        popupWidth, 
        popupHeight
      );
      
      // Position and show the content popup
      popupContent.style.top = (window.scrollY + safePos.y) + 'px';
      popupContent.style.left = (window.scrollX + safePos.x) + 'px';
      popupContent.style.display = 'block';
      
      // Show loading indicator
      loadingIndicator.style.display = 'block';
      isEnhancing = true;
      
      try {
        // Call the API to enhance the text
        const enhancedText = await enhanceTextWithGemini(currentSelection, API_KEY);
        enhancedTextValue = enhancedText; // Store for copy button
        
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        
        // Create or update the result container
        let resultContainer = document.getElementById('enhanced-text-result');
        if (!resultContainer) {
          resultContainer = document.createElement('div');
          resultContainer.id = 'enhanced-text-result';
          resultContainer.style.cssText = `
            margin-top: 5px;
            padding: 12px;
            background-color: #f9f9f9;
            border-left: 3px solid #8e44ad;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin-bottom: 10px;
            border-radius: 4px;
            font-size: 14px;
            line-height: 1.6;
          `;
          popupContent.appendChild(resultContainer);
        }
        
        // Display the enhanced text
        resultContainer.innerHTML = enhancedText;
        
        // Create or update the copy button
        let copyButton = document.getElementById('copy-enhanced-text');
        if (!copyButton) {
          copyButton = document.createElement('button');
          copyButton.id = 'copy-enhanced-text';
          copyButton.innerHTML = 'Copy to clipboard';
          copyButton.style.cssText = `
            background-color: #8e44ad;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            display: block;
            margin: 10px 0 5px auto;
            transition: all 0.2s ease;
          `;
          copyButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#9b59b6';
          });
          copyButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#8e44ad';
          });
          copyButton.addEventListener('click', function() {
            copyToClipboard(enhancedTextValue);
          });
          popupContent.appendChild(copyButton);
        }
        
        // Add a "Replace" button
        let replaceButton = document.getElementById('replace-with-enhanced');
        if (!replaceButton) {
          replaceButton = document.createElement('button');
          replaceButton.id = 'replace-with-enhanced';
          replaceButton.innerHTML = 'Replace selected text';
          replaceButton.style.cssText = `
            background-color: #2ecc71;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            display: block;
            margin: 10px auto 5px 0;
            transition: all 0.2s ease;
            float: left;
          `;
          replaceButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#27ae60';
          });
          replaceButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#2ecc71';
          });
          replaceButton.addEventListener('click', function() {
            if (currentInputElement) {
              if (currentInputElement.tagName === 'TEXTAREA' || currentInputElement.tagName === 'INPUT') {
                const start = currentInputElement.selectionStart;
                const end = currentInputElement.selectionEnd;
                const currentValue = currentInputElement.value;
                
                currentInputElement.value = 
                  currentValue.substring(0, start) + 
                  enhancedTextValue + 
                  currentValue.substring(end);
                
                // Re-focus and select the new text
                currentInputElement.focus();
                currentInputElement.setSelectionRange(start, start + enhancedTextValue.length);
              } else if (currentInputElement.getAttribute('contenteditable') === 'true') {
                // For contenteditable elements
                document.execCommand('insertText', false, enhancedTextValue);
              }
              
              // Hide the popup
              popupContent.style.display = 'none';
              popupIcon.style.opacity = '0';
              popupIcon.style.pointerEvents = 'none';
            }
          });
          popupContent.appendChild(replaceButton);
        }
        
        // Add a clearfix div
        let clearfix = document.getElementById('text-enhancer-clearfix');
        if (!clearfix) {
          clearfix = document.createElement('div');
          clearfix.id = 'text-enhancer-clearfix';
          clearfix.style.cssText = `
            clear: both;
          `;
          popupContent.appendChild(clearfix);
        }
        
      } catch (error) {
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        
        // Show error message
        let resultContainer = document.getElementById('enhanced-text-result');
        if (!resultContainer) {
          resultContainer = document.createElement('div');
          resultContainer.id = 'enhanced-text-result';
          popupContent.appendChild(resultContainer);
        }
        resultContainer.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
      }
      
      isEnhancing = false;
    });
    
    // Hide popups when clicking elsewhere on the page
    document.addEventListener('click', function(e) {
      if (e.target !== popupIcon && !popupContent.contains(e.target)) {
        popupContent.style.display = 'none';
      }
    });
    
    // Handle escape key to dismiss
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        popupIcon.style.opacity = '0';
        popupIcon.style.pointerEvents = 'none';
        popupContent.style.display = 'none';
      }
    });
    
    console.log('Text enhancer tool activated for input elements!');
  };
  
  // Initialize the enhancer when the page is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTextEnhancer);
  } else {
    initTextEnhancer();
  }
})();