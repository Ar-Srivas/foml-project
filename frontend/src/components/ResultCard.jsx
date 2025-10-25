export function ResultCard({ label, confidence }) {
    return (
      <div className="p-4 border rounded-md shadow-md bg-white w-72 text-center">
        <h2 className="text-xl font-bold mb-2 text-black">{label}</h2>
        <p className="text-black">Confidence: {(confidence * 100).toFixed(2)}%</p>
      </div>
    );
  }
