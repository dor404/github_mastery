export interface GitCommit {
  id: string;
  message: string;
  author: string;
  timestamp: Date;
  branch: string;
}

export interface GitBranch {
  name: string;
  commits: GitCommit[];
  baseBranch?: string;
  baseCommitId?: string;
}

export interface CommitDetails {
  id: string;
  message: string;
  author: string;
  timestamp: Date;
  branch: string;
  parentCommits: string[];
}

export interface GitGraphState {
  branches: GitBranch[];
  currentBranch: string;
  commits: CommitDetails[];
} 