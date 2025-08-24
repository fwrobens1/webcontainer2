require("dotenv").config();
import express from "express";
import { GoogleGenerativeAI, Part, Content } from "@google/generative-ai";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import {basePrompt as nodeBasePrompt} from "./defaults/node";
import {basePrompt as reactBasePrompt} from "./defaults/react";
import cors from "cors";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!); // Added non-null assertion
const app = express();
app.use(cors())
app.use(express.json())

app.post("/template", async (req, res) => {
    const prompt = req.body.prompt;
    
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
    });

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            maxOutputTokens: 200,
        },
    });

    const response = result.response;
    const answer = response.text().trim(); // react or node

    if (answer == "react") {
        res.json({
            prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [reactBasePrompt]
        })
        return;
    }

    if (answer === "node") {
        res.json({
            prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [nodeBasePrompt]
        })
        return;
    }

    res.status(403).json({message: "You cant access this"})
    return;

})

app.post("/chat", async (req, res) => {
    const messages = req.body.messages;
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: getSystemPrompt()
    });

    const history: Content[] = messages.map((msg: any) => {
        const role: "user" | "model" = msg.role === "assistant" ? "model" : "user";
        let parts: Part[] = [];

        if (typeof msg.content === 'string') {
            parts.push({ text: msg.content });
        } else if (Array.isArray(msg.content)) {
            parts = msg.content.map((block: any) => ({
                text: block.text
            }));
        }

        return { role, parts };
    });

    const chat = model.startChat({
        history: history.slice(0, -1),
    });

    const lastUserMessageContent = messages[messages.length - 1].content;
    let lastUserMessageText: string = "";

    if (typeof lastUserMessageContent === 'string') {
        lastUserMessageText = lastUserMessageContent;
    } else if (Array.isArray(lastUserMessageContent)) {
        lastUserMessageText = lastUserMessageContent.map((block: any) => block.text).join(' ');
    }

    const result = await chat.sendMessage(lastUserMessageText);
    const response = result.response;

    console.log(response);

    res.json({
        response: response.text()
    });
})

app.listen(3000);
