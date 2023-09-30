import { AnimatePresence } from "framer-motion";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Navbar from "~/components/Navbar";
import Topbar from "~/components/Topbar";

const Solo: NextPage = () => {
  const [navbar, setNavbar] = useState(false);

  return (
    <>
      <Head>
        <title>my work on solo</title>
        <meta
          name="description"
          content={`why we built solo and more. not enough? click the link and see for yourself.`}
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
          <Link
            href="https://solo.pybash.xyz"
            className="[overflow-wrap:anywhere]"
          >
            Solo
          </Link>
          <div className="flex gap-2 text-xl text-black">
            limited edition music marketplace
          </div>
          <div className="text-center text-[20rem]">2</div>
        </div>
        <div className="w-1/3 border-r"></div>
        <div className="mr-24 w-2/3 overflow-hidden border-r pt-24">
          <div className="flex">
            <div className="h-fit px-8 text-6xl text-black [text-orientation:mixed] [writing-mode:vertical-lr]">
              Few Details
            </div>
            <img
              src="/solo.png"
              className="w-[87%] flex-shrink object-center"
            />
          </div>
          <div className="p-12 pl-[7.5rem] pr-10 text-xl text-gray-800">
            Together with @soulninja and @SpongeBoi, we built Solo as a
            decentralised marketplace for music. The platform allowed die-hard
            fans to collect songs from their favorite artists for a limited time
            before they were released. And, also the pre releases were signed by
            none other than the artists themselves.
            <br />
            <br />
            We built this project as a part of buildspace nights and weekends
            s2. It runs on the polygon blockchain and allows users to purchase
            music using tokens such as ETH, MATIC, and more.
            <br />
            <br />
            Each song is provided to the collectors as a NFT. We have no plans
            to move this project forward, this was a mere side project to hone
            our skills at frontend, crypto, and more.
          </div>
        </div>
      </main>
    </>
  );
};

export default Solo;