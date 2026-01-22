import { buildCommands, validateAnswers } from './commandBuilder.js';

// Test cases
const testCases = [
  {
    name: 'React + Vite + Tailwind + ShadCN + Redux + OIDC',
    answers: {
      framework: 'react-vite',
      css: 'tailwind',
      components: 'shadcn',
      state: 'redux',
      auth: 'oidc'
    }
  },
  {
    name: 'Next.js + Tailwind + ShadCN + Redux',
    answers: {
      framework: 'nextjs',
      css: 'tailwind',
      components: 'shadcn',
      state: 'redux',
      auth: null
    }
  },
  {
    name: 'Angular + Vite + MUI (should skip Redux)',
    answers: {
      framework: 'angular-vite',
      css: 'css',
      components: 'mui',
      state: null,
      auth: null
    }
  },
  {
    name: 'React + Webpack + Tailwind + Ant Design + Redux',
    answers: {
      framework: 'react-webpack',
      css: 'tailwind',
      components: 'antd',
      state: 'redux',
      auth: null
    }
  },
  {
    name: 'Invalid: ShadCN without Tailwind (should skip ShadCN)',
    answers: {
      framework: 'react-vite',
      css: 'css',
      components: 'shadcn',
      state: null,
      auth: null
    },
    expectSkip: true
  },
  {
    name: 'Invalid: Redux with Angular (should skip Redux)',
    answers: {
      framework: 'angular-vite',
      css: 'css',
      components: 'plain',
      state: 'redux',
      auth: null
    },
    expectSkip: true
  }
];

console.log('=== Command Builder Tests ===\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log('Answers:', JSON.stringify(testCase.answers, null, 2));
  
  // Validate first
  const validation = validateAnswers(null, testCase.answers);
  console.log('Validation:', validation.isValid ? '✓ Valid' : '✗ Invalid');
  if (!validation.isValid) {
    console.log('Errors:', validation.errors);
  }
  
  // Try to build commands
  try {
    const commands = buildCommands(null, testCase.answers);
    console.log('Commands generated:');
    commands.forEach((cmd, i) => {
      console.log(`  ${i + 1}. ${cmd}`);
    });
    
    if (testCase.expectSkip && validation.isValid) {
      console.log('⚠ NOTE: Validation passed but invalid features were skipped');
    } else if (testCase.expectSkip && !validation.isValid) {
      console.log('✓ Invalid features correctly detected and skipped');
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
    if (!testCase.expectSkip) {
      console.log('⚠ WARNING: Unexpected error');
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
});
