"use client";

import { useState } from "react";
import { ImagePreview } from "../components/ImagePreview";
import { ResultCard } from "../components/ResultCard";

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [manyResults, setManyResults] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadedImageUrl(null);
      setResult(null);
      setManyResults(null);
    }
  };

  const uploadImage = async () => {
    if (!file) return false;
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("http://127.0.0.1:8000/upload/", {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) throw new Error("Upload failed");

    setUploadedImageUrl("http://127.0.0.1:8000/display/");
    return true;
  };

  const handlePredictSingle = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setManyResults(null);

    try {
      await uploadImage();

      const res = await fetch("http://127.0.0.1:8000/predict/");
      const data = await res.json();

      if (data.predictions && data.predictions.length > 0) {
        setResult(data.predictions[0]);
      } else {
        setResult({ label: "No Detection", confidence: 0 });
      }
    } catch (err) {
      console.error(err);
      setResult({ label: "Error", confidence: 0 });
    }

    setLoading(false);
  };

  const handlePredictMany = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setManyResults(null);

    try {
      await uploadImage();

      const res = await fetch("http://127.0.0.1:8000/predict_many/?threshold=0.6");
      const data = await res.json();

      setManyResults(data);
    } catch (err) {
      console.error(err);
      setManyResults({ predictions: [], error: "Prediction failed" });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 p-10">
      <h1 className="text-4xl font-extrabold mb-10 text-center text-black-700 drop-shadow-sm">
        Fruit & Veg Classifier
      </h1>

      {/* Upload + Preview Section */}
      <div className="flex flex-col md:flex-row justify-center items-start gap-10 w-full max-w-6xl mb-12">
        {/* Upload Box */}
        <div className="bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center w-full md:w-1/2 border border-black-200">
          <h2 className="text-xl font-semibold mb-4 text-black-700">Upload Image</h2>

          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="border border-gray-300 p-2 rounded-md w-full text-sm mb-6 focus:ring-2 focus:ring-green-400"
          />

          <div className="flex gap-4">
            <button
              onClick={handlePredictSingle}
              disabled={!file || loading}
              className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
                loading
                  ? "bg-gray-400"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {loading ? "Predicting..." : "Single Prediction"}
            </button>

            <button
              onClick={handlePredictMany}
              disabled={!file || loading}
              className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
                loading
                  ? "bg-gray-400"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {loading ? "Predicting..." : "Patch Prediction"}
            </button>
          </div>
        </div>

        {/* Image Preview */}
        <div className="bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center w-full md:w-1/2 border border-black-200">
          <h2 className="text-xl font-semibold mb-4 text-black-700">Preview</h2>
          <div className="w-full h-80 flex items-center justify-center bg-gray-100 rounded-lg border border-dashed border-gray-300">
            <ImagePreview file={file} />
          </div>
        </div>
      </div>

      {/* Single Prediction */}
      {result && (
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg mb-10 text-center border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-black-700">Single Prediction</h3>
          <ResultCard
            label={result.label}
            confidence={result.confidence}
            bbox={result.bbox}
          />
        </div>
      )}

      {/* Many Predictions */}
      {manyResults && (
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-6xl border border-black-200">
          <h2 className="text-2xl font-bold mb-4 text-black-700">Patch Analysis (It takes 8 patches)</h2>

          <div className="mb-4 text-sm text-black-600">
            <span className="font-medium">Total Patches:</span> {manyResults.total_patches} |
            <span className="font-medium ml-2">Above Threshold:</span> {manyResults.patches_above_threshold}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {manyResults.predictions?.map((prediction, idx) => (
              <div
                key={idx}
                className={`border rounded-xl p-3 shadow-sm transition-all hover:shadow-md ${
                  prediction.below_threshold
                    ? "bg-gray-100 border-gray-300 opacity-75"
                    : "bg-green-50 border-green-300"
                }`}
              >
                <img
                  src={`http://127.0.0.1:8000${prediction.patch_url}`}
                  alt={`Patch ${prediction.patch_id}`}
                  className="w-full h-36 object-cover rounded-lg mb-3"
                />
                <div className="text-center">
                  <p className="font-semibold text-gray-800">{prediction.label}</p>
                  <p
                    className={`font-medium ${
                      prediction.confidence > 0.7
                        ? "text-green-600"
                        : prediction.confidence > 0.4
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {(prediction.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
