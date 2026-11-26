import type { ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";

const recipient = "mustafaturner@me.com";
const localHost = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;
const emailAddress = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i;
const deliveryError = "Your message couldn’t be sent. Please try again or use the email link below.";

function respond(response: ServerResponse, status: number, body: { error: string } | { sent: true }) {
  response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

export default function contactEmail(apiKey?: string, sender = "Portfolio <onboarding@resend.dev>"): Plugin {
  const handleContact: Connect.NextHandleFunction = async (request, response, next) => {
    if (request.url !== "/api/contact") return next();
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return respond(response, 405, { error: "Use POST to send a message." });
    }

    const { host = "", origin } = request.headers;
    if (!localHost.test(host) || (origin && origin !== `http://${host}` && origin !== `https://${host}`)) {
      return respond(response, 403, { error: "Send the message from the local portfolio page." });
    }
    if (request.headers["content-type"]?.split(";")[0] !== "application/json") {
      return respond(response, 415, { error: "Expected a JSON request." });
    }

    const length = Number(request.headers["content-length"]);
    if (!Number.isInteger(length) || length <= 0 || length > 32 * 1024) {
      return respond(response, 400, { error: "Enter a message of up to 5,000 characters." });
    }

    let fields: { email?: unknown; message?: unknown } | null;
    try {
      request.setEncoding("utf8");
      let body = "";
      for await (const chunk of request) body += chunk;
      fields = JSON.parse(body);
    } catch {
      return respond(response, 400, { error: "Invalid message data." });
    }

    const email = typeof fields?.email === "string" ? fields.email.trim() : "";
    const message = typeof fields?.message === "string" ? fields.message.trim() : "";
    if (email.length > 254 || !emailAddress.test(email)) {
      return respond(response, 400, { error: "Enter a valid email address so I can reply." });
    }
    if (!message || message.length > 5000) {
      return respond(response, 400, { error: "Enter a message of up to 5,000 characters." });
    }
    if (!apiKey) {
      return respond(response, 503, { error: "Email delivery is unavailable. Please use the email link below." });
    }

    try {
      const delivery = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: sender,
          to: [recipient],
          reply_to: email,
          subject: "New portfolio message",
          text: `From: ${email}\n\n${message}`,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const result = await delivery.json();
      if (delivery.ok && typeof result.id === "string") return respond(response, 200, { sent: true });
      console.error(`Portfolio email provider returned HTTP ${delivery.status}.`);
    } catch {
      console.error("Portfolio email provider did not return a usable response.");
    }
    return respond(response, 502, { error: deliveryError });
  };

  return {
    name: "portfolio-contact-email",
    configureServer(server) {
      server.middlewares.use(handleContact);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleContact);
    },
  };
}
