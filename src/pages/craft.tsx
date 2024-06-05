import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProjectCard } from "~/components/card";
import { matter } from "~/components/fonts";
import { formatTime } from "~/utils/time";

const Craft: NextPage = () => {
  const [rn, setRn] = useState(
    new Date(new Date().toLocaleString("en", { timeZone: "Asia/Calcutta" }))
  );

  useEffect(() => {
    const interval = setInterval(
      () =>
        setRn(
          new Date(
            new Date().toLocaleString("en", { timeZone: "Asia/Calcutta" })
          )
        ),
      1000
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <main
      className={`flex min-h-screen flex-col bg-[#18181A] px-8 py-2 text-[#E4E2DD] ${matter.className}`}
    >
      <Head>
        <title>Craft | PyBash</title>
      </Head>
      <div className="flex items-center justify-between">
        <Link href="/" className="group -mx-6 flex items-center outline-none">
          <Image
            src="/p-transparent.png"
            width={256}
            height={256}
            alt="logo"
            className="h-16 w-16"
          />
          <span className="overflow-hidden opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100">
            pybash
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm text-[#E4E2DD]/80 underline decoration-[#E4E2DD]/80 underline-offset-[3px]">
          <Link
            className="outline-none transition duration-300 ease-in-out hover:text-[#E4E2DD] hover:decoration-[#E4E2DD] focus:text-[#E4E2DD] focus:decoration-[#E4E2DD]"
            href="https://twitter.com/py_bash1"
            target="_blank"
          >
            Tweetybird
          </Link>
          <Link
            className="outline-none transition duration-300 ease-in-out hover:text-[#E4E2DD] hover:decoration-[#E4E2DD] focus:text-[#E4E2DD] focus:decoration-[#E4E2DD]"
            href="https://github.com/pybash1"
            target="_blank"
          >
            Octocat
          </Link>
          <Link
            className="outline-none transition duration-300 ease-in-out hover:text-[#E4E2DD] hover:decoration-[#E4E2DD] focus:text-[#E4E2DD] focus:decoration-[#E4E2DD]"
            href="mailto:hi@pybash.xyz"
            target="_blank"
          >
            hi@pybash.xyz
          </Link>
        </nav>
      </div>
      <div className="flex grow flex-col gap-6 pb-8 pt-36 md:px-36 lg:px-96">
        <div className={`text-lg`}>
          Craft
          <br />
          <div className="text-base text-[#E4E2DD]/60">
            Selected work and experiments.
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6">
            <div className="text-sm text-[#E4E2DD]/60">Professional</div>
            <ProjectCard
              title="Rift"
              description="Established the foundations of a magical new creator economy."
              link="https://onrift.xyz"
            />
            <ProjectCard
              title="Deva.me"
              description="I crafted and put together several key pieces to the puzzle."
              link="https://deva.me"
            />
            <ProjectCard
              title="Authdeck"
              description="Single handedly built and shipped the entire frontend."
              link="https://authdeck.xyz"
            />
            <ProjectCard
              title="purp.game"
              description="Built a gamified leaderboard for a crypto social app."
              link="https://purp.game"
            />
            <ProjectCard
              title="Supertable"
              description="Improved forms on top of the Airtable API for Superteam."
              link="https://supertable.vercel.app"
            />
          </div>
          <div className="flex flex-col gap-6">
            <div className="text-sm text-[#E4E2DD]/60">Personal</div>
            <ProjectCard
              title="Palet"
              description="Generate color palettes from words. Also has a figma plugin."
              link="https://github.com/pybash1/today"
            />
            <ProjectCard
              title="Solo"
              description="Connecting music artists and their fans with signed albums."
              link="https://solo.pybash.xyz"
            />
            <ProjectCard
              title="n0"
              description="Habit tracker for a friend. Demo link will not persist data."
              link="https://n0.pybash.xyz"
            />
          </div>
          <div className="flex flex-col gap-6">
            <div className="text-sm text-[#E4E2DD]/60">Experiments</div>
            <ProjectCard
              title="besafe"
              description="A simple git pre-commit hook to keep your secrets safe."
              link="https://github.com/pybash1/winnf"
            />
            <ProjectCard
              title="WinNF"
              description="Nerdfetch for windows, with 2 dependencies for learning Rust."
              link="https://github.com/pybash1/winnf"
            />
            <ProjectCard
              title="Parchments"
              description="A sort of blog, which I'm still building."
              link="https://parchments.pybash.xyz"
            />
            <ProjectCard
              title="Today"
              description="Self-hostable todo app that forgets the past and future."
              link="https://github.com/pybash1/today"
            />
          </div>
        </div>
      </div>
      <footer className="-mx-8 flex items-center justify-between border-t border-[#313136] px-4 pt-2 text-sm text-[#E4E2DD]/50 md:px-24 lg:px-72">
        <div>Never settle.</div>
        <div>{formatTime(rn)}</div>
      </footer>
    </main>
  );
};

export default Craft;
