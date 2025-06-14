import React, { useState, useRef } from 'react';
import { Gitgraph, Mode, templateExtend, TemplateName, Orientation } from '@gitgraph/react';
import { Box, TextField, Button, Select, MenuItem } from '@mui/material';

interface GitGraphVisualizerProps {
  initialBranch?: string;
}

interface Commit {
  message: string;
  id: string;
}

interface BranchData {
  ref: any;
  commits: Commit[];
}

// Helper function to generate unique IDs for commits
const generateCommitId = () => {
  return Math.random().toString(36).substring(2, 15);
};

const GitGraphVisualizer: React.FC<GitGraphVisualizerProps> = ({
  initialBranch = 'main'
}) => {
  const [currentBranch, setCurrentBranch] = useState(initialBranch);
  const [newBranchName, setNewBranchName] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [branches, setBranches] = useState([initialBranch]);
  const gitgraphRef = useRef<{ 
    graph: any; 
    branches: Record<string, BranchData>;
  }>({ 
    graph: null,
    branches: {}
  });

  // Custom template
  const customTemplate = templateExtend(TemplateName.Metro, {
    colors: ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c'],
    branch: {
      lineWidth: 3,
      spacing: 40,
      label: {
        font: 'normal 12px Arial',
        color: '#e6edf3',
        bgColor: '#161b22',
        strokeColor: '#30363d',
      },
    },
    commit: {
      spacing: 45,
      dot: {
        size: 8,
        strokeColor: '#30363d',
        strokeWidth: 2,
      },
      message: {
        font: 'normal 12px Arial',
        color: '#e6edf3',
      },
    },
  });

  const handleCreateBranch = () => {
    if (newBranchName && gitgraphRef.current.branches[currentBranch]?.ref) {
      const newBranch = gitgraphRef.current.branches[currentBranch].ref.branch(newBranchName);
      gitgraphRef.current.branches[newBranchName] = {
        ref: newBranch,
        commits: gitgraphRef.current.branches[currentBranch].commits ? 
          [...gitgraphRef.current.branches[currentBranch].commits] : []
      };
      setBranches([...branches, newBranchName]);
      setNewBranchName('');
    }
  };

  const handleCommit = () => {
    if (commitMessage && gitgraphRef.current.branches[currentBranch]?.ref) {
      const commitId = generateCommitId();
      gitgraphRef.current.branches[currentBranch].ref.commit(commitMessage);
      
      // Ensure commits array exists
      if (!gitgraphRef.current.branches[currentBranch].commits) {
        gitgraphRef.current.branches[currentBranch].commits = [];
      }

      gitgraphRef.current.branches[currentBranch].commits.push({
        message: commitMessage,
        id: commitId
      });
      
      setCommitMessage('');
    }
  };

  const handleMerge = () => {
    if (currentBranch !== 'main' && 
        gitgraphRef.current.branches[currentBranch]?.ref && 
        gitgraphRef.current.branches['main']?.ref) {
      gitgraphRef.current.branches[currentBranch].ref.merge(gitgraphRef.current.branches['main'].ref);
    }
  };

  const handleRebase = () => {
    if (currentBranch !== 'main' && gitgraphRef.current.branches[currentBranch]) {
      try {
        const currentBranchData = gitgraphRef.current.branches[currentBranch];
        const mainBranchData = gitgraphRef.current.branches['main'];

        // Check if both branches and their refs exist
        if (!currentBranchData?.ref || !mainBranchData?.ref) {
          console.error('Branch references not found');
          return;
        }

        // Ensure commits arrays exist
        if (!currentBranchData.commits) {
          currentBranchData.commits = [];
        }
        if (!mainBranchData.commits) {
          mainBranchData.commits = [];
        }
        
        // Get commits that are unique to the current branch
        const mainCommitIds = new Set(mainBranchData.commits.map(c => c.id));
        const uniqueCommits = currentBranchData.commits.filter(commit => !mainCommitIds.has(commit.id));
        
        // Create a new branch from the current main
        const newBranchName = `${currentBranch}-rebased-${generateCommitId().substring(0, 4)}`;
        const newBranch = mainBranchData.ref.branch(newBranchName);
        
        // Recreate commits on the new branch
        uniqueCommits.forEach(commit => {
          newBranch.commit(commit.message);
        });
        
        // Update the branches list and references
        setBranches(prevBranches => {
          const filteredBranches = prevBranches.filter(b => b !== currentBranch);
          return [...filteredBranches, newBranchName];
        });

        // Update the branch reference and commits
        gitgraphRef.current.branches[newBranchName] = {
          ref: newBranch,
          commits: [...mainBranchData.commits, ...uniqueCommits]
        };
        
        // Delete the old branch
        delete gitgraphRef.current.branches[currentBranch];
        
        // Switch to the new branch
        setCurrentBranch(newBranchName);
      } catch (error) {
        console.error('Rebase failed:', error);
      }
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexDirection: 'column' }}>
        {/* Branch creation */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="New branch name"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#e6edf3',
                '& fieldset': {
                  borderColor: '#30363d',
                },
                '&:hover fieldset': {
                  borderColor: '#58a6ff',
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleCreateBranch}
            sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            Create Branch
          </Button>
        </Box>

        {/* Commit creation */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#e6edf3',
                '& fieldset': {
                  borderColor: '#30363d',
                },
                '&:hover fieldset': {
                  borderColor: '#58a6ff',
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleCommit}
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            Commit
          </Button>
        </Box>

        {/* Branch selection and operations */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Select
            value={currentBranch}
            onChange={(e) => setCurrentBranch(e.target.value)}
            size="small"
            fullWidth
            sx={{
              color: '#e6edf3',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#30363d',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#58a6ff',
              },
              '& .MuiSvgIcon-root': {
                color: '#e6edf3',
              },
            }}
          >
            {branches.map((branch) => (
              <MenuItem key={branch} value={branch}>{branch}</MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            onClick={handleMerge}
            disabled={currentBranch === 'main'}
            sx={{ 
              bgcolor: '#9333ea', 
              '&:hover': { bgcolor: '#7e22ce' },
              '&.Mui-disabled': {
                bgcolor: '#4c1d95',
                opacity: 0.5,
              }
            }}
          >
            Merge into main
          </Button>
          <Button
            variant="contained"
            onClick={handleRebase}
            disabled={currentBranch === 'main'}
            sx={{ 
              bgcolor: '#ea580c', 
              '&:hover': { bgcolor: '#c2410c' },
              '&.Mui-disabled': {
                bgcolor: '#7c2d12',
                opacity: 0.5,
              }
            }}
          >
            Rebase onto main
          </Button>
        </Box>
      </Box>

      {/* Git graph */}
      <Box sx={{ 
        height: '400px', 
        bgcolor: '#0d1117', 
        borderRadius: 1,
        border: '1px solid #30363d',
        overflow: 'auto',
        p: 2
      }}>
        <Gitgraph options={{ 
          template: customTemplate,
          mode: Mode.Compact,
          orientation: Orientation.Horizontal
        }}>
          {(gitgraph) => {
            // Store the gitgraph instance
            gitgraphRef.current.graph = gitgraph;
            
            // Initialize with main branch and a commit
            const main = gitgraph.branch("main");
            gitgraphRef.current.branches["main"] = {
              ref: main,
              commits: []
            };
            main.commit("Initial commit");
            gitgraphRef.current.branches["main"].commits.push({
              message: "Initial commit",
              id: generateCommitId()
            });
          }}
        </Gitgraph>
      </Box>
    </Box>
  );
};

export default GitGraphVisualizer; 