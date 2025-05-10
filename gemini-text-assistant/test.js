let selectionElement = null;

document.addEventListener('selectionchange', function() {
  const selection = document.getSelection();
  if (selection && selection.toString().trim() !== '') {
    console.log('%cMain document selection:', 'color: blue; font-weight: bold', selection.toString());
  }
});

// Find all iframes in the document
const iframes = document.querySelectorAll('iframe');

// For each iframe that's accessible
iframes.forEach((iframe, index) => {
  try {
    // Try to access the iframe's document (this will fail for cross-origin iframes)
    const iframeDocument = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);

    if (iframeDocument) {
      // Add selection change listener to this iframe
      iframeDocument.addEventListener('selectionchange', function() {
        const selection = iframeDocument.getSelection();
        if (selection && selection.toString().trim() !== '') {
          console.log(`%cIframe #${index} selection:`, 'color: green; font-weight: bold', selection.toString());
        }
        selectionElement = selection;
      });
      console.log(`%cSuccessfully added selection listener to iframe #${index}`, 'color: green');

    }
  } catch (error) {
    console.log(`%cCannot access iframe #${index} (likely cross-origin)`, 'color: red', error.message);
  }
});