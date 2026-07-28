export default function SiteHeader() {
  return (
    <header
      id="main-header"
      className="fixed top-0 left-0 w-full z-50 px-4 md:px-8 py-4 border-b border-white/6 bg-bg/70 backdrop-blur-sm"
    >
      <nav className="grid grid-cols-2 md:grid-cols-5 font-mono text-white text-[11px] tracking-[0.14em] items-center uppercase">
        <div className="opacity-70">
          <span className="text-accent mr-1">&gt;</span>
          Ananjan Mitra
        </div>
        <div className="hidden md:block text-center opacity-40 hover:opacity-90 transition-opacity duration-300">
          <a href="https://github.com/pybash1" target="_blank" rel="noreferrer" className="group">
            GitHub <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
          </a>
        </div>
        <div className="hidden md:block text-center opacity-40 hover:opacity-90 transition-opacity duration-300">
          <a href="https://instagram.com/ananjan_" target="_blank" rel="noreferrer" className="group">
            Instagram <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
          </a>
        </div>
        <div className="hidden md:block text-center opacity-40 hover:opacity-90 transition-opacity duration-300">
          <a href="https://x.com/py_bash1" target="_blank" rel="noreferrer" className="group">
            Twitter <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
          </a>
        </div>
        <div className="text-right opacity-30 text-[10px]">&copy; 2026</div>
      </nav>
    </header>
  );
}
