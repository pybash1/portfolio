import type { Lanyard } from "./types";

const getLanyardData = async () => {
  const lanyard: Lanyard = await (
    await fetch("https://api.lanyard.rest/v1/users/626461325744275464")
  ).json();

  return lanyard?.data;
};

export const getSong = async () => {
  const data = await getLanyardData();

  return data?.spotify?.song;
};

export const getArtist = async () => {
  const data = await getLanyardData();

  return data?.spotify?.album;
};

export const getSongImage = async () => {
  const data = await getLanyardData();

  return data?.spotify?.album_art_url;
};

export const getSongUrl = async () => {
  const data = await getLanyardData();

  return `https://open.spotify.com/track/${data?.spotify?.track_id}`;
};
