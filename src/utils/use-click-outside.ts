import * as React from "react";

export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T>,
  enabled: boolean,
  callback: () => void
) {
  React.useEffect(() => {
    if (!enabled) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function clickHandler(e: any) {
      if (ref.current && !ref.current.contains(e.target)) {
        callback();
      }
    }

    document.addEventListener("click", clickHandler);

    return () => {
      document.removeEventListener("click", clickHandler);
    };
  }, [callback, ref, enabled]);
}
