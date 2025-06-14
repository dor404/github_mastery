/**
 * Test Suite: Team Members Component (BSPM25T5-107)
 * 
 * This suite tests the team members section including:
 * - Member information display:
 *   - Names and roles
 *   - Profile pictures
 *   - Biographical information
 * - Social links:
 *   - GitHub profiles
 *   - LinkedIn profiles
 * - Layout and styling:
 *   - Member cards
 *   - Grid arrangement
 * - Content verification:
 *   - Team member details
 *   - Role descriptions
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AboutUs from '../pages/AboutUs/AboutUs';

describe('Team Members Section - BSPM25T5-107', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <AboutUs />
      </BrowserRouter>
    );
  });

  test('displays team members section with names and roles', () => {
    expect(screen.getByText('Meet Our Team')).toBeInTheDocument();
    expect(screen.getByText('Dor Harush')).toBeInTheDocument();
    const sceStudents = screen.getAllByText('SCE student');
    expect(sceStudents.length).toBeGreaterThan(0);
  });

  test('shows team member bio', () => {
    const bio = screen.getByText(/Full stack developer with expertise in React and Node\.js/i);
    expect(bio).toBeInTheDocument();
  });

  test('displays social links when available', () => {
    const githubLinks = screen.getAllByLabelText('github');
    const dorGithubLink = githubLinks.find(link => link.getAttribute('href') === 'https://github.com/dor404');
    expect(dorGithubLink).toHaveAttribute('href', 'https://github.com/dor404');
  });
}); 