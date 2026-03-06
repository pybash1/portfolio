export interface Project {
  name: string;
  description: string;
  status: string;
  link?: `https://${string}`;
}

export const projects: Project[] = [
  // --- active ---
  // @ts-expect-error -- exceptional case
  { name: "Portfolio", description: "This site", status: "active", link: "/" },
  { name: "Journal", description: "My blog / The place where I write.", status: "active", link: "https://journal.pybash.xyz" },
  { name: "Harvence", description: "An app that shows you human-readable nutrition info for any food item barcode you scan.", status: "active" },
  { name: "Harvence Website", description: "Website for harvence", status: "active", link: "https://harvence.pybash.xyz" },
  { name: "Halo", description: "An SOS app for providing help to people in distress by utilising crowdsourcing", status: "active" },
  { name: "Halo Waitlist", description: "Waitlist site for Halo", status: "active", link: "https://halo.pybash.xyz" },
  { name: "Board", description: "Cross platform clipboard syncing app", status: "active", link: "https://board.pybash.xyz" },
  { name: "bin", description: "The simplest pastebin ever", status: "active", link: "https://board-api.pybash.xyz" },
  
  // --- shipped ---
  { name: "Dripcraft", description: "Crypto NFT marketplace", status: "shipped", link: "https://dripcraft.xyz" },
  { name: "Rift", description: "A crypto-first marketplace for the creator economy", status: "shipped" },
  { name: "purp.game", description: "A leaderboard for a crypto based social media", status: "shipped" },
  { name: "Today", description: "A weird kinda type of new to do list", status: "shipped", link: "https://github.com/pybash1/today" },
  { name: "winnf", description: "nerdfetch but for windows only", status: "shipped", link: "https://github.com/pybash1/winnf" },
  { name: "Quokka Corner", description: "A static site for a hack club YSWS", status: "shipped", link: "https://quokka-corner.vercel.app" },
  { name: "Supertable", description: "Better forms UI built on top of Airtable", status: "shipped" },
  { name: "Ritankar Planner", description: "A study planner / to do list for my friend", status: "shipped" },
  { name: "XIRL-Cam", description: "A CCTV you can monitor from anywhere in the world, from any network using just an ESP32Cam module", status: "shipped" },
  { name: "BroBot", description: "Telegram based LLM bot that speaks like Gen Z", status: "shipped" },
  
  // --- roles ---
  { name: "Frontend Engineer @ 10Planet", description: "An AI x crypto mixture startup", status: "roles" },
  { name: "Frontend Lead @ Authdeck", description: "Built the frontend for Authdeck", status: "roles" },
  { name: "Frontend Lead @ Solo", description: "Built the frontend for Solo", status: "roles" },
  { name: "Advisor @ Wildcraft", description: "Helped migrate from React PWA to NextJS PWA", status: "roles" },
  { name: "Volunteer @ Classify", description: "Wanted to speed up the development of their web app", status: "roles" },
  
  // --- abandoned ---
  { name: "Puppetmaster", description: "Something we were working on", status: "abandoned" },
  { name: "Grass Labs", description: "Tried to build a website for Grass Labs but it turned out a weed marketplace design instead", status: "abandoned", link: "https://grasslabs.dev" },
  { name: "Merin", description: "Better email with AI", status: "abandoned", link: "https://merin.ai" },
  { name: "Merin Web", description: "Merin's web UI", status: "abandoned" },
  { name: "Merin Sync", description: "Syncing software for Merin and Gmail", status: "abandoned" },
  { name: "Homecenter", description: "A homepage for my homelab", status: "abandoned" },
  { name: "wrds", description: "A search engine but for high quality written content only - still think its a super cool idea", status: "abandoned" },
  { name: "beautiful.engineering", description: "curated.design but for engineering", status: "abandoned" },
  { name: "ltrbx", description: "A better movie/TV show tracking platform", status: "abandoned" },
  { name: "Passport", description: "Wanted to build a single global OAuth platform inspired by the flighty passport", status: "abandoned" },
  { name: "Timelapse", description: "Wanted to build an ios highlight reel app for android", status: "abandoned" },
  { name: "Life", description: "An attempt at a life tracker kinda portfolio site", status: "abandoned" },
  { name: "Life Tracker", description: "Attempt v2", status: "abandoned" },
  { name: "Arctic", description: "An unofficial API for the Arc browser on macOS and windows", status: "abandoned" },
  { name: "pgit", description: "Prettier git - that's it", status: "abandoned" },
  { name: "Mindful", description: "I forgot what I wanted to do with this", status: "abandoned" },
  { name: "news", description: "An attempt at a news site for my school", status: "abandoned" },
  { name: "Bullish", description: "Demo stocks app", status: "abandoned" },
];
