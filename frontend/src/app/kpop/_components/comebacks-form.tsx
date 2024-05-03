import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/use-debounce';
import useURLState from '@/hooks/use-url-state';
import { searchParamsToFormData } from '@/lib/utils';

export default function ComebacksForm() {
  const formKeys = ['title', 'artist', 'start-date', 'end-date', 'exact'];
  const { searchParams, formDataToURLState } = useURLState({ formKeys });
  const debounce = useDebounce(300);
  const defaultFormData = searchParamsToFormData(searchParams);

  return (
    <form
      className='grid grid-cols-1 gap-4 md:grid-cols-2'
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <Input
        name='start-date'
        placeholder='Start Date (YYYY-MM-DD)'
        autoComplete='off'
        defaultValue={defaultFormData.get('start-date')?.toString() || ''}
        onChange={(e) => {
          const form = e.currentTarget.form;
          const formData = new FormData(form || undefined);
          debounce(() => formDataToURLState(formData));
        }}
      />
      <Input
        name='end-date'
        placeholder='End Date (YYYY-MM-DD)'
        autoComplete='off'
        defaultValue={defaultFormData.get('end-date')?.toString() || ''}
        onChange={(e) => {
          const form = e.currentTarget.form;
          const formData = new FormData(form || undefined);
          debounce(() => formDataToURLState(formData));
        }}
      />
      <Input
        name='artist'
        placeholder='Artist'
        autoComplete='off'
        defaultValue={defaultFormData.get('artist')?.toString() || ''}
        onChange={(e) => {
          const form = e.currentTarget.form;
          const formData = new FormData(form || undefined);
          debounce(() => formDataToURLState(formData));
        }}
      />
      <Input
        name='title'
        placeholder='Title'
        autoComplete='off'
        defaultValue={defaultFormData.get('title')?.toString() || ''}
        onChange={(e) => {
          const form = e.currentTarget.form;
          const formData = new FormData(form || undefined);
          debounce(() => formDataToURLState(formData));
        }}
      />
      <div className='flex items-center'>
        <Input
          type='checkbox'
          name='exact'
          className='h-5 w-5'
          defaultChecked={defaultFormData.get('exact') === 'on'}
          onChange={(e) => {
            const form = e.currentTarget.form;
            if (!form) {
              return;
            }
            const formData = new FormData(form || undefined);
            if (e.currentTarget.checked) {
              formData.set('exact', 'on');
            } else {
              formData.set('exact', '');
            }
            debounce(() => formDataToURLState(formData));
          }}
        />
        <label className='ml-2'>Exact Artist Match</label>
      </div>
    </form>
  );
}
