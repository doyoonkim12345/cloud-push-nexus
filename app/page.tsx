import s3Queries from "@/features/versions/queries";
import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";

import type { Environment } from "@cloud-push/core";
import HomePageContent from "./_components/HomePageContent";
import { settingQueries } from "@/features/setting/queries";

export default async function Home(params: {
	searchParams: Promise<{ environment?: Environment; runtimeVersion?: string }>;
}) {
	const searchParams = await params.searchParams;
	const environment = searchParams.environment ?? "production";
	const runtimeVersion = searchParams.runtimeVersion;

	const queryClient = new QueryClient();

	const versionsQuery = s3Queries.versions(environment);
	const settingQuery = settingQueries.detail();

	await Promise.all([
		queryClient.prefetchQuery({ ...versionsQuery }),
		queryClient.prefetchQuery({ ...settingQuery }),
	]);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<HomePageContent
				environment={environment}
				runtimeVersion={runtimeVersion}
			/>
		</HydrationBoundary>
	);
}
