'use client';
import { motion as m } from 'motion/react';
import { useEffect, useState } from 'react';

export default function OutputPlaceholder() {
  const [color, setColor] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setColor((prev) => (prev + 5) % 360);
    }, 80);

    return () => clearInterval(interval);
  }, []);
  return (
    <m.svg
      className='fill-current text-foreground/60'
      version='1.1'
      id='Capa_1'
      xmlns='http://www.w3.org/2000/svg'
      xmlnsXlink='http://www.w3.org/1999/xlink'
      viewBox='0 0 264.411 264.411'
      xmlSpace='preserve'
      initial={{
        scale: 2.8,
      }}
      animate={{
        scale: 1,
      }}
      transition={{
        scale: { type: 'spring', stiffness: 500, damping: 15 },
        duration: 4,
      }}
      width='40px'
      height='40px'
    >
      <m.g id='Reproducir'>
        <path
          d='M262.267,42.077c-1.359-1.14-3.148-1.62-4.901-1.311l-0.26,0.046c-15.948,2.841-32.325,2.842-48.289-0.001l-0.254-0.045
		c-1.75-0.308-3.542,0.171-4.901,1.311c-1.359,1.141-2.145,2.823-2.145,4.598v10.527H62.896V46.675c0-1.773-0.784-3.456-2.144-4.596
		c-1.358-1.141-3.152-1.619-4.898-1.313l-0.265,0.047c-15.95,2.84-32.324,2.842-48.292-0.002l-0.255-0.045
		c-1.746-0.306-3.539,0.173-4.898,1.313C0.784,43.219,0,44.901,0,46.675v171.062c0,1.714,0.732,3.346,2.014,4.484
		c1.279,1.138,2.985,1.672,4.688,1.475l8.684-1.023c10.639-1.254,21.486-1.254,32.125,0l8.683,1.023
		c0.234,0.027,0.469,0.041,0.702,0.041c1.462,0,2.883-0.534,3.986-1.516c1.281-1.139,2.014-2.771,2.014-4.484v-15.53h138.621v15.53
		c0,1.714,0.732,3.346,2.014,4.484c1.28,1.138,2.984,1.672,4.688,1.475l8.683-1.023c10.639-1.254,21.486-1.254,32.125,0l8.683,1.023
		c0.234,0.027,0.469,0.041,0.702,0.041c1.462,0,2.883-0.534,3.986-1.516c1.281-1.139,2.014-2.771,2.014-4.484V46.675
		C264.411,44.9,263.626,43.218,262.267,42.077z M50.896,210.987l-1.98-0.233c-11.566-1.363-23.367-1.363-34.934,0L12,210.987V53.677
		c12.924,1.696,25.979,1.694,38.896,0.001v9.524v133.004V210.987z M62.896,190.206V69.202h138.621v121.004H62.896z M252.411,210.987
		l-1.98-0.233c-11.566-1.363-23.367-1.363-34.934,0l-1.98,0.233v-14.781V63.202v-9.525c12.926,1.695,25.979,1.694,38.895,0.001
		V210.987z'
        />
        <rect x='22.457' y='69.725' width='18' height='10.48' />
        <rect x='22.457' y='93.2' width='18' height='10.48' />
        <rect x='22.457' y='116.674' width='18' height='10.48' />
        <rect x='22.457' y='140.149' width='18' height='10.48' />
        <rect x='22.457' y='163.624' width='18' height='10.48' />
        <rect x='22.457' y='187.098' width='18' height='10.48' />
        <rect x='223.964' y='69.725' width='18' height='10.48' />
        <rect x='223.964' y='93.2' width='18' height='10.48' />
        <rect x='223.964' y='116.674' width='18' height='10.48' />
        <rect x='223.964' y='140.149' width='18' height='10.48' />
        <rect x='223.964' y='163.624' width='18' height='10.48' />
        <rect x='223.964' y='187.098' width='18' height='10.48' />
        <path
          fill={`hsl(${color} 60% 50%)`}
          d='M157.242,122.927l-34.62-22.944C117.218,96.4,110,100.276,110,106.76v45.889c0,6.484,7.218,10.359,12.622,6.777
		l34.62-22.944C162.094,133.266,162.094,126.142,157.242,122.927z'
        />
      </m.g>
    </m.svg>
  );
}
