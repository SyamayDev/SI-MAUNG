/** URL of a file in /public, respecting the deployment base path (e.g. /SI-MAUNG/). */
export function asset(path) {
  return `${import.meta.env.BASE_URL}${String(path).replace(/^\//, "")}`;
}
