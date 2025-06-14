/**
 * Test Suite: Project Vision Component (BSPM25T5-111)
 * 
 * This suite tests the project vision section including:
 * - Content display:
 *   - Project mission statement
 *   - Vision statement
 *   - Project origin
 * - Information sections:
 *   - About Git Mastery
 *   - Educational goals
 *   - Project background
 * - Text content:
 *   - Accessibility message
 *   - Developer background
 *   - Project purpose
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AboutUs from '../pages/AboutUs/AboutUs';

describe('Project Vision Section - BSPM25T5-111', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <AboutUs />
      </BrowserRouter>
    );
  });

  test('displays project mission and vision', () => {
    expect(screen.getByText('About Git Mastery')).toBeInTheDocument();
    const missionText = screen.getByText(/dedicated to making version control accessible to everyone/i);
    expect(missionText).toBeInTheDocument();
  });

  test('shows project origin information', () => {
    const originText = screen.getByText(/group of 5 developers working on a project in SCE college/i);
    expect(originText).toBeInTheDocument();
  });

  test('displays educational goals', () => {
    const educationalGoal = screen.getByText(/provide the most comprehensive Git learning platform/i);
    expect(educationalGoal).toBeInTheDocument();
  });
}); 