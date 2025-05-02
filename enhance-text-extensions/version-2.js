// Immediately invoked function to avoid global namespace pollution
(function() {
  // Your API key
  const API_KEY = 'AIzaSyAyeNqvGfvTv0o-x9MXIj_pwOxw3ULKuso';
  
  // Function to enhance text using Gemini API with multiple suggestions
  async function enhanceTextWithGemini(text, apiKey, numSuggestions = 3) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const requestData = {
      contents: [{
        parts: [{
          text: `Generate ${numSuggestions} different improved versions of the following text, making each one more professional, clear, and engaging in a different way. Format your response as a JSON array with each suggestion as a separate string in the array. Only return the JSON array without any explanations or additional text: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
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
        
        const responseText = data.candidates[0].content.parts[0].text;
        
        // Try to parse as JSON
        try {
          // Look for anything that looks like a JSON array in the response
          const jsonMatch = responseText.match(/\[.*\]/s);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          
          // If not in expected format, wrap in array
          return [responseText];
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          // Return as single suggestion if can't parse
          return [responseText];
        }
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
    
    // Create popup content container (draggable)
    const popupContent = document.createElement('div');
    popupContent.id = 'text-enhancer-content';
    popupContent.style.cssText = `
      position: absolute;
      min-width: 300px;
      max-width: 500px;
      padding: 15px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 99998;
      font-size: 14px;
      line-height: 1.5;
      display: none;
      max-height: 500px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      resize: both;
      overflow: auto;
    `;
    
    // Create drag handle
    const dragHandle = document.createElement('div');
    dragHandle.id = 'text-enhancer-drag-handle';
    dragHandle.innerHTML = '<span>✦ Text Enhancer</span><span class="close-btn">×</span>';
    dragHandle.style.cssText = `
      padding: 8px 10px;
      background-color: #8e44ad;
      color: white;
      font-weight: bold;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      margin: -15px -15px 10px -15px;
      cursor: move;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;
    `;
    
    // Style the close button
    const closeStyle = document.createElement('style');
    closeStyle.textContent = `
      .close-btn {
        cursor: pointer;
        font-size: 24px;
        font-weight: bold;
      }
      .close-btn:hover {
        color: #e0e0e0;
      }
      .suggestion-container {
        border: 1px solid #e0e0e0;
        border-left: 3px solid #8e44ad;
        padding: 12px;
        margin-bottom: 15px;
        background-color: #f9f9f9;
        border-radius: 4px;
        position: relative;
      }
      .suggestion-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
      }
      .copy-btn {
        background-color: #8e44ad;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-left: 5px;
        transition: all 0.2s ease;
      }
      .copy-btn:hover {
        background-color: #9b59b6;
      }
      .use-btn {
        background-color: #2ecc71;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
      }
      .use-btn:hover {
        background-color: #27ae60;
      }
      .suggestion-number {
        position: absolute;
        top: -8px;
        left: -8px;
        background-color: #8e44ad;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
      }
    `;
    document.head.appendChild(closeStyle);
    
    // Close button functionality
    const closeBtn = dragHandle.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      popupContent.style.display = 'none';
      popupIcon.style.opacity = '0';
      popupIcon.style.pointerEvents = 'none';
    });
    
    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'text-enhancer-loading';
    loadingIndicator.innerHTML = 'Generating multiple suggestions...';
    loadingIndicator.style.cssText = `
      font-style: italic;
      color: #666;
      display: none;
      margin-bottom: 10px;
      text-align: center;
    `;
    
    // Add drag handle to popup
    popupContent.appendChild(dragHandle);
    popupContent.appendChild(loadingIndicator);
    
    // Create suggestions container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'text-enhancer-suggestions';
    popupContent.appendChild(suggestionsContainer);
    
    // Append elements to the body
    document.body.appendChild(popupIcon);
    document.body.appendChild(popupContent);
    
    // Make the popup draggable
    makeDraggable(popupContent, dragHandle);
    
    return { popupIcon, popupContent, loadingIndicator, suggestionsContainer };
  };
  
  // Function to make an element draggable
  const makeDraggable = (element, handle) => {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    const dragMouseDown = (e) => {
      e.preventDefault();
      // Get the mouse cursor position at startup
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.addEventListener('mouseup', closeDragElement);
      document.addEventListener('mousemove', elementDrag);
    };
    
    const elementDrag = (e) => {
      e.preventDefault();
      // Calculate the new cursor position
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // Set the element's new position
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
    };
    
    const closeDragElement = () => {
      // Stop moving when mouse button is released
      document.removeEventListener('mouseup', closeDragElement);
      document.removeEventListener('mousemove', elementDrag);
    };
    
    handle.addEventListener('mousedown', dragMouseDown);
  };
  
  // Function to copy text to clipboard
  const copyToClipboard = (text, button) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show a temporary copied message
      const originalText = button.innerHTML;
      button.innerHTML = 'Copied! ✓';
      button.disabled = true;
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
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
    let lastMousePosition = { x: 0, y: 0 };
    
    // Create the UI elements
    const { popupIcon, popupContent, loadingIndicator, suggestionsContainer } = createElements();
    
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
    
    // Function to replace text in the current input element
    const replaceSelectedText = (newText) => {
      if (currentInputElement) {
        if (currentInputElement.tagName === 'TEXTAREA' || currentInputElement.tagName === 'INPUT') {
          const start = currentInputElement.selectionStart;
          const end = currentInputElement.selectionEnd;
          const currentValue = currentInputElement.value;
          
          currentInputElement.value = 
            currentValue.substring(0, start) + 
            newText + 
            currentValue.substring(end);
          
          // Re-focus and select the new text
          currentInputElement.focus();
          currentInputElement.setSelectionRange(start, start + newText.length);
        } else if (currentInputElement.getAttribute('contenteditable') === 'true') {
          // For contenteditable elements
          document.execCommand('insertText', false, newText);
        }
        
        // Hide the popup
        popupContent.style.display = 'none';
        popupIcon.style.opacity = '0';
        popupIcon.style.pointerEvents = 'none';
      }
    };
    
    // Function to display multiple suggestions
    const displaySuggestions = (suggestions) => {
      // Clear previous suggestions
      suggestionsContainer.innerHTML = '';
      
      // Add each suggestion
      suggestions.forEach((suggestion, index) => {
        const suggestionElem = document.createElement('div');
        suggestionElem.className = 'suggestion-container';
        
        // Add suggestion number badge
        const numberBadge = document.createElement('div');
        numberBadge.className = 'suggestion-number';
        numberBadge.textContent = (index + 1);
        suggestionElem.appendChild(numberBadge);
        
        // Add suggestion text
        const suggestionText = document.createElement('div');
        suggestionText.className = 'suggestion-text';
        suggestionText.textContent = suggestion;
        suggestionElem.appendChild(suggestionText);
        
        // Add action buttons container
        const actionButtons = document.createElement('div');
        actionButtons.className = 'suggestion-actions';
        
        // Add "Use This" button
        const useButton = document.createElement('button');
        useButton.className = 'use-btn';
        useButton.textContent = 'Use This';
        useButton.addEventListener('click', () => {
          replaceSelectedText(suggestion);
        });
        
        // Add Copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.textContent = 'Copy';
        copyButton.addEventListener('click', () => {
          copyToClipboard(suggestion, copyButton);
        });
        
        // Add buttons to container
        actionButtons.appendChild(useButton);
        actionButtons.appendChild(copyButton);
        
        // Add actions to suggestion element
        suggestionElem.appendChild(actionButtons);
        
        // Add suggestion to container
        suggestionsContainer.appendChild(suggestionElem);
      });
    };
    
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
      const popupWidth = 400; // Approximate width
      const popupHeight = 300; // Approximate height
      
      // Calculate best position for popup relative to icon
      const safePos = getPositionInViewport(
        iconRect.right + 5, 
        iconRect.top - 30, // Position slightly above icon
        popupWidth, 
        popupHeight
      );
      
      // Position and show the content popup
      popupContent.style.top = (window.scrollY + safePos.y) + 'px';
      popupContent.style.left = (window.scrollX + safePos.x) + 'px';
      popupContent.style.display = 'block';
      
      // Reset suggestions container and show loading indicator
      suggestionsContainer.innerHTML = '';
      loadingIndicator.style.display = 'block';
      isEnhancing = true;
      
      try {
        // Call the API to enhance the text with multiple suggestions
        const enhancedTexts = await enhanceTextWithGemini(currentSelection, API_KEY, 3);
        
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        
        // Display suggestions
        displaySuggestions(enhancedTexts);
        
      } catch (error) {
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        
        // Show error message
        suggestionsContainer.innerHTML = `<div class="suggestion-container" style="border-left-color: #e74c3c">
          <span style="color: #e74c3c">Error: ${error.message}</span>
        </div>`;
      }
      
      isEnhancing = false;
    });
    
    // Handle escape key to dismiss
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        popupIcon.style.opacity = '0';
        popupIcon.style.pointerEvents = 'none';
        popupContent.style.display = 'none';
      }
    });
    
    console.log('Enhanced text enhancer tool activated for input elements!');
  };
  
  // Initialize the enhancer when the page is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTextEnhancer);
  } else {
    initTextEnhancer();
  }
})();