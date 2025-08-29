import { AnimatedDotIcon } from "@/components/animated-dot-icon";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#010101] flex items-center justify-center">
      <AnimatedDotIcon pattern="sync" size={48} active />
    </div>
  );
}