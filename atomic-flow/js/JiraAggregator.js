// Adding working hours calculation for durations within JiraAggregator

import fs from "./nodejs-emulation/fs.js";
import csvParser from "./nodejs-emulation/csvParser.js";
import { Parser } from "./nodejs-emulation/json2csv.js";
import Observable from "./observable.js";

class JiraAggregator extends Observable {
    constructor(jiraApi) {
        super();

        this.jiraApi = jiraApi;
		this.startTime = null;
		this.lastProgressUpdateTime = null;
		this.lastProgressUpdate = null;
    }

    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        return `${hrs > 0 ? `${hrs}h ` : ""}${mins > 0 ? `${mins}m ` : ""}${secs}s`;
    }

    async readCsv(fileName) {
        return new Promise((resolve, reject) => {
            const results = [];

            fs.createReadStream(fileName)
                .pipe(csvParser())
                .on("data", (data) => {
                    results.push(data);
                })
                .on("end", () => {
                    resolve(results);
                })
                .on("error", (error) => {
                    reject(error);
                });
        });
    }

    async writeCsv(fileName, data, fields) {
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);
        fs.writeFileSync(fileName, csv);
    }

    prepareHistoryMap(statusHistory) {
        const historyMap = {};

        for (const entry of statusHistory) {
            if (!historyMap[entry.id]) {
                historyMap[entry.id] = [];
            }

            historyMap[entry.id].push({
                datetime: new Date(entry.datetime),
                status: entry.status,
            });
        }

        for (const key in historyMap) {
            historyMap[key].sort((a, b) => a.datetime - b.datetime);
        }

        return historyMap;
    }

    calculateWorkingHoursDuration(startDateTime, endDateTime) {
        const WORK_START_HOUR = 10; // 10:00 AM CET
        const WORK_END_HOUR = 18; // 6:00 PM CET

        let totalHours = 0;
        let currentDateTime = new Date(startDateTime);

        while (currentDateTime < endDateTime) {
            const currentDay = currentDateTime.getDay();
            const isWeekend = (currentDay === 0 || currentDay === 6); // 0 = Sunday, 6 = Saturday

            if (!isWeekend) {
                const workStartTime = new Date(currentDateTime);
                workStartTime.setHours(WORK_START_HOUR, 0, 0, 0);

                const workEndTime = new Date(currentDateTime);
                workEndTime.setHours(WORK_END_HOUR, 0, 0, 0);

                if (endDateTime < workStartTime) {
                    break; // The period ends before working hours begin
                }

                const overlapStart = currentDateTime > workStartTime ? currentDateTime : workStartTime;
                const overlapEnd = endDateTime < workEndTime ? endDateTime : workEndTime;

                if (overlapStart < overlapEnd) {
                    const durationHours = (overlapEnd - overlapStart) / (1000 * 60 * 60);
                    totalHours += durationHours;
                }
            }

            // Move to the next day
            currentDateTime.setDate(currentDateTime.getDate() + 1);
            currentDateTime.setHours(0, 0, 0, 0);
        }

        return totalHours;
    }

    calculateAggregations(
        statusHistory,
        itemData,
        epicData,
        statusCategories,
        periodWeeks
    ) {
        this.startTime = Date.now();        
        this.lastProgressUpdateTime = null;
        this.lastProgressUpdate = null;

        const validDates = statusHistory
            .map((entry) => new Date(entry.datetime))
            .filter((date) => !isNaN(date));

        if (validDates.length === 0) {
            throw new Error("No valid dates found in status history.");
        }

        const firstDate = new Date(Math.min(...validDates));
        const lastDate = new Date(Math.max(...validDates));
        let currentPeriodStart = new Date(firstDate);
        let currentPeriodEnd = new Date(currentPeriodStart);
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + periodWeeks * 7);

        const aggregated = [];
        const totalPeriods = Math.ceil(
            (lastDate - firstDate) / (periodWeeks * 7 * 24 * 60 * 60 * 1000)
        );
        let processedPeriods = 0;

        const historyMap = this.prepareHistoryMap(statusHistory);

        while (currentPeriodStart <= lastDate) {
            const periodKey = currentPeriodEnd.toISOString().split("T")[0];

            for (const item of itemData) {
                const { id, summary, epicId } = item;
                const epic = epicData.find((e) => e.id === epicId) || {};

                const itemDurations = {};
                const itemWorkingHoursDurations = {}; // New structure for working hours
                const history = historyMap[id] || [];
                let previousStatus = null;
                let previousDate = null;

                // Check for the last known status before the current period
                for (let i = history.length - 1; i >= 0; i--) {
                    const { datetime, status } = history[i];
                    if (datetime < currentPeriodStart) {
                        previousStatus = status;
                        previousDate = datetime;
                        break;
                    }
                }

                // Calculate the duration for the previous status if it spans the period start
                if (previousStatus) {
                    const overlapStart = currentPeriodStart;
                    const overlapEnd = Math.min(currentPeriodEnd, lastDate);
                    const diff = (overlapEnd - overlapStart) / (1000 * 60 * 60); // Duration in hours
                    const workingDiff = this.calculateWorkingHoursDuration(overlapStart, overlapEnd);

                    if (!itemDurations[previousStatus]) {
                        itemDurations[previousStatus] = 0;
                        itemWorkingHoursDurations[previousStatus] = 0;
                    }

                    itemDurations[previousStatus] += diff;
                    itemWorkingHoursDurations[previousStatus] += workingDiff;
                }

                // Existing logic to process transitions
                for (let i = 0; i < history.length; i++) {
                    const { datetime, status } = history[i];

                    if (isNaN(datetime)) continue;

                    const prevEntry = i > 0 ? history[i - 1] : null;
                    const prevDate = prevEntry ? prevEntry.datetime : null;

                    if (
                        prevDate &&
                        datetime >= currentPeriodStart &&
                        prevDate < currentPeriodEnd
                    ) {
                        const overlapStart =
                            prevDate > currentPeriodStart ? prevDate : currentPeriodStart;
                        const overlapEnd =
                            datetime < currentPeriodEnd ? datetime : currentPeriodEnd;
                        const diff = (overlapEnd - overlapStart) / (1000 * 60 * 60); // Duration in hours
                        const workingDiff = this.calculateWorkingHoursDuration(overlapStart, overlapEnd);
                        const prevStatus = prevEntry.status;

                        if (!itemDurations[prevStatus]) {
                            itemDurations[prevStatus] = 0;
                            itemWorkingHoursDurations[prevStatus] = 0;
                        }

                        itemDurations[prevStatus] += diff;
                        itemWorkingHoursDurations[prevStatus] += workingDiff;
                    }
                }

                // Aggregate results as before
                for (const [status, duration] of Object.entries(itemDurations)) {
                    if (duration > 0) {
                        const statusCategory = statusCategories[status];
                        const workingHoursDuration = itemWorkingHoursDurations[status];

                        aggregated.push({
                            period: periodKey,
                            epic_id: epic.id || "",
                            epic_title: epic.title || "",
                            item_id: id,
                            item_summary: summary,
                            status,
                            statusCategory,
                            duration: duration.toFixed(2),
                            workingHoursDuration: workingHoursDuration.toFixed(2),
                        });
                    }
                }
            }

            processedPeriods++;
            
            const currentTime = Date.now();
            const progress = (100.0 * processedPeriods / totalPeriods).toFixed(2);

            if (currentTime - this.lastProgressUpdateTime > 1000 && progress != this.lastProgressUpdate) {

    			const elapsedTime = (currentTime - this.startTime) / 1000;
                const avgTimePerItem = 1.0 * elapsedTime / processedPeriods; // Average time per item
    			const remainingItems = totalPeriods - processedPeriods;
                const estimatedTimeLeft = this.formatTime(avgTimePerItem * remainingItems);

                this.onProgress("Aggregation", progress, estimatedTimeLeft);
                this.lastProgressUpdateTime = currentTime;
                this.lastProgressUpdate = progress;
            }

            currentPeriodStart = new Date(currentPeriodEnd);
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + periodWeeks * 7);
        }

        return aggregated;
    }

    async fetchStatusCategories() {
        var statusCategories = {};
        for (var status of await this.jiraApi.get("status")) {
            statusCategories[status.name] = status.statusCategory.name;
        }

        return statusCategories;
    }

    async run(parameters) {
        try {
            const itemData = await this.readCsv(parameters.itemFile);
            const epicData = await this.readCsv(parameters.epicFile);
            const statusHistory = await this.readCsv(parameters.historyFile);
            const periodWeeks = parameters.weeks;

            this.onInfo("Data loaded from CSV files.");

            const statusCategories = await this.fetchStatusCategories();
            this.onInfo("Status categories fetched.");

            const aggregatedData = this.calculateAggregations(
                statusHistory,
                itemData,
                epicData,
                statusCategories,
                periodWeeks
            );
            this.onInfo("Aggregations calculated.");

            const fields = [
                "period",
                "epic_id",
                "epic_title",
                "item_id",
                "item_summary",
                "status",
                "statusCategory",
                "duration",
                "workingHoursDuration", // Added new column
            ];
            await this.writeCsv(parameters.analysisFile, aggregatedData, fields);

            this.onInfo("Aggregated data has been saved to aggregated-data.csv");
        } catch (error) {
            this.onError(`Error generating aggregated CSVs: ${error.message}`);
        }
    }
}

export default JiraAggregator;
