import { Page } from "playwright";

/**
 * Show toast notification
 */
export const showToast = async (
  page: Page,
  message: string,
  type: "info" | "success" | "error" | "warning" = "info"
): Promise<void> => {
  const toastCode = `
    (function() {
      const msg = ${JSON.stringify(message)};
      const toastType = ${JSON.stringify(type)};
      // Remove existing toast
      const existingToast = document.getElementById("qa-agent-toast");
      if (existingToast) {
        existingToast.remove();
      }

      const toast = document.createElement("div");
      toast.id = "qa-agent-toast";
      
      const colors = {
        info: { bg: "#007bff", icon: "ℹ️" },
        success: { bg: "#28a745", icon: "✓" },
        error: { bg: "#dc3545", icon: "✕" },
        warning: { bg: "#ffc107", icon: "⚠" },
      };
      
      const color = colors[toastType];
      
      toast.textContent = color.icon + " " + msg;
      toast.style.cssText = 
        "position: fixed;" +
        "top: 20px;" +
        "right: 20px;" +
        "z-index: 1000001;" +
        "background-color: " + color.bg + ";" +
        "color: white;" +
        "padding: 12px 24px;" +
        "border-radius: 6px;" +
        "font-size: 14px;" +
        "font-weight: 500;" +
        "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);" +
        "animation: slideInRight 0.3s ease-out;" +
        "max-width: 400px;";
      
      // Add animation styles if not present
      if (!document.getElementById("qa-agent-toast-styles")) {
        const style = document.createElement("style");
        style.id = "qa-agent-toast-styles";
        style.textContent = 
          "@keyframes slideInRight {" +
          "  from {" +
          "    transform: translateX(100%);" +
          "    opacity: 0;" +
          "  }" +
          "  to {" +
          "    transform: translateX(0);" +
          "    opacity: 1;" +
          "  }" +
          "}";
        document.head.appendChild(style);
      }
      
      document.body.appendChild(toast);
      
      // Auto remove after 3 seconds for info/success, 5 seconds for error/warning
      const duration = toastType === "error" || toastType === "warning" ? 5000 : 3000;
      setTimeout(function() {
        if (toast.parentNode) {
          toast.style.animation = "slideInRight 0.3s ease-out reverse";
          setTimeout(function() { toast.remove(); }, 300);
        }
      }, duration);
    })();
  `;

  await page.evaluate(toastCode);
};

/**
 * Add glowing effect to selected element
 */
export const addGlowingEffect = async (
  page: Page,
  selector: string
): Promise<void> => {
  const glowCode = `
    (function() {
      const sel = ${JSON.stringify(selector)};
    const element = document.querySelector(sel);
    if (!element) return;

    // Remove existing glow
    const existingGlow = document.getElementById("qa-agent-extract-glow");
    if (existingGlow) {
      existingGlow.remove();
    }

      const rect = element.getBoundingClientRect();
      const glow = document.createElement("div");
      glow.id = "qa-agent-extract-glow";
      glow.style.cssText = 
        "position: fixed;" +
        "top: " + rect.top + "px;" +
        "left: " + rect.left + "px;" +
        "width: " + rect.width + "px;" +
        "height: " + rect.height + "px;" +
        "border: 4px solid #28a745;" +
        "border-radius: 8px;" +
        "background-color: rgba(40, 167, 69, 0.2);" +
        "box-shadow: 0 0 30px rgba(40, 167, 69, 0.8), 0 0 60px rgba(40, 167, 69, 0.5);" +
        "pointer-events: none;" +
        "z-index: 999996;" +
        "animation: qa-agent-glow-pulse 1.5s ease-in-out infinite;";

      // Add glow animation
      if (!document.getElementById("qa-agent-glow-styles")) {
        const style = document.createElement("style");
        style.id = "qa-agent-glow-styles";
        style.textContent = 
          "@keyframes qa-agent-glow-pulse {" +
          "  0%, 100% {" +
          "    box-shadow: 0 0 30px rgba(40, 167, 69, 0.8), 0 0 60px rgba(40, 167, 69, 0.5);" +
          "    border-color: #28a745;" +
          "  }" +
          "  50% {" +
          "    box-shadow: 0 0 50px rgba(40, 167, 69, 1), 0 0 100px rgba(40, 167, 69, 0.7);" +
          "    border-color: #20c997;" +
          "  }" +
          "}";
        document.head.appendChild(style);
      }

      document.body.appendChild(glow);

      // Update position on scroll/resize
      function updatePosition() {
        const el = document.querySelector(sel);
        if (el) {
          const newRect = el.getBoundingClientRect();
          glow.style.top = newRect.top + "px";
          glow.style.left = newRect.left + "px";
          glow.style.width = newRect.width + "px";
          glow.style.height = newRect.height + "px";
        }
      }

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    
    // Store cleanup
      window.qaAgentGlowCleanup = function() {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
        if (glow.parentNode) {
          glow.remove();
        }
      };
    })();
  `;

  await page.evaluate(glowCode);
};

