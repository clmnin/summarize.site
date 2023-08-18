const PROMPTS = {
    "default": "You are acting as a summarization AI, and for the input text please summarize it to the most important 3 to 5 bullet points for brevity: "
};

export function getPrompt( name = 'default' ) {
    if ( name in PROMPTS ) {
        return PROMPTS[name];
    }
    return {"error": "No prompt found for name: " + name};
}

export function promptList() {
    return Object.keys(PROMPTS);
}