import { dbBrowserClient } from "@/cloud-push.browser";
import type { Environment } from "@cloud-push/core";

const versionsQueries = {
	all: { queryKey: ["versions"] },
	versions: (environment?: Environment) => ({
		queryKey: [...versionsQueries.all.queryKey, "versions", environment],
		queryFn: async () => {
			await dbBrowserClient("init");
			const bundles = await dbBrowserClient("findAll", {
				conditions: { environment },
				sortOptions: [{ direction: "desc", field: "createdAt" }],
			});

			return bundles;
		},
	}),
};

export default versionsQueries;
