class Logger {
	constructor(module, eventsToWatch) {
		if (!eventsToWatch) {
			eventsToWatch = Logger.events.standard;
		}

		for (var event of eventsToWatch) {
			if (event == "debug")
				module.eventEmitter.on("debug", this.onDebug.bind(this));
			if (event == "info")
				module.eventEmitter.on("info", this.onInfo.bind(this));
			if (event == "warning")
				module.eventEmitter.on("warning", this.onWarning.bind(this));
			if (event == "error")
				module.eventEmitter.on("error", this.onError.bind(this));
			if (event == "progress")
				module.eventEmitter.on(
					"progress",
					this.handleProgressUpdate.bind(this)
				);
		}
	}

	handleProgressUpdate(progress) {
		this.onProgress(progress.source, progress.progress, progress.estimatedTimeLeft);
	}

	onDebug(message) {}

	onInfo(message) {}

	onWarning(message) {}

	onError(message) {}

	onProgress(source, progress, estimatedTimeLeft) {}
}

Logger.events = {
	debug: ["debug", "info", "warning", "error", "progress"],
	standard: ["info", "warning", "error", "progress"],
	progressOnly: ["progress"],
};

export default Logger;
