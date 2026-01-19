/**
 * Plugin Registry
 * 
 * This file explicitly imports and registers all available plugins.
 * Plugins are accessed via symlink at src/plugins -> ../../plugins
 */

// Import plugin modules explicitly via symlink
const pluginModules: Record<string, () => Promise<any>> = {};

// Register available plugins
pluginModules['../plugins/pages-engine/frontend/index.tsx'] = () => 
  import('../plugins/pages-engine/frontend/index.tsx');

// Add more plugins here as they are developed
// pluginModules['../plugins/customer-loyalty/frontend/index.tsx'] = () => 
//   import('../plugins/customer-loyalty/frontend/index.tsx');

export { pluginModules };
