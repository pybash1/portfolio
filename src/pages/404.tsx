import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

interface Props {
  wip?: boolean;
}

const MSGS = [
  "You've mistyped the URL.",
  "Looks like you clicked the wrong link.",
  "Trying to find secret paths?",
  "What led you here?",
  "Oops, you made a typo!",
];

const NotFound: NextPage<Props> = ({ wip = false }: Props) => {
  return (
    <>
      <Head>
        <title>page not found</title>
        <meta
          name="description"
          content="you prolly made a typo or clicked the wrong link. but don't worry i'll get you home."
        />
        <link
          rel="icon"
          href="https://cdn.discordapp.com/avatars/626461325744275464/9b8baa867dcbb45519996adb9397d7f4.png?size=4096"
        />
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-black font-['Labil_Grotesk'] text-lg text-white">
        <div className="text-center">
          {wip
            ? "This page is still brewing. Come back later."
            : MSGS[Math.floor(Math.random() * MSGS.length)]}
          <br />
          {wip ? "For now, " : null}
          {wip ? "l" : "L"}et&apos;s take you{" "}
          <Link href="/" className="text-green-400">
            home
          </Link>
          .
        </div>
      </div>
    </>
  );
};

export default NotFound;
