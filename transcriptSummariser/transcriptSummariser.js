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
			// Let text stretch in the vertical dimension and scroll if needed
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
	 * Display a large modal (95% w/h) with a title, text, an OK button, and a "Copy to Clipboard" button.
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

	function getTextToSummarise(e) {
		const elemClicked = e.target;
		const oneTranscriptParent = elemClicked.closest("#OneTranscript");

		if (oneTranscriptParent) {
			return oneTranscriptParent.textContent;
		} else {
			return elemClicked.innerText;
		}
	}

	async function onClick(e) {
		try {
			const textToSummarise = getTextToSummarise(e);

			const response = await fetch(
				"https://api.openai.com/v1/chat/completions",
				{
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
								content: `Prompt for Summarizing a Meeting Transcript

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

${textToSummarise}`,
							},
						],
					}),
				}
			);

			const data = await response.json();
			const summary = data.choices[0].message.content;

			await displayText("Summary", summary);
		} catch (ex) {
			await displayText("Error", ex.toString());
		} finally {
			document.removeEventListener("click", onClickHandler);
			onClickHandler = null;
		}
	}

	const openAiApiKey = await getOpenAiApiKey();
	var onClickHandler = onClick.bind(this);
	document.addEventListener("click", onClickHandler);
})();
