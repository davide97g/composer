import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { mkdir } from "fs/promises";
import { Generation } from "@composer/shared";

const GENERATIONS_DIR = join(process.cwd(), ".composer");
const GENERATIONS_FILE = join(GENERATIONS_DIR, "generations.json");

type GenerationsData = Record<string, Generation[]>;

/**
 * Ensure the generations directory exists
 */
const ensureGenerationsDir = async (): Promise<void> => {
  if (!existsSync(GENERATIONS_DIR)) {
    await mkdir(GENERATIONS_DIR, { recursive: true });
  }
};

/**
 * Load generations from JSON file
 */
export const loadGenerations = (): Map<string, Generation[]> => {
  const generationsMap = new Map<string, Generation[]>();
  
  if (!existsSync(GENERATIONS_FILE)) {
    return generationsMap;
  }

  try {
    const fileContent = readFileSync(GENERATIONS_FILE, "utf-8");
    const data: GenerationsData = JSON.parse(fileContent);
    
    // Convert object to Map
    Object.entries(data).forEach(([baseUrl, generations]) => {
      if (Array.isArray(generations)) {
        generationsMap.set(baseUrl, generations);
      }
    });
  } catch (error) {
    console.error("Failed to load generations:", error);
  }

  return generationsMap;
};

/**
 * Save generations to JSON file
 */
export const saveGenerations = async (generationsMap: Map<string, Generation[]>): Promise<void> => {
  try {
    await ensureGenerationsDir();
    
    // Convert Map to object
    const data: GenerationsData = {};
    generationsMap.forEach((generations, baseUrl) => {
      data[baseUrl] = generations;
    });
    
    // Write to file with pretty formatting
    writeFileSync(GENERATIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save generations:", error);
  }
};

/**
 * Add a generation for a base URL
 */
export const addGeneration = async (baseUrl: string, generation: Generation): Promise<void> => {
  const generationsMap = loadGenerations();
  
  if (!generationsMap.has(baseUrl)) {
    generationsMap.set(baseUrl, []);
  }
  
  const generations = generationsMap.get(baseUrl)!;
  generations.unshift(generation);
  
  // Keep only last 50 generations per website
  if (generations.length > 50) {
    generations.splice(50);
  }
  
  generationsMap.set(baseUrl, generations);
  await saveGenerations(generationsMap);
};

/**
 * Get generations for a base URL
 */
export const getGenerations = (baseUrl: string): Generation[] => {
  const generationsMap = loadGenerations();
  return generationsMap.get(baseUrl) || [];
};

