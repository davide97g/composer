export enum Theme {
  STAR_WARS_HERO = "Star Wars Hero",
  MARVEL_SUPERHERO = "Marvel Superhero",
  HARRY_POTTER_WIZARD = "Harry Potter Wizard",
  THE_OFFICE_EMPLOYEE = "The Office Employee",
  GAME_OF_THRONES_NOBLE = "Game of Thrones Noble",
}

export enum GenerationStatus {
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
}

export interface GeneratedField {
  label: string;
  type: string;
  value: string;
  status: GenerationStatus;
}

export interface Generation {
  id: string;
  url: string;
  createdAt: number;
  screenshotBefore?: string;
  screenshotAfter?: string;
  resourceDescription: string;
  fields: GeneratedField[];
}

export interface Website {
  url: string;
  theme: Theme | string;
  createdAt: number;
  navigationHistory: string[];
  customPrompt?: string;
  customGhostWriterPrompt?: string;
  generations?: Generation[];
}

export interface FormField {
  selector: string;
  type: string;
  label?: string;
  required: boolean;
}

export interface FormData {
  fields: FormField[];
  generatedValues: Record<string, string>;
}

export interface ThemeMetadata {
  title: string;
  description: string;
}

export const THEME_METADATA: Record<Theme, ThemeMetadata> = {
  [Theme.STAR_WARS_HERO]: {
    title: "Star Wars Hero",
    description: "Generate data inspired by characters from a galaxy far, far away",
  },
  [Theme.MARVEL_SUPERHERO]: {
    title: "Marvel Superhero",
    description: "Create data with the power of Earth's mightiest heroes",
  },
  [Theme.HARRY_POTTER_WIZARD]: {
    title: "Harry Potter Wizard",
    description: "Fill forms with magical data from the wizarding world",
  },
  [Theme.THE_OFFICE_EMPLOYEE]: {
    title: "The Office Employee",
    description: "Generate realistic office worker data with a touch of humor",
  },
  [Theme.GAME_OF_THRONES_NOBLE]: {
    title: "Game of Thrones Noble",
    description: "Create data fit for the noble houses of Westeros",
  },
};

export interface AIModelSettings {
  provider: string;
  model: string;
  apiKey: string;
}

export interface ScraperSettings {
  timeout: number;
  retries: number;
  optimization: boolean;
}

export interface FillerSettings {
  prompt: string;
  timeout: number;
}

export interface GhostWriterSettings {
  prompt: string;
}

export interface Settings {
  aiModel: AIModelSettings;
  scraper: ScraperSettings;
  filler: FillerSettings;
  ghostWriter: GhostWriterSettings;
}

/**
 * System prompt part that is always included and cannot be overridden
 * This part contains Theme and Form Fields placeholders
 */
export const SYSTEM_PROMPT_PART = `Theme: {theme}

Form Fields:
{fields}`;

export const DEFAULT_SETTINGS: Settings = {
  aiModel: {
    provider: "openai",
    model: "gpt-4o-mini",
    apiKey: "",
  },
  scraper: {
    timeout: 30000,
    retries: 3,
    optimization: true,
  },
  filler: {
    prompt: `You are generating fake form data based on a theme. Generate realistic, theme-appropriate values for each form field.

Requirements:
1. Generate appropriate values for each field based on its type and label
2. Values should be consistent with the theme: {theme}
3. For required fields, ensure values are provided
4. For email fields, generate valid email addresses
5. For date fields, use YYYY-MM-DD format
6. For phone/tel fields, use standard phone number formats
7. For text fields, generate realistic names, addresses, etc. based on the theme
8. For select fields, choose an appropriate option value
9. For checkbox/radio, use "true" or "false" as strings

Return your response as a JSON object where keys are the field selectors and values are the generated data strings.

Important: Return ONLY valid JSON, no markdown, no explanations, just the JSON object.`,
    timeout: 30000,
  },
  ghostWriter: {
    prompt: `You are helping a user fill out a form field. Based on the context provided, generate a single, appropriate VALUE (not a hint text, but an actual example value) that matches the theme: {theme}.

Generate a realistic EXAMPLE VALUE (not placeholder text) that:
- Is theme-specific and matches the theme: {theme}
- Is appropriate for the field type
- Is contextually relevant based on the label, placeholder, and form context
- Is a concrete example value (e.g., for email with theme "Star Wars Hero": "luke.skywalker@rebelalliance.com", for name: "Luke Skywalker")
- For text fields: provide actual names, addresses, or values matching the theme
- For email fields: provide actual email addresses matching the theme
- For date fields: provide actual dates in YYYY-MM-DD format
- For number fields: provide actual numbers

IMPORTANT: Return ONLY the example value, nothing else. No explanations, no JSON, no quotes, just the value string that the user would actually type.`,
  },
};

