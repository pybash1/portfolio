import { type NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const images = [
  "https://images.unsplash.com/photo-1496753480864-3e588e0269b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2134&q=80",
  "https://images.unsplash.com/photo-1610194352361-4c81a6a8967e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80",
];

const titles = [
  "Exploring the deep oceans of NextJS.",
  "NextJS: The vast ponds.",
];

const subs = [
  "A lot of really useless subtitle and I don't even know what else. But I have to put this here to test long form of text.",
  "But I have to put this here to test long form of text. I just switched the sentence placement, yes. A lot of really useless subtitle and I don't even know what else.",
];

const Blog: NextPage = () => {
  const [image, setImage] = useState(0);

  return (
    <>
      <Head>
        <title>Writings & Thoughts</title>
        <meta
          name="description"
          content="An effort at formal writing. Tried something unique with UI too."
        />
        <link
          rel="icon"
          href="https://cdn.discordapp.com/avatars/626461325744275464/9b8baa867dcbb45519996adb9397d7f4.png?size=4096"
        />
      </Head>
      <div
        className="overfow-hidden h-screen w-screen font-['Labil_Grotesk'] text-white"
        onWheel={() => {
          setImage(image + 1 >= images.length ? 0 : image + 1);
        }}
      >
        <div className="relative z-[0] h-screen w-screen bg-black">
          <AnimatePresence>
            <motion.img
              key={image}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              src={images[image]}
              className="to-animate absolute h-screen w-screen select-none object-cover object-center opacity-60"
              draggable={false}
            />
          </AnimatePresence>
        </div>
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-20 pt-8">
          <div>&larr; Back</div>
          <div className="text-center text-4xl">
            Writings{" "}
            <span className="font-[Palatino] [font-style:italic]">&</span>{" "}
            Thoughts
          </div>
          <div></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 top-0 flex flex-col justify-center gap-8 px-20">
          <div>
            <AnimatePresence>
              <motion.span
                key={image}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="text-3xl"
              >
                {image + 1}
              </motion.span>{" "}
            </AnimatePresence>
            / {images.length}
          </div>
          <div>
            <AnimatePresence>
              <motion.div
                key={image}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="to-animate w-2/3 text-6xl font-semibold"
              >
                {titles[image]}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="relative">
            <AnimatePresence>
              <motion.div
                key={image}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="absolute w-2/3 text-2xl text-gray-300"
              >
                {subs[image]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 flex flex-row gap-4 px-10 py-8">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </div>
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};

export default Blog;
