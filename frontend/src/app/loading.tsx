import { CgSpinnerTwo } from "react-icons/cg";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen">
      <CgSpinnerTwo className="animate-spin text-6xl" />
    </div>
  );
}
