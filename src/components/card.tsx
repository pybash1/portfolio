import Link from "next/link";
import { newsreader } from "./fonts";
import Image from "next/image";

interface ProjectProps {
  title: string;
  description?: string;
  link: `http${"s" | ""}://${string}`;
}

interface ContactProps {
  name: string;
  avatar: `http${"s" | ""}://${string}`;
  link: `http${"s" | ""}://${string}`;
}

export const ProjectCard = ({ link, title, description }: ProjectProps) => {
  return (
    <div className="flex flex-col gap-1">
      <Link
        href={link}
        className="underline decoration-1 underline-offset-2 outline-none transition-all duration-500 ease-in-out hover:bg-[#E4E2DD] hover:px-2 hover:py-1 hover:text-[#18181A] focus:bg-[#E4E2DD] focus:px-2 focus:py-1 focus:text-[#18181A]"
      >
        {title}
      </Link>
      <div className="text-sm text-[#E4E2DD]/60">{description}</div>
    </div>
  );
};

export const ContactCard = ({ name, avatar, link }: ContactProps) => {
  return (
    <Link
      href={link}
      className={`flex items-center gap-2 py-1 outline-none transition-all duration-500 ease-in-out hover:bg-[#E4E2DD] hover:px-2 hover:text-[#18181A] focus:bg-[#E4E2DD] focus:px-2 focus:py-1 focus:text-[#18181A] focus:outline-none ${newsreader.className}`}
    >
      <Image
        src={avatar}
        width={24}
        height={24}
        alt="avatar"
        className="h-5 w-5 rounded-full"
      />
      <div className="underline decoration-1 underline-offset-2">{name}</div>
    </Link>
  );
};
