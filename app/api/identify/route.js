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
  // Add detailed API key check with meaningful error
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.error('Missing Google Gemini API key in environment variables');
    return NextResponse.json(
      { error: 'Missing API configuration' },
      { status: 500 }
    );
  }

  try {
    // Check if API key appears to be valid (basic format check)
    if (process.env.GOOGLE_GEMINI_API_KEY.length < 10) {
      console.error('API key appears to be malformed or incomplete');
      return NextResponse.json(
        { error: 'Invalid API configuration' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log('Image received, size:', imageFile.size, 'type:', imageFile.type);

    // Convert file to array buffer
    const bytes = await imageFile.arrayBuffer();
    const base64Data = bufferToBase64(bytes);
    const mimeType = imageFile.type;
    
    try {
      // Initialize the Gemini API client
      console.log('Initializing Gemini API client...');
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
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
      console.log('Sending request to Gemini API...');
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType
          }
        }
      ]);
      
      console.log('Received response from Gemini API');
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      try {
        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No valid JSON found in response text:', text.substring(0, 100) + '...');
          throw new Error('No valid JSON found in the response');
        }
        
        const jsonString = jsonMatch[0];
        const plantData = JSON.parse(jsonString);
        
        return NextResponse.json(plantData);
      } catch (parseError) {
        console.error('Error parsing plant data:', parseError, 'Raw text:', text.substring(0, 100) + '...');
        return NextResponse.json(
          { error: 'Could not parse plant identification data', details: parseError.message },
          { status: 500 }
        );
      }
    } catch (apiError) {
      console.error('Gemini API error:', apiError);
      return NextResponse.json(
        { error: 'Error communicating with Gemini API', details: apiError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('General plant identification error:', error);
    return NextResponse.json(
      { error: 'Failed to identify plant', details: error.message },
      { status: 500 }
    );
  }
}