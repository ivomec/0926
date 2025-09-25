"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEstimateFlow = exports.generateEstimatePrompt = void 0;
const core_1 = require("genkit/core");
const googleai_1 = require("@genkit-ai/googleai");
const GenerateEstimateInputSchema = core_1.z.object({
    patientInfo: core_1.z.object({
        name: core_1.z.string().describe('The name of the patient (animal).'),
        species: core_1.z.string().describe('The species of the patient (e.g., 개, 고양이).'),
        breed: core_1.z.string().describe('The breed of the patient.'),
        age: core_1.z.string().describe('The age of the patient.'),
    }),
    estimatedCosts: core_1.z.object({
        procedure: core_1.z.number().describe('Estimated cost for the main procedure.'),
        additional: core_1.z.number().describe('Estimated cost for additional treatments.'),
        anesthesia: core_1.z.number().describe('Estimated cost for scaling and anesthesia.'),
        total: core_1.z.number().describe('Total estimated cost.'),
    }),
    photosDataUri: core_1.z.array(core_1.z.string()).describe("A list of photos of the patient's teeth, as data URIs. Each must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
    detailedFindings: core_1.z.string().describe("Veterinarian's detailed findings and notes about the patient's condition."),
});
const GenerateEstimateOutputSchema = core_1.z.object({
    responseText: core_1.z.string().describe('The generated narrative for the pet owner.'),
});
exports.generateEstimatePrompt = (0, core_1.definePrompt)({
    name: 'generateEstimatePrompt',
    input: { schema: GenerateEstimateInputSchema },
    output: { schema: GenerateEstimateOutputSchema },
    model: googleai_1.googleAI.gemini_1_5_flash, // Changed to 1.5 Flash
    prompt: `You are a compassionate and experienced veterinary assistant. Your task is to generate a warm and informative pre-surgical estimate letter for a pet owner in Korean.\n\nAnalyze the provided patient information, photos, veterinarian's notes, and estimated costs. Based on this, write a letter that:\n1.  Starts with a warm greeting to the owner of {{patientInfo.name}}.\n2.  Briefly mentions the patient's condition based on the photos and findings. Be gentle and reassuring. For example, if the photos show severe dental calculus, you can mention that you'll be doing a thorough cleaning to make them comfortable again.\n3.  Presents the estimated costs clearly. Explain that this is an estimate and the final cost may vary slightly based on the actual procedures needed during surgery.\n4.  If the photos or findings suggest a high probability of many extractions or complex procedures (leading to high 'additional' costs), gently prepare the owner. Reassure them that this is to relieve pain and improve the pet's quality of life. Avoid alarming language.\n5.  Concludes with a heartfelt thank you to the owner for entrusting their beloved pet to your care and reassure them you will take the best possible care of {{patientInfo.name}}.\n\n**Patient Information:**\n- Name: {{patientInfo.name}}\n- Species/Breed: {{patientInfo.species}} / {{patientInfo.breed}}\n- Age: {{patientInfo.age}}\n- Veterinarian's Findings: {{detailedFindings}}\n\n**Estimated Costs:**\n- Procedure: {{estimatedCosts.procedure}} 원\n- Additional Treatments: {{estimatedCosts.additional}} 원\n- Anesthesia/Scaling: {{estimatedCosts.anesthesia}} 원\n- Total: {{estimatedCosts.total}} 원\n\n**Patient Photos:**\n{{#each photosDataUri}}\n- {{media url=this}}\n{{/each}}\n\nGenerate the responseText for the letter. Structure it with clear paragraphs.`,
});
exports.generateEstimateFlow = (0, core_1.defineFlow)({
    name: 'generateEstimateFlow',
    inputSchema: GenerateEstimateInputSchema,
    outputSchema: GenerateEstimateOutputSchema,
}, async (input) => {
    const { output } = await (0, exports.generateEstimatePrompt)(input);
    return output;
});
