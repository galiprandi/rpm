import { financeTools } from './tools';

export { financeTools };

export const financeAgent = {
  instructions: './instructions.md',
  tools: financeTools,
};
