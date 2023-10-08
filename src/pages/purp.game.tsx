import { AnimatePresence } from "framer-motion";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Navbar from "~/components/Navbar";
import Topbar from "~/components/Topbar";

const PurpGame: NextPage = () => {
  const [navbar, setNavbar] = useState(false);

  return (
    <>
      <Head>
        <title>my work on purp.game</title>
        <meta
          name="description"
          content={`how we built purp.game, and what it does. not enough? click the link and see for yourself.`}
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
          <Link href="https://purp.game" className="[overflow-wrap:anywhere]">
            purp.&mdash;game
          </Link>
          <div className="flex gap-2 text-xl text-black">
            p2p creator rewards for farcaster
          </div>
          <div className="text-center text-[20rem]">4</div>
        </div>
        <div className="w-1/3 border-r"></div>
        <div className="mr-24 w-2/3 overflow-hidden border-r pt-24">
          <div className="flex">
            <div className="h-fit px-8 text-6xl text-black [text-orientation:mixed] [writing-mode:vertical-lr]">
              Few Details
            </div>
            <img
              src="/purpgame.png"
              className="w-[90%] flex-shrink object-center"
            />
          </div>
          <div className="p-12 pl-[7.5rem] pr-10 text-xl text-gray-800">
            As of today(8th Oct, 2023), Aadhithyan and myself are still working
            on this.
            <br />
            <br />
            Reward other Farcasters simply by Liking or Recasting posts!
            <br />
            <br />
            Earn rewards yourself for creating engaging posts and keeping the
            community strong as it scales. 1 🟣 = 1 point
            <br />
            <br />
            <h2 className="text-3xl">How it works</h2>
            <br />
            1. Subscribe to get points - All subscription payments are passed
            through to the community minus Stripe/gas fees.
            <br />
            <br />
            2. Give points daily - All your Like/Reposts send points to casters
            automatically. Like an invisible micro tip.
            <br />
            <br />
            3. From 🟣 to 💵 - End of week, points are converted to USDC & sent
            to all recipient wallets. It&apos;s that simple.
            <br />
            <br />
            All users are creators. And they deserve to be rewarded for their
            content that resonates with the community, all ad free.
          </div>
        </div>
      </main>
    </>
  );
};

export default PurpGame;
