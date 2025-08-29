import { Spinner } from "@repo/design/components/spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center">
        <Spinner variant="ring" size="lg" />
        <p className="mt-4 text-muted">Loading...</p>
      </div>
    </div>
  );
}