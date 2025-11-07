/**
 * This file handles dynamic style injection for themes
 */

export class ThemeStyleManager {
  private styleElements: Map<string, HTMLStyleElement> = new Map();

  injectStyles(themeName: string, styles: string[]): void {
    // Remove existing theme styles if any
    this.removeStyles(themeName);

    // Create and inject new style element
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-theme', themeName);
    styleElement.textContent = styles.join('\n');
    document.head.appendChild(styleElement);

    // Store reference
    this.styleElements.set(themeName, styleElement);
  }

  removeStyles(themeName: string): void {
    const existingStyle = this.styleElements.get(themeName);
    if (existingStyle) {
      existingStyle.remove();
      this.styleElements.delete(themeName);
    }
  }

  clearAllStyles(): void {
    this.styleElements.forEach((element) => element.remove());
    this.styleElements.clear();
  }
}

export const themeStyleManager = new ThemeStyleManager();