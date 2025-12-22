import { FormData, Theme } from "@composer/shared";
import { BrowserContext, Page } from "playwright";
import { createPersistentContext, navigateToUrl } from "./browser";
import { generateFakeData } from "./fakeDataGenerator";
import { detectForm, detectFormFromElement } from "./formDetector";
import { fillForm, ProgressCallback } from "./formFiller";
import { activateInputMode, activatePointerMode, deactivateInputMode, deactivatePointerMode, injectFloatingButton } from "./injector";
import { loadNavigationHistory, saveNavigationHistory } from "./navigationStorage";
import { addGlowingEffect, createProgressList, removeGlowingEffect, removeProgressList, showToast } from "./uiHelpers";

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

let currentContext: BrowserContext | null = null;
let currentPage: Page | null = null;
let currentTheme: Theme | string | null = null;
let isFunctionExposed = false;
let currentBaseUrl: string | null = null;

// Navigation history storage: baseUrl -> array of URLs (max 5)
// Load from file on initialization
const navigationHistory: Map<string, string[]> = loadNavigationHistory();

/**
 * Get base URL from a full URL
 */
const getBaseUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    return url;
  }
};

/**
 * Add URL to navigation history for a base URL (keeps last 5)
 */
const addToNavigationHistory = async (baseUrl: string, url: string): Promise<void> => {
  const startTime = Date.now();
  log("NAVIGATION", "Adding URL to navigation history", { baseUrl, url });

  try {
    if (!navigationHistory.has(baseUrl)) {
      navigationHistory.set(baseUrl, []);
      log("NAVIGATION", "Created new navigation history entry", { baseUrl });
    }

    const history = navigationHistory.get(baseUrl)!;

    // Remove if already exists (to avoid duplicates)
    const index = history.indexOf(url);
    if (index > -1) {
      history.splice(index, 1);
      log("NAVIGATION", "Removed duplicate URL from history", { baseUrl, index });
    }

    // Add to front
    history.unshift(url);

    // Keep only last 5
    if (history.length > 5) {
      const removed = history.pop();
      log("NAVIGATION", "Removed oldest URL from history (max 5)", {
        baseUrl,
        removedUrl: removed,
      });
    }

    navigationHistory.set(baseUrl, history);
    log("NAVIGATION", "Navigation history updated", {
      baseUrl,
      historyLength: history.length,
    });

    // Persist to file
    const saveStartTime = Date.now();
    await saveNavigationHistory(navigationHistory);
    const saveDuration = Date.now() - saveStartTime;
    log("NAVIGATION", "Navigation history persisted to file", {
      duration: `${saveDuration}ms`,
    });

    const totalDuration = Date.now() - startTime;
    log("NAVIGATION", "Navigation history operation completed", {
      totalDuration: `${totalDuration}ms`,
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    logError("NAVIGATION", "Failed to update navigation history", error);
    log("NAVIGATION", "Navigation history operation failed", {
      totalDuration: `${totalDuration}ms`,
    });
    throw error;
  }
};

/**
 * Get navigation history for a base URL
 */
export const getNavigationHistory = (baseUrl: string): string[] => {
  return navigationHistory.get(baseUrl) || [];
};

const setupPageHandlers = async (page: Page, theme: Theme | string): Promise<void> => {
  // Update current theme
  currentTheme = theme;

  // Expose function only once per page context (it persists across navigations)
  if (!isFunctionExposed) {
    await page.exposeFunction("serverActivateInputMode", async () => {
      const startTime = Date.now();
      log("INPUT_MODE", "=== Input Mode Activation Started ===", {
        theme: currentTheme,
        pageUrl: currentPage?.url(),
      });

      if (!currentPage || !currentTheme) {
        logError("INPUT_MODE", "Missing required context", {
          hasPage: !!currentPage,
          hasTheme: !!currentTheme,
        });
        return;
      }

      try {
        await activateInputMode(currentPage);
        const totalDuration = Date.now() - startTime;
        log("INPUT_MODE", "=== Input Mode Activated ===", {
          totalDuration: `${totalDuration}ms`,
        });
      } catch (error) {
        const totalDuration = Date.now() - startTime;
        logError("INPUT_MODE", "Input mode activation failed", error);
        log("INPUT_MODE", "=== Input Mode Activation Failed ===", {
          totalDuration: `${totalDuration}ms`,
        });
      }
    });

    await page.exposeFunction("serverDeactivateInputMode", async () => {
      if (!currentPage) return;
      await deactivateInputMode(currentPage);
    });

    await page.exposeFunction("serverExtractForm", async () => {
      const startTime = Date.now();
      console.log("[FORM_EXTRACTION] ========== EXTRACT BUTTON CLICKED ==========");
      log("FORM_EXTRACTION", "=== Form Extraction Started ===", {
        theme: currentTheme,
        pageUrl: currentPage?.url(),
        timestamp: new Date().toISOString(),
        callStack: new Error().stack?.split("\n").slice(0, 5).join("\n"),
      });

      if (!currentPage || !currentTheme) {
        logError("FORM_EXTRACTION", "Missing required context", {
          hasPage: !!currentPage,
          hasTheme: !!currentTheme,
        });
        return;
      }

      try {
        // Add glowing effect to selected element
        const selectedInfoForGlow = await currentPage.evaluate(() => {
          return (window as any).qaAgentSelectedElement;
        });
        if (selectedInfoForGlow?.selector) {
          await addGlowingEffect(currentPage, selectedInfoForGlow.selector);
        }

        // Show extracting toast
        await showToast(currentPage, "Extracting form fields...", "info");

        // Get selected element info with detailed stats
        log("FORM_EXTRACTION", "Step 1: Retrieving selected element info...");
        const selectedInfo = await currentPage.evaluate(() => {
          const selected = (window as any).qaAgentSelectedElement;
          if (!selected) {
            return null;
          }

          // Try to find the element and get stats
          let elementStats = null;
          try {
            const element = document.querySelector(selected.selector);
            if (element) {
              const rect = element.getBoundingClientRect();
              const inputs = element.querySelectorAll("input, textarea, select");
              const allElements = element.querySelectorAll("*");
              
              const inputDetails = Array.from(inputs).map((el: any) => {
                const inputInfo: any = {
                  tagName: el.tagName,
                  type: el.tagName === "INPUT" ? (el.type || "text") : el.tagName.toLowerCase(),
                  id: el.id || null,
                  name: el.name || null,
                  placeholder: el.placeholder || null,
                  required: el.hasAttribute("required"),
                };
                
                // Try to find label
                let label = null;
                if (el.id) {
                  const labelEl = document.querySelector("label[for=\"" + el.id + "\"]");
                  if (labelEl) label = labelEl.textContent?.trim() || null;
                }
                if (!label) {
                  const parentLabel = el.closest("label");
                  if (parentLabel) label = parentLabel.textContent?.trim() || null;
                }
                inputInfo.label = label;
                
                return inputInfo;
              });
              
              elementStats = {
                found: true,
                tagName: element.tagName,
                id: element.id || null,
                className: element.className || null,
                boundingBox: {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                },
                htmlSize: selected.html ? selected.html.length : 0,
                childElementsCount: allElements.length,
                formInputsCount: inputs.length,
                inputDetails: inputDetails,
                inputTypes: inputDetails.map((info: any) => info.type),
              };
            } else {
              elementStats = {
                found: false,
                selector: selected.selector,
              };
            }
          } catch (e) {
            elementStats = {
              error: e instanceof Error ? e.message : String(e),
            };
          }

          return {
            selector: selected.selector,
            html: selected.html,
            htmlSize: selected.html ? selected.html.length : 0,
            stats: elementStats,
          };
        });

        log("FORM_EXTRACTION", "Step 1: Selected element info retrieved", {
          hasSelectedInfo: !!selectedInfo,
          selector: selectedInfo?.selector,
          htmlSize: selectedInfo?.htmlSize,
          elementFound: selectedInfo?.stats?.found,
          tagName: selectedInfo?.stats?.tagName,
          id: selectedInfo?.stats?.id,
          className: selectedInfo?.stats?.className,
          childElementsCount: selectedInfo?.stats?.childElementsCount,
          formInputsCount: selectedInfo?.stats?.formInputsCount,
          inputTypes: selectedInfo?.stats?.inputTypes,
          inputDetails: selectedInfo?.stats?.inputDetails,
          boundingBox: selectedInfo?.stats?.boundingBox,
        });

        if (!selectedInfo || !selectedInfo.selector) {
          log("FORM_EXTRACTION", "No element selected - aborting");
          await currentPage.evaluate(() => {
            alert("Please select an element first");
          });
          return;
        }

        if (!selectedInfo.stats?.found) {
          log("FORM_EXTRACTION", "Selected element not found in DOM", {
            selector: selectedInfo.selector,
          });
          await currentPage.evaluate((selector) => {
            alert(`Selected element not found. Selector: ${selector}`);
          }, selectedInfo.selector);
          return;
        }

        log("FORM_EXTRACTION", "Step 2: Selected element validated", {
          selector: selectedInfo.selector,
          tagName: selectedInfo.stats.tagName,
          boundingBox: selectedInfo.stats.boundingBox,
          childElementsCount: selectedInfo.stats.childElementsCount,
          formInputsCount: selectedInfo.stats.formInputsCount,
        });

        // Detect form fields from selected element
        log("FORM_EXTRACTION", "Step 3: Detecting form fields from selected element...");
        const detectionStartTime = Date.now();
        const fields = await detectFormFromElement(currentPage, selectedInfo.selector);
        const detectionDuration = Date.now() - detectionStartTime;

        log("FORM_EXTRACTION", "Step 3: Form field detection completed", {
          fieldsCount: fields.length,
          duration: `${detectionDuration}ms`,
          fields: fields.map((f) => ({
            selector: f.selector,
            type: f.type,
            label: f.label,
            required: f.required,
          })),
        });

        if (fields.length === 0) {
          log("FORM_EXTRACTION", "No form fields detected - aborting");
          await currentPage.evaluate(() => {
            alert("No form fields found in the selected element");
          });
          return;
        }

        // Generate fake data
        await showToast(currentPage, "Generating data with AI...", "info");
        log("FORM_EXTRACTION", "Step 4: Generating fake data...", {
          theme: currentTheme,
          fieldsCount: fields.length,
        });
        const generationStartTime = Date.now();
        const generatedValues = await generateFakeData(fields, currentTheme);
        const generationDuration = Date.now() - generationStartTime;

        log("FORM_EXTRACTION", "Step 4: Fake data generation completed", {
          valuesCount: Object.keys(generatedValues).length,
          duration: `${generationDuration}ms`,
          sampleValues: Object.entries(generatedValues).slice(0, 3).map(([key, value]) => ({
            selector: key,
            value: value.length > 50 ? value.substring(0, 50) + "..." : value,
          })),
        });

        // Fill the form
        await showToast(currentPage, "Filling form...", "info");
        log("FORM_EXTRACTION", "Step 5: Filling form with generated values...");
        
        // Create progress list
        const progressItems = fields.map((field) => ({
          label: field.label || "Unnamed field",
          value: generatedValues[field.selector] || "",
          status: "todo" as const,
          selector: field.selector,
        }));
        await createProgressList(currentPage, progressItems);

        // Progress callback
        const onProgress: ProgressCallback = async (fieldIndex, status, error) => {
          const field = fields[fieldIndex];
          progressItems[fieldIndex] = {
            label: field.label || "Unnamed field",
            value: generatedValues[field.selector] || "",
            status,
            selector: field.selector,
          };
          await createProgressList(currentPage, progressItems);
        };

        const fillStartTime = Date.now();
        await fillForm(currentPage, fields, generatedValues, onProgress);
        const fillDuration = Date.now() - fillStartTime;

        log("FORM_EXTRACTION", "Step 5: Form filling completed", {
          duration: `${fillDuration}ms`,
        });

        // Create form data object
        const formData: FormData = {
          fields,
          generatedValues,
        };

        // Remove glow and progress list
        await removeGlowingEffect(currentPage);
        await removeProgressList(currentPage);

        // Show success toast
        await showToast(currentPage, `Form filled successfully with theme: ${currentTheme}`, "success");

        // Deactivate input mode
        await deactivateInputMode(currentPage);
        await currentPage.evaluate(() => {
          const button = document.getElementById("qa-agent-detect-btn");
          if (button) {
            button.textContent = "Detect Form";
            button.style.backgroundColor = "#007bff";
            button.style.display = "block";
          }
          // Remove controls
          const controls = document.getElementById("qa-agent-controls");
          if (controls) {
            controls.remove();
          }
        });

        const totalDuration = Date.now() - startTime;
        log("FORM_EXTRACTION", "=== Form Extraction Completed Successfully ===", {
          totalDuration: `${totalDuration}ms`,
          theme: currentTheme,
          fieldsDetected: fields.length,
        });
      } catch (error) {
        const totalDuration = Date.now() - startTime;
        logError("FORM_EXTRACTION", "Form extraction failed", error);
        log("FORM_EXTRACTION", "=== Form Extraction Failed ===", {
          totalDuration: `${totalDuration}ms`,
        });
        
        await currentPage.evaluate(() => {
          alert("Failed to extract form. Please try again.");
        });
      }
    });

    await page.exposeFunction("serverActivatePointerMode", async () => {
      const startTime = Date.now();
      log("FORM_DETECTION", "=== Form Detection Workflow Started ===", {
        theme: currentTheme,
        pageUrl: currentPage?.url(),
      });

      if (!currentPage || !currentTheme) {
        logError("FORM_DETECTION", "Missing required context", {
          hasPage: !!currentPage,
          hasTheme: !!currentTheme,
        });
        return;
      }

      try {
        // Step 1: Activate pointer mode (analyzes forms with LLM)
        log("FORM_DETECTION", "Step 1: Starting LLM form analysis...");
        const analysisStartTime = Date.now();
        
        await activatePointerMode(currentPage);
        
        const analysisDuration = Date.now() - analysisStartTime;
        log("FORM_DETECTION", `Step 1: LLM analysis completed`, {
          duration: `${analysisDuration}ms`,
        });

        // Step 2: Check if forms were detected
        log("FORM_DETECTION", "Step 2: Checking for detected forms...");
        const checkStartTime = Date.now();
        
        const hasForms = await currentPage.evaluate(() => {
          return !!(window as any).qaAgentOpenAIForms && 
                 (window as any).qaAgentOpenAIForms.length > 0;
        });
        
        const checkDuration = Date.now() - checkStartTime;
        log("FORM_DETECTION", `Step 2: Form check completed`, {
          hasForms,
          duration: `${checkDuration}ms`,
        });

        if (!hasForms) {
          log("FORM_DETECTION", "No forms detected - resetting button state");
          await currentPage.evaluate(() => {
            const button = document.getElementById("qa-agent-detect-btn");
            if (button) {
              button.textContent = "Detect Form";
              button.style.backgroundColor = "#007bff";
              button.style.cursor = "pointer";
              (button as HTMLButtonElement).disabled = false;
            }
          });
          const totalDuration = Date.now() - startTime;
          log("FORM_DETECTION", "=== Form Detection Workflow Completed (No Forms) ===", {
            totalDuration: `${totalDuration}ms`,
          });
          return;
        }

        // Step 3: Automatically extract the first form
        log("FORM_DETECTION", "Step 3: Starting automatic form extraction...", {
          formIndex: 0,
          delay: "300ms",
        });

        // Small delay to ensure forms are stored
        setTimeout(async () => {
          if (!currentPage || !currentTheme) {
            logError("FORM_DETECTION", "Context lost during timeout delay", {
              hasPage: !!currentPage,
              hasTheme: !!currentTheme,
            });
            return;
          }

          try {
            const extractionStartTime = Date.now();

            // Step 3a: Detect form fields
            log("FORM_DETECTION", "Step 3a: Detecting form fields...", {
              formIndex: 0,
            });
            
            const fields = await detectForm(currentPage, 0);
            const detectionDuration = Date.now() - extractionStartTime;
            
            log("FORM_DETECTION", `Step 3a: Form detection completed`, {
              fieldsCount: fields.length,
              duration: `${detectionDuration}ms`,
            });

            if (fields.length === 0) {
              log("FORM_DETECTION", "No form fields detected after extraction");
              await currentPage.evaluate(() => {
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

            // Step 3b: Generate fake data using theme
            log("FORM_DETECTION", "Step 3b: Generating fake data...", {
              theme: currentTheme,
              fieldsCount: fields.length,
            });
            const generationStartTime = Date.now();
            
            const generatedValues = await generateFakeData(fields, currentTheme);
            const generationDuration = Date.now() - generationStartTime;
            
            log("FORM_DETECTION", `Step 3b: Data generation completed`, {
              generatedFieldsCount: Object.keys(generatedValues).length,
              duration: `${generationDuration}ms`,
            });

            // Step 3c: Create form data object
            const formData: FormData = {
              fields,
              generatedValues,
            };

            // Step 3d: Log results
            log("FORM_DETECTION", "Step 3d: Form detection results", {
              theme: currentTheme,
              fields: fields.map((f) => ({
                selector: f.selector,
                type: f.type,
                label: f.label,
                required: f.required,
              })),
              generatedValues,
            });
            console.log(`[Theme: ${currentTheme}] Form Detection Results:`, JSON.stringify(formData, null, 2));

            // Step 3e: Reset button state
            log("FORM_DETECTION", "Step 3e: Resetting button state...");
            await currentPage.evaluate(() => {
              const button = document.getElementById("qa-agent-detect-btn");
              if (button) {
                button.textContent = "Detect Form";
                button.style.backgroundColor = "#007bff";
                button.style.cursor = "pointer";
                (button as HTMLButtonElement).disabled = false;
              }
            });

            // Step 3f: Show notification
            log("FORM_DETECTION", "Step 3g: Showing success notification...");
            await currentPage.evaluate((theme) => {
              // Create a notification toast
              const notification = document.createElement("div");
              notification.id = "qa-agent-notification";
              notification.textContent = `✓ Form detected and extracted using theme: ${theme}`;
              notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                background-color: #28a745;
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideIn 0.3s ease-out;
              `;
              
              // Add animation
              if (!document.getElementById("qa-agent-notification-styles")) {
                const style = document.createElement("style");
                style.id = "qa-agent-notification-styles";
                style.textContent = `
                  @keyframes slideIn {
                    from {
                      transform: translateX(100%);
                      opacity: 0;
                    }
                    to {
                      transform: translateX(0);
                      opacity: 1;
                    }
                  }
                `;
                document.head.appendChild(style);
              }
              
              document.body.appendChild(notification);
              
              // Remove notification after 5 seconds
              setTimeout(() => {
                if (notification.parentNode) {
                  notification.style.animation = "slideIn 0.3s ease-out reverse";
                  setTimeout(() => notification.remove(), 300);
                }
              }, 5000);
            }, currentTheme);

            const totalDuration = Date.now() - startTime;
            log("FORM_DETECTION", "=== Form Detection Workflow Completed Successfully ===", {
              totalDuration: `${totalDuration}ms`,
              theme: currentTheme,
              fieldsDetected: fields.length,
            });
          } catch (error) {
            const totalDuration = Date.now() - startTime;
            logError("FORM_DETECTION", "Form extraction failed", error);
            log("FORM_DETECTION", "=== Form Detection Workflow Failed ===", {
              totalDuration: `${totalDuration}ms`,
            });
            
            await currentPage.evaluate(() => {
              alert("Failed to automatically extract form. Please try again.");
              const button = document.getElementById("qa-agent-detect-btn");
              if (button) {
                button.textContent = "Detect Form";
                button.style.backgroundColor = "#007bff";
                button.style.cursor = "pointer";
                (button as HTMLButtonElement).disabled = false;
              }
            });
          }
        }, 300);
      } catch (error) {
        const totalDuration = Date.now() - startTime;
        logError("FORM_DETECTION", "Form detection workflow failed", error);
        log("FORM_DETECTION", "=== Form Detection Workflow Failed ===", {
          totalDuration: `${totalDuration}ms`,
        });
      }
    });

    await page.exposeFunction("serverDeactivatePointerMode", async () => {
      if (!currentPage) return;
      await deactivatePointerMode(currentPage);
    });

    await page.exposeFunction("serverDetectForm", async (formIndex?: number) => {
      const startTime = Date.now();
      log("MANUAL_FORM_DETECTION", "=== Manual Form Detection Started ===", {
        formIndex,
        theme: currentTheme,
      });

      if (!currentPage || !currentTheme) {
        logError("MANUAL_FORM_DETECTION", "Missing required context", {
          hasPage: !!currentPage,
          hasTheme: !!currentTheme,
        });
        return;
      }

      try {
        log("MANUAL_FORM_DETECTION", "Detecting form fields...", { formIndex });
        const fields = await detectForm(currentPage, formIndex);

        if (fields.length === 0) {
          log("MANUAL_FORM_DETECTION", "No form fields detected");
          await currentPage.evaluate(() => {
            alert("No form fields detected on this page");
          });
          return;
        }

        log("MANUAL_FORM_DETECTION", "Generating fake data...", {
          theme: currentTheme,
          fieldsCount: fields.length,
        });
        const generatedValues = generateFakeData(fields, currentTheme);

        const formData: FormData = {
          fields,
          generatedValues,
        };

        log("MANUAL_FORM_DETECTION", "Form detection completed", {
          fieldsCount: fields.length,
          generatedValuesCount: Object.keys(generatedValues).length,
        });
        console.log("Form Detection Results:", JSON.stringify(formData, null, 2));
        
        const totalDuration = Date.now() - startTime;
        log("MANUAL_FORM_DETECTION", "=== Manual Form Detection Completed ===", {
          totalDuration: `${totalDuration}ms`,
        });
      } catch (error) {
        const totalDuration = Date.now() - startTime;
        logError("MANUAL_FORM_DETECTION", "Manual form detection failed", error);
        log("MANUAL_FORM_DETECTION", "=== Manual Form Detection Failed ===", {
          totalDuration: `${totalDuration}ms`,
        });
      }
    });
    isFunctionExposed = true;
  }

  // Listen for navigation events and re-inject button
  page.on("domcontentloaded", async () => {
    if (currentPage === page) {
      await injectFloatingButton(page);
    }
  });

  // Track navigation events
  page.on("framenavigated", async (frame) => {
    if (frame === page.mainFrame() && currentBaseUrl) {
      const currentUrl = frame.url();
      const frameBaseUrl = getBaseUrl(currentUrl);
      log("NAVIGATION", "Page navigation detected", {
        url: currentUrl,
        baseUrl: frameBaseUrl,
        currentBaseUrl,
      });
      
      // Only track if navigation is within the same base URL
      if (frameBaseUrl === currentBaseUrl) {
        log("NAVIGATION", "Navigation within same base URL - adding to history");
        await addToNavigationHistory(currentBaseUrl, currentUrl);
      } else {
        log("NAVIGATION", "Navigation to different base URL - skipping history update");
      }
    }
  });

  // Inject button on initial load
  await injectFloatingButton(page);
};

export const startBrowserSession = async (
  url: string,
  theme: Theme | string
): Promise<void> => {
  const startTime = Date.now();
  log("BROWSER_SESSION", "=== Browser Session Started ===", { url, theme });

  try {
    // Close existing context if any
    if (currentContext) {
      log("BROWSER_SESSION", "Closing existing browser context...");
      await currentContext.close();
      isFunctionExposed = false;
    }

    // Create persistent context
    log("BROWSER_SESSION", "Creating persistent browser context...");
    const contextStartTime = Date.now();
    currentContext = await createPersistentContext(url);
    const contextDuration = Date.now() - contextStartTime;
    log("BROWSER_SESSION", "Browser context created", {
      duration: `${contextDuration}ms`,
    });

    // Get or create a page
    log("BROWSER_SESSION", "Getting or creating page...");
    const pages = currentContext.pages();
    if (pages.length > 0) {
      currentPage = pages[0];
      log("BROWSER_SESSION", "Reusing existing page", {
        pageUrl: currentPage.url(),
      });
    } else {
      currentPage = await currentContext.newPage();
      log("BROWSER_SESSION", "Created new page");
    }

    currentTheme = theme;
    currentBaseUrl = getBaseUrl(url);
    log("BROWSER_SESSION", "Session variables set", {
      baseUrl: currentBaseUrl,
      theme: currentTheme,
    });

    // Add initial URL to navigation history
    log("BROWSER_SESSION", "Adding URL to navigation history...");
    await addToNavigationHistory(currentBaseUrl, url);

    // Navigate to URL
    log("BROWSER_SESSION", "Navigating to URL...", { url });
    const navigationStartTime = Date.now();
    await navigateToUrl(currentPage, url);
    const navigationDuration = Date.now() - navigationStartTime;
    log("BROWSER_SESSION", "Navigation completed", {
      finalUrl: currentPage.url(),
      duration: `${navigationDuration}ms`,
    });

    // Set up page handlers
    log("BROWSER_SESSION", "Setting up page handlers...");
    const handlersStartTime = Date.now();
    await setupPageHandlers(currentPage, theme);
    const handlersDuration = Date.now() - handlersStartTime;
    log("BROWSER_SESSION", "Page handlers set up", {
      duration: `${handlersDuration}ms`,
    });

    const totalDuration = Date.now() - startTime;
    log("BROWSER_SESSION", "=== Browser Session Setup Completed ===", {
      totalDuration: `${totalDuration}ms`,
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    logError("BROWSER_SESSION", "Browser session setup failed", error);
    log("BROWSER_SESSION", "=== Browser Session Setup Failed ===", {
      totalDuration: `${totalDuration}ms`,
    });
    throw error;
  }
};

