import { GinkInstance } from "../library-code/GinkInstance";
import { IndexedDbStore } from "../library-code/IndexedDbStore";
import { ChangeSet } from "../library-code/ChangeSet";
import { makeChainStart, MEDALLION1, START_MICROS1 } from "./test_utils";
import { assert } from "../library-code/utils";
import { ChangeSet as ChangeSetMessage } from "change_set_pb";
import { CommitBytes, ChangeSetInfo } from "../library-code/typedefs";


test('test commit', async () => {
    const store = new IndexedDbStore();
    const instance = new GinkInstance(store);
    const commitInfo = await instance.addChangeSet(new ChangeSet("hello world"));
    assert(commitInfo.comment == "hello world");
    const chainTracker = await store.getChainTracker();
    const allChains = chainTracker.getChains();
    assert(allChains.length == 1);
    assert(allChains[0][0] == commitInfo.medallion);
    assert(allChains[0][1] == commitInfo.chainStart);
    return "okay!";
});

test('uses claimed chain', async () => {
    const store = new IndexedDbStore("test", true);
    await store.initialized;
    const commitBytes = makeChainStart("chain start comment", MEDALLION1, START_MICROS1);
    await store.addChangeSet(commitBytes);
    await store.claimChain(MEDALLION1, START_MICROS1);
    store.getCommits((commitBytes: CommitBytes, _commitInfo: ChangeSetInfo) => {
        const commit = ChangeSetMessage.deserializeBinary(commitBytes);
        assert(commit.getComment() == "chain start comment")
    })
    const instance = new GinkInstance(store);
    await instance.initialized;
    const secondInfo = await instance.addChangeSet(new ChangeSet("Hello, Universe!"));
    assert(
        secondInfo.medallion == MEDALLION1 &&
        secondInfo.priorTime == START_MICROS1 &&
        secondInfo.chainStart == START_MICROS1
    );
})

export const result = 1;