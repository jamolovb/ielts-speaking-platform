const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const upload = multer({ dest: 'uploads/' });
const express = require("express");
require("dotenv").config();
const axios = require('axios');

const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


const app = express();
const port = process.env.PORT || 3000;
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));



app.get('/', (req,res) =>{
    res.render('index')
})



app.post('/upload-audio', upload.single('audio'), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append('audio', fs.createReadStream(req.file.path));
        const response = await axios.post(`${process.env.WHISPER_URL}/transcribe`, formData, {
            headers: formData.getHeaders()
        });
        const transcript = response.data.transcript;
        res.json({ transcript: transcript });
        console.log(transcript)


        
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: 'transcription failed' });
        
    }

});


app.post('/score',express.json() , async (req, res) => {
    try {
        const session = req.body;  // the speakingSession object, sent as JSON
        let qaText = '';
        session.responses.forEach(r=>{
            qaText += `Question: ${r.question}\nAnswer: ${r.transcript}\n\n`;
        })
        const prompt = `
            You are an IELTS Speaking Part 1 examiner evaluating a transcript-based practice session.

            Evaluate the student's answers using exactly these three IELTS Speaking criteria:
            1. Fluency & Coherence
            2. Lexical Resource
            3. Grammatical Range & Accuracy

            Use the IELTS 0-9 band scale. Half bands are allowed, such as 5.5, 6.0, 6.5, and 7.0.

            The overallBand must be calculated as the arithmetic average of fluencyCoherence.band, lexicalResource.band, and grammaticalRange.band, rounded to the nearest 0.5. Do not adjust the overallBand holistically.

            This is an estimated practice evaluation based only on speech-to-text transcripts, not an official IELTS result.

            Evaluation rules:
            - Evaluate only the transcript content provided below.
            - Do not evaluate pronunciation, accent, stress, intonation, rhythm, or clarity because no audio-level pronunciation analysis is provided.
            - Do not mention pronunciation anywhere in the JSON.
            - Do not punish punctuation, capitalization, or missing commas because the transcript may come from speech-to-text.
            - Focus on answer relevance, answer development, coherence, vocabulary range, vocabulary accuracy, grammar range, and grammar accuracy.
            - If an answer is very short, incomplete, repetitive, empty, unrelated to the question, or mostly unclear, score the relevant criteria lower and explain that specific issue in the feedback.
            - Be fair, realistic, and not overly generous.
            - Each feedback value must be one to two specific, actionable sentences.
            - Do not copy the example values below. Replace every band and feedback with your actual evaluation of the student's responses.

            Student responses:
            ${qaText}

            Return ONLY valid JSON - Your response must start with { and end with } . Do not include markdown, code fences, comments, explanations, or any text before or after the JSON.

            Use exactly this JSON shape and exactly these top-level keys:

            {
            "overallBand": 6.5,
            "fluencyCoherence": {
                "band": 6.5,
                "feedback": "The answers are generally understandable and connected, but some responses need more development and smoother linking between ideas."
            },
            "lexicalResource": {
                "band": 6.5,
                "feedback": "The vocabulary is appropriate for familiar Part 1 topics, but the student should use more precise and varied word choices."
            },
            "grammaticalRange": {
                "band": 6.0,
                "feedback": "The student uses mostly clear sentence structures, but there are some grammar errors and limited complex sentence range."
            }
            }
            `;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents:  prompt
         }); 
        const reply = response.text;
        const cleaned = reply.replace(/```json|```/g, '').trim();
        const scoreObj = JSON.parse(cleaned);
        console.log(scoreObj);
        res.json(scoreObj);

    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: 'scoring failed' });
    }
});











app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 