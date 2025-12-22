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

/**
 * Callback type for progress updates
 */
export type ProgressCallback = (
  fieldIndex: number,
  status: "todo" | "in_progress" | "done" | "error" | "skipped",
  error?: Error
) => Promise<void>;

/**
 * Fill form fields using Playwright actions
 */
export const fillForm = async (
  page: Page,
  fields: FormField[],
  values: Record<string, string>,
  onProgress?: ProgressCallback
): Promise<void> => {
  const startTime = Date.now();
  log("FORM_FILLING", "=== Form Filling Started ===", {
    fieldsCount: fields.length,
    valuesCount: Object.keys(values).length,
    pageUrl: page.url(),
  });

  let filledCount = 0;
  let errorCount = 0;

  // Initialize all fields as "todo"
  if (onProgress) {
    for (let i = 0; i < fields.length; i++) {
      await onProgress(i, "todo");
    }
  }

  for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
    const field = fields[fieldIndex];
    try {
      const value = values[field.selector];
      if (value === undefined || value === null || value === "") {
        log("FORM_FILLING", "Skipping field (no value)", {
          selector: field.selector,
          type: field.type,
        });
        if (onProgress) {
          await onProgress(fieldIndex, "skipped");
        }
        continue;
      }

      // Update status to in_progress
      if (onProgress) {
        await onProgress(fieldIndex, "in_progress");
      }

      log("FORM_FILLING", "Filling field", {
        selector: field.selector,
        type: field.type,
        value: field.type === "password" ? "***" : value,
      });

      // Try data-testid selector first (most reliable)
      let element = await page
        .waitForSelector(field.selector, { state: "attached" })
        .catch(() => null);

      // If not found and we have alternative selector, try that
      if (!element && (field as any).alternativeSelector) {
        log("FORM_FILLING", "Trying alternative selector", {
          alternativeSelector: (field as any).alternativeSelector,
        });
        element = await page
          .waitForSelector((field as any).alternativeSelector, {
            state: "attached",
          })
          .catch(() => null);
      }

      // Last resort: try by name attribute
      if (!element && field.label) {
        // Try to find by label text (less reliable but sometimes works)
        try {
          const nameMatch = await page.evaluate((labelText) => {
            const labels = Array.from(document.querySelectorAll("label"));
            for (const label of labels) {
              if (label.textContent?.includes(labelText)) {
                const forAttr = label.getAttribute("for");
                if (forAttr) {
                  return `#${forAttr}`;
                }
              }
            }
            return null;
          }, field.label);

          if (nameMatch) {
            element = await page
              .waitForSelector(nameMatch, { state: "attached" })
              .catch(() => null);
          }
        } catch (e) {
          // Ignore errors in fallback
        }
      }

      if (!element) {
        log("FORM_FILLING", "Field not found with any selector", {
          selector: field.selector,
          alternativeSelector: (field as any).alternativeSelector,
          label: field.label,
        });
        errorCount++;
        if (onProgress) {
          await onProgress(fieldIndex, "error", new Error("Field not found"));
        }
        continue;
      }

      // Scroll element into view
      try {
        await element.scrollIntoViewIfNeeded();
        // Small delay to ensure scroll completes
        await page.waitForTimeout(100);
      } catch (e) {
        // Ignore scroll errors
      }

      const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
      const inputType = await element.evaluate((el) => {
        if (el instanceof HTMLInputElement) {
          return el.type;
        }
        return "";
      });

      // Handle different input types
      if (tagName === "input") {
        if (inputType === "checkbox" || inputType === "radio") {
          // For checkboxes and radios, check if value matches
          const currentValue = await element.evaluate((el) => {
            if (el instanceof HTMLInputElement) {
              return el.value;
            }
            return "";
          });

          if (value === "true" || value === currentValue) {
            await element.check();
            filledCount++;
            if (onProgress) {
              await onProgress(fieldIndex, "done");
            }
          } else {
            if (onProgress) {
              await onProgress(fieldIndex, "done");
            }
          }
        } else if (inputType === "file") {
          // Skip file inputs - can't fill them programmatically
          log("FORM_FILLING", "Skipping file input", {
            selector: field.selector,
          });
          if (onProgress) {
            await onProgress(fieldIndex, "skipped");
          }
        } else {
          // For text inputs, fill the value
          await element.fill(value);
          filledCount++;
          if (onProgress) {
            await onProgress(fieldIndex, "done");
          }
        }
      } else if (tagName === "textarea") {
        await element.fill(value);
        filledCount++;
        if (onProgress) {
          await onProgress(fieldIndex, "done");
        }
      } else if (tagName === "select") {
        // For select elements, try to select by value or label
        try {
          await element.selectOption(value);
          filledCount++;
          if (onProgress) {
            await onProgress(fieldIndex, "done");
          }
        } catch (e) {
          // Try selecting by visible text
          try {
            await element.selectOption({ label: value });
            filledCount++;
            if (onProgress) {
              await onProgress(fieldIndex, "done");
            }
          } catch (e2) {
            log("FORM_FILLING", "Failed to select option", {
              selector: field.selector,
              value,
              error: e2 instanceof Error ? e2.message : String(e2),
            });
            errorCount++;
            if (onProgress) {
              await onProgress(
                fieldIndex,
                "error",
                e2 instanceof Error ? e2 : new Error(String(e2))
              );
            }
          }
        }
      }

      log("FORM_FILLING", "Field filled successfully", {
        selector: field.selector,
        type: field.type,
      });
    } catch (error) {
      logError("FORM_FILLING", "Failed to fill field", error);
      log("FORM_FILLING", "Field filling failed", {
        selector: field.selector,
        type: field.type,
      });
      errorCount++;
      if (onProgress) {
        await onProgress(
          fieldIndex,
          "error",
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  log("FORM_FILLING", "=== Form Filling Completed ===", {
    filledCount,
    errorCount,
    totalDuration: `${totalDuration}ms`,
  });
};
