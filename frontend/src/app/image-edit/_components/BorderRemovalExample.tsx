import NextImage from 'next/image';
import beforeImage from '../../../../public/images/autocropper/before.jpg';
import afterImage from '../../../../public/images/autocropper/after.jpg';

// after.jpg is AutoCropper's own output for before.jpg (a synthetic story
// screenshot), so the example shows what the tool really does, not a mock-up.
export default function BorderRemovalExample() {
  return (
    <section className='flex w-full max-w-2xl flex-col items-center gap-4'>
      <h2 className='text-lg font-medium'>Example</h2>
      <div className='flex flex-wrap items-center justify-center gap-6'>
        <figure className='flex flex-col items-center gap-2'>
          <NextImage
            src={beforeImage}
            alt='Story screenshot: a lakeside photo with a caption on a blue-to-grey gradient background'
            className='h-72 w-auto rounded'
          />
          <figcaption className='text-sm text-muted-foreground'>
            Before
          </figcaption>
        </figure>
        <figure className='flex flex-col items-center gap-2'>
          <NextImage
            src={afterImage}
            alt='The same lakeside photo with the gradient background and caption cropped away'
            // Same scale as the before image (511/960 of h-72), so the
            // removed border reads as removed rather than resized.
            className='h-[153px] w-auto rounded'
          />
          <figcaption className='text-sm text-muted-foreground'>
            After
          </figcaption>
        </figure>
      </div>
      <p className='text-center text-sm text-muted-foreground'>
        AutoCropper trims the plain or gradient border around a picture. It does
        not detect subjects, so it works best when the picture sits on an even
        background.
      </p>
    </section>
  );
}
