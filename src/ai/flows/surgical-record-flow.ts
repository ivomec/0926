'use server';

import { defineFlow, definePrompt, z } from 'genkit/core';
import { googleAI } from '@genkit-ai/googleai';

const GenerateSurgicalRecordInputSchema = z.object({
  patientInfo: z.object({
    name: z.string().describe('The name of the patient (animal).'),
    species: z.string().describe('The species of the patient (e.g., 개, 고양이).'),
    breed: z.string().describe('The breed of the patient.'),
  }),
  costs: z.object({
    total: z.number().describe('Total final cost.'),
  }),
  dentalChartSummary: z.string().describe("A summary of the dental chart findings and procedures performed. E.g., '104: status(FX, CCF), procedure(SX)'"),
  preOpPhotosDataUri: z.array(z.string()).describe(
    "A list of pre-operation photos (X-rays) of the patient's teeth, as data URIs. Each must include a MIME type and use Base64 encoding."
  ),
  postOpPhotosDataUri: z.array(z.string()).describe(
    "A list of post-operation photos (X-rays) of the patient's teeth, as data URIs. Each must include a MIME type and use Base64 encoding."
  ),
});
export type GenerateSurgicalRecordInput = z.infer<typeof GenerateSurgicalRecordInputSchema>;

const GenerateSurgicalRecordOutputSchema = z.object({
  responseText: z.string().describe('The generated surgical record narrative for the pet owner.'),
});
export type GenerateSurgicalRecordOutput = z.infer<typeof GenerateSurgicalRecordOutputSchema>;

export const generateSurgicalRecordPrompt = definePrompt({
  name: 'generateSurgicalRecordPrompt',
  input: { schema: GenerateSurgicalRecordInputSchema },
  output: { schema: GenerateSurgicalRecordOutputSchema },
  model: googleAI.gemini_1_5_flash, // Changed to 1.5 Flash
  prompt: `You are a friendly and detailed veterinarian explaining the results of a dental surgery to a pet owner in Korean.\n\nAnalyze the provided pre- and post-operation X-rays, the dental chart summary, and the final cost. Your goal is to write a comprehensive and easy-to-understand summary for the owner.\n\nThe summary should:\n1.  Start by reassuring the owner that {{patientInfo.name}}'s surgery went well and they are recovering safely.\n2.  Analyze the pre-op and post-op photos. Describe the 'before' state (e.g., severe calculus, fractured teeth visible in X-ray) and the 'after' state (e.g., clean teeth, necessary extractions completed).\n3.  Explain the procedures performed based on the dental chart summary in simple terms. For example, instead of 'SX on 104 due to CCF', say "송곳니(104번 치아)에 치수가 노출된 파절이 있어, 통증을 없애주기 위해 안전하게 발치했습니다." (The canine tooth (#104) had a complicated crown fracture exposing the pulp, so we extracted it safely to eliminate pain.)\n4.  Address the final cost. Explain that the total cost was {{costs.total}} 원. If the initial estimate was different, you should provide a brief, reassuring explanation for the difference (e.g., "수술 중 엑스레이에서 예상치 못했던 뿌리 염증이 발견되어, 추가적인 발치가 필요했습니다. 이로 인해 비용에 변동이 있었지만, 아이의 건강을 위한 꼭 필요한 조치였습니다."). Even if there's no difference, briefly state that the treatment was completed within the estimated budget.\n5.  Conclude with post-operative care instructions (e.g., soft food, administering medication) and a warm closing.\n\n**Patient Information:**\n- Name: {{patientInfo.name}}\n- Species/Breed: {{patientInfo.species}} / {{patientInfo.breed}}\n\n**Dental Chart Summary:**\n{{dentalChartSummary}}\n\n**Final Total Cost:**\n{{costs.total}} 원\n\n**Pre-Operation Photos:**\n{{#each preOpPhotosDataUri}}\n- {{media url=this}}\n{{/each}}\n\n**Post-Operation Photos:**\n{{#each postOpPhotosDataUri}}\n- {{media url=this}}\n{{/each}}\n\nGenerate the responseText for the letter. Structure it logically with clear headings or paragraphs for each section (e.g., "수술 결과", "진행된 처치", "비용 안내").`,
});

export const generateSurgicalRecordFlow = defineFlow(
  {
    name: 'generateSurgicalRecordFlow',
    inputSchema: GenerateSurgicalRecordInputSchema,
    outputSchema: GenerateSurgicalRecordOutputSchema,
  },
  async (input: GenerateSurgicalRecordInput) => {
    const { output } = await generateSurgicalRecordPrompt(input);
    return output!;
  }
);
