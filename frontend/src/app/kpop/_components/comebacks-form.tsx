import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/use-debounce';
import useURLState from '@/hooks/use-url-state';

export default function ComebacksForm() {
  const formDefaults = [
    { param: 'title', defaultValue: '' },
    { param: 'artist', defaultValue: '' },
    { param: 'start-date', defaultValue: '' },
    { param: 'end-date', defaultValue: '' },
  ];
  const { formToURLState } = useURLState({ formDefaults });
  const debounce = useDebounce(300);

  return (
    <form
      className='grid grid-cols-1 gap-4 md:grid-cols-2'
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <Input
        name='title'
        placeholder='Title'
        autoComplete='off'
        onChange={(e) => {
          const form = e.currentTarget.form;
          debounce(() => formToURLState(form));
        }}
      />
      <Input
        name='artist'
        placeholder='Artist'
        autoComplete='off'
        onChange={(e) => {
          const form = e.currentTarget.form;
          debounce(() => formToURLState(form));
        }}
      />
      <Input
        name='start-date'
        placeholder='Start Date (YYYY-MM-DD)'
        autoComplete='off'
        onChange={(e) => {
          const form = e.currentTarget.form;
          debounce(() => formToURLState(form));
        }}
      />
      <Input
        name='end-date'
        placeholder='End Date (YYYY-MM-DD)'
        autoComplete='off'
        onChange={(e) => {
          const form = e.currentTarget.form;
          debounce(() => formToURLState(form));
        }}
      />
    </form>
  );
}
