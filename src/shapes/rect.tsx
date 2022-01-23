/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as React from "react";
import { useAtom } from "jotai";
import { ShapeComponentType, writeSelectedShape } from "../App";
import { useShapeDrag } from "../utils/use-shape-drag";

export function Rect({ atom, svgRef }: ShapeComponentType) {
  const [{ x, y }] = useAtom(atom);
  const [, setSelectedShape] = useAtom(writeSelectedShape);

  const elementRef = React.useRef<SVGRectElement | null>(null);

  const bind = useShapeDrag(atom, svgRef);

  const selectShape: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    setSelectedShape(atom);
  };

  return (
    <rect
      ref={elementRef}
      x={x}
      y={y}
      width={50}
      height={50}
      className="fix-gesture"
      fill="red"
      onClick={selectShape}
      {...bind()}
    />
  );
}
