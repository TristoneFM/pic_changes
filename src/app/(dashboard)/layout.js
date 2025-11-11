'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Add as AddIcon,
  FolderOpen,
  CheckCircle,
  Search,
  ExitToApp,
  AccountCircle,
  Settings,
} from '@mui/icons-material';

const drawerWidth = 260;

export default function DashboardLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Check if user is logged in and admin status
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          if (user && user.emp_id) {
            setIsAuthenticated(true);
            setIsAdmin(user.isAdmin === true);
            setIsCheckingAuth(false);
            return;
          }
        }
        // User not logged in, redirect to login
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsCheckingAuth(false);
        router.push('/');
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsCheckingAuth(false);
        router.push('/');
      }
    };

    checkAuth();
    
    // Listen for storage changes (logout from another tab)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [router]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    handleProfileMenuClose();
    // Clear user data from localStorage
    localStorage.removeItem('userData');
    // Redirect to login
    router.push('/');
  };

  const menuItems = [
    { id: 'dashboard', text: 'Inicio', icon: <HomeIcon />, path: '/dashboard' },
    { id: 'create-pic', text: 'Crear Pic', icon: <AddIcon />, path: '/create-pic' },
    { id: 'my-pics', text: 'Mis Pics', icon: <FolderOpen />, path: '/my-pics' },
    { id: 'approve-reject', text: 'Aprobar / Rechazar', icon: <CheckCircle />, path: '/approve-reject' },
    { id: 'query-pics', text: 'Consultar Pics', icon: <Search />, path: '/query-pics' },
    // Only show configuration menu item for admins
    ...(isAdmin ? [{ id: 'configuration', text: 'Configuración', icon: <Settings />, path: '/configuration' }] : []),
  ];
  
  const handleLogoutClick = () => {
    handleLogout();
  };

  const handleMenuClick = (path) => {
    router.push(path);
  };

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 0.5,
          gap: 0.5,
        }}
      >
        <Box
          component="img"
          src="/images/tristone.jpg"
          alt="Tristone Logo"
          sx={{
            width: '40%',
            maxWidth: 180,
            height: 'auto',
            objectFit: 'contain',
          }}
        />
      </Toolbar>
      <List sx={{ px: 2, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={pathname === item.path}
              onClick={() => handleMenuClick(item.path)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: pathname === item.path ? 'white' : 'action.active',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        
        {/* Logout Option */}
        <ListItem disablePadding sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <ListItemButton
            onClick={handleLogoutClick}
            sx={{
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: 'action.active',
                minWidth: 40,
              }}
            >
              <ExitToApp />
            </ListItemIcon>
            <ListItemText
              primary="Cerrar Sesión"
              primaryTypographyProps={{
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, don't render dashboard (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', sm: drawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { xs: 0, sm: drawerOpen ? `${drawerWidth}px` : 0 },
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircle sx={{ fontSize: 32 }} />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
  
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ 
          width: { xs: 0, sm: drawerOpen ? drawerWidth : 0 },
          flexShrink: 0,
          transition: 'width 0.3s ease',
        }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="persistent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              transition: 'transform 0.3s ease',
            },
          }}
          open={drawerOpen}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          minHeight: '100vh',
          backgroundColor: '#ffffff',
          transition: 'all 0.3s ease',
          width: '100%',
        }}
      >
        <Toolbar />
        {/* Main Content */}
        <Box sx={{ mt: 2 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

