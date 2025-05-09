import s3Queries from "@/features/versions/queries";
import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";

import HomePageContent from "./_components/HomePageContent";
import { settingQueries } from "@/features/setting/queries";

export default async function Home(params: {
	searchParams: Promise<{ channel?: string; runtimeVersion?: string }>;
}) {
	const searchParams = await params.searchParams;
	const channel = searchParams.channel ?? "production";
	const runtimeVersion = searchParams.runtimeVersion;

	const queryClient = new QueryClient();

	const versionsQuery = s3Queries.versions(channel);
	const settingQuery = settingQueries.detail();

	await Promise.all([
		queryClient.prefetchQuery({ ...versionsQuery }),
		queryClient.prefetchQuery({ ...settingQuery }),
	]);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<HomePageContent channel={channel} runtimeVersion={runtimeVersion} />
		</HydrationBoundary>
	);
}
