// components/ContactForm.jsx
import { useState } from 'react';
import GradientButton from "./GradientButton";


export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="bg-white shadow-ld rounded-lg border p-6 max-w-md mx-auto gap-6 my-8">
      <h2 className="text-xl font-bold mb-4">Say Hello</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Name" onChange={handleChange} className="w-full p-2 mb-2 border rounded" required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} className="w-full p-2 mb-2 border rounded" required />
        <textarea name="message" placeholder="Tell me about your project..." onChange={handleChange} className="w-full p-2 mb-2 border rounded" required />
        
      </form>
      <GradientButton />
    </div>
  );
}