import { h, render } from "./web_modules/preact.js";
import * as Hooks from "./web_modules/preact/hooks.js";
import htm from "./web_modules/htm.js";

const html = htm.bind(h);

function last(array) {
  return array[array.length - 1];
}

// thank dan
function useInterval(delay, callback) {
  const savedCallback = Hooks.useRef();

  // Remember the latest callback.
  Hooks.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  Hooks.useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// const INITIAL_COORDS = [[2, 4], [3, 4], [4, 4], [5, 4]];
const INITIAL_COORDS = Array.from({ length: 10 }, (_, i) => [2 + i, 4]);

function Board({ size = 32, children }) {
  const [coords, setCoords] = Hooks.useState(INITIAL_COORDS);
  const [dir, setDir] = Hooks.useState("right");
  const [game, setGame] = Hooks.useState("running");
  useInterval(2000, () => {
    const max = size + 1; // css grid isn't 0 indexed
    const forward = ["down", "right"].includes(dir);
    const vertical = ["up", "down"].includes(dir);
    const inc = x => (forward ? (x + 1) % max : (x - 1 + max) % max);
    const moveSnek = ([x, y]) => (vertical ? [x, inc(y)] : [inc(x), y]);
    const snekHead = last(coords);
    const newHead = moveSnek(snekHead);
    const newCoords = coords.concat([newHead]).slice(1);
    const clash = coords.some(([x, y]) => x === newHead[0] && y === newHead[1]);
    if (clash) setGame("finished");
    setCoords(clash ? coords : newCoords);
  });
  // Hooks.useLayoutEffect(() => {
  //   console.log(dir);
  // }, [dir]);
  Hooks.useEffect(() => {
    function handleKeyDown(event) {
      event.preventDefault();
      switch (event.key) {
        case "ArrowUp":
          return setDir(prev => (prev === "down" ? "down" : "up"));
        case "ArrowRight":
          return setDir(prev => (prev === "left" ? "left" : "right"));
        case "ArrowDown":
          return setDir(prev => (prev === "up" ? "up" : "down"));
        case "ArrowLeft":
          return setDir(prev => (prev === "right" ? "right" : "left"));
        default:
          return;
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
  return html`
    <div>
      <mark>${dir}</mark>
      <mark>${game === "finished" ? "Dead" : " Playing"}</mark>
      <ul
        style=${{
          maxWidth: "50rem",
          maxHeight: "50rem",
          width: "90vw",
          height: "90vw",
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
          outline: "1px solid",
        }}
      >
        ${coords.map(
          ([x, y], i) =>
            html`
              <li
                key=${i}
                style=${{
                  gridRowStart: y,
                  gridColumnStart: x,
                  backgroundColor:
                    i === coords.length - 1 && game === "finished"
                      ? "red"
                      : "#000",
                }}
              ></li>
            `
        )}
      </ul>
    </div>
  `;
}

function App() {
  return html`
    <${Board} />
  `;
}

render(
  html`
    <${App} />
  `,
  root
);
