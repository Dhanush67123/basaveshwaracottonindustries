import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Forward the inquiry to the target email via FormSubmit AJAX endpoint
    const res = await fetch("https://formsubmit.co/ajax/basaveshwaracottonindustries@gmail.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        name: name,
        email: email,
        inquiry: message,
        _subject: `New B2B Wholesale Inquiry from ${name}`,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to forward email: ${errText}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Inquiry API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit B2B inquiry" },
      { status: 500 }
    );
  }
}
