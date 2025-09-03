import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { withThemeFromJSXProvider } from '@storybook/addon-themes';
import { parentTheme } from '../src/theme/parentTheme';
import { childTheme } from '../src/theme/childTheme';
import '../src/index.css';

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#f8f9fa',
        },
        {
          name: 'dark',
          value: '#333333',
        },
      ],
    },
  },
};

export const decorators = [
  withThemeFromJSXProvider({
    themes: {
      parent: parentTheme,
      child: childTheme,
    },
    defaultTheme: 'parent',
    Provider: ThemeProvider,
    GlobalStyles: CssBaseline,
  }),
];

export default preview;