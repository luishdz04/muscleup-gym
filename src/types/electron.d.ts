/**
 * TypeScript definitions for Electron IPC APIs exposed via preload script
 *
 * This file provides type safety for window.electron methods in React components
 */

export interface ElectronAPI {
  /**
   * Get the current application version
   * @returns Promise resolving to version string (e.g., "0.1.0")
   */
  getAppVersion: () => Promise<string>;

  /**
   * Get the application installation path
   * @returns Promise resolving to app path
   */
  getAppPath: () => Promise<string>;

  /**
   * Current platform
   * Values: 'win32' | 'darwin' | 'linux'
   */
  platform: NodeJS.Platform;

  /**
   * Flag to detect if running in Electron
   * Always true when in Electron environment
   */
  isElectron: true;
}

export interface ElectronLogger {
  /**
   * Log messages to Electron console
   */
  log: (...args: any[]) => void;

  /**
   * Log errors to Electron console
   */
  error: (...args: any[]) => void;

  /**
   * Log warnings to Electron console
   */
  warn: (...args: any[]) => void;
}

declare global {
  interface Window {
    /**
     * Electron APIs exposed via context bridge
     * Only available when running in Electron
     */
    electron?: ElectronAPI;

    /**
     * Electron logger for debugging
     * Only available when running in Electron
     */
    electronLogger?: ElectronLogger;
  }
}

export {};
