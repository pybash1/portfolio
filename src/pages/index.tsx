import { AnimatePresence } from "framer-motion";
import { type NextPage } from "next";
import Head from "next/head";
import { useState, useEffect } from "react";
import Navbar from "~/components/Navbar";
import Topbar from "~/components/Topbar";
import type { Lanyard, Spotify, Activity } from "~/types/lanyard";
import { chooseRandom, pronounciations } from "~/utils/utils";

const Home: NextPage = () => {
  const [spotify, setSpotify] = useState<Spotify>();
  const [vsc, setVsc] = useState<Activity>();
  const [rn, setRn] = useState(0);
  const [title] = useState(
    chooseRandom(["craftsman", "innovator", "artisan", "maverick"])
  );
  const [loading, setLoading] = useState(true);
  const [navbar, setNavbar] = useState(false);

  useEffect(() => {
    setRn(Date.now());
  });

  useEffect(() => {
    void fetch("https://api.lanyard.rest/v1/users/626461325744275464", {
      method: "GET",
    }).then((res) =>
      res.json().then((data: Lanyard) => {
        if (data.data.spotify) {
          setSpotify(data.data.spotify);
        }
        data.data.activities.forEach((activity, ind) => {
          if (activity.application_id == "383226320970055681") {
            setVsc(data.data.activities[ind]);
          }
        });
        setLoading(false);
      })
    );
    setRn(Date.now());
  }, []);

  const formatTime = () => {
    const hrs = Math.floor(
      Math.abs(rn - (vsc?.timestamps?.start || 0)) / 1000 / 60 / 60
    );
    const mins =
      Math.floor(Math.abs(rn - (vsc?.timestamps?.start || 0)) / 1000 / 60) -
      hrs * 60;
    return `
      ${
        hrs > 0
          ? `${hrs}${hrs > 1 ? " hours" : " hour"}`
          : `${mins}${mins > 1 ? " minutes" : " minute"}`
      }`;
  };

  return (
    <>
      <Head>
        <title>home of pybash</title>
        <meta
          name="description"
          content={`i'm ${
            ["innovator", "artisan"].includes(title as string) ? "an" : "a"
          } ${title} except i use code instead of ${
            title === "artisan" ? "paint and brushes" : "a hammer and wrench"
          }. not enough? click the link and see for yourself.`}
        />
        <link
          rel="icon"
          href="https://cdn.discordapp.com/avatars/626461325744275464/9b8baa867dcbb45519996adb9397d7f4.png?size=4096"
        />
      </Head>
      {!loading ? (
        <main
          className={`relative flex min-h-screen flex-col items-center justify-center bg-[#faf5f1] py-8 font-['Labil_Grotesk'] leading-none text-[#ff0000] selection:bg-[#ff0000] selection:text-[#faf5f1]`}
        >
          <AnimatePresence>{navbar ? <Navbar /> : null}</AnimatePresence>
          <Topbar navbar={navbar} setNavbar={setNavbar} />
          <div className="text-center text-[7rem] md:text-[12rem] uppercase">
            <div className="flex items-start justify-center">
              {spotify ? (
                <a
                  href={`https://open.spotify.com/track/${
                    spotify?.track_id ?? ""
                  }`}
                  className="text-2xl lowercase text-black hidden md:block"
                  data-type="M"
                >
                  {spotify?.song} &ndash; {spotify?.artist?.split(";")[0]}
                </a>
              ) : (
                <a
                  href="https://read.cv/pybash"
                  className="text-2xl lowercase text-black hidden md:block"
                >
                  resume
                </a>
              )}
              <a href="https://twitter.com/py_bash1">Py</a>
              {vsc ? (
                <div className="text-2xl lowercase text-black hidden md:block">
                  {vsc?.details.split(" ")[1]} {vsc?.state}
                  <br />
                  for {formatTime()}
                </div>
              ) : (
                <a
                  href="https://github.com/pybash1"
                  className="text-2xl lowercase text-black hidden md:block"
                >
                  github
                </a>
              )}
            </div>
            <a href="https://twitter.com/py_bash1">&mdash;Bash</a>
          </div>
          <div className="flex items-center gap-4 text-xl md:text-4xl">
            {title}
            <span className="text-sm md:text-lg text-black">
              {
                pronounciations[
                  title as "maverick" | "artisan" | "craftsman" | "innovator"
                ]
              }
            </span>
          </div>
        </main>
      ) : (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#faf5f1] py-8 font-['Labil_Grotesk'] text-xl text-black selection:bg-[#ff0000] selection:text-[#faf5f1]">
          <div>loading...</div>
        </main>
      )}
    </>
  );
};

export default Home;
