/**
 * Runs heavy, decorative work (the 3D stage) only once the page has settled:
 * on the visitor's first interaction (scroll, touch, pointer, key), or
 * `delay` ms after the load event when the browser is idle. The text, forms
 * and buttons are never kept waiting for three.js, and a first tap is never
 * blocked by it. Once the visitor has interacted, later calls run at once.
 */
const EVENTS = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel", "scroll"];
const OPTS = { passive: true, capture: true };

let engaged = false;
const waiting = new Set();

function markEngaged() {
  if (engaged) return;
  engaged = true;
  EVENTS.forEach((e) => window.removeEventListener(e, markEngaged, OPTS));
  for (const run of [...waiting]) run();
}

if (typeof window !== "undefined") EVENTS.forEach((e) => window.addEventListener(e, markEngaged, OPTS));

/** @returns {() => void} cancel */
export function whenEngaged(task, { delay = 2500 } = {}) {
  let done = false;
  let timer = 0;
  let idle = 0;
  const cleanup = () => {
    waiting.delete(run);
    window.removeEventListener("load", onLoad);
    clearTimeout(timer);
    if (idle && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
  };
  function run() {
    if (done) return;
    done = true;
    cleanup();
    task();
  }
  function onLoad() {
    timer = setTimeout(() => {
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(run, { timeout: 1500 });
      else run();
    }, delay);
  }

  if (engaged) {
    // already interacted (e.g. navigated here by a tap): no reason to wait
    timer = setTimeout(run, 0);
    return () => {
      done = true;
      cleanup();
    };
  }
  waiting.add(run);
  if (document.readyState === "complete") onLoad();
  else window.addEventListener("load", onLoad, { once: true });
  return () => {
    done = true;
    cleanup();
  };
}
