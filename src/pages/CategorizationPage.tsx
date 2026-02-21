import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, Paper, Grid, Chip, LinearProgress, Breadcrumbs, Link, IconButton } from '@mui/material';
import { useCategorization } from '../application/useCategorization';
import { useSync } from '../application/useSync';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSkipNext, MdCheck, MdArrowBack, MdChevronRight } from 'react-icons/md';
import { Category } from '../domain/types';

const CategoryIcon: React.FC<{ icon?: string }> = ({ icon }) => {
  if (!icon) return <MdCheck />;
  
  // Check if it's an emoji (simple check for now)
  const isEmoji = /\p{Emoji}/u.test(icon);
  
  if (isEmoji) {
    return <Box component="span" sx={{ fontSize: '1.5rem', mr: 1 }}>{icon}</Box>;
  }
  
  // If it's a URL
  if (icon.startsWith('http')) {
    return (
      <Box 
        component="img" 
        src={icon} 
        sx={{ width: 24, height: 24, mr: 1, objectFit: 'contain' }} 
        referrerPolicy="no-referrer"
      />
    );
  }

  return <MdCheck />;
};

const CategorizationPage: React.FC = () => {
  const { currentTransaction, categorize, skip, remaining, totalCategorized } = useCategorization();
  const { taxonomy } = useSync();
  const [isGlitching, setIsGlitching] = useState(false);
  const [lastCategoryColor, setLastCategoryColor] = useState<string>('#00ff00');
  const [navigationStack, setNavigationStack] = useState<Category[]>([]);

  const currentLevelCategories = useMemo(() => {
    if (navigationStack.length === 0) return taxonomy;
    const last = navigationStack[navigationStack.length - 1];
    return last.children || [];
  }, [taxonomy, navigationStack]);

  const handleCategoryClick = (category: Category) => {
    if (category.children && category.children.length > 0) {
      setNavigationStack(prev => [...prev, category]);
    } else {
      handleFinalCategorize(category);
    }
  };

  const handleFinalCategorize = (category: Category) => {
    setLastCategoryColor(category.color || '#00ff00');
    setIsGlitching(true);
    
    // Construct full path for better context in GAS
    const fullPath = [...navigationStack, category].map(c => c.name).join(' > ');
    
    // Small delay to show glitch before exit animation takes over
    setTimeout(() => {
      categorize(category, fullPath);
      setIsGlitching(false);
      setNavigationStack([]); // Reset navigation for next transaction
    }, 150);
  };

  const handleBack = () => {
    setNavigationStack(prev => prev.slice(0, -1));
  };

  if (!currentTransaction) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh" p={2}>
        <Typography variant="h4" gutterBottom align="center">
          Tudo pronto!
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph align="center">
          Não há mais transações pendentes para categorizar.
        </Typography>
        <Button variant="contained" href="/">
          Voltar ao Dashboard
        </Button>
      </Box>
    );
  }

  const batchProgress = (totalCategorized % 10) * 10;

  return (
    <Box maxWidth="md" mx="auto" px={{ xs: 2, sm: 0 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Categorização ({remaining} restantes)
        </Typography>
        <Chip label={`Sessão: ${totalCategorized}`} color="primary" variant="outlined" size="small" />
      </Box>
      
      <Box mb={4} display="flex" alignItems="center" gap={2}>
        <Box width="100%" mr={1}>
          <LinearProgress variant="determinate" value={batchProgress} sx={{ height: 10, borderRadius: 5 }} />
        </Box>
        <Box minWidth={35}>
          <Typography variant="body2" color="text.secondary">{`${batchProgress}%`}</Typography>
        </Box>
      </Box>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentTransaction.id}
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            skewX: isGlitching ? [0, -2, 2, -1, 0] : 0,
            x: isGlitching ? [0, -5, 5, -2, 0] : 0
          }}
          exit={{ 
            opacity: 0, 
            scale: 1.05, 
            boxShadow: `0 0 30px 10px ${lastCategoryColor}80`, // Neon glow with category color
            borderColor: lastCategoryColor,
            filter: "brightness(1.2)",
            transition: { duration: 0.2 }
          }}
          transition={{ duration: 0.3 }}
        >
          <Paper 
            elevation={3} 
            className={isGlitching ? 'glitch-effect' : ''}
            data-text={currentTransaction.originalName || currentTransaction.id}
            sx={{ 
              p: { xs: 2, sm: 4 }, 
              mb: 4, 
              borderRadius: 4, 
              border: '2px solid transparent',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Typography variant="overline" color="text.secondary">
              Estabelecimento
            </Typography>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold', 
                color: '#1a237e',
                textShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                letterSpacing: '-1px',
                fontSize: { xs: '1.75rem', sm: '3rem' },
                wordBreak: 'break-word'
              }}
            >
              {currentTransaction.originalName || currentTransaction.id}
            </Typography>
            <Box display="flex" gap={1} mt={2} flexWrap="wrap">
              <Chip label={currentTransaction.date || 'Data desconhecida'} size="small" />
              <Chip label={`R$ ${currentTransaction.amount || '0,00'}`} color="secondary" variant="filled" size="small" />
            </Box>
          </Paper>
        </motion.div>
      </AnimatePresence>

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} mt={4} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1} sx={{ width: '100%', overflowX: 'auto', pb: 1 }}>
          {navigationStack.length > 0 && (
            <IconButton onClick={handleBack} size="small" sx={{ mr: 1 }}>
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
              sx={{ cursor: 'pointer', fontWeight: navigationStack.length === 0 ? 'bold' : 'normal', whiteSpace: 'nowrap' }}
            >
              Categorias
            </Link>
            {navigationStack.map((cat, index) => (
              <Typography
                key={cat.id}
                color={index === navigationStack.length - 1 ? "text.primary" : "inherit"}
                sx={{ fontWeight: index === navigationStack.length - 1 ? 'bold' : 'normal', whiteSpace: 'nowrap' }}
              >
                {cat.name}
              </Typography>
            ))}
          </Breadcrumbs>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {currentLevelCategories.map((category: Category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                sx={{
                  height: { xs: '70px', sm: '80px' },
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  borderColor: category.color || 'primary.main',
                  color: category.color || 'primary.main',
                  borderWidth: 2,
                  px: 2,
                  '&:hover': {
                    backgroundColor: category.color ? `${category.color}10` : 'primary.light',
                    borderColor: category.color || 'primary.main',
                    boxShadow: `0 0 15px ${category.color || '#1976d2'}40`, // Hover glow
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
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {category.name}
                  </Typography>
                  {category.children && category.children.length > 0 && (
                    <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                      {category.children.length} subcategorias
                    </Typography>
                  )}
                </Box>
              </Button>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Box mt={4} mb={6} display="flex" justifyContent="center">
        <Button startIcon={<MdSkipNext />} onClick={skip} color="inherit" size="large">
          Pular por enquanto
        </Button>
      </Box>
    </Box>
  );
};

export default CategorizationPage;
