// filepath: /Users/tonigaspert/ProjektniZadatak/Projektni-zadatak/Frontend/rates-app/src/components/Layout.jsx
import React from 'react';
import { AppBar, Toolbar, Typography, Container, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Layout({ children }) {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Rates App
          </Typography>
          <Button color="inherit" component={RouterLink} to="/">Rates List</Button>
          <Button color="inherit" component={RouterLink} to="/trend">Trend Chart</Button>
          <Button color="inherit" component={RouterLink} to="/tools">Tools</Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ marginTop: '20px', paddingBottom: '20px' }}>
        {children}
      </Container>
    </>
  );
}