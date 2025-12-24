import { FormField } from "@composer/shared";
import { Page } from "playwright";

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

interface InputContext {
  selector: string;
  type: string;
  label?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  required: boolean;
}

interface FormContext {
  containerSelector: string;
  fields: FormField[];
}

/**
 * Check if an element is an editable input
 */
const isEditableInput = async (
  page: Page,
  element: Element
): Promise<boolean> => {
  return await page.evaluate((el: any) => {
    const htmlEl = el as HTMLElement;

    // Check if element is input, textarea, or select
    const tagName = htmlEl.tagName.toLowerCase();
    if (tagName !== "input" && tagName !== "textarea" && tagName !== "select") {
      return false;
    }

    // Check if disabled
    if (htmlEl.hasAttribute("disabled")) {
      return false;
    }

    // Check if readonly (for inputs and textareas)
    if (
      (tagName === "input" || tagName === "textarea") &&
      htmlEl.hasAttribute("readonly")
    ) {
      return false;
    }

    // Check if visible
    const style = window.getComputedStyle(htmlEl);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }

    // Check if in viewport
    const rect = htmlEl.getBoundingClientRect();
    if (
      rect.width === 0 ||
      rect.height === 0 ||
      rect.top < -1000 ||
      rect.left < -1000
    ) {
      return false;
    }

    return true;
  }, element as any);
};

/**
 * Extract input type and context from an element
 */
const extractInputContext = async (
  page: Page,
  element: Element
): Promise<InputContext | null> => {
  return (await page.evaluate((el: any) => {
    const htmlEl = el as HTMLElement;
    const tagName = htmlEl.tagName.toLowerCase();

    if (tagName !== "input" && tagName !== "textarea" && tagName !== "select") {
      return null;
    }

    const input = htmlEl as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;

    let type = tagName;
    if (tagName === "input") {
      type = (input as HTMLInputElement).type || "text";
    }

    // Skip file inputs
    if (type === "file") {
      return null;
    }

    // Generate selector
    let selector = "";
    if (input.id) {
      selector = `#${input.id}`;
    } else if (input.name) {
      selector = `[name="${input.name}"]`;
    } else {
      // Fallback to a more complex selector
      const path: string[] = [];
      let current: Element | null = input;
      while (current && current !== document.body) {
        let selectorPart = current.tagName.toLowerCase();
        if (current.id) {
          selectorPart = `#${current.id}`;
          path.unshift(selectorPart);
          break;
        } else {
          const parent = current.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children);
            const index = siblings.indexOf(current) + 1;
            selectorPart += `:nth-child(${index})`;
          }
        }
        path.unshift(selectorPart);
        current = current.parentElement;
      }
      selector = path.join(" > ");
    }

    // Find label
    let label: string | undefined;
    if (input.id) {
      const labelEl = document.querySelector(`label[for="${input.id}"]`);
      if (labelEl) {
        label = labelEl.textContent?.trim() || undefined;
      }
    }
    if (!label) {
      const parentLabel = input.closest("label");
      if (parentLabel) {
        label = parentLabel.textContent?.trim() || undefined;
      }
    }

    return {
      selector,
      type,
      label,
      placeholder: input.getAttribute("placeholder") || undefined,
      name: input.name || undefined,
      id: input.id || undefined,
      required: input.hasAttribute("required"),
    };
  }, element as any)) as InputContext | null;
};

/**
 * Find nearest form-like container
 */
const findFormContainer = async (
  page: Page,
  element: Element
): Promise<string | null> => {
  return await page.evaluate((el: any) => {
    let current: Element | null = el as Element;

    // First, try to find a <form> element
    while (current && current !== document.body) {
      if (current.tagName.toLowerCase() === "form") {
        // Generate selector for form
        if (current.id) {
          return `#${current.id}`;
        } else if ((current as HTMLFormElement).name) {
          return `form[name="${(current as HTMLFormElement).name}"]`;
        } else {
          // Use nth-of-type
          const parent = current.parentElement;
          if (parent) {
            const forms = Array.from(parent.querySelectorAll("form"));
            const index = forms.indexOf(current as HTMLFormElement);
            return `form:nth-of-type(${index + 1})`;
          }
        }
        return "form";
      }
      current = current.parentElement;
    }

    // If no form found, find a reasonable container (div with multiple inputs)
    current = el as Element;
    while (current && current !== document.body) {
      const inputs = current.querySelectorAll("input, textarea, select");
      if (inputs.length >= 2) {
        // This looks like a form container
        if (current.id) {
          return `#${current.id}`;
        } else if (current.className && typeof current.className === "string") {
          const classes = current.className.split(" ").filter(Boolean);
          if (classes.length > 0) {
            return `.${classes[0]}`;
          }
        }
        // Fallback to tag name with path
        const tagName = current.tagName.toLowerCase();
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(current) + 1;
          return `${tagName}:nth-child(${index})`;
        }
        return tagName;
      }
      current = current.parentElement;
    }

    return null;
  }, element as any);
};

