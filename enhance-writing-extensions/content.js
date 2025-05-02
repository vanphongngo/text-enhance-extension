// Immediately invoked function to avoid global namespace pollution
(function() {
  // Your API key
  const API_KEY = 'AIzaSyAyeNqvGfvTv0o-x9MXIj_pwOxw3ULKuso';
  
  // Function to enhance text using Gemini API with multiple suggestions
  async function enhanceTextWithGemini(text, apiKey, numSuggestions = 3, additionalInstructions = '') {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    // Base prompt for improvements
    let prompt = `Generate ${numSuggestions} different improved versions of the following text, making each one more professional, clear, and engaging in a different way.`;
    
    // Add any additional instructions if provided
    if (additionalInstructions) {
      prompt += ` Additional instructions: ${additionalInstructions}.`;
    }
    
    // Complete the prompt with formatting instructions
    prompt += ` For each improvement, include a very brief (5-10 word) explanation of what you improved. Format your response as a JSON array of objects, where each object has two properties: "text" (the improved text) and "explanation" (the brief explanation). Only return the JSON array without any additional text or explanations: "${text}"`;
    
    const requestData = {
      contents: [{
        parts: [{
          text: prompt
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
            const parsedData = JSON.parse(jsonMatch[0]);
            // Make sure we have valid objects with text and explanation
            return parsedData.map(item => {
              if (typeof item === 'string') {
                return { text: item, explanation: 'Improved version' };
              } else if (item && item.text) {
                return {
                  text: item.text,
                  explanation: item.explanation || 'Improved version'
                };
              } else {
                return { text: 'Error parsing suggestion', explanation: 'Error' };
              }
            });
          }
          
          // If not in expected format, wrap in array with default explanation
          return [{ text: responseText, explanation: 'Improved version' }];
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          // Return as single suggestion if can't parse
          return [{ text: responseText, explanation: 'Improved version' }];
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
      min-width: 320px;
      max-width: 550px;
      padding: 15px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 99998;
      font-size: 14px;
      line-height: 1.5;
      display: none;
      max-height: 600px;
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
      .suggestion-explanation {
        font-style: italic;
        color: #666;
        font-size: 12px;
        margin-bottom: 8px;
        border-bottom: 1px dotted #ccc;
        padding-bottom: 5px;
        display: block;
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
      .refine-input-container {
        margin: 10px 0 15px 0;
        padding-bottom: 10px;
        border-bottom: 1px dashed #ccc;
      }
      .refine-input {
        width: 75%;
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 13px;
      }
      .refine-button {
        background-color: #3498db;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        margin-left: 5px;
        transition: all 0.2s ease;
      }
      .refine-button:hover {
        background-color: #2980b9;
      }
      .refine-history {
        font-size: 12px;
        color: #666;
        margin-top: 5px;
        font-style: italic;
      }
      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
        margin-right: 5px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .original-text-container {
        margin-bottom: 15px;
        padding: 10px;
        background-color: #f0f0f0;
        border-radius: 4px;
        border-left: 3px solid #34495e;
      }
      .original-text-heading {
        font-weight: bold;
        color: #34495e;
        margin-bottom: 5px;
        font-size: 13px;
      }
      .original-text {
        color: #333;
        font-size: 14px;
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
    
    // Create refinement input container
    const refineContainer = document.createElement('div');
    refineContainer.className = 'refine-input-container';
    refineContainer.innerHTML = `
      <input type="text" class="refine-input" placeholder="Type instructions to refine suggestions (e.g., 'more concise' or 'formal tone')">
      <button class="refine-button">Refine</button>
      <div class="refine-history"></div>
    `;
    
    // Original text container
    const originalTextContainer = document.createElement('div');
    originalTextContainer.className = 'original-text-container';
    originalTextContainer.innerHTML = `
      <div class="original-text-heading">Original Text:</div>
      <div class="original-text"></div>
    `;
    
    // Add containers to popup
    popupContent.appendChild(dragHandle);
    popupContent.appendChild(originalTextContainer);
    popupContent.appendChild(refineContainer);
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
    
    return { 
      popupIcon, 
      popupContent, 
      loadingIndicator, 
      suggestionsContainer, 
      refineContainer,
      originalTextContainer
    };
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
    // Variables to store state
    let currentSelection = '';
    let activeElement = null;
    let isEnhancing = false;
    let lastMousePosition = { x: 0, y: 0 };
    let cachedSelectionState = null; // Important: this will persist across the entire session
    let refinementHistory = [];
    
    // Create the UI elements
    const { 
      popupIcon, 
      popupContent, 
      loadingIndicator, 
      suggestionsContainer,
      refineContainer,
      originalTextContainer
    } = createElements();
    
    // Get the refinement input and button
    const refineInput = refineContainer.querySelector('.refine-input');
    const refineButton = refineContainer.querySelector('.refine-button');
    const refineHistory = refineContainer.querySelector('.refine-history');
    const originalTextElem = originalTextContainer.querySelector('.original-text');
    
    // Initialize refinement button with loading state
    const setRefineButtonLoading = (isLoading) => {
      if (isLoading) {
        refineButton.innerHTML = '<span class="loading-spinner"></span> Refining...';
        refineButton.disabled = true;
      } else {
        refineButton.innerHTML = 'Refine';
        refineButton.disabled = false;
      }
    };
    
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
    
    // Store selection information when text is selected
    const captureSelectionState = () => {
      // Get the current active element
      const element = document.activeElement;
      if (!isInputElement(element)) return null;
      
      // Create a selection state object based on the element type
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        return {
          type: 'input',
          element: element,
          start: element.selectionStart,
          end: element.selectionEnd,
          text: element.value.substring(element.selectionStart, element.selectionEnd)
        };
      } else if (element.getAttribute('contenteditable') === 'true') {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return null;
        
        const range = selection.getRangeAt(0);
        return {
          type: 'contenteditable',
          element: element,
          range: range.cloneRange(), // Clone the range to preserve it
          text: selection.toString()
        };
      }
      
      return null;
    };
    
    // Function to replace text in the captured selection
    const replaceSelectedText = (newText) => {
      // Use the cached selection state instead of the current selection
      if (!cachedSelectionState) {
        console.error('No cached selection state found for text replacement');
        return;
      }
      
      try {
        // Different replacement strategies based on element type
        if (cachedSelectionState.type === 'input') {
          const elem = cachedSelectionState.element;
          const start = cachedSelectionState.start;
          const end = cachedSelectionState.end;
          const currentValue = elem.value;
          
          // Replace the text
          elem.value = currentValue.substring(0, start) + newText + currentValue.substring(end);
          
          // Focus and select the new text
          elem.focus();
          elem.setSelectionRange(start, start + newText.length);
          
          console.log('Text replaced successfully in input element');
        } 
        else if (cachedSelectionState.type === 'contenteditable') {
          const elem = cachedSelectionState.element;
          const range = cachedSelectionState.range;
          
          // Focus the element first
          elem.focus();
          
          // Clear any current selection and restore our saved range
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Now use execCommand to replace the text
          document.execCommand('insertText', false, newText);
          
          console.log('Text replaced successfully in contenteditable element');
        }
      } catch (error) {
        console.error('Error replacing text:', error);
      }
      
      // Hide the popup after replacement
      popupContent.style.display = 'none';
      popupIcon.style.opacity = '0';
      popupIcon.style.pointerEvents = 'none';
    };
    
    // Handle text selection and mouse up events
    document.addEventListener('mouseup', function(e) {
      setTimeout(() => {
        // Get the current selection
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        // Hide the icon if there's no selection
        if (!selectedText || selectedText.length < 3) {
          popupIcon.style.opacity = '0';
          popupIcon.style.pointerEvents = 'none';
          // NOTE: We don't clear the cached selection state here
          return;
        }
        
        // Check if the selection is within an input element
        activeElement = document.activeElement;
        
        if (!isInputElement(activeElement)) {
          // Not in an input element, don't show the icon
          popupIcon.style.opacity = '0';
          popupIcon.style.pointerEvents = 'none';
          return;
        }
        
        // Capture and cache the selection state
        const newSelectionState = captureSelectionState();
        if (!newSelectionState) return;
        
        // Store the selection information persistently
        cachedSelectionState = newSelectionState;
        currentSelection = selectedText;
        
        // Update the original text in the popup
        originalTextElem.textContent = currentSelection;
        
        // Reset refinement history
        refinementHistory = [];
        refineHistory.textContent = '';
        
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
        
        console.log('Selection captured and cached:', selectedText);
      }, 10);
    });
    
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
        
        // Add explanation if available
        if (suggestion.explanation) {
          const explanationElem = document.createElement('div');
          explanationElem.className = 'suggestion-explanation';
          explanationElem.textContent = suggestion.explanation;
          suggestionElem.appendChild(explanationElem);
        }
        
        // Add suggestion text
        const suggestionText = document.createElement('div');
        suggestionText.className = 'suggestion-text';
        suggestionText.textContent = suggestion.text;
        suggestionElem.appendChild(suggestionText);
        
        // Add action buttons container
        const actionButtons = document.createElement('div');
        actionButtons.className = 'suggestion-actions';
        
        // Add "Use This" button
        const useButton = document.createElement('button');
        useButton.className = 'use-btn';
        useButton.textContent = 'Use This';
        useButton.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Check if we have cached selection state
          if (!cachedSelectionState) {
            console.error('No cached selection state available');
            alert('Please reselect the text and try again.');
            return;
          }
          
          // Replace the text using the cached selection state
          replaceSelectedText(suggestion.text);
        });
        
        // Add Copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.textContent = 'Copy';
        copyButton.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          copyToClipboard(suggestion.text, copyButton);
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
    
    // Function to handle refinement requests
    const handleRefinement = async () => {
      const refinementText = refineInput.value.trim();
      if (!refinementText) return;
      
      // Add to history
      refinementHistory.push(refinementText);
      
      // Update history display
      refineHistory.textContent = `Applied: ${refinementHistory.join(' → ')}`;
      
      // Clear input
      refineInput.value = '';
      
      // Show loading
      setRefineButtonLoading(true);
      loadingIndicator.style.display = 'block';
      suggestionsContainer.innerHTML = '';
      
      try {
        // Make sure we have a valid selection to work with
        if (!currentSelection) {
          throw new Error('No text selected to refine');
        }
        
        // Call API with refinement instructions
        const enhancedTexts = await enhanceTextWithGemini(
          currentSelection, 
          API_KEY, 
          3, 
          refinementHistory.join('. ')
        );
        
        // Display new suggestions
        displaySuggestions(enhancedTexts);
      } catch (error) {
        suggestionsContainer.innerHTML = `<div class="suggestion-container" style="border-left-color: #e74c3c">
          <span style="color: #e74c3c">Error during refinement: ${error.message}</span>
        </div>`;
      } finally {
        // Hide loading
        setRefineButtonLoading(false);
        loadingIndicator.style.display = 'none';
      }
    };
    
    // Set up refinement input and button
    refineButton.addEventListener('click', handleRefinement);
    refineInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRefinement();
      }
    });
    
    // Handle icon click
    popupIcon.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Don't do anything if already enhancing
      if (isEnhancing) return;
      
      // Apply clicking animation
      popupIcon.style.transform = 'scale(0.9)';
      setTimeout(() => {
        popupIcon.style.transform = 'scale(1)';
      }, 100);
      
      // Reset refinement state
      refineInput.value = '';
      refinementHistory = [];
      refineHistory.textContent = '';
      
      // Get popup position based on icon position
      const iconRect = popupIcon.getBoundingClientRect();
      const popupWidth = 450; // Approximate width
      const popupHeight = 400; // Approximate height
      
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
      
      // Make sure we're using the cached selection
      if (!cachedSelectionState) {
        console.warn('No cached selection state available when clicking icon');
      } else {
        // Update the original text display from the cached selection
        originalTextElem.textContent = cachedSelectionState.text || currentSelection;
        console.log('Using cached selection:', cachedSelectionState.text);
      }
      
      // Reset suggestions container and show loading indicator
      suggestionsContainer.innerHTML = '';
      loadingIndicator.style.display = 'block';
      isEnhancing = true;
      
      try {
        // Call the API with the cached selection text
        const textToEnhance = cachedSelectionState ? cachedSelectionState.text : currentSelection;
        
        if (!textToEnhance) {
          throw new Error('No text selected to enhance');
        }
        
        // Call the API to enhance the text with multiple suggestions
        const enhancedTexts = await enhanceTextWithGemini(textToEnhance, API_KEY, 3);
        
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