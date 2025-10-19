'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Rating,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Grid } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { formatDateForDisplay, formatTimestampDateOnly } from '@/utils/dateUtils';
import {
  PollOutlined as SurveyIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface Survey {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  max_responses_per_user: number;
  created_at: string;
}

interface Question {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'rating' | 'yes_no';
  options: string[] | null;
  is_required: boolean;
  question_order: number;
}

interface SurveyWithQuestions extends Survey {
  questions: Question[];
}

interface Response {
  question_id: string;
  answer_text?: string;
  answer_option?: string;
}

export default function EncuestasClientePage() {
  const hydrated = useHydrated();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyWithQuestions | null>(null);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completedSurveys, setCompletedSurveys] = useState<Set<string>>(new Set());
  const [successDialog, setSuccessDialog] = useState(false);

  useEffect(() => {
    if (hydrated) {
      fetchSurveys();
    }
  }, [hydrated]);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/surveys');

      if (!response.ok) {
        throw new Error('Error al cargar encuestas');
      }

      const data = await response.json();
      setSurveys(data);

      // Check which surveys user has completed
      const completed = new Set<string>();
      for (const survey of data) {
        const checkResponse = await fetch(`/api/surveys/${survey.id}/respond`);
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.hasResponded) {
            completed.add(survey.id);
          }
        }
      }
      setCompletedSurveys(completed);

      setError(null);
    } catch (err) {
      console.error('Error fetching surveys:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSurvey = async (surveyId: string) => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}`);
      if (!response.ok) {
        throw new Error('Error al cargar encuesta');
      }

      const data = await response.json();
      setSelectedSurvey(data);
      setResponses({});
    } catch (err) {
      console.error('Error loading survey:', err);
      toast.error('Error al cargar la encuesta');
    }
  };

  const handleResponseChange = (questionId: string, answer: Partial<Response>) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        ...prev[questionId],
        ...answer
      }
    }));
  };

  const validateResponses = (): boolean => {
    if (!selectedSurvey) return false;

    const requiredQuestions = selectedSurvey.questions.filter(q => q.is_required);
    const answeredQuestions = Object.keys(responses);

    for (const question of requiredQuestions) {
      if (!answeredQuestions.includes(question.id)) {
        toast.error(`La pregunta "${question.question_text}" es requerida`);
        return false;
      }

      const response = responses[question.id];
      if (!response.answer_text && !response.answer_option) {
        toast.error(`Por favor responde: "${question.question_text}"`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!selectedSurvey || !validateResponses()) return;

    try {
      setSubmitting(true);

      const responsesArray = Object.values(responses);

      const response = await fetch(`/api/surveys/${selectedSurvey.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: responsesArray })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar respuestas');
      }

      setCompletedSurveys(prev => new Set([...prev, selectedSurvey.id]));
      setSuccessDialog(true);
      setSelectedSurvey(null);
      setResponses({});

    } catch (err) {
      console.error('Error submitting survey:', err);
      toast.error(err instanceof Error ? err.message : 'Error al enviar respuestas');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const response = responses[question.id];

    switch (question.question_type) {
      case 'rating':
        return (
          <Box sx={{ mt: 2 }}>
            <Rating
              size="large"
              value={response?.answer_option ? parseInt(response.answer_option) : 0}
              onChange={(_, value) => {
                handleResponseChange(question.id, { answer_option: value?.toString() || '0' });
              }}
              sx={{
                '& .MuiRating-iconFilled': {
                  color: colorTokens.brand
                }
              }}
            />
          </Box>
        );

      case 'multiple_choice':
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
            <RadioGroup
              value={response?.answer_option || ''}
              onChange={(e) => handleResponseChange(question.id, { answer_option: e.target.value })}
            >
              {question.options?.map((option, idx) => (
                <FormControlLabel
                  key={idx}
                  value={option}
                  control={<Radio sx={{ color: colorTokens.brand, '&.Mui-checked': { color: colorTokens.brand } }} />}
                  label={option}
                  sx={{ color: colorTokens.textPrimary }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'yes_no':
        return (
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <RadioGroup
              row
              value={response?.answer_option || ''}
              onChange={(e) => handleResponseChange(question.id, { answer_option: e.target.value })}
            >
              <FormControlLabel
                value="Sí"
                control={<Radio sx={{ color: colorTokens.brand, '&.Mui-checked': { color: colorTokens.brand } }} />}
                label="Sí"
                sx={{ color: colorTokens.textPrimary, mr: 4 }}
              />
              <FormControlLabel
                value="No"
                control={<Radio sx={{ color: colorTokens.brand, '&.Mui-checked': { color: colorTokens.brand } }} />}
                label="No"
                sx={{ color: colorTokens.textPrimary }}
              />
            </RadioGroup>
          </FormControl>
        );

      case 'text':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={response?.answer_text || ''}
            onChange={(e) => handleResponseChange(question.id, { answer_text: e.target.value })}
            placeholder="Escribe tu respuesta aquí..."
            sx={{ mt: 2 }}
          />
        );

      default:
        return null;
    }
  };

  if (!hydrated || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Vista de formulario de encuesta
  if (selectedSurvey) {
    const progress = (Object.keys(responses).length / selectedSurvey.questions.length) * 100;

    return (
      <Box sx={{ pb: { xs: 10, lg: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setSelectedSurvey(null)}
            sx={{ color: colorTokens.textSecondary, mb: 2 }}
          >
            Volver a encuestas
          </Button>

          <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.textPrimary, mb: 1 }}>
            {selectedSurvey.title}
          </Typography>

          {selectedSurvey.description && (
            <Typography variant="body1" sx={{ color: colorTokens.textSecondary, mb: 3 }}>
              {selectedSurvey.description}
            </Typography>
          )}

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                Progreso: {Object.keys(responses).length} de {selectedSurvey.questions.length} preguntas
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha(colorTokens.brand, 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: colorTokens.brand,
                  borderRadius: 4
                }
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {selectedSurvey.questions.map((question, index) => (
            <Paper
              key={question.id}
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
                borderRadius: 3
              }}
            >
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box
                  sx={{
                    minWidth: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: alpha(colorTokens.brand, 0.1),
                    border: `1px solid ${alpha(colorTokens.brand, 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: colorTokens.brand
                  }}
                >
                  {index + 1}
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: colorTokens.textPrimary }}>
                      {question.question_text}
                    </Typography>
                    {question.is_required && (
                      <Chip
                        label="Requerida"
                        size="small"
                        sx={{
                          bgcolor: alpha(colorTokens.danger, 0.1),
                          color: colorTokens.danger,
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    )}
                  </Box>

                  {renderQuestion(question)}
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setSelectedSurvey(null)}
            sx={{
              borderColor: colorTokens.textSecondary,
              color: colorTokens.textSecondary
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              bgcolor: colorTokens.brand,
              color: colorTokens.black,
              fontWeight: 700,
              px: 4,
              '&:hover': {
                bgcolor: alpha(colorTokens.brand, 0.9)
              }
            }}
          >
            {submitting ? 'Enviando...' : 'Enviar Respuestas'}
          </Button>
        </Box>

        {/* Success Dialog */}
        <Dialog open={successDialog} onClose={() => setSuccessDialog(false)}>
          <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: colorTokens.success, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              ¡Gracias por tu participación!
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
            <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
              Tus respuestas han sido enviadas exitosamente.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              onClick={() => setSuccessDialog(false)}
              sx={{
                bgcolor: colorTokens.brand,
                color: colorTokens.black,
                fontWeight: 700
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Vista de lista de encuestas
  return (
    <Box sx={{ pb: { xs: 10, lg: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{
          fontWeight: 800,
          color: colorTokens.textPrimary,
          mb: 1,
          fontSize: { xs: '1.75rem', sm: '2.5rem' }
        }}>
          Encuestas <Box component="span" sx={{ color: colorTokens.brand }}>Disponibles</Box>
        </Typography>
        <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
          Ayúdanos a mejorar compartiendo tu opinión
        </Typography>
      </Box>

      {surveys.length === 0 ? (
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
          borderRadius: 3
        }}>
          <SurveyIcon sx={{ fontSize: 64, color: colorTokens.textSecondary, mb: 2 }} />
          <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
            No hay encuestas disponibles en este momento
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {surveys.map((survey) => {
            const isCompleted = completedSurveys.has(survey.id);

            return (
              <Grid key={survey.id} size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    height: '100%',
                    background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': !isCompleted ? {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(colorTokens.black, 0.4)}`
                    } : {}
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <SurveyIcon sx={{ fontSize: 32, color: colorTokens.brand }} />
                      {isCompleted && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Completada"
                          size="small"
                          sx={{
                            bgcolor: alpha(colorTokens.success, 0.1),
                            color: colorTokens.success,
                            fontWeight: 600
                          }}
                        />
                      )}
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 700, color: colorTokens.textPrimary, mb: 1 }}>
                      {survey.title}
                    </Typography>

                    {survey.description && (
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                        {survey.description.length > 100
                          ? `${survey.description.substring(0, 100)}...`
                          : survey.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Disponible hasta: ${formatDateForDisplay(survey.end_date)}`}
                        size="small"
                        sx={{
                          bgcolor: alpha(colorTokens.info, 0.1),
                          color: colorTokens.info,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      disabled={isCompleted}
                      onClick={() => handleSelectSurvey(survey.id)}
                      sx={{
                        bgcolor: isCompleted ? colorTokens.textSecondary : colorTokens.brand,
                        color: isCompleted ? colorTokens.textPrimary : colorTokens.black,
                        fontWeight: 700,
                        '&:hover': {
                          bgcolor: isCompleted ? colorTokens.textSecondary : alpha(colorTokens.brand, 0.9)
                        }
                      }}
                    >
                      {isCompleted ? 'Ya Respondiste' : 'Responder Encuesta'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
