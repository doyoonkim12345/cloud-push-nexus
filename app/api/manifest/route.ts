import type { NextRequest } from "next/server";
import type { Bundle } from "@cloud-push/cloud";
import { dbNodeClient, storageNodeClient } from "@/cloud-push.server";
import {
	ErrorResponse,
	findRollbackTargetBundle,
	findUpdateTargetBundle,
	parseHeaders,
	UpdateResponse,
} from "@cloud-push/next";
import { createManifest } from "@cloud-push/next/node";
import type { Environment } from "@cloud-push/core";

export async function GET(request: NextRequest) {
	const {
		currentUpdateId,
		embeddedUpdateId,
		channel,
		platform,
		protocolVersion,
		runtimeVersion,
	} = parseHeaders({
		headers: request.headers,
		url: new URL(request.url),
	});

	if (
		!runtimeVersion ||
		!platform ||
		!protocolVersion ||
		!embeddedUpdateId ||
		!currentUpdateId ||
		!channel
	) {
		return ErrorResponse(new Error("Not Enough Params"));
	}

	try {
		const currentBundle = await dbNodeClient.find({
			conditions: { bundleId: currentUpdateId },
		});
		let nextBundle: Bundle | null;

		const isEmbedded = !currentBundle;

		await dbNodeClient.init?.();

		const bundles = await dbNodeClient.findAll({
			conditions: {
				runtimeVersion,
				environment: channel as Environment,
				supportAndroid: platform === "android" ? true : undefined,
				supportIos: platform === "ios" ? true : undefined,
			},
			sortOptions: [{ direction: "desc", field: "createdAt" }],
		});

		if (isEmbedded) {
			// latest
			nextBundle = bundles[0] ?? null;
		} else {
			switch (currentBundle?.updatePolicy) {
				case "FORCE_UPDATE":
				case "NORMAL_UPDATE":
					nextBundle = findUpdateTargetBundle(bundles, currentUpdateId) ?? null;
					break;
				case "ROLLBACK":
					nextBundle =
						findRollbackTargetBundle(bundles, currentUpdateId) ?? null;
					break;
				default:
					nextBundle = null;
					break;
			}
		}

		if (!nextBundle) {
			throw new Error("update not existed");
		}

		if (nextBundle.bundleId === currentBundle?.bundleId) {
			throw new Error("latest Version");
		}

		const manifest = await createManifest({
			environment: channel as Environment,
			bundleId: nextBundle.bundleId,
			platform,
			runtimeVersion,
			storageClient: storageNodeClient,
		});

		return UpdateResponse({ manifest, bundleId: nextBundle.bundleId });
	} catch (error) {
		return ErrorResponse(error as Error);
	}
}
