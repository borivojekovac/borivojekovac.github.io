class Parser {
    constructor(options) {
        this.fields = options.fields;
    }

    parse(data) {
        const csvHeader = this.fields.join(",");
        const csvRows = data.map(row => 
            this.fields.map(field => {
                const value = row[field];
                return value === null || value === undefined ? "" : String(value);
            }).join(",")
        );
        return [csvHeader, ...csvRows].join("\n");
    }
}

export { Parser };