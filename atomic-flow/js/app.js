import Logger from "./logger.js";
import JiraApi from "./jiraApi.js";
import JiraExtractor from "./jiraExtractor.js";
import JiraAggregator from "./JiraAggregator.js";
import ConsoleLogger from "./consoleLogger.js";

class App {

    constructor() {
        
    }

    persistValues() {

        const inputs = window.document.body.querySelectorAll(".persist-values input");

        for (const input of inputs) {

            const storedValue = localStorage.getItem(`persist-value-${input.id}`);

            if (storedValue !== null) {

                if (input.type === "checkbox") {

                    input.checked = storedValue === "true";
                } else {

                    input.value = storedValue;
                }
            }
    
            input.addEventListener("input", (event) => {

                if (event.target.type === "checkbox") {

                    localStorage.setItem(`persist-value-${event.target.id}`, event.target.checked);
                } else {

                    localStorage.setItem(`persist-value-${event.target.id}`, event.target.value);
                }
            });
        }
    }

    getValue(id) {

        return localStorage.getItem(`persist-value-${id}`) ?? null;
    }

    cacheElements(selector) {

        for (const element of window.document.body.querySelectorAll(selector)) {

            this.ui[element.id] = element;
        }
    }

    init() {

        this.ui = {};
        this.cacheElements("getValue, button");

        this.persistValues();

        this.ui.run.addEventListener("click", this.onRunClicked.bind(this));
    }
    
    async onRunClicked() {

        try {

            const jiraApi = new JiraApi(
                this.getValue("jira-host-text"),
                this.getValue("jira-api-username-text"),
                this.getValue("jira-api-token-password")
            );
    
            const jiraExtractor = new JiraExtractor(jiraApi);
            const jiraAggregator = new JiraAggregator(jiraApi);
    
            new ConsoleLogger(jiraApi, Logger.events.standard);
            new ConsoleLogger(jiraExtractor, Logger.events.standard);
            new ConsoleLogger(jiraAggregator, Logger.events.standard);
    
            await jiraExtractor.run({
                jql: this.getValue("jql-text"),
                epicFile: ".\\data\\epic-data.csv",
                itemFile: ".\\data\\item-data.csv",
                historyFile: ".\\data\\item-status-history.csv",
            });

            await jiraAggregator.run({
                weeks: this.getValue("period-weeks-text"),
                epicFile: ".\\data\\epic-data.csv",
                itemFile: ".\\data\\item-data.csv",
                historyFile: ".\\data\\item-status-history.csv",
                analysisFile: ".\\analysis\\aggregated-data.csv",
            });
        
        }
        /*catch (error) {

            log.error(error);
        }*/
        finally {
        }
    }

    run() {

        this.init();
    }
}

const app = new App();
export default app;