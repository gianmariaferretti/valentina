"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { LocalProgressRepository } from "@/lib/persistence/local-progress-repository";
import { EMPTY_PROGRESS, type ExperienceProgress } from "@/types/progress";

export function usePersistentProgress() {
  const repository = useMemo(() => new LocalProgressRepository(), []);
  const [progress, setProgress] = useState<ExperienceProgress>(EMPTY_PROGRESS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    void repository.get().then((savedProgress) => {
      setProgress(savedProgress);
      setIsHydrated(true);
    });
  }, [repository]);

  const updateProgress = useCallback(
    async (nextProgress: ExperienceProgress) => {
      setProgress(nextProgress);
      await repository.save(nextProgress);
    },
    [repository],
  );

  return { isHydrated, progress, updateProgress };
}
