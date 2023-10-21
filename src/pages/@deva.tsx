import { AnimatePresence } from "framer-motion";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Navbar from "~/components/Navbar";
import Topbar from "~/components/Topbar";

const DevaMe: NextPage = () => {
  const [navbar, setNavbar] = useState(false);

  return (
    <>
      <Head>
        <title>my work at deva.me</title>
        <meta
          name="description"
          content={`what i do at deva.me not enough? click the link and see for yourself.`}
        />
        <link
          rel="icon"
          href="https://cdn.discordapp.com/avatars/626461325744275464/9b8baa867dcbb45519996adb9397d7f4.png?size=4096"
        />
      </Head>
      <main
        className={`relative flex min-h-screen flex-col bg-[#faf5f1] font-['Labil_Grotesk'] leading-none text-[#ff0000] selection:bg-[#ff0000] selection:text-[#faf5f1] lg:flex-row`}
      >
        <AnimatePresence>{navbar ? <Navbar /> : null}</AnimatePresence>
        <Topbar navbar={navbar} setNavbar={setNavbar} />
        <div className="flex w-full flex-col gap-8 px-8 pt-24 text-5xl lg:fixed lg:w-1/3 lg:text-9xl">
          <Link href="https://deva.me" className="[overflow-wrap:anywhere]">
            Deva<span className="hidden lg:block">&mdash;</span>.me
          </Link>
          <div className="flex gap-2 text-base text-black lg:text-xl">
            multiplayer ai chat with anyone - dead or alive
            <br />
            May 2023 &mdash; Ongoing
          </div>
          <div className="hidden text-center text-[20rem] lg:block">2</div>
        </div>
        <div className="hidden w-1/3 border-r lg:block"></div>
        <div className="overflow-hidden border-r lg:mr-24 lg:w-2/3 lg:pt-24">
          <div className="hidden lg:flex">
            <div className="h-fit px-8 text-6xl text-black [text-orientation:mixed] [writing-mode:vertical-lr]">
              Few Details
            </div>
            <img
              src="/devame.png"
              className="w-[90%] flex-shrink object-center"
            />
          </div>
          <div className="p-12 pr-10 pt-12 text-xl text-gray-800 lg:pl-[7.5rem]">
            I work at Deva.me primarily as a frontend engineer but I do at time
            dabble into the backend codebase. Being one of the early developers,
            I had the opportunity to work on the core web app UI, as well as
            core functionality and UX.
            <br />
            <br />
            I also contributed to the implementation of backends for things such
            as settings, notifications, etc. Also worked on developing new
            feature sets such as profile pages and contributed to the in-app
            notification system.
            <br />
            <br />
            Further, I majorly contributed to develop a robust, and extensible
            multi-level and multi-type autocomplete system, complete with
            paginated results and infinite scroll. Apart from this, also
            contributed to the mention, and hastag highlighting across the
            entire platform.
            <br />
            <br />
            Alongside this, I also worked on the explore page, general UI/UX
            improvements, new landing pages, etc. I am glad to be a part of this
            amazing team and journey, and am excited to see where this takes me.
          </div>
        </div>
      </main>
    </>
  );
};

export default DevaMe;
