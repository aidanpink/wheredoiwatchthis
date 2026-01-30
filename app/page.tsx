import { SearchBar } from "@/components/search/SearchBar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-50">
            Where do I watch...
          </h1>
          <p className="text-lg text-zinc-400">
            Find where to stream, rent, or buy your favorite movies and shows
          </p>
        </header>
        <SearchBar />
      </div>
    </div>
  );
}
