import { useEffect } from "react";

/**
 * Global D-pad focus engine: arrow keys move focus between visible `.focusable`
 * elements (wrap-around), Enter activates, Escape calls onBack. Mirrors the
 * Meta glasses input model (Neural Band / captouch → arrow keys + select).
 */
export function useDpad(onBack?: () => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>(".focusable:not([disabled])"),
      ).filter((el) => el.offsetParent !== null);
      const i = focusables.indexOf(document.activeElement as HTMLElement);

      switch (e.key) {
        case "ArrowUp":
        case "ArrowLeft":
          if (focusables.length) {
            focusables[i > 0 ? i - 1 : focusables.length - 1].focus();
            e.preventDefault();
          }
          break;
        case "ArrowDown":
        case "ArrowRight":
          if (focusables.length) {
            focusables[i >= 0 && i < focusables.length - 1 ? i + 1 : 0].focus();
            e.preventDefault();
          }
          break;
        case "Enter":
          if (
            document.activeElement instanceof HTMLElement &&
            document.activeElement.classList.contains("focusable")
          ) {
            document.activeElement.click();
            e.preventDefault();
          }
          break;
        case "Escape":
          onBack?.();
          e.preventDefault();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack]);
}
