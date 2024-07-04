import { type NextPage } from "next";
import Link from "next/link";
import { useState, useEffect } from "react";
import { dmSans } from "~/components/fonts";
import type { Lanyard, Spotify, Activity } from "~/types/lanyard";
import Image from "next/image";
import { type Month, ProjectCard } from "~/components/card";
import { type GitHubCommitsResponse, getLastModified } from "~/utils/github";
import { Email, Twitter } from "~/components/icons";

const Home: NextPage = () => {
  const [spotify, setSpotify] = useState<Spotify>();
  const [vsc, setVsc] = useState<Activity>();
  const [githubCommits, setGitHubCommits] = useState<GitHubCommitsResponse>([]);

  useEffect(() => {
    void fetch("https://api.lanyard.rest/v1/users/626461325744275464", {
      method: "GET",
    }).then((res) =>
      res.json().then((data: Lanyard) => {
        if (data.data.spotify) {
          setSpotify(data.data.spotify);
        }
        setVsc(
          data.data.activities.filter(
            (activity) => activity.application_id == "383226320970055681"
          )[0]
        );
      })
    );

    void fetch("https://api.github.com/repos/pybash1/portfolio/commits", {
      method: "GET",
    }).then((res) => {
      void res
        .json()
        .then((data: GitHubCommitsResponse) => setGitHubCommits(data));
    });
  }, []);

  return (
    <main
      className={`${dmSans.className} flex min-h-screen flex-col items-center bg-[#18181A] px-8 py-10 text-sm text-white selection:bg-white selection:text-[#18181A]`}
    >
      <div className="flex w-96 flex-col gap-6">
        <Image
          src="/pfp.png"
          width={128}
          height={128}
          alt="logo"
          className="h-12 w-12 rounded-full"
        />
        <div>
          <div>PyBash</div>
          <div className="text-white/55">Builder</div>
        </div>
        <div className="flex flex-col gap-2">
          <div>Building cool stuff since 2021.</div>
          <div>
            Crafting and building things to innovate the web while juggling high
            school.
          </div>
          <div>Never settle.</div>
        </div>
        <div className="flex gap-4">
          <Link
            href="mailto:hi@pybash.xyz"
            className="text-white/55 hover:text-white"
          >
            <Email />
          </Link>
          <Link
            href="https://twitter.com/py_bash1"
            className="text-white/55 hover:text-white"
          >
            <Twitter />
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2 py-12">
        <ProjectCard
          link="https://peersafe.xyz"
          title="Peersafe"
          description="A decentralized file storage system from the future."
          start="May '24"
          end="Coming soon"
          screenshot="peersafe"
        />
        <ProjectCard
          link="https://github.com/pybash1/today"
          title="Moni"
          description="Yet another expense tracker built with React Native."
          start="May '24"
          end="Jun '24"
          screenshot="moni"
          type="mobile"
        />
        <ProjectCard
          link="https://onrift.xyz"
          title="Rift"
          description="Established the foundations of a magical new creator economy."
          start="Feb '24"
          end="May '24"
          screenshot="rift"
        />
        <ProjectCard
          link="https://labs.pybash.xyz"
          title="Playground"
          description="Building fun tools, components and more since 2021."
          start="Jan '21"
          end={`${
            new Date().toLocaleDateString(undefined, {
              month: "short",
            }) as Month
          } '${Number(
            new Date().toLocaleDateString(undefined, {
              year: "2-digit",
            })
          )}`}
          screenshot="playground"
          type="other"
        />
        <ProjectCard
          link="https://deva.me"
          title="Deva.me"
          description="I crafted and put together several key pieces to the puzzle."
          start="Apr '23"
          end="Jan '24"
          screenshot="deva"
        />
        <ProjectCard
          link="https://supertable.fun"
          title="Supertable"
          description="Improved forms on top of the Airtable API for Superteam."
          start="Mar '23"
          end="Aug '23"
          screenshot="superteam"
        />
        <ProjectCard
          link="https://purp.game"
          title="Purp.game"
          description="Built a gamified leaderboard for a crypto social app."
          start="Sep '23"
          end="Oct '23"
          screenshot="purp"
        />
      </div>
      <div className="flex w-96 flex-col gap-6">
        <div className="flex flex-col gap-1">
          <div className="text-white/55">Me</div>
          <div>
            I&apos;ve loved to build things since I was quite young. This has
            led me to work at places such as 10Planet and Authdeck. I try to new
            learn new things and do cool stuff while juggling high school on the
            side. I also enjoy reading books and watching unique
            films(esspecially Chistopher Nolan). I&apos;ve also won a few
            hackathons here and there.
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-white/55">Social-ish</div>
          <ul className="flex flex-col gap-2">
            {vsc ? (
              <li>
                {vsc.details
                  ?.replace("editing", "Building")
                  .replace("Idling", "Thinking")}{" "}
                /{" "}
                <span className="text-white/55">
                  {vsc.state?.replace("in", "") || "life choices"}
                </span>
              </li>
            ) : null}
            {spotify ? (
              <li>
                Listening to &quot;{spotify.song}&quot; by{" "}
                {spotify.artist?.split(";")?.[0] as string} /{" "}
                <Link
                  href={`https://open.spotify.com/track/${spotify.track_id}`}
                  className="text-white/55 underline underline-offset-2 hover:text-white"
                >
                  spotify
                </Link>
              </li>
            ) : null}
            <li>
              Writing code /{" "}
              <Link
                href="https://github.com/pybash1"
                className="text-white/55 underline underline-offset-2 hover:text-white"
              >
                github
              </Link>
            </li>
            <li>
              Reading books /{" "}
              <Link
                href="https://oku.club/user/pybash"
                className="text-white/55 underline underline-offset-2 hover:text-white"
              >
                oku
              </Link>
            </li>
            <li>
              Writing stuff /{" "}
              <Link
                href="https://parchments.pybash.xyz"
                className="text-white/55 underline underline-offset-2 hover:text-white"
              >
                parchments
              </Link>
            </li>
            <li>
              Unfiltered thoughts /{" "}
              <Link
                href="https://streams.place/pybash"
                className="text-white/55 underline underline-offset-2 hover:text-white"
              >
                streams place
              </Link>
            </li>
            <li>
              Watching films and shows /{" "}
              <Link
                href="https://www.themoviedb.org/u/pybash"
                className="text-white/55 underline underline-offset-2 hover:text-white"
              >
                tmdb
              </Link>
            </li>
            <li>Balanching high school / 📚</li>
          </ul>
        </div>
        <footer className="pt-10 text-white/55">
          <div>&copy; {new Date().getFullYear()}, PyBash</div>
          <div>Updated {getLastModified(githubCommits)}</div>
          <div>Built in Calcutta, IN</div>
        </footer>
      </div>
    </main>
  );
};

export default Home;
