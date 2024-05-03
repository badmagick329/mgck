import { fetchComebacks } from '@/actions/kpop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ComebackResponse, ComebacksResult } from '@/lib/types';
import { useState } from 'react';

type ComebacksFormProps = {
  setComebacksResult: React.Dispatch<
    React.SetStateAction<ComebacksResult | null>
  >;
  setComebacks: React.Dispatch<React.SetStateAction<ComebackResponse[]>>;
};

export default function ComebacksForm({
  setComebacksResult,
  setComebacks,
}: ComebacksFormProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  async function handleSubmit(formData: FormData) {
    console.log('formData', formData);
    const comebacksResult = await fetchComebacks(formData);
    setComebacksResult(comebacksResult);
    setComebacks(comebacksResult.results);
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        console.log('e', e);
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('artist', artist.trim());
        formData.append('start_date', startDate.trim());
        formData.append('end_date', endDate.trim());
        handleSubmit(formData);
      }}
      className='grid grid-cols-1 gap-4 md:grid-cols-2'
    >
      <Input
        name='title'
        placeholder='Title'
        autoComplete='off'
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        name='artist'
        placeholder='Artist'
        autoComplete='off'
        onChange={(e) => setArtist(e.target.value)}
      />
      <Input
        name='state-date'
        placeholder='Start Date (YYYY-MM-DD)'
        autoComplete='off'
        onChange={(e) => setStartDate(e.target.value)}
      />
      <Input
        name='end-date'
        placeholder='End Date (YYYY-MM-DD)'
        autoComplete='off'
        onChange={(e) => setEndDate(e.target.value)}
      />
      <Button type='submit'>Search</Button>
    </form>
  );
}
