// src/components/admin/CategoryManager.tsx
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Category as CategoryIcon,
  SubdirectoryArrowRight as SubcategoryIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { showSuccess, showError, showDeleteConfirmation, showConfirmation } from '@/lib/notifications/MySwal';
import { useCategories, Category } from '@/hooks/useCategories';

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function CategoryManager({ 
  open, 
  onClose
}: CategoryManagerProps) {
  
  const {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    removeSubcategory,
    refreshCategories
  } = useCategories();

  // Estados locales para formularios
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState<string | null>(null);

  // Agregar nueva categoría
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      await showError('El nombre de la categoría es obligatorio', '⚠️ Campo Requerido');
      return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      await showError('Ya existe una categoría con ese nombre', '⚠️ Categoría Duplicada');
      return;
    }

    const success = await addCategory(newCategoryName.trim());
    if (success) {
      await showSuccess(`Categoría "${newCategoryName}" agregada exitosamente`, '✅ Categoría Agregada');
      setNewCategoryName('');
    }
  };

  // Editar categoría
  const handleEditCategory = async (categoryId: string, newName: string) => {
    if (!newName.trim()) {
      await showError('El nombre de la categoría es obligatorio', '⚠️ Campo Requerido');
      return;
    }

    if (categories.some(cat => cat.id !== categoryId && cat.name.toLowerCase() === newName.toLowerCase())) {
      await showError('Ya existe una categoría con ese nombre', '⚠️ Categoría Duplicada');
      return;
    }

    const success = await updateCategory(categoryId, newName.trim());
    if (success) {
      await showSuccess(`Categoría actualizada exitosamente`, '✅ Categoría Actualizada');
      setEditingCategory(null);
      setEditingCategoryName('');
    }
  };

  // Eliminar categoría
  const handleDeleteCategory = async (category: Category) => {
    const result = await showDeleteConfirmation(`"${category.name}"`);
    if (result.isConfirmed) {
      const finalResult = await showConfirmation(
        `¿Estás COMPLETAMENTE seguro de eliminar la categoría "${category.name}"?\n\n` +
        `Esta acción eliminará:\n` +
        `• La categoría y todas sus subcategorías\n` +
        `• Las referencias en productos\n\n` +
        `⚠️ Esta acción NO se puede deshacer`,
        '⚠️ Confirmación Final',
        'Sí, eliminar definitivamente',
        'Cancelar'
      );
      
      if (finalResult.isConfirmed) {
        const success = await deleteCategory(category.id);
        if (success) {
          await showSuccess(`Categoría "${category.name}" eliminada exitosamente`, '✅ Eliminada');
        }
      }
    }
  };

  // Agregar subcategoría
  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedCategoryForSubcategory) {
      await showError('Completa todos los campos requeridos', '⚠️ Campos Requeridos');
      return;
    }

    const category = categories.find(cat => cat.id === selectedCategoryForSubcategory);
    if (category?.subcategories.includes(newSubcategoryName.trim())) {
      await showError('Ya existe esa subcategoría en esta categoría', '⚠️ Subcategoría Duplicada');
      return;
    }

    const success = await addSubcategory(selectedCategoryForSubcategory, newSubcategoryName.trim());
    if (success) {
      await showSuccess(`Subcategoría "${newSubcategoryName}" agregada exitosamente`, '✅ Subcategoría Agregada');
      setNewSubcategoryName('');
      setSelectedCategoryForSubcategory(null);
    }
  };

  // Eliminar subcategoría
  const handleDeleteSubcategory = async (categoryId: string, subcategoryName: string) => {
    const result = await showDeleteConfirmation(`"${subcategoryName}"`);
    if (result.isConfirmed) {
      const success = await removeSubcategory(categoryId, subcategoryName);
      if (success) {
        await showSuccess(`Subcategoría "${subcategoryName}" eliminada exitosamente`, '✅ Eliminada');
      }
    }
  };

  // Limpiar formularios al cerrar
  const handleClose = () => {
    setNewCategoryName('');
    setEditingCategory(null);
    setEditingCategoryName('');
    setNewSubcategoryName('');
    setSelectedCategoryForSubcategory(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{
        background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
        color: colorTokens.textOnBrand,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 3
      }}>
        <CategoryIcon sx={{ fontSize: 28 }} />
        <Typography variant="subtitle1" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
          Gestión de Categorías y Subcategorías
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* AGREGAR NUEVA CATEGORÍA */}
            <Grid item xs={12}>
              <Card sx={{ border: `1px solid ${colorTokens.brand}20` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: colorTokens.brand, fontWeight: 600 }}>
                    <AddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Agregar Nueva Categoría
                  </Typography>
                  <Box display="flex" gap={2} alignItems="center">
                    <TextField
                      fullWidth
                      label="Nombre de la categoría"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: `${colorTokens.brand}30` },
                          '&:hover fieldset': { borderColor: colorTokens.brand },
                          '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                      sx={{
                        backgroundColor: colorTokens.brand,
                        '&:hover': { backgroundColor: colorTokens.brandHover },
                        minWidth: '120px'
                      }}
                    >
                      Agregar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* AGREGAR SUBCATEGORÍA */}
            <Grid item xs={12}>
              <Card sx={{ border: `1px solid ${colorTokens.brand}20` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: colorTokens.brand, fontWeight: 600 }}>
                    <SubcategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Agregar Subcategoría
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        select
                        label="Categoría"
                        value={selectedCategoryForSubcategory || ''}
                        onChange={(e) => setSelectedCategoryForSubcategory(e.target.value)}
                        SelectProps={{ native: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: `${colorTokens.brand}30` },
                            '&:hover fieldset': { borderColor: colorTokens.brand },
                            '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                          }
                        }}
                      >
                        <option value="">Seleccionar categoría</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Nombre de la subcategoría"
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory()}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: `${colorTokens.brand}30` },
                            '&:hover fieldset': { borderColor: colorTokens.brand },
                            '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="contained"
                        onClick={handleAddSubcategory}
                        disabled={!newSubcategoryName.trim() || !selectedCategoryForSubcategory}
                        sx={{
                          backgroundColor: colorTokens.brand,
                          '&:hover': { backgroundColor: colorTokens.brandHover },
                          width: '100%'
                        }}
                      >
                        Agregar Subcategoría
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* LISTA DE CATEGORÍAS */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: colorTokens.textPrimary, fontWeight: 600 }}>
                Categorías Existentes ({categories.length})
              </Typography>
              
              {categories.length === 0 ? (
                <Alert severity="info">
                  No hay categorías registradas. Agrega la primera categoría arriba.
                </Alert>
              ) : (
                <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                  {categories.map((category, index) => (
                    <React.Fragment key={category.id}>
                      <ListItem sx={{ py: 2 }}>
                        <Box sx={{ width: '100%' }}>
                          {editingCategory === category.id ? (
                            <Box display="flex" alignItems="center" gap={2}>
                              <TextField
                                size="small"
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleEditCategory(category.id, editingCategoryName)}
                                sx={{ flexGrow: 1 }}
                              />
                              <Button
                                size="small"
                                onClick={() => handleEditCategory(category.id, editingCategoryName)}
                                sx={{ color: colorTokens.brand }}
                              >
                                Guardar
                              </Button>
                              <Button
                                size="small"
                                onClick={() => {
                                  setEditingCategory(null);
                                  setEditingCategoryName('');
                                }}
                              >
                                Cancelar
                              </Button>
                            </Box>
                          ) : (
                            <Box display="flex" alignItems="center" gap={1}>
                              <CategoryIcon sx={{ color: colorTokens.brand, fontSize: 20 }} />
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {category.name}
                              </Typography>
                              <Chip 
                                label={`${category.subcategories.length} subcategorías`}
                                size="small"
                                sx={{ 
                                  backgroundColor: `${colorTokens.brand}20`,
                                  color: colorTokens.brand,
                                  fontWeight: 500
                                }}
                              />
                            </Box>
                          )}
                          
                          {category.subcategories.length > 0 && (
                            <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                              {category.subcategories.map((subcategory) => (
                                <Chip
                                  key={subcategory}
                                  label={subcategory}
                                  size="small"
                                  variant="outlined"
                                  onDelete={() => handleDeleteSubcategory(category.id, subcategory)}
                                  sx={{
                                    borderColor: `${colorTokens.brand}40`,
                                    color: colorTokens.textSecondary,
                                    '& .MuiChip-deleteIcon': {
                                      color: colorTokens.error
                                    }
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                        <ListItemSecondaryAction>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingCategory(category.id);
                                setEditingCategoryName(category.name);
                              }}
                              disabled={editingCategory === category.id}
                              sx={{ color: colorTokens.brand }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteCategory(category)}
                              sx={{ color: colorTokens.error }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < categories.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={refreshCategories}
          variant="outlined"
          sx={{
            borderColor: colorTokens.brand,
            color: colorTokens.brand,
            '&:hover': {
              borderColor: colorTokens.brandHover,
              backgroundColor: `${colorTokens.brand}10`
            }
          }}
        >
          Actualizar
        </Button>
        <Button
          onClick={handleClose}
          variant="contained"
          sx={{
            backgroundColor: colorTokens.brand,
            '&:hover': { backgroundColor: colorTokens.brandHover }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}