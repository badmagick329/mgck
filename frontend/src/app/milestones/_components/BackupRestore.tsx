'use client';
import { MilestonesButton } from '@/components/ui/MilestonesButton';
import useMilestones from '@/hooks/milestones/useMilestones';
import useOperationToast from '@/hooks/milestones/useOperationToast';
import { milestonesBackupSchema } from '@/lib/types/milestones';
import { useRef } from 'react';

type Props = {
  store: ReturnType<typeof useMilestones>['store'];
};

export default function BackupRestore({ store }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useOperationToast();

  const downloadBackup = () => {
    const rawData = Object.fromEntries(
      Object.keys(milestonesBackupSchema.shape).map((key) => [
        key,
        JSON.parse(localStorage.getItem(key) || ''),
      ])
    );

    const parsed = milestonesBackupSchema.safeParse(rawData);
    if (parsed.error) {
      toast.showError(
        'Error creating backup',
        'Could not create a valid backup file.'
      );
      return;
    }
    const data = parsed.data;

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `milestones-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        const parsed = milestonesBackupSchema.safeParse(raw);
        if (parsed.error) {
          toast.showError(
            'Error restoring backup',
            'The selected file is not a valid backup.'
          );
          return;
        }
        const data = parsed.data;
        store.setMilestones(data.milestones);
        store.setDiffPeriod(data.milestonesConfig.diffPeriod);
        store.setServerLinked(data.milestonesConfig.milestonesOnServer);
        store.setHiddenMilestones(data.hiddenMilestones);
      } catch (err) {
        toast.showError(
          'Error restoring backup',
          'An error occurred while reading the backup file.'
        );
        return;
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className='mx-auto flex w-full max-w-6xl justify-end gap-4 p-2 sm:px-4'>
      <MilestonesButton variant='outline' onClick={downloadBackup}>
        Backup
      </MilestonesButton>
      <MilestonesButton
        variant='outline'
        onClick={() => {
          inputRef.current?.click();
          if (inputRef.current) {
            inputRef.current.value = '';
          }
        }}
      >
        Restore
      </MilestonesButton>
      <input
        ref={inputRef}
        type='file'
        accept='.json'
        onChange={handleFileSelect}
        className='hidden'
      ></input>
    </div>
  );
}
