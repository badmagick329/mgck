export default function ComebackCardAlbum({ album }: { album: string }) {
  return (
    <span className='text-xs font-bold text-gray-600 dark:text-gray-400'>
      {album}
    </span>
  );
}
