import { FlightSearchApp } from "@/components/flight-search-app";

export default function Home() {
  return (
    <main className="relative min-h-full flex-1 overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(56,189,248,0.28),transparent_55%),radial-gradient(900px_500px_at_90%_0%,rgba(14,165,233,0.18),transparent_50%),linear-gradient(180deg,#f0f9ff_0%,#f8fafc_42%,#eef6fb_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] [background-image:linear-gradient(rgba(14,116,144,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(14,116,144,0.05)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_35%,transparent_75%)]"
      />
      <FlightSearchApp />
    </main>
  );
}
