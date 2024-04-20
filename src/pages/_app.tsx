import { type AppType } from "next/app";
import "~/styles/globals.css";
import Head from "next/head";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>PyBash</title>
        <meta
          name="description"
          content={`I craft and manipulate interfaces on the internet. Currently crafting things over at Rift. Previously @10planet. Sometimes I dabble into design and writing, all while juggling high school.`}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/android-chrome-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#18181a" />
        <meta name="msapplication-TileColor" content="#18181a" />
        <meta name="msapplication-TileImage" content="/mstile-144x144.png" />
        <meta name="theme-color" content="#18181a" />
      </Head>
      <Component {...pageProps} />
    </>
  );
};

export default MyApp;
