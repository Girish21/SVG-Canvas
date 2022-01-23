function getCoordinateOnScreen(coordinate: number, position: number) {
  return coordinate - position;
}

function normalize(
  { x, y }: { x: number; y: number },
  _: { clientWidth: number; clientHeight: number },
  svgRect: DOMRect
) {
  const xScreen = getCoordinateOnScreen(x, svgRect.left);
  const yScreen = getCoordinateOnScreen(y, svgRect.top);

  return { x: xScreen, y: yScreen };
}

export { normalize };
