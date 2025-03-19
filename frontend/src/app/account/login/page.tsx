'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useRouter } from 'next/navigation';
import { ACCOUNT_USER_HOME } from '@/lib/consts/urls';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'motion/react';
import { IoIosCloseCircle, IoIosEye, IoIosEyeOff } from 'react-icons/io';

const FormSchema = z
  .object({
    username: z.string().min(3, {
      message: 'Username must be at least 3 characters.',
    }),
    password: z.string().min(8, {
      message: 'Password must be at least 8 characters.',
    }),
    password2: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password2 && data.password2 !== data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords don't match",
        path: ['password2'],
      });
    }
  });

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { loginUser, registerUser, errorResponse, setErrorResponse } =
    useAccount();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      password: '',
      password2: '',
    },
    mode: 'onSubmit',
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);
    try {
      console.log('Form submitted successfully with:', data);

      const { username, password } = data;

      if (isRegistering) {
        const registered = await registerUser({ username, password });

        if (!registered) {
          return;
        }

        const loggedIn = await loginUser({ username, password });
        if (loggedIn) {
          router.push(ACCOUNT_USER_HOME);
        }
        return;
      }

      const loggedIn = await loginUser({ username, password });
      if (loggedIn) {
        router.push(ACCOUNT_USER_HOME);
      }
    } finally {
      setIsSubmitting(false);
    }
  }
  const headerText = isRegistering ? 'Register' : 'Login';
  const descriptionText = isRegistering
    ? 'Register for an account'
    : 'Login to your account';

  return (
    <article className='grow py-4'>
      <Card className='min-w-[360px] border-foreground/40 bg-secondary/60'>
        <Form {...form}>
          <form
            className='grid grid-cols-1 gap-4'
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <CardHeader>
              <CardTitle>{headerText}</CardTitle>
              <CardDescription>{descriptionText}</CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-2'>
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete={'off'}
                        placeholder='Username'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete={'off'}
                          placeholder='Password'
                          {...field}
                        />
                        <button
                          type='button'
                          onClick={() => setShowPassword(!showPassword)}
                          className='absolute inset-y-0 right-0 flex items-center pr-3'
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <IoIosEyeOff size={20} />
                          ) : (
                            <IoIosEye size={20} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='min-h-[75px]'>
                <AnimatePresence>
                  {isRegistering && (
                    <motion.div
                      key='password2'
                      initial={{ opacity: 0, y: -40 }}
                      animate={{
                        opacity: isRegistering ? 1 : 0,
                        y: isRegistering ? 0 : -40,
                      }}
                      exit={{ opacity: 0, y: -40 }}
                      transition={{
                        opacity: { duration: 0.1, ease: 'easeOut' },
                        y: {
                          type: 'spring',
                          stiffness: 400,
                          damping: 15,
                          duration: 0.2,
                        },
                      }}
                    >
                      <FormField
                        control={form.control}
                        name='password2'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                autoComplete={'off'}
                                placeholder='Confirm Password'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
            <CardFooter className='grid grid-cols-1 gap-2'>
              <div className='flex justify-between'>
                <Button color='zinc-950' type='submit' disabled={isSubmitting}>
                  {isRegistering ? 'Register' : 'Login'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isSubmitting}
                  onClick={() => {
                    form.reset({
                      username: '',
                      password: '',
                      password2: '',
                    });
                    setIsRegistering(!isRegistering);
                    setErrorResponse([]);
                  }}
                >
                  {isRegistering ? 'Back to Login' : 'Sign Up'}
                </Button>
              </div>
              <ErrorMessages
                errorResponse={errorResponse}
                resetErrorResponse={() => setErrorResponse([])}
              />
            </CardFooter>
          </form>
        </Form>
      </Card>
    </article>
  );
}

function ErrorMessages({
  errorResponse,
  resetErrorResponse,
}: {
  errorResponse: string[];
  resetErrorResponse: () => void;
}) {
  if (errorResponse.length === 0) {
    return null;
  }

  return (
    <motion.div
      className='relative rounded-sm bg-red-100 px-4 py-2'
      key='errors'
      initial={{ opacity: 0, y: 40 }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        opacity: { duration: 0.1, ease: 'easeOut' },
        y: {
          type: 'spring',
          stiffness: 400,
          damping: 15,
          duration: 0.2,
        },
      }}
    >
      <button
        className='absolute right-1 top-1 flex items-center justify-center rounded-full text-black/50 hover:text-black/80'
        onClick={resetErrorResponse}
      >
        <IoIosCloseCircle />
      </button>

      <ul className='mt-1'>
        {errorResponse.map((err) => (
          <li key={err} className='text-red-700'>
            {err}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
