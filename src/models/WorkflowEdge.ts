// src/models/WorkflowEdge.ts

export type EdgeType = 'default' | 'conditional' | 'parallel' | 'looping' | 'error';

export interface EdgeData {
  label?: string;
  config?: EdgeConfig;
}

export type EdgeConfig = ConditionalEdgeConfig | ParallelEdgeConfig | LoopingEdgeConfig;

export abstract class BaseEdgeConfig {
  abstract getConfigType(): string;
  abstract validate(): { isValid: boolean; message: string };
}

export class ConditionalEdgeConfig extends BaseEdgeConfig {
  condition: string = 'true';

  constructor(config?: Partial<ConditionalEdgeConfig>) {
    super();
    if (config) Object.assign(this, config);
  }

  getConfigType(): string { return 'conditional'; }

  validate(): { isValid: boolean; message: string } {
    if (!this.condition || this.condition.trim().length === 0) {
      return { isValid: false, message: 'Condition cannot be empty.' };
    }
    return { isValid: true, message: '' };
  }
}

export class ParallelEdgeConfig extends BaseEdgeConfig {
  description: string = 'Executes all outgoing branches simultaneously.';

  constructor(config?: Partial<ParallelEdgeConfig>) {
    super();
    if (config) Object.assign(this, config);
  }

  getConfigType(): string { return 'parallel'; }
  validate(): { isValid: boolean; message: string } { return { isValid: true, message: '' }; }
}

export class LoopingEdgeConfig extends BaseEdgeConfig {
  maxIterations: number = 5;
  breakCondition: string = '';

  constructor(config?: Partial<LoopingEdgeConfig>) {
    super();
    if (config) Object.assign(this, config);
  }

  getConfigType(): string { return 'looping'; }

  validate(): { isValid: boolean; message: string } {
    if (this.maxIterations <= 0) {
      return { isValid: false, message: 'Max iterations must be a positive number.' };
    }
    return { isValid: true, message: '' };
  }
}

export class WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  data: EdgeData;
  animated?: boolean;
  style?: Record<string, any>;

  constructor(
    id: string, source: string, target: string, type: EdgeType,
    data: EdgeData, animated?: boolean, style?: Record<string, any>
  ) {
    this.id = id;
    this.source = source;
    this.target = target;
    this.type = type;
    this.data = data;
    this.animated = animated;
    this.style = style;
  }
  
  getConfig<T extends BaseEdgeConfig>(): T | undefined {
    return this.data.config as T | undefined;
  }

  updateData(newData: Partial<EdgeData>): WorkflowEdge {
    return new WorkflowEdge(
      this.id, this.source, this.target, this.type,
      { ...this.data, ...newData }, this.animated, this.style
    );
  }

  isConditional(): boolean { return this.type === 'conditional'; }

  clone(): WorkflowEdge {
    let clonedConfig: EdgeConfig | undefined;

    // Correctly re-instantiate the config class
    if (this.data.config) {
      const configData = { ...this.data.config };
      switch (this.type) {
        case 'conditional':
          clonedConfig = new ConditionalEdgeConfig(configData as ConditionalEdgeConfig);
          break;
        case 'parallel':
          clonedConfig = new ParallelEdgeConfig(configData as ParallelEdgeConfig);
          break;
        case 'looping':
          clonedConfig = new LoopingEdgeConfig(configData as LoopingEdgeConfig);
          break;
      }
    }

    const clonedData = { ...this.data, config: clonedConfig };
    const clonedStyle = this.style ? { ...this.style } : undefined;

    return new WorkflowEdge(
      this.id, this.source, this.target, this.type,
      clonedData, this.animated, clonedStyle
    );
  }
}