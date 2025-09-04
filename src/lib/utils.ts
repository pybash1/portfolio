export interface Project {
  name: string;
  description: string;
  status: string;
  link?: `https://${string}`;
}

export const projects: Project[] = [
  // Live/Active Projects
  // @ts-expect-error -- exceptional case
  { name: "portfolio", description: "this site", status: "live", link: "/" },
  {
    name: "harvence-web",
    description: "website for harvence",
    status: "shipped & live",
    link: "https://harvence.pybash.xyz",
  },
  {
    name: "journal",
    description: "my blog / place where i write",
    status: "shipped & live",
    link: "https://journal.pybash.xyz",
  },
  {
    name: "dripcraft",
    description: "crypto nft marketplace kinda",
    status: "shipped & live",
    link: "https://dripcraft.xyz",
  },

  // Ongoing Projects
  {
    name: "board",
    description: "cross platform simple clipboard sync",
    status: "ongoing",
  },
  {
    name: "halo",
    description: "an app to keep you safe",
    status: "ongoing",
    link: "https://halo.pybash.xyz",
  },
  {
    name: "halo-waitlist",
    description: "waitlist site for halo",
    status: "ongoing",
    link: "https://halo.pybash.xyz",
  },
  {
    name: "halo-web",
    description: "website for halo",
    status: "ongoing",
    link: "https://halo.pybash.xyz",
  },
  {
    name: "puppetmaster",
    description: "something we're working on",
    status: "ongoing",
    link: "https://grasslabs.dev",
  },
  {
    name: "bin",
    description: "the simplest pastebin ever",
    status: "forked & ongoing",
    link: "https://bin.grasslabs.dev",
  },
  {
    name: "harvence",
    description:
      "an app that shows you human-readable nutrition info for any food item barcode you scan",
    status: "shipped & ongoing",
    link: "https://harvence.pybash.xyz",
  },

  // Shipped Projects
  {
    name: "quokka",
    description: "a static site for a hack club ysws",
    status: "shipped",
    link: "https://quokka-corner.vercel.app",
  },
  {
    name: "ritankar planner",
    description: "a study planner / to do list for my friend",
    status: "shipped",
  },
  {
    name: "supertable",
    description: "better forms ui built on top of airtable",
    status: "shipped",
  },
  {
    name: "today",
    description: "a weird kinda type of new to do list",
    status: "shipped & oss",
    link: "https://github.com/pybash1/today",
  },
  {
    name: "winnf",
    description: "nerdfetch but for windows only",
    status: "shipped & oss",
    link: "https://github.com/pybash1/winnf",
  },

  // Dead/Shipped but Dead Projects
  {
    name: "frontend lead @ authdeck",
    description: "built the frontend for authdeck",
    status: "shipped & dead",
  },
  {
    name: "frontend lead @ solo",
    description: "build the frontend for solo",
    status: "shipped & dead",
  },
  {
    name: "purp.game",
    description: "a leaderboard for a crypto based social media",
    status: "shipped & dead",
  },
  {
    name: "homecenter",
    description: "a homepage for my homelab",
    status: "dead",
  },
  {
    name: "rift",
    description: "a crypto-first marketplace for the creator economy",
    status: "dead",
  },

  // Paused Projects
  {
    name: "merin",
    description: "better email with ai",
    status: "paused",
    link: "https://merin.ai",
  },
  {
    name: "merin-sync",
    description: "syncing software for merin and gmail",
    status: "paused",
  },
  { name: "merin-web", description: "merin's web ui", status: "paused" },

  // Successful Experiments
  {
    name: "brobot",
    description: "telegram based llm bot that spoke like gen z",
    status: "experiment successful",
  },
  {
    name: "xirl",
    description:
      "a cctv you can monitor from anywhere in the world, from any network using just an esp32-cam module",
    status: "experiment successful",
  },

  // Advised/Consulted
  {
    name: "advisor @ wildcraft",
    description: "helped migrate from react pwa to nextjs pwa",
    status: "advised",
  },

  // Moved/Merged Projects
  {
    name: "diet-better",
    description: "renamed to harvence",
    status: "moved",
    link: "https://echo.pybash.xyz",
  },
  {
    name: "echo",
    description: "renamed to board",
    status: "moved",
    link: "https://echo.pybash.xyz",
  },
  {
    name: "parchments",
    description: "renamed and updated to journal",
    status: "moved",
    link: "https://parchments.pybash.xyz",
  },
  {
    name: "echo-proxy",
    description: "merged with board",
    status: "merged",
    link: "https://echo.pybash.xyz",
  },
  {
    name: "echo-web",
    description: "will be renamed to board-web",
    status: "to be moved",
    link: "https://echo.pybash.xyz",
  },

  // Abandoned Projects
  { name: "bullish", description: "demo stocks app", status: "abandoned" },
  {
    name: "grass-labs",
    description:
      "tried to build a website for grass labs but it turned out a weed marketplace design instead",
    status: "abandoned",
    link: "https://grasslabs.dev",
  },

  // Didn't Finish
  {
    name: "arctic",
    description: "an unofficial api for the arc browser on mac and windows",
    status: "didn't finish",
  },
  {
    name: "beautiful.engineering",
    description: "curated.design but for engineering",
    status: "didn't finish",
  },
  {
    name: "life",
    description: "an attempt at a life tracker kinda portfolio site",
    status: "didn't finish",
  },
  { name: "life-tracker", description: "attempt v2", status: "didn't finish" },
  {
    name: "pgit",
    description: "prettier git - yea that's it",
    status: "didn't finish",
  },
  {
    name: "wrds",
    description:
      "a search engine but for high quality written content only - still thiink its a super cool idea",
    status: "didn't finish",
  },

  // Didn't Start
  {
    name: "ltrbx",
    description: "a better movie/tv show tracking platform",
    status: "didn't start",
  },
  {
    name: "mindful",
    description: "i forgot what i wanted to do with this",
    status: "didn't start",
  },
  {
    name: "news",
    description: "an attempt at a news site for my school",
    status: "didn't start",
  },
  {
    name: "passport",
    description:
      "wanted to build a single global oauth platform inspired by the flighty passport",
    status: "didn't start",
  },
  {
    name: "timelapse",
    description: "wanted to build an ios highlight reel app for android",
    status: "didn't start",
  },

  // Unknown Status
  {
    name: "volunteer @ classify",
    description: "wanted to speed up the development of their web app",
    status: "unknown",
  },
  {
    name: "frontend engineer @ 10planet",
    description: "an ai x crypto mixture startup",
    status: "unknown",
  },
];
