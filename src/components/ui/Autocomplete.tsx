"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
}

interface AutocompleteProps {
  label?: string;
  placeholder?: string;
  selected: AutocompleteOption[];
  onSelectedChange: (options: AutocompleteOption[]) => void;
  onSearch: (query: string) => Promise<AutocompleteOption[]>;
  debounceMs?: number;
}

export default function Autocomplete({
  label,
  placeholder = "Tìm kiếm...",
  selected,
  onSelectedChange,
  onSearch,
  debounceMs = 300,
}: AutocompleteProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const selectedValues = new Set(selected.map((s) => s.value));

  const filteredOptions = options.filter((o) => !selectedValues.has(o.value));

  const doSearch = useCallback(
    async (term: string) => {
      setLoading(true);
      try {
        const results = await onSearch(term);
        setOptions(results);
        setActiveIndex(-1);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [onSearch],
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query.trim()) {
      setOptions([]);
      return;
    }

    timerRef.current = setTimeout(() => doSearch(query), debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs, doSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addOption(option: AutocompleteOption) {
    onSelectedChange([...selected, option]);
    setQuery("");
    setOptions([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeOption(value: string) {
    onSelectedChange(selected.filter((s) => s.value !== value));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !query && selected.length > 0) {
      removeOption(selected[selected.length - 1].value);
      return;
    }

    if (!open || filteredOptions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) =>
        i < filteredOptions.length - 1 ? i + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        i > 0 ? i - 1 : filteredOptions.length - 1,
      );
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      addOption(filteredOptions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div
        className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 px-2 py-1.5 shadow-sm transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((item) => (
          <span
            key={item.value}
            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-sm font-medium text-blue-700"
          >
            {item.label}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeOption(item.value);
              }}
              className="ml-0.5 rounded text-blue-400 hover:text-blue-600"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? placeholder : ""}
          className="min-w-[80px] flex-1 border-none bg-transparent py-0.5 text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {open && (query.trim() || loading) && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-400">
              Đang tìm...
            </div>
          )}

          {!loading && filteredOptions.length === 0 && query.trim() && (
            <div className="px-3 py-2 text-sm text-gray-400">
              Không tìm thấy
            </div>
          )}

          {!loading &&
            filteredOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => addOption(option)}
                className={`flex w-full flex-col px-3 py-2 text-left text-sm transition-colors ${
                  index === activeIndex
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="font-medium">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-gray-400">
                    {option.description}
                  </span>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
