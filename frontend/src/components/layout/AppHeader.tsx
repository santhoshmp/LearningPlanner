import React, { useState, useRef, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
} from '@mui/material';
// No need for visuallyHiddenStyle import as it's not used in this file
import { Menu as MenuIcon, ChevronDown, LogOut, User, Settings, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme } from '../../theme/ThemeContext';
import { KeyCodes, KeyboardShortcuts, matchesShortcut } from '../../utils/keyboardNavigation';
import { useScreenReader } from '../../utils/screenReaderAnnouncements';

const AppHeader: React.FC = () => {
  const { isAuthenticated, user, logout, isChild } = useAuth();
  const muiTheme = useMuiTheme();
  const { themeMode, toggleThemeMode } = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { announce, announceAssertive } = useScreenReader();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [focusedNavIndex, setFocusedNavIndex] = useState(-1);
  
  // Refs for keyboard navigation
  const navRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerButtonRef = useRef<HTMLButtonElement>(null);
  const themeToggleRef = useRef<HTMLButtonElement>(null);

  const handleDrawerToggle = () => {
    const newState = !drawerOpen;
    setDrawerOpen(newState);
    // Announce drawer state change to screen readers
    announce(`Navigation menu ${newState ? 'opened' : 'closed'}`);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
    // Announce menu opening to screen readers
    announce('User menu opened');
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
    // Return focus to the user menu button when closing the menu
    userMenuButtonRef.current?.focus();
    // Announce menu closing to screen readers
    announce('User menu closed');
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/');
    // Announce logout action to screen readers
    announceAssertive('You have been logged out');
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }
      
      // Ctrl+M to open/close mobile menu
      if (matchesShortcut(event, KeyboardShortcuts.OPEN_MENU)) {
        event.preventDefault();
        handleDrawerToggle();
      }
      
      // Alt+H to navigate home
      if (matchesShortcut(event, KeyboardShortcuts.NAVIGATE_HOME)) {
        event.preventDefault();
        navigate(isAuthenticated ? (isChild ? '/child-dashboard' : '/dashboard') : '/');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAuthenticated, isChild, navigate]);
  
  // Handle keyboard navigation within the navigation menu
  const handleNavKeyDown = (event: React.KeyboardEvent, index: number) => {
    const navItems = isChild ? childNavItems : parentNavItems;
    
    switch (event.key) {
      case KeyCodes.ARROW_RIGHT:
        event.preventDefault();
        setFocusedNavIndex((index + 1) % navItems.length);
        break;
      case KeyCodes.ARROW_LEFT:
        event.preventDefault();
        setFocusedNavIndex((index - 1 + navItems.length) % navItems.length);
        break;
      case KeyCodes.HOME:
        event.preventDefault();
        setFocusedNavIndex(0);
        break;
      case KeyCodes.END:
        event.preventDefault();
        setFocusedNavIndex(navItems.length - 1);
        break;
      default:
        break;
    }
  };
  
  // Focus the appropriate nav item when focusedNavIndex changes
  useEffect(() => {
    if (focusedNavIndex >= 0 && navRef.current) {
      const navButtons = navRef.current.querySelectorAll('a');
      if (navButtons[focusedNavIndex]) {
        navButtons[focusedNavIndex].focus();
      }
    }
  }, [focusedNavIndex]);

  // Navigation items based on user role
  const parentNavItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Child Profiles', path: '/child-profiles' },
    { name: 'Study Plans', path: '/study-plans' },
    { name: 'Analytics', path: '/analytics' },
  ];

  const childNavItems = [
    { name: 'Dashboard', path: '/child-dashboard' },
    { name: 'Achievements', path: '/child/achievements' },
  ];

  const navItems = isChild ? childNavItems : parentNavItems;

  // Handle keyboard navigation in the drawer
  const handleDrawerKeyDown = (event: React.KeyboardEvent, index: number, items: typeof navItems) => {
    switch (event.key) {
      case KeyCodes.ARROW_DOWN:
        event.preventDefault();
        const nextIndex = (index + 1) % items.length;
        const nextElement = document.querySelector(`#drawer-item-${nextIndex}`) as HTMLElement;
        nextElement?.focus();
        break;
      case KeyCodes.ARROW_UP:
        event.preventDefault();
        const prevIndex = (index - 1 + items.length) % items.length;
        const prevElement = document.querySelector(`#drawer-item-${prevIndex}`) as HTMLElement;
        prevElement?.focus();
        break;
      case KeyCodes.HOME:
        event.preventDefault();
        const firstElement = document.querySelector('#drawer-item-0') as HTMLElement;
        firstElement?.focus();
        break;
      case KeyCodes.END:
        event.preventDefault();
        const lastElement = document.querySelector(`#drawer-item-${items.length - 1}`) as HTMLElement;
        lastElement?.focus();
        break;
      case KeyCodes.ESCAPE:
        event.preventDefault();
        handleDrawerToggle();
        drawerButtonRef.current?.focus();
        break;
      default:
        break;
    }
  };

  const drawer = (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        AI Study Planner
      </Typography>
      <Divider />
      <List role="menu" aria-label="Navigation Menu">
        {navItems.map((item, index) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton
              id={`drawer-item-${index}`}
              component={RouterLink}
              to={item.path}
              sx={{ 
                textAlign: 'center',
                '&:focus': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '-2px',
                }
              }}
              onClick={handleDrawerToggle}
              onKeyDown={(e) => handleDrawerKeyDown(e, index, navItems)}
              role="menuitem"
              aria-current={window.location.pathname === item.path ? 'page' : undefined}
            >
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
        {!isAuthenticated && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                id={`drawer-item-${navItems.length}`}
                component={RouterLink}
                to="/login"
                sx={{ 
                  textAlign: 'center',
                  '&:focus': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: '-2px',
                  }
                }}
                onClick={handleDrawerToggle}
                onKeyDown={(e) => handleDrawerKeyDown(e, navItems.length, [...navItems, { name: 'Login', path: '/login' }, { name: 'Register', path: '/register' }, { name: 'Child Login', path: '/child-login' }])}
                role="menuitem"
              >
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                id={`drawer-item-${navItems.length + 1}`}
                component={RouterLink}
                to="/register"
                sx={{ 
                  textAlign: 'center',
                  '&:focus': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: '-2px',
                  }
                }}
                onClick={handleDrawerToggle}
                onKeyDown={(e) => handleDrawerKeyDown(e, navItems.length + 1, [...navItems, { name: 'Login', path: '/login' }, { name: 'Register', path: '/register' }, { name: 'Child Login', path: '/child-login' }])}
                role="menuitem"
              >
                <ListItemText primary="Register" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                id={`drawer-item-${navItems.length + 2}`}
                component={RouterLink}
                to="/child-login"
                sx={{ 
                  textAlign: 'center',
                  '&:focus': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: '-2px',
                  }
                }}
                onClick={handleDrawerToggle}
                onKeyDown={(e) => handleDrawerKeyDown(e, navItems.length + 2, [...navItems, { name: 'Login', path: '/login' }, { name: 'Register', path: '/register' }, { name: 'Child Login', path: '/child-login' }])}
                role="menuitem"
              >
                <ListItemText primary="Child Login" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo */}
          <Box
            component={RouterLink}
            to={isAuthenticated ? (isChild ? '/child-dashboard' : '/dashboard') : '/'}
            sx={{
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
            }}
            aria-label="Study Plan Pro Home"
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                background: 'primary.main',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              📚
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
              }}
            >
              Study Plan Pro
            </Typography>
          </Box>

          {/* Mobile menu button */}
          {isMobile && (
            <Box sx={{ flexGrow: 1 }} />
          )}

          {/* Desktop navigation */}
          {!isMobile && isAuthenticated && (
            <Box 
              sx={{ flexGrow: 1, display: 'flex', ml: 4 }}
              ref={navRef}
              role="navigation"
              aria-label="Main Navigation"
            >
              {navItems.map((item, index) => (
                <Button
                  key={item.name}
                  component={RouterLink}
                  to={item.path}
                  sx={{ 
                    color: 'text.primary',
                    display: 'block',
                    mr: 2,
                    '&:hover': {
                      color: 'primary.main',
                    },
                    '&:focus': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: '2px',
                    }
                  }}
                  onKeyDown={(e) => handleNavKeyDown(e, index)}
                  aria-current={window.location.pathname === item.path ? 'page' : undefined}
                >
                  {item.name}
                </Button>
              ))}
            </Box>
          )}

          {/* Theme toggle */}
          <Tooltip title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode (Ctrl+D)`}>
            <IconButton
              onClick={toggleThemeMode}
              color="inherit"
              sx={{ ml: 1 }}
              aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
              ref={themeToggleRef}
            >
              {themeMode === 'dark' ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}
            </IconButton>
          </Tooltip>

          {/* User menu (when authenticated) */}
          {isAuthenticated ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                <Button
                  onClick={handleUserMenuOpen}
                  color="inherit"
                  endIcon={<ChevronDown size={16} />}
                  startIcon={
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: 'primary.main',
                        fontSize: '0.875rem',
                      }}
                      alt={`${user?.firstName || 'User'}'s profile`}
                    >
                      {user?.firstName?.charAt(0) || 'U'}
                    </Avatar>
                  }
                  ref={userMenuButtonRef}
                  aria-haspopup="true"
                  aria-expanded={Boolean(userMenuAnchor)}
                  aria-controls={Boolean(userMenuAnchor) ? "user-menu" : undefined}
                >
                  {isMobile ? '' : `${user?.firstName || 'User'}`}
                </Button>
                <Menu
                  id="user-menu"
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: { minWidth: 180 },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  MenuListProps={{
                    'aria-labelledby': 'user-menu-button',
                    role: 'menu',
                  }}
                >
                  <MenuItem 
                    onClick={handleUserMenuClose} 
                    component={RouterLink} 
                    to="/profile"
                    role="menuitem"
                  >
                    <User size={16} style={{ marginRight: 8 }} aria-hidden="true" />
                    Profile
                  </MenuItem>
                  <MenuItem 
                    onClick={handleUserMenuClose} 
                    component={RouterLink} 
                    to="/settings"
                    role="menuitem"
                  >
                    <Settings size={16} style={{ marginRight: 8 }} aria-hidden="true" />
                    Settings
                  </MenuItem>
                  <Divider />
                  <MenuItem 
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOut size={16} style={{ marginRight: 8 }} aria-hidden="true" />
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
              {isMobile && (
                <IconButton
                  color="inherit"
                  aria-label="open navigation menu"
                  aria-expanded={drawerOpen}
                  aria-controls="mobile-navigation-menu"
                  edge="end"
                  onClick={handleDrawerToggle}
                  sx={{ ml: 1 }}
                  ref={drawerButtonRef}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </>
          ) : (
            // Login/Register buttons for non-authenticated users
            <>
              {!isMobile ? (
                <Box 
                  sx={{ display: 'flex' }}
                  role="navigation"
                  aria-label="Authentication Navigation"
                >
                  <Button
                    component={RouterLink}
                    to="/login"
                    sx={{ 
                      color: 'text.primary', 
                      mr: 1,
                      '&:focus': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: '2px',
                      }
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/register"
                    variant="contained"
                    color="primary"
                    sx={{
                      '&:focus': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: '2px',
                      }
                    }}
                  >
                    Register
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/child-login"
                    sx={{ 
                      color: 'text.primary', 
                      ml: 1,
                      '&:focus': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: '2px',
                      }
                    }}
                  >
                    Child Login
                  </Button>
                </Box>
              ) : (
                <IconButton
                  color="inherit"
                  aria-label="open navigation menu"
                  aria-expanded={drawerOpen}
                  aria-controls="mobile-navigation-menu"
                  edge="end"
                  onClick={handleDrawerToggle}
                  ref={drawerButtonRef}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </>
          )}
        </Toolbar>
      </Container>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        <div id="mobile-navigation-menu" role="navigation" aria-label="Mobile Navigation">
          {drawer}
        </div>
      </Drawer>
    </AppBar>
  );
};

export default AppHeader;