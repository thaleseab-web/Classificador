import React, { useState } from 'react';
import { Outlet, Link as RouterLink, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, Button, IconButton, Badge, Alert, InputBase, alpha, styled } from '@mui/material';
import { MdDashboard, MdCategory, MdSync, MdSyncDisabled, MdSearch, MdViewList } from 'react-icons/md';
import { useSync } from '../../application/useSync';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(1),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(2),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const MainLayout: React.FC = () => {
  const { isOnline, isSyncing, checkConnection } = useSync();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      navigate(`/batch?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isOnline && (
        <Alert 
          severity="warning" 
          action={
            <Button color="inherit" size="small" onClick={checkConnection}>
              Reconectar
            </Button>
          }
          sx={{ borderRadius: 0 }}
        >
          Você está offline. As alterações serão salvas localmente.
        </Alert>
      )}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 'bold', color: 'primary.main', mr: 2 }}>
            BankCategorizer
          </Typography>
          
          <Search>
            <SearchIconWrapper>
              <MdSearch />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Buscar..."
              inputProps={{ 'aria-label': 'search' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
          </Search>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', gap: { xs: 0, sm: 1 } }}>
            <Button component={RouterLink} to="/" startIcon={<MdDashboard />} sx={{ minWidth: { xs: 40, sm: 'auto' }, px: { xs: 1, sm: 2 } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Dash</Box>
            </Button>
            <Button component={RouterLink} to="/categorize" startIcon={<MdCategory />} sx={{ minWidth: { xs: 40, sm: 'auto' }, px: { xs: 1, sm: 2 } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Foco</Box>
            </Button>
            <Button component={RouterLink} to="/batch" startIcon={<MdViewList />} sx={{ minWidth: { xs: 40, sm: 'auto' }, px: { xs: 1, sm: 2 } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Lote</Box>
            </Button>
            <IconButton color={isOnline ? 'success' : 'error'} title={isOnline ? 'Online' : 'Offline'} size="small">
              <Badge color="secondary" variant="dot" invisible={!isSyncing}>
                {isOnline ? <MdSync /> : <MdSyncDisabled />}
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default MainLayout;
