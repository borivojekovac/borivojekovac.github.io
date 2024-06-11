import DataManager from "./dataManager.js";

class ScriptsManager {

    scripts = {

    }

    constructor() {

        DataManager.get(`scripts`, []).then((scriptNames) => {

            if (!scriptNames.length) {

                this.initDefaultScripts();
            }
            else {

                for (const scriptName of scriptNames) {

                    DataManager.get(`script.${scriptName}`, "").then((commands) => {
    
                        this.scripts[scriptName] = commands;
                    });
                }
            }
        });
    }

    async initDefaultScripts() {

        for (const scriptName in ScriptsManager.defaultScripts) {

            this.scripts[scriptName] = ScriptsManager.defaultScripts[scriptName];
            await DataManager.set(`script.${scriptName}`, ScriptsManager.defaultScripts[scriptName]);
        }

        await DataManager.set(`scripts`, Object.keys(this.scripts));
    }

    async set(name, commands) {

        this.scripts[name] = commands;
        await DataManager.set(`script.${name}`, commands);
        await DataManager.set(`scripts`, Object.keys(this.scripts));
    }

    async rename(name, newName) {

        this.scripts[newName] = this.scripts[name];
        delete this.scripts[name];
        await DataManager.clear(`script.${name}`);
        await DataManager.set(`script.${newName}`, this.scripts[newName]);
        await DataManager.set(`scripts`, Object.keys(this.scripts));
    }

    async remove(name) {

        delete this.scripts[name];
        await DataManager.clear(`script.${name}`);
        await DataManager.set(`scripts`, Object.keys(this.scripts));
    }

    async get(name, defaultValue) {

        return await DataManager.get(`script.${name}`, defaultValue);
    }
}

ScriptsManager.defaultScripts = {
    "example: comic" : `clear
reset

agent text, input, "write a witty scenario for a comic book panel with 6 frames. repeat a very detailed description of the appearance of the characters in every panel. characters need to be consistent across all the frames. the comic book panel should tell the following story;"

agent openaichat, screenwriter

agent text, director, "a comic-book panel in black and white with strong contrasts, with great detail and linework, where all the characters look consistent across all frames of the panel, and story is based on the following scenario; "

agent dalle3, illustrator

connect input, screenwriter
connect screenwriter, director
connect director, illustrator

toggle false
hide
run`,

"example: sci-fi poster": `clear
reset

agent text, input, "Innovate a movie poster for a sci-fi genre film titled: '","'"
agent dalle3, poster illustrator,,1024x1792

connect input, poster illustrator

hide
run`,

"example: DSLR camera": `clear
reset

agent text, input,,"cinematic-style; photorealistic; DSLR camera; wide-angle lens; low-light exposure"
agent dalle3, DSLR camera,,1792x1024

connect input, DSLR camera

hide
run`,

"example: google": `clear
reset

agent google, input

agent text, prompter, "Summarize the following list of google results to best explain the term that was queried without mentioning google or results but strictly focusing on the explanation of the term. Example: \\"Discover Mickey & Friends Products at DisneyStore.com · Mickey Mouse Icon Coaster Set – Mickey Mouse Home Collection. $24.99 · Mickey Mouse Icon Bottle Stopper ... Mickey Mouse ... For other uses, see Mickey Mouse (disambiguation). Mickey Mouse is an American cartoon character co-created in 1928 by Walt Disney and Ub Iwerks. Share your videos with friends family and the world. Watch full episodes of Mickey Mouse Clubhouse online. Get behind-the-scenes and extras all on Disney Junior. A reimagined blend, inspired by the iconic Mickey Mouse. Enjoy a smooth, medium-roasted coffee that is classic and delectable. This exclusive artisan coffee ... Watch full episodes of Disney Mickey Mouse online. Get behind-the-scenes and extras all on Disney Channel. 3M Followers, 13 Following, 1841 Posts - Mickey Mouse (@mickeymouse) on Instagram: 'Oh, boy! Welcome to the official Instagram of #MickeyMouse.' Jan 1, 2024 ... Copyright expiration allows you to use the original Mickey and Minnie Mouse in new creative works, even though those characters also appear in ... All-new series of cartoon shorts, Mickey Mouse finds himself in silly situations around the world! Mickey Mouse. 13758143 likes · 987 talking about this. Oh, boy!\\" -> \\"Mickey Mouse is an American cartoon character co-created by Walt Disney and Ub Iwerks, there are full episodes f Mickey Mouse cartoons available online. Mickey and Minnie Mouse are allowed to be used after copyright expiration in Jan 1 2024\\". Note that this was just an example, use it only to infer the type of response I expect to get. Please summarise the following list of google results, and please do not quote your response:"

agent openai, summariser,,,0.5

connect input, prompter
connect prompter, summariser

hide
run
`
};

const scriptsManager = new ScriptsManager();

export default scriptsManager;