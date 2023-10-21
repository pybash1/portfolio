import { motion } from "framer-motion";
import Link from "next/link";

const Navbar = () => {
  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed bottom-0 right-0 top-0 z-40 flex w-full md:w-2/3 flex-col justify-between bg-[#ff0000] py-24 pl-10 md:pl-24 pr-48 text-right font-['Labil_Grotesk'] text-6xl md:text-8xl text-[#faf5f1] duration-300 ease-in-out"
    >
      <Link href="/work" className="w-fit ml-auto">
        <span className="text-2xl">I</span>Work
      </Link>
      <Link href="/projects" className="w-fit ml-auto">
        <span className="text-2xl">II</span>Projects
      </Link>
      <Link href="/writing" className="w-fit ml-auto">
        <span className="text-2xl">III</span>Writing
      </Link>
      <Link href="/about" className="w-fit ml-auto">
        <span className="text-2xl">IV</span>About
      </Link>
      <div className="text-left text-xl">
        A desk, in India.
        <br />
        <Link href="mailto:hi@pybash.xyz">hi@pybash.xyz</Link>
      </div>
      <div className="absolute bottom-0 right-24 top-0 h-full md:w-[1px] bg-[#faf5f1]"></div>
    </motion.aside>
  );
};

export default Navbar;
