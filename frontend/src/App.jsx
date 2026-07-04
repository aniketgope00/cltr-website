import { lazy, startTransition, useEffect, useState } from "react";
import { fetchWaitlistOverview, joinWaitlist, saveWaitlistInterests } from "./api.js";
import AnimatedCount from "./components/AnimatedCount.jsx";
import DeferredScene from "./components/DeferredScene.jsx";
import PhoneMockups from "./components/PhoneMockups.jsx";
import TickerRibbon from "./components/TickerRibbon.jsx";
import WaitlistForm from "./components/WaitlistForm.jsx";
import { formatCount } from "./utils/formatters.js";

const CityGridScene = lazy(() => import("./animations/CityGridScene.jsx"));
const ConnectionGraphScene = lazy(() => import("./animations/ConnectionGraphScene.jsx"));
const WaveScene = lazy(() => import("./animations/WaveScene.jsx"));

const fallbackOverview = {
  waitlist_count: 1187,
  neighborhood_count: 8,
  neighborhoods: [
    "Indiranagar",
    "Koramangala",
    "HSR Layout",
    "Whitefield",
    "Jayanagar",
    "MG Road",
    "Bellandur",
    "Hebbal",
  ],
  average_match_minutes: 3,
  interest_options: [
    "Coffee runs",
    "Morning runs",
    "Pair programming",
    "Lunch breaks",
    "Study sessions",
    "Board games",
    "Jam sessions",
    "Evening walks",
    "Yoga classes",
    "Gym buddies",
    "Film nights",
    "Bike rides",
  ],
};

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Activities", href: "#activities" },
  { label: "Trust", href: "#trust" },
  { label: "Waitlist", href: "#waitlist" },
];

const steps = [
  {
    number: "01",
    title: "Post your plan",
    body: "Activity, place, time, and spots available. Done in about 30 seconds.",
    example: "Coffee at Third Wave, Indiranagar. 20 mins. 1 spot.",
  },
  {
    number: "02",
    title: "Nearby people see it",
    body: "Your plan shows up in the feed and on the map for people close enough to actually make it.",
    example: "Time-sensitive by default, so stale plans disappear instead of hanging around.",
  },
  {
    number: "03",
    title: "Someone requests to join",
    body: "You see their profile and trust score before anything opens. No acceptance means no chat.",
    example: "Cold messages are architecturally blocked.",
  },
  {
    number: "04",
    title: "Meet up and vouch",
    body: "After the hangout, both people rate the experience and trust compounds forward.",
    example: "Good plans make future plans easier.",
  },
];

const activityExamples = [
  "Coffee run",
  "Morning run",
  "Pair programming",
  "Lunch break",
  "Study session",
  "Board games",
  "Jam session",
  "Evening walk",
  "Yoga class",
  "Gym buddy",
  "Film night",
  "Bike ride",
];

const samplePlans = [
  {
    title: "Anyone down for filter coffee?",
    subtitle: "Indiranagar • 18 mins • 1 spot",
  },
  {
    title: "Pair programming, no small talk required",
    subtitle: "Koramangala • 7:00 PM • 2 builders",
  },
  {
    title: "Sunrise run before work",
    subtitle: "Cubbon Park • Tomorrow • Pace-friendly",
  },
];

const trustCards = [
  {
    icon: "01",
    title: "Request-gated contact",
    body: "Nobody messages you unless you accept their join request. No exceptions.",
  },
  {
    icon: "02",
    title: "Mutual vouching",
    body: "Ratings only show after both people vouch, so there is no one-sided pile-on.",
  },
  {
    icon: "03",
    title: "Verified real people",
    body: "Phone and social verification happen before posting or joining anything.",
  },
  {
    icon: "04",
    title: "Visibility controls",
    body: "Open plans to everyone nearby, interest matches only, or vouched connections only.",
  },
];

const testimonials = [
  {
    quote:
      "I posted a run and had someone join in four minutes. We still meet every Thursday.",
    author: "Arjun, software engineer, Indiranagar",
  },
  {
    quote:
      "The fact that nobody can DM me without approval changed the whole vibe. It feels designed, not risky.",
    author: "Manya, product designer, HSR Layout",
  },
  {
    quote:
      "It solves that exact moment when you want company for something tiny, not a giant event.",
    author: "Rohit, founder, Koramangala",
  },
];

