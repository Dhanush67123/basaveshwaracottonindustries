import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Save B2B Inquiry to Firebase Firestore
    let firebaseDocId = null;
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        const docRef = await addDoc(collection(db, "inquiries"), {
          name,
          email,
          message,
          timestamp: new Date().toISOString(),
        });
        firebaseDocId = docRef.id;
      } else {
        console.warn("Firebase config missing. Skipping Firestore logging.");
      }
    } catch (dbErr) {
      console.error("Failed to log B2B inquiry to Firestore:", dbErr);
    }

    // 2. Forward the inquiry to the target email via FormSubmit AJAX endpoint
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
        ...(firebaseDocId && { firestore_inquiry_id: firebaseDocId }),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to forward email: ${errText}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data, firebaseDocId });
  } catch (error: any) {
    console.error("Inquiry API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit B2B inquiry" },
      { status: 500 }
    );
  }
}
