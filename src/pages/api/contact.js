import { createClient } from "@sanity/client";
import { Resend } from "resend";

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const sanitize = (value) => (typeof value === "string" ? value.trim() : "");

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char] || char;
  });

export const POST = async ({ request }) => {
  const projectId = import.meta.env.SANITY_PROJECT_ID;
  const dataset = import.meta.env.SANITY_DATASET;
  const apiVersion = import.meta.env.SANITY_API_VERSION || "2023-05-03";
  const sanityToken = import.meta.env.SANITY_API_TOKEN;
  const resendApiKey = import.meta.env.RESEND_API_KEY;
  const resendFrom = import.meta.env.RESEND_FROM_EMAIL;
  const recipient = import.meta.env.CONTACT_EMAIL_RECIPIENT;

  const missingEnv = Object.entries({
    SANITY_PROJECT_ID: projectId,
    SANITY_DATASET: dataset,
    SANITY_API_TOKEN: sanityToken,
    RESEND_API_KEY: resendApiKey,
    RESEND_FROM_EMAIL: resendFrom,
    CONTACT_EMAIL_RECIPIENT: recipient,
  }).filter(([, value]) => !value);

  if (missingEnv.length) {
    console.error(
      "Missing environment variables:",
      missingEnv.map(([key]) => key).join(", ")
    );
    return jsonResponse(500, {
      message: "Server misconfiguration. Please try again later.",
    });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    console.error("Invalid JSON payload:", error);
    return jsonResponse(400, { message: "Invalid JSON payload." });
  }

  const name = sanitize(payload?.name);
  const email = sanitize(payload?.email);
  const subject = sanitize(payload?.subject);
  const message = sanitize(payload?.message);

  if (!name || !email || !subject || !message) {
    return jsonResponse(400, { message: "All fields are required." });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return jsonResponse(400, {
      message: "Please provide a valid email address.",
    });
  }

  try {
    const sanityClient = createClient({
      projectId,
      dataset,
      token: sanityToken,
      apiVersion,
      useCdn: false,
    });

    await sanityClient.create({
      _type: "submission",
      name,
      email,
      subject,
      message,
      submittedAt: new Date().toISOString(),
    });

    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: resendFrom,
      to: recipient,
      reply_to: email,
      subject: `New Form Submission: ${subject}`,
      html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message)}</p>
      `,
    });

    return jsonResponse(200, { message: "Message sent successfully!" });
  } catch (error) {
    console.error("Contact form submission failed:", error);
    return jsonResponse(500, {
      message: "Something went wrong. Please try again later.",
    });
  }
};
