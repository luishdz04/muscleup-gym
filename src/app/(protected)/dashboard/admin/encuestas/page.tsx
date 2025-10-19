"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
  Tabs,
  Tab,
  Grid,
  Switch,
  FormControlLabel,
  Tooltip,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  BarChart as BarChartIcon,
  Poll as PollIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { colorTokens } from '@/theme';
import { formatDateForDisplay, formatTimestampDateOnly } from '@/utils/dateUtils';
import { useHydrated } from '@/hooks/useHydrated';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';

interface Survey {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  max_responses_per_user: number;
  created_at: string;
  updated_at: string;
  response_count?: number;
}

interface Question {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'rating' | 'yes_no';
  question_order: number;
  is_required: boolean;
  options: string[] | null;
  created_at: string;
}

interface Response {
  id: string;
  survey_id: string;
  question_id: string;
  user_id: string;
  answer_text: string | null;
  answer_option: string | null;
  created_at: string;
}

interface QuestionStats {
  question: Question;
  totalResponses: number;
  answerDistribution: { [key: string]: number };
  textAnswers: string[];
}

export default function AdminEncuestasPage() {
  const hydrated = useHydrated();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  const [questionsDialogOpen, setQuestionsDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Current survey for editing/viewing
  const [currentSurvey, setCurrentSurvey] = useState<Survey | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentResults, setCurrentResults] = useState<QuestionStats[]>([]);

  // Form states
  const [surveyForm, setSurveyForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: true,
    max_responses_per_user: 1
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice' as Question['question_type'],
    is_required: true,
    options: ['']
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch surveys
  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/surveys');
      if (!response.ok) throw new Error('Error al cargar encuestas');
      const data = await response.json();
      setSurveys(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Fetch questions for a survey
  const fetchQuestions = async (surveyId: string) => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}/questions`);
      if (!response.ok) throw new Error('Error al cargar preguntas');
      const data = await response.json();
      setCurrentQuestions(data);
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  // Fetch results for a survey
  const fetchResults = async (surveyId: string) => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}/results`);
      if (!response.ok) throw new Error('Error al cargar resultados');
      const data = await response.json();
      setCurrentResults(data);
    } catch (err) {
      console.error('Error fetching results:', err);
    }
  };

  useEffect(() => {
    if (hydrated) {
      fetchSurveys();
    }
  }, [hydrated]);

  // Create or update survey
  const handleSaveSurvey = async () => {
    try {
      const method = currentSurvey ? 'PUT' : 'POST';
      const url = currentSurvey ? `/api/surveys/${currentSurvey.id}` : '/api/surveys';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar encuesta');
      }

      setSuccessMessage(currentSurvey ? 'Encuesta actualizada exitosamente' : 'Encuesta creada exitosamente');
      setSurveyDialogOpen(false);
      resetSurveyForm();
      fetchSurveys();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  // Delete survey
  const handleDeleteSurvey = async () => {
    if (!currentSurvey) return;

    try {
      const response = await fetch(`/api/surveys/${currentSurvey.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar encuesta');

      setSuccessMessage('Encuesta eliminada exitosamente');
      setDeleteDialogOpen(false);
      setCurrentSurvey(null);
      fetchSurveys();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  // Add question
  const handleAddQuestion = async () => {
    if (!currentSurvey) return;

    try {
      const payload = {
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        is_required: questionForm.is_required,
        question_order: currentQuestions.length + 1,
        options: questionForm.question_type === 'multiple_choice' ? questionForm.options.filter(o => o.trim()) : null
      };

      const response = await fetch(`/api/surveys/${currentSurvey.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error al agregar pregunta');

      setSuccessMessage('Pregunta agregada exitosamente');
      resetQuestionForm();
      fetchQuestions(currentSurvey.id);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar pregunta');
    }
  };

  // Delete question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!currentSurvey) return;

    try {
      const response = await fetch(`/api/surveys/${currentSurvey.id}/questions/${questionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar pregunta');

      setSuccessMessage('Pregunta eliminada exitosamente');
      fetchQuestions(currentSurvey.id);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar pregunta');
    }
  };

  // Open dialogs
  const openCreateDialog = () => {
    setCurrentSurvey(null);
    resetSurveyForm();
    setSurveyDialogOpen(true);
  };

  const openEditDialog = (survey: Survey) => {
    setCurrentSurvey(survey);
    setSurveyForm({
      title: survey.title,
      description: survey.description || '',
      start_date: formatTimestampDateOnly(survey.start_date),
      end_date: formatTimestampDateOnly(survey.end_date),
      is_active: survey.is_active,
      max_responses_per_user: survey.max_responses_per_user
    });
    setSurveyDialogOpen(true);
  };

  const openQuestionsDialog = async (survey: Survey) => {
    setCurrentSurvey(survey);
    await fetchQuestions(survey.id);
    setQuestionsDialogOpen(true);
  };

  const openResultsDialog = async (survey: Survey) => {
    setCurrentSurvey(survey);
    await fetchResults(survey.id);
    setResultsDialogOpen(true);
  };

  const openDeleteDialog = (survey: Survey) => {
    setCurrentSurvey(survey);
    setDeleteDialogOpen(true);
  };

  // Reset forms
  const resetSurveyForm = () => {
    setSurveyForm({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      is_active: true,
      max_responses_per_user: 1
    });
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question_text: '',
      question_type: 'multiple_choice',
      is_required: true,
      options: ['']
    });
  };

  // Add/remove option in question form
  const addOption = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, '']
    });
  };

  const removeOption = (index: number) => {
    const newOptions = questionForm.options.filter((_, i) => i !== index);
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  if (!hydrated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PollIcon sx={{ fontSize: 40, color: colorTokens.brand }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>
            Gestión de Encuestas
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          sx={{
            bgcolor: colorTokens.brand,
            color: colorTokens.black,
            fontWeight: 700,
            '&:hover': {
              bgcolor: alpha(colorTokens.brand, 0.8)
            }
          }}
        >
          Nueva Encuesta
        </Button>
      </Box>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Surveys Table */}
      <TableContainer component={Paper} sx={{
        background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
        borderRadius: 3
      }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Título</TableCell>
              <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Período</TableCell>
              <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Respuestas</TableCell>
              <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', color: colorTokens.textSecondary }}>
                  Cargando encuestas...
                </TableCell>
              </TableRow>
            ) : surveys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', color: colorTokens.textSecondary }}>
                  No hay encuestas registradas
                </TableCell>
              </TableRow>
            ) : (
              surveys.map((survey) => {
                const now = new Date();
                const startDate = new Date(survey.start_date);
                const endDate = new Date(survey.end_date);
                const isActive = survey.is_active && now >= startDate && now <= endDate;

                return (
                  <TableRow key={survey.id}>
                    <TableCell sx={{ color: colorTokens.textPrimary }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {survey.title}
                      </Typography>
                      {survey.description && (
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          {survey.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: colorTokens.textSecondary }}>
                      <Typography variant="body2">
                        {formatDateForDisplay(survey.start_date)}
                      </Typography>
                      <Typography variant="body2">
                        al {formatDateForDisplay(survey.end_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={isActive ? 'Activa' : 'Inactiva'}
                        size="small"
                        sx={{
                          bgcolor: isActive ? alpha(colorTokens.success, 0.2) : alpha(colorTokens.textSecondary, 0.2),
                          color: isActive ? colorTokens.success : colorTokens.textSecondary,
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary }}>
                      {survey.response_count || 0}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Ver Resultados">
                          <IconButton
                            size="small"
                            onClick={() => openResultsDialog(survey)}
                            sx={{ color: colorTokens.info }}
                          >
                            <BarChartIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Gestionar Preguntas">
                          <IconButton
                            size="small"
                            onClick={() => openQuestionsDialog(survey)}
                            sx={{ color: colorTokens.brand }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(survey)}
                            sx={{ color: colorTokens.success }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => openDeleteDialog(survey)}
                            sx={{ color: colorTokens.danger }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Survey Create/Edit Dialog */}
      <Dialog
        open={surveyDialogOpen}
        onClose={() => setSurveyDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.95)}, ${alpha(colorTokens.surfaceLevel3, 0.9)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(colorTokens.brand, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
          {currentSurvey ? 'Editar Encuesta' : 'Nueva Encuesta'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="Título"
              value={surveyForm.title}
              onChange={(e) => setSurveyForm({ ...surveyForm, title: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Descripción"
              value={surveyForm.description}
              onChange={(e) => setSurveyForm({ ...surveyForm, description: e.target.value })}
              multiline
              rows={3}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha de Inicio"
                  type="date"
                  value={surveyForm.start_date}
                  onChange={(e) => setSurveyForm({ ...surveyForm, start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha de Fin"
                  type="date"
                  value={surveyForm.end_date}
                  onChange={(e) => setSurveyForm({ ...surveyForm, end_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Máximo de Respuestas por Usuario"
              type="number"
              value={surveyForm.max_responses_per_user}
              onChange={(e) => setSurveyForm({ ...surveyForm, max_responses_per_user: parseInt(e.target.value) || 1 })}
              inputProps={{ min: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={surveyForm.is_active}
                  onChange={(e) => setSurveyForm({ ...surveyForm, is_active: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: colorTokens.brand
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      bgcolor: colorTokens.brand
                    }
                  }}
                />
              }
              label="Encuesta Activa"
              sx={{ color: colorTokens.textPrimary }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSurveyDialogOpen(false)} sx={{ color: colorTokens.textSecondary }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveSurvey}
            variant="contained"
            disabled={!surveyForm.title || !surveyForm.start_date || !surveyForm.end_date}
            sx={{
              bgcolor: colorTokens.brand,
              color: colorTokens.black,
              '&:hover': { bgcolor: alpha(colorTokens.brand, 0.8) }
            }}
          >
            {currentSurvey ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Questions Management Dialog */}
      <Dialog
        open={questionsDialogOpen}
        onClose={() => setQuestionsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.95)}, ${alpha(colorTokens.surfaceLevel3, 0.9)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(colorTokens.brand, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
          Gestionar Preguntas - {currentSurvey?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Add Question Form */}
            <Paper sx={{
              p: 3,
              mb: 3,
              background: alpha(colorTokens.surfaceLevel1, 0.5),
              border: `1px solid ${alpha(colorTokens.brand, 0.1)}`
            }}>
              <Typography variant="h6" sx={{ color: colorTokens.textPrimary, mb: 2, fontWeight: 600 }}>
                Agregar Nueva Pregunta
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Texto de la Pregunta"
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  multiline
                  rows={2}
                />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Pregunta</InputLabel>
                      <Select
                        value={questionForm.question_type}
                        onChange={(e) => setQuestionForm({
                          ...questionForm,
                          question_type: e.target.value as Question['question_type']
                        })}
                        label="Tipo de Pregunta"
                      >
                        <MenuItem value="multiple_choice">Opción Múltiple</MenuItem>
                        <MenuItem value="text">Texto Libre</MenuItem>
                        <MenuItem value="rating">Calificación (1-5)</MenuItem>
                        <MenuItem value="yes_no">Sí/No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={questionForm.is_required}
                          onChange={(e) => setQuestionForm({ ...questionForm, is_required: e.target.checked })}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: colorTokens.brand },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: colorTokens.brand }
                          }}
                        />
                      }
                      label="Respuesta Obligatoria"
                      sx={{ color: colorTokens.textPrimary }}
                    />
                  </Grid>
                </Grid>

                {/* Options for multiple choice */}
                {questionForm.question_type === 'multiple_choice' && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colorTokens.textPrimary, mb: 1 }}>
                      Opciones
                    </Typography>
                    {questionForm.options.map((option, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder={`Opción ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                        />
                        {questionForm.options.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => removeOption(index)}
                            sx={{ color: colorTokens.danger }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={addOption}
                      sx={{ color: colorTokens.brand }}
                    >
                      Agregar Opción
                    </Button>
                  </Box>
                )}

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddQuestion}
                  disabled={
                    !questionForm.question_text ||
                    (questionForm.question_type === 'multiple_choice' && questionForm.options.filter(o => o.trim()).length < 2)
                  }
                  sx={{
                    bgcolor: colorTokens.brand,
                    color: colorTokens.black,
                    '&:hover': { bgcolor: alpha(colorTokens.brand, 0.8) }
                  }}
                >
                  Agregar Pregunta
                </Button>
              </Box>
            </Paper>

            {/* Questions List */}
            <Typography variant="h6" sx={{ color: colorTokens.textPrimary, mb: 2, fontWeight: 600 }}>
              Preguntas de la Encuesta ({currentQuestions.length})
            </Typography>
            {currentQuestions.length === 0 ? (
              <Alert severity="info">No hay preguntas agregadas aún</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {currentQuestions.map((question, index) => (
                  <Card key={question.id} sx={{
                    background: alpha(colorTokens.surfaceLevel1, 0.5),
                    border: `1px solid ${alpha(colorTokens.brand, 0.1)}`
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                            {index + 1}. {question.question_text}
                            {question.is_required && (
                              <Chip label="Obligatoria" size="small" sx={{ ml: 1, bgcolor: alpha(colorTokens.danger, 0.2), color: colorTokens.danger }} />
                            )}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                            Tipo: {
                              question.question_type === 'multiple_choice' ? 'Opción Múltiple' :
                              question.question_type === 'text' ? 'Texto Libre' :
                              question.question_type === 'rating' ? 'Calificación' :
                              'Sí/No'
                            }
                          </Typography>
                          {question.options && (
                            <Box sx={{ mt: 1 }}>
                              {question.options.map((option, i) => (
                                <Chip
                                  key={i}
                                  label={option}
                                  size="small"
                                  sx={{ mr: 1, mb: 1, bgcolor: alpha(colorTokens.info, 0.1), color: colorTokens.info }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteQuestion(question.id)}
                          sx={{ color: colorTokens.danger }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionsDialogOpen(false)} sx={{ color: colorTokens.textSecondary }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Results Dialog */}
      <Dialog
        open={resultsDialogOpen}
        onClose={() => setResultsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.95)}, ${alpha(colorTokens.surfaceLevel3, 0.9)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(colorTokens.brand, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
          Resultados - {currentSurvey?.title}
        </DialogTitle>
        <DialogContent>
          {currentResults.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>No hay respuestas aún</Alert>
          ) : (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {currentResults.map((stat, index) => (
                <Paper key={stat.question.id} sx={{
                  p: 3,
                  background: alpha(colorTokens.surfaceLevel1, 0.5),
                  border: `1px solid ${alpha(colorTokens.brand, 0.1)}`
                }}>
                  <Typography variant="h6" sx={{ color: colorTokens.textPrimary, mb: 2, fontWeight: 600 }}>
                    {index + 1}. {stat.question.question_text}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                    Total de respuestas: {stat.totalResponses}
                  </Typography>

                  {stat.question.question_type === 'text' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {stat.textAnswers.map((answer, i) => (
                        <Typography key={i} variant="body2" sx={{ color: colorTokens.textPrimary, pl: 2 }}>
                          • {answer}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <BarChart
                        xAxis={[{ scaleType: 'band', data: Object.keys(stat.answerDistribution) }]}
                        series={[{ data: Object.values(stat.answerDistribution), color: colorTokens.brand }]}
                        height={300}
                      />
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultsDialogOpen(false)} sx={{ color: colorTokens.textSecondary }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.95)}, ${alpha(colorTokens.surfaceLevel3, 0.9)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(colorTokens.danger, 0.3)}`
          }
        }}
      >
        <DialogTitle sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colorTokens.textPrimary }}>
            ¿Estás seguro de que deseas eliminar la encuesta "{currentSurvey?.title}"?
          </Typography>
          <Typography sx={{ color: colorTokens.textSecondary, mt: 1 }}>
            Esta acción no se puede deshacer y se eliminarán todas las preguntas y respuestas asociadas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: colorTokens.textSecondary }}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteSurvey}
            variant="contained"
            sx={{
              bgcolor: colorTokens.danger,
              '&:hover': { bgcolor: alpha(colorTokens.danger, 0.8) }
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
