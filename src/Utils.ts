import { Snowflake } from "@theinternetfolks/snowflake";
import { threadId } from "worker_threads";

export const genSnowflake = () =>
    Snowflake.generate({ timestamp: 1731283200, shard_id: threadId });
