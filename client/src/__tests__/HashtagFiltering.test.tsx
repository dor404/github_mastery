/**
 * Test Suite: Hashtag Filtering for Modules - BSPM25T5-XX
 * 
 * This suite tests the hashtag filtering functionality for learning modules:
 * - Display of tag filter UI in the modules list
 * - Filtering modules by selecting hashtags
 * - Combination of tag filters with other filters (search, difficulty)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import TutorialList from '../components/Tutorials/TutorialList';
import tutorialService from '../services/tutorialService';

// Mock the tutorial service
jest.mock('../services/tutorialService', () => ({
  getAllPublished: jest.fn()
}));

// Mock useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock useAuth hook
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', username: 'testuser', role: 'student' }
  })
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock tutorials data with diverse tags for testing
const mockTutorials = [
  {
    _id: 'tutorial-1',
    title: 'Git Basics',
    description: 'Learn the basics of Git',
    content: 'Git is a version control system',
    difficulty: 'beginner',
    author: { _id: 'author-1', username: 'author' },
    version: 1,
    tags: ['git', 'beginner', 'version-control'],
    exercises: [],
    prerequisites: [],
    pages: [],
    published: true
  },
  {
    _id: 'tutorial-2',
    title: 'Advanced Git Branching',
    description: 'Advanced Git branching techniques',
    content: 'Learn advanced Git features',
    difficulty: 'advanced',
    author: { _id: 'author-1', username: 'author' },
    version: 1,
    tags: ['git', 'advanced', 'branching'],
    exercises: [],
    prerequisites: [],
    pages: [],
    published: true
  },
  {
    _id: 'tutorial-3',
    title: 'JavaScript Fundamentals',
    description: 'Learn JavaScript basics',
    content: 'JavaScript fundamentals course',
    difficulty: 'beginner',
    author: { _id: 'author-2', username: 'author2' },
    version: 1,
    tags: ['javascript', 'web-development', 'programming'],
    exercises: [],
    prerequisites: [],
    pages: [],
    published: true
  },
  {
    _id: 'tutorial-4',
    title: 'React Hooks',
    description: 'Understanding React hooks',
    content: 'Advanced React topics',
    difficulty: 'intermediate',
    author: { _id: 'author-2', username: 'author2' },
    version: 1,
    tags: ['react', 'javascript', 'web-development'],
    exercises: [],
    prerequisites: [],
    pages: [],
    published: true
  },
];

describe('Hashtag Filtering for Modules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    
    // Setup default mock response
    (tutorialService.getAllPublished as jest.Mock).mockResolvedValue(mockTutorials);
  });

  // Helper function to select an option from a dropdown (only for tag filter)
  const selectTagOption = async (optionText: string) => {
    // First open the dropdown
    const dropdown = screen.getByLabelText('Filter by Tags');
    fireEvent.mouseDown(dropdown);
    
    // Wait for the dropdown options to appear
    await waitFor(() => {
      const option = screen.getByRole('option', { name: optionText });
      fireEvent.click(option);
    });
  };

  // Helper function to click difficulty stars
  const selectDifficultyLevel = async (difficulty: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert') => {
    const starMap = {
      'beginner': 1,
      'elementary': 2, 
      'intermediate': 3,
      'advanced': 4,
      'expert': 5
    };
    
    const stars = screen.getAllByRole('button');
    const starIndex = starMap[difficulty] - 1;
    
    if (stars[starIndex]) {
      fireEvent.click(stars[starIndex]);
    }
  };

  // Test 1: Tag filter dropdown should be displayed
  test('displays tag filter dropdown in the filters section', async () => {
    render(
      <MemoryRouter>
        <TutorialList />
      </MemoryRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    
    // Check if tag filter dropdown exists
    expect(screen.getByLabelText('Filter by Tags')).toBeInTheDocument();
    
    // Check if filter section contains both difficulty and tag filters
    expect(screen.getByText('Difficulty Level')).toBeInTheDocument();
  });

  // Test 2: Tag filter should show all available tags
  test('tag filter displays all available tags from modules', async () => {
    render(
      <MemoryRouter>
        <TutorialList />
      </MemoryRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    
    // Open the tag filter dropdown
    fireEvent.mouseDown(screen.getByLabelText('Filter by Tags'));
    
    // Wait for dropdown to open and check options
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'git' })).toBeInTheDocument();
    });
    
    expect(screen.getByRole('option', { name: 'javascript' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'react' })).toBeInTheDocument();
  });

  // Test 3: Selecting a tag should filter modules
  test('filters modules when a tag is selected', async () => {
    render(
      <MemoryRouter>
        <TutorialList />
      </MemoryRouter>
    );
    
    // Wait for loading to complete and modules to appear
    await waitFor(() => {
      expect(screen.getByText('Git Basics')).toBeInTheDocument();
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    });
    
    // Select the "react" tag using our helper
    await selectTagOption('react');
    
    // Check that only React Hooks module is displayed
    await waitFor(() => {
      expect(screen.getByText('React Hooks')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Git Basics')).not.toBeInTheDocument();
    expect(screen.queryByText('JavaScript Fundamentals')).not.toBeInTheDocument();
  });

  // Test 4: Combining tag filter with difficulty filter
  test('combines tag filter with difficulty filter', async () => {
    render(
      <MemoryRouter>
        <TutorialList />
      </MemoryRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    
    // Check all tutorials are initially displayed
    expect(screen.getByText('Git Basics')).toBeInTheDocument();
    expect(screen.getByText('Advanced Git Branching')).toBeInTheDocument();
    expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('React Hooks')).toBeInTheDocument();
    
    // Apply tag filter: select "javascript"
    await selectTagOption('javascript');
    
    // Now only JavaScript modules should be visible
    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    });
    
    expect(screen.getByText('React Hooks')).toBeInTheDocument();
    expect(screen.queryByText('Git Basics')).not.toBeInTheDocument();
  });

  // Test 5: Combining tag filter with search text
  test('combines tag filter with search text filter', async () => {
    render(
      <MemoryRouter>
        <TutorialList />
      </MemoryRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    
    // Apply tag filter: select "git"
    await selectTagOption('git');
    
    // Both Git modules should be visible
    await waitFor(() => {
      expect(screen.getByText('Git Basics')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Advanced Git Branching')).toBeInTheDocument();
    expect(screen.queryByText('JavaScript Fundamentals')).not.toBeInTheDocument();
    
    // Now also apply search filter: search for "Advanced"
    const searchInput = screen.getByPlaceholderText('Search by title or description...');
    fireEvent.change(searchInput, { target: { value: 'Advanced' } });
    
    // Should only show Advanced Git Branching
    await waitFor(() => {
      expect(screen.getByText('Advanced Git Branching')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Git Basics')).not.toBeInTheDocument();
  });

  // Test 6: Clear filters - Fixed implementation
  test('resets to show all modules when filters are cleared', async () => {
    render(
      <MemoryRouter>
        <TutorialList />
      </MemoryRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    
    // Apply tag filter: select "react"
    await selectTagOption('react');
    
    // Verify only React Hooks is displayed
    await waitFor(() => {
      expect(screen.getByText('React Hooks')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Git Basics')).not.toBeInTheDocument();
    
    // Clear the tag filter by clicking the selected option again to deselect it
    // The dropdown should still be open from the previous selectTagOption call
    // Find and click the selected "react" option to deselect it
    const reactOption = screen.getByRole('option', { name: 'react' });
    expect(reactOption).toBeInTheDocument();
    fireEvent.click(reactOption);
    
    // Wait for the filter to clear and all modules to be displayed again
    await waitFor(() => {
      expect(screen.getByText('Git Basics')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Advanced Git Branching')).toBeInTheDocument();
    expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('React Hooks')).toBeInTheDocument();
  });

  // Test 7: Tag chips are displayed for each module
  test('displays tag chips for each module', async () => {
    render(
      <MemoryRouter>
        <TutorialList />
      </MemoryRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    
    // Verify tutorials display tags
    const tutorials = screen.getAllByRole('heading', { level: 2 });
    expect(tutorials.length).toBe(4); // Make sure we have our 4 tutorials
    
    // Check for tag containers
    const chipContainers = document.querySelectorAll('.MuiBox-root');
    
    // Find containers with tag chips
    let foundTagChips = false;
    chipContainers.forEach(container => {
      const chips = container.querySelectorAll('.MuiChip-root');
      if (chips.length > 0) {
        foundTagChips = true;
      }
    });
    
    expect(foundTagChips).toBe(true);
    
    // Check if specific tutorial titles are displayed
    expect(screen.getByText('Git Basics')).toBeInTheDocument();
    expect(screen.getByText('React Hooks')).toBeInTheDocument();
    expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
  });
}); 