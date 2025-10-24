export interface UserRoutine {
  id: string;
  user_id: string;
  routine_id: string;
  assigned_by: string;
  assigned_date: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'paused';
  notes?: string;
  created_at: string;
  updated_at: string;
  routine?: {
    id: string;
    name: string;
    description?: string;
    difficulty_level?: string;
    estimated_duration?: number;
    muscle_group_focus?: string;
    is_public: boolean;
    routine_exercises?: RoutineExercise[];
  };
  assigned_by_user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
  exercise: Exercise;
}

export interface Exercise {
  id: string;
  name: string;
  type: string;
  level: string;
  material?: string;
  primary_muscles: string[];
  secondary_muscles?: string[];
  initial_position?: string;
  execution_eccentric?: string;
  execution_isometric?: string;
  execution_concentric?: string;
  common_errors?: string[];
  contraindications?: string[];
  video_url?: string;
  image_url?: string;
  muscle_group?: {
    id: string;
    name: string;
  };
}

export interface AssignRoutineRequest {
  user_id: string;
  routine_id: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}
