(async function () {
    /**
     * A helper function to apply a set of style properties inline on an element.
     * @param {HTMLElement} el - The element to style.
     * @param {Object} styleObj - Key/value pairs of style properties to apply.
     */
    function applyStyles(el, styleObj) {
        for (const [prop, val] of Object.entries(styleObj)) {
            el.style[prop] = val;
        }
    }

    // Centralized style definitions
    const modalStyles = {
        overlay: {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(3px)",
            zIndex: "9999",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        },
        dialog: {
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
            width: "50%",
            minWidth: "20vw",
            maxWidth: "600px",
        },
        dialogLarge: {
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
            width: "95%",
            height: "95%",
        },
        title: {
            fontSize: "1.2em",
            marginBottom: "8px",
            fontWeight: "bold",
        },
        label: {
            display: "block",
            marginBottom: "4px",
        },
        textContainer: {
            flex: "1",
            overflowY: "auto",
            marginBottom: "16px",
            fontSize: "1em",
            whiteSpace: "pre-wrap",
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
        },
        input: {
            width: "100%",
            boxSizing: "border-box",
            marginBottom: "16px",
            padding: "8px",
            fontSize: "1em",
        },
        buttons: {
            textAlign: "right",
        },
        button: {
            marginLeft: "8px",
            padding: "6px 12px",
            fontSize: "1em",
            cursor: "pointer",
        },
    };

    /**
     * Creates a modal dialog asking user for input.
     * @param {string} title - The title of the dialog.
     * @param {string} label - The label text above the input field.
     * @param {string|null} value - Initial value for the text input (could be null).
     * @returns {Promise<string|null>} Resolves with user input if OK, or the original `value` if Cancel.
     */
    async function getInputFromUser(title, label, value) {
        return new Promise((resolve) => {
            // Create overlay
            const overlay = document.createElement("div");
            applyStyles(overlay, modalStyles.overlay);

            // Prevent any click outside the dialog from closing it
            overlay.addEventListener("click", (event) => {
                if (event.target === overlay) {
                    // Ignore clicks on the overlay itself
                    event.stopPropagation();
                }
            });

            // Create dialog container
            const dialog = document.createElement("div");
            applyStyles(dialog, modalStyles.dialog);

            // Stop click events from bubbling to the overlay
            dialog.addEventListener("click", (event) => {
                event.stopPropagation();
            });

            // Title
            const titleEl = document.createElement("div");
            applyStyles(titleEl, modalStyles.title);
            titleEl.textContent = title;

            // Label
            const labelEl = document.createElement("label");
            applyStyles(labelEl, modalStyles.label);
            labelEl.textContent = label;

            // Input
            const inputEl = document.createElement("input");
            applyStyles(inputEl, modalStyles.input);
            inputEl.type = "text";
            inputEl.value = value ?? "";

            // Buttons container
            const buttonsEl = document.createElement("div");
            applyStyles(buttonsEl, modalStyles.buttons);

            // OK button
            const okBtn = document.createElement("button");
            applyStyles(okBtn, modalStyles.button);
            okBtn.textContent = "OK";
            okBtn.addEventListener("click", () => {
                cleanup();
                resolve(inputEl.value);
            });

            // Cancel button
            const cancelBtn = document.createElement("button");
            applyStyles(cancelBtn, modalStyles.button);
            cancelBtn.textContent = "Cancel";
            cancelBtn.addEventListener("click", () => {
                cleanup();
                resolve(value);
            });

            // Append elements
            buttonsEl.appendChild(okBtn);
            buttonsEl.appendChild(cancelBtn);

            dialog.appendChild(titleEl);
            dialog.appendChild(labelEl);
            dialog.appendChild(inputEl);
            dialog.appendChild(buttonsEl);

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Remove the modal from DOM
            function cleanup() {
                document.body.removeChild(overlay);
            }
        });
    }

    /**
     * Display a large modal (95% w/h) with a title, text, an OK button,
     * and a "Copy to Clipboard" button.
     * @param {string} title - The dialog title.
     * @param {string} text - The text content to display (multi-line supported).
     * @returns {Promise<void>} Resolves when user clicks OK.
     */
    async function displayText(title, text) {
        return new Promise((resolve) => {
            // Create overlay
            const overlay = document.createElement("div");
            applyStyles(overlay, modalStyles.overlay);

            // Prevent click outside from closing it
            overlay.addEventListener("click", (event) => {
                if (event.target === overlay) {
                    event.stopPropagation();
                }
            });

            // Create large dialog
            const dialog = document.createElement("div");
            applyStyles(dialog, modalStyles.dialogLarge);

            // Prevent the dialog itself from closing
            dialog.addEventListener("click", (event) => {
                event.stopPropagation();
            });

            // Title
            const titleEl = document.createElement("div");
            applyStyles(titleEl, modalStyles.title);
            titleEl.textContent = title;

            // Scrollable text container
            const textEl = document.createElement("div");
            applyStyles(textEl, modalStyles.textContainer);
            textEl.textContent = text;

            // Buttons container
            const buttonsEl = document.createElement("div");
            applyStyles(buttonsEl, modalStyles.buttons);

            // Copy button
            const copyBtn = document.createElement("button");
            applyStyles(copyBtn, modalStyles.button);
            copyBtn.textContent = "Copy to Clipboard";
            copyBtn.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(text);
                    console.log("Text copied to clipboard");
                } catch (err) {
                    console.error("Failed to copy text", err);
                }
            });

            // OK button
            const okBtn = document.createElement("button");
            applyStyles(okBtn, modalStyles.button);
            okBtn.textContent = "OK";
            okBtn.addEventListener("click", () => {
                cleanup();
                resolve();
            });

            buttonsEl.appendChild(copyBtn);
            buttonsEl.appendChild(okBtn);

            dialog.appendChild(titleEl);
            dialog.appendChild(textEl);
            dialog.appendChild(buttonsEl);

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Cleanup function to remove DOM
            function cleanup() {
                document.body.removeChild(overlay);
            }
        });
    }

    /**
     * Reads a cookie by name.
     * @param {string} name - Cookie name.
     * @returns {string|null} Cookie value if found, otherwise null.
     */
    function getCookie(name) {
        const match = document.cookie.match(
            new RegExp(
                "(^|; )" + name.replace(/([\.$?*|{}()\]\\\/+^])/g, "\\$1") + "=([^;]*)"
            )
        );
        return match ? decodeURIComponent(match[2]) : null;
    }

    /**
     * Sets a cookie.
     * @param {string} name - Cookie name.
     * @param {string} value - Cookie value.
     * @param {number} days - Number of days until the cookie expires.
     */
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${encodeURIComponent(
            value
        )}; expires=${date.toUTCString()}; path=/`;
    }

    /**
     * Checks if `openAiApiKey` cookie is set; if it is, returns it.
     * Otherwise, prompts user to enter it (via getInputFromUser).
     * If user provides a value, stores it in the cookie and returns it.
     * If user cancels or provides null, returns null.
     */
    async function getOpenAiApiKey() {
        const existingKey = getCookie("openAiApiKey");
        if (existingKey) {
            return existingKey;
        }
        // No cookie found, ask user for input
        const userKey = await getInputFromUser(
            "Open AI API Key Missing",
            "Open AI API Key:",
            null
        );
        // userKey will be null if canceled; or it will be the new value if OK was clicked.
        if (userKey !== null) {
            setCookie("openAiApiKey", userKey, 365); // store for 1 year
            return userKey;
        }
        return null;
    }

    /**
     * Returns the full prompt text to summarize, based on which element was clicked.
     * @param {MouseEvent} e
     * @returns {string} The prompt text to send to OpenAI.
     */
    function getPromptToSummarise(e) {
        const elemClicked = e.target;
        const oneTranscriptParent = elemClicked.closest("#OneTranscript");

        if (oneTranscriptParent) {
            return `Prompt for Summarizing a Meeting Transcript

