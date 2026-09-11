import { useEffect, useRef, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export default function InvestigationActions({
  children,
}: {
  children: ReactNode;
}) {
  const root = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node))
        root.current.open = false;
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  return (
    <details
      className="investigation-actions"
      ref={root}
      onKeyDown={(event) => {
        if (event.key === "Escape" && root.current?.open) {
          root.current.open = false;
          root.current.querySelector("summary")?.focus();
          event.stopPropagation();
        }
      }}
    >
      <summary>
        Save & open <ChevronDown size={14} />
      </summary>
      <div
        onClick={(event) => {
          if ((event.target as Element).closest("button") && root.current)
            root.current.open = false;
        }}
      >
        {children}
      </div>
    </details>
  );
}
