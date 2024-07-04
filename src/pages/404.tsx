import type { NextPage } from "next";
import Image from "next/image";
import { dmSans } from "~/components/fonts";
import { useEffect, useState } from "react";
import { type GitHubCommitsResponse, getLastModified } from "~/utils/github";
import Link from "next/link";

const NotFound: NextPage = () => {
  const [githubCommits, setGitHubCommits] = useState<GitHubCommitsResponse>([]);

  useEffect(() => {
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
      </div>
      <div className="flex w-96 flex-col gap-6 py-12">
        <div className="flex flex-col gap-1">
          <div className="text-white/55">Not Found</div>
          <div>
            You&apos;ve tripped and fell onto a broken link. Or you mistyped the
            URL. Either way, let&apos;s get you{" "}
            <Link
              href="/"
              className="text-white/55 underline underline-offset-2 hover:text-white"
            >
              home now
            </Link>
            .
          </div>
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

export default NotFound;
