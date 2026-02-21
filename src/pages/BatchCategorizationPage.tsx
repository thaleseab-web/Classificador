import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid, 
  Chip, 
  Checkbox, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Breadcrumbs,
  Link,
  IconButton
} from '@mui/material';
import { useSync } from '../application/useSync';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MdCheck, MdArrowBack, MdChevronRight } from 'react-icons/md';
import { Category, Transaction } from '../domain/types';
import confetti from 'canvas-confetti';

const CategoryIcon: React.FC<{ icon?: string }> = ({ icon }) => {
  if (!icon) return <MdCheck />;
  
  // Check if it's an emoji (simple check for now)
  const isEmoji = /\p{Emoji}/u.test(icon);
  
  if (isEmoji) {
    return <Box component="span" sx={{ fontSize: '1.25rem', mr: 1 }}>{icon}</Box>;
  }
  
  // If it's a URL
  if (icon.startsWith('http')) {
    return (
      <Box 
        component="img" 
        src={icon} 
        sx={{ width: 20, height: 20, mr: 1, objectFit: 'contain' }} 
        referrerPolicy="no-referrer"
      />
    );
  }

  return <MdCheck />;
};

const BatchCategorizationPage: React.FC = () => {
  const { transactions, taxonomy, sync } = useSync();
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [navigationStack, setNavigationStack] = useState<Category[]>([]);
  const location = useLocation();

  const currentLevelCategories = useMemo(() => {
    if (navigationStack.length === 0) return taxonomy;
    const last = navigationStack[navigationStack.length - 1];
    return last.children || [];
  }, [taxonomy, navigationStack]);

  const handleCategoryClick = (category: Category) => {
    if (category.children && category.children.length > 0) {
      setNavigationStack(prev => [...prev, category]);
    } else {
      handleCategorizeBatch(category);
    }
  };

  const handleBack = () => {
    setNavigationStack(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchTerm(q);
  }, [location.search]);

  const pendingTransactions = useMemo(() => 
    transactions.filter((t: Transaction) => t.status === 'pending'), 
  [transactions]);

  const filteredTransactions = useMemo(() => 
    pendingTransactions.filter((t: Transaction) => 
      (t.originalName || t.id).toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [pendingTransactions, searchTerm]);

  const handleToggleSelect = (id: string) => {
    setSelectedTransactions(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map((t: Transaction) => t.id));
    }
  };

  const handleCategorizeBatch = (category: Category) => {
    // Construct full path for better context in GAS
    const fullPath = [...navigationStack, category].map(c => c.name).join(' > ');

    const transactionsToUpdate = transactions
      .filter((t: Transaction) => selectedTransactions.includes(t.id))
      .map((t: Transaction) => ({
        ...t,
        categoryId: category.id,
        categoryName: fullPath,
        status: 'categorized' as const,
      }));

    sync(transactionsToUpdate);
    setSelectedTransactions([]);
    setNavigationStack([]); // Reset navigation after applying
    
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#00E676', '#2979FF', '#FFD600'],
    });
  };

  if (pendingTransactions.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh" p={2}>
        <Typography variant="h4" gutterBottom align="center">Tudo pronto!</Typography>
        <Typography variant="body1" color="text.secondary" paragraph align="center">
          Não há transações pendentes para categorização em lote.
        </Typography>
        <Button variant="contained" href="/">Voltar ao Dashboard</Button>
      </Box>
    );
  }

  return (
    <Box maxWidth="lg" mx="auto" px={{ xs: 2, sm: 0 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={1}>
        <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Categorização em Lote</Typography>
        <Chip 
          label={`${selectedTransactions.length} selecionados`} 
          color={selectedTransactions.length > 0 ? "primary" : "default"} 
          size="small"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Left Panel: Transactions List */}
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 2, height: { xs: '40vh', md: '70vh' }, display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} px={1}>
              <Typography variant="caption" color="text.secondary">
                {filteredTransactions.length} itens {searchTerm && `(busca: "${searchTerm}")`}
              </Typography>
              <Button size="small" onClick={handleSelectAll} sx={{ fontSize: '0.75rem' }}>
                {selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0 ? 'Desmarcar' : 'Todos'}
              </Button>
            </Box>

            <List sx={{ overflow: 'auto', flexGrow: 1 }}>
              <AnimatePresence>
                {filteredTransactions.map((transaction: Transaction, index: number) => (
                  <ListItem 
                    key={`${transaction.id}-${index}`} 
                    button 
                    onClick={() => handleToggleSelect(transaction.id)}
                    divider
                    sx={{
                      bgcolor: selectedTransactions.includes(transaction.id) ? 'action.selected' : 'transparent',
                      py: 1,
                      px: 1
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Checkbox 
                        edge="start" 
                        checked={selectedTransactions.includes(transaction.id)} 
                        tabIndex={-1} 
                        disableRipple 
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={transaction.originalName || transaction.id} 
                      secondary={`${transaction.date || ''} • R$ ${transaction.amount || '0,00'}`} 
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium', noWrap: true }}
                      secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                    />
                  </ListItem>
                ))}
              </AnimatePresence>
              {filteredTransactions.length === 0 && (
                <Box p={4} textAlign="center">
                  <Typography color="text.secondary" variant="body2">Nenhuma transação encontrada.</Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Right Panel: Categories */}
        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, height: { xs: 'auto', md: '70vh' }, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Aplicar Categoria
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: '0.8rem' }}>
              Selecione uma categoria para os {selectedTransactions.length} itens.
            </Typography>

            <Box display="flex" alignItems="center" gap={1} mb={2} sx={{ overflowX: 'auto', pb: 1 }}>
              {navigationStack.length > 0 && (
                <IconButton onClick={handleBack} size="small">
                  <MdArrowBack />
                </IconButton>
              )}
              <Breadcrumbs 
                separator={<MdChevronRight fontSize="small" />} 
                aria-label="breadcrumb"
                sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
              >
                <Link
                  underline="hover"
                  color={navigationStack.length === 0 ? "text.primary" : "inherit"}
                  onClick={() => setNavigationStack([])}
                  sx={{ cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                >
                  Categorias
                </Link>
                {navigationStack.map((cat, index) => (
                  <Typography
                    key={cat.id}
                    color={index === navigationStack.length - 1 ? "text.primary" : "inherit"}
                    sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                  >
                    {cat.name}
                  </Typography>
                ))}
              </Breadcrumbs>
            </Box>

            <Grid container spacing={1} sx={{ overflowY: 'auto', flexGrow: 1 }}>
              {currentLevelCategories.map((category: Category) => (
                <Grid item xs={12} key={category.id}>
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      disabled={selectedTransactions.length === 0}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        borderColor: category.color || 'primary.main',
                        color: category.color || 'primary.main',
                        borderWidth: 1.5,
                        py: 1,
                        '&:hover': {
                          backgroundColor: category.color ? `${category.color}10` : 'primary.light',
                          borderColor: category.color || 'primary.main',
                        },
                      }}
                      onClick={() => handleCategoryClick(category)}
                      startIcon={category.children && category.children.length > 0 ? <MdChevronRight /> : <CategoryIcon icon={category.icon} />}
                    >
                      <Box display="flex" flexDirection="column" sx={{ overflow: 'hidden' }}>
                        <Typography 
                          variant="button" 
                          sx={{ 
                            fontWeight: 'bold', 
                            fontSize: '0.8rem',
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {category.name}
                        </Typography>
                        {category.children && category.children.length > 0 && (
                          <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>
                            {category.children.length} subcategorias
                          </Typography>
                        )}
                      </Box>
                    </Button>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BatchCategorizationPage;
