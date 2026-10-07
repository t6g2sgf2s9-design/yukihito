export const searchTuning = {
 match:3, mismatch:-1.5, temperature:1.4, shortlistGap:4,
 predictionGap:2.5, predictionConfidence:.7, strongPredictionGap:6,
 strongPredictionConfidence:.85, strongQuestionScore:.25,
 minQuestionScore:.002, rescueRejections:3, rescueTieCount:20,
 // Compatibility only; consecutive unknowns never control navigation.
 unknownLimit:5,
};
