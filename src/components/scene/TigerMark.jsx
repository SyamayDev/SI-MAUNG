/** The SI-MAUNG tiger mark as inline SVG (stripes can draw themselves in). */
export default function TigerMark({ size = 88, animated = false, className = "" }) {
  return (
    <svg className={`tiger-mark ${animated ? "tiger-mark--animated" : ""} ${className}`} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <circle className="tiger-mark__halo" cx="60" cy="62" r="56" />
      <path className="tiger-mark__ear" d="M24 38c-6-14 4-26 18-20l6 10z" />
      <path className="tiger-mark__ear" d="M96 38c6-14-4-26-18-20l-6 10z" />
      <path className="tiger-mark__ear-in" d="M28 34c-2-8 4-13 11-10l3 6z" />
      <path className="tiger-mark__ear-in" d="M92 34c2-8-4-13-11-10l-3 6z" />
      <path className="tiger-mark__head" d="M60 22c26 0 42 17 42 38 0 6-1 11-4 16l8 4-10 2 6 6-11-1c-8 9-19 14-31 14s-23-5-31-14l-11 1 6-6-10-2 8-4c-3-5-4-10-4-16 0-21 16-38 42-38z" />
      <path className="tiger-mark__mask" d="M60 64c-6-10-26-14-30 2-3 13 9 28 30 28s33-15 30-28c-4-16-24-12-30-2z" />
      <ellipse className="tiger-mark__eye-bg" cx="44" cy="58" rx="11" ry="12" />
      <ellipse className="tiger-mark__eye-bg" cx="76" cy="58" rx="11" ry="12" />
      <circle className="tiger-mark__eye" cx="45" cy="59" r="7.5" />
      <circle className="tiger-mark__eye" cx="75" cy="59" r="7.5" />
      <circle className="tiger-mark__glint" cx="42.5" cy="56" r="2.6" />
      <circle className="tiger-mark__glint" cx="72.5" cy="56" r="2.6" />
      <path className="tiger-mark__nose" d="M53 70h14c1 0 2 1 1 2l-6 6c-1 1-3 1-4 0l-6-6c-1-1 0-2 1-2z" />
      <path className="tiger-mark__smile" d="M50 82c4 5 16 5 20 0" />
      <g className="tiger-mark__stripes">
        <path pathLength="1" d="M60 25v16" />
        <path pathLength="1" d="M49 28l3 12" />
        <path pathLength="1" d="M71 28l-3 12" />
        <path pathLength="1" d="M21 58l10 2" />
        <path pathLength="1" d="M99 58l-10 2" />
        <path pathLength="1" d="M23 70l9 1" />
        <path pathLength="1" d="M97 70l-9 1" />
      </g>
    </svg>
  );
}
