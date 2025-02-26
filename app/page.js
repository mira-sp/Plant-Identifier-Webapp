"use client";

import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ImageUploader from "./components/ImageUploader";
import PlantInfo from "./components/PlantInfo";
import LoadingState from "./components/LoadingState";
import PricingBox from "./components/PricingBoxes";
import ContactForm from "./components/ContactForm";

export default function Home() {
  const [plantData, setPlantData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async (file) => {
    if (!file) {
      setPlantData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create form data
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/identify", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to identify plant");
      }

      const data = await response.json();
      setPlantData(data);
    } catch (err) {
      console.error("Error identifying plant:", err);
      setError("Sorry, we couldn't identify your plant. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-grow">
        <section className="py-12 px-6">
          <div className="container mx-auto text-center mb-12 mt-24">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Identify Any Plant Instantly
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload a photo and our AI will identify your plant and provide
              care information.
            </p>
          </div>

          <div className="container mx-auto max-w-4xl">
            <ImageUploader
              onImageUpload={handleImageUpload}
              isLoading={isLoading}
            />

            <div className="mt-12">
              {isLoading ? (
                <LoadingState />
              ) : error ? (
                <div className="text-center p-6 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-red-600">{error}</p>
                  <button
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    onClick={() => setError(null)}
                  >
                    Try Again
                  </button>
                </div>
              ) : plantData ? (
                <PlantInfo plantData={plantData} />
              ) : (
                <div className="text-center p-8">
                  <p className="text-gray-500">
                  Upload an image or use your camera to identify a plant
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-4xl">
          {" "}
          <PricingBox />
        </div>
        <div className="container mx-auto max-w-4xl">
          {" "}
          <ContactForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
