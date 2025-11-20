'use client';
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
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'motion/react';
import { IoIosCloseCircle } from 'react-icons/io';
import useLogin from '@/hooks/account/useLogin';

export default function Login() {
  const {
    isRegistering,
    handleSubmit,
    form,
    handleShowPassword,
    passwordType,
    ShowPasswordIcon,
    isSubmitDisabled,
    errorResponse,
    resetForm,
    resetErrors,
  } = useLogin();

  const headerText = isRegistering ? 'Register' : 'Login';
  const descriptionText = isRegistering
    ? 'Register for an account'
    : 'Login to your account';

  return (
    <article className='grow py-4'>
      <Card className='min-w-[360px] border-foreground/40 bg-secondary/60'>
        <Form {...form}>
          <form className='grid grid-cols-1 gap-4' onSubmit={handleSubmit}>
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
                          type={passwordType}
                          autoComplete={'off'}
                          placeholder='Password'
                          {...field}
                        />
                        <button
                          type='button'
                          onClick={handleShowPassword}
                          className='absolute inset-y-0 right-0 flex items-center pr-3'
                          tabIndex={-1}
                        >
                          <ShowPasswordIcon />
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
                                type={passwordType}
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
                <Button
                  color='zinc-950'
                  type='submit'
                  disabled={isSubmitDisabled}
                >
                  {isRegistering ? 'Register' : 'Login'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isSubmitDisabled}
                  onClick={resetForm}
                >
                  {isRegistering ? 'Back to Login' : 'Sign Up'}
                </Button>
              </div>
              <ErrorMessages
                errorResponse={errorResponse}
                resetErrorResponse={resetErrors}
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
