import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";

const Stream: NextPage = () => {
  const { data: posts } = api.posts.getPosts.useQuery();

  return (
    <>
      <Head>
        <title>my stream</title>
        <meta
          name="description"
          content="my everyday thoughts, updates, rants, and much more! oh, and pls keep this a secret!"
        />
        <link
          rel="icon"
          href="https://cdn.discordapp.com/avatars/626461325744275464/9b8baa867dcbb45519996adb9397d7f4.png?size=4096"
        />
      </Head>
      <div className="min-h-screen flex-col justify-center gap-10 bg-black px-24 py-20 font-['Labil_Grotesk'] text-lg text-white md:flex">
        <Link
          href="/"
          className="pb-8 transition duration-200 ease-in-out hover:opacity-75"
        >
          &larr; Back
        </Link>
        {posts?.map((post) => (
          <div key={post?.timestamp} className="flex flex-row gap-10">
            <div className="flex flex-col gap-1">
              <div className="text-base">
                {new Date(post?.timestamp).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-400">
                {new Date(post?.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <div
              dangerouslySetInnerHTML={{ __html: post?.html }}
              className="w-1/2 whitespace-pre-wrap text-base"
            ></div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Stream;
