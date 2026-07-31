import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

function base(props: IconProps): IconProps {
  return {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props,
  };
}

export const IconHome = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
);

export const IconBuilding = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="12" height="18" rx="1.5" />
    <path d="M16 9h4v12h-4" />
    <path d="M8 7h2M8 11h2M8 15h2M12 7h1M12 11h1M12 15h1" />
    <path d="M9 21v-3h3v3" />
  </svg>
);

export const IconKey = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12 20 3M16 7l3 3M13.5 9.5l2 2" />
  </svg>
);

export const IconCard = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h4" />
  </svg>
);

export const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3Z" />
    <path d="M9.5 12l2 2 3.5-4" />
  </svg>
);

export const IconBell = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

export const IconUsers = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <path d="M16 5.5a3 3 0 0 1 0 5.5M18 15.5c1.7.8 2.5 2.3 2.5 4" />
  </svg>
);

export const IconUser = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M5 20c0-3.5 3.5-6 7-6s7 2.5 7 6" />
  </svg>
);

export const IconScroll = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);
