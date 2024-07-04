import Link from "next/link";
import Image from "next/image";

export type Month =
  | "Jan"
  | "Feb"
  | "Mar"
  | "Apr"
  | "May"
  | "Jun"
  | "Jul"
  | "Aug"
  | "Sep"
  | "Oct"
  | "Nov"
  | "Dec";

interface ProjectProps {
  title: string;
  description?: string;
  link: `http${"s" | ""}://${string}`;
  start: `${Month} '${number}`;
  end: `${Month} '${number}` | "Coming soon";
  screenshot: string;
  type?: "web" | "mobile" | "other";
}

export const ProjectCard = ({
  link,
  title,
  description,
  start,
  end,
  screenshot,
  type = "web",
}: ProjectProps) => {
  return (
    <Link
      href={link}
      className="flex max-w-80 flex-col gap-3 rounded-2xl border border-white/10 p-6 transition duration-300 ease-in-out hover:border-transparent hover:bg-white/10"
    >
      <span>{title}</span>
      <span className="text-white/55">
        {start} &rarr; {end}
      </span>
      <span>{description}</span>
      <Image
        src={`/screenshots/${screenshot}.png`}
        alt={screenshot}
        width={type === "mobile" ? 1080 : 720}
        height={type === "mobile" ? 720 : 1080}
        className={`object-cover ${
          type === "mobile" ? "-mt-20 h-72 w-36" : type === "other" ? "h-48 -mb-8" : "-mt-24 h-72 w-full"
        }`}
      />
    </Link>
  );
};
