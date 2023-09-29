import { motion } from "framer-motion";
import Link from "next/link";

const Navbar = () => {
  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed bottom-0 right-0 top-0 flex w-2/3 flex-col justify-between bg-[#ff0000] py-24 pl-24 pr-48 text-right font-['Labil_Grotesk'] text-8xl text-[#faf5f1] duration-300 ease-in-out"
    >
      <aside className="fixed bottom-0 left-0 top-0 z-10 h-full w-1/3 backdrop-blur-md"></aside>
      <Link href="/work">
        <span className="text-2xl">I</span>Work
      </Link>
      <Link href="/projects">
        <span className="text-2xl">II</span>Projects
      </Link>
      <Link href="/writing">
        <span className="text-2xl">III</span>Writing
      </Link>
      <Link href="/about">
        <span className="text-2xl">IV</span>About
      </Link>
      <div className="text-left text-xl">
        A desk, in India.
        <br />
        <Link href="mailto:hi@pybash.xyz">hi@pybash.xyz</Link>
      </div>
      <div className="absolute bottom-0 right-24 top-0 h-full w-[1px] bg-[#faf5f1]"></div>
    </motion.aside>
  );
};

export default Navbar;
