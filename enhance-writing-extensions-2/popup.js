document.addEventListener('DOMContentLoaded', function() {
  // Get the DOM elements
  const apiTokenInput = document.getElementById('apiToken');
  const saveButton = document.getElementById('saveToken');
  const statusDiv = document.getElementById('status');
  const selectionOptions = document.getElementById('selection-options');
  const noSelectionDiv = document.getElementById('no-selection');

  // Load any existing token from storage
  chrome.storage.sync.get(['geminiApiToken'], function(result) {
    if (result.geminiApiToken) {
      apiTokenInput.value = result.geminiApiToken;
    }
  });

  // Save token when the save button is clicked
  saveButton.addEventListener('click', function() {
    const token = apiTokenInput.value.trim();
    
    if (!token) {
      showStatus('Please enter a valid API token', 'error');
      return;
    }
    
    chrome.storage.sync.set({geminiApiToken: token}, function() {
      showStatus('Token saved successfully!', 'success');
    });
  });

  // Function to show status messages
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    statusDiv.style.display = 'block';
    
    setTimeout(function() {
      statusDiv.style.display = 'none';
    }, 3000);
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

  // Get the active tab and request selection
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.tabs.sendMessage(tabId, { type: "get_selection" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        showStatus('Error communicating with content script', 'error');
        return;
      }
      if (response && response.text) {
        displaySelectionOptions(response.text, response.selectionId);
      } else {
        noSelectionDiv.style.display = 'block';
      }
    });
  });

  // Display selection options
  function displaySelectionOptions(text, selectionId) {
    selectionOptions.style.display = 'block';
    document.getElementById('selected-text').textContent = text;

    document.getElementById('grammar-btn').addEventListener('click', () => handleOption('grammar', text, selectionId));
    document.getElementById('improve-btn').addEventListener('click', () => handleOption('improve', text, selectionId));
    document.getElementById('custom-btn').addEventListener('click', () => handleOption('custom', text, selectionId));
  }

  // Handle option selection and API calls
  async function handleOption(option, text, selectionId) {
    const apiToken = await new Promise((resolve) => {
      chrome.storage.sync.get(['geminiApiToken'], (result) => resolve(result.geminiApiToken));
    });
    if (!apiToken) {
      showStatus('No API token found. Please enter your token.', 'error');
      return;
    }

    let result;
    if (option === 'grammar') {
      result = await correctGrammarWithGemini(text, apiToken);
    } else if (option === 'improve') {
      result = await improveWritingWithGemini(text, apiToken);
    } else if (option === 'custom') {
      const customPrompt = prompt("Enter your custom request:");
      if (customPrompt) {
        result = await customPromptWithGemini(text, customPrompt, apiToken);
      } else {
        return;
      }
    }

    // Display result
    const resultContainer = document.getElementById('result-container');
    resultContainer.innerHTML = '';

    if (option === 'grammar') {
      const correctedText = result.correctedText;
      resultContainer.innerHTML = `<p>Corrected Text: ${correctedText}</p>`;
      const applyBtn = document.createElement('button');
      applyBtn.textContent = 'Apply';
      applyBtn.addEventListener('click', () => applyCorrection(correctedText, selectionId));
      resultContainer.appendChild(applyBtn);
    } else if (option === 'improve') {
      result.suggestions.forEach((suggestion, index) => {
        const div = document.createElement('div');
        div.innerHTML = `<h4>${suggestion.style}</h4><p>${suggestion.text}</p>`;
        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply';
        applyBtn.addEventListener('click', () => applyCorrection(suggestion.text, selectionId));
        div.appendChild(applyBtn);
        resultContainer.appendChild(div);
      });
    } else if (option === 'custom') {
      resultContainer.innerHTML = `<p>${result}</p>`;
      const applyBtn = document.createElement('button');
      applyBtn.textContent = 'Apply';
      applyBtn.addEventListener('click', () => applyCorrection(result, selectionId));
      resultContainer.appendChild(applyBtn);
    }
  }

  // Apply correction back to the content script
  function applyCorrection(newText, selectionId) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabId, { type: "replace_text", newText: newText, selectionId: selectionId });
    });
  }
});