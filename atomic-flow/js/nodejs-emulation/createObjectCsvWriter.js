function createObjectCsvWriter(options) {
	return {
		writeRecords: async (records) => {
			const { path, header } = options;
			const csv = [header.map((h) => h.title).join(",")].concat(
				records.map((r) =>
					header
						.map((h) => {
							const value = r[h.id];
							return value === null || value === undefined
								? ""
								: String(value);
						})
						.join(",")
				)
			).join("\n");
			await fs.writeFile(path, csv);
		},
	};
}

export default createObjectCsvWriter;