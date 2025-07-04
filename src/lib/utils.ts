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
  merin: {
    role: "Intern",
    year: "2025",
    description: "",
  },
  deva: {
    role: "Frontend Engineer",
    year: "2025",
    description: "",
  },
  harvence: {
    role: "Creator",
    year: "2024",
    description: "",
  },
  dripcraft: {
    role: "Frontend Engineer",
    year: "2024",
    description: "",
  },
  rift: {
    role: "Founding Engineer",
    year: "2024",
    description: "",
  },
  purp: {
    role: "Frontend Engineer",
    year: "2024",
    description: "",
  },
  today: {
    role: "Creator",
    year: "2024",
    description: "",
  },
  solo: {
    role: "Developer",
    year: "2024",
    description: "",
  },
  authdeck: {
    role: "Frontend Engineer",
    year: "2024",
    description: "",
  },
  supertable: {
    role: "Frontend Engineer",
    year: "2024",
    description: "",
  },
  wildcraft: {
    role: "Advisor",
    year: "2024",
    description: "",
  },
  classify: {
    role: "Intern",
    year: "2024",
    description: "",
  },
};
