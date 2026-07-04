import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'tcsxsoa.selects.verify@gmail.com',
    pass: process.env.EMAIL_APP_PASSWORD || 'rykvmrktbbzswgrw',
  },
});

export async function POST(request: Request) {
  try {
    const { email, referenceId } = await request.json();

    if (!email || !referenceId) {
      return NextResponse.json(
        { success: false, error: 'Email and Candidate ID are required.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const upperRefId = referenceId.trim().toUpperCase();

    // 1. Check if candidate exists and is unclaimed
    const candidate = await prisma.candidate.findUnique({
      where: { referenceId: upperRefId },
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found.' },
        { status: 404 }
      );
    }

    if (candidate.claimStatus === 'CLAIMED' || candidate.userId) {
      return NextResponse.json(
        { success: false, error: 'This candidate ID has already been claimed.' },
        { status: 400 }
      );
    }

    // 2. Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email address already exists.' },
        { status: 400 }
      );
    }

    // 3. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Save to database (expires in 10 minutes)
    await prisma.otp.create({
      data: {
        email: trimmedEmail,
        code: otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // 5. Send email via Nodemailer
    const mailOptions = {
      from: `"TCS Selects Dashboard" <${process.env.EMAIL_USER || 'tcsxsoa.selects.verify@gmail.com'}>`,
      to: trimmedEmail,
      subject: 'Verify your email to claim your TCS profile',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">TCS Profile Verification</h2>
          <p style="color: #475569; font-size: 16px;">You requested to claim the profile for <strong>${upperRefId}</strong>.</p>
          <p style="color: #475569; font-size: 16px;">Please use the following 6-digit code to verify your email address. This code will expire in 10 minutes.</p>
          
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">${otpCode}</span>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully.',
    });
  } catch (error: unknown) {
    console.error('Error in send-otp:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
