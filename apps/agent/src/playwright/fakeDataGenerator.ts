import { FormField, Theme } from "@composer/shared";
import OpenAI from "openai";

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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. Please add it to your .env file."
    );
  }
  return apiKey;
};

/**
 * Generate fake data using LLM based on theme and field information
 */
const generateFakeDataWithLLM = async (
  fields: FormField[],
  theme: Theme | string
): Promise<Record<string, string>> => {
  const startTime = Date.now();
  log("LLM_DATA_GENERATION", "=== LLM Fake Data Generation Started ===", {
    theme,
    fieldsCount: fields.length,
  });

  try {
    const apiKey = getOpenAIApiKey();
    const openai = new OpenAI({ apiKey });

    // Prepare field descriptions for LLM
    const fieldDescriptions = fields.map((field, index) => ({
      index,
      selector: field.selector,
      type: field.type,
      label: field.label || "unnamed field",
      required: field.required,
    }));

    const prompt = `You are generating fake form data based on a theme. Generate realistic, theme-appropriate values for each form field.

Theme: ${theme}

Form Fields:
${JSON.stringify(fieldDescriptions, null, 2)}

Requirements:
1. Generate appropriate values for each field based on its type and label
2. Values should be consistent with the theme: ${theme}
3. For required fields, ensure values are provided
4. For email fields, generate valid email addresses
5. For date fields, use YYYY-MM-DD format
6. For phone/tel fields, use standard phone number formats
7. For text fields, generate realistic names, addresses, etc. based on the theme
8. For select fields, choose an appropriate option value
9. For checkbox/radio, use "true" or "false" as strings

Return your response as a JSON object where keys are the field selectors and values are the generated data strings:
{
  "${fieldDescriptions[0]?.selector || "selector1"}": "generated value 1",
  "${fieldDescriptions[1]?.selector || "selector2"}": "generated value 2",
  ...
}

Important: Return ONLY valid JSON, no markdown, no explanations, just the JSON object.`;

    log("LLM_DATA_GENERATION", "Calling OpenAI API...", {
      fieldsCount: fields.length,
      model: "gpt-4o-mini",
    });

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates realistic fake form data based on themes. Always return valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("OpenAI API call timeout after 30 seconds")),
          30000
        )
      ),
    ]);

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new Error("No response from OpenAI API");
    }

    // Parse JSON response
    let jsonText = text.trim();
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }

    const generatedValues: Record<string, string> = JSON.parse(jsonText);

    const totalDuration = Date.now() - startTime;
    log("LLM_DATA_GENERATION", "=== LLM Fake Data Generation Completed ===", {
      theme,
      fieldsCount: fields.length,
      generatedValuesCount: Object.keys(generatedValues).length,
      totalDuration: `${totalDuration}ms`,
    });

    return generatedValues;
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    logError("LLM_DATA_GENERATION", "LLM fake data generation failed", error);
    log("LLM_DATA_GENERATION", "Falling back to hardcoded generation", {
      totalDuration: `${totalDuration}ms`,
    });
    // Fall back to hardcoded generation
    return generateFakeDataHardcoded(fields, theme);
  }
};

/**
 * Fallback hardcoded fake data generation (original implementation)
 */
