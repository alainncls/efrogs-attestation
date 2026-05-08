const INSIGHTS_PROJECT_ID = 'efYR8w1YGDl3cflb';
const INSIGHTS_SCRIPT_ID = 'insights-script';
const INSIGHTS_SCRIPT_SRC = '/js/insights-js.umd.min.js';

declare global {
  interface Window {
    insights?: {
      init: (projectId: string) => void;
      trackPages: () => void;
    };
  }
}

const initializeInsights = () => {
  window.insights?.init(INSIGHTS_PROJECT_ID);
  window.insights?.trackPages();
};

const requestIdleTask = (callback: () => void) => {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(callback, { timeout: 3_000 });
    return;
  }

  globalThis.setTimeout(callback, 2_000);
};

export const scheduleInsights = () => {
  const loadScript = () =>
    requestIdleTask(() => {
      const existingScript = document.getElementById(INSIGHTS_SCRIPT_ID);

      if (existingScript) {
        if (window.insights) {
          initializeInsights();
        } else {
          existingScript.addEventListener('load', initializeInsights, {
            once: true,
          });
        }
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.id = INSIGHTS_SCRIPT_ID;
      script.src = INSIGHTS_SCRIPT_SRC;
      script.addEventListener('load', initializeInsights, { once: true });

      document.head.append(script);
    });

  if (document.readyState === 'complete') {
    loadScript();
    return;
  }

  window.addEventListener('load', loadScript, { once: true });
};
