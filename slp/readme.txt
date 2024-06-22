If you install node, then simply running server.bat will download and install a lightweight web server and serve the app so that you can access it through http://localhost:8080. You can also serve this from any plain HTTP(s) server you might have handy (for instance use github pages to publish from github repo on yourgithubusername.github.io etc.)

Once you start the app, review defaults (hamburger menu on top right, defaults), make sure you have your openAiKey in there (otherwise will need to specify the key for every openAi node you open):

{

"openAiModel": "gpt-3.5-turbo-instruct",

"openAiChatModel": "gpt-3.5-turbo",

"temperature": 1,

"maxTokens": 2048,

"openAiKey": "sk-xxxxxxxxx"
}

Commands haven't been documented, but if you look into js/commands folder, you should be able to figure them all out. To get started, just select a sample "program" from the main hamburger menu, "example comic".