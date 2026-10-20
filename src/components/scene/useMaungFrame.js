import { useEffect } from "react";
import { setScene } from "../../lib/sceneStore";

/**
 * Portrait mode: tells the 3D world where to draw MAUNG (the element's box,
 * as fractions of the full-screen 3D layer) and which pose to hold. Follows
 * the element through scrolling, resizing and rotation.
 */
export function useMaungFrame(ref, pose = "wave") {
  useEffect(() => {
    setScene({ portraitPose: pose });
  }, [pose]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const host = document.querySelector(".scene-host");
      const h = host ? host.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      if (!h.width || !h.height) return;
      setScene({ frame: { x: (r.left - h.left) / h.width, y: (r.top - h.top) / h.height, w: r.width / h.width, h: r.height / h.height } });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);
}
