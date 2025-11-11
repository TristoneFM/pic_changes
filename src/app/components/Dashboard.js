'use client';

import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Add as AddIcon,
  FolderOpen,
  CheckCircle,
  Search,
  ExitToApp,
  AccountCircle,
} from '@mui/icons-material';

const drawerWidth = 260;

export default function Dashboard({ user = { name: 'Usuario' } }) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState('crear-pic');

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuClick = (menuItem) => {
    setSelectedMenu(menuItem);
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    handleProfileMenuClose();
    // Add logout logic here
  };

  const menuItems = [
    { id: 'crear-pic', text: 'Crear Pic', icon: <AddIcon /> },
    { id: 'mis-pics', text: 'Mis Pics', icon: <FolderOpen /> },
    { id: 'aprobar-rechazar', text: 'Aprobar / Rechazar', icon: <CheckCircle /> },
    { id: 'consultar-pics', text: 'Consultar Pics', icon: <Search /> },
  ];

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
              selected={selectedMenu === item.id}
              onClick={() => handleMenuClick(item.id)}
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
                  color: selectedMenu === item.id ? 'white' : 'action.active',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: selectedMenu === item.id ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

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
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
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
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Perfil
            </MenuItem>
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
          backgroundColor: '#f5f5f5',
          transition: 'all 0.3s ease',
          width: '100%',
        }}
      >
        <Toolbar />
        {/* Main Content */}
        <Box sx={{ mt: 2 }}>
          {selectedMenu === 'crear-pic' && (
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={600}>
                Crear Pic
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Crea un nuevo PIC desde aquí.
              </Typography>
            </Box>
          )}
          {selectedMenu === 'mis-pics' && (
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={600}>
                Mis Pics
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Visualiza y gestiona tus PICs.
              </Typography>
            </Box>
          )}
          {selectedMenu === 'aprobar-rechazar' && (
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={600}>
                Aprobar/Rechazar
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Revisa y aprueba o rechaza PICs pendientes.
              </Typography>
            </Box>
          )}
          {selectedMenu === 'consultar-pics' && (
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={600}>
                Consultar Pics
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Busca y consulta información de PICs existentes.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

