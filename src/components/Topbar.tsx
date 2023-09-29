import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";

interface Props {
  navbar: boolean;
  setNavbar: Dispatch<SetStateAction<boolean>> | ((arg0: boolean) => void);
}

const Topbar = ({ navbar, setNavbar }: Props) => {
  return (
    <div className="absolute left-0 right-0 top-8 flex w-full items-center justify-between px-8">
      <Link
        className="z-[0] text-3xl text-black transition-transform duration-300 hover:rotate-[360deg]"
        href="/"
      >
        *
      </Link>
      <div
        className={`uppercase transition duration-300 ease-in-out ${
          navbar ? "text-white" : "text-black"
        }`}
      >
        Portfolio
      </div>
      <button
        className="group flex flex-col gap-1"
        onClick={() => setNavbar(!navbar)}
      >
        <div
          className={`h-[1.5px] w-10 transition-transform duration-300 ease-in-out ${
            navbar === true ? "-rotate-45 bg-white" : "bg-black"
          }`}
        ></div>
        <div
          className={`h-[1.5px] transition-all duration-300 ease-in-out ${
            navbar === true
              ? "ml-0 w-10 -translate-y-1 rotate-45 bg-white"
              : "ml-5 w-5 bg-black"
          }`}
        ></div>
      </button>
    </div>
  );
};

export default Topbar;
