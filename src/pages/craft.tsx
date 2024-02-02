import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { dmSans, otBrutMono, otBrut } from "~/components/fonts";
import type { Lanyard } from "~/types/lanyard";
import { IMAGES } from "~/utils/utils";

const Craft = () => {
  const [status, setStatus] = useState<boolean>();
  const [hovering, setHovering] = useState(-1);

  useEffect(() => {
    void fetch("https://api.lanyard.rest/v1/users/626461325744275464", {
      method: "GET",
    }).then((res) =>
      res
        .json()
        .then((data: Lanyard) =>
          setStatus(
            data.data.active_on_discord_desktop ||
              data.data.active_on_discord_mobile ||
              data.data.active_on_discord_web
          )
        )
    );
  }, []);

  return (
    <main
      className={`flex min-h-screen flex-col gap-2 bg-black bg-cover bg-center text-white selection:bg-white selection:text-black ${otBrutMono.className}`}
    >
      <nav className="flex items-center justify-between gap-6 px-12 py-12 uppercase md:px-24">
        <Link href="/">Home</Link>
        &bull;
        <Link href="https://parchments.pybash.xyz">Writing</Link>
      </nav>
      <div
        className={`flex w-full flex-col items-center justify-center pb-12 pt-10 text-7xl uppercase md:pb-36 md:pt-24 md:text-[10rem] ${otBrut.className}`}
      >
        <span className="text-sm md:leading-10">仕事とプロジェクト</span>
        Craft
        <span
          className={`text-center text-base uppercase md:leading-5 ${dmSans.className}`}
        >
          &bull;&nbsp;My Work&nbsp;&bull;
          <br />
          &bull;&nbsp;Projects&nbsp;&bull;
          <br />
          &bull;&nbsp;Selected Work&nbsp;&bull;
        </span>
      </div>
      <div className="flex w-full flex-col items-center gap-6">
        <div className="px-3 text-center text-lg md:w-[45%] md:px-0 md:text-2xl">
          A selection of my work across startups, clients, personal projects,
          and more, organised randomly, in no specific order.
        </div>
        <span>&bull;×&bull;</span>
      </div>
      <div className={`uppercase ${dmSans.className} px-8`}>Selected Work</div>
      <div className="relative flex flex-col divide-y divide-white border-y border-white text-2xl uppercase md:text-5xl [&>div]:px-8 [&>div]:pt-2">
        <div
          onMouseEnter={() => setHovering(0)}
          onMouseLeave={() => setHovering(-1)}
          className="flex items-center justify-between transition duration-500 ease-in-out hover:text-blue-300"
        >
          {/* this has to be here to avoid a double divide/border on the top visual bug */}
          {hovering > -1 && IMAGES[hovering] ? (
            <Image
              src={IMAGES[hovering] as string}
              width={550}
              height={200}
              alt="project image"
              className="absolute bottom-14 right-28 hidden w-1/3 shadow-2xl md:block"
            />
          ) : null}
          <Link href="https://deva.me" data-type="W">
            Deva.me
          </Link>
          <div>2023-24</div>
        </div>
        <div
          onMouseEnter={() => setHovering(1)}
          onMouseLeave={() => setHovering(-1)}
          className="flex items-center justify-between transition duration-500 ease-in-out hover:text-blue-300"
        >
          <Link href="https://authdeck.xyz" data-type="W">
            Authdeck
          </Link>
          <div>2022-23</div>
        </div>
        <div
          onMouseEnter={() => setHovering(2)}
          onMouseLeave={() => setHovering(-1)}
          className="flex items-center justify-between transition duration-500 ease-in-out hover:text-blue-300"
        >
          <Link href="https://purp.game" data-type="W">
            Purp.game
          </Link>
          <div>2023</div>
        </div>
        <div
          onMouseEnter={() => setHovering(3)}
          onMouseLeave={() => setHovering(-1)}
          className="flex items-center justify-between transition duration-500 ease-in-out hover:text-blue-300"
        >
          <Link href="https://parchments.pybash.xyz" data-type="P">
            Parchments
          </Link>
          <div>2023</div>
        </div>
        <div
          onMouseEnter={() => setHovering(4)}
          onMouseLeave={() => setHovering(-1)}
          className="flex items-center justify-between transition duration-500 ease-in-out hover:text-blue-300"
        >
          <Link href="https://github.com/pybash1/today" data-type="P">
            Today
          </Link>
          <div>2023</div>
        </div>
        <div
          onMouseEnter={() => setHovering(5)}
          onMouseLeave={() => setHovering(-1)}
          className="flex items-center justify-between transition duration-500 ease-in-out hover:text-blue-300"
        >
          <Link href="https://solo.pybash.xyz" data-type="P">
            Solo
          </Link>
          <div>2022</div>
        </div>
        <div
          onMouseEnter={() => setHovering(6)}
          onMouseLeave={() => setHovering(-1)}
          className="flex items-center justify-between transition duration-500 ease-in-out hover:text-blue-300"
        >
          <Link href="https://n0.pybash.xyz" data-type="P">
            n0
          </Link>
          <div>2023</div>
        </div>
        <div
          onMouseEnter={() => setHovering(7)}
          onMouseLeave={() => setHovering(-1)}
          className="flex items-center justify-between transition duration-500 ease-in-out hover:text-blue-300"
        >
          <Link href="https://supertable.fun" data-type="W">
            Supertable
          </Link>
          <div>2023</div>
        </div>
      </div>
      <div
        className={`flex h-screen w-full flex-col items-center justify-center text-center text-6xl uppercase md:text-9xl ${otBrut.className}`}
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

export default Craft;
