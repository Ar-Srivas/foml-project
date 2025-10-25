"use client";

import { useState } from "react";
import { ImagePreview } from "../components/ImagePreview";
import { ResultCard } from "../components/ResultCard";

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handlePredict = async () => {
    if (!file) return;
    setLoading(true);

    try {
      // Step 1: Upload the image
      const formData = new FormData();
      formData.append("file", file);

      await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        body: formData,
      });

      // Step 2: Get prediction
      const res = await fetch("http://127.0.0.1:8000/predict/", {
        method: "GET",
      });

      const data = await res.json();
      setResult(data.top_prediction);
    } catch (error) {
      console.error("Error:", error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-black">ML Model Demo</h1>

      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* Left: Image preview and upload */}
        <div className="flex flex-col items-center gap-4">
          <ImagePreview file={file} />

          <input
            type="file"
            onChange={handleFileChange}
            className="border p-2 rounded-md w-80 text-sm text-black"
          />

          <button
            onClick={handlePredict}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-80"
          >
            {loading ? "Predicting..." : "Predict"}
          </button>
        </div>

        {/* Right: Result */}
        <div className="flex flex-col items-center gap-4">
          {result ? (
            <ResultCard label={result.label} confidence={result.confidence} />
          ) : (
            <div className="w-72 h-80 flex items-center justify-center text-gray-400 border rounded-md bg-white">
              Prediction will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}