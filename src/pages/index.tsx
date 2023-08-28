import { type NextPage } from "next";
import Head from "next/head";
import { useState, useEffect } from "react";
import type { Lanyard, Spotify, Activity } from "~/types/lanyard";

const Home: NextPage = () => {
  const [lanyard, setLanyard] = useState<Lanyard>();
  const [spotify, setSpotify] = useState<Spotify>();
  const [vsc, setVsc] = useState<Activity>();
  const [rn, setRn] = useState(0);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    setRn(Date.now());
  });

  useEffect(() => {
    void fetch("https://api.lanyard.rest/v1/users/626461325744275464", {
      method: "GET",
    }).then((res) =>
      res.json().then((data: Lanyard) => {
        setLanyard(data);
        if (data.data.spotify) {
          setSpotify(data.data.spotify);
        }
        data.data.activities.forEach((activity, ind) => {
          if (activity.application_id == "383226320970055681") {
            setVsc(data.data.activities[ind]);
          }
        });
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
      ${hrs > 0 ? `${hrs}${hrs > 1 ? " hours, " : " hour, "}` : ""}${mins}${
      mins > 1 ? " minutes" : " minute"
    }`;
  };

  return (
    <>
      <Head>
        <title>hi, there! welcome!</title>
        <meta
          name="description"
          content="take a seat. would you like some tea? alright, i'll get it brewing, in the meantime, feel free to explore!"
        />
        <link
          rel="icon"
          href="https://cdn.discordapp.com/avatars/626461325744275464/9b8baa867dcbb45519996adb9397d7f4.png?size=4096"
        />
      </Head>
      <div className="min-h-screen flex-col items-center justify-center gap-4 bg-black px-4 py-4 font-['Labil_Grotesk'] text-lg text-white md:flex md:px-0">
        <a
          href={
            [
              "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              "https://discord.gg/FwsGkZAqcZ",
            ][Math.floor(Math.random() * 2)]
          }
          className="umami--click--easter-egg fixed bottom-8 right-8 hidden rounded-full px-3 py-1 text-black transition-all duration-300 ease-in-out hover:border-2 hover:border-white hover:text-white lg:block"
        >
          feeling lucky?
        </a>
        <div className="flex flex-col items-start gap-3">
          <div className="items-center justify-center md:flex">
            hi, i&apos;m{" "}
            <a
              href="https://twitter.com/py_bash1"
              className="umami--click--username ml-1 cursor-[url('/cursor.svg'),_pointer] rounded-md bg-gray-300 bg-opacity-40 px-1.5 py-0.5 transition duration-300 ease-in-out hover:bg-opacity-60 hover:text-black"
            >
              pybash
            </a>
            , a 15yo frontend dev from india.
            <br />
          </div>
          <div className="items-center justify-center md:flex">
            looking for a proper resume? head{" "}
            <a
              href="https://read.cv/pybash"
              className="umami--click--username ml-1 cursor-[url('/cursor.svg'),_pointer] rounded-md bg-gray-300 bg-opacity-40 px-1.5 py-0.5 transition duration-300 ease-in-out hover:bg-opacity-60 hover:text-black"
            >
              here
            </a>
            .
          </div>
          {spotify ? (
            <div className="items-center justify-center md:flex">
              rn am vibing to{" "}
              <a
                href={`https://open.spotify.com/track/${spotify?.track_id}`}
                className="umami--click--song mx-1 cursor-[url('/cursor.svg'),_pointer] rounded-md bg-gray-300 bg-opacity-40 px-1.5 py-0.5 transition duration-300 ease-in-out hover:bg-opacity-60 hover:text-black"
              >
                {spotify?.song}
              </a>
              by
              <span className="mx-1 rounded-md bg-gray-300 bg-opacity-40 px-1.5 py-0.5 transition duration-300 ease-in-out hover:bg-opacity-60 hover:text-black">
                {spotify?.artist?.split(";")[0]}
              </span>
            </div>
          ) : null}
          {vsc ? (
            <div className="flex items-center justify-center">
              {spotify ? (
                <div>
                  oh and i&apos;m also{" "}
                  {vsc?.details?.split(" ")[0]?.toLowerCase()}{" "}
                  {vsc?.details.split(" ")[1]} {vsc?.state} for the last{" "}
                  {formatTime()}
                </div>
              ) : (
                <div>
                  i&apos;m {vsc?.details.split(" ")[0]}{" "}
                  {vsc?.details.split(" ")[1]} {vsc?.state} for the last{" "}
                  {formatTime()}
                </div>
              )}
            </div>
          ) : null}
          <div className="text-xl font-bold text-green-400">now</div>
          <div>
            <ul className="ml-3">
              <li className="flex items-start gap-2">
                <a
                  href={clicks > 1 ? `https://github.com/pybash1` : "#"}
                  className="umami--click--github flex cursor-[url('/cursor.svg'),_pointer] items-center font-bold text-green-400"
                  onClick={() => setClicks(clicks + 1)}
                >
                  building
                </a>{" "}
                meaningful products that solve problems
              </li>
              {clicks >= 1 ? (
                <li className="flex gap-2">
                  <a
                    href={lanyard?.data?.kv?.rnlink}
                    className="umami--click--solo-building cursor-[url('/cursor.svg'),_pointer] font-bold text-green-400"
                  >
                    {lanyard?.data?.kv?.rnname}
                  </a>{" "}
                  - {lanyard?.data?.kv?.rn}
                </li>
              ) : null}
              <li className="flex gap-2">
                <div className="font-bold text-blue-300">
                  frontend engineer @ ???
                </div>{" "}
                building the frontend at a stealth startup
              </li>
              <li className="flex gap-2">
                <div className="font-bold">trying</div> to pass school somehow
              </li>
            </ul>
          </div>
          <div className="text-xl font-bold text-yellow-400">projects</div>
          <div>
            <ul className="ml-3">
              <li className="flex gap-2">
                <a
                  href="https://elusidate.app"
                  className="umami--click--project cursor-[url('/cursor.svg'),_pointer] font-bold text-yellow-400"
                >
                  elusidate
                </a>
                (cancelled) - we turn data to reports in 1 click
              </li>
              <li className="flex gap-2">
                <a
                  href="https://github.com/SoulNinja-dev/supertable"
                  className="umami--click--project cursor-[url('/cursor.svg'),_pointer] font-bold text-yellow-400"
                >
                  supertable
                </a>{" "}
                - airtable on steroids
              </li>
              <li className="flex gap-2">
                <a
                  href="https://solo.pybash.xyz"
                  className="umami--click--project cursor-[url('/cursor.svg'),_pointer] font-bold text-yellow-400"
                >
                  solo
                </a>
                (wip) - connecting artists with their die-hard fans
              </li>
              <li className="flex gap-2">
                <a
                  href="https://authdeck.xyz"
                  className="umami--click--project cursor-[url('/cursor.svg'),_pointer] font-bold text-yellow-400"
                >
                  authdeck
                </a>
                (dead) - verify your identity on chain
              </li>
              <li className="flex gap-2">
                <a
                  href="https://rrpm.pybash.xyz"
                  className="umami--click--project cursor-[url('/cursor.svg'),_pointer] font-bold text-yellow-400"
                >
                  rrpm
                </a>{" "}
                - dev tool to manage repos and projects better
              </li>
              <li className="flex gap-2">
                <a
                  href="https://learnist.vercel.app"
                  className="umami--click--project cursor-[url('/cursor.svg'),_pointer] font-bold text-yellow-400"
                >
                  learnist
                </a>{" "}
                - web app to manage your studies
              </li>
              <li className="flex gap-2">
                <a
                  href="https://cesta.wiki"
                  className="umami--click--project cursor-[url('/cursor.svg'),_pointer] font-bold text-yellow-400"
                >
                  cesta
                </a>{" "}
                - find resources and roadmaps to learn anything
              </li>
            </ul>
          </div>
          <div className="text-xl font-bold text-red-400">prev</div>
          <div>
            <ul className="ml-3">
              <li className="gap-2 md:flex">
                <div className="font-bold">frontend engineer @ authdeck</div> -
                helped develop the frontend
              </li>
            </ul>
          </div>
          <div className="text-xl font-bold text-blue-400">writing</div>
          <div>
            <ul className="ml-3">
              <li className="gap-2 md:flex">
                <a
                  href="https://pybash.substack.com/p/designing-ui-for-the-first-time"
                  className="umami--click--writing cursor-[url('/cursor.svg'),_pointer] font-bold text-blue-400"
                >
                  designing ui for the first time
                </a>{" "}
                on substack
              </li>
              <li className="gap-2 md:flex">
                <a
                  href="https://pybash.substack.com/p/6-week-dev-speedrun"
                  className="umami--click--writing cursor-[url('/cursor.svg'),_pointer] font-bold text-blue-400"
                >
                  6-week dev speedrun
                </a>{" "}
                on substack
              </li>
              <li className="gap-2 md:flex">
                <a
                  href="https://pybash.substack.com/p/documentation-is-a-love-letter-to"
                  className="umami--click--writing cursor-[url('/cursor.svg'),_pointer] font-bold text-blue-400"
                >
                  documentation is a love letter to your future self
                </a>{" "}
                on substack
              </li>
              <li className="gap-2 md:flex">
                <a
                  href="https://pybash.substack.com/p/hacktoberfest-and-a-large-codebase"
                  className="umami--click--writing cursor-[url('/cursor.svg'),_pointer] font-bold text-blue-400"
                >
                  hacktoberfest and a large codebase
                </a>{" "}
                on substack
              </li>
              <div>
                sub{" "}
                <a
                  href="https://pybash.substack.com"
                  className="mx-1 cursor-[url('/cursor.svg'),_pointer] rounded-md bg-gray-300 bg-opacity-40 px-1.5 py-0.5 transition duration-300 ease-in-out hover:bg-opacity-60 hover:text-black"
                >
                  here
                </a>{" "}
                for more
              </div>
            </ul>
          </div>
          <div className="items-center justify-center md:flex">
            wanna chat? drop a dm{" "}
            <a
              href="https://twitter.com/py_bash1"
              className="umami--click--twitter-dm mx-1 cursor-[url('/cursor.svg'),_pointer] rounded-md bg-gray-300 bg-opacity-40 px-1.5 py-0.5 transition duration-300 ease-in-out hover:bg-opacity-60 hover:text-black"
            >
              here
            </a>{" "}
            or message me on{" "}
            <a
              href="https://discord.com/users/626461325744275464"
              className="umami--click--discord ml-1 cursor-[url('/cursor.svg'),_pointer] rounded-md bg-gray-300 bg-opacity-40 px-1.5 py-0.5 transition duration-300 ease-in-out hover:bg-opacity-60 hover:text-black"
            >
              discord
            </a>
            , im{" "}
            <span
              className={
                "mx-1 " +
                (lanyard?.data?.discord_status === "online"
                  ? "text-green-400"
                  : lanyard?.data?.discord_status === "idle"
                  ? "text-yellow-400"
                  : lanyard?.data?.discord_status === "dnd"
                  ? "text-red-400"
                  : "")
              }
            >
              {lanyard?.data?.discord_status}
            </span>{" "}
            rn.
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
