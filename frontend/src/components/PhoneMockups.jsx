const feedPlans = [
  {
    title: "Coffee at Third Wave",
    time: "20 mins",
    spot: "1 spot left",
    tone: "pink",
  },
  {
    title: "Pair programming sprint",
    time: "Tonight",
    spot: "2 builders nearby",
    tone: "yellow",
  },
  {
    title: "Sunset walk on MG Road",
    time: "6:30 PM",
    spot: "Open plan",
    tone: "blue",
  },
];

const mapPins = [
  { label: "Run", className: "pin-pink pin-top" },
  { label: "Code", className: "pin-cream pin-middle" },
  { label: "Coffee", className: "pin-blue pin-bottom" },
  { label: "Jam", className: "pin-pink pin-side" },
];

export default function PhoneMockups() {
  return (
    <div className="phone-stack" aria-hidden="true">
      <article className="phone-card phone-card-feed">
        <div className="phone-notch" />
        <div className="phone-screen">
          <div className="screen-tag">Feed view</div>
          {feedPlans.map((plan) => (
            <div className={`plan-card plan-card-${plan.tone}`} key={plan.title}>
              <strong>{plan.title}</strong>
              <span>{plan.time}</span>
              <small>{plan.spot}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="phone-card phone-card-map">
        <div className="phone-notch" />
        <div className="phone-screen phone-screen-map">
          <div className="screen-tag">Map view</div>
          <div className="map-grid">
            {mapPins.map((pin) => (
              <span className={`map-pin ${pin.className}`} key={pin.label}>
                {pin.label}
              </span>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
