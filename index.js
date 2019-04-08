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

// type State = {
//   game: "initial" | "running" | "paused" | "dead",
//   dir: "up" | "right" | "down" | "left",
//   coords: Array<[number, number]>
// }

const opposite = {
  up: "down",
  right: "left",
  down: "up",
  left: "right"
};

function init(initState) {
  const INITIAL_COORDS = Array.from({ length: 10 }, (_, i) => [2 + i, 4]);
  return {
    game: "initial",
    dir: "right",
    coords: INITIAL_COORDS
  };
}

function reducer(state, action) {
  console.log(action);
  switch (action.type) {
    case "RESET":
      return init();
    case "START":
      console.log({ ...state, game: "running" });
      return { ...state, game: "running" };
    case "PAUSE":
      return { ...state, game: "paused" };
    case "TURN":
      return {
        ...state,
        dir:
          action.payload.dir === opposite[state.dir]
            ? state.dir
            : action.payload.dir
      };
    case "TICK":
      return {
        game: action.payload.clash ? "dead" : "running",
        dir: state.dir,
        coords: action.payload.clash ? state.coords : action.payload.coords
      };
    default:
      return state;
  }
}

function Board({ size = 32, children }) {
  const [state, dispatch] = Hooks.useReducer(reducer, undefined, init);
  const { game, dir, coords } = state;
  console.log(state);
  // const [coords, setCoords] = Hooks.useState(INITIAL_COORDS);
  // const [dir, setDir] = Hooks.useState("right");
  // const [game, setGame] = Hooks.useState("running");
  useInterval(200, () => {
    if (game === "running") {
      const max = size + 1; // css grid isn't 0 indexed
      const forward = ["down", "right"].includes(dir);
      const vertical = ["up", "down"].includes(dir);
      const inc = x => (forward ? (x + 1) % max : (x - 1 + max) % max);
      const moveSlug = ([x, y]) => (vertical ? [x, inc(y)] : [inc(x), y]);
      const slugHead = last(coords);
      const newHead = moveSlug(slugHead);
      const clash = coords.some(
        ([x, y]) => x === newHead[0] && y === newHead[1]
      );
      const newCoords = clash ? coords : coords.concat([newHead]).slice(1); // only move if there was no clash
      // if (clash) setGame("finished");
      // setCoords(clash ? coords : newCoords);
      dispatch({ type: "TICK", payload: { coords: newCoords, clash } });
    }
  });
  // Hooks.useLayoutEffect(() => {
  //   console.log(dir);
  // }, [dir]);
  Hooks.useEffect(() => {
    function handleKeyDown(event) {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          // return setDir(prev => (prev === "down" ? "down" : "up"));
          return dispatch({ type: "TURN", payload: { dir: "up" } });
        case "ArrowRight":
          event.preventDefault();
          // return setDir(prev => (prev === "left" ? "left" : "right"));
          return dispatch({ type: "TURN", payload: { dir: "right" } });
        case "ArrowDown":
          event.preventDefault();
          // return setDir(prev => (prev === "up" ? "up" : "down"));
          return dispatch({ type: "TURN", payload: { dir: "down" } });
        case "ArrowLeft":
          event.preventDefault();
          // return setDir(prev => (prev === "right" ? "right" : "left"));
          return dispatch({ type: "TURN", payload: { dir: "left" } });
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
      <br />
      <mark>${game}</mark>
      <br />
      <button
        onClick=${() => dispatch({ type: game === "dead" ? "RESET" : "START" })}
      >
        Start
      </button>
      <ul
        style=${{
          maxWidth: "50rem",
          maxHeight: "50rem",
          width: "90vw",
          height: "90vw",
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
          outline: "1px solid"
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
                    i === coords.length - 1 && game === "dead" ? "red" : "#000"
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
