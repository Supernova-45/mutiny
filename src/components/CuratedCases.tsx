export default function CuratedCases({
  selected,
  onSelect,
}: {
  selected: "hhat" | "kras";
  onSelect: (id: "hhat" | "kras") => void;
}) {
  return (
    <div
      className="curated-cases"
      role="group"
      aria-label="Cancer mutation examples"
    >
      <button
        aria-pressed={selected === "hhat"}
        onClick={() => onSelect("hhat")}
      >
        HHAT <span>L75F</span>
      </button>
      <button
        aria-pressed={selected === "kras"}
        onClick={() => onSelect("kras")}
      >
        KRAS <span>G12D</span>
      </button>
    </div>
  );
}
