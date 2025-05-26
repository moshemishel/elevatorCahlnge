export function CounterButton({ text, minLimit = 1, maxLimit = 30, count, setCount }) {
  const increment = () => {
    if (count < maxLimit) setCount(count + 1);
  };

  const decrement = () => {
    if (count > minLimit) setCount(count - 1);
  };

  return (
    <div className="counter-button-container">
      <div className="counter-display-row">
        <div className="counter-display">
          {count}
        </div>
        <div className="counter-buttons">
          <button onClick={increment} className="counter-btn counter-btn-plus">
            +
          </button>
          <button onClick={decrement} className="counter-btn counter-btn-minus">
            -
          </button>
        </div>
      </div>
      <div className="counter-label">
        {text}
      </div>
    </div>
  );
}
