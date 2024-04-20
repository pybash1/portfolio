export const padTime = (i: number) => {
  return `${i < 10 ? "0" : ""}${i}`;
};

export const formatTime = (date: Date) => {
  return `${padTime(date.getHours() % 12 || 12)}:${padTime(
    date.getMinutes()
  )}:${padTime(date.getSeconds())} ${date.getHours() >= 12 ? "PM" : "AM"} IST`;
};