const generateFakeDataHardcoded = (
  fields: FormField[],
  theme: Theme | string
): Record<string, string> => {
  const startTime = Date.now();
  log("DATA_GENERATION", "=== Fake Data Generation Started ===", {
    theme,
    fieldsCount: fields.length,
  });

  const values: Record<string, string> = {};
  const generatedTypes: Record<string, number> = {};

  fields.forEach((field) => {
    const { selector, type } = field;
    let value = "";

    switch (type.toLowerCase()) {
      case "text":
      case "input":
        if (theme === Theme.STAR_WARS_HERO) {
          value = "Luke Skywalker";
        } else if (theme === Theme.MARVEL_SUPERHERO) {
          value = "Tony Stark";
        } else if (theme === Theme.HARRY_POTTER_WIZARD) {
          value = "Harry Potter";
        } else if (theme === Theme.THE_OFFICE_EMPLOYEE) {
          value = "Michael Scott";
        } else if (theme === Theme.GAME_OF_THRONES_NOBLE) {
          value = "Jon Snow";
        } else {
          value = "John Doe";
        }
        break;

      case "email":
        if (theme === Theme.STAR_WARS_HERO) {
          value = "luke.skywalker@rebelalliance.com";
        } else if (theme === Theme.MARVEL_SUPERHERO) {
          value = "tony.stark@starkindustries.com";
        } else if (theme === Theme.HARRY_POTTER_WIZARD) {
          value = "harry.potter@hogwarts.edu";
        } else if (theme === Theme.THE_OFFICE_EMPLOYEE) {
          value = "michael.scott@dundermifflin.com";
        } else if (theme === Theme.GAME_OF_THRONES_NOBLE) {
          value = "jon.snow@winterfell.com";
        } else {
          value = "user@domain.com";
        }
        break;

      case "date":
        if (theme === Theme.STAR_WARS_HERO) {
          value = "1977-05-25";
        } else if (theme === Theme.MARVEL_SUPERHERO) {
          value = "1970-05-29";
        } else if (theme === Theme.HARRY_POTTER_WIZARD) {
          value = "1980-07-31";
        } else if (theme === Theme.THE_OFFICE_EMPLOYEE) {
          value = "1965-03-15";
        } else if (theme === Theme.GAME_OF_THRONES_NOBLE) {
          value = "1983-04-23";
        } else {
          value = "2000-12-31";
        }
        break;

      case "number":
      case "tel":
        if (theme === Theme.STAR_WARS_HERO) {
          value = "1977";
        } else if (theme === Theme.MARVEL_SUPERHERO) {
          value = "2008";
        } else if (theme === Theme.HARRY_POTTER_WIZARD) {
          value = "1997";
        } else if (theme === Theme.THE_OFFICE_EMPLOYEE) {
          value = "2005";
        } else if (theme === Theme.GAME_OF_THRONES_NOBLE) {
          value = "2011";
        } else {
          value = "100";
        }
        break;

      case "password":
        if (theme === Theme.STAR_WARS_HERO) {
          value = "MayTheForceBeWithYou";
        } else if (theme === Theme.MARVEL_SUPERHERO) {
          value = "IAmIronMan2024";
        } else if (theme === Theme.HARRY_POTTER_WIZARD) {
          value = "Expelliarmus123";
        } else if (theme === Theme.THE_OFFICE_EMPLOYEE) {
          value = "ThatsWhatSheSaid!";
        } else if (theme === Theme.GAME_OF_THRONES_NOBLE) {
          value = "WinterIsComing2024";
        } else {
          value = "password123";
        }
        break;

      case "textarea":
        if (theme === Theme.STAR_WARS_HERO) {
          value = "I am a Jedi, like my father before me. The Force will be with you, always.";
        } else if (theme === Theme.MARVEL_SUPERHERO) {
          value = "I am Iron Man. The truth is, I am Iron Man. And the suit and I are one.";
        } else if (theme === Theme.HARRY_POTTER_WIZARD) {
          value = "I solemnly swear that I am up to no good. Mischief managed.";
        } else if (theme === Theme.THE_OFFICE_EMPLOYEE) {
          value = "Would I rather be feared or loved? Easy. Both. I want people to be afraid of how much they love me.";
        } else if (theme === Theme.GAME_OF_THRONES_NOBLE) {
          value = "I am the sword in the darkness. I am the watcher on the walls. I am the shield that guards the realms of men.";
        } else {
          value = "Sample text content";
        }
        break;

      case "select":
        // For select, we'll use first option if available
        value = "option1";
        break;

      case "checkbox":
      case "radio":
        value = "true";
        break;

      default:
        if (theme === Theme.STAR_WARS_HERO) {
          value = "Rebel Alliance";
        } else if (theme === Theme.MARVEL_SUPERHERO) {
          value = "Avengers";
        } else if (theme === Theme.HARRY_POTTER_WIZARD) {
          value = "Gryffindor";
        } else if (theme === Theme.THE_OFFICE_EMPLOYEE) {
          value = "Dunder Mifflin";
        } else if (theme === Theme.GAME_OF_THRONES_NOBLE) {
          value = "House Stark";
        } else {
          value = "sample";
        }
    }

    values[selector] = value;
    
    // Track field types for logging
    const typeKey = type.toLowerCase();
    generatedTypes[typeKey] = (generatedTypes[typeKey] || 0) + 1;
  });

  const totalDuration = Date.now() - startTime;
  log("DATA_GENERATION", "=== Fake Data Generation Completed ===", {
    theme,
    totalFields: fields.length,
    generatedValues: Object.keys(values).length,
    fieldTypes: generatedTypes,
    totalDuration: `${totalDuration}ms`,
  });

  return values;
};

/**
 * Generate fake data - uses LLM first, falls back to hardcoded if LLM fails
 */
export const generateFakeData = async (
  fields: FormField[],
  theme: Theme | string
): Promise<Record<string, string>> => {
  try {
    return await generateFakeDataWithLLM(fields, theme);
  } catch (error) {
    logError("DATA_GENERATION", "LLM generation failed, using hardcoded fallback", error);
    return generateFakeDataHardcoded(fields, theme);
  }
};

