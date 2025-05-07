import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: Request) {
  try {
    const { clientEmail, clientName, tokenUsage, tokenLimit } = await request.json();

    const msg = {
      to: clientEmail,
      from: 'your-verified-sender@yourdomain.com', // Replace with your verified sender
      subject: 'Token Usage Limit Warning',
      html: `
        <h2>Token Usage Limit Warning</h2>
        <p>Dear ${clientName},</p>
        <p>Your token usage has reached ${tokenUsage} out of your ${tokenLimit} token limit.</p>
        <p>Please contact support to increase your limit or upgrade your plan.</p>
        <br>
        <p>Best regards,</p>
        <p>IDX Translation Portal Team</p>
      `,
    };

    await sgMail.send(msg);

    return NextResponse.json({ 
      success: true,
      message: 'Email notification sent successfully' 
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    );
  }
}