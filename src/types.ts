import type { OutputSelectorFields, Selector } from 'reselect'
import type { checkSelector, selectorGraph } from '.'

export type UnknownFunction = (...args: unknown[]) => unknown;

export type ResultSelector = Selector &
  Partial<OutputSelectorFields<UnknownFunction, unknown>>;

export type ObjectSelectors = Record<
  string, ResultSelector & {
    selectorName?: string;
  }
>;

export type RegisteredSelector = ResultSelector & {
  selectorName?: string;
};

export interface Extra {
  inputs: unknown[];
  output: ReturnType<RegisteredSelector>;
  error: string;
}

declare global {
  interface Window {
    __RESELECT_TOOLS__: {
      selectorGraph: typeof selectorGraph
      checkSelector: typeof checkSelector
    }

  }
}
