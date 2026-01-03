import axios from "axios";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import imagekit from "../configs/imageKit.js";
import openai from "../configs/openai.js";

// Text-based AI Chat Message Controller
export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id;

        if (req.user.credits < 1) {
            return res.json({
                success: false,
                message: "You don't have enough credits to use this feature"
            });
        }


        const { chatId, prompt } = req.body;

        const chat = await Chat.findOne({ userId, _id: chatId });

        chat.messages.push({
            role: "user",
            content: prompt,
            timestamp: Date.now(),
            isImage: false
        });

        const { choices } = await openai.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const reply = {
            ...choices[0].message,
            timestamp: Date.now(),
            isImage: false
        };

        chat.messages.push(reply);

        await chat.save();
        await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });


        res.json({ success: true ,reply});
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};



//Image generation Message controller 
export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id;

        // Check credits
        if (req.user.credits < 2) {
            return res.json({
                success: false,
                message: "You don't have enough credits to use this feature"
            });
        }

        const { prompt, chatId, isPublished } = req.body;

        // Find chat
        const chat = await Chat.findOne({ userId, _id: chatId });

        chat.messages.push({
            role: "user",
            content: prompt,
            timestamp: Date.now(),
            isImage: false
        });

        const encodedPrompt = encodeURIComponent(prompt);

        // Construct ImageKit AI generation URL
        const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.png?tr=w-800,h-800`;

        // Log URL (sanitized) to help debugging
        console.log('Image generation URL:', generatedImageUrl);

        // Trigger generation by fetching from ImageKit — handle errors specifically
        let aiImageResponse;
        try {
            aiImageResponse = await axios.get(generatedImageUrl, { responseType: "arraybuffer" });
        } catch (err) {
            console.error('Image generation failed:', err.response?.status, err.response?.data || err.message);

            // If ImageKit returns 403, try retrying the request with basic auth using the private key
            if (err.response?.status === 403 && process.env.IMAGEKIT_PRIVATE_KEY) {
                console.log('Received 403 — attempting retry using IMAGEKIT_PRIVATE_KEY as basic auth username');
                try {
                    aiImageResponse = await axios.get(generatedImageUrl, {
                        responseType: 'arraybuffer',
                        auth: { username: process.env.IMAGEKIT_PRIVATE_KEY, password: '' }
                    });
                    console.log('Retry with auth succeeded');
                } catch (err2) {
                    console.error('Retry with auth failed:', err2.response?.status, err2.response?.data || err2.message);
                    return res.status(err2.response?.status || 500).json({
                        success: false,
                        message: err2.response?.data?.message || `Image generation failed with status ${err2.response?.status || 500}`
                    });
                }
            } else {
                return res.status(err.response?.status || 500).json({
                    success: false,
                    message: err.response?.data?.message || `Image generation failed with status ${err.response?.status || 500}`
                });
            }
        }

        // Convert to Base64
        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data, "binary").toString('base64')}`;

        // Upload to ImageKit Media Library
        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "quickgpt"
        });

        const reply = {
            role: 'assistant',
            content: uploadResponse.url,
            timestamp: Date.now(),
            isImage: true,
            isPublished: true
        };

        res.json({ success: true, reply });

        chat.messages.push(reply);
        await chat.save();
        await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });


    } catch (error) {
        console.error("imageMessageController error:", error.response?.status, error.response?.data || error.message);
        return res.status(500).json({ success: false, message: error.response?.data?.message || error.message });
    }
};