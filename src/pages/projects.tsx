import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import Navbar from "~/components/Navbar";
import Topbar from "~/components/Topbar";

const Projects: NextPage = () => {
  const [navbar, setNavbar] = useState(false);

  return (
    <>
      <Head>
        <title>stuff i have made</title>
        <meta
          name="description"
          content={`not exactly a list of the several projects i've worked on and abandoned. you'll have to click the link to see more.`}
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
        <div className="grid w-full divide-x-2 divide-y-2 pt-24 sm:grid-cols-1 md:grid-cols-2 md:divide-y-0 lg:grid-cols-4">
          <Link
            href="/supertable"
            className="group flex flex-col items-center justify-between overflow-hidden px-8 text-8xl text-black transition duration-300 ease-in-out hover:text-[#ff0000]"
            data-type="P"
          >
            <div className="flex flex-col gap-2">
              <div className="uppercase [overflow-wrap:anywhere]">
                Supertable
              </div>
              <div className="text-xl">airtable forms but superior</div>
            </div>
            <div className="text-[22rem] text-[#ff0000] transition duration-300 ease-in-out group-hover:text-black">
              1
            </div>
          </Link>
          <Link
            href="/solo"
            className="group flex flex-col items-center justify-between overflow-hidden px-8 text-8xl text-black transition duration-300 ease-in-out hover:text-[#ff0000]"
            data-type="P"
          >
            <div className="flex flex-col gap-2">
              <div className="uppercase [overflow-wrap:anywhere]">Solo</div>
              <div className="text-xl">limited edition music marketplace</div>
            </div>
            <div className="text-[22rem] text-[#ff0000] transition duration-300 ease-in-out group-hover:text-black">
              2
            </div>
          </Link>
          <Link
            href="/authdeck"
            className="group flex flex-col items-center justify-between overflow-hidden px-8 text-8xl text-black transition duration-300 ease-in-out hover:text-[#ff0000]"
            data-type="P"
          >
            <div className="flex flex-col gap-2">
              <div className="uppercase [overflow-wrap:anywhere]">Authdeck</div>
              <div className="text-xl">
                verify humanity without losing anonimity
              </div>
            </div>
            <div className="text-[22rem] text-[#ff0000] transition duration-300 ease-in-out group-hover:text-black">
              3
            </div>
          </Link>
          <Link
            href="/purp.game"
            className="group flex flex-col items-center justify-between overflow-hidden px-8 text-8xl text-black transition duration-300 ease-in-out hover:text-[#ff0000]"
            data-type="P"
          >
            <div className="flex flex-col gap-2">
              <div className="uppercase [overflow-wrap:anywhere]">
                purp.game
              </div>
              <div className="text-xl">p2p creator rewards for farcaster</div>
            </div>
            <div className="text-[22rem] text-[#ff0000] transition duration-300 ease-in-out group-hover:text-black">
              4
            </div>
          </Link>
        </div>
      </main>
    </>
  );
};

export default Projects;
