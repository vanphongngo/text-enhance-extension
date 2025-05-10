function getAllSelectedText() {
  // Function to get selection from a document
  function getSelectionFromDocument(doc) {
    let selection = "";

    // Get the window selection if it exists
    if (doc.getSelection) {
      selection = doc.getSelection().toString();
    }
    // For older IE support
    else if (doc.selection && doc.selection.type !== "Control") {
      selection = doc.selection.createRange().text;
    }

    return selection;
  }

  // Get selection from main document
  let mainSelection = getSelectionFromDocument(document);
  let allSelections = mainSelection ? [mainSelection] : [];

  // Try to get selections from all iframes
  try {
    const iframes = document.querySelectorAll("iframe");

    for (let i = 0; i < iframes.length; i++) {
      try {
        // Skip iframes from different origins (will throw security error)
        const iframeDoc =
          iframes[i].contentDocument || iframes[i].contentWindow.document;
        const iframeSelection = getSelectionFromDocument(iframeDoc);

        if (iframeSelection) {
          allSelections.push(iframeSelection);
        }
      } catch (err) {
        // Silent fail for cross-origin iframes
        console.log("Couldn't access iframe content due to same-origin policy");
      }
    }
  } catch (err) {
    console.error("Error accessing iframes:", err);
  }

  return allSelections.join("\n");
}

(function () {
  function enhanceSelectedText() {
    // Function to capitalize first letter of each word
    function capitalizeWords(text) {
      return text.replace(/\b\w+/g, function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      });
    }

    // Function to process selection in a document
    function processSelectionInDocument(doc) {
      let selection = doc.getSelection();
      if (!selection || selection.isCollapsed) return false;

      // Get the selected range
      let range = selection.getRangeAt(0);
      if (!range) return false;

      // Get the text content and format it
      let originalText = selection.toString();
      let capitalizedText = capitalizeWords(originalText);

      // Delete the original content and insert the new content
      range.deleteContents();
      range.insertNode(doc.createTextNode(capitalizedText));

      return true;
    }

    // Process main document
    let mainResult = processSelectionInDocument(document);
    let processedAny = mainResult;

    // Try to process selections in all accessible iframes
    try {
      const iframes = document.querySelectorAll("iframe");

      for (let i = 0; i < iframes.length; i++) {
        try {
          // Skip iframes from different origins (will throw security error)
          const iframeDoc =
            iframes[i].contentDocument || iframes[i].contentWindow.document;
          const iframeResult = processSelectionInDocument(iframeDoc);
          processedAny = processedAny || iframeResult;
        } catch (err) {
          // Silent fail for cross-origin iframes
          console.log(
            "Couldn't access iframe content due to same-origin policy"
          );
        }
      }
    } catch (err) {
      console.error("Error accessing iframes:", err);
    }

    // Copy the modified text to clipboard (main document only)
    if (mainResult) {
      try {
        document.execCommand("copy");
        console.log("Modified text copied to clipboard");
      } catch (err) {
        console.error("Could not copy to clipboard:", err);
      }
    }

    return processedAny
      ? "Text has been capitalized and replaced"
      : "No text was selected";
  }

  // Execute the function
  enhanceSelectedText();
})();
