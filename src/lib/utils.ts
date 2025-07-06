import type { Lanyard, OkuResult } from "./types";

const getLanyardData = async () => {
  const lanyard: Lanyard = await (
    await fetch("https://api.lanyard.rest/v1/users/626461325744275464")
  ).json();

  return lanyard?.data;
};

const getOkuReadData = async () => {
  const oku: OkuResult = await (
    await fetch("https://oku.club/api/collections/user/pybash/read")
  ).json();

  return oku;
};

const getOkuReadingData = async () => {
  const oku: OkuResult = await (
    await fetch("https://oku.club/api/collections/user/pybash/reading")
  ).json();

  return oku;
};

export const getReadBooks = async () => {
  return (await getOkuReadData()).books;
};

export const getReadingBooks = async () => {
  return (await getOkuReadingData()).books;
};

export const getSong = async () => {
  const data = await getLanyardData();

  return data?.spotify?.song;
};

export const getArtist = async () => {
  const data = await getLanyardData();

  return data?.spotify?.artist;
};

export const getSongImage = async () => {
  const data = await getLanyardData();

  return data?.spotify?.album_art_url;
};

export const getSongUrl = async () => {
  const data = await getLanyardData();

  return `https://open.spotify.com/track/${data?.spotify?.track_id}`;
};

const toRoman = (num: number): string => {
  const romanNumerals = [
    { value: 1000, numeral: "M" },
    { value: 900, numeral: "CM" },
    { value: 500, numeral: "D" },
    { value: 400, numeral: "CD" },
    { value: 100, numeral: "C" },
    { value: 90, numeral: "XC" },
    { value: 50, numeral: "L" },
    { value: 40, numeral: "XL" },
    { value: 10, numeral: "X" },
    { value: 9, numeral: "IX" },
    { value: 5, numeral: "V" },
    { value: 4, numeral: "IV" },
    { value: 1, numeral: "I" },
  ];

  let result = "";
  let remaining = num;

  for (const { value, numeral } of romanNumerals) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }

  return result;
};

export const getCurrentCommitCount = async () => {
  const gh: any[] = await (
    await fetch("https://api.github.com/repos/pybash1/portfolio/commits")
  ).json();

  return toRoman(gh.length - 1);
};

export const ITEMS = {
  mail: {
    role: "Email",
    year: "0000",
    description: "",
  },
  twitter: {
    role: "Tweets",
    year: "0000",
    description: "",
  },
  github: {
    role: "Code",
    year: "0000",
    description: "",
  },
  discord: {
    role: "Discord",
    year: "0000",
    description: "",
  },
  merin: {
    role: "Intern",
    year: "2025",
    description:
      "Building the future of email. An email client that is AI first not AI bolted on. Sign up to the waitlist for more updates - we will be shipping MVP soon.",
  },
  deva: {
    role: "Frontend Engineer",
    year: "2023 - 24",
    description:
      "Worked as a frontend engineer on several core parts on the codebase including profiles, notifications, and more. Worked on building and improving the core web experience and implemented key functionality such as autocomplete systems, onboarding flows, etc. Learnt how to work in fast moving agile teams while being completely async.",
  },
  harvence: {
    role: "Creator",
    year: "2025",
    description:
      "Explored an app concept to help people with dietary concerns - scan any item, get accurate results. Decide what suits you best in an instant with over a million food items using a public community based API. Originally built to gain experience with React Native.",
  },
  dripcraft: {
    role: "Frontend Engineer",
    year: "2024",
    description:
      "Built an entire Solana based NFT transaction site with Administrative access built in from the ground up. With a unique take on the UI, dripcraft is a platform for burning or holding your common NFTs to earn rarer ones in return.",
  },
  rift: {
    role: "Founding Engineer",
    year: "2024",
    description:
      "A decentralized marketplace for creators and the growing creator economy. I worked as one of the lead engineers in building a majority of the frontend and some of the backend, along with Milind. Originally built for the Solana Colloseum hackathon.",
  },
  purp: {
    role: "Frontend Engineer",
    year: "2023",
    description:
      "A social rewards system for audiences and followers based on interactivity and user activity. Creators also get rewarded based on growth, etc. I led the development of the PWA-first social leaderboard system.",
  },
  today: {
    role: "Creator",
    year: "2023",
    description:
      "The simplest todo list you can find on the internet. An experimental exploration on productivity - a todo list where you only see whats there to be done today and what you forgot from yesterday, and forget the rest - be in the present. Self-hosted and open source.",
  },
  solo: {
    role: "Developer",
    year: "2023",
    description:
      "A decentralized marketplace for signed limited edition pre releases of songs directly from the artists. A led the development of the frontend interface. The project was part of Nights & Weekends Season 2.",
  },
  authdeck: {
    role: "Frontend Engineer",
    year: "2022 - 23",
    description:
      "Led the development of the Authdeck frontend interface during Nights and Weekends Season 1 and demoed to over 50 people including Farza himself. The project also received grants from EthIndia, Supertable, and others.",
  },
  supertable: {
    role: "Engineer",
    year: "2023",
    description: "A project for supertable where we integrated the Airtable API for beautiful forms which stored their data and responses directly inside of Airtable using their versatile API",
  },
  wildcard: {
    role: "Advisor",
    year: "2024",
    description:
      "Helped and advised the team on how to easily migrate their PWA from an React-based codebase to a more moderna and sophisiticated NextJS codebase with minimal breaks and downtimes.",
  },
  classify: {
    role: "Intern",
    year: "2023",
    description:
      "Worked as an intern on the Classify web app using Flutter to speed up the development of one of my favorite and most useful apps.",
  },
};
