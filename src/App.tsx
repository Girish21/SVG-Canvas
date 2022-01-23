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
  const [_, setShapes] = useAtom(writeShapes);

  const addRect = () => {
    setShapes({
      Comp: Rect,
      dataAtom: atom<ShapeData>({ x: 20, y: 20 }),
    } as ShapeState);
  };

  const addCircle = () => {
    setShapes({
      Comp: Circle,
      dataAtom: atom<ShapeData>({ x: 20, y: 20 }),
    } as ShapeState);
  };

  return (
    <div className="toolbar">
      <button onClick={addRect}>Rectangle</button>
      <button onClick={addCircle}>Circle</button>
    </div>
  );
}

function DetectprimaryDevice() {
  const [_, set] = useAtom(writePrimaryDevice);

  React.useEffect(() => {
    const isMobile = window.matchMedia("(hover: none)").matches;

    if (isMobile) {
      set({ isMobile, isTrackpad: false });
      return;
    }

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
  }, []);

  return null;
}

function App() {
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const svgPointRef = React.useRef<DOMPoint | null>(null);
  const boundingRect = React.useRef<DOMRect | null>(null);
  const positionDiff = React.useRef<{ x: number; y: number } | null>(null);
  const initialCoordinate = React.useRef<{ x: number; y: number } | null>(null);

  const [{ detected, isTrackpad, isMobile }] = useAtom(readPrimaryDevice);
  const [{ height, width, x: minX, y: minY }] = useAtom(readViewbox);
  const [_, setDimensions] = useAtom(writeViewboxDimensions);
  const [__, setPosition] = useAtom(writeViewboxPoisiton);

  useRect(overlayRef, {
    onChange: (rect) => {
      setDimensions({ width: rect.width, height: rect.height });
    },
    observe: true,
  });

  const bind = useGesture(
    {
      onWheel: ({
        movement: [x, y],
        delta: [_, dy],
        ctrlKey,
        metaKey,
        first,
        last,
        event,
      }) => {
        event.stopPropagation();
        if (first) {
          boundingRect.current =
            svgRef.current?.getBoundingClientRect() ?? null;
          initialCoordinate.current = { x: minX, y: minY };
          svgPointRef.current = svgRef.current?.createSVGPoint() ?? null;
          svgPointRef.current!.x = event.clientX;
          svgPointRef.current!.y = event.clientY;
        }

        if (
          !boundingRect.current ||
          !initialCoordinate.current ||
          !svgPointRef.current ||
          !svgRef.current ||
          isMobile ||
          (!isTrackpad && !(ctrlKey && metaKey))
        ) {
          return;
        }

        if (ctrlKey || metaKey) {
          const normalised = -(dy % 3 ? dy * 10 : dy / 3);
          const scaleDelta = normalised > 0 ? 1 / 1.3 : 1.3;
          const startPoint = svgPointRef.current.matrixTransform(
            svgRef.current.getScreenCTM()?.inverse()
          );
          setPosition({
            x: minX - (startPoint.x - minX) * (scaleDelta - 1),
            y: minY - (startPoint.y - minY) * (scaleDelta - 1),
          });
          setDimensions({
            width: width * scaleDelta,
            height: height * scaleDelta,
          });
          return;
        }

        setPosition({
          x: initialCoordinate.current.x - x,
          y: initialCoordinate.current.y - y,
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
        axis: "lock",
        enabled: detected && !isMobile,
      },
    }
  );

  return (
    <>
      <div ref={overlayRef} className="canvas-overlay" />
      <DetectprimaryDevice />
      <Toolbar />
      <svg
        ref={svgRef}
        viewBox={`${minX} ${minY} ${width} ${height}`}
        className="fix-gesture"
        fill="transparent"
        {...bind()}
      >
        <Background />
        <Shapes svgRef={svgRef} />
      </svg>
    </>
  );
}

export type { StateAtomType, ShapeComponentType };
export { readViewbox, readViewport };

export default App;
