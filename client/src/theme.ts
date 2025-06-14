import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f05133', // Git logo color (orange-red)
      light: '#f27059',
      dark: '#c41e3a',
    },
    secondary: {
      main: '#6e5494', // GitHub purple color
      light: '#8b7ba5',
      dark: '#4b3869',
    },
    background: {
      default: '#0d1117', // GitHub dark background (almost black)
      paper: '#161b22', // GitHub dark paper background (slightly lighter black)
    },
    text: {
      primary: '#e6edf3', // GitHub light text color
      secondary: '#8b949e', // GitHub muted text color
    },
    success: {
      main: '#2ea44f', // GitHub green
    },
    error: {
      main: '#f85149', // GitHub bright red
    },
    warning: {
      main: '#f9c513', // GitHub yellow
    },
    info: {
      main: '#58a6ff', // GitHub bright blue
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", "Consolas", monospace',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#f05133',
          boxShadow: '0px -2px 10px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          background: '#f05133',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '& code': {
            fontFamily: '"Roboto Mono", "Consolas", monospace',
            backgroundColor: '#21262d',
            padding: '0.2em 0.4em',
            borderRadius: '3px',
            fontSize: '85%',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          border: '1px solid #30363d',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            fontFamily: '"Roboto Mono", "Consolas", monospace',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0d1117',
          color: '#e6edf3',
        },
      },
    },
  },
});

export default theme;