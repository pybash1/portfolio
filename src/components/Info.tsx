import { useAtomValue } from "jotai";
import { selectedItemAtom } from "../lib/stores";
import { ITEMS } from "../lib/utils";

const Info = () => {
  const selectedItem = useAtomValue(selectedItemAtom);

  if (!selectedItem) return null;

  return (
    <div className="text-justify text-xs sm:flex sm:w-full sm:max-w-md sm:flex-col sm:gap-3 sm:pr-20">
      <div className="hidden items-center justify-between sm:flex">
        <span className="text-white/60">Role</span>{" "}
        {ITEMS[selectedItem as keyof typeof ITEMS].role}
      </div>
      <div className="hidden items-center justify-between sm:flex">
        <span className="text-white/60">Year</span>{" "}
        {ITEMS[selectedItem as keyof typeof ITEMS].year}
      </div>
      <div>{ITEMS[selectedItem as keyof typeof ITEMS]?.description}</div>
    </div>
  );
};

export default Info;
