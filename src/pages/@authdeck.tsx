import { AnimatePresence } from "framer-motion";
import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import Navbar from "~/components/Navbar";
import Topbar from "~/components/Topbar";

interface Props {
  type?: "work" | "project";
}

const Authdeck: NextPage<Props> = ({ type = "work" }: Props) => {
  const [navbar, setNavbar] = useState(false);

  return (
    <>
      <Head>
        <title>my work {type === "work" ? "at" : "on"} authdeck</title>
        <meta
          name="description"
          content={`what i did to improve authdeck and how we managed the tight deadline with exams right around the corner. not enough? click the link and see for yourself.`}
        />
        <link
          rel="icon"
          href="https://cdn.discordapp.com/avatars/626461325744275464/9b8baa867dcbb45519996adb9397d7f4.png?size=4096"
        />
      </Head>
      <main
        className={`relative flex min-h-screen bg-[#faf5f1] font-['Labil_Grotesk'] leading-none text-[#ff0000] selection:bg-[#ff0000] selection:text-[#faf5f1]`}
      >
        <AnimatePresence>{navbar ? <Navbar /> : null}</AnimatePresence>
        <Topbar navbar={navbar} setNavbar={setNavbar} />
        <div className="fixed flex w-1/3 flex-col gap-8 px-8 pt-24 text-9xl">
          <div className="[overflow-wrap:anywhere]">Authdeck</div>
          <div className="flex gap-2 text-xl text-black">
            verify humanity without losing anonimity
            <br />
            {type === "work" ? <>2022 &mdash; 2023</> : null}
          </div>
          <div className="text-center text-[20rem]">
            {type === "work" ? 1 : 3}
          </div>
        </div>
        <div className="w-1/3 border-r"></div>
        <div className="mr-24 w-2/3 overflow-hidden border-r pt-24">
          <div className="flex">
            <div className="h-fit px-8 text-6xl text-black [text-orientation:mixed] [writing-mode:vertical-lr]">
              Few Details
            </div>
            <img
              src="/authdeck.png"
              className="w-[87%] flex-shrink object-center"
            />
          </div>
          <div className="p-12 pl-[7.5rem] pr-10 text-xl text-gray-800">
            Authdeck provides a two-way solution to verify your humanity without
            losing your anonimity all while being decentralized. This project
            was also built as a part of buildspace nights and weekends s1.
            <br />
            <br />
            Originally started by Saptarshi, and continued by SoulNinja, we
            received grants from leading companies like Devfolio as well as
            ETHIndia. We demoed at the buildspace demo day with over 50 people
            joining us.
            <br />
            <br />
            My contribution to the project was yet again, the frontend, and
            design. I was responsible for prototyping as well as building out
            the entire frontend and integrating the contracts into it. We were
            on a very tight schedule with my exams right around the corner,
            anyways we were able to demo pretty nicely.
            <br />
            <br />
            Although, now discontinued, it was fun while it lasted and was nice
            to work on this project.
          </div>
        </div>
      </main>
    </>
  );
};

export default Authdeck;
