import { render, screen } from '@testing-library/react';
import MyComponent from './App';

test('renders correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});