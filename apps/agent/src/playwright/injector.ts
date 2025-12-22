import { Page } from "playwright";
import { analyzeFormsWithOpenAI, OpenAIForm } from "./geminiService";

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
      }

      // Function to handle element click
      function handleElementClick(e) {
        const target = e.target;
        
        // Check if clicking on control buttons or their container FIRST
        // This must be checked before preventDefault to allow button clicks
        if (target.id === "qa-agent-detect-btn" || 
            target.id === "qa-agent-cancel-btn" || 
            target.id === "qa-agent-extract-btn" ||
            target.closest("#qa-agent-controls") ||
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

      // Update button state
      const button = document.getElementById("qa-agent-detect-btn");
      if (button) {
        button.textContent = "Cancel";
        button.style.backgroundColor = "#dc3545";
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
      log("LLM_ANALYSIS", "No forms detected by LLM", {
        totalDuration: `${totalDuration}ms`,
      });
      await page.evaluate(() => {
        alert("No forms found on this page");
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
    log("LLM_ANALYSIS", "LLM analysis failed", {
      totalDuration: `${totalDuration}ms`,
    });

    await page.evaluate(
      (errorMessage) => {
        alert(`Failed to analyze forms: ${errorMessage}`);
        (window as any).qaAgentPointerMode = false;
        const button = document.getElementById("qa-agent-detect-btn");
        if (button) {
          button.textContent = "Detect Form";
          button.style.backgroundColor = "#007bff";
          button.style.cursor = "pointer";
          (button as HTMLButtonElement).disabled = false;
        }
      },
      error instanceof Error ? error.message : String(error)
    );
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
      // Call cleanup function if it exists
      if (window.qaAgentInputModeCleanup) {
        window.qaAgentInputModeCleanup();
        window.qaAgentInputModeCleanup = null;
      }
      
      // Remove highlights
      document
        .querySelectorAll(".qa-agent-form-highlight")
        .forEach(function(el) { el.remove(); });
      
      // Remove controls
      const controls = document.getElementById("qa-agent-controls");
      if (controls) {
        controls.remove();
      }
      
      // Reset button
      const button = document.getElementById("qa-agent-detect-btn");
      if (button) {
        button.style.display = "block";
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
      // Remove existing buttons and controls if present
      const existingButton = document.getElementById("qa-agent-detect-btn");
      if (existingButton) {
        existingButton.remove();
      }
      const existingControls = document.getElementById("qa-agent-controls");
      if (existingControls) {
        existingControls.remove();
      }

      // Create floating button
      const button = document.createElement("button");
      button.id = "qa-agent-detect-btn";
      button.textContent = "Detect Form";
      button.style.cssText = 
        "position: fixed;" +
        "bottom: 20px;" +
        "right: 20px;" +
        "z-index: 999999;" +
        "padding: 12px 24px;" +
        "background-color: #007bff;" +
        "color: white;" +
        "border: none;" +
        "border-radius: 6px;" +
        "font-size: 16px;" +
        "font-weight: 600;" +
        "cursor: pointer;" +
        "box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" +
        "transition: background-color 0.2s;";

      button.addEventListener("mouseenter", function() {
        if (!window.qaAgentInputMode) {
          button.style.backgroundColor = "#0056b3";
        }
      });

      button.addEventListener("mouseleave", function() {
        if (!window.qaAgentInputMode) {
          button.style.backgroundColor = "#007bff";
        }
      });

      button.addEventListener("click", function() {
        const currentMode = window.qaAgentInputMode;

        if (currentMode) {
          // Deactivate input mode
          window.qaAgentInputMode = false;
          button.textContent = "Detect Form";
          button.style.backgroundColor = "#007bff";

          // Remove controls
          const controls = document.getElementById("qa-agent-controls");
          if (controls) {
            controls.remove();
          }

          // Call cleanup
          if (window.qaAgentInputModeCleanup) {
            window.qaAgentInputModeCleanup();
          }

          // Call deactivate function
          if (window.serverDeactivateInputMode) {
            window.serverDeactivateInputMode().catch(function(err) {
              console.error("Error calling serverDeactivateInputMode:", err);
            });
          }
        } else {
          // Activate input mode
          window.qaAgentInputMode = true;
          button.textContent = "Cancel";
          button.style.backgroundColor = "#dc3545";

          // Create control buttons container
          const controls = document.createElement("div");
          controls.id = "qa-agent-controls";
          controls.style.cssText = 
            "position: fixed;" +
            "bottom: 20px;" +
            "right: 20px;" +
            "z-index: 1000000;" +
            "display: flex;" +
            "gap: 12px;" +
            "flex-direction: column;" +
            "pointer-events: auto;";

          // Cancel button
          const cancelBtn = document.createElement("button");
          cancelBtn.id = "qa-agent-cancel-btn";
          cancelBtn.textContent = "Cancel";
          cancelBtn.style.cssText = 
            "padding: 12px 24px;" +
            "background-color: #dc3545;" +
            "color: white;" +
            "border: none;" +
            "border-radius: 6px;" +
            "font-size: 16px;" +
            "font-weight: 600;" +
            "cursor: pointer;" +
            "box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" +
            "transition: background-color 0.2s;" +
            "pointer-events: auto;" +
            "position: relative;" +
            "z-index: 1000001;";
          cancelBtn.addEventListener("mouseenter", function() {
            cancelBtn.style.backgroundColor = "#c82333";
          });
          cancelBtn.addEventListener("mouseleave", function() {
            cancelBtn.style.backgroundColor = "#dc3545";
          });
          // Use capture phase and stop immediate propagation to ensure this runs before input mode handler
          cancelBtn.addEventListener("click", function(e) {
            // Stop immediate propagation to prevent input mode handler from running
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            
            console.log("[CANCEL_BUTTON] Cancel button clicked");
            
            window.qaAgentInputMode = false;
            button.textContent = "Detect Form";
            button.style.backgroundColor = "#007bff";
            controls.remove();
            if (window.qaAgentInputModeCleanup) {
              window.qaAgentInputModeCleanup();
            }
            if (window.serverDeactivateInputMode) {
              window.serverDeactivateInputMode().catch(function(err) {
                console.error("Error calling serverDeactivateInputMode:", err);
              });
            }
          }, true);

          // Generate button (disabled initially)
          const extractBtn = document.createElement("button");
          extractBtn.id = "qa-agent-extract-btn";
          extractBtn.textContent = "Generate";
          extractBtn.style.cssText = 
            "padding: 12px 24px;" +
            "background-color: #28a745;" +
            "color: white;" +
            "border: none;" +
            "border-radius: 6px;" +
            "font-size: 16px;" +
            "font-weight: 600;" +
            "cursor: not-allowed;" +
            "opacity: 0.5;" +
            "box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" +
            "transition: background-color 0.2s, opacity 0.2s;" +
            "pointer-events: auto;" +
            "position: relative;" +
            "z-index: 1000001;";
          extractBtn.disabled = true;
          extractBtn.addEventListener("mouseenter", function() {
            if (!extractBtn.disabled) {
              extractBtn.style.backgroundColor = "#218838";
            }
          });
          extractBtn.addEventListener("mouseleave", function() {
            if (!extractBtn.disabled) {
              extractBtn.style.backgroundColor = "#28a745";
            }
          });
          // Use capture phase and stop immediate propagation to ensure this runs before input mode handler
          extractBtn.addEventListener("click", function(e) {
            // Stop immediate propagation to prevent input mode handler from running
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            
            console.log("[EXTRACT_BUTTON] Extract button clicked", {
              disabled: extractBtn.disabled,
              hasServerExtractForm: !!window.serverExtractForm,
              selectedElement: window.qaAgentSelectedElement ? {
                selector: window.qaAgentSelectedElement.selector,
                htmlSize: window.qaAgentSelectedElement.html ? window.qaAgentSelectedElement.html.length : 0,
              } : null,
            });
            
            if (extractBtn.disabled) {
              console.warn("[EXTRACT_BUTTON] Extract button is disabled, ignoring click");
              return;
            }
            
            if (window.serverExtractForm) {
              console.log("[EXTRACT_BUTTON] Calling serverExtractForm...");
              window.serverExtractForm().then(function(result) {
                console.log("[EXTRACT_BUTTON] serverExtractForm completed successfully", result);
              }).catch(function(err) {
                console.error("[EXTRACT_BUTTON] Error calling serverExtractForm:", err);
                alert("Error extracting form: " + (err.message || String(err)));
              });
            } else {
              console.error("[EXTRACT_BUTTON] serverExtractForm function not found on window");
              alert("Extract function not available. Please refresh the page.");
            }
          }, true);

          controls.appendChild(cancelBtn);
          controls.appendChild(extractBtn);
          document.body.appendChild(controls);

          // Hide main button when controls are shown
          button.style.display = "none";

          // Call activate function
          if (window.serverActivateInputMode) {
            window.serverActivateInputMode().catch(function(err) {
              console.error("Error calling serverActivateInputMode:", err);
            });
          }
        }
      });

      document.body.appendChild(button);
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