export default function App() {
  const [overview, setOverview] = useState(fallbackOverview);
  const [entry, setEntry] = useState(null);
  const [loadNote, setLoadNote] = useState("");

  useEffect(() => {
    const abortController = new AbortController();

    fetchWaitlistOverview(abortController.signal)
      .then((payload) => {
        startTransition(() => {
          setOverview(payload);
        });
      })
      .catch(() => {
        setLoadNote("Using local preview data until the backend is running.");
      });

    return () => {
      abortController.abort();
    };
  }, []);

  const handleJoinWaitlist = async (email) => {
    const payload = await joinWaitlist(email);
    startTransition(() => {
      setEntry(payload);
      setOverview((current) => ({
        ...current,
        waitlist_count: payload.count,
      }));
    });
    return payload;
  };

  const handleSaveInterests = async (entryId, interests) => {
    const payload = await saveWaitlistInterests(entryId, interests);
    startTransition(() => {
      setEntry((current) => (current ? { ...current, ...payload } : payload));
    });
    return payload;
  };

  return (
    <div className="page-root">
      <nav className="topbar">
        <div className="section-shell topbar-inner">
          <a className="brand-lockup" href="#top">
            <img alt="cltr. logo" src="/cltr-logo.png" />
            <span>pre-launch beta</span>
          </a>

          <div className="nav-cluster">
            <div className="nav-links">
              {navLinks.map((link) => (
                <a href={link.href} key={link.label}>
                  {link.label}
                </a>
              ))}
            </div>
            <a className="topbar-cta" href="#waitlist">
              Join waitlist
            </a>
          </div>
        </div>
      </nav>

      <header className="hero" id="top">
        <DeferredScene
          eager
          fallbackClassName="hero-wave wave-placeholder"
          SceneComponent={WaveScene}
          sceneProps={{ className: "hero-wave", tone: "hero" }}
          wrapperClassName="scene-slot"
        />
        <div className="hero-grid-overlay" />

        <div className="section-shell hero-body">
          <div className="hero-copy">
            <p className="eyebrow">Bangalore-first / trust-first / micro-social</p>
            <h1>
              Spontaneous plans.
              <span>Real people nearby.</span>
            </h1>
            <p className="hero-subhead">
              Post what you&apos;re doing, from a coffee run to pair programming, and
              connect with nearby people who are genuinely down.
            </p>

            <WaitlistForm
              entry={entry}
              interestOptions={overview.interest_options}
              onJoin={handleJoinWaitlist}
              onSaveInterests={handleSaveInterests}
              variant="hero"
            />

            <div className="hero-chip-row">
              <span className="hero-chip">Not an event</span>
              <span className="hero-chip">Not a date</span>
              <span className="hero-chip">Just a plan</span>
            </div>

            <div className="hero-proof-strip">
              <div className="proof-pill proof-pill-dark">
                <span>Live waitlist</span>
                <strong>
                  <AnimatedCount
                    formatter={formatCount}
                    value={overview.waitlist_count}
                  />
                </strong>
              </div>
              <div className="proof-pill">
                <span>No spam</span>
                <strong>Request-gated chat only</strong>
              </div>
            </div>

            {loadNote ? <p className="inline-note">{loadNote}</p> : null}
          </div>

          <div className="hero-visual">
            <PhoneMockups />

            <div className="burst-stack">
              <article className="burst-card burst-card-accent">
                <p className="card-label">What cltr. fixes</p>
                <h3>Stop making plans alone.</h3>
                <p>
                  Your city is full of people who want to do what you want to do.
                  cltr. turns that moment into a real invitation.
                </p>
              </article>

              <article className="burst-card burst-card-note">
                <p className="card-label">Coverage</p>
                <h3>{overview.neighborhoods.slice(0, 4).join(" / ")}</h3>
                <p>
                  Built to feel hyperlocal first, then scale city by city without
                  losing intimacy.
                </p>
              </article>
            </div>
          </div>
        </div>
      </header>

      <TickerRibbon waitlistCount={overview.waitlist_count} />

      <main>
        <section className="section section-cream" id="how-it-works">
          <div className="section-shell split-layout">
            <div className="section-copy-column">
              <p className="section-kicker">Four steps. One hangout.</p>
              <h2>Simpler than texting “anyone free?”</h2>
              <p className="section-copy">
                From idea to IRL in under five minutes. The whole flow keeps momentum
                high and awkwardness low.
              </p>

              <div className="timeline">
                {steps.map((step) => (
                  <article className="timeline-card" key={step.number}>
                    <div className="timeline-index">{step.number}</div>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                      <span>{step.example}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="scene-panel scene-panel-graph">
              <DeferredScene
                fallbackClassName="scene-canvas scene-canvas-placeholder"
                SceneComponent={ConnectionGraphScene}
                sceneProps={{ className: "scene-canvas" }}
                wrapperClassName="scene-slot"
              />
              <div className="scene-note">
                <p className="card-label">Three.js connection graph</p>
                <h3>You start alone. The network fills in as trust forms.</h3>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-paper" id="activities">
          <div className="section-shell">
            <div className="section-heading section-heading-centered">
              <p className="section-kicker">Whatever you&apos;re into. There&apos;s a plan for that.</p>
              <h2>Small plans. Real moments.</h2>
              <p className="section-copy section-copy-centered">
                The app isn&apos;t about giant events. It&apos;s about those tiny, highly
                relatable moments where company would make the day better.
              </p>
            </div>

            <div className="activity-stage">
              <div className="sample-plan-panel">
                <p className="card-label">Sample plans</p>
                {samplePlans.map((plan) => (
                  <article className="sample-plan-card" key={plan.title}>
                    <h3>{plan.title}</h3>
                    <p>{plan.subtitle}</p>
                  </article>
                ))}
              </div>

              <div className="scene-panel scene-panel-map">
                <DeferredScene
                  fallbackClassName="scene-canvas scene-canvas-placeholder"
                  SceneComponent={CityGridScene}
                  sceneProps={{ className: "scene-canvas" }}
                  wrapperClassName="scene-slot"
                />
                <div className="scene-note scene-note-light">
                  <p className="card-label">Live activity grid</p>
                  <h3>Pins pulse in as the city comes alive.</h3>
                </div>
              </div>
            </div>

            <div className="activity-chip-grid">
              {activityExamples.map((item) => (
                <span className="activity-chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-cobalt" id="trust">
          <div className="section-shell">
            <div className="section-heading">
              <p className="section-kicker section-kicker-light">Built for trust. Designed for safety.</p>
              <h2>Safety isn&apos;t a feature. It&apos;s the foundation.</h2>
              <p className="section-copy section-copy-light">
                This section deliberately gets quieter and sharper. The product promise
                only works if the system protects people before it tries to delight them.
              </p>
            </div>

            <div className="trust-grid">
              {trustCards.map((card) => (
                <article className="trust-card" key={card.title}>
                  <span className="trust-index">{card.icon}</span>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-lilac" id="proof">
          <div className="section-shell">
            <div className="proof-layout">
              <div className="proof-copy">
                <p className="section-kicker">Bangalore is already waiting.</p>
                <h2>You&apos;re not the only one who feels this.</h2>
                <p className="section-copy">
                  The pre-launch crowd is already shaping the first neighborhood drops,
                  safety rules, and activity clusters.
                </p>
              </div>

              <div className="stats-grid">
                <article className="stat-card">
                  <span className="card-label">Waitlist</span>
                  <strong>
                    <AnimatedCount
                      formatter={formatCount}
                      value={overview.waitlist_count}
                    />
                  </strong>
                  <p>people already in line</p>
                </article>

                <article className="stat-card">
                  <span className="card-label">Neighborhoods</span>
                  <strong>{overview.neighborhood_count}</strong>
                  <p>already represented</p>
                </article>

                <article className="stat-card">
                  <span className="card-label">Beta signal</span>
                  <strong>{overview.average_match_minutes} min</strong>
                  <p>average time to find a match</p>
                </article>
              </div>
            </div>

            <div className="testimonial-grid">
              {testimonials.map((testimonial) => (
                <article className="testimonial-card" key={testimonial.author}>
                  <p>{testimonial.quote}</p>
                  <span>{testimonial.author}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-finale" id="waitlist">
          <DeferredScene
            fallbackClassName="cta-wave wave-placeholder"
            SceneComponent={WaveScene}
            sceneProps={{ className: "cta-wave", tone: "footer" }}
            wrapperClassName="scene-slot"
          />
          <div className="section-shell finale-layout">
            <div className="finale-copy">
              <p className="eyebrow eyebrow-light">Less scrolling / more doing</p>
              <h2>Your next plan is three minutes away.</h2>
              <p className="section-copy section-copy-light">
                Join the founding batch, tell us what you actually want to do, and help
                shape the first version of cltr. in the wild.
              </p>

              <div className="perk-row">
                <span className="perk-pill">Founding member badge</span>
                <span className="perk-pill">Priority access</span>
                <span className="perk-pill">Shape the product</span>
              </div>
            </div>

            <div className="finale-card">
              <WaitlistForm
                entry={entry}
                interestOptions={overview.interest_options}
                onJoin={handleJoinWaitlist}
                onSaveInterests={handleSaveInterests}
                variant="full"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="section-shell footer-row">
          <div className="footer-brand">
            <img alt="cltr. logo" src="/cltr-logo.png" />
            <p>Built in Bangalore. For everywhere.</p>
          </div>

          <div className="footer-links">
            <a href="#waitlist">Waitlist</a>
            <a href="#trust">Trust</a>
            <a href="mailto:hello@cltr.app">Contact</a>
            <a href="https://instagram.com" rel="noreferrer" target="_blank">
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
