import { ArrowDownRight } from "lucide-react";
import { reduceMotion } from "../lib/molecular-style";

export default function ExperimentJump({
  onBeforeJump,
}: {
  onBeforeJump: () => void;
}) {
  return (
    <button
      className="experiment-jump"
      onClick={(event) => {
        const main = event.currentTarget.closest("main");
        onBeforeJump();
        requestAnimationFrame(() => {
          const experiment =
            main?.querySelector<HTMLElement>(".prediction-strip");
          experiment?.focus({ preventScroll: true });
          experiment?.scrollIntoView({
            behavior: reduceMotion() ? "instant" : "smooth",
            block: "center",
          });
        });
      }}
    >
      Binding experiment <ArrowDownRight size={17} />
    </button>
  );
}
