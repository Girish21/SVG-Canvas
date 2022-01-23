import { useDrag } from "@use-gesture/react";
import { useAtom } from "jotai";
import React from "react";
import { readViewport, StateAtomType } from "../App";
import { normalize } from "./normalize-svg-coords";

export function useShapeDrag(
  atom: StateAtomType,
  svgRef: React.RefObject<SVGSVGElement>
) {
  const [{ x: px, y: py }, set] = useAtom(atom);
  const [{ height, width }] = useAtom(readViewport);

  const boundingRect = React.useRef<DOMRect | null>(null);
  const positionDiff = React.useRef<{ x: number; y: number } | null>(null);
  const initialCoordinate = React.useRef<{ x: number; y: number } | null>(null);

  const bind = useDrag(({ xy: [x, y], first, last, event, active }) => {
    if (active) {
      document.documentElement.style.cursor = "grabbing";
    }
    if (!active) {
      document.documentElement.style.cursor = "default";
    }
    event.stopPropagation();
    if (first) {
      boundingRect.current = svgRef.current?.getBoundingClientRect() ?? null;
      positionDiff.current = normalize(
        { x, y },
        { clientHeight: height, clientWidth: width },
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        boundingRect.current!
      );
      initialCoordinate.current = { x: px, y: py };
    }

    if (
      !boundingRect.current ||
      !positionDiff.current ||
      !initialCoordinate.current
    ) {
      return;
    }

    const { x: svgX, y: svgY } = normalize(
      { x, y },
      { clientHeight: height, clientWidth: width },
      boundingRect.current
    );

    set({
      x: svgX - positionDiff.current.x + initialCoordinate.current.x,
      y: svgY - positionDiff.current.y + initialCoordinate.current.y,
    });

    if (last) {
      boundingRect.current = null;
      positionDiff.current = null;
      initialCoordinate.current = null;
    }
  });

  return bind;
}
