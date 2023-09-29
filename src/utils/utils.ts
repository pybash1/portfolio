export const chooseRandom = (arr: (string | number)[]) => {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex] as string | number;
};

export const pronounciations = {
  maverick: "/ˈmav(ə)rɪk/",
  artisan: "/ˌɑːtɪˈzan/",
  innovator: "/ˈɪnəveɪtə/",
  craftsman: "/ˈkrɑːf(t)smən/",
};
