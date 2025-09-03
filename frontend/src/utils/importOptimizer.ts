/**
 * Import Optimizer Utility
 * 
 * This utility provides functions to help optimize imports across the application,
 * particularly for Material UI components to ensure proper tree shaking.
 */

/**
 * Creates a record of optimized Material UI component imports
 * Use this to avoid importing from the root @mui/material package
 * 
 * Example usage:
 * import { muiComponents } from '@/utils/importOptimizer';
 * const { Button, TextField } = muiComponents;
 */
export const createOptimizedImports = <T extends Record<string, any>>(components: T): T => {
  return components;
};

// Pre-optimized Material UI components
// This helps with tree-shaking by importing directly from specific paths
export const muiComponents = {
  // Layout components
  Box: require('@mui/material/Box').default,
  Container: require('@mui/material/Container').default,
  Grid: require('@mui/material/Grid').default,
  Stack: require('@mui/material/Stack').default,
  
  // Navigation components
  AppBar: require('@mui/material/AppBar').default,
  Drawer: require('@mui/material/Drawer').default,
  Tabs: require('@mui/material/Tabs').default,
  Tab: require('@mui/material/Tab').default,
  
  // Surfaces
  Paper: require('@mui/material/Paper').default,
  Card: require('@mui/material/Card').default,
  CardContent: require('@mui/material/CardContent').default,
  CardHeader: require('@mui/material/CardHeader').default,
  CardActions: require('@mui/material/CardActions').default,
  CardMedia: require('@mui/material/CardMedia').default,
  
  // Feedback
  Alert: require('@mui/material/Alert').default,
  Snackbar: require('@mui/material/Snackbar').default,
  CircularProgress: require('@mui/material/CircularProgress').default,
  LinearProgress: require('@mui/material/LinearProgress').default,
  Dialog: require('@mui/material/Dialog').default,
  DialogTitle: require('@mui/material/DialogTitle').default,
  DialogContent: require('@mui/material/DialogContent').default,
  DialogActions: require('@mui/material/DialogActions').default,
  
  // Inputs
  Button: require('@mui/material/Button').default,
  TextField: require('@mui/material/TextField').default,
  Select: require('@mui/material/Select').default,
  MenuItem: require('@mui/material/MenuItem').default,
  FormControl: require('@mui/material/FormControl').default,
  FormHelperText: require('@mui/material/FormHelperText').default,
  InputLabel: require('@mui/material/InputLabel').default,
  Checkbox: require('@mui/material/Checkbox').default,
  Radio: require('@mui/material/Radio').default,
  RadioGroup: require('@mui/material/RadioGroup').default,
  Switch: require('@mui/material/Switch').default,
  
  // Data display
  Typography: require('@mui/material/Typography').default,
  List: require('@mui/material/List').default,
  ListItem: require('@mui/material/ListItem').default,
  ListItemText: require('@mui/material/ListItemText').default,
  ListItemIcon: require('@mui/material/ListItemIcon').default,
  Table: require('@mui/material/Table').default,
  TableBody: require('@mui/material/TableBody').default,
  TableCell: require('@mui/material/TableCell').default,
  TableContainer: require('@mui/material/TableContainer').default,
  TableHead: require('@mui/material/TableHead').default,
  TableRow: require('@mui/material/TableRow').default,
  
  // Utils
  Divider: require('@mui/material/Divider').default,
  Tooltip: require('@mui/material/Tooltip').default,
  Backdrop: require('@mui/material/Backdrop').default,
  Modal: require('@mui/material/Modal').default,
  Popover: require('@mui/material/Popover').default,
};

/**
 * Dynamically imports a component with code splitting
 * @param importPath - Path to the component
 * @returns A promise that resolves to the component
 */
export const dynamicImport = (importPath: string) => {
  return import(/* @vite-ignore */ importPath).then(module => module.default);
};