# Red Mirror
Red Mirror is a simple javascript example of using the reflection pattern to reduce hallucinations and improve accuracy of responses with LLMs. Basically you use one LLM agent to respond to user prompt, then another LLM agent to assess quality of the reponse. If the response is not satisfactory, the second agent provides feedback about issues and the first agent tries to improve the reponse. Rinse and repeat until happy.

## A Simple Example of The Reflection Pattern

Setup:
* **Reviewer instructions**: the response needs to be presented in steps, and needs to be accurate.

Example thread:
* **User**: (3+2)*2=
* **Creator**: (3 + 2) * 2 = 10
* **Reviewer**: No, please present the steps of the calculation.
* **Creator**: (3 + 2) * 2 = 5 * 2 = 10
* **Reviewer**: Yes
* **Accepted Response**: (3 + 2) * 2 = 5 * 2 = 10

In this example, the first response didn't explain calculation steps, so the reviewer instructed the creator to fix this, which he successfully did, so the second answer was accepted as the correct one. Setup used is as follows:

* **LLM model**: ChatGPT 3.5 turbo
* **Creator agent instructions**: You are a helpful agent which responds to user prompts and tries to make the User happy. You do not talk about yourself. You NEVER ask questions. You ALWAYS provide STRAIGHT responses to user's prompts. You DO NOT comment on feedback, but instead correct your previous response to match the expectations and get a positive feedback.
* **Reviewer agent instructions**: You are a reviewer of agent's answers. You receive an agent's response and instructions on how to validate that response. If the response is valid per these instruction, you respond with a simple "Yes". Otherwise, you respond with a "No" and an explaination for agent to adjust his response in order to pass validation.
* **Reviewer sentiment checker instructions**: You are an agent who assesses whether a sentence is positive or negative. Sentence which starts with a "Yes", is always positive; otherwise it's negative. You ALWAYS respond with a single word: "positive" or "negative".
* **Reviewer agent prompt**: the response needs to be presented in steps, and needs to be accurate.

## Using Red Mirror

First step is to obtain an OpenAI API key, and paste it into the corresponding input field. Once you do that, the key will be stored in browser's localStorage and persist, so you'll be free to refresh the page without worry.

Next step is to enter Creator, then Reviewer prompt and finally press play. Also, feel free to play with persona instructions (agent "backstory") and the Sentiment Checker instructions, which assesses whether Reviewer response is positive or requires additional work from the Creator.

## Implementation

This is a super simple implementation, using only javascript to collect input, invoke OpenAI APIs and present responses. Feel free to explore the source code, in particular the following key areas:
* **openAiInterface.js** contains **OpenAiInterface** class which implements all interactions with OpenAi API, including creating a discussion thread, initialising LLM agents, sending and retrieving messages from them.
* **app.js** handls UI and implements key flow **onPlayClicked** event handler of initialising discussion thread, initialising multiple LLM agents and then directing conversation between the agents until a satisfactory result is generated.