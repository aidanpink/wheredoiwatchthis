import { SearchBar } from "@/components/search/SearchBar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center px-4 pt-64">
      <div className="w-full max-w-2xl">
        <SearchBar />
      </div>
    </div>
  );
}
