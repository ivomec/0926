"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const genkit_1 = __importDefault(require("genkit"));
const googleai_1 = require("@genkit-ai/googleai");
const estimate_flow_1 = require("./flows/estimate-flow");
const surgical_record_flow_1 = require("./flows/surgical-record-flow");
exports.default = (0, genkit_1.default)({
    defaultApp: 'animal-clinic-assistant',
    plugins: [
        (0, googleai_1.googleAI)(), // projectId and apiKey are now read from environment variables (GOOGLE_CLOUD_PROJECT, GEMINI_API_KEY)
    ],
    flows: {
        generateEstimateFlow: estimate_flow_1.generateEstimateFlow,
        generateSurgicalRecordFlow: surgical_record_flow_1.generateSurgicalRecordFlow,
    },
});
