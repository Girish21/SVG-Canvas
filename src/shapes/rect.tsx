import { useAtom } from "jotai";
import { ShapeComponentType } from "../App";
import { useShapeDrag } from "../utils/use-shape-drag";

export function Rect({ atom, svgRef }: ShapeComponentType) {
  const [{ x, y }] = useAtom(atom);
  const bind = useShapeDrag(atom, svgRef);

  return (
    <rect
      x={x}
      y={y}
      width={50}
      height={50}
      className="fix-gesture"
      fill="red"
      {...bind()}
    />
  );
}
