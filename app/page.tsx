"use client";

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-semibold mb-4">VMS</h1>
        <p className="text-neutral-600 mb-6">
          This is a simple preview to share with family.
        </p>
        <button className="w-full py-3 rounded-xl bg-black text-white">
          Write a story
        </button>
      </div>
    </main>
  );
}
