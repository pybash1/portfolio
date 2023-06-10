import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import Script from "next/script";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Script
        async
        defer
        data-website-id="326dbd9c-9714-423c-bf95-50f327f76c98"
        src="https://umami-trn.up.railway.app/umami.js"
      />
      <Component {...pageProps} />
    </>
  );
};

export default api.withTRPC(MyApp);
