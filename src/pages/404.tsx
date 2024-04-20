import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { matter, newsreader } from "~/components/fonts";
import { formatTime } from "~/utils/time";
import { useEffect, useState } from "react";

const NotFound: NextPage = () => {
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
    <>
      <Head>
        <title>You got lost | PyBash</title>
        <meta
          name="description"
          content={`You clicked a broken link or mistyped the URL, whatever be it, let's take you home.`}
        />
      </Head>
      <main
        className={`flex min-h-screen flex-col bg-[#18181A] px-8 py-2 text-[#E4E2DD] ${matter.className}`}
      >
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
          <nav className="flex items-center gap-2 text-sm text-[#E4E2DD]/90 underline decoration-[#E4E2DD]/90 underline-offset-[3px]">
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
        <div className="flex grow flex-col gap-6 md:px-96 pb-8 pt-36">
          <div className={`text-xl text-[#E4E2DD]/60 ${newsreader.className}`}>
            Not Found
          </div>
          <div>
            Maybe you clicked a broken link, or mistyped the URL? Whatever that
            be, let&apos;s take you back{" "}
            <Link
              href="/"
              className={`underline decoration-1 underline-offset-2 outline-none transition-all duration-500 ease-in-out hover:bg-[#E4E2DD] hover:px-2 hover:py-1 hover:text-[#18181A] focus:bg-[#E4E2DD] focus:px-2 focus:py-1 focus:text-[#18181A] ${newsreader.className}`}
            >
              home
            </Link>
            .
          </div>
        </div>
        <footer className="-mx-8 flex items-center justify-between border-t border-[#313136] px-4 md:px-72 pt-2 text-sm text-[#E4E2DD]/50">
          <div>Never settle.</div>
          <div>{formatTime(rn)}</div>
        </footer>
      </main>
    </>
  );
};

export default NotFound;
