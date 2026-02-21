import React from 'react';
import { Grid, Paper, Typography, Box, Button, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useSync } from '../application/useSync';
import { MdPendingActions, MdCheckCircle, MdTrendingUp } from 'react-icons/md';
import { Transaction } from '../domain/types';

const Dashboard: React.FC = () => {
  const { transactions, isLoading, error } = useSync();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography color="error">Erro ao carregar dados: {(error as Error).message}</Typography>
      </Box>
    );
  }

  const pendingCount = transactions.filter((t: Transaction) => t.status === 'pending').length;
  const categorizedCount = transactions.filter((t: Transaction) => t.status === 'categorized' || t.status === 'synced').length;
  const totalCount = transactions.length;
  const progress = totalCount > 0 ? (categorizedCount / totalCount) * 100 : 0;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Visão Geral
        </Typography>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', minHeight: { xs: 140, sm: 200 }, justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <MdPendingActions size={24} color="#f57c00" />
            <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Pendentes
            </Typography>
          </Box>
          <Typography component="p" variant="h3" color="primary" sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
            {pendingCount}
          </Typography>
          <Box mt={2}>
            <Button component={RouterLink} to="/categorize" variant="contained" fullWidth disabled={pendingCount === 0} sx={{ mb: 1, py: { xs: 0.5, sm: 1 } }}>
              Categorizar
            </Button>
            <Button component={RouterLink} to="/batch" variant="outlined" fullWidth disabled={pendingCount === 0} sx={{ py: { xs: 0.5, sm: 1 } }}>
              Lote
            </Button>
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', minHeight: { xs: 140, sm: 200 }, justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <MdCheckCircle size={24} color="#4caf50" />
            <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Categorizados
            </Typography>
          </Box>
          <Typography component="p" variant="h3" color="success.main" sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
            {categorizedCount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {progress.toFixed(1)}% do total
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', minHeight: { xs: 140, sm: 200 }, justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <MdTrendingUp size={24} color="#1976d2" />
            <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Total
            </Typography>
          </Box>
          <Typography component="p" variant="h3" sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
            {totalCount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Atualizado recentemente
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
