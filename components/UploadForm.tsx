"use client";

// "use client" tells Next.js this component runs in the BROWSER, not the
// server, because it needs to react to clicks, file uploads, etc.

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { GeminiAnalysis } from "@/types";

interface UploadFormProps {
  onAnalysisComplete: (
    analysis: GeminiAnalysis,
    imageBase64: string,
    latitude: number,
    longitude: number
  ) => void;
}

export default function UploadForm({ onAnalysisComplete }: UploadFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Converts the uploaded file into a base64 string we can send to
  // our API route and eventually store in Firestore.
  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) handleFile(acceptedFiles[0]);
    },
  });

  // Asks the browser for the device's GPS location.
  // Wrapped in a Promise so we can "await" it in the submit handler below.
  function getLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        () => reject(new Error("Location permission denied.")),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  async function handleSubmit() {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      // Run the location request and the Gemini analysis at the same time
      // instead of one after another, since neither depends on the other.
      const [location, analysisResponse] = await Promise.all([
        getLocation(),
        fetch("/api/analyze-issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: imagePreview }),
        }),
      ]);

      if (!analysisResponse.ok) {
        const data = await analysisResponse.json();
        throw new Error(data.error || "Analysis failed");
      }

      const analysis: GeminiAnalysis = await analysisResponse.json();
      onAnalysisComplete(analysis, imagePreview, location.lat, location.lng);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-zinc-900 bg-zinc-50"
            : "border-zinc-300 hover:border-zinc-400"
        }`}
      >
        <input {...getInputProps()} />
        {imagePreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePreview}
            alt="Preview of the uploaded civic issue"
            className="max-h-64 mx-auto rounded-lg"
          />
        ) : (
          <p className="text-zinc-500">
            Drag a photo here, or click to choose one
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!imagePreview || isAnalyzing}
        className="w-full py-3 rounded-lg bg-zinc-900 text-white font-medium disabled:bg-zinc-300 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
      >
        {isAnalyzing ? "Analyzing..." : "Analyze issue"}
      </button>
    </div>
  );
}
