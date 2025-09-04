// Capacitor Web Bundle
const capacitorExports = {};

// Core Capacitor functionality
if (typeof window !== 'undefined') {
  window.Capacitor = {
    platform: 'web',
    isNative: false,
    isNativePlatform: () => false,
    getPlatform: () => 'web',
    Plugins: {}
  };
  
  // Export for module imports
  capacitorExports.Capacitor = window.Capacitor;
}

export const { Capacitor } = capacitorExports;
export default capacitorExports;