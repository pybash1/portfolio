import { type NextPage } from "next";
import Link from "next/link";
import { useState, useEffect } from "react";
import { dmSans, otBrut, otBrutMono } from "~/components/fonts";
import type { Lanyard, Spotify, Activity } from "~/types/lanyard";

const Home: NextPage = () => {
  const [spotify, setSpotify] = useState<Spotify>();
  const [vsc, setVsc] = useState<Activity>();
  const [status, setStatus] = useState<boolean>();

  useEffect(() => {
    void fetch("https://api.lanyard.rest/v1/users/626461325744275464", {
      method: "GET",
    }).then((res) =>
      res.json().then((data: Lanyard) => {
        if (data.data.spotify) {
          setSpotify(data.data.spotify);
        }
        setStatus(
          data.data.active_on_discord_desktop ||
            data.data.active_on_discord_mobile ||
            data.data.active_on_discord_web
        );
        data.data.activities.forEach((activity, ind) => {
          if (activity.application_id == "383226320970055681") {
            setVsc(data.data.activities[ind]);
          }
        });
      })
    );
  }, []);

  return (
    <main
      className={`flex min-h-screen flex-col gap-2 bg-black bg-cover bg-center text-white selection:bg-white selection:text-black ${otBrutMono.className}`}
    >
      <nav className="flex items-center justify-between gap-6 px-24 py-12 uppercase">
        <Link href="/craft">Craft</Link>
        &bull;
        <Link href="https://parchments.pybash.xyz">Writing</Link>
      </nav>
      <div
        className={`flex w-full flex-col items-center justify-center pb-36 pt-24 text-[10rem] uppercase ${otBrut.className}`}
      >
        <span className="-mb-8 text-sm">完璧主義者</span>
        pybash
        <span
          className={`-mt-12 text-center text-base uppercase ${dmSans.className}`}
        >
          &bull;&nbsp;Crafting perfection&nbsp;&bull;
          <br />
          {spotify ? (
            <>
              &bull;&nbsp;{spotify?.song} - {spotify?.artist.split(";")[0]}
              &nbsp;&bull;
            </>
          ) : null}
          {spotify ? <br /> : null}
          {vsc ? (
            <>
              &bull;&nbsp;
              {vsc?.details} {vsc?.state}&nbsp;&bull;
            </>
          ) : null}
        </span>
      </div>
      <div className="flex w-full flex-col items-center gap-6">
        <div className="w-[45%] text-center text-2xl">
          I&apos;m an avid builder. I try to create things that help people and
          the world. I strive to make beauty a standard for the web. I&apos;ve
          worked at leading startups including{" "}
          <Link
            href="https://deva.me"
            className=" text-blue-300 underline decoration-wavy decoration-1"
          >
            10Planet
          </Link>{" "}
          and Authdeck.
        </div>
        <span>&bull;×&bull;</span>
        <div className="w-[45%] text-center text-2xl">
          2024 <span className="text-gray-300">/</span> I decided to take a
          break from working and work on myself. This year, I want to focus on
          building more quality products and upskilling myself.
        </div>
        <span>&bull;×&bull;</span>
        <div className="w-[45%] text-center text-2xl">
          2023 <span className="text-gray-300">/</span> Spent most of my time
          juggling between school, and{" "}
          <Link
            href="/craft"
            className=" text-blue-300 underline decoration-wavy decoration-1"
          >
            work
          </Link>
          . Out of the spare time I got, I competed in hackathons, and built
          mini-projects.
        </div>
      </div>
      <div
        className={`flex h-screen w-full flex-col items-center justify-center text-center text-9xl uppercase ${otBrut.className}`}
      >
        <span className="pb-2 text-sm">接触</span>
        hi@
        <br />
        pybash
        <br />
        .xyz
        <span className={`text-base uppercase ${dmSans.className}`}>
          &bull;&nbsp;20.5937° 78.9629°&nbsp;&bull;
          <br />
          &bull;&nbsp;
          <Link
            href="https://twitter.com/py_bash1"
            className="text-blue-300 underline decoration-wavy decoration-1 underline-offset-2"
          >
            Twitter
          </Link>
          &nbsp;&bull;
          <br />
          &bull;&nbsp; Discord:{" "}
          <span className={status ? "text-green-300" : "text-red-300"}>
            {status ? "Online" : "Offline"}
          </span>
          &nbsp;&bull;
        </span>
      </div>
    </main>
  );
};

export default Home;
