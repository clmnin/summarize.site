const prompts = {
    "default": {
        prompt: "You are acting as a summarization AI, and for the input text please summarize it to the most important 3 to 5 bullet points for brevity: "
    },
};

const getPrompt = ( name ) => {
    if ( prompts[name] ) {
        return prompts[name].prompt;
    }
    return { error: "No prompt found" };
};