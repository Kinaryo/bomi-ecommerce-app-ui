"use client";

import { Search } from "lucide-react";
import { useState, ChangeEvent, KeyboardEvent } from "react";

interface SearchBarProps {
  value: string;
  onSearch: (value: string) => void;
}

export default function SearchBar({ value, onSearch }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSearch = () => {
    onSearch(inputValue);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="flex items-center gap-2 rounded-md ring-1 ring-gray-300 px-3 py-3 shadow-md xl:w-full sm:w-64">
      <Search className="w-4 h-4 text-gray-500 flex-shrink-0 -translate-y-px" />
      <input
        type="text"
        placeholder="Pencarian Produk..."
        className="text-sm outline-none w-full"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
      />
      <button
        onClick={handleSearch}
        className="bg-blue-400 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
      >
        Cari
      </button>
    </div>
  );
}
