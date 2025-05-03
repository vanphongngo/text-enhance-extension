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
      gap: 5px;
      z-index: 99999;
      opacity: 0;
      pointer-events: none;
    `;

    // Create option buttons
    const options = [
      { id: "grammar", text: "Correct Grammar", color: "#3498db" },
      { id: "improve", text: "Improve Writing", color: "#2ecc71" },
      { id: "custom", text: "Custom Prompt", color: "#e67e22" },
    ];

    options.forEach((option) => {
      const button = document.createElement("button");
      button.id = `text-enhancer-${option.id}`;
      button.textContent = option.text;
      button.style.cssText = `
        background-color: ${option.color};
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        white-space: nowrap;
        transition: all 0.2s ease;
      `;
      
      button.addEventListener("mouseover", () => {
        button.style.opacity = "0.9";
      });
      
      button.addEventListener("mouseout", () => {
        button.style.opacity = "1";
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
  const displayGrammarCorrection = (data) => {
    const container = document.getElementById("text-enhancer-content");
    let html = "";

    if (data.errors && data.errors.length > 0) {
      html += "<h3>Grammar Corrections:</h3>";
      data.errors.forEach((error) => {
        html += `
          <div class="error-item">
            <div><span class="error-original">${error.original}</span> → <span class="error-correction">${error.correction}</span></div>
            <div class="error-explanation">Explanation: ${error.explanation}</div>
          </div>`;
      });
    } else {
      html += "<div class='suggestion-container'>No grammar errors found!</div>";
    }

    html += `
      <div class="suggestion-container">
        <div class="suggestion-header">Corrected Text:</div>
        <div class="suggestion-text">${data.correctedText}</div>
        <div class="suggestion-actions">
          <button class="use-btn" onclick="replaceTextHandler('${encodeURIComponent(data.correctedText)}')">Use This</button>
          <button class="copy-btn" onclick="copyHandler('${encodeURIComponent(data.correctedText)}', this)">Copy</button>
        </div>
      </div>`;

    container.innerHTML = html;
  };

  // Function to display writing improvements
  const displayWritingImprovements = (data) => {
    const container = document.getElementById("text-enhancer-content");
    let html = "";

    if (data.suggestions && data.suggestions.length > 0) {
      data.suggestions.forEach((suggestion, index) => {
        html += `
          <div class="suggestion-container">
            <div class="suggestion-header">${suggestion.style} Version:</div>
            ${suggestion.improvements ? `
              <div class="improvement-list">
                ${suggestion.improvements.map(imp => `<div class="improvement-item">• ${imp}</div>`).join('')}
              </div>
            ` : ''}
            <div class="suggestion-text">${suggestion.text}</div>
            <div class="suggestion-actions">
              <button class="use-btn" onclick="replaceTextHandler('${encodeURIComponent(suggestion.text)}')">Use This</button>
              <button class="copy-btn" onclick="copyHandler('${encodeURIComponent(suggestion.text)}', this)">Copy</button>
            </div>
          </div>`;
      });
    } else {
      html += "<div class='suggestion-container'>No improvements generated.</div>";
    }

    container.innerHTML = html;
  };

  // Function to display formatted custom response
  const displayCustomResponse = (content) => {
    const container = document.getElementById("text-enhancer-content");
    
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

    container.innerHTML = `
      <div class="formatted-content">
        ${formattedContent}
      </div>
      <div class="suggestion-actions">
        <button class="copy-btn" onclick="copyHandler('${encodeURIComponent(content)}', this)">Copy Raw Text</button>
      </div>`;
  };

  // Initialize the text enhancer
  const initTextEnhancer = () => {
    // Variables to store state
    let currentSelection = "";
    let activeElement = null;
    let isProcessing = false;
    let lastMousePosition = { x: 0, y: 0 };
    let cachedSelectionState = null;

    // Create the UI elements
    const { optionsContainer, popupContent, contentContainer } = createElements();

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
          ),
        };
      } else if (element.getAttribute("contenteditable") === "true") {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        return {
          type: "contenteditable",
          element: element,
          range: range.cloneRange(),
          text: selection.toString(),
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
        }
      } catch (error) {
        console.error("Error replacing text:", error);
      }

      popupContent.style.display = "none";
    };

    // Global handlers for buttons
    window.replaceTextHandler = function(encodedText) {
      const text = decodeURIComponent(encodedText);
      replaceSelectedText(text);
    };

    window.copyHandler = function(encodedText, button) {
      const text = decodeURIComponent(encodedText);
      copyToClipboard(text, button);
    };

    // Handle text selection and mouse up events
    document.addEventListener("mouseup", function (e) {
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (!selectedText || selectedText.length < 3) {
          optionsContainer.style.opacity = "0";
          optionsContainer.style.pointerEvents = "none";
          return;
        }

        activeElement = document.activeElement;

        if (!isInputElement(activeElement)) {
          optionsContainer.style.opacity = "0";
          optionsContainer.style.pointerEvents = "none";
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

        optionsContainer.style.top = window.scrollY + safePos.y + "px";
        optionsContainer.style.left = window.scrollX + safePos.x + "px";
        optionsContainer.style.opacity = "1";
        optionsContainer.style.pointerEvents = "auto";

        popupContent.style.display = "none";
      }, 10);
    });

    // Set up event handlers for option buttons
    document.getElementById("text-enhancer-grammar").addEventListener("click", async () => {
      if (isProcessing) return;
      
      showPopup("Correct Grammar");
      contentContainer.innerHTML = '<div style="text-align: center;">Analyzing grammar...</div>';
      isProcessing = true;

      try {
        const result = await correctGrammarWithGemini(currentSelection, API_KEY);
        displayGrammarCorrection(result);
      } catch (error) {
        contentContainer.innerHTML = `<div style="color: #e74c3c">Error: ${error.message}</div>`;
      } finally {
        isProcessing = false;
      }
    });

    document.getElementById("text-enhancer-improve").addEventListener("click", async () => {
      if (isProcessing) return;
      
      showPopup("Improve Writing");
      contentContainer.innerHTML = '<div style="text-align: center;">Generating improvements...</div>';
      isProcessing = true;

      try {
        const result = await improveWritingWithGemini(currentSelection, API_KEY);
        displayWritingImprovements(result);
      } catch (error) {
        contentContainer.innerHTML = `<div style="color: #e74c3c">Error: ${error.message}</div>`;
      } finally {
        isProcessing = false;
      }
    });

    document.getElementById("text-enhancer-custom").addEventListener("click", () => {
      showPopup("Custom Prompt");
      
      contentContainer.innerHTML = `
        <div class="custom-prompt-container">
          <h3>Custom Prompt</h3>
          <input type="text" class="custom-prompt-input" placeholder="Enter your request (e.g., make it more formal, add examples, etc.)" />
          <button class="custom-submit-btn">Generate</button>
        </div>`;

      const input = contentContainer.querySelector(".custom-prompt-input");
      const submitBtn = contentContainer.querySelector(".custom-submit-btn");

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
          contentContainer.innerHTML = `<div style="color: #e74c3c">Error: ${error.message}</div>`;
        } finally {
          isProcessing = false;
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Generate';
        }
      };

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSubmit();
        }
      });

      submitBtn.addEventListener("click", handleSubmit);
      input.focus();
    });

    // Function to show popup
    const showPopup = (title) => {
      popupContent.querySelector("#text-enhancer-drag-handle span").textContent = `✦ ${title}`;
      
      const popupWidth = 450;
      const popupHeight = 400;

      const optionsRect = optionsContainer.getBoundingClientRect();
      const safePos = getPositionInViewport(
        optionsRect.left,
        optionsRect.bottom + 5,
        popupWidth,
        popupHeight
      );

      popupContent.style.top = window.scrollY + safePos.y + "px";
      popupContent.style.left = window.scrollX + safePos.x + "px";
      popupContent.style.display = "block";
    };

    // Close button functionality
    const closeBtn = popupContent.querySelector(".close-btn");
    closeBtn.addEventListener("click", () => {
      popupContent.style.display = "none";
      optionsContainer.style.opacity = "0";
      optionsContainer.style.pointerEvents = "none";
    });

    // Handle escape key to dismiss
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        popupContent.style.display = "none";
        optionsContainer.style.opacity = "0";
        optionsContainer.style.pointerEvents = "none";
      }
    });

    console.log("Enhanced text enhancer tool activated with three options!");
  };

  // Initialize the enhancer when the page is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTextEnhancer);
  } else {
    initTextEnhancer();
  }
})();