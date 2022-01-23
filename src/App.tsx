import * as React from "react";
import { useRect } from "@reach/rect";
import { useGesture } from "@use-gesture/react";
import { atom, useAtom, WritableAtom } from "jotai";
import { normalize } from "./utils/normalize-svg-coords";
import { Rect } from "./shapes/rect";
import { Circle } from "./shapes/circle";

type ShapeData = {
  x: number;
  y: number;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StateAtomType = WritableAtom<ShapeData, ShapeData, any>;
type ShapeComponentType = {
  svgRef: React.RefObject<SVGSVGElement>;
  atom: StateAtomType;
};
type Shape = React.ComponentType<ShapeComponentType>;
type ShapeState = {
  dataAtom: StateAtomType;
  Comp: Shape;
};

const primaryDevice = atom({
  isTrackpad: true,
  isMobile: false,
  detected: false,
});
const readPrimaryDevice = atom((get) => get(primaryDevice));
const writePrimaryDevice = atom(null, (_, set, { isTrackpad, isMobile }) => {
  set(primaryDevice, { isTrackpad, isMobile, detected: true });
});

const viewbox = atom({ width: 0, height: 0, x: 0, y: 0 });
const readViewbox = atom((get) => get(viewbox));
const readViewport = atom((get) => ({
  width: get(viewbox).width,
  height: get(viewbox).height,
}));
const writeViewboxDimensions = atom(null, (get, set, value) => {
  set(viewbox, {
    ...get(viewbox),
    ...(value as { width: number; height: number }),
  });
});
const writeViewboxPoisiton = atom(
  null,
  (get, set, position: { x: number; y: number }) => {
    set(viewbox, {
      ...get(viewbox),
      ...position,
    });
  }
);

const shapes = atom<ShapeState[]>([]);
const readShapes = atom((get) => get(shapes));
const writeShapes = atom(null, (get, set, value) => {
  set(shapes, [...get(shapes), value as ShapeState]);
});

const selectedShape = atom<StateAtomType | null>(null);
const readSelectedShape = atom((get) => get(selectedShape));
const writeSelectedShape = atom(null, (_, set, value) =>
  set(selectedShape, value as StateAtomType)
);

function Shapes({ svgRef }: { svgRef: React.RefObject<SVGSVGElement> }) {
  const [$shapes] = useAtom(readShapes);

  return (
    <>
      {$shapes.map((atom) => (
        <atom.Comp
          key={`${atom.dataAtom}`}
          atom={atom.dataAtom}
          svgRef={svgRef}
        />
      ))}
    </>
  );
}

function Background() {
  const [{ height, width, x, y }] = useAtom(readViewbox);

  return <rect x={x} y={y} width={width} height={height} fill="#333" />;
}

function Toolbar() {
  const [{ height, width, x, y }] = useAtom(readViewbox);
  const [, setShapes] = useAtom(writeShapes);

  const getOrigin = () => {
    const calculatedX =
      // when the canvas is panned,
      // take account for the panned distance
      (width + x) / 2 +
      // compensate for the panned distance
      x / 2;
    const calculatedY = (height + y) / 2 + y / 2;

    return { x: calculatedX, y: calculatedY };
  };

  const addRect = () => {
    const { x, y } = getOrigin();

    setShapes({
      Comp: Rect,
      dataAtom: atom<ShapeData>({
        x,
        y,
      }),
    } as ShapeState);
  };

  const addCircle = () => {
    const { x, y } = getOrigin();

    setShapes({
      Comp: Circle,
      dataAtom: atom<ShapeData>({
        x,
        y,
      }),
    } as ShapeState);
  };

  return (
    <div className="toolbar">
      <button onClick={addRect}>Rectangle</button>
      <button onClick={addCircle}>Circle</button>
    </div>
  );
}

function SelectedShape() {
  const [shape] = useAtom(readSelectedShape);

  return <div className="fixed">{`${shape}`}</div>;
}

function DetectprimaryDevice() {
  const [, set] = useAtom(writePrimaryDevice);

  React.useEffect(() => {
    const isMobile = window.matchMedia("(hover: none)").matches;

    if (isMobile) {
      set({ isMobile, isTrackpad: false });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function detectTrackPad(e: any) {
      let isTrackpad = false;
      if (e.wheelDeltaY) {
        if (Math.abs(e.wheelDeltaY) !== 120) {
          isTrackpad = true;
        }
      } else if (e.deltaMode === 0) {
        isTrackpad = true;
      }

      set({ isTrackpad, isMobile: false });

      document.removeEventListener("mousewheel", detectTrackPad);
      document.removeEventListener("DOMMouseScroll", detectTrackPad);
    }

    document.addEventListener("mousewheel", detectTrackPad, false);
    document.addEventListener("DOMMouseScroll", detectTrackPad, false);

    return () => {
      document.removeEventListener("mousewheel", detectTrackPad);
      document.removeEventListener("DOMMouseScroll", detectTrackPad);
    };
  }, [set]);

  return null;
}

function App() {
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const boundingRect = React.useRef<DOMRect | null>(null);
  const positionDiff = React.useRef<{ x: number; y: number } | null>(null);
  const initialCoordinate = React.useRef<{ x: number; y: number } | null>(null);

  const [{ detected, isTrackpad, isMobile }] = useAtom(readPrimaryDevice);
  const [{ height, width, x: minX, y: minY }] = useAtom(readViewbox);
  const [, setDimensions] = useAtom(writeViewboxDimensions);
  const [, setPosition] = useAtom(writeViewboxPoisiton);
  const [, setSelectedShape] = useAtom(writeSelectedShape);

  useRect(overlayRef, {
    onChange: (rect) => {
      setDimensions({ width: rect.width, height: rect.height });
    },
  });

  React.useEffect(() => {
    function handler() {
      setSelectedShape(null);
    }
    document.addEventListener("click", handler);
    return () => {
      document.removeEventListener("click", handler);
    };
  }, [setSelectedShape]);

  const bind = useGesture(
    {
      onWheel: ({ movement: [x, y], first, last, event }) => {
        event.stopPropagation();
        if (first) {
          boundingRect.current =
            svgRef.current?.getBoundingClientRect() ?? null;
          initialCoordinate.current = { x: minX, y: minY };
        }

        if (!boundingRect.current || !initialCoordinate.current) {
          return;
        }

        setPosition({
          x: initialCoordinate.current.x + x,
          y: initialCoordinate.current.y + y,
        });

        if (last) {
          boundingRect.current = null;
          initialCoordinate.current = null;
        }
      },
      onDrag: ({ xy: [x, y], first, last, active }) => {
        if (isTrackpad) {
          return;
        }
        if (active) {
          document.documentElement.style.cursor = "grabbing";
        }
        if (!active) {
          document.documentElement.style.cursor = "default";
        }
        if (first) {
          boundingRect.current =
            svgRef.current?.getBoundingClientRect() ?? null;
          positionDiff.current = normalize(
            { x, y },
            { clientWidth: width, clientHeight: height },
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            boundingRect.current!
          );
          initialCoordinate.current = { x: minX, y: minY };
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
          { clientWidth: width, clientHeight: height },
          boundingRect.current
        );

        setPosition({
          x: -(svgX - positionDiff.current.x - initialCoordinate.current.x),
          y: -(svgY - positionDiff.current.y - initialCoordinate.current.y),
        });

        if (last) {
          boundingRect.current = null;
          positionDiff.current = null;
          initialCoordinate.current = null;
        }
      },
    },
    {
      drag: { enabled: detected && (!isTrackpad || isMobile) },
      wheel: {
        enabled: detected && isTrackpad && !isMobile,
      },
    }
  );

  return (
    <>
      <div ref={overlayRef} className="canvas-overlay" />
      <DetectprimaryDevice />
      <Toolbar />
      <SelectedShape />
      <svg
        ref={svgRef}
        viewBox={`${minX} ${minY} ${width} ${height}`}
        className="fix-gesture"
        fill="transparent"
        onClick={() => setSelectedShape(null)}
        {...bind()}
      >
        <Background />
        <Shapes svgRef={svgRef} />
      </svg>
    </>
  );
}

export type { StateAtomType, ShapeComponentType };
export { readViewbox, readViewport, readSelectedShape, writeSelectedShape };

export default App;
