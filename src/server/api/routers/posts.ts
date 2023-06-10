import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

interface StreamsPlaceJSON {
  timestamp: string;
  html: string;
  text: string;
  last_edit: number;
  media: { [key: string]: string }[];
}

export const postsRouter = createTRPCRouter({
  getPosts: publicProcedure
    .query(async ({}) => {
      const res = await fetch("https://streams.place/pybash/json");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const posts: StreamsPlaceJSON[] = await res.json();

      return posts;
    }),
});
