export type EdgeType = 'default' | 'conditional' | 'parallel' | 'looping';

export interface EdgeData extends Record<string, unknown> {
  label?: string;
  condition?: string;
  config?: Record<string, any>;
}

// Base class for all specialized edge configurations
export abstract class BaseEdgeConfig {
  abstract getConfigType(): string;
  abstract validate(): boolean;
}

// Conditional Edge Configuration
export class ConditionalEdgeConfig extends BaseEdgeConfig {
  condition: string = '';
  truePath?: string;
  falsePath?: string;
  operator: '>' | '<' | '==' | '!=' | '>=' | '<=' = '>';
  threshold: number = 0.5;
  metric: string = 'confidence';

  constructor(config?: Partial<ConditionalEdgeConfig>) {
    super();
    if (config) {
      Object.assign(this, config);
    }
  }

  getConfigType(): string {
    return 'conditional';
  }

  validate(): boolean {
    return this.condition.length > 0 && this.metric.length > 0;
  }

  getConditionString(): string {
    return `${this.metric} ${this.operator} ${this.threshold}`;
  }
}

// Parallel Edge Configuration
export class ParallelEdgeConfig extends BaseEdgeConfig {
  branches: string[] = [];
  waitForAll: boolean = true;
  timeout: number = 30000; // 30 seconds default
  description: string = '';

  constructor(config?: Partial<ParallelEdgeConfig>) {
    super();
    if (config) {
      Object.assign(this, config);
    }
  }

  getConfigType(): string {
    return 'parallel';
  }

  validate(): boolean {
    return this.branches.length > 1 && this.timeout > 0;
  }
}

// Looping Edge Configuration
export class LoopingEdgeConfig extends BaseEdgeConfig {
  maxIterations: number = 3;
  breakCondition: string = '';
  retryDelay: number = 1000; // 1 second default
  backoffMultiplier: number = 1.5;
  description: string = '';

  constructor(config?: Partial<LoopingEdgeConfig>) {
    super();
    if (config) {
      Object.assign(this, config);
    }
  }

  getConfigType(): string {
    return 'looping';
  }

  validate(): boolean {
    return this.maxIterations > 0 && this.retryDelay >= 0;
  }
}

// Specialized edge data interfaces
export interface ConditionalEdgeData extends EdgeData {
  config?: ConditionalEdgeConfig;
}

export interface ParallelEdgeData extends EdgeData {
  config?: ParallelEdgeConfig;
}

export interface LoopingEdgeData extends EdgeData {
  config?: LoopingEdgeConfig;
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
    id: string,
    source: string,
    target: string,
    type: EdgeType,
    data: EdgeData,
    animated?: boolean,
    style?: Record<string, any>
  ) {
    this.id = id;
    this.source = source;
    this.target = target;
    this.type = type;
    this.data = data;
    this.animated = animated;
    this.style = style;
  }

  // Method to update edge data
  updateData(newData: Partial<EdgeData>): WorkflowEdge {
    return new WorkflowEdge(
      this.id,
      this.source,
      this.target,
      this.type,
      { ...this.data, ...newData },
      this.animated,
      this.style
    );
  }

  // Method to update edge style
  updateStyle(newStyle: Record<string, any>): WorkflowEdge {
    return new WorkflowEdge(
      this.id,
      this.source,
      this.target,
      this.type,
      this.data,
      this.animated,
      { ...this.style, ...newStyle }
    );
  }

  // Method to set animation
  setAnimated(animated: boolean): WorkflowEdge {
    return new WorkflowEdge(
      this.id,
      this.source,
      this.target,
      this.type,
      this.data,
      animated,
      this.style
    );
  }

  // Method to check if edge is conditional
  isConditional(): boolean {
    return this.type === 'conditional';
  }

  // Method to check if edge is parallel
  isParallel(): boolean {
    return this.type === 'parallel';
  }

  // Method to check if edge is looping
  isLooping(): boolean {
    return this.type === 'looping';
  }

  // Method to create a copy of the edge
  clone(): WorkflowEdge {
    return new WorkflowEdge(
      this.id,
      this.source,
      this.target,
      this.type,
      { ...this.data },
      this.animated,
      this.style ? { ...this.style } : undefined
    );
  }
}
