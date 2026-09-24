import { type Categoria, categoriaLabel, categoriaEmoji } from "@/lib/cafe";

interface CategoryTabsProps {
  activa: Categoria | "todas";
  onChange: (cat: Categoria | "todas") => void;
}

export function CategoryTabs({ activa, onChange }: CategoryTabsProps) {
  const categorias: (Categoria | "todas")[] = ["todas", "cafe", "fria", "reposteria", "snack"];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
      {categorias.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm whitespace-nowrap transition-all shadow-[2px_2px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
            activa === cat
              ? "bg-brand text-cream"
              : "bg-white text-ink hover:bg-ink/5"
          }`}
        >
          {cat === "todas" ? (
            "🍽️ Todo"
          ) : (
            <>
              <span>{categoriaEmoji[cat]}</span>
              {categoriaLabel[cat]}
            </>
          )}
        </button>
      ))}
    </div>
  );
}
