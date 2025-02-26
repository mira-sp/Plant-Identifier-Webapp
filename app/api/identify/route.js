import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

function bufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}




export async function POST(request) {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Convert file to array buffer
    const bytes = await imageFile.arrayBuffer();
    const base64Data = bufferToBase64(bytes);
    const mimeType = imageFile.type;
    
    // Initialize the Gemini API client with the API key from environment variables
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API key is missing');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Construct the prompt for plant identification
    const prompt = `
      Identify this plant from the image. 
      Provide the following information in JSON format:
      - name: Common name of the plant
      - scientificName: Scientific name
      - description: A paragraph describing the plant
      - careInfo: Object with care information including light, water, temperature, soil, and humidity requirements
      - funFacts: Array of 3-5 interesting facts about the plant

      Return ONLY valid JSON with no extra text.
    `;
    
    // Generate content with the image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType
        }
      }
    ]);
    
    const response = await result.response;
    const text = await response.text();
    
    // Parse the JSON response
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the response');
      }
      
      const jsonString = jsonMatch[0];
      const plantData = JSON.parse(jsonString);
      
      return NextResponse.json(plantData);
    } catch (parseError) {
      console.error('Error parsing plant data:', parseError);
      return NextResponse.json(
        { error: 'Could not parse plant identification data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Plant identification error:', error);
    return NextResponse.json(
      { error: 'Failed to identify plant' },
      { status: 500 }
    );
  }
}
