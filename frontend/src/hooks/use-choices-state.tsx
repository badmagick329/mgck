'use client';

import { useCallback, useState } from 'react';

type Choice = {
  name: string;
  criteriaValues: Record<string, number>;
};

export default function useChoicesState() {
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [choices, setChoices] = useState<Choice[]>([]);

  const setCriterion = useCallback(
    (criterion: string, weight?: number) => {
      setWeights({
        ...weights,
        [criterion]: weight === undefined ? 50 : weight,
      });
      const newChoices = [];
      for (const choice of choices) {
        const newCriteria = { ...choice.criteriaValues, [criterion]: 1 };
        newChoices.push({ ...choice, criteriaValues: newCriteria });
      }
      setChoices(newChoices);
    },
    [weights, choices]
  );

  const getWeight = useCallback(
    (criterion: string) => weights[criterion],
    [weights]
  );

  const getCriteria = useCallback(
    () => Object.entries(weights).map((entry) => entry[0]),
    [weights]
  );

  const removeCriterion = useCallback(
    (criterion: string) => {
      const newWeights = { ...weights };
      delete newWeights[criterion];
      setWeights(newWeights);
      const newChoices = [];
      for (const choice of choices) {
        const newCriteria = { ...choice.criteriaValues };
        delete newCriteria[criterion];
        newChoices.push({ ...choice, criteria: newCriteria });
      }
      setChoices(newChoices);
    },
    [weights, choices]
  );

  const getChoices = useCallback(() => choices.map((c) => c.name), [choices]);

  const getCriteriaValues = useCallback(
    (choice: string) => {
      for (const c of choices) {
        if (c.name === choice) {
          return c.criteriaValues;
        }
      }
      return {};
    },
    [choices]
  );

  const setValue = useCallback(
    (criterion: string, choice: string, value: number) => {
      for (const c of choices) {
        if (c.name === choice) {
          c.criteriaValues[criterion] = value;
          return;
        }
      }
    },
    [choices]
  );

  const addChoice = useCallback(
    (choice: string) => {
      const defaultCriteria: Record<string, number> = {};
      for (const criterion of getCriteria()) {
        defaultCriteria[criterion] = 1;
      }
      setChoices([
        ...choices,
        { name: choice, criteriaValues: defaultCriteria },
      ]);
    },
    [choices]
  );

  const removeChoice = useCallback(
    (choice: string) => {
      setChoices(choices.filter((c) => c.name !== choice));
    },
    [choices]
  );

  return {
    setCriterion,
    getWeight,
    getCriteria,
    removeCriterion,
    getChoices,
    setValue,
    addChoice,
    removeChoice,
    getCriteriaValues,
  };
}

export type SetCriterion = (criterion: string, weight?: number) => void;
export type GetWeight = (criterion: string) => number;
export type GetCriteria = () => string[];
export type RemoveCriterion = (criterion: string) => void;
export type GetChoices = () => string[];
export type SetValue = (
  criterion: string,
  choice: string,
  value: number
) => void;
export type AddChoice = (choice: string) => void;
export type RemoveChoice = (choice: string) => void;
export type GetCriteriaValues = (choice: string) => Record<string, number>;
