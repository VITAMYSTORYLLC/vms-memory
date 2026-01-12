const { GoogleGenerativeAI } = require("@google/generative-ai");

async function verify() {
    const apiKey = "AIzaSyBz0KXR5zyxXabnrWK2Oc2LW_KK49D2SDA";
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const result = await model.generateContent("Hello, say 'Lite is working'");
        const response = await result.response;
        console.log("Success:", response.text());
    } catch (error) {
        console.error("Error:", error.message);
    }
}

verify();
