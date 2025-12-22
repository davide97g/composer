export enum Theme {
  STAR_WARS_HERO = "Star Wars Hero",
  MARVEL_SUPERHERO = "Marvel Superhero",
  HARRY_POTTER_WIZARD = "Harry Potter Wizard",
  THE_OFFICE_EMPLOYEE = "The Office Employee",
  GAME_OF_THRONES_NOBLE = "Game of Thrones Noble",
}

export interface Website {
  url: string;
  theme: Theme | string;
  createdAt: number;
  navigationHistory: string[];
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

