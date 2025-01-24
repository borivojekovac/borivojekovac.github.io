import axios from "./nodejs-emulation/axios.js";
import pLimit from "./nodejs-emulation/pLimit.js";
import Observable from "./observable.js";

class JiraApi extends Observable {
	constructor(host, email, token) {
		super();

		this.limit = pLimit(5);
		this.jiraApiUrl = `${host}/rest/api/3`;
		this.authHeader = {
			headers: {
				Authorization: `Basic ${btoa(`${email}:${token}`)}`,
				"Content-Type": "application/json",
			},
		};
	}

	async get(url) {
        return this.limit(async () => {
            let attempt = 1;
    
            while (attempt <= 3) {
                try {
                    this.onDebug(`Attempting to fetch data (attempt ${attempt})`);
                    
                    const response = await axios.get(
                        `${this.jiraApiUrl}/${url}`,
                        this.authHeader
                    );
                    this.onDebug(`Successfully fetched data`);
                    
                    return response.data;
                } catch (error) {
                    if (
                        attempt === 3 ||
                        ![429, 500, 503].includes(error.response?.status)
                    ) {
                        this.onError(
                            `Failed to fetch data from ${url}: ${
                                error.response?.data || error.message
                            }`
                        );
                        
                        throw error;
                    }
                    
                    this.onWarning(
                        `Retrying request to ${url} due to error: ${
                            error.response?.data || error.message
                        }`
                    );
                    attempt++;
                    
                    await new Promise((resolve) => {
                        setTimeout(resolve, attempt * 2000);
                    });
                }
            }
        });
    }

	async getPaged(url, dataKey) {
		let results = [];
		let startAt = 0;
		let isLast = false;

		while (!isLast) {
			this.onDebug(`Fetching data starting at index ${startAt}`);
			const response = await this.get(`${url}&startAt=${startAt}`);
			results = results.concat(response[dataKey] || []);
			startAt += response.maxResults || 50;
			isLast = startAt >= response.total;
			this.onDebug(`Fetched ${results.length} items so far.`);
		}

		return results;
	}
}

export default JiraApi;
