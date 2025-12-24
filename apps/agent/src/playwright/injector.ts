import { Page } from "playwright";
import { analyzeFormsWithOpenAI, OpenAIForm } from "./geminiService";
import { showToast } from "./uiHelpers";

let isPointerModeActive = false;
let isInputModeActive = false;

/**
 * Helper function for consistent logging with timestamps
 */
const log = (step: string, message: string, data?: any): void => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${step}] ${message}`;
  if (data !== undefined) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

/**
 * Helper function for error logging with timestamps
 */
const logError = (step: string, message: string, error: unknown): void => {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  console.error(`[${timestamp}] [ERROR] [${step}] ${message}`, {
    error: errorMessage,
    stack: errorStack,
  });
};

const activateInputMode = async (page: Page): Promise<void> => {
  const startTime = Date.now();
  log("INPUT_MODE", "Starting input mode", { pageUrl: page.url() });

  // Inject input mode code as a string to avoid TypeScript compilation issues
  const inputModeCode = `
    (function() {
      // Remove existing overlays and highlights
      const existingOverlays = document.querySelectorAll(".qa-agent-form-overlay");
      existingOverlays.forEach(function(overlay) { overlay.remove(); });

      const existingHighlights = document.querySelectorAll(".qa-agent-form-highlight");
      existingHighlights.forEach(function(highlight) { highlight.remove(); });

      // Store selected element
      let selectedElement = null;
      let highlightElement = null;

      // Function to generate CSS selector for an element
      function generateSelector(element) {
        if (element.id) {
          return "#" + element.id;
        }

        const path = [];
        let current = element;

        while (current && current.nodeType === Node.ELEMENT_NODE) {
          let selector = current.nodeName.toLowerCase();

          if (current.id) {
            selector = "#" + current.id;
            path.unshift(selector);
            break;
          } else {
            const parent = current.parentElement;
            if (parent) {
              const siblings = Array.from(parent.children);
              const index = siblings.indexOf(current) + 1;
              selector += ":nth-child(" + index + ")";
            }
          }

          path.unshift(selector);
          current = current.parentElement;
        }

        return path.join(" > ");
      }

      // Function to update highlight
      function updateHighlight(element) {
        // Remove existing highlight
        if (highlightElement) {
          highlightElement.remove();
        }

        function updatePosition() {
          if (!selectedElement || !highlightElement) return;
          const rect = selectedElement.getBoundingClientRect();
          highlightElement.style.top = rect.top + "px";
          highlightElement.style.left = rect.left + "px";
          highlightElement.style.width = rect.width + "px";
          highlightElement.style.height = rect.height + "px";
        }

        const rect = element.getBoundingClientRect();
        highlightElement = document.createElement("div");
        highlightElement.className = "qa-agent-form-highlight";
        highlightElement.style.cssText = 
          "position: fixed;" +
          "top: " + rect.top + "px;" +
          "left: " + rect.left + "px;" +
          "width: " + rect.width + "px;" +
          "height: " + rect.height + "px;" +
          "border: 3px solid #007bff;" +
          "border-radius: 8px;" +
          "background-color: rgba(0, 123, 255, 0.1);" +
          "box-shadow: 0 0 20px rgba(0, 123, 255, 0.5);" +
          "pointer-events: none;" +
          "z-index: 999997;" +
          "transition: all 0.2s ease;";
        
        document.body.appendChild(highlightElement);

        // Add scroll and resize listeners
        const scrollHandler = function() { updatePosition(); };
        window.addEventListener("scroll", scrollHandler, true);
        window.addEventListener("resize", scrollHandler);
        
        // Store handlers for cleanup
        window.qaAgentInputModeScrollHandler = scrollHandler;

        // Enable extract button
        const extractBtn = document.getElementById("qa-agent-extract-btn");
        if (extractBtn) {
          extractBtn.disabled = false;
          extractBtn.style.opacity = "1";
          extractBtn.style.cursor = "pointer";
        }
        
        // Also call the exposed function if available
        if (window.qaAgentEnableExtractButton) {
          window.qaAgentEnableExtractButton();
        }
      }

      // Function to handle element click
      function handleElementClick(e) {
        const target = e.target;
        
        // Check if clicking on control buttons, floating bar, or their container FIRST
        // This must be checked before preventDefault to allow button clicks
        if (target.id === "qa-agent-detect-btn" || 
            target.id === "qa-agent-cancel-btn" || 
            target.id === "qa-agent-extract-btn" ||
            target.id === "qa-agent-logo" ||
            target.id === "qa-agent-ghost-writer-btn" ||
            target.closest("#qa-agent-controls") ||
            target.closest("#qa-agent-floating-bar") ||
            target.closest("#qa-agent-detect-btn")) {
          // Don't prevent default for control buttons - let them handle their own clicks
          return;
        }

        // Only prevent default for other elements (to prevent form submissions, etc.)
        e.preventDefault();
        e.stopPropagation();

        selectedElement = target;
        updateHighlight(target);

        // Store selector in window for later use (only serializable data)
        const selector = generateSelector(target);
        window.qaAgentSelectedElement = {
          selector: selector,
          html: target.outerHTML,
        };
      }

      // Add click listener to document with capture phase
      // But we check for control buttons FIRST before preventDefault
      document.addEventListener("click", handleElementClick, true);

      // Store cleanup function
      window.qaAgentInputModeCleanup = function() {
        document.removeEventListener("click", handleElementClick, true);
        if (window.qaAgentInputModeScrollHandler) {
          window.removeEventListener("scroll", window.qaAgentInputModeScrollHandler, true);
          window.removeEventListener("resize", window.qaAgentInputModeScrollHandler);
          window.qaAgentInputModeScrollHandler = null;
        }
        if (highlightElement) {
          highlightElement.remove();
        }
        selectedElement = null;
        window.qaAgentSelectedElement = null;
      };

      // Set input mode flag
      window.qaAgentInputMode = true;

      // Show cancel and extract buttons in floating bar
      const cancelBtn = document.getElementById("qa-agent-cancel-btn");
      const extractBtn = document.getElementById("qa-agent-extract-btn");
      if (cancelBtn) {
        cancelBtn.style.display = "block";
      }
      if (extractBtn) {
        extractBtn.style.display = "block";
      }
    })();
  `;

  await page.evaluate(inputModeCode);

  log("INPUT_MODE", "Input mode activated", {
    duration: `${Date.now() - startTime}ms`,
  });
};

const activatePointerMode = async (page: Page): Promise<void> => {
  const startTime = Date.now();
  const pageUrl = page.url();
  log("LLM_ANALYSIS", "Starting LLM form analysis", { pageUrl });

  // Show loading state
  log("LLM_ANALYSIS", "Updating button to 'Analyzing...' state");
  await page.evaluate(() => {
    const button = document.getElementById("qa-agent-detect-btn");
    if (button) {
      button.textContent = "Analyzing...";
      button.style.backgroundColor = "#6c757d";
      button.style.cursor = "wait";
      (button as HTMLButtonElement).disabled = true;
    }
  });

  // Get HTML content from the page
  log("LLM_ANALYSIS", "Extracting HTML content from page...");
  const htmlStartTime = Date.now();
  const html = await page.content();
  const htmlDuration = Date.now() - htmlStartTime;
  const htmlSize = html.length;
  log("LLM_ANALYSIS", "HTML content extracted", {
    size: `${htmlSize} bytes`,
    duration: `${htmlDuration}ms`,
  });

  // Analyze forms using OpenAI
  let openAIForms: OpenAIForm[];
  try {
    log("LLM_ANALYSIS", "Calling OpenAI API for form analysis...", {
      htmlSize: `${htmlSize} bytes`,
      truncatedSize: `${Math.min(htmlSize, 100000)} bytes`,
    });
    const apiStartTime = Date.now();

    const analysis = await analyzeFormsWithOpenAI(html);
    openAIForms = analysis.forms;

    const apiDuration = Date.now() - apiStartTime;
    log("LLM_ANALYSIS", "OpenAI API call completed", {
      formsFound: openAIForms.length,
      duration: `${apiDuration}ms`,
    });

    if (openAIForms.length === 0) {
      const totalDuration = Date.now() - startTime;
      log(
        "LLM_ANALYSIS",
        "No forms detected by LLM - waiting 5 seconds and continuing",
        {
          totalDuration: `${totalDuration}ms`,
        }
      );
      await showToast(page, "No forms found on this page", "warning");
      await page.waitForTimeout(5000);
      await page.evaluate(() => {
        (window as any).qaAgentPointerMode = false;
        const button = document.getElementById("qa-agent-detect-btn");
        if (button) {
          button.textContent = "Detect Form";
          button.style.backgroundColor = "#007bff";
          button.style.cursor = "pointer";
          (button as HTMLButtonElement).disabled = false;
        }
      });
      return;
    }

    log("LLM_ANALYSIS", "Forms detected, storing form data...", {
      formsCount: openAIForms.length,
      forms: openAIForms.map((f) => ({
        index: f.formIndex,
        containerSelector: f.containerSelector,
        fieldsCount: f.fields.length,
      })),
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    logError("LLM_ANALYSIS", "LLM form analysis failed", error);
    log(
      "LLM_ANALYSIS",
      "LLM analysis failed - waiting 5 seconds and continuing",
      {
        totalDuration: `${totalDuration}ms`,
      }
    );

    const errorMessage = error instanceof Error ? error.message : String(error);
    await showToast(page, `Failed to analyze forms: ${errorMessage}`, "error");
    await page.waitForTimeout(5000);
    await page.evaluate(() => {
      (window as any).qaAgentPointerMode = false;
      const button = document.getElementById("qa-agent-detect-btn");
      if (button) {
        button.textContent = "Detect Form";
        button.style.backgroundColor = "#007bff";
        button.style.cursor = "pointer";
        (button as HTMLButtonElement).disabled = false;
      }
    });
    return;
  }

  // Update button to show processing state
  log("LLM_ANALYSIS", "Updating button to 'Extracting...' state");
  await page.evaluate(() => {
    const button = document.getElementById("qa-agent-detect-btn");
    if (button) {
      button.textContent = "Extracting...";
      button.style.backgroundColor = "#6c757d";
      button.style.cursor = "wait";
      (button as HTMLButtonElement).disabled = true;
    }
  });

  // Store OpenAI forms data globally for later extraction
  log("LLM_ANALYSIS", "Storing form data in window object...");
  await page.evaluate((forms) => {
    (window as any).qaAgentOpenAIForms = forms;
    // Keep legacy name for backward compatibility
    (window as any).qaAgentGeminiForms = forms;
  }, openAIForms);
  log("LLM_ANALYSIS", "Form data stored successfully");

  const totalDuration = Date.now() - startTime;
  log("LLM_ANALYSIS", "=== LLM Analysis Completed Successfully ===", {
    totalDuration: `${totalDuration}ms`,
    formsDetected: openAIForms.length,
  });

  // Now highlight the forms using OpenAI's bounding boxes and selectors
  // Serialize forms data to ensure it's JSON-serializable
  const serializedForms = JSON.parse(JSON.stringify(openAIForms));

  // Inject code using addInitScript to avoid serialization issues, then execute
  const highlightCode = `
    (function() {
      if (!window.qaAgentHighlightForms) {
        window.qaAgentHighlightForms = function(forms) {
          // Remove existing overlays and highlights
          const existingOverlays = document.querySelectorAll(".qa-agent-form-overlay");
          existingOverlays.forEach(function(overlay) { overlay.remove(); });

          const existingHighlights = document.querySelectorAll(".qa-agent-form-highlight");
          existingHighlights.forEach(function(highlight) { highlight.remove(); });

          // Store click handlers and highlight elements for cleanup
          const formClickHandlers = [];
          const highlightElements = [];

          // Function to update highlight positions based on current element positions
          const updatePositions = function() {
            highlightElements.forEach(function(item) {
              try {
                const formElement = document.querySelector(item.formSelector);
                if (formElement) {
                  const rect = formElement.getBoundingClientRect();
                  item.highlight.style.top = rect.top + "px";
                  item.highlight.style.left = rect.left + "px";
                  item.highlight.style.width = rect.width + "px";
                  item.highlight.style.height = rect.height + "px";
                  item.label.style.top = Math.max(0, rect.top - 30) + "px";
                  item.label.style.left = rect.left + "px";
                }
              } catch (e) {
                // Element might not exist anymore, skip
              }
            });
          };

          // Create a shared cleanup function
          const cleanup = function() {
            // Remove scroll/resize listeners
            if (window.qaAgentScrollHandler) {
              window.removeEventListener("scroll", window.qaAgentScrollHandler, true);
              window.removeEventListener("resize", window.qaAgentScrollHandler);
              window.qaAgentScrollHandler = null;
            }

            // Remove all highlights
            document.querySelectorAll(".qa-agent-form-highlight").forEach(function(el) { el.remove(); });
            document.querySelectorAll(".qa-agent-form-overlay").forEach(function(el) { el.remove(); });

            // Reset form styles and remove click listeners
            formClickHandlers.forEach(function(item) {
              item.element.removeEventListener("click", item.handler);
              item.element.style.cursor = "";
              item.element.style.position = "";
              item.element.style.zIndex = "";
            });

            // Update button state
            window.qaAgentPointerMode = false;
            const button = document.getElementById("qa-agent-detect-btn");
            if (button) {
              button.textContent = "Detect Form";
              button.style.backgroundColor = "#007bff";
            }
          };

          // Store cleanup function globally for deactivate
          window.qaAgentCleanup = cleanup;

          // Create highlights for each form identified by OpenAI
          forms.forEach(function(openAIForm, index) {
            // Try to find the form element using OpenAI's selector
            let formElement = null;
            try {
              formElement = document.querySelector(openAIForm.containerSelector);
            } catch (e) {
              console.warn("Failed to find form with selector: " + openAIForm.containerSelector, e);
            }

            // If selector didn't work, skip this form
            if (!formElement) {
              console.warn("Could not find form element with selector: " + openAIForm.containerSelector);
              return;
            }

            // Get current bounding box from the actual element
            const rect = formElement.getBoundingClientRect();

            // Create highlight overlay
            const highlight = document.createElement("div");
            highlight.className = "qa-agent-form-highlight";
            highlight.dataset.formIndex = index.toString();
            highlight.style.cssText = 
              "position: fixed;" +
              "top: " + rect.top + "px;" +
              "left: " + rect.left + "px;" +
              "width: " + rect.width + "px;" +
              "height: " + rect.height + "px;" +
              "border: 3px solid #007bff;" +
              "border-radius: 8px;" +
              "background-color: rgba(0, 123, 255, 0.1);" +
              "box-shadow: 0 0 20px rgba(0, 123, 255, 0.5), 0 0 40px rgba(0, 123, 255, 0.3), inset 0 0 20px rgba(0, 123, 255, 0.2);" +
              "pointer-events: none;" +
              "z-index: 999997;" +
              "transition: all 0.2s ease;" +
              "animation: qa-agent-pulse 2s ease-in-out infinite;";

            // Create label overlay
            const label = document.createElement("div");
            label.className = "qa-agent-form-overlay";
            label.textContent = "Form " + (index + 1);
            label.style.cssText = 
              "position: fixed;" +
              "top: " + Math.max(0, rect.top - 30) + "px;" +
              "left: " + rect.left + "px;" +
              "background-color: #007bff;" +
              "color: white;" +
              "padding: 6px 12px;" +
              "border-radius: 6px;" +
              "font-size: 14px;" +
              "font-weight: 600;" +
              "pointer-events: none;" +
              "z-index: 999998;" +
              "box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);";

            // Make form clickable for selection
            formElement.style.cursor = "pointer";
            formElement.style.position = "relative";
            formElement.style.zIndex = "999996";

            // Add click handler to form
            const handleFormClick = function(e) {
              e.preventDefault();
              e.stopPropagation();
              cleanup();
              if (window.serverDetectForm) {
                window.serverDetectForm(index).catch(function(err) {
                  console.error("Error calling serverDetectForm:", err);
                });
              }
            };

            formElement.addEventListener("click", handleFormClick);
            formClickHandlers.push({
              element: formElement,
              handler: handleFormClick,
            });

            const selector = openAIForm.containerSelector || "form[data-openai-index=\"" + index + "\"]";
            highlightElements.push({ highlight: highlight, label: label, formSelector: selector });

            document.body.appendChild(highlight);
            document.body.appendChild(label);
          });

          // Add scroll and resize listeners to update positions
          window.qaAgentScrollHandler = function() {
            updatePositions();
          };
          window.addEventListener("scroll", window.qaAgentScrollHandler, true);
          window.addEventListener("resize", window.qaAgentScrollHandler);

          // Add pulse animation
          if (!document.getElementById("qa-agent-styles")) {
            const style = document.createElement("style");
            style.id = "qa-agent-styles";
            style.textContent = 
              "@keyframes qa-agent-pulse {" +
              "  0%, 100% {" +
              "    box-shadow: 0 0 20px rgba(0, 123, 255, 0.5), 0 0 40px rgba(0, 123, 255, 0.3), inset 0 0 20px rgba(0, 123, 255, 0.2);" +
              "  }" +
              "  50% {" +
              "    box-shadow: 0 0 30px rgba(0, 123, 255, 0.7), 0 0 60px rgba(0, 123, 255, 0.5), inset 0 0 30px rgba(0, 123, 255, 0.3);" +
              "  }" +
              "}";
            document.head.appendChild(style);
          }
        };
      }
    })();
  `;

  await page.addInitScript(highlightCode);
  await page.evaluate(function (forms) {
    if ((window as any).qaAgentHighlightForms) {
      (window as any).qaAgentHighlightForms(forms);
    }
  }, serializedForms);
};

const deactivateInputMode = async (page: Page): Promise<void> => {
  const deactivateCode = `
    (function() {
      // Set input mode flag to false
      window.qaAgentInputMode = false;
      
      // Call cleanup function if it exists
      if (window.qaAgentInputModeCleanup) {
        window.qaAgentInputModeCleanup();
        window.qaAgentInputModeCleanup = null;
      }
      
      // Remove highlights
      document
        .querySelectorAll(".qa-agent-form-highlight")
        .forEach(function(el) { el.remove(); });
      
      // Hide cancel and extract buttons in floating bar
      const cancelBtn = document.getElementById("qa-agent-cancel-btn");
      const extractBtn = document.getElementById("qa-agent-extract-btn");
      if (cancelBtn) {
        cancelBtn.style.display = "none";
      }
      if (extractBtn) {
        extractBtn.style.display = "none";
      }
    })();
  `;

  await page.evaluate(deactivateCode);
};

const deactivatePointerMode = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    // Call cleanup function if it exists
    if ((window as any).qaAgentCleanup) {
      (window as any).qaAgentCleanup();
      (window as any).qaAgentCleanup = null;
    } else {
      // Fallback cleanup
      document
        .querySelectorAll(".qa-agent-form-highlight")
        .forEach((el) => el.remove());
      document
        .querySelectorAll(".qa-agent-form-overlay")
        .forEach((el) => el.remove());

      // Clean up any remaining form styles
      const allElements = document.querySelectorAll(
        "[style*='cursor: pointer']"
      );
      allElements.forEach((el) => {
        (el as HTMLElement).style.cursor = "";
        (el as HTMLElement).style.position = "";
        (el as HTMLElement).style.zIndex = "";
      });
    }
  });
};

export const injectFloatingButton = async (page: Page): Promise<void> => {
  const buttonCode = `
    (function() {
      // Remove existing buttons, controls, and floating bar if present
      const existingButton = document.getElementById("qa-agent-detect-btn");
      if (existingButton) {
        existingButton.remove();
      }
      const existingControls = document.getElementById("qa-agent-controls");
      if (existingControls) {
        existingControls.remove();
      }
      const existingBar = document.getElementById("qa-agent-floating-bar");
      if (existingBar) {
        existingBar.remove();
      }

      // Load saved position and expanded state from localStorage
      const savedPosition = localStorage.getItem("qa-agent-control-bar-position");
      let initialTop = 20;
      let initialRight = 20;
      if (savedPosition) {
        try {
          const pos = JSON.parse(savedPosition);
          initialTop = pos.top || 20;
          initialRight = pos.right || 20;
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      const savedExpanded = localStorage.getItem("qa-agent-toolbar-expanded");
      let isExpanded = savedExpanded === "true";

      // Create draggable floating bar
      const floatingBar = document.createElement("div");
      floatingBar.id = "qa-agent-floating-bar";
      
      // Function to update logo border based on expanded state
      const updateLogoBorder = function() {
        if (!isExpanded) {
          logoContainer.style.border = "1px solid #010101";
        } else {
          logoContainer.style.border = "none";
        }
      };

      // Function to update bar style based on expanded state
      const updateBarStyle = function() {
        // Get current position from CSS
        const computedStyle = window.getComputedStyle(floatingBar);
        const currentTop = computedStyle.top || initialTop + "px";
        const currentRight = computedStyle.right || initialRight + "px";
        
        if (isExpanded) {
          floatingBar.style.cssText = 
            "position: fixed;" +
            "top: " + currentTop + ";" +
            "right: " + currentRight + ";" +
            "z-index: 999999;" +
            "display: flex;" +
            "gap: 8px;" +
            "flex-direction: row;" +
            "align-items: center;" +
            "background-color: white;" +
            "border: 2px solid #007bff;" +
            "border-radius: 8px;" +
            "padding: 8px;" +
            "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);" +
            "user-select: none;" +
            "transition: all 0.2s ease;";
        } else {
          floatingBar.style.cssText = 
            "position: fixed;" +
            "top: " + currentTop + ";" +
            "right: " + currentRight + ";" +
            "z-index: 999999;" +
            "display: flex;" +
            "gap: 0px;" +
            "flex-direction: row;" +
            "align-items: center;" +
            "background-color: transparent;" +
            "border: none;" +
            "border-radius: 0px;" +
            "padding: 0px;" +
            "box-shadow: none;" +
            "user-select: none;" +
            "transition: all 0.2s ease;";
        }
        updateLogoBorder();
      };
      
      // Set initial style
      floatingBar.style.cssText = 
        "position: fixed;" +
        "top: " + initialTop + "px;" +
        "right: " + initialRight + "px;" +
        "z-index: 999999;" +
        "display: flex;" +
        "gap: " + (isExpanded ? "8px" : "0px") + ";" +
        "flex-direction: row;" +
        "align-items: center;" +
        "background-color: " + (isExpanded ? "white" : "transparent") + ";" +
        "border: " + (isExpanded ? "2px solid #007bff" : "none") + ";" +
        "border-radius: " + (isExpanded ? "8px" : "0px") + ";" +
        "padding: " + (isExpanded ? "8px" : "0px") + ";" +
        "box-shadow: " + (isExpanded ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none") + ";" +
        "user-select: none;" +
        "transition: all 0.2s ease;";

      // Create logo image (draggable and clickable)
      const logoImg = document.createElement("img");
      logoImg.id = "qa-agent-logo";
      logoImg.src = "http://127.0.0.1:3001/static/logo.png";
      logoImg.alt = "Composer Logo";
      logoImg.style.cssText = 
        "width: 32px;" +
        "height: 32px;" +
        "border-radius: 6px;" +
        "cursor: move;" +
        "user-select: none;" +
        "flex-shrink: 0;" +
        "object-fit: contain;" +
        "border: none;" +
        "overflow: hidden;";
      
      // Wrap logo in container to ensure rounded borders
      const logoContainer = document.createElement("div");
      logoContainer.id = "qa-agent-logo-container";
      logoContainer.style.cssText = 
        "width: 32px;" +
        "height: 32px;" +
        "border-radius: 6px;" +
        "overflow: hidden;" +
        "flex-shrink: 0;" +
        "display: flex;" +
        "align-items: center;" +
        "justify-content: center;" +
        "cursor: move;";
      logoContainer.appendChild(logoImg);
      
      // Set initial logo border based on expanded state
      updateLogoBorder();
      
      // Make bar draggable via logo
      let isDragging = false;
      let dragStartX = 0;
      let dragStartY = 0;
      let dragStartRight = 0;
      let dragStartTop = 0;
      let clickStartTime = 0;
      let clickStartX = 0;
      let clickStartY = 0;
      let handleMouseMoveCheck = null;

      const handleLogoMouseDown = function(e) {
        // Only handle if clicking on logo container or logo image
        if (e.target !== logoImg && e.target !== logoContainer && !logoContainer.contains(e.target)) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        clickStartTime = Date.now();
        clickStartX = e.clientX;
        clickStartY = e.clientY;
        
        // Initialize drag start position immediately
        const computedStyle = window.getComputedStyle(floatingBar);
        dragStartRight = parseFloat(computedStyle.right) || 0;
        dragStartTop = parseFloat(computedStyle.top) || 0;
        
        // Check if this is a drag or click
        handleMouseMoveCheck = function(e) {
          const moved = Math.abs(e.clientX - clickStartX) > 5 || Math.abs(e.clientY - clickStartY) > 5;
          if (moved) {
            // Start dragging
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Remove the check listener since we're now dragging
            document.removeEventListener("mousemove", handleMouseMoveCheck);
            handleMouseMoveCheck = null;
          }
        };
        
        document.addEventListener("mousemove", handleMouseMoveCheck);
      };

      const handleMouseMove = function(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Calculate mouse movement delta
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;
        
        // For 'right' positioning: moving mouse right decreases 'right' value
        // For 'top' positioning: moving mouse down increases 'top' value
        let newRight = dragStartRight - deltaX;
        let newTop = dragStartTop + deltaY;
        
        // Constrain to viewport
        const barRect = floatingBar.getBoundingClientRect();
        const maxRight = window.innerWidth - barRect.width;
        const maxTop = window.innerHeight - barRect.height;
        
        newRight = Math.max(0, Math.min(newRight, maxRight));
        newTop = Math.max(0, Math.min(newTop, maxTop));
        
        floatingBar.style.right = newRight + "px";
        floatingBar.style.top = newTop + "px";
        floatingBar.style.left = "auto";
        floatingBar.style.bottom = "auto";
        
        // Save position
        localStorage.setItem("qa-agent-control-bar-position", JSON.stringify({
          top: newTop,
          right: newRight
        }));
      };

      const handleMouseUp = function(e) {
        // Clean up the move check listener if it's still active
        if (handleMouseMoveCheck) {
          document.removeEventListener("mousemove", handleMouseMoveCheck);
          handleMouseMoveCheck = null;
        }
        
        if (isDragging) {
          isDragging = false;
        } else {
          // Check if this was a click (not a drag) on the logo
          const clickDuration = Date.now() - clickStartTime;
          const moved = Math.abs(e.clientX - clickStartX) > 5 || Math.abs(e.clientY - clickStartY) > 5;
          const clickedLogo = e.target === logoImg || e.target === logoContainer || logoContainer.contains(e.target);
          if (clickDuration < 300 && !moved && clickedLogo) {
            // Toggle toolbar
            isExpanded = !isExpanded;
            localStorage.setItem("qa-agent-toolbar-expanded", isExpanded.toString());
            updateBarStyle();
            updateToolbarVisibility();
          }
        }
      };

      const handleMouseDownWrapper = function(e) {
        if (e.target === logoImg || e.target === logoContainer || logoContainer.contains(e.target)) {
          handleLogoMouseDown(e);
        }
      };

      document.addEventListener("mousedown", handleMouseDownWrapper);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Store cleanup
      window.qaAgentFloatingBarCleanup = function() {
        document.removeEventListener("mousedown", handleMouseDownWrapper);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      floatingBar.appendChild(logoContainer);

      // Helper function to create button (icon-only mode)
      function createButton(id, text, bgColor, hoverColor, icon, iconOnly) {
        iconOnly = iconOnly !== undefined ? iconOnly : false;
        const btn = document.createElement("button");
        btn.id = id;
        btn.title = text; // Use title for tooltip
        btn.style.cssText = 
          "padding: " + (iconOnly ? "8px" : "8px 16px") + ";" +
          "background-color: " + bgColor + ";" +
          "color: white;" +
          "border: 1px solid " + purpleColor + ";" +
          "border-radius: 6px;" +
          "font-size: 14px;" +
          "font-weight: 600;" +
          "cursor: pointer;" +
          "box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);" +
          "transition: background-color 0.2s, color 0.2s;" +
          "white-space: nowrap;" +
          "display: flex;" +
          "align-items: center;" +
          "justify-content: center;" +
          "gap: " + (iconOnly ? "0" : "6px") + ";" +
          "min-width: " + (iconOnly ? "32px" : "auto") + ";" +
          "min-height: " + (iconOnly ? "32px" : "auto") + ";";
        
        if (icon) {
          const iconSpan = document.createElement("span");
          iconSpan.textContent = icon;
          iconSpan.className = "qa-agent-icon";
          iconSpan.style.cssText = "font-size: 18px; line-height: 1;";
          btn.appendChild(iconSpan);
        }
        
        if (!iconOnly) {
          const textSpan = document.createElement("span");
          textSpan.textContent = text;
          btn.appendChild(textSpan);
        }
        
        btn.addEventListener("mouseenter", function() {
          if (!btn.disabled) {
            btn.style.backgroundColor = hoverColor;
          }
        });
        btn.addEventListener("mouseleave", function() {
          if (!btn.disabled) {
            btn.style.backgroundColor = bgColor;
          }
        });
        return btn;
      }

      // Purple color from AILoadingEffects: rgb(168, 85, 247)
      const purpleColor = "rgb(168, 85, 247)";
      const purpleColorHover = "rgb(147, 51, 234)";
      const purpleColorActive = "rgb(126, 34, 206)";
      
      // Ghost Writer toggle button (icon only)
      const ghostWriterBtn = createButton("qa-agent-ghost-writer-btn", "Ghost Writer", "white", purpleColorHover, "👻", true);
      const ghostWriterIcon = ghostWriterBtn.querySelector(".qa-agent-icon");
      if (ghostWriterIcon) {
        ghostWriterIcon.style.color = purpleColor;
      }
      ghostWriterBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        // Disable if input mode is active
        if (window.qaAgentInputMode) {
          return;
        }
        
        const isActive = window.qaAgentGhostWriterActive;
        if (isActive) {
          if (window.serverDeactivateGhostWriter) {
            window.serverDeactivateGhostWriter().catch(function(err) {
              console.error("Error deactivating ghost writer:", err);
            });
          }
        } else {
          if (window.serverActivateGhostWriter) {
            window.serverActivateGhostWriter().catch(function(err) {
              console.error("Error activating ghost writer:", err);
            });
          }
        }
      });

      // Update ghost writer button state
      function updateGhostWriterButton() {
        const isActive = window.qaAgentGhostWriterActive;
        const isInputMode = window.qaAgentInputMode;
        
        if (isInputMode) {
          ghostWriterBtn.disabled = true;
          ghostWriterBtn.style.opacity = "0.5";
          ghostWriterBtn.style.cursor = "not-allowed";
        } else {
          ghostWriterBtn.disabled = false;
          ghostWriterBtn.style.opacity = "1";
          ghostWriterBtn.style.cursor = "pointer";
        }
        
        const iconSpan = ghostWriterBtn.querySelector(".qa-agent-icon");
        if (isActive) {
          ghostWriterBtn.style.backgroundColor = purpleColor;
          if (iconSpan) {
            iconSpan.style.color = "white";
          }
        } else {
          ghostWriterBtn.style.backgroundColor = "white";
          if (iconSpan) {
            iconSpan.style.color = purpleColor;
          }
        }
      }

      // Monitor ghost writer state changes
      setInterval(updateGhostWriterButton, 500);

      // Input Mode button (icon only)
      const detectFormBtn = createButton("qa-agent-detect-btn", "Input Mode", "white", purpleColorHover, "✎", true);
      const detectFormIcon = detectFormBtn.querySelector(".qa-agent-icon");
      if (detectFormIcon) {
        detectFormIcon.style.color = purpleColor;
      }
      detectFormBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        // Disable if ghost writer is active
        if (window.qaAgentGhostWriterActive) {
          return;
        }
        
        if (window.serverActivateInputMode) {
          window.serverActivateInputMode().catch(function(err) {
            console.error("Error activating input mode:", err);
          });
        }
      });
      
      // Update input mode button state
      function updateInputModeButton() {
        const isInputMode = window.qaAgentInputMode;
        const isGhostWriterActive = window.qaAgentGhostWriterActive;
        
        if (isGhostWriterActive) {
          detectFormBtn.disabled = true;
          detectFormBtn.style.opacity = "0.5";
          detectFormBtn.style.cursor = "not-allowed";
        } else {
          detectFormBtn.disabled = false;
          detectFormBtn.style.opacity = "1";
          detectFormBtn.style.cursor = "pointer";
        }
        
        const iconSpan = detectFormBtn.querySelector(".qa-agent-icon");
        if (isInputMode) {
          detectFormBtn.style.backgroundColor = purpleColor;
          if (iconSpan) {
            iconSpan.style.color = "white";
          }
        } else {
          detectFormBtn.style.backgroundColor = "white";
          if (iconSpan) {
            iconSpan.style.color = purpleColor;
          }
        }
      }
      
      // Monitor input mode state changes
      setInterval(updateInputModeButton, 500);

      // Container for toolbar buttons
      const toolbarButtons = document.createElement("div");
      toolbarButtons.id = "qa-agent-toolbar-buttons";
      toolbarButtons.style.cssText = 
        "display: flex;" +
        "gap: 8px;" +
        "align-items: center;" +
        "transition: all 0.2s ease;";
      
      toolbarButtons.appendChild(ghostWriterBtn);
      toolbarButtons.appendChild(detectFormBtn);
      
      // Function to update toolbar visibility
      const updateToolbarVisibility = function() {
        // Update isExpanded from the variable scope
        const currentExpanded = localStorage.getItem("qa-agent-toolbar-expanded") === "true";
        if (currentExpanded) {
          toolbarButtons.style.display = "flex";
          toolbarButtons.style.opacity = "1";
          toolbarButtons.style.maxWidth = "none";
        } else {
          toolbarButtons.style.display = "none";
          toolbarButtons.style.opacity = "0";
          toolbarButtons.style.maxWidth = "0";
        }
      };
      
      // Expose function globally for use in click handler
      window.qaAgentUpdateToolbarVisibility = updateToolbarVisibility;
      
      // Initialize visibility
      updateToolbarVisibility();
      
      floatingBar.appendChild(toolbarButtons);

      // Cancel button (shown when in input mode)
      const cancelBtn = createButton("qa-agent-cancel-btn", "Cancel", "#dc3545", "#c82333");
      cancelBtn.style.display = "none";
      cancelBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        window.qaAgentInputMode = false;
        cancelBtn.style.display = "none";
        extractBtn.style.display = "none";
        
        if (window.qaAgentInputModeCleanup) {
          window.qaAgentInputModeCleanup();
        }
        if (window.serverDeactivateInputMode) {
          window.serverDeactivateInputMode().catch(function(err) {
            console.error("Error calling serverDeactivateInputMode:", err);
          });
        }
      }, true);

      // Generate button (shown when in input mode)
      const extractBtn = createButton("qa-agent-extract-btn", "Generate", "#28a745", "#218838");
      extractBtn.style.display = "none";
      extractBtn.disabled = true;
      extractBtn.style.opacity = "0.5";
      extractBtn.style.cursor = "not-allowed";
      extractBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        if (extractBtn.disabled) return;
        
        if (window.serverExtractForm) {
          window.serverExtractForm().then(function(result) {
            console.log("[EXTRACT_BUTTON] serverExtractForm completed successfully", result);
          }).catch(function(err) {
            console.error("[EXTRACT_BUTTON] Error calling serverExtractForm:", err);
          });
        }
      }, true);

      toolbarButtons.appendChild(cancelBtn);
      toolbarButtons.appendChild(extractBtn);

      // Monitor input mode state to show/hide buttons
      function updateInputModeButtons() {
        const isInputMode = window.qaAgentInputMode;
        if (isInputMode) {
          cancelBtn.style.display = "block";
          extractBtn.style.display = "block";
        } else {
          cancelBtn.style.display = "none";
          extractBtn.style.display = "none";
        }
      }

      // Monitor for extract button enable/disable
      function updateExtractButton() {
        const hasSelection = !!window.qaAgentSelectedElement;
        extractBtn.disabled = !hasSelection;
        extractBtn.style.opacity = hasSelection ? "1" : "0.5";
        extractBtn.style.cursor = hasSelection ? "pointer" : "not-allowed";
      }

      setInterval(function() {
        updateInputModeButtons();
        updateExtractButton();
        updateInputModeButton();
      }, 500);

      // Expose functions to enable extract button
      window.qaAgentEnableExtractButton = function() {
        extractBtn.disabled = false;
        extractBtn.style.opacity = "1";
        extractBtn.style.cursor = "pointer";
      };

      document.body.appendChild(floatingBar);
    })();
  `;

  await page.evaluate(buttonCode);
};

export {
  activateInputMode,
  activatePointerMode,
  deactivateInputMode,
  deactivatePointerMode,
};
