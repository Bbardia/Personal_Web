import { useId, type SVGProps } from 'react'

interface SagaCrestProps extends Omit<SVGProps<SVGSVGElement>, 'aria-label'> {
  /** Omit when nearby text already names the Saga; the crest is then decorative. */
  label?: string
}

/**
 * Lightweight Saga mark for non-WebGL surfaces.
 * The shield carries a B monogram beside a small pose-joint constellation.
 */
export default function SagaCrest({ label, ...props }: SagaCrestProps) {
  const titleId = useId()

  return (
    <svg
      {...props}
      viewBox="0 0 96 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={label ? 'img' : undefined}
      aria-labelledby={label ? titleId : undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {label && <title id={titleId}>{label}</title>}

      <path
        d="M48 4 86 18v34c0 25-14.8 43.6-38 56C24.8 95.6 10 77 10 52V18L48 4Z"
        fill="currentColor"
        fillOpacity=".07"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M48 11 79 22.4v29.2c0 20.6-11.6 36.4-31 47.7-19.4-11.3-31-27.1-31-47.7V22.4L48 11Z"
        stroke="currentColor"
        strokeOpacity=".45"
        strokeWidth="1.5"
      />

      <path
        d="M27 29v53m0-51h13.5c10.5 0 12.7 14.8 1.1 17.2H27m14.6 0C55 50.2 54.7 69 41 72H27"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <g
        stroke="var(--saga-crest-accent, #ff8c3a)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m66 39-8 10m8-10 9 10M58 49l-5 12m22-12 5 12M66 39v25m-8 4 8-4 8 4M58 68l-2 15m18-15 2 15M56 83l-5 10m25-10 5 10" />
        <circle cx="66" cy="31" r="5" fill="var(--saga-crest-accent, #ff8c3a)" />
        <circle cx="66" cy="39" r="2.4" fill="currentColor" />
        <circle cx="58" cy="49" r="2.4" fill="currentColor" />
        <circle cx="75" cy="49" r="2.4" fill="currentColor" />
        <circle cx="53" cy="61" r="2.4" fill="currentColor" />
        <circle cx="80" cy="61" r="2.4" fill="currentColor" />
        <circle cx="66" cy="64" r="2.4" fill="currentColor" />
        <circle cx="58" cy="68" r="2.4" fill="currentColor" />
        <circle cx="74" cy="68" r="2.4" fill="currentColor" />
        <circle cx="56" cy="83" r="2.4" fill="currentColor" />
        <circle cx="76" cy="83" r="2.4" fill="currentColor" />
        <circle cx="51" cy="93" r="2.4" fill="currentColor" />
        <circle cx="81" cy="93" r="2.4" fill="currentColor" />
      </g>
    </svg>
  )
}
