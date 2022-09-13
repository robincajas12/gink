import { Medallion, ChainStart, CommitBytes, Timestamp } from "./typedefs";
import { Commit } from "commit_pb";
import { Store } from "./Store";
import { extractCommitInfo } from "./utils";

export const MEDALLION1 = 425579549941797;
export const START_MICROS1 = Date.parse("2022-02-19 23:24:50") * 1000;
export const NEXT_TS1 = Date.parse("2022-02-20 00:39:29") * 1000;

export const MEDALLION2 = 458510670893748;
export const START_MICROS2 = Date.parse("2022-02-20 00:38:21") * 1000;
export const NEXT_TS2 = Date.parse("2022-02-20 00:40:12") * 1000;

export function makeChainStart(comment: string, medallion: Medallion, chainStart: ChainStart): CommitBytes {
    const commit = new Commit();
    commit.setChainStart(chainStart);
    commit.setTimestamp(chainStart);
    commit.setMedallion(medallion);
    commit.setComment(comment);
    return commit.serializeBinary();
}

export function extendChain(comment: string, previous: CommitBytes, timestamp: Timestamp): CommitBytes {
    const parsedPrevious = Commit.deserializeBinary(previous);
    const subsequent = new Commit();
    subsequent.setMedallion(parsedPrevious.getMedallion());
    subsequent.setPreviousTimestamp(parsedPrevious.getTimestamp());
    subsequent.setChainStart(parsedPrevious.getChainStart());
    subsequent.setTimestamp(timestamp); // one millisecond later
    subsequent.setComment(comment);
    return subsequent.serializeBinary();
}

export async function addTrxns(store: Store) {
    const start1 = makeChainStart("chain1,tx1", MEDALLION1, START_MICROS1);
    await store.addCommit(start1, extractCommitInfo(start1));
    const next1 = extendChain("chain1,tx2", start1, NEXT_TS1);
    await store.addCommit(next1, extractCommitInfo(next1));
    const start2 = makeChainStart("chain2,tx1", MEDALLION2, START_MICROS2);
    await store.addCommit(start2, extractCommitInfo(start2));
    const next2 = extendChain("chain2,2", start2, NEXT_TS2);
    await store.addCommit(next2, extractCommitInfo(next2));
}
