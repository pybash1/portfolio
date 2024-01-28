import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { otBrut } from "~/components/fonts";

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
        className={`relative flex min-h-screen flex-col items-center justify-center gap-6 bg-black bg-cover bg-center text-white selection:bg-white selection:text-black ${otBrut.className}`}
      >
        <div className="text-[12rem]">404</div>
        <div className="text-xl uppercase">
          &bull;{wip ? "still crafting" : "we got lost"}&bull;
        </div>
        <Link
          href="/"
          className="text-3xl uppercase text-blue-300 underline decoration-wavy decoration-1"
        >
          {wip ? "check back later" : "let's go back"}
        </Link>
      </main>
    </>
  );
};

export default NotFound;
