import { Page } from "playwright";
import { FormData } from "@composer/shared";

export const showResults = async (
  page: Page,
  formData: FormData
): Promise<void> => {
  await page.evaluate((data) => {
    // Remove existing overlay if present
    const existingOverlay = document.getElementById("qa-agent-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "qa-agent-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 999998;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      background-color: white;
      border: 2px solid #007bff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: monospace;
      font-size: 12px;
    `;

    // Close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      line-height: 1;
    `;
    closeButton.addEventListener("click", () => {
      overlay.remove();
    });
    overlay.appendChild(closeButton);

    // Title
    const title = document.createElement("h3");
    title.textContent = "Form Detection Results";
    title.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: bold;
      color: #333;
    `;
    overlay.appendChild(title);

    // JSON content
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(data, null, 2);
    pre.style.cssText = `
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      color: #333;
    `;
    overlay.appendChild(pre);

    document.body.appendChild(overlay);
  }, formData);
};

