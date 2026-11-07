import '../styles.css';
import '@seanyeh77/tokens/tokens.css';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Unmount after each test so roles and names stay unique.
afterEach(cleanup);
