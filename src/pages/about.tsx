import { AnimatePresence } from "framer-motion";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "~/components/Navbar";
import Topbar from "~/components/Topbar";
import type { Lanyard } from "~/types/lanyard";

const About: NextPage = () => {
  const [navbar, setNavbar] = useState(false);
  const [status, setStatus] = useState("offline");

  useEffect(() => {
    void fetch("https://api.lanyard.rest/v1/users/626461325744275464", {
      method: "GET",
    }).then((res) =>
      res.json().then((data: Lanyard) => {
        setStatus(data.data.discord_status);
      })
    );
  }, []);

  return (
    <>
      <Head>
        <title>about pybash</title>
        <meta
          name="description"
          content={`based on a desk in india. frontend developer. working at deva.me. not enough? click the link and see for yourself.`}
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
        <div className="flex w-1/3 flex-col gap-8 border-r px-8 pt-24 text-9xl">
          <div>About &mdash; Me</div>
          <div className="flex gap-2 text-xl text-black">
            <Link href="mailto:hi@pybash.xyz" className="text-[#ff0000]">
              hi@pybash.xyz
            </Link>
            or @pybash on discord
          </div>
          <div className="flex gap-2 text-xl text-black">
            rn am <span className="text-[#ff0000]">{status}</span>
          </div>
        </div>
        <div className="mr-24 w-2/3 border-r pt-24">
          <div className="flex h-fit">
            <div className="h-fit px-8 text-6xl text-black [text-orientation:mixed] [writing-mode:vertical-lr]">
              Few Details
            </div>
            <img
              src="https://image.lexica.art/full_webp/62b4a611-49c4-435e-919c-83b406c5386f"
              className="h-[34rem] w-full object-cover object-bottom"
            />
          </div>
          <div className="p-12 pl-[7.5rem] pr-10 text-xl text-gray-800">
            Yes, I&apos;m yet another indian, and yes I also code. Right now,
            I&apos;m working at Deva.me and gonna be turning 16 soon. I was born
            15 years ago obviously and have had a passion or rather interest for
            technology since my childhood days. I grew up typing away on a
            computer in my spare time and today, that has led me here. I am
            proud of the journey I&apos;ve been a part of and am excited to see
            where it takes me.
            <br />
            <br />
            I had started off building tiny scripts with Python, slowly moving
            towards APIs, and to the world of frontend from there. I did think
            backend was my calling some point in time, but looking at frontend,
            it soon changed. And now, I&apos;ve had the opportunity of working
            with many amazing people on the internet.
            <br />
            <br />
            This journey, would not have been possible without several people in
            my life. From my parents, to online friends, I&apos;m grateful to
            every single one. Even the people who didn&apos;t believe in me.
            <br />
            <br />
            Other of my interests include reading, and watching TV shows or
            movies. Yeah, the latter isn&apos; exactly a hobby, but I don&apos;t
            really care. I&apos;m also a big fan of different types of music and
            songs. As a result you will often find me music status in the front
            page of this site.
            <br />
            <br />
            Many are probably wondering how the image relates to me. It
            doesn&apos;t, directly. It is somewhat of what an ideal world looks
            like to me. Illustrated in my favorite comic strip style, Tintin by
            Hergé. For the more curious ones, it&apos;s from Lexica.
          </div>
        </div>
      </main>
    </>
  );
};

export default About;
