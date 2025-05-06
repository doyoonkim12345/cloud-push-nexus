import crypto, { type BinaryToTextEncoding } from "node:crypto";

export async function createHash(
	buffer: Buffer,
	hashingAlgorithm: string,
	encoding: BinaryToTextEncoding,
) {
	return crypto.createHash(hashingAlgorithm).update(buffer).digest(encoding);
}
