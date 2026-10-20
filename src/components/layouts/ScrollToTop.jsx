import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/** New pages start at the top; browser back/forward keeps the browser's restored position. */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (navType !== "POP") window.scrollTo(0, 0);
  }, [pathname, navType]);
  return null;
}
