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
property title, Comic artist
property prompt, Short description of a comic book page:
property action, Illustrate!

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
property title, Sci-fi poster designer
property prompt, Describe the movie to make a poster for:
property action, Design!

agent text, input, "Innovate a movie poster for a sci-fi genre film titled: '","'"
agent dalle3, poster illustrator,,1024x1792

connect input, poster illustrator

hide
run`,

"example: camera": `clear
reset
property title, Camera
property prompt, Enter subject to take a photograph of:
property action, Click!

agent text, input,,"cinematic-style, photorealistic, wide-angle lens, low-light exposure"
agent dalle3, camera,,1792x1024

connect input, camera

hide
run`,

"example: google": `clear
reset
property title, Google joker
property prompt, Enter a Google prompt:
property action, Search

agent google, input

agent text, prompter, "Can you infer what was the search query in the following list of google result snippets:\\\"","\\\"? Then, based on that inference and the information provided by Google, white a short explanation of the term being queried in a super funny and interesting way. Mark the term as a title of the document, and beneath the title show the explanation of what the term means and represents. Go crazy and make it super fun to read."

agent openaichat, joker,,,1.5

connect input, prompter
connect prompter, joker

hide
run`, 
"example: forecaster": `reset
property title, Weather forecaster
property prompt, Enter a place to get a forecast for:
property action, Forecast!

agent text, input, "weather forecast, "

agent google, query

agent openaichat, summariser,,,0.5,,"You are a dreadful agent which analyses top Google search results for weather forecast for a place in order to summarise it in an easy to follow and understand fashion for a human user. Your tone is always pessimistic and sinister. Infer the place for which the weather forecast was seached as well as the most likely forecast based on all the results you are given. When reporting your analysis do not explain the source of information, always identify the place that the forecast is for in the title, and then follow with clear and conversational description of the most likely forecast. If temperatures are provided in Fahrenheit always convert to Celsius. If wind speeds are provided in mph, always convert to km/h."

connect input, query
connect query, summariser

hide
run`,
"example: recipe book": `reset
property title, Recipe book
property prompt, Enter name of food:
property action, Get recipe!

agent text,input,"Create a step-by-step recipe for a delicious and healthy",". Include a list of ingredients, measurements, and detailed instructions: "
agent hftextgen,cookbook,,meta-llama/Meta-Llama-3-8B-Instruct,0.5

connect input, cookbook

hide
run`

};

const scriptsManager = new ScriptsManager();

export default scriptsManager;