import { zodResolver } from '@hookform/resolvers/zod';
import { ACCOUNT_USER_HOME } from '@/lib/consts/urls';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import { useAccount } from '@/hooks/useAccount';
import { useRouter } from 'next/navigation';
import { IoIosEye, IoIosEyeOff } from 'react-icons/io';

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

export default function useLogin() {
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

  return {
    isRegistering,
    handleSubmit: () => form.handleSubmit(onSubmit),
    form,
    handleShowPassword: () => setShowPassword(!showPassword),
    passwordType: showPassword ? 'text' : 'password',
    ShowPasswordIcon: () =>
      showPassword ? <IoIosEyeOff size={20} /> : <IoIosEye size={20} />,
    isSubmitDisabled: isSubmitting,
    errorResponse,
    resetForm: () => {
      form.reset({
        username: '',
        password: '',
        password2: '',
      });
      setIsRegistering(!isRegistering);
      setErrorResponse([]);
    },
    resetErrors: () => setErrorResponse([]),
  };
}
