export interface TaskStep {
  instruction: string;
  solution: string;
  validationCommand?: string;
}

// Backward compatibility alias
export type ExerciseStep = TaskStep;

export interface Task {
  id: string;
  question: string;
  description: string;
  hints: string[];
  solution: string;
  validationCommand?: string;
  isStepByStep?: boolean;
  steps?: TaskStep[];
}

// Backward compatibility alias for Task (renamed from Exercise)
export type ExerciseType = Task;

export interface BranchNode {
  name: string;
  attributes?: {
    commit?: string;
    message?: string;
    timestamp?: string;
  };
  children?: BranchNode[];
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  content: string;
  tasks: Task[]; // Renamed from exercises to tasks
  prerequisites?: string[];
  difficulty: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: string;
}

// Backward compatibility alias
export type Module = Exercise;

export interface ExerciseProgress {
  exerciseId: string; // Renamed from moduleId
  userId?: string;
  completed: boolean;
  progress: number;
  tasks: TaskProgress[]; // Renamed from exercises to tasks
  startedAt?: Date;
  lastAccessed: Date;
  completedAt?: Date;
}

// Backward compatibility alias
export type ModuleProgress = ExerciseProgress;

export interface TaskProgress {
  taskId: string; // Renamed from exerciseId
  completed: boolean;
  completedSteps?: number[];
  startedAt?: Date;
  completedAt?: Date;
}

// Backward compatibility alias for TaskProgress (renamed from ExerciseProgress)
export type ExerciseProgressType = TaskProgress; 