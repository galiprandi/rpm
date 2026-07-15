import { workOrderTools } from './tools';

export { workOrderTools };

export const workOrderAgent = {
  instructions: './instructions.md',
  tools: workOrderTools,
};
