import configureGenkit from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { defineFlow, definePrompt } from 'genkit/core'; // Correct import for defineFlow and definePrompt

import { generateEstimateFlow } from './flows/estimate-flow';
import { generateSurgicalRecordFlow } from './flows/surgical-record-flow';

export default configureGenkit({
  defaultApp: 'animal-clinic-assistant',
  plugins: [
    googleAI(), // projectId and apiKey are now read from environment variables (GOOGLE_CLOUD_PROJECT, GEMINI_API_KEY)
  ],
  flows: {
    generateEstimateFlow,
    generateSurgicalRecordFlow,
  },
});