Role/Style: You are an expert meeting summarizer with a talent for capturing essential details, participant interactions, and action items in a well-structured and concise format.

Task: Summarize the following transcript. Your summary should be logically organized, capturing key points and decisions, participant contributions, and next steps (if provided).

Structure & Guidelines:

Meeting Context/Overview
Briefly describe the purpose of the meeting, its date/time (if relevant), and the main topic(s) discussed.
Key Discussion Points
Highlight the major themes, questions, or issues that were raised.
Note any relevant background information or clarifications.
Participant Contributions
Identify who asked key questions, provided insights, or raised concerns.
Summarize noteworthy comments or perspectives from participants without over-detailing every minor point.
Decisions & Agreements
Specify any decisions made, conclusions reached, or consensus formed.
If there are no concrete decisions, indicate that as well.
Next Steps & Action Items
Clearly list out any follow-up tasks, responsible persons, and deadlines (if mentioned).
If no next steps are explicitly stated, summarize any pending considerations or possible areas for future discussion.
Format & Style:

Keep the summary concise and well-organized.
Aim for a balanced length: not overly brief, but not excessively detailed.
Use bullet points or short paragraphs for readability.
Use neutral, professional language without personal opinions or assumptions.
Transcript to Summarize:

${oneTranscriptParent.textContent}`;
        } else {
            return `Role/Style: You are an expert content summarizer with a sharp eye for detail, tasked with providing a concise yet comprehensive overview of a webpage’s text content (innerText).

Task: Summarize the text from the webpage provided. Your summary should be logically organized, reflecting the main topics, subtopics, and key takeaways in a structured, concise, and reader-friendly format.

Structure & Guidelines:

