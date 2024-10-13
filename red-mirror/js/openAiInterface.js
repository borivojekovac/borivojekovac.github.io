class OpenAiInterface {

    config = null;

    constructor(config) {        

        this.config = config;
    }

    async invokeModel(model, persona, prompt, previousMessages) {

        var messages = previousMessages ?? [];

        if (!messages.length && persona.trim().length) {

            messages.push({
                "role": "system", "content": persona
            });
        }

        messages.push({ "role": "user", "content": prompt });

        var requestData = {
            model: model,
            messages: messages
        };

        if (this.config.temperature) {

            requestData.temperature = this.config.temperature * 1.0;
        }

        if (this.config.maxTokens) {

            requestData.max_tokens = this.config.maxTokens * 1;
        }

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${ this.config.openAiApiKey }`
                },
                body: JSON.stringify(requestData)
            }
        );

        const data = await response.json();

        if (response.ok) {

            messages.push(data.choices[0].message);

            return {
                ok: true,
                response: data.choices[0].message.content,
                messages: messages
            };
        }

        return {
            ok: false,
            error: data.error.message
        }
    }

    async createAssistant(name, persona, tools, model, temperature) {

        try {

            const response = await fetch(
                "https://api.openai.com/v1/assistants",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${ this.config.openAiApiKey }`,
                        "OpenAI-Beta": "assistants=v2"
                    },
                    body: JSON.stringify({
    
                        "name": name,
                        "instructions": persona,
                        "tools": tools,
                        "model": model,
                        "temperature": temperature * 1.0
                    })
                }
            );
    
            const assistant = await response.json();

            if (assistant.error) {

                throw new Error(assistant.error.message);
            }

            return assistant;
        }
        catch (ex) {

            throw new Error(`Couldn't create agent: ${ex.message}`);
        }
    }

    async createThread() {

        try {

            const response = await fetch(
                "https://api.openai.com/v1/threads",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${ this.config.openAiApiKey }`,
                        "OpenAI-Beta": "assistants=v2"
                    }
                }
            );
    
            const thread = await response.json();

            if (thread.error) {

                throw new Error(thread.error.message);
            }

            return thread;
        }
        catch (ex) {

            throw new Error(`Couldn't create a thread: ${ex.message}`)
        }
    }

    async sendMessage(threadId, content) {

        try {

            const response = await fetch(
                `https://api.openai.com/v1/threads/${threadId}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${ this.config.openAiApiKey }`,
                        "OpenAI-Beta": "assistants=v2"
                    },
                    body: JSON.stringify({
                        "role": "user",
                        "content": content
                    })
                }
            );
    
            const message = await response.json();

            if (message.error) {

                throw new Error(message.error.message);
            }
    
            return message;
        }
        catch (ex) {

            throw new Error(`Couldn't sent message: ${ex.message}`);
        }
    }

    sleep(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getReply(threadId, assistantId) {

        try {


            var response = await fetch(
                `https://api.openai.com/v1/threads/${threadId}/runs`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${ this.config.openAiApiKey }`,
                        "OpenAI-Beta": "assistants=v2"
                    },
                    body: JSON.stringify({
                        "assistant_id": assistantId
                    })
                }
            );
    
            var run = await response.json();

            if (run.error) {

                throw new Error(run.error.message);
            }

            while (run.status != "completed") {

                if (run.status == "failed") {

                    throw new Error("Unable to get response from the agent.");
                }

                await this.sleep(1000);
                
                response = await fetch(
                    `https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${ this.config.openAiApiKey }`,
                            "OpenAI-Beta": "assistants=v2"
                        }
                    }
                );

                run = await response.json();
            }

            response = await fetch(
                `https://api.openai.com/v1/threads/${threadId}/messages`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${ this.config.openAiApiKey }`,
                        "OpenAI-Beta": "assistants=v2"
                    }
                }
            );

            const messages = await response.json();
            const reply = messages.data[0];
    
            return reply;
        }
        catch (ex) {

            throw new Error(`Couldn't sent message: ${ex.message}`);
        }
    }
};

export default OpenAiInterface;