import { useAtomValue } from "jotai";
import { selectedItemAtom } from "../lib/stores";
import { ITEMS } from "../lib/utils";

const Info = () => {
  const selectedItem = useAtomValue(selectedItemAtom);

  if (!selectedItem) return null;

  return (
    <div className="flex w-full max-w-md flex-col gap-3 pr-20 text-justify text-xs">
      <div className="flex items-center justify-between">
        <span className="text-white/60">Role</span>{" "}
        {ITEMS[selectedItem as keyof typeof ITEMS].role}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white/60">Year</span>{" "}
        {ITEMS[selectedItem as keyof typeof ITEMS].year}
      </div>
      <div>{ITEMS[selectedItem as keyof typeof ITEMS]?.description}</div>
    </div>
  );
};

export default Info;
