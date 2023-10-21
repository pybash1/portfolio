import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

interface Props {
  wip?: boolean;
}

const NotFound: NextPage<Props> = ({ wip = false }: Props) => {
  return (
    <>
      <Head>
        <title>your lost</title>
        <meta name="description" content={`click the link to go home.`} />
        <link
          rel="icon"
          href="https://cdn.discordapp.com/avatars/626461325744275464/9b8baa867dcbb45519996adb9397d7f4.png?size=4096"
        />
      </Head>
      <main
        className={`relative flex min-h-screen flex-col items-center justify-center bg-[#faf5f1] py-8 font-['Labil_Grotesk'] leading-none text-[#ff0000] selection:bg-[#ff0000] selection:text-[#faf5f1]`}
      >
        <div className="text-center text-[4rem] uppercase md:text-[6rem] lg:text-[12rem]">
          <div className="flex items-start justify-center">
            <div className="hidden text-2xl lowercase text-black md:block">
              click the
            </div>
            <Link href="/">{wip ? "Working" : "You're"}</Link>
            <div className="hidden text-2xl lowercase text-black md:block">
              text
            </div>
          </div>
          <Link href="/">&mdash;{wip ? "On it" : "Lost"}</Link>
        </div>
        <div className="flex items-center gap-4 text-xl md:text-2xl lg:text-4xl">
          {wip ? "check back in a while" : "let's go home"}
        </div>
      </main>
    </>
  );
};

export default NotFound;
