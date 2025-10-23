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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
    console.log('🔄 [CategoryManager] Intentando agregar categoría:', newCategoryName);
    
    if (!newCategoryName.trim()) {
      await showError('El nombre de la categoría es obligatorio', '⚠️ Campo Requerido');
      return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      await showError('Ya existe una categoría con ese nombre', '⚠️ Categoría Duplicada');
      return;
    }

    console.log('🔄 [CategoryManager] Llamando addCategory...');
    const success = await addCategory(newCategoryName.trim());
    console.log('🔄 [CategoryManager] Resultado addCategory:', success);
    
    if (success) {
      await showSuccess(`Categoría "${newCategoryName}" agregada exitosamente`, '✅ Categoría Agregada');
      setNewCategoryName('');
      // Cerrar el modal después de mostrar la notificación
      setTimeout(() => {
        handleClose();
      }, 1000);
    } else {
      await showError('Error al agregar la categoría', '❌ Error');
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
      // Cerrar el modal después de mostrar la notificación
      setTimeout(() => {
        handleClose();
      }, 1000);
    } else {
      await showError('Error al actualizar la categoría', '❌ Error');
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
          // Cerrar el modal después de mostrar la notificación
          setTimeout(() => {
            handleClose();
          }, 1000);
        } else {
          await showError('Error al eliminar la categoría', '❌ Error');
        }
      }
    }
  };

  // Agregar subcategoría
  const handleAddSubcategory = async () => {
    console.log('🔄 [CategoryManager] Intentando agregar subcategoría:', { 
      name: newSubcategoryName, 
      categoryId: selectedCategoryForSubcategory 
    });
    
    if (!newSubcategoryName.trim() || !selectedCategoryForSubcategory) {
      await showError('Completa todos los campos requeridos', '⚠️ Campos Requeridos');
      return;
    }

    const category = categories.find(cat => cat.id === selectedCategoryForSubcategory);
    if (category?.subcategories.includes(newSubcategoryName.trim())) {
      await showError('Ya existe esa subcategoría en esta categoría', '⚠️ Subcategoría Duplicada');
      return;
    }

    console.log('🔄 [CategoryManager] Llamando addSubcategory...');
    const success = await addSubcategory(selectedCategoryForSubcategory, newSubcategoryName.trim());
    console.log('🔄 [CategoryManager] Resultado addSubcategory:', success);
    
    if (success) {
      await showSuccess(`Subcategoría "${newSubcategoryName}" agregada exitosamente`, '✅ Subcategoría Agregada');
      setNewSubcategoryName('');
      setSelectedCategoryForSubcategory(null);
      // Cerrar el modal después de mostrar la notificación
      setTimeout(() => {
        handleClose();
      }, 1000);
    } else {
      await showError('Error al agregar la subcategoría', '❌ Error');
    }
  };

  // Eliminar subcategoría
  const handleDeleteSubcategory = async (categoryId: string, subcategoryName: string) => {
    const result = await showDeleteConfirmation(`"${subcategoryName}"`);
    if (result.isConfirmed) {
      const success = await removeSubcategory(categoryId, subcategoryName);
      if (success) {
        await showSuccess(`Subcategoría "${subcategoryName}" eliminada exitosamente`, '✅ Eliminada');
        // Cerrar el modal después de mostrar la notificación
        setTimeout(() => {
          handleClose();
        }, 1000);
      } else {
        await showError('Error al eliminar la subcategoría', '❌ Error');
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
        p: 3,
        fontSize: '1.25rem'
      }}>
        <CategoryIcon sx={{ fontSize: 28 }} />
        Gestión de Categorías y Subcategorías
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
            <Grid size={12}>
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
            <Grid size={12}>
              <Card sx={{ border: `1px solid ${colorTokens.brand}20` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: colorTokens.brand, fontWeight: 600 }}>
                    <SubcategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Agregar Subcategoría
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: colorTokens.textSecondary }}>
                          Categoría
                        </InputLabel>
                        <Select
                          value={selectedCategoryForSubcategory || ''}
                          onChange={(e) => setSelectedCategoryForSubcategory(e.target.value)}
                          label="Categoría"
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': { 
                              borderColor: `${colorTokens.brand}30` 
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': { 
                              borderColor: colorTokens.brand 
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                              borderColor: colorTokens.brand 
                            },
                            '& .MuiSelect-select': {
                              color: colorTokens.textPrimary
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>Seleccionar categoría</em>
                          </MenuItem>
                          {categories.map(category => (
                            <MenuItem key={category.id} value={category.id}>
                              {category.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
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
                    <Grid size={{ xs: 12, md: 4 }}>
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
            <Grid size={12}>
              <Typography variant="h6" sx={{ mb: 2, color: colorTokens.textPrimary, fontWeight: 600 }}>
                Categorías Existentes ({categories.length})
              </Typography>
              
              {categories.length === 0 ? (
                <Alert severity="info">
                  No hay categorías registradas. Agrega la primera categoría arriba.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {categories.map((category) => (
                    <Card key={category.id} sx={{ 
                      border: `1px solid ${colorTokens.brand}20`,
                      borderRadius: 2,
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: colorTokens.brand,
                        boxShadow: `0 4px 12px ${colorTokens.brand}20`
                      }
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        {editingCategory === category.id ? (
                          <Box display="flex" alignItems="center" gap={2}>
                            <TextField
                              size="small"
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleEditCategory(category.id, editingCategoryName)}
                              sx={{ flexGrow: 1 }}
                              placeholder="Nombre de la categoría"
                            />
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleEditCategory(category.id, editingCategoryName)}
                              sx={{ 
                                backgroundColor: colorTokens.brand,
                                '&:hover': { backgroundColor: colorTokens.brandHover }
                              }}
                            >
                              Guardar
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setEditingCategory(null);
                                setEditingCategoryName('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </Box>
                        ) : (
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={2}>
                              <Box sx={{ 
                                p: 1, 
                                borderRadius: 1, 
                                backgroundColor: `${colorTokens.brand}10`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <CategoryIcon sx={{ color: colorTokens.brand, fontSize: 20 }} />
                              </Box>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: colorTokens.textPrimary, mb: 0.5 }}>
                                  {category.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                                  {category.subcategories.length} subcategorías
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box display="flex" gap={1}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingCategory(category.id);
                                  setEditingCategoryName(category.name);
                                }}
                                sx={{ 
                                  color: colorTokens.brand,
                                  '&:hover': { backgroundColor: `${colorTokens.brand}10` }
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteCategory(category)}
                                sx={{ 
                                  color: '#f44336',
                                  '&:hover': { backgroundColor: '#f4433610' }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        )}
                        
                        {category.subcategories.length > 0 && (
                          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${colorTokens.brand}10` }}>
                            <Typography variant="body2" sx={{ 
                              color: colorTokens.textSecondary, 
                              mb: 1.5, 
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                              fontSize: '0.75rem'
                            }}>
                              Subcategorías
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1}>
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
                                    backgroundColor: `${colorTokens.brand}05`,
                                    '& .MuiChip-deleteIcon': {
                                      color: '#f44336',
                                      '&:hover': { color: '#f44336' }
                                    },
                                    '&:hover': {
                                      backgroundColor: `${colorTokens.brand}10`,
                                      borderColor: colorTokens.brand
                                    }
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
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