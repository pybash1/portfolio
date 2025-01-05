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
