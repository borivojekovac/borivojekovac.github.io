import fs from "./nodejs-emulation/fs.js";
import createObjectCsvWriter from "./nodejs-emulation/createObjectCsvWriter.js";
import Observable from "./observable.js";

class JiraExtractor extends Observable {
	constructor(jiraApi) {
		super();

		this.jiraApi = jiraApi;
		this.totalItems = 0;
		this.processedItemCount = 0;
		this.lastProgressUpdate = -1;
		this.startTime = null;
		this.lastProgressUpdateTime = null;
		this.lastProgressUpdate = null;
	}

	attachEventHandlers(handlers) {
		for (const handler of handlers) {
			this.eventEmitter.on(handler.event, handler.handler);
		}
	}

	async fetchIssues(jql) {
		return this.jiraApi.getPaged(
			`search?jql=${encodeURIComponent(
				jql
			)}&fields=key,summary,issuetype,status,parent`,
			"issues"
		);
	}

	async fetchChangelog(issueId) {
		return this.jiraApi.getPaged(
			`issue/${issueId}/changelog?maxResults=1000`,
			"values"
		);
	}

	async fetchEpics(epicKeys) {
		if (epicKeys.length === 0) {
			return [];
		}

		const jql = `key IN (${epicKeys.map((key) => `'${key}'`).join(",")})`;

		return this.jiraApi.getPaged(
			`search?jql=${encodeURIComponent(jql)}&fields=key,summary,issuetype`,
			"issues"
		);
	}

	updateProgress() {
        const currentTime = Date.now();
		const progress = (100.0 * this.processedItemCount / this.totalItems).toFixed(2);

		if (currentTime - this.lastProgressUpdateTime > 1000 && progress !== this.lastProgressUpdate) {
            
            const elapsedTime = (currentTime - this.startTime) / 1000;
			const avgTimePerItem = 1.0 * elapsedTime / this.processedItemCount;
			const remainingItems = this.totalItems - this.processedItemCount;
			const estimatedTimeLeft = this.formatTime(avgTimePerItem * remainingItems);

			this.onProgress("Extraction", progress, estimatedTimeLeft);
			this.lastProgressUpdate = progress;
			this.lastProgressUpdateTime = currentTime;
		}
	}

	formatTime(seconds) {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		return `${hrs > 0 ? `${hrs}h ` : ""}${mins > 0 ? `${mins}m ` : ""}${secs}s`;
	}

	async appendToCsv(filename, data, headers) {
		const csvWriter = createObjectCsvWriter({
			path: filename,
			header: headers.map((header) => ({ id: header, title: header })),
			append: fs.existsSync(filename),
		});

		await csvWriter.writeRecords(data);
	}

	async fetchStatusCategories() {
		var statusCategories = {};
		for (var status of await this.jiraApi.get("status")) {
			statusCategories[status.name] = status.statusCategory.name;
		}

		return statusCategories;
	}

	async run(parameters) {

		this.startTime = Date.now();
        this.lastProgressUpdateTime = null;
        this.lastProgressUpdate = null;

		const { jql, epicFile, itemFile, historyFile } = parameters;

		this.onInfo("Starting data extraction...");
		const processedEpics = this.readCsv(epicFile);
		const processedItemsSet = this.readCsv(itemFile);
		const processedHistoriesSet = this.readCsv(historyFile);

		this.onInfo("Fetching issues from Jira...");
		const issues = await this.fetchIssues(jql);
		this.totalItems = issues.length;
		this.onInfo(`Fetched ${this.totalItems} issues.`);

		const statusCategories = await this.fetchStatusCategories();
		this.onInfo("Status categories fetched.");

		const parentKeys = new Set();
		for (const issue of issues) {
			if (issue.fields.parent?.key) {
				parentKeys.add(issue.fields.parent.key);
			}
		}

		this.onDebug(
			`The list of the parent keys of the fetched items: ${Array.from(
				parentKeys
			).join(", ")}`
		);
		this.onInfo(`Fetching epics`);
		const epics = await this.fetchEpics(Array.from(parentKeys));

		for (const epic of epics) {
			if (!processedEpics.has(epic.key)) {
				this.onDebug(`Processing epic: ${epic.key}`);
				await this.appendToCsv(
					epicFile,
					[{ id: epic.key, title: epic.fields.summary.replace("\n", " ") }],
					["id", "title"]
				);
				this.onDebug(`Saved epic: ${epic.key}`);
			}
		}

		for (const issue of issues) {
			if (processedItemsSet.has(issue.key)) {
				this.onDebug(`Skipping already processed issue: ${issue.key}`);
				this.processedItemCount++;
				this.updateProgress();

				continue;
			}

			this.onDebug(`Processing issue: ${issue.key}`);
			const itemData = {
				id: issue.key,
				epicId: issue.fields.parent?.key || "",
				summary: issue.fields.summary.replace("\n", " "),
				type: issue.fields.issuetype.name,
				status: issue.fields.status.name,
				statusCategory: issue.fields.status.statusCategory.name,
			};

			await this.appendToCsv(
				itemFile,
				[itemData],
				["id", "epicId", "summary", "type", "status", "statusCategory"]
			);
			this.onDebug(`Saved issue: ${issue.key}`);

			if (!processedHistoriesSet.has(issue.key)) {
				this.onDebug(`Fetching changelog for issue: ${issue.key}`);
				const changelog = await this.fetchChangelog(issue.id);

				const statusChanges = [];
				for (const entry of changelog) {
					for (const item of entry.items) {
						if (item.field === "status") {
							statusChanges.push({
								id: issue.key,
								datetime: entry.created,
								status: item.toString,
								statusCategory: statusCategories[item.toString],
							});
						}
					}
				}

				if (statusChanges.length > 0) {
					await this.appendToCsv(historyFile, statusChanges, [
						"id",
						"datetime",
						"status",
						"statusCategory",
					]);
					this.onDebug(
						`Saved ${statusChanges.length} status changes for issue: ${issue.key}`
					);
				}
			}

			this.processedItemCount++;
			this.updateProgress();
		}

		this.onInfo("All data processed and saved.");
	}

	readCsv(filename) {
		if (fs.existsSync(filename)) {
			const data = fs.readFileSync(filename, "utf-8");
			const rows = data.split("\n").slice(1); // Skip the header row

			return new Set(rows.map((row) => row.split(",")[0]).filter(Boolean));
		}

		return new Set();
	}
}

export default JiraExtractor;
