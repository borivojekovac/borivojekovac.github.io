import Logger from "./logger.js";

class ConsoleLogger extends Logger {
	onDebug(message) {
		console.log(`[DEBUG] ${message}`);
	}

	onInfo(message) {
		console.log(`[INFO] ${message}`);
	}

	onWarning(message) {
		console.log(`[WARNING] ${message}`);
	}

	onError(message) {
		console.error(`[ERROR] ${message}`);
	}

	onProgress(source, progress, estimatedTimeLeft) {
		console.log(
			`[PROGRESS] ${source} ${progress}%, time left: ${estimatedTimeLeft}`
		);
	}
}

export default ConsoleLogger;
