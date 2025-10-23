// src/components/admin/CategoryManager.tsx
'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  SubdirectoryArrowRight as SubcategoryIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { showSuccess, showError, showDeleteConfirmation, showConfirmation } from '@/lib/notifications/MySwal';

interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
}

export default function CategoryManager({ 
  open, 
  onClose, 
  categories, 
  onUpdateCategories 
}: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleAddCategory = useCallback(async () => {
    if (!newCategory.trim()) {
      await showError('Ingresa un nombre para la categoría', '⚠️ Nombre Requerido');
      return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === newCategory.toLowerCase())) {
      await showError('Ya existe una categoría con ese nombre', '⚠️ Categoría Duplicada');
      return;
    }

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.trim(),
      subcategories: []
    };

    onUpdateCategories([...categories, category]);
    setNewCategory('');
    await showSuccess(`Categoría "${category.name}" agregada exitosamente`, '✅ Categoría Agregada');
  }, [newCategory, categories, onUpdateCategories]);

  const handleEditCategory = useCallback(async (category: Category) => {
    const result = await showConfirmation(
      `¿Editar la categoría "${category.name}"?`,
      '✏️ Editar Categoría',
      'Editar',
      'Cancelar'
    );

    if (result.isConfirmed) {
      setEditingCategory(category);
      setNewCategory(category.name);
    }
  }, []);

  const handleUpdateCategory = useCallback(async () => {
    if (!editingCategory || !newCategory.trim()) return;

    if (categories.some(cat => 
      cat.id !== editingCategory.id && 
      cat.name.toLowerCase() === newCategory.toLowerCase()
    )) {
      await showError('Ya existe una categoría con ese nombre', '⚠️ Categoría Duplicada');
      return;
    }

    const updatedCategories = categories.map(cat =>
      cat.id === editingCategory.id
        ? { ...cat, name: newCategory.trim() }
        : cat
    );

    onUpdateCategories(updatedCategories);
    setEditingCategory(null);
    setNewCategory('');
    await showSuccess(`Categoría actualizada a "${newCategory.trim()}"`, '✅ Categoría Actualizada');
  }, [editingCategory, newCategory, categories, onUpdateCategories]);

  const handleDeleteCategory = useCallback(async (category: Category) => {
    const result = await showDeleteConfirmation(`"${category.name}"`);
    
    if (result.isConfirmed) {
      const finalResult = await showConfirmation(
        `¿Estás COMPLETAMENTE seguro de eliminar la categoría "${category.name}"?\n\n` +
        `Esta acción eliminará:\n` +
        `• La categoría principal\n` +
        `• Todas las subcategorías asociadas\n` +
        `• Referencias en productos\n\n` +
        `⚠️ Esta acción NO se puede deshacer`,
        '⚠️ Confirmación Final',
        'Sí, eliminar definitivamente',
        'Cancelar'
      );

      if (finalResult.isConfirmed) {
        const updatedCategories = categories.filter(cat => cat.id !== category.id);
        onUpdateCategories(updatedCategories);
        await showSuccess(`Categoría "${category.name}" eliminada exitosamente`, '✅ Categoría Eliminada');
      }
    }
  }, [categories, onUpdateCategories]);

  const handleAddSubcategory = useCallback(async () => {
    if (!selectedCategory || !newSubcategory.trim()) {
      await showError('Selecciona una categoría e ingresa el nombre de la subcategoría', '⚠️ Datos Requeridos');
      return;
    }

    if (selectedCategory.subcategories.some(sub => 
      sub.toLowerCase() === newSubcategory.toLowerCase()
    )) {
      await showError('Ya existe una subcategoría con ese nombre', '⚠️ Subcategoría Duplicada');
      return;
    }

    const updatedCategories = categories.map(cat =>
      cat.id === selectedCategory.id
        ? { ...cat, subcategories: [...cat.subcategories, newSubcategory.trim()] }
        : cat
    );

    onUpdateCategories(updatedCategories);
    setNewSubcategory('');
    await showSuccess(`Subcategoría "${newSubcategory.trim()}" agregada a "${selectedCategory.name}"`, '✅ Subcategoría Agregada');
  }, [selectedCategory, newSubcategory, categories, onUpdateCategories]);

  const handleDeleteSubcategory = useCallback(async (category: Category, subcategory: string) => {
    const result = await showConfirmation(
      `¿Eliminar la subcategoría "${subcategory}" de "${category.name}"?`,
      '🗑️ Eliminar Subcategoría',
      'Eliminar',
      'Cancelar'
    );

    if (result.isConfirmed) {
      const updatedCategories = categories.map(cat =>
        cat.id === category.id
          ? { ...cat, subcategories: cat.subcategories.filter(sub => sub !== subcategory) }
          : cat
      );

      onUpdateCategories(updatedCategories);
      await showSuccess(`Subcategoría "${subcategory}" eliminada`, '✅ Subcategoría Eliminada');
    }
  }, [categories, onUpdateCategories]);

  const handleClose = useCallback(() => {
    setNewCategory('');
    setEditingCategory(null);
    setNewSubcategory('');
    setSelectedCategory(null);
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          color: colorTokens.textPrimary,
          borderRadius: 3,
          border: `1px solid ${colorTokens.border}`
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
        <Typography variant="h6" sx={{ fontSize: '1.25rem' }}>
          Gestión de Categorías y Subcategorías
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* AGREGAR CATEGORÍA */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: colorTokens.textPrimary }}>
            Agregar Nueva Categoría
          </Typography>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              placeholder="Nombre de la categoría"
              value={editingCategory ? newCategory : newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: colorTokens.surfaceLevel1,
                  '& fieldset': { borderColor: colorTokens.border },
                  '&:hover fieldset': { borderColor: colorTokens.brand },
                  '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                }
              }}
            />
            <Button
              variant="contained"
              onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
              sx={{
                background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                color: colorTokens.textOnBrand,
                fontWeight: 600,
                px: 3
              }}
            >
              {editingCategory ? 'Actualizar' : 'Agregar'}
            </Button>
          </Box>
          {editingCategory && (
            <Button
              variant="outlined"
              onClick={() => {
                setEditingCategory(null);
                setNewCategory('');
              }}
              sx={{ mt: 1 }}
            >
              Cancelar Edición
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 3, borderColor: colorTokens.border }} />

        {/* LISTA DE CATEGORÍAS */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: colorTokens.textPrimary }}>
            Categorías Existentes
          </Typography>
          {categories.length === 0 ? (
            <Alert severity="info" sx={{ backgroundColor: `${colorTokens.info}10` }}>
              No hay categorías creadas. Agrega la primera categoría arriba.
            </Alert>
          ) : (
            <List sx={{ backgroundColor: colorTokens.surfaceLevel1, borderRadius: 2 }}>
              {categories.map((category) => (
                <React.Fragment key={category.id}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <CategoryIcon sx={{ color: colorTokens.brand, fontSize: 20 }} />
                          <Typography variant="subtitle1" fontWeight="bold">
                            {category.name}
                          </Typography>
                          <Chip
                            label={`${category.subcategories.length} subcategorías`}
                            size="small"
                            sx={{ backgroundColor: `${colorTokens.brand}20`, color: colorTokens.brand }}
                          />
                        </Box>
                      }
                      secondary={
                        category.subcategories.length > 0 && (
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                            {category.subcategories.map((subcategory) => (
                              <Chip
                                key={subcategory}
                                label={subcategory}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  borderColor: colorTokens.border,
                                  color: colorTokens.textSecondary,
                                  fontSize: '0.75rem'
                                }}
                              />
                            ))}
                          </Box>
                        )
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box display="flex" gap={1}>
                        <IconButton
                          onClick={() => setSelectedCategory(category)}
                          sx={{ color: colorTokens.brand }}
                        >
                          <SubcategoryIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleEditCategory(category)}
                          sx={{ color: colorTokens.warning }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteCategory(category)}
                          sx={{ color: colorTokens.danger }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider sx={{ borderColor: colorTokens.border }} />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* AGREGAR SUBCATEGORÍA */}
        {selectedCategory && (
          <>
            <Divider sx={{ my: 3, borderColor: colorTokens.border }} />
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: colorTokens.textPrimary }}>
                Agregar Subcategoría a "{selectedCategory.name}"
              </Typography>
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  placeholder="Nombre de la subcategoría"
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: colorTokens.surfaceLevel1,
                      '& fieldset': { borderColor: colorTokens.border },
                      '&:hover fieldset': { borderColor: colorTokens.brand },
                      '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddSubcategory}
                  sx={{
                    background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success}dd)`,
                    color: colorTokens.textOnBrand,
                    fontWeight: 600,
                    px: 3
                  }}
                >
                  Agregar
                </Button>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${colorTokens.border}` }}>
        <Button
          onClick={handleClose}
          sx={{
            color: colorTokens.textSecondary,
            fontWeight: 600
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
