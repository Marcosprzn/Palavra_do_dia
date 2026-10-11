import React from 'react';

/**
 * Custom vector SVG Church Cross icon with traditional Latin cross proportions.
 * Prevents iOS and Android from rendering system emoji glyphs.
 */
export function ChurchCross({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.75 2C10.75 1.30964 11.3096 0.75 12 0.75C12.6904 0.75 13.25 1.30964 13.25 2V6.75H18C18.6904 6.75 19.25 7.30964 19.25 8C19.25 8.69036 18.6904 9.25 18 9.25H13.25V22C13.25 22.6904 12.6904 23.25 12 23.25C11.3096 23.25 10.75 22.6904 10.75 22V9.25H6C5.30964 9.25 4.75 8.69036 4.75 8C4.75 7.30964 5.30964 6.75 6 6.75H10.75V2Z"
      />
    </svg>
  );
}

export default ChurchCross;
