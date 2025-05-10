function getGeminiToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["geminiApiToken"], function (result) {
      if (result.geminiApiToken) {
        resolve(result.geminiApiToken);
      } else {
        resolve(null);
      }
    });
  });
}

// Immediately invoked function to avoid global namespace pollution
(async function () {
  // Your API key
  const API_KEY = await getGeminiToken();
  if (!API_KEY) {
    window.alert(
      "No Gemini API token found. Please add a token in the extension popup, then reload page"
    );
    return; // Exit if no API key
  }

  // Function to correct grammar using Gemini API
  async function correctGrammarWithGemini(text, apiKey) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `Correct the grammar in the following text and also identify the specific errors. Format your response as a JSON object with the following structure:
{
  "errors": [
    {
      "original": "what was wrong",
      "correction": "what should have been used",
      "explanation": "brief explanation of the error"
    }
  ],
  "correctedText": "the fully corrected text"
}

Text to analyze: "${text}"`;

    const requestData = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800,
      },
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        const responseText = data.candidates[0].content.parts[0].text;

        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          return {
            errors: [],
            correctedText: text,
          };
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          return {
            errors: [],
            correctedText: text,
          };
        }
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error) {
      console.error("Error correcting grammar:", error);
      throw error;
    }
  }

  // Function to improve writing using Gemini API
  async function improveWritingWithGemini(text, apiKey) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `Improve the following text by providing 3 different versions with different styles (professional, concise, and engaging). For each version, include improvements made. Format as JSON:
{
  "suggestions": [
    {
      "style": "Professional",
      "improvements": ["what was improved", "another improvement"],
      "text": "improved text"
    },
    {
      "style": "Concise",
      "improvements": ["clear and brief improvement"],
      "text": "improved text"
    },
    {
      "style": "Engaging",
      "improvements": ["more compelling and expressive"],
      "text": "improved text"
    }
  ]
}

Text to improve: "${text}"`;

    const requestData = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        const responseText = data.candidates[0].content.parts[0].text;

        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          return { suggestions: [] };
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          return { suggestions: [] };
        }
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error) {
      console.error("Error improving writing:", error);
      throw error;
    }
  }

  // Function to handle custom prompts using Gemini API
  async function customPromptWithGemini(text, customPrompt, apiKey) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `Here's the text to work with:
"${text}"

User's request: ${customPrompt}

Please respond with rich formatting including:
- **Bold** for important points
- *Italic* for emphasis
- • Bullet points for lists
- 1. Numbered lists where appropriate
- Headers using ### for headings

Provide a well-formatted response that directly addresses the user's request.`;

    const requestData = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error) {
      console.error("Error processing custom prompt:", error);
      throw error;
    }
  }

  // Create UI elements
  const createElements = () => {
    // Create popup options container
    const optionsContainer = document.createElement("div");
    optionsContainer.id = "text-enhancer-options";
    optionsContainer.style.cssText = `
      position: absolute;
      display: flex;
      gap: 8px;
      z-index: 99999;
      opacity: 0;
      pointer-events: none;
      padding: 5px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(0, 0, 0, 0.1);
    `;

    // Create option buttons
    const options = [
      { id: "grammar", icon: "✓", text: "Grammar", color: "#3498db", hoverColor: "#2980b9" },
      { id: "improve", icon: "✨", text: "Improve", color: "#2ecc71", hoverColor: "#27ae60" },
      { id: "custom", icon: "✍️", text: "Custom", color: "#e67e22", hoverColor: "#d35400" },
    ];

    options.forEach((option) => {
      const button = document.createElement("button");
      button.id = `text-enhancer-${option.id}`;
      button.innerHTML = `<span style="margin-right: 4px;">${option.icon}</span>${option.text}`;
      button.style.cssText = `
        background-color: ${option.color};
        color: white;
        border: none;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        transition: all 0.2s ease;
        font-weight: 500;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      `;
      
      button.addEventListener("mouseover", () => {
        button.style.backgroundColor = option.hoverColor;
        button.style.transform = "translateY(-1px)";
        button.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
      });
      
      button.addEventListener("mouseout", () => {
        button.style.backgroundColor = option.color;
        button.style.transform = "translateY(0)";
        button.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
      });
      
      optionsContainer.appendChild(button);
    });

    // Create popup content container (draggable)
    const popupContent = document.createElement("div");
    popupContent.id = "text-enhancer-popup";
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
    const dragHandle = document.createElement("div");
    dragHandle.id = "text-enhancer-drag-handle";
    dragHandle.innerHTML =
      '<span>✦ Text Enhancer</span><span class="close-btn">×</span>';
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

    popupContent.appendChild(dragHandle);

    // Style for the components
    const styles = document.createElement("style");
    styles.textContent = `
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
      .error-item {
        background-color: #f8e6e6;
        border-left: 3px solid #e74c3c;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 4px;
      }
      .error-original {
        color: #e74c3c;
        text-decoration: line-through;
      }
      .error-correction {
        color: #27ae60;
        font-weight: bold;
      }
      .error-explanation {
        font-size: 12px;
        color: #666;
        margin-top: 5px;
      }
      .suggestion-header {
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 5px;
      }
      .improvement-list {
        margin-bottom: 8px;
      }
      .improvement-item {
        font-size: 12px;
        color: #34495e;
        margin-left: 15px;
      }
      .suggestion-text {
        background-color: white;
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 8px;
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
      .copy-btn:disabled {
        background-color: #bdc3c7;
        cursor: not-allowed;
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
      .use-btn:disabled {
        background-color: #bdc3c7;
        cursor: not-allowed;
      }
      .custom-prompt-container {
        margin-bottom: 15px;
      }
      .custom-prompt-input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        margin-bottom: 10px;
        font-size: 14px;
      }
      .custom-submit-btn {
        background-color: #3498db;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      .custom-submit-btn:disabled {
        background-color: #95a5a6;
        cursor: not-allowed;
      }
      .formatted-content {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        margin-bottom: 15px;
      }
      .formatted-content h3 {
        color: #2c3e50;
        margin-top: 15px;
        margin-bottom: 8px;
      }
      .formatted-content strong {
        color: #34495e;
      }
      .formatted-content em {
        font-style: italic;
      }
      .formatted-content ul, .formatted-content ol {
        margin-left: 20px;
        margin-bottom: 10px;
      }
      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #3498db;
        animation: spin 1s ease-in-out infinite;
        margin-right: 5px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styles);

    // Create content container for different types of results
    const contentContainer = document.createElement("div");
    contentContainer.id = "text-enhancer-content";
    popupContent.appendChild(contentContainer);

    // Append elements to the body
    document.body.appendChild(optionsContainer);
    document.body.appendChild(popupContent);

    // Make the popup draggable
    makeDraggable(popupContent, dragHandle);

    return {
      optionsContainer,
      popupContent,
      contentContainer,
    };
  };

  // Function to make an element draggable
  const makeDraggable = (element, handle) => {
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;

    const dragMouseDown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.addEventListener("mouseup", closeDragElement);
      document.addEventListener("mousemove", elementDrag);
    };

    const elementDrag = (e) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = element.offsetTop - pos2 + "px";
      element.style.left = element.offsetLeft - pos1 + "px";
    };

    const closeDragElement = () => {
      document.removeEventListener("mouseup", closeDragElement);
      document.removeEventListener("mousemove", elementDrag);
    };

    handle.addEventListener("mousedown", dragMouseDown);
  };

  // Function to copy text to clipboard
  const copyToClipboard = (text, button) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = "Copied! ✓";
        button.disabled = true;

        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 1500);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  // Function to safely position elements on screen
  const getPositionInViewport = (x, y, elementWidth, elementHeight) => {
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

    const posX = Math.min(Math.max(0, x), viewportWidth - elementWidth);
    const posY = Math.min(Math.max(0, y), viewportHeight - elementHeight);

    return { x: posX, y: posY };
  };

  // Function to display grammar corrections
  const displayGrammarCorrection = (data, replaceTextFunction) => {
    const container = document.getElementById("text-enhancer-content");
    container.innerHTML = ""; // Clear previous content

    if (data.errors && data.errors.length > 0) {
      const errorSection = document.createElement("div");
      errorSection.innerHTML = "<h3>Grammar Corrections:</h3>";
      
      data.errors.forEach((error) => {
        const errorItem = document.createElement("div");
        errorItem.className = "error-item";
        errorItem.innerHTML = `
          <div><span class="error-original">${error.original}</span> → <span class="error-correction">${error.correction}</span></div>
          <div class="error-explanation">Explanation: ${error.explanation}</div>
        `;
        errorSection.appendChild(errorItem);
      });
      
      container.appendChild(errorSection);
    } else {
      const noErrorDiv = document.createElement("div");
      noErrorDiv.className = "suggestion-container";
      noErrorDiv.textContent = "No grammar errors found!";
      container.appendChild(noErrorDiv);
    }

    // Create corrected text section
    const correctedSection = document.createElement("div");
    correctedSection.className = "suggestion-container";
    correctedSection.innerHTML = `
      <div class="suggestion-header">Corrected Text:</div>
      <div class="suggestion-text">${data.correctedText}</div>
    `;
    
    // Create action buttons
    const actionDiv = document.createElement("div");
    actionDiv.className = "suggestion-actions";
    
    const useBtn = document.createElement("button");
    useBtn.className = "use-btn";
    useBtn.textContent = "Use This";
    useBtn.addEventListener("click", () => replaceTextFunction(data.correctedText));
    
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", () => copyToClipboard(data.correctedText, copyBtn));
    
    actionDiv.appendChild(useBtn);
    actionDiv.appendChild(copyBtn);
    correctedSection.appendChild(actionDiv);
    
    container.appendChild(correctedSection);
  };

  // Function to display writing improvements
  const displayWritingImprovements = (data, replaceTextFunction) => {
    const container = document.getElementById("text-enhancer-content");
    container.innerHTML = ""; // Clear previous content

    if (data.suggestions && data.suggestions.length > 0) {
      data.suggestions.forEach((suggestion, index) => {
        const suggestionDiv = document.createElement("div");
        suggestionDiv.className = "suggestion-container";
        
        const headerDiv = document.createElement("div");
        headerDiv.className = "suggestion-header";
        headerDiv.textContent = `${suggestion.style} Version:`;
        suggestionDiv.appendChild(headerDiv);
        
        if (suggestion.improvements) {
          const improvementList = document.createElement("div");
          improvementList.className = "improvement-list";
          suggestion.improvements.forEach(imp => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "improvement-item";
            itemDiv.textContent = `• ${imp}`;
            improvementList.appendChild(itemDiv);
          });
          suggestionDiv.appendChild(improvementList);
        }
        
        const textDiv = document.createElement("div");
        textDiv.className = "suggestion-text";
        textDiv.textContent = suggestion.text;
        suggestionDiv.appendChild(textDiv);
        
        // Create action buttons
        const actionDiv = document.createElement("div");
        actionDiv.className = "suggestion-actions";
        
        const useBtn = document.createElement("button");
        useBtn.className = "use-btn";
        useBtn.textContent = "Use This";
        useBtn.addEventListener("click", () => replaceTextFunction(suggestion.text));
        
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.textContent = "Copy";
        copyBtn.addEventListener("click", () => copyToClipboard(suggestion.text, copyBtn));
        
        actionDiv.appendChild(useBtn);
        actionDiv.appendChild(copyBtn);
        suggestionDiv.appendChild(actionDiv);
        
        container.appendChild(suggestionDiv);
      });
    } else {
      const noImprovementDiv = document.createElement("div");
      noImprovementDiv.className = "suggestion-container";
      noImprovementDiv.textContent = "No improvements generated.";
      container.appendChild(noImprovementDiv);
    }
  };

  // Function to display formatted custom response
  const displayCustomResponse = (content) => {
    const container = document.getElementById("text-enhancer-content");
    container.innerHTML = ""; // Clear previous content
    
    // Convert markdown-like formatting to HTML
    let formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^\* (.*?)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');

    // Wrap list items in ul tags
    formattedContent = formattedContent.replace(/(<li>.*?<\/li>(?:<br>)*)+/g, (match) => {
      return '<ul>' + match.replace(/<br>/g, '') + '</ul>';
    });

    const formattedDiv = document.createElement("div");
    formattedDiv.className = "formatted-content";
    formattedDiv.innerHTML = formattedContent;
    container.appendChild(formattedDiv);
    
    // Create action buttons
    const actionDiv = document.createElement("div");
    actionDiv.className = "suggestion-actions";
    
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.textContent = "Copy Raw Text";
    copyBtn.addEventListener("click", () => copyToClipboard(content, copyBtn));
    
    actionDiv.appendChild(copyBtn);
    container.appendChild(actionDiv);
  };

  // Initialize the text enhancer
  const initTextEnhancer = () => {
    // Variables to store state
    let currentSelection = "";
    let activeElement = null;
    let isProcessing = false;
    let lastMousePosition = { x: 0, y: 0 };
    let cachedSelectionState = null;

    // Create UI elements only in the main window
    let uiElements = createElements();

    // Function to check if element is an input or textarea
    const isInputElement = (element) => {
      return (
        element &&
        ((element.tagName === "INPUT" &&
          (element.type === "text" ||
            element.type === "search" ||
            element.type === "email" ||
            element.type === "url")) ||
          element.tagName === "TEXTAREA" ||
          element.getAttribute("contenteditable") === "true")
      );
    };

    // Track mouse position
    document.addEventListener("mousemove", function (e) {
      lastMousePosition.x = e.clientX;
      lastMousePosition.y = e.clientY;
    });

    // Store selection information when text is selected
    const captureSelectionState = () => {
      const element = document.activeElement;
      if (!isInputElement(element)) return null;

      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        return {
          type: "input",
          element: element,
          start: element.selectionStart,
          end: element.selectionEnd,
          text: element.value.substring(
            element.selectionStart,
            element.selectionEnd
          )
        };
      } else if (element.getAttribute("contenteditable") === "true") {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        return {
          type: "contenteditable",
          element: element,
          range: range.cloneRange(),
          text: selection.toString()
        };
      }

      return null;
    };

    // Function to replace text in the captured selection
    const replaceSelectedText = (newText) => {
      if (!cachedSelectionState) {
        console.error("No cached selection state found for text replacement");
        return;
      }

      try {
        if (cachedSelectionState.type === "input") {
          const elem = cachedSelectionState.element;
          const start = cachedSelectionState.start;
          const end = cachedSelectionState.end;
          const currentValue = elem.value;

          elem.value =
            currentValue.substring(0, start) +
            newText +
            currentValue.substring(end);

          elem.focus();
          elem.setSelectionRange(start, start + newText.length);
        } else if (cachedSelectionState.type === "contenteditable") {
          const elem = cachedSelectionState.element;
          const range = cachedSelectionState.range;

          elem.focus();
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          document.execCommand("insertText", false, newText);
        } else {
          const elem = cachedSelectionState.element;
          const start = cachedSelectionState.start;
          const end = cachedSelectionState.end;
          const currentValue = elem.value;

          elem.value =
              currentValue.substring(0, start) +
              newText +
              currentValue.substring(end);

          elem.focus();
          elem.setSelectionRange(start, start + newText.length);
        }
      } catch (error) {
        console.error("Error replacing text:", error);
      }

      if (uiElements) {
        uiElements.popupContent.style.display = "none";
      }
    };

    // Debounce function to prevent rapid event firing
    const debounce = (func, wait) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    };

// Global object to track iframe selections
    const iframeSelectionState = {
      activeWindow: null,
      activeDocument: null,
      activeElement: null,
      selectionRange: null,
      selectedText: null,

      // Helper method to clear state
      clear() {
        this.activeWindow = null;
        this.activeDocument = null;
        this.activeElement = null;
        this.selectionRange = null;
        this.selectedText = null;
      }
    };

    if (uiElements) {
      // Function to add mouseup event listener to a document/window
      const addMouseUpListener = (targetDoc, targetWin) => {
        targetDoc.addEventListener("mouseup", (e) => {
          setTimeout(() => {
            const selection = targetWin.getSelection();
            const selectedText = selection.toString().trim();

            if (!selectedText || selectedText.length < 3) {
              uiElements.optionsContainer.style.opacity = "0";
              uiElements.optionsContainer.style.pointerEvents = "none";
              return;
            }

            // For iframe selections, we'll use messaging to communicate with the parent
            if (targetWin !== window) {
              const mousePos = {
                x: e.clientX + targetDoc.defaultView.frameElement.getBoundingClientRect().left,
                y: e.clientY + targetDoc.defaultView.frameElement.getBoundingClientRect().top
              };

              // Capture selection state relevant to the iframe
              const selectionState = captureIframeSelectionState(targetWin, targetDoc);

              // Send message to parent window
              window.postMessage({
                type: "TEXT_ENHANCER_SELECTION",
                data: {
                  text: selectedText,
                  mouseX: mousePos.x,
                  mouseY: mousePos.y,
                  selectionState: selectionState
                }
              }, "*");

              return;
            }

            activeElement = targetDoc.activeElement;

            if (!isInputElement(activeElement)) {
              uiElements.optionsContainer.style.opacity = "0";
              uiElements.optionsContainer.style.pointerEvents = "none";
              return;
            }

            const newSelectionState = captureSelectionState();
            if (!newSelectionState) return;

            cachedSelectionState = newSelectionState;
            currentSelection = selectedText;

            const optionsWidth = 300;
            const optionsHeight = 40;

            const safePos = getPositionInViewport(
                lastMousePosition.x,
                lastMousePosition.y + 10,
                optionsWidth,
                optionsHeight
            );

            uiElements.optionsContainer.style.top = window.scrollY + safePos.y + "px";
            uiElements.optionsContainer.style.left = window.scrollX + safePos.x + "px";
            uiElements.optionsContainer.style.opacity = "1";
            uiElements.optionsContainer.style.pointerEvents = "auto";

            uiElements.popupContent.style.display = "none";
          }, 100); // Increased delay to ensure selection is stable
        });
      };

      // Function to capture selection state within an iframe
      const captureIframeSelectionState = (iframeWin, iframeDoc) => {
        const selection = iframeWin.getSelection();
        if (!selection.rangeCount) return null;

        const range = selection.getRangeAt(0);

        // Store the range for this iframe in the global object
        if (iframeWin !== window) {
          // Store references for later use in replacement
          iframeSelectionState.activeWindow = iframeWin;
          iframeSelectionState.activeDocument = iframeDoc;
          iframeSelectionState.activeElement = iframeDoc.activeElement;
          iframeSelectionState.selectionRange = range.cloneRange();
          iframeSelectionState.selectedText = selection.toString();

          console.log(iframeSelectionState);
          testElement = iframeSelectionState;

        }

        return {
          start: range.startOffset,
          end: range.endOffset,
          text: selection.toString(),
          parentElement: {
            tagName: range.startContainer.parentElement ? range.startContainer.parentElement.tagName : null,
            className: range.startContainer.parentElement ? range.startContainer.parentElement.className : null
          },
          iframeSelector: getIframeSelector(iframeWin), // Helper function to identify the iframe
          isContentEditable: range.startContainer.parentElement ?
              range.startContainer.parentElement.isContentEditable : false,
          nodePath: getNodePath(range.startContainer, iframeDoc) // Store path to the node for reliable retrieval
        };
      };

      // Helper function to get a path to a node within document
      const getNodePath = (node, doc) => {
        let path = [];
        let current = node;

        while (current && current !== doc) {
          let index = 0;
          let sibling = current;

          while (sibling = sibling.previousSibling) {
            index++;
          }

          path.unshift(index);
          current = current.parentNode;
        }

        return path;
      };

      // Helper function to get a selector for the iframe
      const getIframeSelector = (iframeWin) => {
        const frameElement = iframeWin.frameElement;
        if (!frameElement) return null;

        // Basic selector based on id, class, or index
        if (frameElement.id) return `#${frameElement.id}`;
        if (frameElement.className) return `.${frameElement.className.split(' ').join('.')}`;

        // Fallback to index-based selector
        const allIframes = Array.from(document.querySelectorAll('iframe'));
        const index = allIframes.indexOf(frameElement);
        return `iframe:nth-child(${index + 1})`;
      };

      // Add listener to main document
      addMouseUpListener(document, window);

      // Function to recursively add listeners to all iframes
      const addListenersToIframes = () => {
        const iframes = document.querySelectorAll('iframe');

        iframes.forEach(iframe => {
          try {
            // Only proceed if we can access the iframe (same-origin policy)
            if (iframe.contentDocument) {
              addMouseUpListener(iframe.contentDocument, iframe.contentWindow);

              // Also listen for dynamically added iframes inside this iframe
              if (iframe.contentWindow) {
                // Add mutation observer to watch for new iframes
                const observer = new MutationObserver(mutations => {
                  const hasNewIframes = mutations.some(mutation =>
                      Array.from(mutation.addedNodes).some(node =>
                          node.tagName === 'IFRAME' || (node.querySelectorAll && node.querySelectorAll('iframe').length > 0)
                      )
                  );

                  if (hasNewIframes) {
                    // Recursively add listeners to new iframes
                    addListenersToIframes();
                  }
                });

                observer.observe(iframe.contentDocument.body, {
                  childList: true,
                  subtree: true
                });
              }
            }
          } catch (e) {
            // Handle cross-origin iframe access errors silently
            console.log('Cannot access iframe due to same-origin policy:', e);
          }
        });
      };

      // Initial setup for existing iframes
      addListenersToIframes();

      // Watch for dynamically added iframes in the main document
      const iframeObserver = new MutationObserver(mutations => {
        const hasNewIframes = mutations.some(mutation =>
            Array.from(mutation.addedNodes).some(node =>
                node.tagName === 'IFRAME' || (node.querySelectorAll && node.querySelectorAll('iframe').length > 0)
            )
        );

        if (hasNewIframes) {
          addListenersToIframes();
        }
      });

      iframeObserver.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Handle messages from iframe
      window.addEventListener("message", (event) => {
        if (event.data.type === "TEXT_ENHANCER_SELECTION") {
          const { text, mouseX, mouseY, selectionState, iframeId, iframeIndex } = event.data.data;

          currentSelection = text;
          cachedSelectionState = selectionState;

          // Store the iframe reference for later text replacement
          const iframe = iframeId ? document.getElementById(iframeId) :
              document.querySelectorAll('iframe')[iframeIndex];

          if (iframe) {
            try {
              // Store references to the active iframe components in the global object
              iframeSelectionState.activeWindow = iframe.contentWindow;
              iframeSelectionState.activeDocument = iframe.contentDocument;

              // Get the active element within the iframe
              if (iframeSelectionState.activeDocument) {
                iframeSelectionState.activeElement = iframeSelectionState.activeDocument.activeElement;

                // Store the selection range for future replacement
                if (iframeSelectionState.activeWindow &&
                    iframeSelectionState.activeWindow.getSelection().rangeCount > 0) {
                  iframeSelectionState.selectionRange = iframeSelectionState.activeWindow
                      .getSelection().getRangeAt(0).cloneRange();
                  iframeSelectionState.selectedText = text;
                }
              }
            } catch (e) {
              console.error("Error accessing iframe:", e);
              // Reset the iframe state
              iframeSelectionState.clear();
            }
          }

          const optionsWidth = 300;
          const optionsHeight = 40;

          const safePos = getPositionInViewport(
              mouseX,
              mouseY + 10,
              optionsWidth,
              optionsHeight
          );

          uiElements.optionsContainer.style.top = window.scrollY + safePos.y + "px";
          uiElements.optionsContainer.style.left = window.scrollX + safePos.x + "px";
          uiElements.optionsContainer.style.opacity = "1";
          uiElements.optionsContainer.style.pointerEvents = "auto";

          uiElements.popupContent.style.display = "none";
        }
      });

      // Enhanced function to replace text in iframe or regular document
      const enhancedReplaceSelectedText = (newText) => {
        // If we have an active iframe selection, use that
        if (iframeSelectionState.activeWindow &&
            iframeSelectionState.activeDocument &&
            iframeSelectionState.selectionRange) {
          try {
            // Focus the iframe and its active element
            iframeSelectionState.activeWindow.focus();
            if (iframeSelectionState.activeElement && iframeSelectionState.activeElement.focus) {
              iframeSelectionState.activeElement.focus();
            }

            // Create a fresh selection using our stored range
            const selection = iframeSelectionState.activeWindow.getSelection();
            selection.removeAllRanges();
            selection.addRange(iframeSelectionState.selectionRange);

            // Insert the new text
            iframeSelectionState.selectionRange.deleteContents();
            iframeSelectionState.selectionRange.insertNode(
                iframeSelectionState.activeDocument.createTextNode(newText)
            );

            // Clear selection after replacement
            selection.removeAllRanges();

            return true;
          } catch (e) {
            console.error("Error replacing text in iframe:", e);
            // Fall back to regular replacement if iframe replacement fails
            return replaceSelectedText(newText);
          }
        } else {
          // Use the original replacement function for regular document
          return replaceSelectedText(newText);
        }
      };

      // Set up event handlers for option buttons
      document.getElementById("text-enhancer-grammar").addEventListener("click", async () => {
        if (isProcessing) return;

        showPopup("Correct Grammar");
        uiElements.contentContainer.innerHTML = '<div style="text-align: center;">Analyzing grammar...</div>';
        isProcessing = true;

        try {
          const result = await correctGrammarWithGemini(currentSelection, API_KEY);
          displayGrammarCorrection(result, enhancedReplaceSelectedText);
        } catch (error) {
          uiElements.contentContainer.innerHTML = `<div style="color: #e74c3c">Error: ${error.message}</div>`;
        } finally {
          isProcessing = false;
        }
      });

      document.getElementById("text-enhancer-improve").addEventListener("click", async () => {
        if (isProcessing) return;

        showPopup("Improve Writing");
        uiElements.contentContainer.innerHTML = '<div style="text-align: center;">Generating improvements...</div>';
        isProcessing = true;

        try {
          const result = await improveWritingWithGemini(currentSelection, API_KEY);
          displayWritingImprovements(result, enhancedReplaceSelectedText);
        } catch (error) {
          uiElements.contentContainer.innerHTML = `<div style="color: #e74c3c">Error: ${error.message}</div>`;
        } finally {
          isProcessing = false;
        }
      });

      document.getElementById("text-enhancer-custom").addEventListener("click", () => {
        showPopup("Custom Prompt");

        uiElements.contentContainer.innerHTML = `
      <div class="custom-prompt-container">
        <h3>Custom Prompt</h3>
        <input type="text" class="custom-prompt-input" placeholder="Enter your request (e.g., make it more formal, add examples, etc.)" />
        <button class="custom-submit-btn">Generate</button>
      </div>`;

        const input = uiElements.contentContainer.querySelector(".custom-prompt-input");
        const submitBtn = uiElements.contentContainer.querySelector(".custom-submit-btn");

        const handleSubmit = async () => {
          const prompt = input.value.trim();
          if (!prompt || isProcessing) return;

          isProcessing = true;
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="loading-spinner"></span> Processing...';

          try {
            const result = await customPromptWithGemini(currentSelection, prompt, API_KEY);
            displayCustomResponse(result);
          } catch (error) {
            uiElements.contentContainer.innerHTML = `<div style="color: #e74c3c">Error: ${error.message}</div>`;
          } finally {
            isProcessing = false;
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Generate';
          }
        };

        // Prevent keyboard events from propagating to Notion
        input.addEventListener("keydown", (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();

          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        });

        input.addEventListener("keyup", (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        });

        input.addEventListener("keypress", (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        });

        submitBtn.addEventListener("click", handleSubmit);
        input.focus();
      });

      // Function to show popup
      const showPopup = (title) => {
        uiElements.popupContent.querySelector("#text-enhancer-drag-handle span").textContent = `✦ ${title}`;

        const popupWidth = 450;
        const popupHeight = 400;

        const optionsRect = uiElements.optionsContainer.getBoundingClientRect();
        const safePos = getPositionInViewport(
            optionsRect.left,
            optionsRect.bottom + 5,
            popupWidth,
            popupHeight
        );

        uiElements.popupContent.style.top = window.scrollY + safePos.y + "px";
        uiElements.popupContent.style.left = window.scrollX + safePos.x + "px";
        uiElements.popupContent.style.display = "block";
      };

      // Function to clear iframe selection state - using the object's method
      const clearIframeSelectionState = () => {
        iframeSelectionState.clear();
      };

      // Close button functionality
      const closeBtn = uiElements.popupContent.querySelector(".close-btn");
      closeBtn.addEventListener("click", () => {
        uiElements.popupContent.style.display = "none";
        uiElements.optionsContainer.style.opacity = "0";
        uiElements.optionsContainer.style.pointerEvents = "none";
        clearIframeSelectionState();
      });

      // Handle escape key to dismiss
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          uiElements.popupContent.style.display = "none";
          uiElements.optionsContainer.style.opacity = "0";
          uiElements.optionsContainer.style.pointerEvents = "none";
          clearIframeSelectionState();
        }
      });

      // Add debug function for development
      window.debugIframeSelection = () => {
        return {
          ...iframeSelectionState,
          currentSelection
        };
      };
    }

    console.log("Enhanced text enhancer tool activated with iframe support!");
  };

  // Initialize the enhancer when the page is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTextEnhancer);
  } else {
    initTextEnhancer();
  }
})();