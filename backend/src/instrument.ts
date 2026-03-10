import { initMonitoring } from './utils/monitoring';

// Must run before importing the Express app so auto-instrumentation can patch modules.
initMonitoring();
