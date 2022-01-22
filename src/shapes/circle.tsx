import { useAtom } from "jotai";
import { ShapeComponentType } from "../App";
import { useShapeDrag } from "../utils/use-shape-drag";

export function Circle({ atom, svgRef }: ShapeComponentType) {
  const [{ x, y }] = useAtom(atom);
  const bind = useShapeDrag(atom, svgRef);

  return (
    <circle
      cx={x}
      cy={y}
      r={50}
      fill="blue"
      className="fix-gesture"
      {...bind()}
    />
  );
}
