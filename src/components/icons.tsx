import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 48 48"
      fill="none"
      {...props}
    >
      <path
        d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z"
        fill="currentColor"
      ></path>
    </svg>
  );
}
