export interface AppPageBackgroundConfig {
  src: string;
  opacity?: number;
  blur?: string;
  overlayColor?: string;
  overlayOpacity?: number;
}

interface RouteBackgroundEntry {
  route: string;
  match: "exact" | "prefix";
  background: AppPageBackgroundConfig;
}

const routeBackgrounds: RouteBackgroundEntry[] = [
  {
    route: "/",
    match: "exact",
    background: {
      src: "/bgt2.jpg",
      opacity: 1,
      blur: "0px",
      overlayColor: "black",
      overlayOpacity: 0,
    },
  },
  {
    route: "/login",
    match: "exact",
    background: {
      src: "/account_bg.jpg",
      opacity: 0.85,
      blur: "0px",
      overlayColor: "black",
      overlayOpacity: 0,
    },
  },
  {
    route: "/signup",
    match: "exact",
    background: {
      src: "/account_bg.jpg",
      opacity: 0.85,
      blur: "0px",
      overlayColor: "black",
      overlayOpacity: 0,
    },
  },
  {
    route: "/dashboard",
    match: "prefix",
    background: {
      src: "/account_bg.jpg",
      opacity: 0.45,
      blur: "0px",
      overlayColor: "black",
      overlayOpacity: 0,
    },
  },
  {
    route: "/account",
    match: "prefix",
    background: {
      src: "/account_bg.jpg",
      opacity: 0.45,
      blur: "0px",
      overlayColor: "black",
      overlayOpacity: 0,
    },
  },
  {
    route: "/history",
    match: "prefix",
    background: {
      src: "/history_bg.jpg",
      opacity: 0.4,
      blur: "0px",
      overlayColor: "black",
      overlayOpacity: 0,
    },
  },
  {
    route: "/profile",
    match: "prefix",
    background: {
      src: "/profile_bg.jpg",
      opacity: 0.35,
      blur: "0px",
      overlayColor: "black",
      overlayOpacity: 0,
    },
  },
  {
    route: "/wiki",
    match: "prefix",
    background: {
      src: "/wiki_bg.jpg",
      opacity: 0.38,
      blur: "0px",
      overlayColor: "",
      overlayOpacity: 0,
    },
  },
  {
    route: "/test",
    match: "prefix",
    background: {
      src: "/test_bg.jpg",
      opacity: 0.3,
      blur: "0px",
      overlayColor: "black",
      overlayOpacity: 0,
    },
  },
  {
    route: "/learn",
    match: "prefix",
    background: {
      src: "/learn_bg.jpg",
      opacity: 0.34,
      blur: "0px",
      overlayColor: "black",
      overlayOpacity: 0,
    },
  },
  {
    route: "/list",
    match: "prefix",
    background: {
      src: "/learn_bg.jpg",
      opacity: 0.34,
      blur: "0px",
      overlayColor: "black",
      overlayOpacity: 0,
    },
  },
];

export function getPageBackground(pathname: string): AppPageBackgroundConfig | null {
  if (!pathname) {
    return null;
  }

  const exactMatch = routeBackgrounds.find(
    (entry) => entry.match === "exact" && entry.route === pathname,
  );

  if (exactMatch) {
    return exactMatch.background;
  }

  const prefixMatches = routeBackgrounds
    .filter((entry) => entry.match === "prefix" && pathname.startsWith(entry.route))
    .sort((a, b) => b.route.length - a.route.length);

  return prefixMatches[0]?.background ?? null;
}
