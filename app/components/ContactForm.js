// components/ContactForm.jsx
import { useState } from 'react';

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
    <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Say Hello</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Name" onChange={handleChange} className="w-full p-2 mb-2 border rounded" required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} className="w-full p-2 mb-2 border rounded" required />
        <textarea name="message" placeholder="Tell me about your project..." onChange={handleChange} className="w-full p-2 mb-2 border rounded" required />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Send</button>
      </form>
    </div>
  );
}