import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { linkId, ownerId, authorName, text, imageStr, createdAt } = body;

        // Validation
        if (!ownerId || !linkId || !authorName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!text && !imageStr) {
            return NextResponse.json({ error: "Memory must contain text or an image" }, { status: 400 });
        }

        // In a full implementation, we would extract the full prompt/context from the linkId document in Firestore
        // For this demo, we'll store it under the owner's 'pendingMemories' collection in Firestore

        // Note: For now, since much of the app relies heavily on localStorage still,
        // saving to Firebase here only works if the main app is rigged to read it.
        // If we are strictly client-side only for now (no Firebase), we have a problem:
        // How does the owner's device get this data if they are not the same device?
        // SOLUTION: We MUST save to Firebase, and the client app MUST sync from Firebase.

        let adminDb;
        try {
            adminDb = getAdminDb();
        } catch (e) {
            console.error("Firebase Admin not configured. Cannot process external answers.", e);
            return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
        }

        const newId = `answer_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        
        // Save the pending memory to the owner's account
        // We'll store it at: users/{ownerId}/pendingMemories/{newId}
        const docRef = adminDb.collection("users").doc(ownerId).collection("pendingMemories").doc(newId);
        
        // We need to decode the prompt from the linkId or assume the app will reconstruct it
        // For simplicity in this demo, let's just store the raw data
        await docRef.set({
            id: newId,
            linkId,
            authorName,
            text: text || "",
            imageStr: imageStr || "", // Base64 string for now, should ideally be uploaded to Storage
            status: "pending",
            createdAt: createdAt || Date.now()
        });

        return NextResponse.json({ success: true, id: newId });
    } catch (error) {
        console.error("Submit Answer Error:", error);
        return NextResponse.json({ error: "Failed to process " }, { status: 500 });
    }
}
