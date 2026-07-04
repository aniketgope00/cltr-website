import { useEffect, useState } from "react";
import { formatCount } from "../utils/formatters.js";

export default function WaitlistForm({
  entry,
  interestOptions,
  onJoin,
  onSaveInterests,
  variant = "hero",
}) {
  const isHero = variant === "hero";
  const [email, setEmail] = useState(entry?.email ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState(entry?.interests ?? []);

  useEffect(() => {
    setEmail(entry?.email ?? "");
    setSelectedInterests(entry?.interests ?? []);
  }, [entry]);

  const toggleInterest = (interest) => {
    setSelectedInterests((current) => {
      if (current.includes(interest)) {
        return current.filter((item) => item !== interest);
      }

      if (current.length >= 4) {
        return current;
      }

      return [...current, interest];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await onJoin(email);
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!entry) {
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await onSaveInterests(entry.id, selectedInterests);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (entry && isHero) {
    return (
      <div className="form-success form-success-compact">
        <p className="success-kicker">You&apos;re in.</p>
        <h3>#{formatCount(entry.position)} on the cltr. waitlist.</h3>
        <p>{entry.referral_message}</p>
        <a className="ghost-button" href="#waitlist">
          Choose your launch interests
        </a>
      </div>
    );
  }

  if (entry && !isHero) {
    return (
      <div className="form-success form-success-full">
        <div className="success-header">
          <div>
            <p className="success-kicker">
              {entry.already_joined ? "Already on the list" : "Waitlist confirmed"}
            </p>
            <h3>#{formatCount(entry.position)} and moving.</h3>
          </div>
          <div className="success-badge">Pre-launch batch</div>
        </div>

        <p className="success-copy">
          {entry.referral_message} Pick up to four activity lanes so the first invite
          you get actually feels like you.
        </p>

        <div className="interest-grid">
          {interestOptions.map((interest) => (
            <button
              className={
                selectedInterests.includes(interest)
                  ? "interest-chip interest-chip-active"
                  : "interest-chip"
              }
              key={interest}
              onClick={() => toggleInterest(interest)}
              type="button"
            >
              {interest}
            </button>
          ))}
        </div>

        <div className="interest-actions">
          <button
            className="primary-button"
            disabled={isSaving}
            onClick={handleSave}
            type="button"
          >
            {isSaving
              ? "Saving..."
              : entry.interests_saved
                ? "Update interests"
                : "Save my interests"}
          </button>
          <p className="helper-copy">
            Founding members get first dibs on neighborhood drops, trust pilots, and
            product feedback sessions.
          </p>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <form className={isHero ? "waitlist-form waitlist-form-hero" : "waitlist-form"} onSubmit={handleSubmit}>
      <div className="waitlist-row">
        <label className="sr-only" htmlFor={`waitlist-email-${variant}`}>
          Email
        </label>
        <input
          autoComplete="email"
          className="waitlist-input"
          id={`waitlist-email-${variant}`}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          type="email"
          value={email}
        />
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Joining..." : isHero ? "Get early access" : "Count me in"}
        </button>
      </div>

      <div className="waitlist-note-row">
        <span className="micro-note">Not an event. Not a date. Just a plan.</span>
        <span className="micro-note">Free</span>
        <span className="micro-note">No spam</span>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
