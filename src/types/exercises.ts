import { ComponentType } from "react";

export interface Exercise {
    title: string;
    component: ComponentType;
    week: number;
    day: number;
    description?: string;
}

export type ExerciseKey = string;

export interface ExercisesRegistry {
    [key: ExerciseKey]: Exercise;
}
