// Example for Next.js: pages/api/contact.js

import { createClient } from '@sanity/client';
import { Resend } from 'resend';

// Configure Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN, // Use a write token
  useCdn: false,
  apiVersion: '2023-05-03',
});

// Configure Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // 1. Create a new document in Sanity
    const doc = {
      _type: 'submission',
      name,
      email,
      subject,
      message,
    };
    await sanityClient.create(doc);

    // 2. Send an email notification using Resend
    await resend.emails.send({
      from: 'Contact Form <onboarding@resend.dev>', // Your "from" email configured in Resend
      to: process.env.CONTACT_EMAIL_RECIPIENT, // Your email address
      subject: `New Form Submission: ${subject}`,
      html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    return res.status(200).json({ message: 'Message sent successfully!' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}