import mongoose, { Document, Schema, Model } from 'mongoose';

export const WORKER_HEARTBEAT_KEY = 'workers';

export interface IWorkerHeartbeatFields {
  key: string;
  lastSeenAt: Date;
}

export type IWorkerHeartbeat = IWorkerHeartbeatFields & { _id: unknown };

export interface IWorkerHeartbeatDocument
  extends IWorkerHeartbeatFields,
    Document {}

const workerHeartbeatSchema = new Schema<IWorkerHeartbeatDocument>({
  key: { type: String, required: true, unique: true },
  lastSeenAt: { type: Date, required: true },
});

export const WorkerHeartbeat: Model<IWorkerHeartbeatDocument> =
  mongoose.model<IWorkerHeartbeatDocument>(
    'WorkerHeartbeat',
    workerHeartbeatSchema,
  );
