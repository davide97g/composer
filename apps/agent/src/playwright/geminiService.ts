import OpenAI from "openai";
import { getApiKey, loadSettings } from "./settingsStorage";

export interface OpenAIFormField {
  selector: string;
  type: string;
  label?: string;
  required: boolean;
}

export interface OpenAIForm {
  formIndex: number;
  fields: OpenAIFormField[];
  containerSelector: string; // CSS selector for the form container (required)
}

export interface OpenAIFormAnalysis {
  forms: OpenAIForm[];
}

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

const getOpenAIApiKey = (): string => {
  log("OPENAI_API", "Checking for OpenAI API key...");
  try {
    const apiKey = getApiKey();
    log("OPENAI_API", "OpenAI API key found", { keyLength: apiKey.length });
    return apiKey;
  } catch (error) {
    logError("OPENAI_API", "OpenAI API key not found", error as Error);
    throw error;
  }
};

/**
 * Optimizes HTML content to reduce context size before sending to OpenAI
 * Removes unnecessary elements, extracts form-related content, and minifies
 */
const optimizeHtmlForOpenAI = (html: string): string => {
  const startSize = html.length;
  let optimized = html;

  // Remove HTML comments
  optimized = optimized.replace(/<!--[\s\S]*?-->/g, "");

  // Remove script tags and their content
  optimized = optimized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  // Remove style tags and their content
  optimized = optimized.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ""
  );

  // Remove noscript tags
  optimized = optimized.replace(
    /<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi,
    ""
  );

  // Remove link tags (stylesheets, etc.) but keep them if they're in head for context
  // We'll handle head separately

  // Extract body content if it exists, otherwise use the whole HTML
  const bodyMatch = optimized.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : optimized;

  // Remove unnecessary attributes from all elements, keeping only essential ones
  // Essential attributes: id, name, type, required, aria-*, placeholder, class (for selectors), for (labels)
  optimized = bodyContent.replace(
    /<(\w+)([^>]*)>/gi,
    (match, tagName, attributes) => {
      if (!attributes) return match;

      // Keep essential attributes
      const essentialAttrs: string[] = [];

      // Extract id
      const idMatch = attributes.match(/\bid\s*=\s*["']([^"']+)["']/i);
      if (idMatch) essentialAttrs.push(`id="${idMatch[1]}"`);

      // Extract name
      const nameMatch = attributes.match(/\bname\s*=\s*["']([^"']+)["']/i);
      if (nameMatch) essentialAttrs.push(`name="${nameMatch[1]}"`);

      // Extract type
      const typeMatch = attributes.match(/\btype\s*=\s*["']([^"']+)["']/i);
      if (typeMatch) essentialAttrs.push(`type="${typeMatch[1]}"`);

      // Extract required
      if (/\brequired\b/i.test(attributes)) {
        essentialAttrs.push("required");
      }

      // Extract aria-* attributes
      const ariaMatches = attributes.matchAll(
        /\b(aria-[^=]*)\s*=\s*["']([^"']+)["']/gi
      );
      for (const ariaMatch of ariaMatches) {
        essentialAttrs.push(`${ariaMatch[1]}="${ariaMatch[2]}"`);
      }

      // Extract placeholder
      const placeholderMatch = attributes.match(
        /\bplaceholder\s*=\s*["']([^"']+)["']/i
      );
      if (placeholderMatch)
        essentialAttrs.push(`placeholder="${placeholderMatch[1]}"`);

      // Extract class (needed for selectors)
      const classMatch = attributes.match(/\bclass\s*=\s*["']([^"']+)["']/i);
      if (classMatch) essentialAttrs.push(`class="${classMatch[1]}"`);

      // Extract for (labels)
      const forMatch = attributes.match(/\bfor\s*=\s*["']([^"']+)["']/i);
      if (forMatch) essentialAttrs.push(`for="${forMatch[1]}"`);

      // Extract value (for inputs that have default values)
      const valueMatch = attributes.match(/\bvalue\s*=\s*["']([^"']+)["']/i);
      if (valueMatch && (tagName === "input" || tagName === "button")) {
        essentialAttrs.push(`value="${valueMatch[1]}"`);
      }

      const attrsStr =
        essentialAttrs.length > 0 ? " " + essentialAttrs.join(" ") : "";
      return `<${tagName}${attrsStr}>`;
    }
  );

  // Remove empty elements that aren't form-related
  optimized = optimized.replace(
    /<(div|span|p|section|article|header|footer|nav|aside)([^>]*)\s*\/?>\s*<\/\1>/gi,
    ""
  );

  // Minify whitespace: collapse multiple spaces/tabs/newlines to single space
  optimized = optimized.replace(/\s+/g, " ");

  // Remove spaces around tags
  optimized = optimized.replace(/>\s+</g, "><");

  // Trim the result
  optimized = optimized.trim();

  // Limit to 50k chars (reduced from 100k) since we've optimized
  const maxLength = 50000;
  if (optimized.length > maxLength) {
    // Try to intelligently truncate: find the last complete form element
    const truncated = optimized.substring(0, maxLength);
    const lastFormIndex = Math.max(
      truncated.lastIndexOf("</form>"),
      truncated.lastIndexOf("</div>"),
      truncated.lastIndexOf("</section>")
    );

    if (lastFormIndex > maxLength * 0.8) {
      // If we found a closing tag reasonably close to the limit, use it
      optimized = truncated.substring(0, lastFormIndex + 7); // +7 for "</form>"
    } else {
      optimized = truncated;
    }
  }

  const endSize = optimized.length;
  const reduction = (((startSize - endSize) / startSize) * 100).toFixed(1);

  log("OPENAI_API", "HTML optimization completed", {
    originalSize: `${startSize} bytes`,
    optimizedSize: `${endSize} bytes`,
    reduction: `${reduction}%`,
  });

  return optimized;
};