/**
 * Activate ghost writer mode
 */
export const activateGhostWriter = async (
  page: Page,
  theme: string,
  aiLoadingEffectSettings?: {
    enabled: boolean;
    shimmerColor: "primary" | "blue" | "purple" | "green" | "orange";
    shimmerSpeed: "slow" | "normal" | "fast";
    shimmerIntensity: "low" | "medium" | "high";
  }
): Promise<void> => {
  const startTime = Date.now();
  log("GHOST_WRITER", "=== Ghost Writer Activation Started ===", {
    pageUrl: page.url(),
    theme,
  });

  // Prepare AI Loading Effect settings
  const defaultAISettings = {
    enabled: true,
    shimmerColor: "purple" as const,
    shimmerSpeed: "slow" as const,
    shimmerIntensity: "low" as const,
  };
  const aiSettings = aiLoadingEffectSettings || defaultAISettings;

  const ghostWriterCode = `
    (function() {
      // State
      let isActive = false;
      let filledInputs = new Set();
      let currentHint = null;
      let currentInputSelector = null;
      let currentTestId = null;
      let originalPlaceholders = new Map();
      let hintGenerationInProgress = false;
      let hintMap = new Map(); // Map testId -> hint

      // Generate unique identifier and selector for input
      function getInputId(element) {
        if (element.id) return element.id;
        if (element.name) return element.name;
        return element.tagName + "-" + Array.from(document.querySelectorAll(element.tagName)).indexOf(element);
      }

      function getInputSelector(element) {
        if (element.id) return "#" + element.id;
        if (element.name) return '[name="' + element.name + '"]';
        // Fallback: generate a path-based selector
        const path = [];
        let current = element;
        while (current && current !== document.body) {
          let selector = current.tagName.toLowerCase();
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

      // Store original placeholder
      function storeOriginalPlaceholder(element) {
        const inputId = getInputId(element);
        if (!originalPlaceholders.has(inputId)) {
          originalPlaceholders.set(inputId, element.getAttribute("placeholder") || "");
        }
      }

      // Restore original placeholder
      function restoreOriginalPlaceholder(element) {
        const inputId = getInputId(element);
        const original = originalPlaceholders.get(inputId);
        if (original !== undefined) {
          if (original) {
            element.setAttribute("placeholder", original);
          } else {
            element.removeAttribute("placeholder");
          }
        }
      }

      // AI Loading Effect settings (from props or defaults)
      const aiEffectSettings = ${JSON.stringify(aiSettings)};
      
      // Intensity mapping (opacity values as decimals)
      const intensityMap = {
        low: { main: 0.1, secondary: 0.05 },
        medium: { main: 0.15, secondary: 0.08 },
        high: { main: 0.25, secondary: 0.12 },
      };

      // Speed mapping (animation class names)
      const speedClasses = {
        slow: {
          main: "qa-agent-shimmer-slow",
          delayed: "qa-agent-shimmer-delayed-slow",
        },
        normal: { main: "qa-agent-shimmer", delayed: "qa-agent-shimmer-delayed" },
        fast: {
          main: "qa-agent-shimmer-fast",
          delayed: "qa-agent-shimmer-delayed-fast",
        },
      };

      // Get color RGB values
      function getColorRGB(colorName) {
        if (colorName === "primary") {
          return "hsl(var(--primary))";
        }
        const colorMap = {
          blue: "rgb(59, 130, 246)",
          purple: "rgb(168, 85, 247)",
          green: "rgb(34, 197, 94)",
          orange: "rgb(249, 115, 22)",
        };
        return colorMap[colorName] || colorMap.blue;
      }

      // Helper to create rgba color
      function createRGBA(rgbString, opacity) {
        if (rgbString.includes("hsl")) {
          return rgbString.replace(")", " / " + (opacity * 100) + "%)");
        }
        const matches = rgbString.match(/\\d+/g);
        if (matches && matches.length >= 3) {
          return "rgba(" + matches[0] + ", " + matches[1] + ", " + matches[2] + ", " + opacity + ")";
        }
        return rgbString;
      }

      // Show AI Loading Effect on input
      function showAILoadingEffect(element) {
        if (!aiEffectSettings.enabled) return;
        
        // Remove existing effect if present
        removeAILoadingEffect(element);

        const intensityValues = intensityMap[aiEffectSettings.shimmerIntensity || "low"];
        const speedClass = speedClasses[aiEffectSettings.shimmerSpeed || "slow"];
        const baseColor = getColorRGB(aiEffectSettings.shimmerColor || "purple");
        const mainColor = createRGBA(baseColor, intensityValues.main);
        const secondaryColor = createRGBA(baseColor, intensityValues.secondary);

        // Make input container relative if not already
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.position === "static") {
          element.style.position = "relative";
        }

        // Input elements don't render children, so we need to position the effect as a sibling
        // or use fixed positioning. We'll use fixed positioning based on the input's bounding box.
        const rect = element.getBoundingClientRect();
        const inputId = "qa-agent-ai-effect-" + (element.id || element.name || Date.now());
        
        // Remove existing effect if present
        const existingEffect = document.getElementById(inputId);
        if (existingEffect) {
          existingEffect.remove();
        }

        // Create effect overlay positioned fixed to match input position
        const effectOverlay = document.createElement("div");
        effectOverlay.id = inputId;
        effectOverlay.className = "qa-agent-ai-loading-effect";
        effectOverlay.setAttribute("data-input-selector", getInputSelector(element));
        effectOverlay.style.cssText = 
          "position: fixed;" +
          "top: " + rect.top + "px;" +
          "left: " + rect.left + "px;" +
          "width: " + rect.width + "px;" +
          "height: " + rect.height + "px;" +
          "pointer-events: none;" +
          "z-index: 999995;" +
          "border-radius: inherit;" +
          "overflow: hidden;" +
          "opacity: 1;" +
          "visibility: visible;";

        // Get border radius from input if available
        const borderRadius = window.getComputedStyle(element).borderRadius;
        if (borderRadius) {
          effectOverlay.style.borderRadius = borderRadius;
        }

        // Base greyish gradient background
        const baseBg = document.createElement("div");
        baseBg.style.cssText = 
          "position: absolute;" +
          "top: 0;" +
          "left: 0;" +
          "right: 0;" +
          "bottom: 0;" +
          "background: linear-gradient(to right, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.03));";
        effectOverlay.appendChild(baseBg);

        // Animated shimmer layer 1
        const shimmer1 = document.createElement("div");
        shimmer1.className = speedClass.main;
        shimmer1.style.cssText = 
          "position: absolute;" +
          "top: 0;" +
          "left: 0;" +
          "right: 0;" +
          "bottom: 0;" +
          "background: linear-gradient(to right, transparent, " + mainColor + ", transparent);";
        effectOverlay.appendChild(shimmer1);

        // Animated shimmer layer 2 (delayed)
        const shimmer2 = document.createElement("div");
        shimmer2.className = speedClass.delayed;
        shimmer2.style.cssText = 
          "position: absolute;" +
          "top: 0;" +
          "left: 0;" +
          "right: 0;" +
          "bottom: 0;" +
          "background: linear-gradient(to right, " + secondaryColor + ", " + mainColor + ", " + secondaryColor + ");";
        effectOverlay.appendChild(shimmer2);

        document.body.appendChild(effectOverlay);
        element.setAttribute("data-ai-loading-effect", inputId);
        
        // Update position on scroll/resize
        const updatePosition = function() {
          const currentRect = element.getBoundingClientRect();
          effectOverlay.style.top = currentRect.top + "px";
          effectOverlay.style.left = currentRect.left + "px";
          effectOverlay.style.width = currentRect.width + "px";
          effectOverlay.style.height = currentRect.height + "px";
        };
        
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        
        // Store cleanup function
        if (!window.qaAgentAILoadingEffects) {
          window.qaAgentAILoadingEffects = new Map();
        }
        window.qaAgentAILoadingEffects.set(inputId, {
          element: effectOverlay,
          updatePosition: updatePosition
        });
      }

      // Remove AI Loading Effect from input
      function removeAILoadingEffect(element) {
        const effectId = element.getAttribute("data-ai-loading-effect");
        if (effectId) {
          const effect = document.getElementById(effectId);
          if (effect) {
            effect.remove();
          }
          
          // Clean up event listeners
          if (window.qaAgentAILoadingEffects && window.qaAgentAILoadingEffects.has(effectId)) {
            const effectData = window.qaAgentAILoadingEffects.get(effectId);
            window.removeEventListener("scroll", effectData.updatePosition, true);
            window.removeEventListener("resize", effectData.updatePosition);
            window.qaAgentAILoadingEffects.delete(effectId);
          }
        } else {
          // Fallback: try to find by selector
          const selector = getInputSelector(element);
          const effects = document.querySelectorAll(".qa-agent-ai-loading-effect");
          effects.forEach(function(effect) {
            if (effect.getAttribute("data-input-selector") === selector) {
              effect.remove();
            }
          });
        }
        element.removeAttribute("data-ai-loading-effect");
      }

      // Add shimmer animation styles if not present
      if (!document.getElementById("qa-agent-shimmer-styles")) {
        const style = document.createElement("style");
        style.id = "qa-agent-shimmer-styles";
        style.textContent = 
          "@keyframes qa-agent-shimmer {" +
          "  0% { transform: translateX(-100%); }" +
          "  100% { transform: translateX(100%); }" +
          "}" +
          "@keyframes qa-agent-shimmer-delayed {" +
          "  0% { transform: translateX(-150%); }" +
          "  100% { transform: translateX(150%); }" +
          "}" +
          ".qa-agent-shimmer {" +
          "  animation: qa-agent-shimmer 1.5s ease-in-out infinite;" +
          "}" +
          ".qa-agent-shimmer-delayed {" +
          "  animation: qa-agent-shimmer-delayed 1.8s ease-in-out infinite;" +
          "}" +
          ".qa-agent-shimmer-slow {" +
          "  animation: qa-agent-shimmer 2.5s ease-in-out infinite;" +
          "}" +
          ".qa-agent-shimmer-delayed-slow {" +
          "  animation: qa-agent-shimmer-delayed 3s ease-in-out infinite;" +
          "}" +
          ".qa-agent-shimmer-fast {" +
          "  animation: qa-agent-shimmer 0.8s ease-in-out infinite;" +
          "}" +
          ".qa-agent-shimmer-delayed-fast {" +
          "  animation: qa-agent-shimmer-delayed 1s ease-in-out infinite;" +
          "}";
        document.head.appendChild(style);
      }

      // Check if input is already filled
      function isInputFilled(element) {
        const inputId = getInputId(element);
        return filledInputs.has(inputId);
      }

      // Mark input as filled
      function markInputFilled(element) {
        const inputId = getInputId(element);
        filledInputs.add(inputId);
        restoreOriginalPlaceholder(element);
        currentHint = null;
        currentInputSelector = null;
      }

      // Handle focus event
      async function handleFocus(e) {
        if (!isActive) return;

        const target = e.target;
        const tagName = target.tagName.toLowerCase();
        
        if (tagName !== "input" && tagName !== "textarea" && tagName !== "select") {
          return;
        }

        // Check if already filled
        if (isInputFilled(target)) {
          return;
        }

        // Generate and assign data-testid for reliable selection
        const testId = "qa-agent-ghost-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
        target.setAttribute("data-testid", testId);
        currentTestId = testId;

        // Store original placeholder
        storeOriginalPlaceholder(target);

        // Clear any existing hint and skeleton
        const currentSelector = getInputSelector(target);
        if (currentInputSelector && currentInputSelector !== currentSelector) {
          try {
            const prevElement = document.querySelector(currentInputSelector);
            if (prevElement) {
              restoreOriginalPlaceholder(prevElement);
              removeAILoadingEffect(prevElement);
            }
          } catch (e) {
            // Ignore selector errors
          }
        }

        currentInputSelector = currentSelector;

        // Check if input is editable (will be checked server-side, but also check client-side)
        if (target.disabled || target.readOnly) {
          return;
        }

        // Generate hint via server
        if (hintGenerationInProgress) {
          return;
        }

        hintGenerationInProgress = true;
        
        // Show AI Loading Effect
        showAILoadingEffect(target);
        
        try {
          // Extract input context
          const inputContext = {
            selector: currentInputSelector,
            type: target.type || tagName,
            label: null,
            placeholder: target.getAttribute("placeholder") || null,
            name: target.name || null,
            id: target.id || null,
            required: target.hasAttribute("required"),
          };

          // Find label
          if (target.id) {
            const labelEl = document.querySelector('label[for="' + target.id + '"]');
            if (labelEl) {
              inputContext.label = labelEl.textContent?.trim() || null;
            }
          }
          if (!inputContext.label) {
            const parentLabel = target.closest("label");
            if (parentLabel) {
              inputContext.label = parentLabel.textContent?.trim() || null;
            }
          }

          // Find form container
          let formContainerSelector = null;
          let current = target.parentElement;
          while (current && current !== document.body) {
            if (current.tagName.toLowerCase() === "form") {
              if (current.id) {
                formContainerSelector = "#" + current.id;
              } else {
                formContainerSelector = "form";
              }
              break;
            }
            current = current.parentElement;
          }

          // If no form, find container with multiple inputs
          if (!formContainerSelector) {
            current = target.parentElement;
            while (current && current !== document.body) {
              const inputs = current.querySelectorAll("input, textarea, select");
              if (inputs.length >= 2) {
                if (current.id) {
                  formContainerSelector = "#" + current.id;
                } else if (current.className) {
                  const classes = current.className.split(" ").filter(Boolean);
                  if (classes.length > 0) {
                    formContainerSelector = "." + classes[0];
                  }
                }
                break;
              }
              current = current.parentElement;
            }
          }

          // Call server to generate hint
          if (window.serverGenerateInputHint) {
            const hint = await window.serverGenerateInputHint(
              inputContext,
              formContainerSelector,
              window.location.href,
              document.title
            );

            const currentSelector = getInputSelector(target);
            if (hint && isActive && currentInputSelector === currentSelector && currentTestId) {
              currentHint = hint;
              hintMap.set(currentTestId, hint);
              target.setAttribute("placeholder", hint);
            }
          }
        } catch (error) {
          console.error("[GHOST_WRITER] Error generating hint:", error);
        } finally {
          // Remove AI Loading Effect
          removeAILoadingEffect(target);
          hintGenerationInProgress = false;
        }
      }

      // Handle Tab key
      function handleTabKey(e) {
        if (!isActive) return;
        if (e.key !== "Tab") return;

        const target = e.target;
        const tagName = target.tagName.toLowerCase();
        
        if (tagName !== "input" && tagName !== "textarea" && tagName !== "select") {
          return;
        }

        // Check if we have an active hint for this input
        const currentSelector = getInputSelector(target);
        console.log("[GHOST_WRITER] Tab pressed", {
          hasHint: !!currentHint,
          hint: currentHint,
          currentInputSelector: currentInputSelector,
          currentSelector: currentSelector,
          match: currentInputSelector === currentSelector
        });
        
        if (currentHint && currentInputSelector && currentInputSelector === currentSelector && currentTestId) {
          console.log("[GHOST_WRITER] Tab pressed, calling server to fill input with hint:", currentHint);
          
          // Prevent default to stop normal tab behavior temporarily
          e.preventDefault();
          e.stopPropagation();
          
          // Call server function to fill using Playwright
          if (window.serverFillInputWithHint) {
            window.serverFillInputWithHint(currentTestId, currentHint, tagName).then(function(success) {
              if (success) {
                console.log("[GHOST_WRITER] Input filled successfully");
                // Mark as filled
                markInputFilled(target);
                
                // Allow tab to proceed by manually focusing next input
                setTimeout(function() {
                  const form = target.form || target.closest("form");
                  if (form) {
                    const inputs = Array.from(form.querySelectorAll("input, textarea, select"));
                    const currentIndex = inputs.indexOf(target);
                    if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
                      const nextInput = inputs[currentIndex + 1];
                      if (nextInput && !nextInput.disabled && !nextInput.readOnly) {
                        nextInput.focus();
                      }
                    }
                  } else {
                    // If no form, just allow normal tab
                    const tabEvent = new KeyboardEvent("keydown", {
                      key: "Tab",
                      code: "Tab",
                      keyCode: 9,
                      which: 9,
                      bubbles: true
                    });
                    target.dispatchEvent(tabEvent);
                  }
                }, 50);
              } else {
                console.error("[GHOST_WRITER] Failed to fill input");
              }
            }).catch(function(err) {
              console.error("[GHOST_WRITER] Error filling input:", err);
            });
          } else {
            console.error("[GHOST_WRITER] serverFillInputWithHint function not available");
          }
        }
      }

      // Handle input changes (clear hint if user types)
      function handleInput(e) {
        if (!isActive) return;
        
        const target = e.target;
        const currentSelector = getInputSelector(target);
        if (currentInputSelector === currentSelector) {
          // User is typing, clear hint
          if (target.value && target.value.length > 0) {
            currentHint = null;
            restoreOriginalPlaceholder(target);
          }
        }
      }

      // Activate
      function activate() {
        if (isActive) return;
        isActive = true;
        filledInputs.clear();
        originalPlaceholders.clear();
        hintMap.clear();
        currentHint = null;
        currentInputSelector = null;
        currentTestId = null;

        document.addEventListener("focusin", handleFocus, true);
        document.addEventListener("keydown", handleTabKey, true);
        document.addEventListener("input", handleInput, true);

        window.qaAgentGhostWriterActive = true;
      }

      // Deactivate
      function deactivate() {
        if (!isActive) return;
        isActive = false;

        // Restore all placeholders and remove skeletons
        originalPlaceholders.forEach((original, inputId) => {
          // Try to find element by ID first (using getElementById which doesn't require CSS selector syntax)
          // Then try by name attribute
          let element = null;
          try {
            element = document.getElementById(inputId);
          } catch (e) {
            // ID might not be valid, try by name
          }
          if (!element) {
            try {
              element = document.querySelector('[name="' + inputId.replace(/"/g, '\\"') + '"]');
            } catch (e) {
              // Invalid selector, skip
            }
          }
          if (element) {
            restoreOriginalPlaceholder(element);
            removeAILoadingEffect(element);
          }
        });

        // Also remove AI Loading Effects from any elements that might have them
        document.querySelectorAll('[data-ai-loading-effect="true"]').forEach(function(element) {
          removeAILoadingEffect(element);
        });

        document.removeEventListener("focusin", handleFocus, true);
        document.removeEventListener("keydown", handleTabKey, true);
        document.removeEventListener("input", handleInput, true);

        filledInputs.clear();
        originalPlaceholders.clear();
        hintMap.clear();
        currentHint = null;
        currentInputSelector = null;
        currentTestId = null;

        window.qaAgentGhostWriterActive = false;
      }

      // Expose functions
      window.qaAgentGhostWriter = {
        activate: activate,
        deactivate: deactivate,
        isActive: function() { return isActive; },
      };
    })();
  `;

  await page.evaluate(ghostWriterCode);

  // Activate ghost writer
  await page.evaluate(() => {
    if ((window as any).qaAgentGhostWriter) {
      (window as any).qaAgentGhostWriter.activate();
    }
  });

  const totalDuration = Date.now() - startTime;
  log("GHOST_WRITER", "=== Ghost Writer Activated ===", {
    totalDuration: `${totalDuration}ms`,
  });
};

/**
 * Deactivate ghost writer mode
 */
export const deactivateGhostWriter = async (page: Page): Promise<void> => {
  const startTime = Date.now();
  log("GHOST_WRITER", "=== Ghost Writer Deactivation Started ===");

  await page.evaluate(() => {
    if ((window as any).qaAgentGhostWriter) {
      (window as any).qaAgentGhostWriter.deactivate();
    }
  });

  const totalDuration = Date.now() - startTime;
  log("GHOST_WRITER", "=== Ghost Writer Deactivated ===", {
    totalDuration: `${totalDuration}ms`,
  });
};
