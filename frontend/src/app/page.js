"use client";

import { useState } from "react";
import Link from "next/link";
import { ImagePreview } from "../components/ImagePreview";
import { ResultCard } from "../components/ResultCard";

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [manyResults, setManyResults] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(null);

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
        const pred = data.predictions[0];
        setResult(pred);
        setSelectedLabel(pred.label);
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

  // Extract ingredient name from label (e.g., "FreshApple" -> "apple")
  const getIngredientFromLabel = (label) => {
    if (!label) return "";
    return label.replace(/^(Fresh|Rotten)/, "").toLowerCase();
  };

  const handleViewRecipes = () => {
    if (selectedLabel) {
      const ingredient = getIngredientFromLabel(selectedLabel);
      window.location.href = `/recipes?ingredients=${encodeURIComponent(ingredient)}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-black">Food & Veg Predictor</h1>

      <div className="flex flex-col lg:flex-row items-start gap-8 w-full max-w-7xl">
        {/* Left Section - Upload */}
        <div className="flex flex-col items-center gap-4">
          <ImagePreview file={file} />

          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="border p-2 rounded-md w-80 text-sm text-black"
          />

          <button
            onClick={handlePredictSingle}
            disabled={!file || loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-80 disabled:bg-gray-400"
          >
            {loading ? "Predicting..." : "Predict Single"}
          </button>

          <button
            onClick={handlePredictMany}
            disabled={!file || loading}
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 w-80 disabled:bg-gray-400"
          >
            {loading ? "Predicting Many..." : "Predict Many Patches"}
          </button>
        </div>

        {/* Middle Section - Uploaded Image */}
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-semibold text-black">Uploaded Image</h3>
          {uploadedImageUrl ? (
            <img
              src={uploadedImageUrl}
              alt="Uploaded"
              className="max-w-sm max-h-80 border rounded-md shadow-md"
              onError={() => setUploadedImageUrl(null)}
            />
          ) : (
            <div className="w-80 h-60 flex items-center justify-center text-gray-400 border rounded-md bg-white">
              Upload an image to see it here
            </div>
          )}
        </div>

        {/* Right Section - Single Result */}
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-semibold text-black">Single Prediction</h3>
          {result ? (
            <div className="w-72">
              <ResultCard
                label={result.label}
                confidence={result.confidence}
                bbox={result.bbox}
              />
              {result.label !== "Error" && result.label !== "No Detection" && (
                <Link
                  href={`/recipes?ingredients=${encodeURIComponent(
                    getIngredientFromLabel(result.label)
                  )}`}
                  className="mt-4 block w-full text-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                >
                  What to do with this?
                </Link>
              )}
            </div>
          ) : (
            <div className="w-72 h-40 flex items-center justify-center text-gray-400 border rounded-md bg-white">
              Single prediction will appear here
            </div>
          )}
        </div>
      </div>

      {/* Many Predictions Section */}
      {manyResults && (
        <div className="w-full max-w-7xl mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-black">
              Patch Analysis Results
            </h2>

            <div className="mb-4 text-sm text-gray-600">
              <span className="font-medium">Total Patches:</span>{" "}
              {manyResults.total_patches} |
              <span className="font-medium ml-2">Above Threshold:</span>{" "}
              {manyResults.patches_above_threshold}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {manyResults.predictions?.map((prediction, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-3 ${
                    prediction.below_threshold
                      ? "bg-gray-100 border-gray-300"
                      : "bg-green-50 border-green-300"
                  }`}
                >
                  <img
                    src={`http://127.0.0.1:8000${prediction.patch_url}`}
                    alt={`Patch ${prediction.patch_id}`}
                    className="w-full h-20 object-cover rounded mb-2"
                  />
                  <div className="text-xs">
                    <p className="font-medium text-black truncate">
                      {prediction.label}
                    </p>
                    <p
                      className={`${
                        prediction.confidence > 0.6
                          ? "text-green-600"
                          : "text-orange-500"
                      }`}
                    >
                      {(prediction.confidence * 100).toFixed(1)}%
                    </p>
                    <p className="text-gray-500">Patch {prediction.patch_id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