/**
 * Remove glowing effect
 */
export const removeGlowingEffect = async (page: Page): Promise<void> => {
  const removeGlowCode = `
    (function() {
      if (window.qaAgentGlowCleanup) {
        window.qaAgentGlowCleanup();
        window.qaAgentGlowCleanup = null;
      }
      const glow = document.getElementById("qa-agent-extract-glow");
      if (glow) {
        glow.remove();
      }
    })();
  `;

  await page.evaluate(removeGlowCode);
};

/**
 * Create/update progress list
 */
export const createProgressList = async (
  page: Page,
  items: Array<{
    label: string;
    value: string;
    status: "todo" | "in_progress" | "done" | "error" | "skipped";
    selector?: string;
  }>
): Promise<void> => {
  // Use page.evaluate with a function to avoid string concatenation issues
  await page.evaluate((progressItems) => {
    const existing = document.getElementById("qa-agent-progress-list");
    if (existing) {
      existing.remove();
    }
    const container = document.createElement("div");
    container.id = "qa-agent-progress-list";
    container.style.cssText =
      "position: fixed;" +
      "top: 80px;" +
      "right: 20px;" +
      "z-index: 1000000;" +
      "background-color: white;" +
      "border: 2px solid #007bff;" +
      "border-radius: 8px;" +
      "padding: 16px;" +
      "max-width: 350px;" +
      "max-height: calc(100vh - 200px);" +
      "overflow-y: auto;" +
      "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);" +
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' +
      "scroll-behavior: smooth;";
    const title = document.createElement("div");
    title.textContent = "Form Filling Progress";
    title.style.cssText =
      "font-weight: 600;" +
      "font-size: 16px;" +
      "margin-bottom: 12px;" +
      "color: #333;" +
      "border-bottom: 1px solid #eee;" +
      "padding-bottom: 8px;";
    container.appendChild(title);
    const list = document.createElement("ul");
    list.style.cssText = "list-style: none; padding: 0; margin: 0;";
    progressItems.forEach(function (item, index) {
      const li = document.createElement("li");
      li.style.cssText =
        "padding: 10px;" +
        "margin-bottom: 8px;" +
        "border-radius: 6px;" +
        "border-left: 4px solid;" +
        "background-color: #f8f9fa;" +
        "transition: all 0.3s ease;";
      const statusColors = {
        todo: { border: "#6c757d", bg: "#f8f9fa", icon: "○" },
        in_progress: { border: "#007bff", bg: "#e7f3ff", icon: "⟳" },
        done: { border: "#28a745", bg: "#d4edda", icon: "✓" },
        error: { border: "#dc3545", bg: "#f8d7da", icon: "✕" },
        skipped: { border: "#ffc107", bg: "#fff3cd", icon: "⚠" },
      };
      const status = statusColors[item.status];
      if (status) {
        li.style.borderLeftColor = status.border;
        li.style.backgroundColor = status.bg;
      }
      // Store selector for click handler
      if (item.selector) {
        try {
          li.setAttribute("data-field-selector", String(item.selector));
        } catch (e) {
          // Ignore errors
        }
      }
      // Add click handler for skipped items to scroll to input
      if (item.status === "skipped" && item.selector) {
        li.style.cursor = "pointer";
        li.addEventListener("click", function () {
          const selector = this.getAttribute("data-field-selector");
          if (selector) {
            const element = document.querySelector(selector) as HTMLElement;
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              // Highlight with yellow border temporarily
              const originalBorder = element.style.border;
              const originalOutline = element.style.outline;
              element.style.border = "3px solid #ffc107";
              element.style.outline = "2px solid rgba(255, 193, 7, 0.3)";
              setTimeout(function () {
                element.style.border = originalBorder;
                element.style.outline = originalOutline;
              }, 2000);
            }
          }
        });
      }
      const labelDiv = document.createElement("div");
      labelDiv.style.cssText =
        "font-weight: 500;" +
        "font-size: 14px;" +
        "color: #333;" +
        "margin-bottom: 4px;" +
        "display: flex;" +
        "align-items: center;" +
        "gap: 8px;";
      const iconSpan = document.createElement("span");
      iconSpan.style.fontSize = "18px";
      if (status) {
        iconSpan.textContent = status.icon;
      }
      const labelSpan = document.createElement("span");
      try {
        labelSpan.textContent =
          item.label != null ? String(item.label) : "Unnamed field";
      } catch (e) {
        labelSpan.textContent = "Unnamed field";
      }
      labelDiv.appendChild(iconSpan);
      labelDiv.appendChild(document.createTextNode(" "));
      labelDiv.appendChild(labelSpan);
      const valueDiv = document.createElement("div");
      valueDiv.style.cssText =
        "font-size: 12px;" +
        "color: #666;" +
        "margin-left: 26px;" +
        "word-break: break-word;";
      const safeValue = (item.value || "").toString();
      const displayValue =
        safeValue.length > 50 ? safeValue.substring(0, 50) + "..." : safeValue;
      valueDiv.textContent = displayValue || "(no value)";
      li.appendChild(labelDiv);
      li.appendChild(valueDiv);
      list.appendChild(li);
    });
    container.appendChild(list);
    document.body.appendChild(container);
    // Highlight skipped inputs with yellow border
    progressItems.forEach(function (item) {
      if (item.status === "skipped" && item.selector) {
        try {
          const selector = String(item.selector);
          const element = document.querySelector(selector) as HTMLElement;
          if (element) {
            element.style.border = "2px solid #ffc107";
            element.style.boxShadow = "0 0 0 2px rgba(255, 193, 7, 0.2)";
          }
        } catch (e) {
          // Ignore errors
        }
      }
    });
    // Auto-scroll to active item (in_progress) or latest done/skipped item
    setTimeout(function () {
      const listItems = list.querySelectorAll("li");
      let targetItem = null;
      // Find the first in_progress item
      for (let i = 0; i < listItems.length; i++) {
        const item = progressItems[i];
        if (item && item.status === "in_progress") {
          targetItem = listItems[i];
          break;
        }
      }
      // If no in_progress, find the last done or skipped item
      if (!targetItem) {
        for (let i = listItems.length - 1; i >= 0; i--) {
          const item = progressItems[i];
          if (item && (item.status === "done" || item.status === "skipped")) {
            targetItem = listItems[i];
            break;
          }
        }
      }
      // Scroll to target item or bottom if no target
      if (targetItem) {
        targetItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }, items);
};

/**
 * Remove progress list
 */
export const removeProgressList = async (page: Page): Promise<void> => {
  const removeProgressCode = `
    (function() {
      const list = document.getElementById("qa-agent-progress-list");
      if (list) {
        // Remove yellow borders from skipped inputs before removing list
        const skippedItems = list.querySelectorAll('li[data-field-selector]');
        skippedItems.forEach(function(li) {
          const selector = li.getAttribute('data-field-selector');
          if (selector) {
            const element = document.querySelector(selector);
            if (element) {
              element.style.border = '';
              element.style.boxShadow = '';
            }
          }
        });
        list.remove();
      }
    })();
  `;

  await page.evaluate(removeProgressCode);
};
