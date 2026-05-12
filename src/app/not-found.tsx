"use client";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-white/50 mt-2">Page not found.</p>
      <a href="/" className="mt-4 text-indigo-400 underline">Go home</a>
    </div>
  );
}
