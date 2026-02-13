import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../lib/firebase";
import { makeId } from "./index";

/**
 * Uploads an image to Firebase Storage.
 * @param file The file or blob to upload.
 * @param path The path in storage (e.g., "users/{userId}/stories").
 * @returns The public download URL.
 */
export async function uploadImage(file: Blob | File, path: string): Promise<string> {
    if (!file) throw new Error("No file provided");

    const extension = file.type.split("/")[1] || "jpg";
    const filename = `${makeId()}.${extension}`;
    const storageRef = ref(storage, `${path}/${filename}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
}

/**
 * Deletes an image from Firebase Storage.
 * @param url The public download URL of the image to delete.
 */
export async function deleteImage(url: string): Promise<void> {
    if (!url) return;

    try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
    } catch (error) {
        console.error("Error deleting image:", error);
        // We typically treat delete errors as non-fatal for the user flow
    }
}
