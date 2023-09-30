import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import Navbar from "~/components/Navbar";
import Topbar from "~/components/Topbar";

const Work: NextPage = () => {
  const [navbar, setNavbar] = useState(false);

  return (
    <>
      <Head>
        <title>places i have worked at</title>
        <meta
          name="description"
          content={`i've had the opportunity of working at several amazing places. here's not exactly a list of them. you'll have to click the link to see more.`}
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
        <div className="grid w-full grid-cols-2 divide-x-2 pt-24">
          <Link
            href="/@authdeck"
            className="group flex flex-col items-center justify-between overflow-hidden px-8 text-8xl text-black transition duration-300 ease-in-out hover:text-[#ff0000]"
          >
            <div className="flex flex-col gap-2">
              <div className="uppercase [overflow-wrap:anywhere]">Authdeck</div>
              <div className="text-xl">
                verifying your humanity without losing your anonimity
              </div>
            </div>
            <div className="text-[22rem] text-[#ff0000] transition duration-300 ease-in-out group-hover:text-black">
              1
            </div>
          </Link>
          <Link
            href="/@deva"
            className="group flex flex-col items-center justify-between overflow-hidden px-8 text-8xl text-black transition duration-300 ease-in-out hover:text-[#ff0000]"
          >
            <div className="flex flex-col gap-2">
              <div className="uppercase [overflow-wrap:anywhere]">Deva.me</div>
              <div className="text-xl">
                multiplayer ai chat with anyone - dead or alive
              </div>
            </div>
            <div className="text-[22rem] text-[#ff0000] transition duration-300 ease-in-out group-hover:text-black">
              2
            </div>
          </Link>
        </div>
      </main>
    </>
  );
};

export default Work;
