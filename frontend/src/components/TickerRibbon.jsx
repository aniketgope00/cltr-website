import { formatCount } from "../utils/formatters.js";

export default function TickerRibbon({ waitlistCount }) {
  const items = [
    `${formatCount(waitlistCount)} already waiting`,
    "No cold DMs",
    "Bangalore-first beta",
    "Request-gated chat",
    "Micro social plans",
    "Real people nearby",
  ];

  const repeatedItems = [...items, ...items];

  return (
    <div className="ticker-shell" aria-label="cltr highlights">
      <div className="ticker-track">
        {repeatedItems.map((item, index) => (
          <span className="ticker-item" key={`${item}-${index}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
