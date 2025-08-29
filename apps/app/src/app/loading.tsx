import { AnimatedDotIcon } from "@/components/animated-dot-icon";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#010101] flex items-center justify-center z-50">
      <AnimatedDotIcon pattern="sync" size={48} active />
    </div>
  );
}