// Custom SVG Dog Icon Component
export const DogIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 2.29-1.34 2.16-3.89 2.16-3.89" />
      <path d="M14 5.172C14 3.782 15.577 2.679 17.5 3c2.823.47 4.113 6.006 4 7 .08.703-1.725 1.722-3.656 1-2.29-1.34-2.16-3.89-2.16-3.89" />
      <path d="M8.5 12.5a1.5 1.5 0 0 0-3 0" />
      <path d="M15.5 12.5a1.5 1.5 0 0 0-3 0" />
      <path d="M12 18s-2.5-3-2.5-5 1.12-3.5 2.5-3.5 2.5 1.5 2.5 5-2.5 5-2.5 5" />
      <path d="M12 18v2" />
    </svg>
  );