/**
 * Analyzes HTML content using OpenAI to identify forms and their fields
 */
export const analyzeFormsWithOpenAI = async (
  html: string
): Promise<OpenAIFormAnalysis> => {
  const startTime = Date.now();
  const htmlSize = html.length;
  const settings = loadSettings();

  // Optimize HTML to reduce context size (if enabled)
  let optimizedHtml = html;
  let optimizedSize = htmlSize;
  if (settings.scraper.optimization) {
    log("OPENAI_API", "Optimizing HTML content...", {
      originalSize: `${htmlSize} bytes`,
    });
    optimizedHtml = optimizeHtmlForOpenAI(html);
    optimizedSize = optimizedHtml.length;
  } else {
    log("OPENAI_API", "HTML optimization disabled, using original HTML", {
      size: `${htmlSize} bytes`,
    });
  }

  log("OPENAI_API", "=== OpenAI Form Analysis Started ===", {
    htmlSize: `${htmlSize} bytes`,
    optimizedSize: `${optimizedSize} bytes`,
    reduction: settings.scraper.optimization
      ? `${(((htmlSize - optimizedSize) / htmlSize) * 100).toFixed(1)}%`
      : "0%",
    model: settings.aiModel.model,
  });

  let apiKey: string;
  try {
    apiKey = getOpenAIApiKey();
  } catch (error) {
    logError("OPENAI_API", "Failed to get API key", error);
    throw error;
  }

  const openai = new OpenAI({ apiKey });
  log("OPENAI_API", "OpenAI client initialized");

  const prompt = `You are analyzing an HTML page to identify all forms and their input fields.

Your task is to:
1. Identify all forms on the page (even if they're not wrapped in <form> tags - look for groups of input fields that function as forms)
2. For each form, provide:
   - A CSS selector that uniquely identifies the form container (REQUIRED - prefer id, then name attribute, then class with unique path, then detailed DOM path)
   - All input fields within that form with their selectors, types, labels, and whether they're required

Return your response as a JSON object with this exact structure:
{
  "forms": [
    {
      "formIndex": 0,
      "containerSelector": "#login-form",
      "fields": [
        {
          "selector": "#email",
          "type": "email",
          "label": "Email Address",
          "required": true
        },
        {
          "selector": "#password",
          "type": "password",
          "label": "Password",
          "required": true
        }
      ]
    }
  ]
}

Important:
- containerSelector is REQUIRED and must be a valid CSS selector that uniquely identifies the form container
- Use precise CSS selectors (prefer id, then name attribute, then class with unique path, then detailed nth-child paths)
- Extract actual labels from the HTML (from <label> tags, aria-label, placeholder, or nearby text)
- Determine if fields are required by checking the "required" attribute, aria-required="true", or validation patterns
- Include all form-like structures, even if they don't use <form> tags (e.g., div containers with input fields)
- For containerSelector, if no unique id exists, create a detailed path like "body > div.container > form" or use nth-child selectors
- Make sure containerSelector can be used with document.querySelector() to find the form element

HTML content:
${optimizedHtml}`;

  try {
    const settings = loadSettings();
    const model = settings.aiModel.model;

    log("OPENAI_API", "Sending request to OpenAI API...", {
      promptLength: prompt.length,
      model,
      temperature: 0.3,
    });

    const apiCallStartTime = Date.now();
    const completion = await Promise.race([
      openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that analyzes HTML and returns structured JSON data about forms and their fields.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
      new Promise<never>((_, reject) => {
        const settings = loadSettings();
        const timeout = settings.scraper.timeout;
        setTimeout(
          () => reject(new Error(`OpenAI API call timeout after ${timeout}ms`)),
          timeout
        );
      }),
    ]);

    const apiCallDuration = Date.now() - apiCallStartTime;
    log("OPENAI_API", "OpenAI API call completed", {
      duration: `${apiCallDuration}ms`,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    });

    const text = completion.choices[0]?.message?.content;

    if (!text) {
      logError(
        "OPENAI_API",
        "No response content from OpenAI API",
        new Error("Empty response")
      );
      throw new Error("No response from OpenAI API");
    }

    log("OPENAI_API", "Processing API response...", {
      responseLength: text.length,
    });

    // Extract JSON from the response (handle markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
      log("OPENAI_API", "Extracted JSON from markdown code block");
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
      log("OPENAI_API", "Extracted JSON from code block");
    }

    log("OPENAI_API", "Parsing JSON response...");
    const parseStartTime = Date.now();
    const analysis: OpenAIFormAnalysis = JSON.parse(jsonText);
    const parseDuration = Date.now() - parseStartTime;

    const totalDuration = Date.now() - startTime;
    log("OPENAI_API", "=== OpenAI Form Analysis Completed Successfully ===", {
      formsFound: analysis.forms.length,
      parseDuration: `${parseDuration}ms`,
      totalDuration: `${totalDuration}ms`,
    });

    return analysis;
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    if (error instanceof Error && error.message.includes("timeout")) {
      logError("OPENAI_API", "OpenAI API call timed out", error);
      log("OPENAI_API", "=== OpenAI Form Analysis Failed (Timeout) ===", {
        totalDuration: `${totalDuration}ms`,
        timeout: "60s",
      });
    } else {
      logError("OPENAI_API", "OpenAI API call failed", error);
      log("OPENAI_API", "=== OpenAI Form Analysis Failed ===", {
        totalDuration: `${totalDuration}ms`,
      });
    }

    throw new Error(
      `Failed to analyze forms with OpenAI: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Generate a hint for a single input field based on context
 */
export const generateInputHint = async (
  inputContext: {
    selector: string;
    type: string;
    label?: string | null;
    placeholder?: string | null;
    name?: string | null;
    id?: string | null;
    required: boolean;
  },
  formContainerSelector: string | null,
  pageUrl: string,
  pageTitle: string,
  theme: string,
  customGhostWriterPrompt?: string
): Promise<string> => {
  const startTime = Date.now();
  log("INPUT_HINT", "=== Input Hint Generation Started ===", {
    inputType: inputContext.type,
    hasLabel: !!inputContext.label,
    hasFormContainer: !!formContainerSelector,
  });

  try {
    const apiKey = getOpenAIApiKey();
    const openai = new OpenAI({ apiKey });
    const settings = loadSettings();
    const model = settings.aiModel.model;

    // Build context description
    let contextDescription = `Page: ${pageTitle}\nURL: ${pageUrl}\n\n`;
    contextDescription += `Current Input Field:\n`;
    contextDescription += `- Type: ${inputContext.type}\n`;
    if (inputContext.label) {
      contextDescription += `- Label: ${inputContext.label}\n`;
    }
    if (inputContext.placeholder) {
      contextDescription += `- Placeholder: ${inputContext.placeholder}\n`;
    }
    if (inputContext.name) {
      contextDescription += `- Name: ${inputContext.name}\n`;
    }
    if (inputContext.id) {
      contextDescription += `- ID: ${inputContext.id}\n`;
    }
    contextDescription += `- Required: ${
      inputContext.required ? "Yes" : "No"
    }\n`;

    if (formContainerSelector) {
      contextDescription += `\nForm Container: ${formContainerSelector}\n`;
    }

    // Use custom prompt if provided, otherwise use default from settings
    const basePrompt = customGhostWriterPrompt || settings.ghostWriter.prompt;
    const isUsingCustomPrompt = !!customGhostWriterPrompt;

    log("INPUT_HINT", "Using prompt for hint generation", {
      isCustomPrompt: isUsingCustomPrompt,
      promptLength: basePrompt.length,
    });

    // Replace {theme} placeholder in the prompt
    const userPrompt = basePrompt.replace(/{theme}/g, theme);

    const prompt = `${userPrompt}

${contextDescription}

Theme: ${theme}`;

    log("INPUT_HINT", "Calling OpenAI API for hint generation...", {
      model,
      promptLength: prompt.length,
    });

    const completion = await Promise.race([
      openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that generates realistic example values for form fields based on a specific theme. The theme is: ${theme}. Always return only the example value, nothing else. Make it theme-specific and realistic.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 50,
      }),
      new Promise<never>((_, reject) => {
        const timeout = settings.scraper.timeout;
        setTimeout(
          () => reject(new Error(`OpenAI API call timeout after ${timeout}ms`)),
          timeout
        );
      }),
    ]);

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new Error("No response from OpenAI API");
    }

    // Clean up the hint (remove quotes, trim)
    let hint = text.trim();
    // Remove surrounding quotes if present
    if (
      (hint.startsWith('"') && hint.endsWith('"')) ||
      (hint.startsWith("'") && hint.endsWith("'"))
    ) {
      hint = hint.slice(1, -1);
    }

    const totalDuration = Date.now() - startTime;
    log("INPUT_HINT", "=== Input Hint Generation Completed ===", {
      hint,
      totalDuration: `${totalDuration}ms`,
    });

    return hint;
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    logError("INPUT_HINT", "Input hint generation failed", error);
    log("INPUT_HINT", "=== Input Hint Generation Failed ===", {
      totalDuration: `${totalDuration}ms`,
    });

    // Return a fallback hint based on input type
    const fallbackHints: Record<string, string> = {
      email: "user@example.com",
      password: "••••••••",
      tel: "+1 (555) 123-4567",
      date: "2024-01-01",
      number: "123",
      text: "Enter text here",
      textarea: "Enter text here",
      select: "Select an option",
    };

    return (
      fallbackHints[inputContext.type.toLowerCase()] ||
      fallbackHints["text"] ||
      "Enter value"
    );
  }
};

// Export legacy names for backward compatibility during migration
export type GeminiFormField = OpenAIFormField;
export type GeminiForm = OpenAIForm;
export type GeminiFormAnalysis = OpenAIFormAnalysis;
export const analyzeFormsWithGemini = analyzeFormsWithOpenAI;
