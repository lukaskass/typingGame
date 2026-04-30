import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';


jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAnimation: () => ({
    set: jest.fn(),
    start: jest.fn(() => new Promise(() => {})),
    stop: jest.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });


function typeWord(word: string) {
  word.split('').forEach(char => {
    fireEvent.keyDown(window, { key: char });
  });
}

function getCurrentWord(): string {
  const spans = document
    .querySelector('.col-span-2')
    ?.querySelectorAll('span');
  return spans ? Array.from(spans).map(s => s.textContent).join('') : '';
}


describe('App rendering', () => {
  beforeEach(() => {
    localStorageMock.clear();
    render(<App />);
  });

  it('renders a word on screen', () => {
    const word = getCurrentWord();
    expect(word.length).toBeGreaterThan(0);
  });

  it('renders the score starting at 0', () => {
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders the difficulty starting at 1', () => {
    const difficultyValue = screen.getAllByText('1');
    expect(difficultyValue.length).toBeGreaterThan(0);
  });

  it('renders the username input', () => {
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
  });
});

describe('Difficulty controls', () => {
  beforeEach(() => {
    localStorageMock.clear();
    render(<App />);
  });

  it('increases difficulty when up arrow is clicked', () => {
    const upButton = screen.getByRole('button', { name: /increase difficulty/i });
    fireEvent.click(upButton);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('decreases difficulty when down arrow is clicked', () => {
    const upButton = screen.getByRole('button', { name: /increase difficulty/i });
    const downButton = screen.getByRole('button', { name: /decrease difficulty/i });
    fireEvent.click(upButton); // difficulty -> 2
    fireEvent.click(downButton); // difficulty -> 1
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});

describe('Typing mechanics', () => {
  beforeEach(() => {
    localStorageMock.clear();
    render(<App />);
  });

  it('correctly typed characters turn coral', () => {
    const word = getCurrentWord();
    const firstChar = word[0];
    const spans = document.querySelector('.col-span-2')?.querySelectorAll('span');

    fireEvent.keyDown(window, { key: firstChar });

    // The first span should now be coral
    expect(spans?.[0]?.style.color).toBe('coral');
  });

  it('wrong key press does not change color', () => {
    const word = getCurrentWord();
    // Find a character that is NOT the first character
    const wrongChar = word[0] === 'a' ? 'b' : 'a';
    const spans = document.querySelector('.col-span-2')?.querySelectorAll('span');

    fireEvent.keyDown(window, { key: wrongChar });

    expect(spans?.[0]?.style.color).not.toBe('coral');
  });
});

describe('Score tracking', () => {
  beforeEach(() => {
    localStorageMock.clear();
    render(<App />);
  });

  it('score increases after typing a full word correctly at difficulty 1', () => {
    const word = getCurrentWord();
    typeWord(word);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('score multiplies by difficulty', () => {
    const upButton = screen.getByRole('button', { name: /increase difficulty/i });
    fireEvent.click(upButton); // difficulty -> 2
    fireEvent.click(upButton); // difficulty -> 3

    const word = getCurrentWord();
    typeWord(word);
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('score accumulates across multiple words', () => {
    const word1 = getCurrentWord();
    typeWord(word1);
    const word2 = getCurrentWord();
    typeWord(word2);
    // 10 + 10 = 20
    expect(screen.getByText('20')).toBeInTheDocument();
  });
});

describe('Leaderboard', () => {
  beforeEach(() => {
    localStorageMock.clear();
    render(<App />);
  });

  it('shows the leaderboard tab content when clicked', () => {
    const leaderboardTab = screen.getByRole('tab', { name: /leaderboard/i });
    fireEvent.mouseDown(leaderboardTab);
    expect(screen.getByText('Place')).toBeInTheDocument();
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('submits score and username to leaderboard', () => {
    const word = getCurrentWord();
    typeWord(word);

    const input = screen.getByPlaceholderText('Enter your username');
    fireEvent.change(input, { target: { value: 'TestPlayer' } });

    const submitBtn = screen.getByRole('button', { name: /^submit$/i });
    fireEvent.click(submitBtn);

    const leaderboardTab = screen.getByRole('tab', { name: /leaderboard/i });
    fireEvent.mouseDown(leaderboardTab);

    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('persists leaderboard entries in localStorage', () => {
    const word = getCurrentWord();
    typeWord(word);

    const input = screen.getByPlaceholderText('Enter your username');
    fireEvent.change(input, { target: { value: 'PersistUser' } });
    const submitBtn = screen.getByRole('button', { name: /^submit$/i });
    fireEvent.click(submitBtn);

    const stored = JSON.parse(localStorageMock.getItem('leaderboard') ?? '[]');
    expect(stored).toContainEqual({ username: 'PersistUser', score: 10 });
  });

  it('sorts leaderboard by score descending', () => {
    localStorageMock.setItem(
      'leaderboard',
      JSON.stringify([
        { username: 'Alice', score: 50 },
        { username: 'Bob', score: 200 },
        { username: 'Carol', score: 100 },
      ])
    );

    render(<App />);
    const leaderboardTab = screen.getAllByRole('tab', { name: /leaderboard/i })[1];
    fireEvent.mouseDown(leaderboardTab);

    const rows = screen.getAllByRole('row').slice(1); // skip header
    expect(rows[0]).toHaveTextContent('Bob');
    expect(rows[1]).toHaveTextContent('Carol');
    expect(rows[2]).toHaveTextContent('Alice');
  });
});
