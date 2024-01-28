import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import Script from "next/script";
import Head from "next/head";
import { type ReactNode, useEffect, useState } from "react";

const icons: { [key: string]: ReactNode } = {
  W: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
      />
    </svg>
  ),
  P: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25"
      />
    </svg>
  ),
  I: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
      />
    </svg>
  ),
  M: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
      />
    </svg>
  ),
  T: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      className="bi bi-twitter"
      viewBox="0 0 16 16"
    >
      <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z" />
    </svg>
  ),
  O: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
      />
    </svg>
  ),
};

const MyApp: AppType = ({ Component, pageProps }) => {
  const [type, setType] = useState("");

  useEffect(() => {
    const trailer = document.getElementById("cursor");

    const handle = (e: MouseEvent) => {
      const x = e.clientX - (trailer?.offsetWidth as number) / 2,
        y = e.clientY - (trailer?.offsetHeight as number) / 2;
      const interactable = (e.target as Element).closest("a");
      const isBgWhite =
        (e.target as Element).closest("[class~='bg-white']") ||
        (e.target as Element).closest("[class~='bg-[#ffffff]']") ||
        ((e.target as Element)
          .closest("div.left-0.right-0.top-0")
          ?.checkVisibility() &&
          e.clientX >
            (document
              .querySelector("aside.fixed.bottom-0")
              ?.getBoundingClientRect().x as number));

      if (trailer)
        trailer.animate(
          {
            transform: `translate(${x}px, ${y}px) scale(${
              interactable ? 3 : 1
            })`,
            background: isBgWhite ? "#000000" : "#ffffff",
            color: isBgWhite ? "#ffffff" : "#000000",
          },
          {
            fill: "forwards",
            duration: 800,
          }
        );

      if (interactable)
        setType(
          interactable.dataset.type ||
            (/https?:\/\/(localhost:\d{4}|pybash.xyz)\//g.test(
              interactable.href
            )
              ? "I"
              : interactable.href.startsWith("https://twitter.com")
              ? "T"
              : "O")
        );
      else setType("");
    };

    window.addEventListener("mousemove", handle);

    return () => window.removeEventListener("mousemove", handle);
  }, []);

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
      <div
        id="cursor"
        className="cursor pointer-events-none fixed z-[99999] flex h-8 w-8 items-center justify-center rounded-full p-3 transition ease-in-out"
      >
        {icons[type]}
      </div>
      <Component {...pageProps} />
    </>
  );
};

export default api.withTRPC(MyApp);
