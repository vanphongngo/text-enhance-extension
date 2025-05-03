document.addEventListener('DOMContentLoaded', function() {
  // Get the DOM elements
  const apiTokenInput = document.getElementById('apiToken');
  const saveButton = document.getElementById('saveToken');
  const statusDiv = document.getElementById('status');

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
    
    // Save to Chrome storage
    chrome.storage.sync.set({geminiApiToken: token}, function() {
      showStatus('Token saved successfully!', 'success');
    });
  });

  // Function to show status messages
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    statusDiv.style.display = 'block';
    
    // Hide the status message after 3 seconds
    setTimeout(function() {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});