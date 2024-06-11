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

"example: camera": `clear
reset

agent text, input,,"cinematic-style, photorealistic, wide-angle lens, low-light exposure"
agent dalle3, camera,,1792x1024

connect input, camera

hide
run`,

"example: google": `clear
reset

agent google, input

agent text, prompter, "Can you infer what was the search query in the following list of google result snippets:\\\"","\\\"? Then, based on that inference and the information provided by Google, white a short explanation of the term being queried in a super funny and interesting way. Mark the term as a title of the document, and beneath the title show the explanation of what the term means and represents. Go crazy and make it super fun to read."

agent openaichat, joker,,,1.5

connect input, prompter
connect prompter, joker

hide
run
`
};

const scriptsManager = new ScriptsManager();

export default scriptsManager;