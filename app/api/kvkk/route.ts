import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type KvkkApplicationPayload = {
  fullName?: unknown;
  identityNumber?: unknown;
  email?: unknown;
  phone?: unknown;
  requestDetails?: unknown;
  applicationDate?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function invalid(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export async function POST(request: Request) {
  let data: KvkkApplicationPayload;
  try {
    data = (await request.json()) as KvkkApplicationPayload;
  } catch {
    return invalid("Please submit the form as valid JSON.");
  }

  const fullName = textValue(data.fullName);
  const identityNumber = textValue(data.identityNumber);
  const email = textValue(data.email).toLowerCase();
  const phone = textValue(data.phone);
  const requestDetails = textValue(data.requestDetails);
  const applicationDate = textValue(data.applicationDate);

  if (fullName.length < 2 || fullName.length > 200) {
    return invalid("Please enter a full name between 2 and 200 characters.");
  }
  if (identityNumber.length < 3 || identityNumber.length > 50) {
    return invalid("Please enter a valid T.C. identity or passport number.");
  }
  if (email.length > 320 || !emailPattern.test(email)) {
    return invalid("Please enter a valid email address.");
  }
  if (phone.length > 50) {
    return invalid("Please enter a phone number shorter than 50 characters.");
  }
  if (requestDetails.length < 10 || requestDetails.length > 10000) {
    return invalid("Please describe your request in 10 to 10,000 characters.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(applicationDate)) {
    return invalid("Please enter a valid application date.");
  }

  const parsedDate = new Date(`${applicationDate}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== applicationDate) {
    return invalid("Please enter a valid application date.");
  }

  try {
    await prisma.kvkkApplication.create({
      data: {
        fullName,
        identityNumber,
        email,
        phone: phone || null,
        requestDetails,
        applicationDate: parsedDate,
      },
    });
  } catch {
    console.error("KVKK application submission failed");
    return NextResponse.json({ message: "We could not save your request. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ message: "Your KVKK request has been received." }, { status: 201 });
}
