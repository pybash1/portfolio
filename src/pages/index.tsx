import { type NextPage } from "next";
import Link from "next/link";
import { useState, useEffect } from "react";
import { matter, newsreader } from "~/components/fonts";
import type { Lanyard, Spotify, Activity } from "~/types/lanyard";
import Image from "next/image";
import { formatTime } from "~/utils/time";
import { ContactCard } from "~/components/card";

const Home: NextPage = () => {
  const [spotify, setSpotify] = useState<Spotify>();
  const [vsc, setVsc] = useState<Activity>();
  const [rn, setRn] = useState(
    new Date(new Date().toLocaleString("en", { timeZone: "Asia/Calcutta" }))
  );

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
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () =>
        setRn(
          new Date(
            new Date().toLocaleString("en", { timeZone: "Asia/Calcutta" })
          )
        ),
      1000
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <main
      className={`flex min-h-screen flex-col bg-[#18181A] px-8 py-2 text-[#E4E2DD] ${matter.className}`}
    >
      <div className="fixed left-8 right-8 top-0 flex items-center justify-between bg-inherit py-2 md:bg-transparent md:backdrop-blur-[2px]">
        <div className="group -mx-6 flex items-center">
          <Image
            src="/p-transparent.png"
            width={256}
            height={256}
            alt="logo"
            className="h-16 w-16"
          />
          <span className="hidden overflow-hidden opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 md:block">
            pybash
          </span>
        </div>
        <nav className="flex items-center gap-2 text-sm text-[#E4E2DD]/80 underline decoration-[#E4E2DD]/80 underline-offset-[3px]">
          <Link
            className="outline-none transition duration-300 ease-in-out hover:text-[#E4E2DD] hover:decoration-[#E4E2DD] focus:text-[#E4E2DD] focus:decoration-[#E4E2DD]"
            href="https://twitter.com/py_bash1"
            target="_blank"
          >
            Tweetybird
          </Link>
          <Link
            className="outline-none transition duration-300 ease-in-out hover:text-[#E4E2DD] hover:decoration-[#E4E2DD] focus:text-[#E4E2DD] focus:decoration-[#E4E2DD]"
            href="https://github.com/pybash1"
            target="_blank"
          >
            Octocat
          </Link>
          <Link
            className="outline-none transition duration-300 ease-in-out hover:text-[#E4E2DD] hover:decoration-[#E4E2DD] focus:text-[#E4E2DD] focus:decoration-[#E4E2DD]"
            href="mailto:hi@pybash.xyz"
            target="_blank"
          >
            hi@pybash.xyz
          </Link>
        </nav>
      </div>
      <div className="flex grow flex-col gap-6 pb-8 pt-36 md:px-36 lg:px-96">
        <div className={`text-xl text-[#E4E2DD]/60 ${newsreader.className}`}>
          About
        </div>
        <div>
          Hey, there! Thanks for stopping by. I{" "}
          <span className={`${newsreader.className}`}>craft interfaces</span>{" "}
          for the digital world. I too, obsess over details. As of today, I am
          manipulating designs and code at{" "}
          <Link
            href="https://onrift.xyz"
            className={`underline decoration-1 underline-offset-2 outline-none transition-all duration-500 ease-in-out hover:bg-[#E4E2DD] hover:px-2 hover:py-1 hover:text-[#18181A] focus:bg-[#E4E2DD] focus:px-2 focus:py-1 focus:text-[#18181A] ${newsreader.className}`}
          >
            Rift
          </Link>
          .
        </div>
        <div>
          Earlier, I&apos;ve worked at growing startups such as{" "}
          <span className={newsreader.className}>10Planet</span>, and{" "}
          <span className={newsreader.className}>Authdeck</span>. I have also
          won a couple hackathons and awards here and there.
        </div>
        <div>
          In my leisure, I often build unsuccessful software, or read books.
          Listening to music and watching movies are too, my interests. Some of
          my craft lives on a{" "}
          <Link
            href="/craft"
            className={`underline decoration-1 underline-offset-2 outline-none transition-all duration-500 ease-in-out hover:bg-[#E4E2DD] hover:px-2 hover:py-1 hover:text-[#18181A] focus:bg-[#E4E2DD] focus:px-2 focus:py-1 focus:text-[#18181A] ${newsreader.className}`}
          >
            different page
          </Link>
          . I seldom write, but nevertheless read it on{" "}
          <Link
            href="https://parchments.pybash.xyz"
            className={`underline decoration-1 underline-offset-2 outline-none transition-all duration-500 ease-in-out hover:bg-[#E4E2DD] hover:px-2 hover:py-1 hover:text-[#18181A] focus:bg-[#E4E2DD] focus:px-2 focus:py-1 focus:text-[#18181A] ${newsreader.className}`}
          >
            Parchments
          </Link>
          .
        </div>
        <div className={`text-xl text-[#E4E2DD]/60 ${newsreader.className}`}>
          Now
        </div>
        <div>
          To be very precise,{" "}
          {spotify ? (
            <>
              I am listening to{" "}
              <Link
                href={`https://open.spotify.com/track/${spotify.track_id}`}
                target="_blank"
                className={`underline decoration-1 underline-offset-2 outline-none transition-all duration-500 ease-in-out hover:bg-[#E4E2DD] hover:px-2 hover:py-1 hover:text-[#18181A] focus:bg-[#E4E2DD] focus:px-2 focus:py-1 focus:text-[#18181A] ${newsreader.className}`}
              >
                {spotify.song}
              </Link>{" "}
              by{" "}
              <span className={`${newsreader.className}`}>
                {spotify?.artist?.split(";")?.[0] as string}
              </span>
              .
            </>
          ) : null}{" "}
          {vsc
            ? spotify
              ? `I am also, ${vsc.details
                  ?.replace("editing", "crafting")
                  .replace("Idling", "thinking")} ${
                  vsc.state?.replace("in", "for") ?? ""
                }.`
              : `I am ${vsc.details
                  ?.replace("editing", "crafting")
                  .replace("Idling", "thinking")}${
                  vsc.state?.replace("in", " for") ?? ""
                }.`
            : !spotify
            ? "absolutely nothing productive."
            : null}
        </div>
        <div>
          On a less precise note, this year, I&apos;m juggling between high
          school and my passion. I&apos;m excited to see how the rest of the
          year plays out. You can find a part of my unfiltered thoughts over on
          my{" "}
          <Link
            href="https://streams.place/pybash"
            className={`underline decoration-1 underline-offset-2 outline-none transition-all duration-500 ease-in-out hover:bg-[#E4E2DD] hover:px-2 hover:py-1 hover:text-[#18181A] focus:bg-[#E4E2DD] focus:px-2 focus:py-1 focus:text-[#18181A] ${newsreader.className}`}
          >
            stream
          </Link>
          .
        </div>
        <div className={`text-lg text-[#E4E2DD]/60 ${newsreader.className}`}>
          Chief associates
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0">
          <ContactCard
            name="Aadhithyan Suresh"
            avatar="https://pbs.twimg.com/profile_images/1756057216195735552/jpmsQtbW_400x400.jpg"
            link="https://twitter.com/_soulninja"
          />
          <ContactCard
            name="Shubhaankar Sharma"
            avatar="https://pbs.twimg.com/profile_images/1713836316209868800/nKNnpRy4_400x400.jpg"
            link="https://spongeboi.com"
          />
          <ContactCard
            name="Milind Madhukar"
            avatar="https://pbs.twimg.com/profile_images/1549608791209316352/yKljoNHe_400x400.jpg"
            link="https://github.com/milindmadhukar"
          />
          <ContactCard
            name="Arnav Mehta"
            avatar="https://pbs.twimg.com/profile_images/1542376457233584128/D5X_Qf0t_400x400.jpg"
            link="https://twitter.com/devnull03"
          />
          <ContactCard
            name="Nicole"
            avatar="https://pbs.twimg.com/profile_images/1615412983005421568/yrWiGfZV_400x400.jpg"
            link="https://sofa.sh"
          />
          <ContactCard
            name="Kumar Abhirup"
            avatar="https://pbs.twimg.com/profile_images/1769871138761662464/7Xnquhcf_400x400.jpg"
            link="https://kumareth.com"
          />
          <ContactCard
            name="Milan Muhammed"
            avatar="https://pbs.twimg.com/profile_images/1517105300649955328/hIfJFOyU_400x400.jpg"
            link="https://milan090.me"
          />
          <ContactCard
            name="Vasu"
            avatar="https://cdn.discordapp.com/attachments/883044092030890014/1230507644146552952/c25d20e6020e040bd1394bb1c4c71337.png?ex=6633928c&is=66211d8c&hm=64fd5635e1062cc61d1fc0cefbd57627f63e109a13f317043141c05be94210f2&"
            link="https://github.com/vg08"
          />
          <ContactCard
            name="Saptarshi Basu"
            avatar="https://pbs.twimg.com/profile_images/1777828016988520448/bt5-zI1y_400x400.jpg"
            link="https://saptarshi.vercel.app"
          />
        </div>
      </div>
      <footer className="-mx-8 flex items-center justify-between border-t border-[#313136] px-4 pt-2 text-sm text-[#E4E2DD]/50 md:px-24 lg:px-72">
        <div>Never settle.</div>
        <div>{formatTime(rn)}</div>
      </footer>
    </main>
  );
};

export default Home;
