import { Module } from '../types/training';

// Training modules data structure used for tests
// These are mock modules to be used by tests only
export const trainingModules: Module[] = [
  {
    id: 'git-basics',
    title: 'Git Basics',
    description: 'Learn the fundamental concepts of Git version control',
    difficulty: 'beginner',
    content: 'This module introduces the basic concepts of Git version control.',
    estimatedTime: '30 minutes',
    tasks: [
      {
        id: '1',
        question: 'Initialize a Git Repository',
        description: 'Create a new Git repository in your project folder',
        solution: 'git init',
        hints: ['Use the git init command']
      },
      {
        id: '2',
        question: 'Add files to staging',
        description: 'Add all files to the staging area',
        solution: 'git add .',
        hints: ['Use the git add command with a dot']
      }
    ]
  },
  {
    id: 'branching-basics',
    title: 'Branching Basics',
    description: 'Learn about Git branches and how to work with them',
    difficulty: 'intermediate',
    content: 'This module teaches you how to work with branches in Git.',
    estimatedTime: '45 minutes',
    tasks: [
      {
        id: '1',
        question: 'Create a new branch',
        description: 'Create a new branch named "feature"',
        solution: 'git branch feature',
        hints: ['Use the git branch command followed by the branch name']
      },
      {
        id: '2',
        question: 'Switch to a branch',
        description: 'Switch to the "feature" branch',
        solution: 'git checkout feature',
        hints: ['Use the git checkout command followed by the branch name']
      }
    ]
  }
];

export default trainingModules; 