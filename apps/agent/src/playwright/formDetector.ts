import { FormField } from "@composer/shared";
import { Page } from "playwright";
import { OpenAIForm } from "./geminiService";

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

export const detectForm = async (
  page: Page,
  formIndex?: number
): Promise<FormField[]> => {
  const startTime = Date.now();
  log("FORM_DETECTION", "=== Form Field Detection Started ===", {
    formIndex,
    pageUrl: page.url(),
  });

  // Get OpenAI forms data from the page
  log("FORM_DETECTION", "Retrieving LLM-detected forms from page...");
  const openAIForms = await page.evaluate(() => {
    return ((window as any).qaAgentOpenAIForms ||
      (window as any).qaAgentGeminiForms) as OpenAIForm[] | undefined;
  });

  // If we have OpenAI forms data, use it
  if (openAIForms && openAIForms.length > 0) {
    log("FORM_DETECTION", "LLM forms data found", {
      formsCount: openAIForms.length,
      usingFormIndex:
        formIndex !== undefined && formIndex !== null ? formIndex : 0,
    });

    const targetIndex =
      formIndex !== undefined && formIndex !== null ? formIndex : 0;
    const targetForm = openAIForms[targetIndex];

    if (targetForm && targetForm.fields) {
      log("FORM_DETECTION", "Target form found", {
        formIndex: targetIndex,
        containerSelector: targetForm.containerSelector,
        fieldsCount: targetForm.fields.length,
      });

      // Convert OpenAI form fields to FormField format
      const fields = targetForm.fields.map((field) => ({
        selector: field.selector,
        type: field.type,
        label: field.label,
        required: field.required,
      }));

      const totalDuration = Date.now() - startTime;
      log("FORM_DETECTION", "=== Form Field Detection Completed (LLM) ===", {
        fieldsDetected: fields.length,
        totalDuration: `${totalDuration}ms`,
      });

      return fields;
    } else {
      log("FORM_DETECTION", "Target form not found in LLM data", {
        targetIndex,
        availableForms: openAIForms.length,
      });
    }
  } else {
    log(
      "FORM_DETECTION",
      "No LLM forms data found, falling back to manual detection"
    );
  }

  // Fallback to manual detection if OpenAI data is not available
  log("FORM_DETECTION", "Starting manual form detection...");
  const fields = await page.evaluate((index) => {
    const formFields: FormField[] = [];

    // Find all forms
    const forms = Array.from(document.querySelectorAll("form"));
    let targetForm: HTMLFormElement | null = null;

    // If formIndex is provided, use that specific form
    if (index !== undefined && index !== null && forms[index]) {
      targetForm = forms[index];
    } else {
      // Otherwise, find first form in viewport or first form in DOM
      // Try to find form in viewport
      for (const form of forms) {
        const rect = form.getBoundingClientRect();
        if (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth
        ) {
          targetForm = form;
          break;
        }
      }

      // If no form in viewport, use first form
      if (!targetForm && forms.length > 0) {
        targetForm = forms[0];
      }
    }

    if (!targetForm) {
      return formFields;
    }

    // Extract form fields
    const inputs = Array.from(
      targetForm.querySelectorAll("input, textarea, select")
    );

    inputs.forEach((element, index) => {
      const input = element as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement;
      const tag = input.tagName.toLowerCase();
      const type = input.type || tag;
      const id = input.id || "";
      const name = input.name || "";
      const required = input.hasAttribute("required");
      const placeholder = input.getAttribute("placeholder") || "";

      // Find label
      let label: string | undefined;
      if (id) {
        const labelElement = document.querySelector(`label[for="${id}"]`);
        if (labelElement) {
          label = labelElement.textContent?.trim() || undefined;
        }
      }

      // If no label found, try to find previous sibling label or text
      if (!label) {
        let prev = input.previousElementSibling;
        while (prev && !label) {
          if (prev.tagName === "LABEL") {
            label = prev.textContent?.trim() || undefined;
            break;
          }
          prev = prev.previousElementSibling;
        }
      }

      // Generate selector
      let selector = "";
      if (id) {
        selector = `#${id}`;
      } else if (name) {
        selector = `[name="${name}"]`;
      } else {
        selector = `${tag}:nth-of-type(${index + 1})`;
      }

      formFields.push({
        selector,
        type,
        label,
        required,
      });
    });

    return formFields;
  }, formIndex);

  const totalDuration = Date.now() - startTime;
  if (fields.length > 0) {
    log("FORM_DETECTION", "=== Form Field Detection Completed (Manual) ===", {
      fieldsDetected: fields.length,
      totalDuration: `${totalDuration}ms`,
      detectionMethod: "manual",
    });
  } else {
    log(
      "FORM_DETECTION",
      "=== Form Field Detection Completed (No Fields Found) ===",
      {
        fieldsDetected: 0,
        totalDuration: `${totalDuration}ms`,
        detectionMethod: "manual",
      }
    );
  }

  return fields;
};

