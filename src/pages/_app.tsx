import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import Head from "next/head";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>home of pybash</title>
        <meta
          name="description"
          content={`i strive to create perfection on the web. currently crafting things for the internet. previously @10planet. sometimes i dabble into design and writing, while juggling high school.`}
        />
        <link
          rel="icon"
          href="https://cdn.discordapp.com/avatars/626461325744275464/9b8baa867dcbb45519996adb9397d7f4.png?size=4096"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
};

export default api.withTRPC(MyApp);
