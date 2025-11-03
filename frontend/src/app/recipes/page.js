"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "../../config/api";

function RecipesContent() {
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const ingredientsParam = searchParams.get("ingredients");
    if (ingredientsParam) {
      setIngredients(ingredientsParam);
      fetchRecipes(ingredientsParam);
    }
  }, [searchParams]);

  const fetchRecipes = async (ingredientsList) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/recipes/?ingredients=${encodeURIComponent(
          ingredientsList
        )}&number=2`
      );

      if (!response.ok) throw new Error("Failed to fetch recipes");

      const data = await response.json();
      setRecipes(data);
    } catch (err) {
      console.error("Recipe fetch error:", err);
      setError(err.message || "Failed to load recipes");
      setRecipes([]);
    }

    setLoading(false);
  };

  const handleGetRecipes = async () => {
    if (!ingredients.trim()) {
      setError("Please enter at least one ingredient");
      return;
    }
    fetchRecipes(ingredients);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleGetRecipes();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gray-50">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-black">Recipe Finder</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Back to Predictor
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-black">
            What ingredients do you have?
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., apple, banana, carrot"
              className="flex-1 border border-gray-300 p-3 rounded-md text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleGetRecipes}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 font-medium"
            >
              {loading ? "Finding..." : "Find Recipes"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading recipes...</div>
        ) : recipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recipes.map((recipe, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {recipe.image && (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-48 object-cover"
                  />
                )}

                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-black">
                    {recipe.title}
                  </h3>

                  {recipe.usedIngredients && recipe.usedIngredients.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-green-600 mb-2">
                        Have:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recipe.usedIngredients.map((ing, i) => (
                          <span
                            key={i}
                            className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                          >
                            {ing.original}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipe.missedIngredients && recipe.missedIngredients.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-red-600 mb-2">
                        Need:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recipe.missedIngredients.map((ing, i) => (
                          <span
                            key={i}
                            className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded"
                          >
                            {ing.original}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <a
                    href={`https://spoonacular.com/recipes/${recipe.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block w-full text-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    View Full Recipe
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg">Enter ingredients to find recipes</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RecipesContent />
    </Suspense>
  );
}