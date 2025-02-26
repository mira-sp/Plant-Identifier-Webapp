// components/PricingBoxes.jsx
export default function PricingBoxes() {
    return (
      <div className="flex flex-col md:flex-row justify-center gap-6 my-8">
        <div className="bg-white shadow-lg p-6 rounded-lg border w-full md:w-1/3">
          <h3 className="text-lg font-bold">Landing Page</h3>
          <p className="text-2xl font-bold">$1,300</p>
          <ul className="text-sm mt-2">
            <li>✔ Framer design & build</li>
            <li>✔ Responsive design</li>
            <li>✔ Ready in 2 weeks</li>
          </ul>
        </div>
        <div className="bg-white shadow-lg p-6 rounded-lg border w-full md:w-1/3">
          <h3 className="text-lg font-bold">Multiple Pages</h3>
          <p className="text-2xl font-bold">$2,100</p>
          <ul className="text-sm mt-2">
            <li>✔ CMS Integration</li>
            <li>✔ Ready in 2-6 weeks</li>
          </ul>
        </div>
      </div>
    );
  }