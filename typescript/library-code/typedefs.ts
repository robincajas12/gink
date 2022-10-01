export type Bytes = Uint8Array;
export type GreetingBytes = Bytes;
export type CommitBytes = Bytes;
export type Medallion = number;
export type Timestamp = number;
export type ChainStart = Timestamp;
export type SeenThrough = Timestamp;
export type PriorTime = Timestamp;
export type ClaimedChains = Map<Medallion, ChainStart>;
export type Offset = number;
export type FilePath = string;
export type NumberStr = string;
export type Basic = number | string | boolean | null;  // TODO: add bigints, bytes

export interface ChangeSetInfo {
    timestamp: Timestamp;
    medallion: Medallion;
    chainStart: ChainStart;
    priorTime?: PriorTime;
    comment?: string;
}

/**  An ordered version of ChangeSetInfo used for indexing. */
export type ChangeSetInfoTuple = [Timestamp, Medallion, ChainStart, PriorTime, string];

export interface CommitListener {
    (commitInfo: ChangeSetInfo): Promise<void>;
}

export interface CallBack {
    (value: any): void;
}

/**
 * Intended to be a way to point to a particular AddressableObject even if
 * the commit its associated with hasn't been sealed yet.
 */
export interface Address {
    medallion: Medallion | undefined;
    timestamp: Timestamp | undefined;
    offset: number;
}

export type AddressTuple = [Timestamp, Medallion, Offset];

export interface ServerArgs {
    port?: NumberStr;
    sslKeyFilePath?: FilePath;
    sslCertFilePath?: FilePath;
    medallion?: NumberStr;
    staticPath?: string;
}

export interface ContainerArgs {
    address?: Address,
}
