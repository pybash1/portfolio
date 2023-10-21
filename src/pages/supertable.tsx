import { AnimatePresence } from "framer-motion";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Navbar from "~/components/Navbar";
import Topbar from "~/components/Topbar";

const Supertable: NextPage = () => {
  const [navbar, setNavbar] = useState(false);

  return (
    <>
      <Head>
        <title>my work on supertable</title>
        <meta
          name="description"
          content={`how we built supertable, and how it could've been better. not enough? click the link and see for yourself.`}
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
          <Link
            href="https://supertable.fun"
            className="[overflow-wrap:anywhere]"
          >
            Supert<span className="hidden lg:block">&mdash;</span>able
          </Link>
          <div className="flex gap-2 text-base text-black lg:text-xl">
            airtable but superior
          </div>
          <div className="hidden text-center text-[20rem] lg:block">1</div>
        </div>
        <div className="hidden w-1/3 border-r lg:block"></div>
        <div className="overflow-hidden border-r lg:mr-24 lg:w-2/3 lg:pt-24">
          <div className="hidden lg:flex">
            <div className="h-fit px-8 text-6xl text-black [text-orientation:mixed] [writing-mode:vertical-lr]">
              Few Details
            </div>
            <img
              src="/superteam.png"
              className="w-[90%] flex-shrink object-center"
            />
          </div>
          <div className="p-12 pr-10 pt-12 text-xl text-gray-800 lg:pl-[7.5rem]">
            Supertable was a project built for{" "}
            <Link href="https://supertable.fun" className="text-[#ff0000]">
              Superteam
            </Link>
            . Our task was to build out a better alternative to the already
            existing{" "}
            <Link href="https://airtable.com" className="text-[#ff0000]">
              Airtable
            </Link>{" "}
            Forms.
            <br />
            <br />
            This included things like a
            <br />
            <br />
            <ul className="list-disc">
              <li>Better Dashboard, and Form Builder</li>
              <li>Themes</li>
              <li>Custom Domains</li>
              <li>Airtable integration(for storing and fetching field data)</li>
              <li>and most importantly,</li>
              <li>A better form design and UI.</li>
            </ul>
            <br />
            This was not an easy task, for the Airtable API is quite limited
            especially when it comes to things like forms they don&apos;t even
            have an official API. Initially, we had decided to use Next Auth,
            however, the limitations of the API and lack of good OAuth2
            documentation, forced us to use an API Key instead.
            <br />
            <br />
            Yes, this degraded UX, but we had no other option.
            <br />
            <br />
            Building out the custom dashboard along with the form builder was
            fairly easy. The drag and drop was a bit complex, but{" "}
            <Link href="htts://read.cv/milan090" className="text-[#ff0000]">
              @milan090
            </Link>
            handled it pretty nicely. I had worked on implementing the themes,
            and settings/dashboard UI.
            <br />
            <br />
            Figuring out custom domains was kind of complex for we had to
            consider many factors, but ultimately we decided on having custom
            domains only for Superteam for the moment.
            <br />
            <br />
            <h2 className="text-2xl">Integrating Airtable and the Hard Bits</h2>
            <br />
            As mentioned earlier, the Airtable API is extremely limited and hard
            to work with. Hence populating Airtable with the form data, and
            furthermore fetching the data from the base/table in Airtable was
            equally complex. But after a lot of debugging, and hitting our heads
            against the wall, we figured it out, and now its live on the
            internet.
          </div>
        </div>
      </main>
    </>
  );
};

export default Supertable;
