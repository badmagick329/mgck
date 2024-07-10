'use client';

import { useCallback, useEffect, useState } from 'react';

const MAX_VALUE = 5;
const MIN_VALUE = 1;

type Choice = {
  name: string;
  criteriaValues: Record<string, number>;
};

export default function useChoicesState() {
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [choices, setChoices] = useState<Choice[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    calculatedResults();
  }, [weights, choices]);

  const setCriterion = useCallback(
    (criterion: string, weight?: number) => {
      setWeights({
        ...weights,
        [criterion]: weight === undefined ? 100 : weight,
      });
      const newChoices = [];
      for (const choice of choices) {
        const newCriteria = {
          ...choice.criteriaValues,
          [criterion]: getCriterionValue(choice.name, criterion) || 1,
        };
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

  const getCriterionValue = useCallback(
    (choice: string, criterion: string) => {
      for (const c of choices) {
        if (c.name !== choice) {
          continue;
        }
        for (const [crit, val] of Object.entries(c.criteriaValues)) {
          if (crit === criterion) {
            return val;
          }
        }
      }
      return null;
    },
    [choices, weights]
  );

  const setValue = useCallback(
    (criterion: string, choice: string, value: number) => {
      const newChoices = structuredClone(choices);
      for (const c of newChoices) {
        if (c.name === choice) {
          c.criteriaValues[criterion] = value;
          setChoices(newChoices);
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
      const newChoices = [
        ...choices,
        { name: choice, criteriaValues: defaultCriteria },
      ];
      setChoices(newChoices);
    },
    [choices]
  );

  const removeChoice = useCallback(
    (choice: string) => {
      setChoices(choices.filter((c) => c.name !== choice));
    },
    [choices]
  );

  const calculatedResults = useCallback(() => {
    const results: Result[] = [];
    if (!choices || !weights) {
      return;
    }

    choices.map((choice) => {
      const normalisedValues = normalise(
        Object.values(choice.criteriaValues),
        MIN_VALUE,
        MAX_VALUE
      );
      const criteria = Object.keys(choice.criteriaValues);

      let score = 0;
      for (let i = 0; i < criteria.length; i++) {
        score += normalisedValues[i] * (getWeight(criteria[i]) / 100) * 100;
      }
      score = score / criteria.length;

      results.push({
        choice: choice.name,
        score,
      });
    });

    results.sort((a, b) => b.score - a.score);
    setResults(results);
    return results;
  }, [choices, weights]);

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
    getCriterionValue,
    results,
    MAX_VALUE,
    MIN_VALUE,
  };
}

function normaliseValue(v: number, minVal: number, maxVal: number): number {
  return (v - minVal) / (maxVal - minVal);
}

function normalise(values: number[], minVal: number, maxVal: number): number[] {
  return values.map((v) => (v - minVal) / (maxVal - minVal));
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
export type GetCriterionValue = (
  choice: string,
  criterion: string
) => number | null;
export type Result = {
  score: number;
  choice: string;
};
