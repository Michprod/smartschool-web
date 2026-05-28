export interface EducationCycle {
  id: number;
  code: string;
  name: string;
  requires_study_option: boolean;
  grade_levels: GradeLevel[];
  study_options: StudyOption[];
}

export interface GradeLevel {
  id: number;
  code: string;
  official_name: string;
  legacy_name?: string;
  exam_label?: string;
}

export interface StudyOption {
  id: number;
  code: string;
  name: string;
  category: string;
}

export interface SchoolClassItem {
  id: string;
  name: string;
  display_name: string;
  level: string;
  section: string;
  academic_year: string;
  capacity: number;
  teacher_id?: number | null;
  grade_level_id: number;
  study_option_id?: number | null;
  students_count?: number;
  grade_level?: {
    id: number;
    code: string;
    official_name: string;
    education_cycle?: { id: number; code: string; name: string };
  };
  study_option?: { id: number; code: string; name: string } | null;
  teacher?: { id: number; first_name: string; last_name: string } | null;
}

export interface ClassFormData {
  id?: string;
  grade_level_id: string;
  study_option_id: string;
  section: string;
  academic_year: string;
  capacity: number;
  teacher_id: string;
}