Webpage Title/Overall Theme
Briefly introduce the subject or title of the webpage.
State the primary purpose or theme of the content (e.g., blog article, product description, news story, how-to guide, etc.).
Main Sections/Headings
Identify any major sections or headings that structure the content.
Provide short overviews of each section.
Key Points/Arguments/Insights
List the essential arguments, insights, or data presented on the page.
Highlight any noteworthy facts, statistics, or figures.
If applicable, mention examples or supporting evidence.
Calls to Action or Recommendations
Note any instructions, suggestions, or calls to action (e.g., subscribe, download, register, etc.).
Include any recommended next steps or follow-up actions mentioned.
Conclusion/Summary of Findings
Provide a concise wrap-up of the content’s main takeaway.
Mention the final impression or concluding remarks of the webpage (if any).
Format & Style:

Write in clear, neutral, and professional language without injecting personal opinions.
Keep the summary balanced in length: thorough, yet not overly detailed.
Use bullet points or short paragraphs for readability and organization.
Do not include extraneous information that is not directly relevant to the webpage’s key content.
Webpage Text (innerText):

${elemClicked.innerText}`;
        }
    }

    /**
     * Returns the element that would be summarized (for highlighting).
     * If #OneTranscript is an ancestor of the hovered node, return that;
     * otherwise, fallback to document.body.
     */
    function getElementToSummarize(e) {
        const elemOver = e.target;
        const oneTranscriptParent = elemOver.closest("#OneTranscript");
        return oneTranscriptParent || elemOver;
    }

    // Keep track of the last element we highlighted, so we can remove styling from it.
    let lastHighlightedElement = null;

    /**
     * Mouse-move handler: highlights the element that would be summarized.
     */
    function onMouseMoveHandler(e) {
        const newEl = getElementToSummarize(e);

        if (newEl !== lastHighlightedElement) {
            // Remove highlight from the previously highlighted element
            if (lastHighlightedElement) {
                lastHighlightedElement.style.outline = "";
            }
            // Highlight the new element
            lastHighlightedElement = newEl;
            lastHighlightedElement.style.outline = "2px solid red";
        }
    }

    /**
     * Show a full-page overlay with a spinner and blur the page.
     * Returns a cleanup function to remove the overlay and restore the page style.
     */
    function showLoadingOverlay() {
        // Inject a <style> with keyframes for the spinner rotation
        const styleEl = document.createElement("style");
        styleEl.textContent = `
            @keyframes spin {
                0%   { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleEl);

        // Create the overlay
        const overlay = document.createElement("div");
        applyStyles(overlay, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: "99999",
        });

        // Create the spinner
        const spinner = document.createElement("div");
        applyStyles(spinner, {
            width: "48px",
            height: "48px",
            border: "6px solid #f3f3f3",
            borderTop: "6px solid #3498db",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
        });
        overlay.appendChild(spinner);

        // Blur the entire page and prevent clicks
        document.body.style.filter = "blur(2px)";
        document.body.style.pointerEvents = "none";

        // Add the overlay to the body
        document.body.appendChild(overlay);

        // Return a cleanup function
        return function cleanup() {
            // Restore page style
            document.body.style.filter = "";
            document.body.style.pointerEvents = "";
            // Remove overlay and spinner
            document.body.removeChild(overlay);
            // Remove the dynamic style element
            document.head.removeChild(styleEl);
        };
    }

    /**
     * Main click handler: calls OpenAI with the appropriate prompt,
     * then removes event listeners (deactivates the app), stops highlighting,
     * and shows a loading spinner until the request finishes.
     */
    async function onClickHandler(e) {
        // 1) Immediately remove mousemove highlighting
        document.removeEventListener("mousemove", onMouseMoveHandler);
        if (lastHighlightedElement) {
            lastHighlightedElement.style.outline = "";
            lastHighlightedElement = null;
        }

        // 2) Also remove the click listener to prevent further triggers
        document.removeEventListener("click", onClickHandler);

        // Show the loading overlay & blur
        const removeOverlay = showLoadingOverlay();

        try {
            // Generate the prompt
            const prompt = getPromptToSummarise(e);

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${openAiApiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                }),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            const summary = data.choices[0].message.content;
            // Hide overlay before displaying text
            removeOverlay();
            await displayText("Summary", summary);
        } catch (ex) {
            // Hide overlay before showing error
            removeOverlay();
            await displayText("Error", ex.toString());
        }
    }

    // Fetch the OpenAI API key (cookie or prompt)
    const openAiApiKey = await getOpenAiApiKey();
    if (!openAiApiKey) {
        // If the user never provides a key, do nothing.
        return;
    }

    // Listen for mouse movement to highlight the element that would be summarized
    document.addEventListener("mousemove", onMouseMoveHandler);
    // Listen for click to trigger the summarization and remove listeners
    document.addEventListener("click", onClickHandler);
})();
