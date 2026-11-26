import { useState } from "react";
import type { FormEvent } from "react";

type Result = { sent: boolean; message: string };

const ContactForm = () => {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const email = String(fields.get("email")).trim();
    const message = String(fields.get("message")).trim();

    if (!message) {
      setResult({ sent: false, message: "Please enter a message." });
      return;
    }

    setSending(true);
    setResult(null);
    const failure = "Your message couldn’t be sent. Please try again or use the email link below.";

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });
      const data = await response.json();

      if (response.ok && data.sent === true) {
        form.reset();
        setResult({ sent: true, message: "Your message was sent." });
      } else {
        setResult({ sent: false, message: typeof data.error === "string" ? data.error : failure });
      }
    } catch {
      setResult({ sent: false, message: failure });
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="portfolio-contact-form" method="post" onSubmit={sendMessage}>
      <fieldset disabled={sending}>
        <div>
          <label htmlFor="contact-email">Your email</label>
          <input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} />
        </div>
        <div>
          <label htmlFor="contact-message">Message</label>
          <textarea id="contact-message" name="message" required maxLength={5000} rows={3} />
        </div>
        <button className="portfolio-button portfolio-button-primary" type="submit">
          {sending ? "Sending…" : "Send email"}
        </button>
      </fieldset>
      {result && <p className="portfolio-form-result" role={result.sent ? "status" : "alert"}>{result.message}</p>}
    </form>
  );
};

export default ContactForm;