/**
 * Detect form fields from a selected HTML element
 */
export const detectFormFromElement = async (
  page: Page,
  containerSelector: string
): Promise<FormField[]> => {
  const startTime = Date.now();
  log("FORM_DETECTION", "=== Form Field Detection from Element Started ===", {
    containerSelector,
    pageUrl: page.url(),
  });

  const fields = await page.evaluate((selector) => {
    const formFields: FormField[] = [];

    // Find the container element
    let containerElement: HTMLElement | null = null;
    try {
      containerElement = document.querySelector(selector) as HTMLElement;
    } catch (e) {
      console.warn("Failed to find element with selector:", selector, e);
      return formFields;
    }

    if (!containerElement) {
      return formFields;
    }

    // Extract form fields from the container
    const inputs = Array.from(
      containerElement.querySelectorAll("input, textarea, select")
    );

    inputs.forEach((element, index) => {
      const input = element as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement;
      const tag = input.tagName.toLowerCase();
      const type = input.type || tag;
      const id = input.id || "";
      const name = input.name || "";
      let required = input.hasAttribute("required");
      const placeholder = input.getAttribute("placeholder") || "";

      // Find label
      let label: string | undefined;
      let labelElement: HTMLElement | null = null;
      
      if (id) {
        labelElement = document.querySelector(`label[for="${id}"]`);
        if (labelElement) {
          label = labelElement.textContent?.trim() || undefined;
        }
      }

      // If no label found, try to find previous sibling label or text
      if (!label) {
        let prev = input.previousElementSibling;
        while (prev && !label) {
          if (prev.tagName === "LABEL") {
            labelElement = prev as HTMLElement;
            label = prev.textContent?.trim() || undefined;
            break;
          }
          prev = prev.previousElementSibling;
        }
      }

      // If still no label, try parent label
      if (!label) {
        const parentLabel = input.closest("label");
        if (parentLabel) {
          labelElement = parentLabel as HTMLElement;
          label = parentLabel.textContent?.trim() || undefined;
        }
      }

      // Use placeholder as label if no label found
      if (!label && placeholder) {
        label = placeholder;
      }

      // Check if label contains "*" to indicate required field
      if (!required && label) {
        // Check for asterisk in label text or nearby elements
        const labelText = label;
        if (labelText.includes("*") || labelText.includes("•")) {
          required = true;
        }
        
        // Also check if there's an asterisk element near the input
        if (!required && labelElement) {
          const asteriskElements = labelElement.querySelectorAll("*");
          for (let i = 0; i < asteriskElements.length; i++) {
            const el = asteriskElements[i];
            const text = el.textContent || "";
            if (text === "*" || text === "•" || el.classList.contains("required") || el.classList.contains("asterisk")) {
              required = true;
              break;
            }
          }
        }
        
        // Check siblings for asterisk indicators
        if (!required) {
          const parent = input.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children);
            for (const sibling of siblings) {
              if (sibling !== input && (sibling.tagName === "SPAN" || sibling.tagName === "LABEL")) {
                const text = sibling.textContent?.trim() || "";
                if (text === "*" || text === "•") {
                  required = true;
                  break;
                }
              }
            }
          }
        }
      }

      // Generate a unique data-testid for reliable selection
      const testId = `qa-agent-field-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Assign data-testid to the input element for reliable selection
      input.setAttribute("data-testid", testId);
      
      // Generate selector - prefer data-testid, then id, then name
      let selector = `[data-testid="${testId}"]`;
      
      // Also store alternative selectors for fallback
      let alternativeSelector = "";
      if (id && /^[a-zA-Z]/.test(id)) {
        // Only use ID selector if it starts with a letter (valid CSS)
        alternativeSelector = `#${id}`;
      } else if (name) {
        alternativeSelector = `[name="${name}"]`;
      }

      formFields.push({
        selector,
        type,
        label,
        required,
        // Store testId and alternativeSelector as extra properties
        ...(testId && { testId }),
        ...(alternativeSelector && { alternativeSelector }),
      } as FormField & { testId?: string; alternativeSelector?: string });
    });

    return formFields;
  }, containerSelector);

  const totalDuration = Date.now() - startTime;
  if (fields.length > 0) {
    log(
      "FORM_DETECTION",
      "=== Form Field Detection from Element Completed ===",
      {
        fieldsDetected: fields.length,
        totalDuration: `${totalDuration}ms`,
      }
    );
  } else {
    log(
      "FORM_DETECTION",
      "=== Form Field Detection from Element Completed (No Fields) ===",
      {
        fieldsDetected: 0,
        totalDuration: `${totalDuration}ms`,
      }
    );
  }

  return fields;
};
