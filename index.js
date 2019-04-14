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
  left: "right",
};

function placeFood(size) {
  return [
    Math.floor(Math.random() * size) + 1,
    Math.floor(Math.random() * size) + 1,
  ];
}

function init({ size = 32 } = {}) {
  const INITIAL_COORDS = Array.from({ length: size }, (_, i) => [2 + i, 4]);
  const INITIAL_FOOD_COORDS = placeFood(size);
  return {
    game: "initial",
    dir: "right",
    coords: INITIAL_COORDS,
    food: INITIAL_FOOD_COORDS,
    size,
    level: 1,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "RESET":
      return { ...init(), game: "running" };
    case "START":
      return { ...state, game: "running" };
    case "PAUSE":
      return { ...state, game: "paused" };
    case "TURN":
      return {
        ...state,
        nextDir: [action.newDir, opposite[action.newDir]].includes(state.dir)
          ? state.dir
          : action.newDir,
      };
    case "TICK": {
      const { dir, nextDir, coords, size, food, level } = state;
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
      const foodEaten = newHead[0] === food[0] && newHead[1] === food[1];
      const newCoords = coords.concat([newHead]).slice(foodEaten ? 0 : 1); // only move if there was no clash
      const newFoodCoords = foodEaten ? placeFood(size) : food;
      console.log(newFoodCoords);
      return {
        ...state,
        game: clash ? "dead" : "running",
        dir: nextDir || dir,
        coords: clash ? coords : newCoords,
        food: newFoodCoords,
        level: foodEaten ? level + 1 : level,
      };
    }
    default:
      return state;
  }
}

function Board({ size = 32, children }) {
  const nextDir = Hooks.useRef(null);
  const [state, dispatch] = Hooks.useReducer(reducer, { size }, init);
  const { game, dir, coords, food, level } = state;

  Hooks.useEffect(() => {
    if (game !== "running") return;
    const interval = setInterval(() => {
      dispatch({ type: "TICK", nextDir: nextDir.current });
    }, Math.max(180 - level * 10, 40));
    return () => clearInterval(interval);
  }, [game, level]);

  Hooks.useEffect(() => {
    function handleKeyDown(event) {
      if (event.key.includes("Arrow")) {
        event.preventDefault(); // stops the page scrolling
        const newDir = event.key.replace("Arrow", "").toLowerCase(); // e.g. "ArrowUp" -> "up"
        dispatch({ type: "TURN", newDir });
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return html`
    <div
      style=${{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        padding: "2rem",
        gap: "2rem",
      }}
    >
      <div
        style=${{
          maxWidth: "50rem",
          maxHeight: "50rem",
          width: "80vw",
          height: "80vw",
          maxWidth: "90vh",
          maxHeight: "90vh",
          position: "relative",
          border: "0.5rem solid",
          // backgroundColor: `hsl(220, 10%, ${game === "dead" ? "90%" : "98%"})`,
        }}
      >
        <ul
          style=${{
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gridTemplateRows: `repeat(${size}, 1fr)`,
          }}
        >
          ${coords.map(
            ([x, y], i) => html`
              <li
                key=${i}
                style=${{
                  gridRowStart: y,
                  gridColumnStart: x,
                  backgroundColor:
                    i === coords.length - 1 && game === "dead" ? "red" : "#000",
                  // borderRadius: isFood ? "50%" : 0,
                }}
              ></li>
            `
          )}
          <li
            key="food"
            style=${{
              gridRowStart: food[1],
              gridColumnStart: food[0],
              borderRadius: "50%",
              backgroundColor: "blue",
            }}
          ></li>
        </ul>
        ${["dead", "initial"].includes(game) &&
          html`
            <button
              style=${{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: 0,
                backgroundColor: `hsla(${
                  game === "initial" ? "190" : "0"
                }, 50%, 40%, 0.5)`,
                fontSize: "3rem",
                fontWeight: "900",
                cursor: "pointer",
                zIndex: 10,
              }}
              onClick=${() =>
                dispatch({ type: game === "initial" ? "START" : "RESET" })}
            >
              ${game === "initial" ? "Start" : "Restart"}
            </button>
          `}
      </div>
      <div>
        <form>
          <input />
        </form>
      </div>
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
