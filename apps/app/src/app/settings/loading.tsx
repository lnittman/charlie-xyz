import { AnimatedDotIcon } from "@/components/animated-dot-icon";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#010101] flex items-center justify-center">
      <div className="text-center">
        <AnimatedDotIcon pattern="sync" size={48} active />
        <p className="mt-4 text-gray-400 font-mono text-sm">Loading settings...</p>
      </div>
    </div>
  );
}