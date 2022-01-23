import { useAtom } from "jotai";
import { ShapeComponentType, writeSelectedShape } from "../App";
import { useShapeDrag } from "../utils/use-shape-drag";

export function Circle({ atom, svgRef }: ShapeComponentType) {
  const [{ x, y }] = useAtom(atom);
  const [, setSelectedShape] = useAtom(writeSelectedShape);
  const bind = useShapeDrag(atom, svgRef);

  const selectShape: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    setSelectedShape(atom);
  };

  return (
    <circle
      cx={x}
      cy={y}
      r={50}
      fill="blue"
      className="fix-gesture"
      onClick={selectShape}
      {...bind()}
    />
  );
}
