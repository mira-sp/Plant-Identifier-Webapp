// components/PricingBoxes.jsx
export default function PricingBoxes() {
  return (
    <section id="about" className="py-12 px-6">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          How It Works
        </h2>
        <div className="flex flex-col md:flex-row justify-center gap-6 my-8">
          <div className="bg-white shadow-lg p-6 rounded-lg border w-full md:w-1/3">
            <h3 className="text-lg font-bold">Take a Photo</h3>
            <p className="text-2xl font-bold">Upload</p>
            <ul className="text-sm mt-2">
              <li>✔ Upload an image.</li>
              <li>✔ Take a photo.</li>
            </ul>
          </div>
          <div className="bg-white shadow-lg p-6 rounded-lg border w-full md:w-1/3">
            <h3 className="text-lg font-bold">AI Analysis</h3>
            <p className="text-2xl font-bold">APIs</p>
            <ul className="text-sm mt-2">
              <li>✔ Google Gemenini API</li>
              <li>✔ Identifies the plant </li>
            </ul>
          </div>

          <div className="bg-white shadow-lg p-6 rounded-lg border w-full md:w-1/3">
            <h3 className="text-lg font-bold">Get Information</h3>
            <p className="text-2xl font-bold">Prompting</p>
            <ul className="text-sm mt-2">
              <li>✔ Detailed information</li>
              <li>✔ Care Info</li>
              <li>✔ Fun facts and Origin</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
