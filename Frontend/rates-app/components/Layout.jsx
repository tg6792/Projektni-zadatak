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
            Projektni Zadatak
          </Typography>
          <Button color="inherit" component={RouterLink} to="/">Tečajnice</Button>
          <Button color="inherit" component={RouterLink} to="/trend">Diagram</Button>
          <Button color="inherit" component={RouterLink} to="/tools">Kalkulator</Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ marginTop: '20px', paddingBottom: '20px' }}>
        {children}
      </Container>
    </>
  );
}