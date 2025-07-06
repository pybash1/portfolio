import { useSetAtom } from "jotai";
import type { ReactNode } from "react";
import { selectedItemAtom } from "../lib/stores";

interface Props {
  href: string;
  item: string;
  children: ReactNode;
}

const Link = ({ href, item, children }: Props) => {
  const setSelectedItem = useSetAtom(selectedItemAtom);

  return (
    <a
      href={href}
      className="w-fit transition-colors duration-500 ease-in-out hover:bg-white hover:text-black"
      onMouseEnter={() => setSelectedItem(item)}
      onMouseLeave={() => setSelectedItem("")}
      target="_blank"
    >
      {children}
    </a>
  );
};

export default Link;
