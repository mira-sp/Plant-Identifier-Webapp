
'use client';
import { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import LoadingState from './components/LoadingState';
import PlantResults from './components/PlantResults';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleUpload = async (file) => {
    setLoading(true);
    // Implement file upload and identification logic
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <FileUpload onUpload={handleUpload} />
        {loading && <LoadingState />}
        <PlantResults results={results} />
      </div>
    </main>
  );
}
